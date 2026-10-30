import deskWood from "@/assets/desk-wood.jpg";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  DAILY_ID,
  addList,
  attachNewPage,
  linkTask,
  addTask,
  createInitialState,
  deleteList,
  deleteTask,
  ensureShoppingList,
  SHOPPING_ID,
  loadState,
  neighbourAfterDelete,
  saveState,
  toggleList,
  toggleTask,
  uid,
  type NotebookState,
  type TodoList,
} from "@/lib/notebook";
import { Page } from "./Page";
import { SpiralRings } from "./Spiral";
import { TearLayer } from "./TearLayer";
import { CompleteLayer } from "./CompleteLayer";
import { ListMenu } from "./ListMenu";
import { cn } from "@/lib/utils";

type Anim =
  | { mode: "flip-up" | "flip-down"; snapshot: TodoList | null; key: number }
  | { mode: "tear" | "complete"; snapshot: TodoList; key: number };

const PROGRESS_KEY = "notebook-show-progress";

export function Notebook() {
  const [state, setState] = useState<NotebookState>(createInitialState);
  const [hydrated, setHydrated] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(DAILY_ID);
  const [anim, setAnim] = useState<Anim | null>(null);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProgress, setShowProgress] = useState(true);
  const animKey = useRef(0);

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setState(saved);
      setCurrentId(saved.lists[0]?.id ?? null);
    }
    setShowProgress(localStorage.getItem(PROGRESS_KEY) !== "off");
    setHydrated(true);
  }, []);

  const toggleProgress = () =>
    setShowProgress((v) => {
      localStorage.setItem(PROGRESS_KEY, v ? "off" : "on");
      return !v;
    });

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  const lists = state.lists;
  const current = lists.find((l) => l.id === currentId) ?? null;
  const pageNumber = (l: TodoList | null) => (l ? lists.findIndex((x) => x.id === l.id) + 1 || 1 : 1);
  const linkTitles = useMemo(() => Object.fromEntries(lists.map((l) => [l.id, l.title])), [lists]);
  const linkItems = useMemo(
    () => Object.fromEntries(lists.map((l) => [l.id, l.tasks.filter((t) => !t.done).map((t) => t.text)])),
    [lists],
  );
  const parentOf = (l: TodoList | null) =>
    l ? (lists.find((p) => p.tasks.some((t) => t.linkTo === l.id)) ?? null) : null;

  const goTo = (id: string, dir: "forward" | "back" = "forward") => {
    setMenuOpen(false);
    if (id === currentId || anim) return;
    animKey.current += 1;
    setAnim({ mode: dir === "forward" ? "flip-up" : "flip-down", snapshot: current, key: animKey.current });
    setCurrentId(id);
  };

  const createList = (title: string) => {
    if (!title.trim()) return;
    const id = uid();
    setState((s) => addList(s, title, id));
    animKey.current += 1;
    setAnim({ mode: "flip-up", snapshot: current, key: animKey.current });
    setCurrentId(id);
    setMenuOpen(false);
  };

  const removeList = (id: string) => {
    if (deletingIds.includes(id)) return;
    setDeletingIds((d) => [...d, id]);
    if (id === currentId) {
      const deleted = lists.find((l) => l.id === id)!;
      animKey.current += 1;
      setAnim({ mode: "tear", snapshot: deleted, key: animKey.current });
      setCurrentId(neighbourAfterDelete(lists, id));
    }
    window.setTimeout(() => {
      setState((s) => deleteList(s, id));
      setDeletingIds((d) => d.filter((x) => x !== id));
    }, 520);
  };

  const endAnim = useCallback(() => setAnim(null), []);

  const pageProps = (l: TodoList | null) => ({
    list: l,
    pageNumber: pageNumber(l),
    parent: parentOf(l),
    linkTitles,
    linkItems,
    showProgress,
  });

  const handlers = current
    ? {
        onToggleList: () => {
          if (!current.done && !anim) {
            // Finishing: the page scrunches into a ball and is thrown in the bin, then "Well done!".
            animKey.current += 1;
            setAnim({ mode: "complete", snapshot: { ...current, done: true }, key: animKey.current });
          }
          setState((s) => toggleList(s, current.id));
        },
        onDeleteList: () => removeList(current.id),
        onAddTask: (text: string) => setState((s) => addTask(s, current.id, text)),
        onToggleTask: (tid: string) => {
          const wasDone = current.tasks.find((t) => t.id === tid)?.done ?? true;
          setState((s) => toggleTask(s, current.id, tid));
          if (!wasDone) {
            const list = current.id === DAILY_ID ? "daily" : current.id === SHOPPING_ID ? "shopping" : "other";
            window.__lovableEvents?.track?.("project.task_completed", { list });
          }
        },
        onDeleteTask: (tid: string) => setState((s) => deleteTask(s, current.id, tid)),
        onFlipTo: (id: string) => goTo(id, "forward"),
        onOpenShopping: () => {
          setState((s) => ensureShoppingList(s));
          goTo(SHOPPING_ID, "forward");
        },
        onFlipBack: (id: string) => goTo(id, "back"),
        onCreateList: createList,
        onAttachPage: (tid: string, target: string | "new" | null) => {
          if (target === "new") {
            const id = uid();
            setState((s) => attachNewPage(s, current.id, tid, id));
            goTo(id, "forward");
          } else {
            setState((s) => linkTask(s, current.id, tid, target ?? undefined));
          }
        },
        onOpenMenu: () => setMenuOpen(true),
      }
    : { onCreateList: createList, onOpenMenu: () => setMenuOpen(true) };

  const livePage = (extra?: { className?: string; onAnimationEnd?: () => void }) => (
    <Page key={`live-${current?.id ?? "empty"}`} {...pageProps(current)} {...handlers} {...extra} />
  );

  let pages;
  if (!anim) {
    pages = livePage();
  } else if (anim.mode === "flip-up") {
    pages = (
      <>
        {livePage()}
        <div aria-hidden className="animate-flip-shadow pointer-events-none absolute inset-0 z-10 rounded-md" />
        <FlipCard key={`flip-${anim.key}`} direction="up" onDone={endAnim}>
          <Page {...pageProps(anim.snapshot)} interactive={false} />
        </FlipCard>
      </>
    );
  } else if (anim.mode === "flip-down") {
    pages = (
      <>
        <Page key={`under-${anim.key}`} {...pageProps(anim.snapshot)} interactive={false} />
        <div aria-hidden className="animate-flip-shadow-in pointer-events-none absolute inset-0 z-10 rounded-md" />
        <FlipCard key={`flip-${anim.key}`} direction="down" onDone={endAnim}>
          {livePage()}
        </FlipCard>
      </>
    );
  } else {
    pages = (
      <>
        {livePage()}
        {anim.mode === "tear" ? (
          <TearLayer key={`tear-${anim.key}`} onDone={endAnim}>
            <Page {...pageProps(anim.snapshot)} interactive={false} />
          </TearLayer>
        ) : (
          <CompleteLayer key={`complete-${anim.key}`} onDone={endAnim}>
            <Page {...pageProps(anim.snapshot)} interactive={false} />
          </CompleteLayer>
        )}
      </>
    );
  }

  const menu = (onClose?: () => void) => (
    <ListMenu
      lists={lists}
      currentId={currentId}
      deletingIds={deletingIds}
      onSelect={(id) => goTo(id)}
      onToggle={(id) => setState((s) => toggleList(s, id))}
      onDelete={removeList}
      onCreate={createList}
      onClose={onClose}
      showProgress={showProgress}
      onToggleProgress={toggleProgress}
    />
  );

  return (
    <div style={{ backgroundImage: `radial-gradient(ellipse at center, transparent 45%, oklch(0.15 0.03 50 / 0.45)), url(${deskWood})`, backgroundSize: "cover", backgroundPosition: "center" }} className="flex h-dvh flex-col items-center p-2 pt-6 sm:p-3 sm:pt-7 lg:py-8 lg:pt-10">
      <main className="relative h-full w-full max-w-3xl">
        <div className="page-stack relative h-full rounded-md [perspective:1800px]">
          {pages}
          {/* menu page inside the notebook */}
          <div
            className={cn(
              "absolute inset-0 z-30 origin-top transition-all duration-500",
              menuOpen ? "opacity-100 [transform:rotateX(0deg)]" : "pointer-events-none opacity-0 [transform:rotateX(-60deg)]",
            )}
          >
            {menu(() => setMenuOpen(false))}
          </div>
        </div>
        <SpiralRings />
      </main>
    </div>
  );
}

/** A page turning over the top spiral: front is the page, back is the blank reverse side. */
function FlipCard({
  direction,
  onDone,
  children,
}: {
  direction: "up" | "down";
  onDone: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-20 [transform-style:preserve-3d]",
        direction === "up" ? "animate-flip-up" : "animate-flip-down",
      )}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) onDone();
      }}
    >
      <div className="absolute inset-0 [backface-visibility:hidden]">
        {children}
        <div aria-hidden className="animate-flip-light pointer-events-none absolute inset-0" />
      </div>
      <div
        aria-hidden
        className={cn(
          "paper-back absolute inset-0 rounded-md [backface-visibility:hidden] [transform:rotateX(180deg)]",
          direction === "up" ? "animate-back-out" : "animate-back-in",
        )}
      />
    </div>
  );
}
