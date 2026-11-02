import type { ComponentProps } from "react";
import type { ActionIcon } from "@/components/ui/ActionIcon";

type IconName = ComponentProps<typeof ActionIcon>["name"];

export type NavMenuItem = {
  /** Key into the "navMenu" message namespace for this item's label. */
  labelKey: string;
  /** Real, existing route (no locale prefix — the Link component adds it). */
  href: string;
};

export type NavMenuSection = {
  labelKey: string;
  icon: IconName;
  items: NavMenuItem[];
};

/**
 * Every href here is a real, existing route under src/app/[locale]/ —
 * checked directly against the app's actual file-based routes, not
 * invented. Keep this list in sync if a route is renamed or removed;
 * nothing here should ever point at a path that doesn't exist.
 */
export const navMenuSections: NavMenuSection[] = [
  {
    labelKey: "sectionLearningWorlds",
    icon: "worlds",
    items: [
      { labelKey: "moneyQuest", href: "/play" },
      { labelKey: "entrepreneurQuest", href: "/entrepreneur-quest" },
      { labelKey: "leadershipQuest", href: "/leadership-quest" },
      { labelKey: "realLifeQuests", href: "/real-life-quests" },
    ],
  },
  {
    labelKey: "sectionExploreDiscover",
    icon: "compass",
    items: [
      { labelKey: "library", href: "/library" },
      { labelKey: "museum", href: "/museum" },
      { labelKey: "brainLab", href: "/brain-lab" },
      { labelKey: "mindLab", href: "/mind-lab" },
      { labelKey: "futureSkills", href: "/future-skills" },
      { labelKey: "inclusiveLearning", href: "/inclusive-learning" },
      { labelKey: "visualExplorer", href: "/explorer" },
      { labelKey: "investingLab", href: "/play/investing-lab" },
      { labelKey: "moneyPersonality", href: "/play/money-personality" },
      { labelKey: "learningArticles", href: "/learn" },
    ],
  },
  {
    labelKey: "sectionRelaxPlay",
    icon: "heart",
    items: [{ labelKey: "quietCorner", href: "/quiet-corner" }],
  },
  {
    labelKey: "sectionParents",
    icon: "family",
    items: [
      { labelKey: "parentInfo", href: "/parent-info" },
      { labelKey: "parentResources", href: "/parents/resources" },
      { labelKey: "shop", href: "/parents/shop" },
      { labelKey: "reviews", href: "/reviews" },
      { labelKey: "contact", href: "/contact" },
      { labelKey: "privacy", href: "/privacy" },
    ],
  },
];
