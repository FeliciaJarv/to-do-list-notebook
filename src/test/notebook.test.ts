import { describe, expect, it } from "vitest";
import {
  DAILY_ID,
  SHOPPING_ID,
  addList,
  addTask,
  createInitialState,
  deleteList,
  deleteTask,
  ensureShoppingList,
  neighbourAfterDelete,
  toggleList,
  toggleTask,
} from "@/lib/notebook";

describe("notebook rules", () => {
  it("starts with a daily list whose 'Shop food' item links to the shopping page", () => {
    const s = createInitialState();
    const daily = s.lists.find((l) => l.id === DAILY_ID)!;
    const shop = daily.tasks.find((t) => t.text === "Shop food")!;
    expect(shop.linkTo).toBe(SHOPPING_ID);
    expect(s.lists.some((l) => l.id === SHOPPING_ID)).toBe(true);
  });

  it("creates, finishes and deletes a list", () => {
    let s = addList(createInitialState(), "Weekend", "w");
    expect(s.lists.at(-1)?.title).toBe("Weekend");
    s = toggleList(s, "w");
    expect(s.lists.find((l) => l.id === "w")?.done).toBe(true);
    s = deleteList(s, "w");
    expect(s.lists.find((l) => l.id === "w")).toBeUndefined();
  });

  it("creates, finishes and deletes a task", () => {
    let s = addTask(createInitialState(), DAILY_ID, "Call mom", "t");
    expect(s.lists[0]!.tasks.at(-1)?.text).toBe("Call mom");
    s = toggleTask(s, DAILY_ID, "t");
    expect(s.lists[0]!.tasks.find((t) => t.id === "t")?.done).toBe(true);
    s = deleteTask(s, DAILY_ID, "t");
    expect(s.lists[0]!.tasks.find((t) => t.id === "t")).toBeUndefined();
  });

  it("ignores blank list and task names", () => {
    const s = createInitialState();
    expect(addList(s, "   ")).toBe(s);
    expect(addTask(s, DAILY_ID, "")).toBe(s);
  });

  it("removes the page link when the shopping list is deleted", () => {
    const s = deleteList(createInitialState(), SHOPPING_ID);
    expect(s.lists[0]!.tasks.find((t) => t.text === "Shop food")?.linkTo).toBeUndefined();
  });

  it("shows the next list after deleting, or the previous when it was last", () => {
    const lists = createInitialState().lists;
    expect(neighbourAfterDelete(lists, DAILY_ID)).toBe(SHOPPING_ID);
    expect(neighbourAfterDelete(lists, SHOPPING_ID)).toBe(DAILY_ID);
  });

  it("brings the shopping page back with its items when 'Shop food' is used after it was deleted", () => {
    let s = deleteList(createInitialState(), SHOPPING_ID);
    s = ensureShoppingList(s);
    const shopping = s.lists.find((l) => l.id === SHOPPING_ID)!;
    expect(shopping.tasks.map((t) => t.text)).toEqual(["Milk", "Bread", "Eggs", "Apples", "Coffee"]);
    expect(s.lists[1]?.id).toBe(SHOPPING_ID);
    const daily = s.lists.find((l) => l.id === DAILY_ID)!;
    expect(daily.tasks.find((t) => t.text === "Shop food")!.linkTo).toBe(SHOPPING_ID);
  });
});

describe("attaching a page to a task", () => {
  it("links a task to an existing page so it can flip there", async () => {
    const { linkTask } = await import("@/lib/notebook");
    let s = addList(createInitialState(), "Packing", "packing");
    s = linkTask(s, DAILY_ID, "daily-walk", "packing");
    expect(s.lists[0]!.tasks.find((t) => t.id === "daily-walk")!.linkTo).toBe("packing");
  });

  it("creates a new page named after the task, right after its list", async () => {
    const { attachNewPage } = await import("@/lib/notebook");
    const s = attachNewPage(createInitialState(), DAILY_ID, "daily-water", "plants");
    expect(s.lists[1]!.id).toBe("plants");
    expect(s.lists[1]!.title).toBe("Water the plants");
    expect(s.lists[0]!.tasks.find((t) => t.id === "daily-water")!.linkTo).toBe("plants");
  });

  it("can detach a page, and never links a task to its own page", async () => {
    const { linkTask } = await import("@/lib/notebook");
    let s = linkTask(createInitialState(), DAILY_ID, "daily-shop", undefined);
    expect(s.lists[0]!.tasks[0]!.linkTo).toBeUndefined();
    s = linkTask(s, DAILY_ID, "daily-shop", DAILY_ID);
    expect(s.lists[0]!.tasks[0]!.linkTo).toBeUndefined();
  });
});
