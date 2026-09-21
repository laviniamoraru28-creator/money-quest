import type { ReactNode } from "react";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { AccessibilityMenu } from "@/components/ui/AccessibilityMenu";

/**
 * Wraps every /play/* page (World Map, lessons, games, the Simulator,
 * Goals) with persistently-visible Sound and Accessibility controls,
 * rather than adding them to each page individually — a layout is
 * exactly Next.js's mechanism for "shared UI around a group of
 * routes," so this is additive only: no existing page's own markup
 * changes.
 *
 * Fixed-positioned (not part of any page's own layout flow) so it
 * never shifts existing content or interferes with each page's own
 * scroll/spacing — it floats above everything, always reachable,
 * consistent with these being persistent preference controls rather
 * than page content.
 *
 * Stacked vertically below `sm` (a plain row above it, unchanged from
 * before): on a 390px-wide phone, full-bleed page content has no side
 * gutter for this to float in, so a horizontal pair sitting flush
 * against the corner could span over a third of a two-column card's
 * width. Stacking halves that horizontal footprint — the pair still
 * occupies the same corner and both controls stay exactly as
 * reachable, just arranged in a narrower column.
 */
export default function PlayLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <div className="fixed bottom-sm right-sm z-50 flex flex-col items-end gap-2xs sm:flex-row sm:items-end">
        <AccessibilityMenu />
        <SoundToggle />
      </div>
    </>
  );
}
