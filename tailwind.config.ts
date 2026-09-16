import type { Config } from "tailwindcss";

// Values mirror the CSS custom properties defined in the visual design
// system (money-quest-design-system.md, Section 8). Tailwind's theme is
// generated FROM those tokens rather than inventing a second source of
// truth — if a token changes in the design system doc, it should change
// here too, and nowhere else.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        teal: "#0F7A6B",
        gold: "#E8A33D",
        /** A darker gold specifically for TEXT — the base `gold`
         * (#E8A33D) only reaches 2.16:1 contrast against white, well
         * under WCAG AA's 4.5:1 requirement for normal text. Found
         * during the accessibility audit (computed directly, not
         * assumed) — this token exists so gold-as-text never repeats
         * that failure, while `gold` itself is kept unchanged for
         * borders/backgrounds/decorative accents, where it's already
         * used alongside other visual cues (not the sole way a UI
         * boundary is identified). See money-quest-accessibility-audit.md §4. */
        "gold-text": "#8F5E19",
        ember: "#D13E19",
        sky: "#367D99",
        /** A very light sage green — the site's main background,
         * replacing the previous near-neutral grey (#F5F6F4) as part
         * of the "interactive children's book" visual redesign. Kept
         * as the SAME `fog` token (not a new one) deliberately: `fog`
         * is already used as `bg-fog` on essentially every page
         * wrapper in the app, so changing its value here cascades the
         * new background everywhere at once, with no template changes
         * needed anywhere else. Contrast against `ink` text: 13.75:1,
         * computed directly — far exceeds the 4.5:1 AA minimum. */
        fog: "#EDF3E8",
        /** Warm cream/off-white — a surface color distinct from both
         * the new sage background and plain white, used for card and
         * "page" surfaces (lesson pages, activity cards) so they read
         * as a warm paper-like surface sitting on top of the sage
         * background, rather than a stark white cutout. Contrast
         * against `ink` text: 14.63:1, computed directly. */
        cream: "#FBF8EF",
        /** A cheerful coral accent — used sparingly, per the redesign
         * brief's explicit "not overwhelmingly colourful" instruction,
         * for small decorative touches (badges, highlights, a warm
         * accent border) rather than large surfaces or as a primary
         * action color (that stays `teal`). Always paired with `ink`
         * text, never white text on top of it — computed contrast:
         * ink-on-coral is 5.58:1 (passes AA), white-on-coral is only
         * 2.79:1 (fails AA even for large text), so this token is
         * deliberately backing color only. */
        coral: "#F0785A",
        /** A soft, pastel blue accent — distinct in character from the
         * existing `sky` token, which is more saturated and already
         * doubles as the Sky Exchange world's brand color. This one is
         * reserved for small cheerful accent touches per the redesign
         * brief, not for anything carrying its own separate meaning
         * elsewhere in the app. Contrast against `ink` text: 6.82:1,
         * computed directly, passes AA. Always paired with `ink` text
         * for the same reason as `coral` above. */
        "soft-blue": "#7FB3CC",
        ink: "#1C2624",
        success: "#39813D",
        error: "#C6433A",
        warning: "#AC6615",
        world: {
          "coin-cove": "#E8A33D",
          "market-town": "#D13E19",
          "golden-vault": "#0B5C50",
          "sky-exchange": "#367D99",
          "guardian-gate": "#5B4B8A",
          "horizon-peaks": "#6E7B8B",
          "kindness-grove": "#C97C93",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: "0.75rem",
        sm: "0.875rem",
        base: "1rem",
        md: "1.125rem",
        lg: "1.375rem",
        xl: "1.75rem",
        "2xl": "2.25rem",
        "3xl": "3rem",
        "4xl": "4rem",
      },
      spacing: {
        "3xs": "0.25rem",
        "2xs": "0.5rem",
        xs: "0.75rem",
        sm: "1rem",
        md: "1.5rem",
        lg: "2rem",
        xl: "3rem",
        "2xl": "4rem",
        "3xl": "6rem",
        "touch-min": "2.75rem",
        "touch-min-child": "3rem",
      },
      borderRadius: {
        none: "0",
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        full: "9999px",
      },
      boxShadow: {
        flat: "none",
        resting: "0 2px 8px rgba(28, 38, 36, 0.08)",
        floating: "0 8px 24px rgba(28, 38, 36, 0.16)",
      },
      transitionDuration: {
        instant: "100ms",
        quick: "200ms",
        moderate: "350ms",
        celebratory: "700ms",
      },
      transitionTimingFunction: {
        "ease-out-brand": "cubic-bezier(0.16, 1, 0.3, 1)",
        "ease-in-out-brand": "cubic-bezier(0.65, 0, 0.35, 1)",
        bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
