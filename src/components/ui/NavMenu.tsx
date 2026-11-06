"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMessages, useTranslations } from "next-intl";
import { ActionIcon } from "./ActionIcon";
import { Link, usePathname } from "@/i18n/navigation";
import {findLessons,normalizeSearch} from "@/lib/lesson-search";
import {useLocalProgress} from "@/lib/local-progress/use-local-progress";
import {getLevelLabelKey} from "@/content/level-options";
import { navMenuSections } from "@/content/nav-menu-structure";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * One hamburger button, mounted once in the root layout so it's
 * reachable from every page (lessons, books, Museum rooms, labs,
 * activities included) without any per-page wiring. Opens a drawer —
 * a side panel on wide screens, a full-width sheet on narrow ones,
 * both the same markup, only the CSS width/position changes at the
 * `md` breakpoint. No external UI library: this reuses the same
 * dialog/focus-trap/Escape pattern already established by
 * AccessibilityMenu.tsx and QuietCorner.tsx in this codebase.
 */
export function NavMenu() {
  const t = useTranslations("navMenu");
  const pathname = usePathname();
  const all = useTranslations();
  const messages = useMessages();
  const {setAgeBand} = useLocalProgress();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  // Close on navigation: usePathname changes the instant a Link commits,
  // so this effect fires exactly when the route actually changed, not
  // merely when a link was clicked (a disabled/aria-current link, or one
  // the browser is still loading, shouldn't close the menu early).
  const previousPathname = useRef(pathname);
  useEffect(() => {
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      setIsOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    searchInput.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        trigger.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !panel.current) return;
      const focusable = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0]!, last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (panel.current && !panel.current.contains(event.target as Node) && event.target !== trigger.current) setIsOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isOpen]);

  const close = () => { setIsOpen(false); trigger.current?.focus(); };
  const toggleSection = (index: number) => setCollapsed((previous) => {
    const next = new Set(previous);
    if (next.has(index)) next.delete(index); else next.add(index);
    return next;
  });

  const normalizedQuery = normalizeSearch(query);
  const lessons = useMemo(()=>findLessons(messages.curriculum,normalizedQuery),[messages,normalizedQuery]);
  const searchResults = useMemo(() => {
    if (!normalizedQuery) return null;
    return navMenuSections.flatMap((section) => section.items.filter((item) => normalizeSearch(t(item.labelKey)).includes(normalizedQuery)).map((item) => ({ ...item, sectionLabel: t(section.labelKey) })));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t() is stable for a given locale; re-deriving per keystroke is intentional, not a missing dependency bug.
  }, [normalizedQuery,t]);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={() => setIsOpen(true)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={t("openMenu")}
        title={t("openMenu")}
        className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-teal/40 bg-white px-3 py-3 text-teal-text shadow-resting hover:bg-fog"
      >
        <ActionIcon name="menu" />
      </button>

      {
        // Always rendered (never unmounted), so every real route below
        // stays present in the server-rendered HTML - crawlable and
        // reachable without executing JS or simulating a click. Hidden
        // via a plain "hidden" utility class rather than conditional
        // mounting or the native `hidden` attribute: Tailwind's `flex`
        // utility is author-origin CSS and would silently override the
        // attribute's user-agent-origin `display:none`, regardless of
        // selector specificity, since author styles always beat
        // user-agent defaults in the cascade - a real, easy-to-miss
        // gotcha when mixing the two. Swapping the whole class string
        // (not just adding "hidden" alongside "flex") sidesteps it.
        // `aria-hidden` covers the accessibility tree directly rather
        // than relying on `display:none` alone to exclude it, and
        // closing-to-open still re-triggers the CSS entrance animation
        // (restoring `display` restarts a paused CSS animation).
      }
        <div
          aria-hidden={!isOpen}
          className={isOpen ? "fixed inset-0 z-[60] flex justify-end bg-ink/50" : "hidden"}
          role="presentation"
        >
          <div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={t("title")}
            className="flex h-full w-full flex-col overflow-y-auto bg-white shadow-floating motion-safe:animate-[nav-drawer-in_.2s_ease-out] md:w-[26rem]"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-ink/10 bg-white px-5 py-4">
              <h2 className="text-xl font-bold text-ink">{t("title")}</h2>
              <button type="button" onClick={close} aria-label={t("closeMenu")} className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl text-ink hover:bg-fog">
                <ActionIcon name="close" />
              </button>
            </div>

            <div className="border-b border-ink/10 px-5 py-3">
              <label className="relative block">
                <span className="sr-only">{t("searchPlaceholder")}</span>
                <ActionIcon name="search" size={20} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  ref={searchInput}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="min-h-12 w-full rounded-xl border border-teal/40 bg-white py-3 pl-11 pr-4 text-ink"
                />
              </label>
            </div>

            <nav aria-label={t("title")} className="flex-1 px-5 py-3">
              <Link href="/" className="mb-3 flex min-h-12 items-center gap-3 rounded-xl px-3 py-3 font-bold text-ink hover:bg-fog" aria-current={pathname === "/" ? "page" : undefined}>
                <ActionIcon name="home" />
                {t("home")}
              </Link>

              {searchResults ? (
                searchResults.length === 0 && lessons.length === 0 ? (
                  <p className="px-3 py-4 text-ink/70">{t("searchNoResults")}</p>
                ) : (
                  <ul aria-live="polite">
                    {lessons.map(lesson=><li key={lesson.id}><Link href={lesson.href} onClick={()=>{setAgeBand(lesson.ageBand);close();}} className="flex min-h-12 flex-col justify-center rounded-xl px-3 py-3 hover:bg-fog"><span className="font-bold text-ink">{lesson.title}</span><span className="text-sm text-ink/70">{all(getLevelLabelKey(lesson.ageBand))}</span></Link></li>)}
                    {searchResults.map((item) => (
                      <li key={item.href}>
                        <Link href={item.href} aria-current={pathname === item.href ? "page" : undefined} className="flex min-h-12 flex-col justify-center rounded-xl px-3 py-2 hover:bg-fog aria-[current=page]:bg-fog aria-[current=page]:font-bold">
                          <span className="text-ink">{t(item.labelKey)}</span>
                          <span className="text-sm text-ink/60">{item.sectionLabel}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )
              ) : (
                navMenuSections.map((section, index) => {
                  const isCollapsed = collapsed.has(index);
                  const panelId = `nav-menu-section-${index}`;
                  return (
                    <div key={section.labelKey} className="mb-2 border-t border-ink/10 pt-2 first:border-t-0 first:pt-0">
                      <button
                        type="button"
                        onClick={() => toggleSection(index)}
                        aria-expanded={!isCollapsed}
                        aria-controls={panelId}
                        className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left font-bold text-ink hover:bg-fog"
                      >
                        <ActionIcon name={section.icon} />
                        <span className="flex-1">{t(section.labelKey)}</span>
                        <ActionIcon name="chevronDown" size={18} style={{ transform: isCollapsed ? "rotate(-90deg)" : undefined, transition: "transform .15s ease" }} />
                      </button>
                      {!isCollapsed && (
                        <ul id={panelId}>
                          {section.items.map((item) => (
                            <li key={item.href}>
                              <Link href={item.href} aria-current={pathname === item.href ? "page" : undefined} className="flex min-h-12 items-center rounded-xl py-2 pl-11 pr-3 text-ink hover:bg-fog aria-[current=page]:bg-fog aria-[current=page]:font-bold">
                                {t(item.labelKey)}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })
              )}
            </nav>
          </div>
        </div>
    </>
  );
}
