import type { PilotIconName } from "./VisualPilotIcons";
import { PilotIcon } from "./VisualPilotIcons";

/**
 * A single large, tappable picture-choice button — the shared building
 * block for the visual-first pilot's three picker grids (a goal, an
 * item to offer, an idea). The icon is the primary, self-sufficient
 * communication surface (tapping it IS how a nonverbal child answers);
 * the text label stays as real, visible, non-decorative content for
 * children who read and for assistive technology — never hidden, never
 * the only way to understand the choice. Selection is shown both by a
 * shape change (border + fill, like VariantIcon's own selected state)
 * and by `aria-pressed`, never by colour alone. Large touch target
 * (`min-h-touch-min-child`, the same size this app already reserves for
 * primary child-facing actions) and fully keyboard/mouse/touch operable
 * since it's a plain `<button>`.
 */
export function VisualChoiceButton({
  icon,
  label,
  selected,
  onClick,
}: {
  icon: PilotIconName;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        "flex min-h-touch-min-child w-full flex-col items-center gap-2xs rounded-lg border-[1.5px] p-xs text-center transition-colors duration-quick",
        selected ? "border-teal bg-teal text-white" : "border-ink/20 bg-white text-ink/80 hover:border-teal",
      ].join(" ")}
    >
      <PilotIcon name={icon} className="h-9 w-9" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
