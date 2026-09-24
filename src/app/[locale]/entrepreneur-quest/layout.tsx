import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { AccessibilityMenu } from "@/components/ui/AccessibilityMenu";
import { SoundToggle } from "@/components/ui/SoundToggle";

interface LayoutProps {
  params: { locale: string };
}

/**
 * Entrepreneur Quest is an interactive app section, not static content
 * to rank in search — same treatment as /play (see robots.ts, which
 * disallows both). noindex is set explicitly here too (belt and
 * suspenders, same reasoning as feedback/layout.tsx) since a page can
 * still get indexed with no snippet if it's ever linked from somewhere
 * crawlable, even while robots.txt blocks fetching its content.
 *
 * AccessibilityMenu/SoundToggle are the same persistent, floating
 * controls every /play/* page already gets via play/layout.tsx — reused
 * here rather than re-implemented, so Entrepreneur Quest has the exact
 * same accessibility affordances as the rest of the app, not a
 * second, separate system.
 */
export async function generateMetadata({ params: { locale } }: LayoutProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "entrepreneurQuest" });
  return {
    title: t("hubTitle"),
    description: t("hubTagline"),
    robots: { index: false, follow: true },
  };
}

export default function EntrepreneurQuestLayout({ children }: LayoutProps & { children: ReactNode }) {
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
