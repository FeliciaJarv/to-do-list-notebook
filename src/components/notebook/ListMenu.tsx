import { useState, type FormEvent } from "react";
import { Plus, Trash2, X } from "lucide-react";
import type { TodoList } from "@/lib/notebook";
import { HandCheckbox } from "./Page";
import { cn } from "@/lib/utils";

type Props = {
  lists: TodoList[];
  currentId: string | null;
  deletingIds: string[];
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: (title: string) => void;
  onClose?: (() => void) | undefined;
  showProgress: boolean;
  onToggleProgress: () => void;
};

export function ListMenu({ lists, currentId, deletingIds, onSelect, onToggle, onDelete, onCreate, onClose, showProgress, onToggleProgress }: Props) {
  const [draft, setDraft] = useState("");
  const active = lists.filter((l) => !l.done);
  const finished = lists.filter((l) => l.done);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onCreate(draft);
    setDraft("");
  };

  const row = (l: TodoList) => (
    <li
      key={l.id}
      className={cn(
        "group line-h flex items-center gap-2 rounded-sm px-2 transition",
        l.id === currentId && "bg-highlight",
        deletingIds.includes(l.id) && "animate-task-crumple",
      )}
    >
      <button onClick={() => onToggle(l.id)} aria-label={l.done ? `Reopen ${l.title}` : `Finish ${l.title}`}>
        <HandCheckbox checked={l.done} />
      </button>
      <button
        onClick={() => onSelect(l.id)}
        className={cn("min-w-0 flex-1 truncate text-left hover:underline", l.done && "scribble-strike")}
      >
        {l.title}
        <span className="ml-2 text-sm text-pencil">{l.tasks.filter((t) => !t.done).length || ""}</span>
      </button>
      <button
        onClick={() => onDelete(l.id)}
        aria-label={`Delete list ${l.title}`}
        className="rounded-full p-1 text-pencil transition hover:text-margin"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );

  return (
    <nav aria-label="Lists" className="flex h-full flex-col overflow-hidden rounded-md page-stack">
      <div className="cover flex items-center justify-between px-5 py-3">
        <h2 className="font-title text-3xl font-bold">My lists</h2>
        {onClose && (
          <button onClick={onClose} aria-label="Close menu" className="rounded-full p-1 hover:bg-cover-foreground/15">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <div className="paper flex-1 overflow-y-auto px-3 pb-6 pt-1 text-ink" style={{ backgroundImage: "none" }}>
        <form onSubmit={submit} className="line-h flex items-center gap-2 border-b border-dashed border-rule px-2">
          <Plus className="h-5 w-5 shrink-0 text-pencil" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="new list…"
            aria-label="New list name"
            className="ink-input line-h w-full"
          />
        </form>

        <ul className="mt-2">
          {active.map(row)}
          {active.length === 0 && <li className="line-h px-2 text-pencil">no open lists</li>}
        </ul>

        {finished.length > 0 && (
          <>
            <h3 className="line-h mt-3 px-2 font-title text-2xl font-bold text-pencil">Finished</h3>
            <ul>
              {finished.map(row)}
            </ul>
          </>
        )}

        <h3 className="line-h mt-3 px-2 font-title text-2xl font-bold text-pencil">Settings</h3>
        <button
          role="switch"
          aria-checked={showProgress}
          onClick={onToggleProgress}
          className="line-h flex w-full items-center gap-2 rounded-sm px-2 text-left text-ink transition hover:bg-highlight"
        >
          <HandCheckbox checked={showProgress} />
          Show progress circle
        </button>
      </div>
    </nav>
  );
}
