import { navMenuSections, type NavMenuItem } from "@/content/nav-menu-structure";

/**
 * Section keys that are navigation utility/parent-facing, not a child's
 * educational journey through the site — excluded from "what comes next"
 * logic. Keep this in sync if nav-menu-structure.ts gains another
 * non-educational section; everything else there is treated as part of
 * the real learning journey, in the order it's already defined there.
 */
const UTILITY_SECTION_KEYS = new Set(["sectionForParents", "sectionInformation"]);

/** The real educational journey, flattened in menu order — the single
 * source of truth for "what comes after this section", reused by any
 * future transition between sections, not just the post-certificate one. */
export const educationalSectionItems: NavMenuItem[] = navMenuSections
  .filter((section) => !UTILITY_SECTION_KEYS.has(section.labelKey))
  .flatMap((section) => section.items);

/** The next educational section after `currentHref`, in menu order, or
 * null if `currentHref` isn't in the educational list or is already the
 * last entry. Never hardcode a destination — always derive it from the
 * live nav-menu-structure.ts order so a future reorder is picked up
 * automatically. */
export function getNextEducationalSection(currentHref: string): NavMenuItem | null {
  const index = educationalSectionItems.findIndex((item) => item.href === currentHref);
  if (index === -1 || index === educationalSectionItems.length - 1) return null;
  return educationalSectionItems[index + 1] ?? null;
}
