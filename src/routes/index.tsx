import { createFileRoute } from "@tanstack/react-router";
import { Notebook } from "@/components/notebook/Notebook";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My Notebook — Handwritten To-Do Lists" },
      { name: "description", content: "A cosy spiral notebook for your to-do lists: daily tasks, shopping lists and more on yellow paper." },
      { property: "og:title", content: "My Notebook — Handwritten To-Do Lists" },
      { property: "og:description", content: "A cosy spiral notebook for your to-do lists: daily tasks, shopping lists and more." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <Notebook />;
}
