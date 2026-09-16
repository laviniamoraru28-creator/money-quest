interface ProgressBarProps {
  percent: number; // 0-100
  label: string; // for aria-label — every usage already had one, now enforced by the shared component's props
  className?: string;
}

/**
 * The one progress-bar implementation used across the app (XP,
 * savings goals, game rounds, the Money Life Simulator's week
 * progress) — consolidated during a performance audit that found 4 separate,
 * near-identical implementations, each animating the `width` CSS
 * property directly.
 *
 * `width` is a layout-affecting property — animating it forces the
 * browser to recompute layout on every frame of the transition, rather
 * than running entirely on the compositor thread the way `transform`
 * animations do. This component instead keeps the bar at a fixed
 * width and animates `transform: scaleX()` (with `transform-origin:
 * left` so it grows from the left edge, matching how a width-based bar
 * looks) — visually identical, but the browser can run the animation
 * without a layout pass. This matters most on lower-end mobile
 * devices, one of this app's explicit target device classes.
 *
 * Honest severity note: these are short, one-off transitions
 * triggered on a discrete state change (an XP gain, a round advancing)
 * — not a continuous or looping animation — so the real-world cost of
 * the old approach was genuinely small. Fixed anyway, both because
 * it's a correct, low-risk, zero-downside change, and because
 * consolidating 4 near-duplicate implementations into one is worth
 * doing on its own.
 */
export function ProgressBar({ percent, label, className = "" }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div
      className={`h-full w-full overflow-hidden rounded-full bg-fog ${className}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className="h-full w-full origin-left rounded-full bg-teal transition-transform duration-moderate"
        style={{ transform: `scaleX(${clamped / 100})` }}
      />
    </div>
  );
}
