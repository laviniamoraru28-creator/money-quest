"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/i18n/config";

/**
 * The one language selector component used everywhere the brief requires
 * it (public site header, dashboard header, and — once a Settings page
 * exists — there too): same component, different mounting point, never
 * a re-implementation. Switches language via next-intl's locale-aware
 * router, which preserves the current page (a parent switching from
 * English to Romanian on the Dashboard stays on the Dashboard, in
 * Romanian) rather than bouncing to the homepage.
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
  const router = useRouter();
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
    router.replace(pathname, { locale: nextLocale });
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
