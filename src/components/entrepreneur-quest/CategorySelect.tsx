/**
 * A curated button grid for picking one structural category key (used
 * for product category, customer category, and marketing approach) —
 * the shared rendering behind all three "pick one of these" stages.
 * Deliberately generic: it knows nothing about WHICH category list
 * it's showing, only a list of ids and how to look up each one's
 * current-locale label, so adding a category later never means a new
 * component, only a new entry in structures.ts plus its translation.
 */
export function CategorySelect({
  ids,
  selectedId,
  onSelect,
  getLabel,
}: {
  ids: string[];
  selectedId: string;
  onSelect: (id: string) => void;
  getLabel: (id: string) => string;
}) {
  return (
    <div className="mt-2xs grid grid-cols-2 gap-2xs sm:grid-cols-3">
      {ids.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          aria-pressed={selectedId === id}
          className={[
            "min-h-touch-min-child rounded-sm border-2 px-sm py-2xs text-left text-base font-medium",
            selectedId === id ? "border-teal bg-teal/5 text-teal" : "border-ink/15 text-ink/80",
          ].join(" ")}
        >
          {getLabel(id)}
        </button>
      ))}
    </div>
  );
}
