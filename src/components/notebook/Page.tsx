import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, FilePlus, Menu, Paperclip, Plus, Trash2, Unlink, X } from "lucide-react";
import { DAILY_ID, DAILY_SHOP_TASK_ID, type TodoList } from "@/lib/notebook";
import { SpiralHoles } from "./Spiral";
import { cn } from "@/lib/utils";

type Handlers = {
  onToggleList: () => void;
  onDeleteList: () => void;
  onAddTask: (text: string) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onFlipTo: (listId: string) => void;
  onOpenShopping: () => void;
  onFlipBack: (listId: string) => void;
  onCreateList: (title: string) => void;
  onOpenMenu: () => void;
  /** Attach a page to a task: an existing page id, "new" for a fresh page, or null to detach. */
  onAttachPage: (taskId: string, target: string | "new" | null) => void;
};

type Props = {
  list: TodoList | null;
  pageNumber: number;
  parent?: TodoList | null;
  linkTitles: Record<string, string>;
  /** Unfinished items of each list, used to preview a linked page's contents. */
  linkItems?: Record<string, string[]>;
  interactive?: boolean;
  className?: string;
  /** Show the progress bar along the side of the page (a user setting). */
  showProgress?: boolean;
  onAnimationEnd?: () => void;
} & Partial<Handlers>;

/** Hand-drawn progress circle that fills with green as tasks are ticked off. */
function ProgressRing({ label, done, total, percent }: { label: string; done: number; total: number; percent: number }) {
  const complete = percent === 100;
  const r = 24;
  const c = 2 * Math.PI * r;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-valuetext={`${done} of ${total} done`}
      className="relative h-11 w-11 shrink-0 sm:h-16 sm:w-16"
      title={label}
    >
      <svg viewBox="0 0 60 60" className="h-full w-full -rotate-90">
        <circle cx="30" cy="30" r={r} fill="none" stroke="var(--ink)" strokeWidth="2" opacity="0.25" />
        <circle
          cx="30"
          cy="30"
          r={r}
          fill="none"
          stroke="var(--done)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - percent / 100)}
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.3, 1.3, 0.5, 1)" }}
        />
      </svg>
      <span className={cn("absolute inset-0 flex items-center justify-center text-xs sm:text-base", complete ? "font-bold text-done" : "text-ink")}>
        {complete ? "★" : `${done}/${total}`}
      </span>
    </div>
  );
}

export function HandCheckbox({ checked }: { checked: boolean }) {
  return (
    <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] border-2 border-ink/70">
      {checked && (
        <svg viewBox="0 0 24 24" className="absolute -top-1.5 left-0 h-7 w-7 text-done" fill="none">
          <path d="M3 13 C6 15, 8 18, 10 20 C13 13, 17 7, 23 2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
    </span>
  );
}

/** A little page with its corner turning up. */
function PageCurlIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M4 2.5h12v10l-5 5H4z" />
      <path d="M16 12.5h-3.5a1.5 1.5 0 0 0-1.5 1.5v3.5" />
    </svg>
  );
}

