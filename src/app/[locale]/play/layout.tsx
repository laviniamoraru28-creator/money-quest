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
 * A sticky top bar (not fixed/floating over the corner, as an
 * earlier version of this layout used) — `sticky top-0` reserves its
 * own space in normal layout flow, so every page's own content,
 * including its `<h1>`, is pushed down below it rather than risking
 * an overlap at narrow widths. `flex-wrap` lets the two controls drop
 * to a second line on the narrowest phones instead of overflowing.
 */
export default function PlayLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="sticky top-0 z-40 flex flex-wrap justify-end gap-2 bg-white/95 px-4 py-2 shadow-sm" aria-label="Learning settings">
        <AccessibilityMenu />
        <SoundToggle />
      </div>
      {children}
    </>
  );
}
