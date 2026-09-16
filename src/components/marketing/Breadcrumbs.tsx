import { Link } from "@/i18n/navigation";

export interface BreadcrumbItem {
  label: string;
  href?: string; // omitted for the current page (last item)
}

/**
 * Visible breadcrumb trail — rendered alongside (not instead of) the
 * BreadcrumbList JSON-LD built from the same data in the page template,
 * so the structured data always matches what's actually on screen. See
 * structured-data.ts's own doc comment on why that match matters.
 *
 * ariaLabel is passed in by the caller (translated via
 * t("a11y.breadcrumbLabel")) rather than this component calling
 * useTranslations() itself, so this stays a plain, reusable
 * presentational component usable from server or client callers alike.
 * Defaults to the English "Breadcrumb" only so existing callers that
 * don't pass it don't silently lose the label.
 */
export function Breadcrumbs({ items, ariaLabel = "Breadcrumb" }: { items: BreadcrumbItem[]; ariaLabel?: string }) {
  return (
    <nav aria-label={ariaLabel} className="text-sm text-ink/70">
      <ol className="flex flex-wrap items-center gap-2xs">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2xs">
            {i > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <Link href={item.href} className="hover:text-teal">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink/70">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