export function Page({
  list,
  pageNumber,
  parent,
  linkTitles,
  linkItems = {},
  interactive = true,
  className,
  showProgress = true,
  onAnimationEnd,
  ...h
}: Props) {
  const [draft, setDraft] = useState("");
  const [crumpling, setCrumpling] = useState<string[]>([]);
  const [today, setToday] = useState("");
  const [attaching, setAttaching] = useState<string | null>(null);

  const attach = (taskId: string, target: string | "new" | null) => {
    setAttaching(null);
    h.onAttachPage?.(taskId, target);
  };

  useEffect(() => {
    setToday(new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }));
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    if (list) h.onAddTask?.(draft);
    else h.onCreateList?.(draft);
    setDraft("");
  };

  const removeTask = (id: string) => {
    setCrumpling((c) => [...c, id]);
    window.setTimeout(() => h.onDeleteTask?.(id), 480);
  };

  const remaining = list ? list.tasks.filter((t) => !t.done).length : 0;
  const doneCount = list ? list.tasks.length - remaining : 0;
  const percent = list && list.tasks.length ? Math.round((doneCount / list.tasks.length) * 100) : 0;
  const progressLabel = list?.id === DAILY_ID ? "Today's progress" : "Progress";


  return (
    <article
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) onAnimationEnd?.();
      }}
      className={cn(
        "paper [--rules:none] absolute inset-0 overflow-hidden rounded-b-md rounded-t-sm",
        !interactive && "pointer-events-none",
        className,
      )}
      aria-hidden={!interactive}
    >
      <SpiralHoles />
      <div className="ruled-scroll absolute inset-0 overflow-y-auto pb-[var(--line)] pl-16 pr-5 pt-[calc(var(--line)*2)] sm:pr-8">
        <div className="relative max-w-2xl">
        {list ? (
          <>
            <header className="relative flex h-[calc(var(--line)*2)] items-center gap-2">
              <h2
                className={cn(
                  "min-w-0 flex-1 truncate self-end font-title text-[2.2rem] font-bold leading-[var(--line)] text-ink",
                  list.done && "scribble-strike",
                )}
              >
                {list.title}
              </h2>
              {showProgress && list.tasks.length > 0 && (
                <ProgressRing label={progressLabel} done={doneCount} total={list.tasks.length} percent={percent} />
              )}
              {interactive && (
                <div className="flex shrink-0 flex-col items-end">
                  {h.onOpenMenu && (
                    <button
                      onClick={h.onOpenMenu}
                      className="flex items-center gap-1 rounded-full h-[var(--line)] px-2.5 text-base text-ink transition hover:bg-highlight"
                      aria-label="Open lists menu"
                    >
                      <Menu className="h-4 w-4" /> Lists
                    </button>
                  )}
                  <div className="flex items-center gap-1">
                  <button
                    onClick={h.onToggleList}
                    className="flex items-center gap-1 rounded-full h-[var(--line)] px-2.5 text-base text-ink transition hover:bg-highlight"
                    aria-label={list.done ? "Reopen list" : "Finish list"}
                  >
                    <Check className="h-4 w-4" /> {list.done ? "Reopen" : "Finish"}
                  </button>
                  <button
                    onClick={h.onDeleteList}
                    className="rounded-full p-1.5 text-margin transition hover:bg-margin/15"
                    aria-label="Delete list"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                  </div>
                </div>
              )}
              {list.done && (
                <span className="animate-stamp pointer-events-none absolute right-6 top-14 rounded-md border-4 border-done px-3 font-title text-4xl font-bold uppercase leading-[3rem] text-done">
                  Done!
                </span>
              )}
            </header>
            <p className="line-h text-base text-pencil">
              {today && <span>{today} · </span>}
              {list.tasks.length === 0
                ? "nothing yet"
                : remaining === 0
                  ? "all done, well done!"
                  : `${remaining} left to do`}
            </p>

            <ul>
              {list.tasks.map((t) => {
                const linked = t.linkTo && linkTitles[t.linkTo] ? t.linkTo : null;
                const isShopFood = t.id === DAILY_SHOP_TASK_ID;
                const showFlip = linked || isShopFood;
                const preview = linked ? (linkItems[linked] ?? []) : [];
                const otherPages = Object.entries(linkTitles).filter(([id]) => id !== list.id && id !== linked);
                const pickerOpen = attaching === t.id;
                return (
                  <li key={t.id} className={cn("relative", pickerOpen && "z-10", crumpling.includes(t.id) && "animate-task-crumple")}>
                    <div className="group line-h flex items-center gap-3">
                      <button
                        onClick={() => h.onToggleTask?.(t.id)}
                        aria-label={t.done ? `Mark "${t.text}" as not done` : `Finish "${t.text}"`}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <HandCheckbox checked={t.done} />
                        <span className={cn("truncate", t.done ? "scribble-strike" : "text-ink")}>{t.text}</span>
                      </button>
                      {showFlip && (
                        <button
                          onClick={() => (linked ? h.onFlipTo?.(linked) : h.onOpenShopping?.())}
                          className="group/flip flex shrink-0 items-center gap-1.5 rounded-full bg-highlight px-3 text-base leading-7 text-ink shadow-sm transition hover:-rotate-2 hover:scale-105"
                          aria-label={`Flip page to ${linked ? linkTitles[linked] : "Shopping"}`}
                        >
                          <PageCurlIcon /> flip page
                          <ArrowRight className="h-4 w-4 transition group-hover/flip:translate-x-0.5" />
                        </button>
                      )}
                      {h.onAttachPage && (
                        <button
                          onClick={() => setAttaching(pickerOpen ? null : t.id)}
                          aria-label={linked ? `Change the page attached to "${t.text}"` : `Attach a page to "${t.text}"`}
                          aria-expanded={pickerOpen}
                          className={cn(
                            "shrink-0 rounded-full p-1 text-pencil transition hover:bg-highlight hover:text-ink group-hover:opacity-100",
                            pickerOpen ? "bg-highlight text-ink opacity-100" : "opacity-60 sm:opacity-0",
                          )}
                        >
                          <Paperclip className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => removeTask(t.id)}
                        aria-label={`Delete "${t.text}"`}
                        className="shrink-0 rounded-full p-1 text-pencil opacity-60 transition hover:bg-margin/15 hover:text-margin group-hover:opacity-100 sm:opacity-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {pickerOpen && (
                      <div
                        role="menu"
                        aria-label={`Attach a page to "${t.text}"`}
                        className="paper absolute right-0 top-[var(--line)] w-80 max-w-full -rotate-1 rounded-sm border border-paper-shade px-3 py-1 shadow-lg"
                      >
                        <p className="line-h text-base text-pencil">attach a page:</p>
                        <button
                          role="menuitem"
                          onClick={() => attach(t.id, "new")}
                          className="line-h flex w-full items-center gap-2 truncate rounded px-1 text-left text-ink hover:bg-highlight"
                        >
                          <FilePlus className="h-4 w-4 shrink-0" /> <span className="truncate">new page "{t.text}"</span>
                        </button>
                        {otherPages.map(([id, title]) => (
                          <button
                            key={id}
                            role="menuitem"
                            onClick={() => attach(t.id, id)}
                            className="line-h flex w-full items-center gap-2 rounded px-1 text-left text-ink hover:bg-highlight"
                          >
                            <PageCurlIcon /> <span className="truncate">{title}</span>
                          </button>
                        ))}
                        {linked && (
                          <button
                            role="menuitem"
                            onClick={() => attach(t.id, null)}
                            className="line-h flex w-full items-center gap-2 rounded px-1 text-left text-margin hover:bg-margin/15"
                          >
                            <Unlink className="h-4 w-4 shrink-0" /> remove attached page
                          </button>
                        )}
                      </div>
                    )}
                    {preview.length > 0 && (
                      <p className="line-h truncate pl-8 text-base text-pencil">
                        ↳ {preview.join(", ")}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>

            {interactive && (
              <form onSubmit={submit} className="line-h flex items-center gap-3">
                <Plus className="h-5 w-5 shrink-0 text-pencil" />
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="write a new task…"
                  aria-label="New task"
                  className="ink-input line-h w-full"
                />
              </form>
            )}

            {parent && interactive && (
              <button
                onClick={() => h.onFlipBack?.(parent.id)}
                className="line-h mt-[var(--line)] flex items-center gap-2 text-ink underline decoration-margin decoration-wavy underline-offset-4 hover:text-margin"
              >
                <ArrowLeft className="h-4 w-4" /> flip back to {parent.title}
              </button>
            )}
          </>
        ) : (
          <div>
            <h2 className="mt-[var(--line)] font-title text-[2.2rem] font-bold leading-[var(--line)] text-ink">A fresh page</h2>
            <p className="line-h text-ink">This notebook is empty. Start a new list!</p>
            {interactive && (
              <form onSubmit={submit} className="line-h flex items-center gap-3">
                <Plus className="h-5 w-5 shrink-0 text-pencil" />
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="name your list…"
                  aria-label="New list name"
                  className="ink-input line-h w-full"
                />
              </form>
            )}
          </div>
        )}
        </div>
      </div>
      <span className="absolute bottom-1 right-4 text-base text-pencil">{pageNumber}</span>
    </article>
  );
}
