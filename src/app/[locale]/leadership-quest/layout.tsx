import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { AccessibilityMenu } from "@/components/ui/AccessibilityMenu";
import { SoundToggle } from "@/components/ui/SoundToggle";

interface LayoutProps {
  params: { locale: string };
}

/**
 * Leadership Quest is an interactive app section, not static content to
 * rank in search — same treatment as Entrepreneur Quest (see
 * entrepreneur-quest/layout.tsx, copied here unchanged). AccessibilityMenu/
 * SoundToggle are the same persistent, floating controls every quest
 * section already gets — reused here rather than reimplemented.
 */
export async function generateMetadata({ params: { locale } }: LayoutProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "leadershipQuest" });
  return {
    title: t("hubTitle"),
    description: t("hubTagline"),
    robots: { index: false, follow: true },
  };
}

export default function LeadershipQuestLayout({ children }: LayoutProps & { children: ReactNode }) {
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
