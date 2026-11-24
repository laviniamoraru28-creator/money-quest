import type { QuestKey } from "./quest-milestones";

export const cinematicQuests: { key: QuestKey; title: string; href: string }[] = [
  { key: "money", title: "Money Quest", href: "/play" },
  {
    key: "entrepreneur",
    title: "Entrepreneur Quest",
    href: "/entrepreneur-quest",
  },
  { key: "leadership", title: "Leadership Quest", href: "/leadership-quest" },
  { key: "ai", title: "AI Quest", href: "/ai-quest" },
];
