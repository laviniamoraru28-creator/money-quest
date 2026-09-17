"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/i18n/config";

/**
 * The one language selector component used everywhere the brief requires
 * it (public site header, dashboard header, and — once a Settings page
 * exists — there too): same component, different mounting point, never
 * a re-implementation. Switches language by constructing the target
 * locale's URL and doing a full page navigation, preserving the
 * current page (a parent switching from English to Romanian on the
 * Dashboard stays on the Dashboard, in Romanian) rather than bouncing
 * to the homepage.
 *
 * A FULL navigation (`window.location.href`), not next-intl's
 * client-side router — deliberately, and only after finding this
 * broken in the actual Namecheap/custom-server deployment: the
 * client-side router's locale switch performs a soft, RSC-payload
 * navigation through the SAME custom server.js this app runs behind
 * on that host, which was producing a 404 there specifically — while
 * a full page load to the very same target URL (typed directly, or
 * via a normal link) worked correctly. A full navigation sidesteps
 * that RSC-payload code path entirely, at the cost of a full page
 * reload on every language switch rather than an instant client-side
 * swap — an honest, visible tradeoff, not a silent one.
 *
 * Accessibility: every option is a real, individually focusable
 * `<button>`, so Tab/Shift+Tab and Enter/Space work correctly, and
 * Escape closes the menu. This is a solid keyboard-operable baseline,
 * but it is NOT the full WAI-ARIA listbox pattern (which would add
 * arrow-key roving focus between options and typeahead) — noted here
 * rather than silently left as an unstated gap, since claiming full
 * pattern compliance would be inaccurate.
 */
export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  function handleSelect(nextLocale: Locale) {
    setIsOpen(false);
    // pathname from next-intl's usePathname() is already locale-stripped
    // (e.g. "/parent-info", or "/" for the homepage) — see this
    // component's own doc comment above for why this is a full
    // navigation, not router.replace(pathname, { locale: nextLocale }).
    const target = pathname === "/" ? `/${nextLocale}` : `/${nextLocale}${pathname}`;
    window.location.href = target;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t("language.selectorLabel")}
        className="flex min-h-touch-min items-center gap-2xs rounded-sm border border-ink/20 px-xs py-2xs text-sm font-medium hover:border-teal"
      >
        <span aria-hidden="true">🌐</span>
        {LOCALE_LABELS[locale].nativeName}
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label={t("language.changeLanguage")}
          className="absolute right-0 z-10 mt-2xs max-h-72 w-48 overflow-y-auto rounded-md border border-ink/10 bg-white py-2xs shadow-floating"
        >
          {LOCALES.map((l) => (
            <li key={l} role="option" aria-selected={l === locale}>
              <button
                type="button"
                onClick={() => handleSelect(l)}
                className={[
                  "flex w-full min-h-touch-min items-center justify-between px-sm py-2xs text-left text-sm hover:bg-fog",
                  l === locale ? "font-bold text-teal" : "text-ink",
                ].join(" ")}
              >
                <span>{LOCALE_LABELS[l].nativeName}</span>
                <span className="text-xs text-ink/70">{LOCALE_LABELS[l].englishName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
