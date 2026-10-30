export type Task = {
  id: string;
  text: string;
  done: boolean;
  /** When set, this task links to another list (flip the page to see it). */
  linkTo?: string | undefined;
};

export type TodoList = {
  id: string;
  title: string;
  done: boolean;
  tasks: Task[];
};

export type NotebookState = {
  lists: TodoList[];
};

export const DAILY_ID = "daily";
export const SHOPPING_ID = "shopping";

let counter = 0;
export const uid = () => `${Date.now().toString(36)}-${(counter++).toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export const DAILY_SHOP_TASK_ID = "daily-shop";

const defaultShoppingList = (): TodoList => ({
  id: SHOPPING_ID,
  title: "Shopping",
  done: false,
  tasks: [
    { id: "shop-milk", text: "Milk", done: false },
    { id: "shop-bread", text: "Bread", done: false },
    { id: "shop-eggs", text: "Eggs", done: false },
    { id: "shop-apples", text: "Apples", done: false },
    { id: "shop-coffee", text: "Coffee", done: false },
  ],
});

/**
 * "Shop food" on the daily list must always open a shopping page. If the shopping
 * list was deleted, bring it back (with the default items) right after the daily list
 * and re-link "Shop food" to it.
 */
export function ensureShoppingList(state: NotebookState): NotebookState {
  const hasShopping = state.lists.some((l) => l.id === SHOPPING_ID);
  let lists = state.lists.map((l) =>
    l.id === DAILY_ID
      ? { ...l, tasks: l.tasks.map((t) => (t.id === DAILY_SHOP_TASK_ID ? { ...t, linkTo: SHOPPING_ID } : t)) }
      : l,
  );
  if (!hasShopping) {
    const i = lists.findIndex((l) => l.id === DAILY_ID);
    lists = [...lists.slice(0, i + 1), defaultShoppingList(), ...lists.slice(i + 1)];
  }
  return { lists };
}

export function createInitialState(): NotebookState {
  return {
    lists: [
      {
        id: DAILY_ID,
        title: "Daily list",
        done: false,
        tasks: [
          { id: "daily-shop", text: "Shop food", done: false, linkTo: SHOPPING_ID },
          { id: "daily-water", text: "Water the plants", done: false },
          { id: "daily-walk", text: "Go for a walk", done: false },
        ],
      },
      defaultShoppingList(),
    ],
  };
}

export function addList(state: NotebookState, title: string, id: string = uid()): NotebookState {
  const t = title.trim();
  if (!t) return state;
  return { lists: [...state.lists, { id, title: t, done: false, tasks: [] }] };
}

export function toggleList(state: NotebookState, listId: string): NotebookState {
  return {
    lists: state.lists.map((l) => (l.id === listId ? { ...l, done: !l.done } : l)),
  };
}

export function deleteList(state: NotebookState, listId: string): NotebookState {
  return {
    lists: state.lists
      .filter((l) => l.id !== listId)
      // Remove links that pointed at the deleted list so nothing flips to a missing page.
      .map((l) => ({
        ...l,
        tasks: l.tasks.map((t) => (t.linkTo === listId ? { ...t, linkTo: undefined } : t)),
      })),
  };
}

export function addTask(state: NotebookState, listId: string, text: string, id: string = uid()): NotebookState {
  const t = text.trim();
  if (!t) return state;
  return {
    lists: state.lists.map((l) =>
      l.id === listId ? { ...l, tasks: [...l.tasks, { id, text: t, done: false }] } : l,
    ),
  };
}

export function toggleTask(state: NotebookState, listId: string, taskId: string): NotebookState {
  return {
    lists: state.lists.map((l) =>
      l.id === listId
        ? { ...l, tasks: l.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) }
        : l,
    ),
  };
}

export function deleteTask(state: NotebookState, listId: string, taskId: string): NotebookState {
  return {
    lists: state.lists.map((l) =>
      l.id === listId ? { ...l, tasks: l.tasks.filter((t) => t.id !== taskId) } : l,
    ),
  };
}

/** Attach an existing page to a task (or detach it with `targetId = undefined`). A task can't link to its own list. */
export function linkTask(
  state: NotebookState,
  listId: string,
  taskId: string,
  targetId: string | undefined,
): NotebookState {
  if (targetId === listId) return state;
  if (targetId && !state.lists.some((l) => l.id === targetId)) return state;
  return {
    lists: state.lists.map((l) =>
      l.id === listId
        ? { ...l, tasks: l.tasks.map((t) => (t.id === taskId ? { ...t, linkTo: targetId } : t)) }
        : l,
    ),
  };
}

/** Make a brand-new page named after the task, placed right after its list, and attach it to the task. */
export function attachNewPage(state: NotebookState, listId: string, taskId: string, newId: string = uid()): NotebookState {
  const i = state.lists.findIndex((l) => l.id === listId);
  const task = state.lists[i]?.tasks.find((t) => t.id === taskId);
  if (!task) return state;
  const page: TodoList = { id: newId, title: task.text, done: false, tasks: [] };
  const lists = [...state.lists.slice(0, i + 1), page, ...state.lists.slice(i + 1)];
  return linkTask({ lists }, listId, taskId, newId);
}

/** Which list to show after `deletedId` is removed: the next one, else the previous, else none. */
export function neighbourAfterDelete(lists: TodoList[], deletedId: string): string | null {
  const i = lists.findIndex((l) => l.id === deletedId);
  if (i === -1) return lists[0]?.id ?? null;
  return lists[i + 1]?.id ?? lists[i - 1]?.id ?? null;
}

const STORAGE_KEY = "notebook-todo-v1";

export function loadState(): NotebookState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NotebookState;
    if (!Array.isArray(parsed?.lists)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveState(state: NotebookState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable */
  }
}
