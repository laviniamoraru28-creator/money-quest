import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { AccessibilityMenu } from "@/components/ui/AccessibilityMenu";
import { SoundToggle } from "@/components/ui/SoundToggle";

interface LayoutProps {
  params: Promise<{ locale: string }>;
}

/**
 * Leadership Quest is an interactive app section, not static content to
 * rank in search — same treatment as Entrepreneur Quest (see
 * entrepreneur-quest/layout.tsx, copied here unchanged). AccessibilityMenu/
 * SoundToggle are the same persistent, floating controls every quest
 * section already gets — reused here rather than reimplemented.
 */
export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { locale } = await params;
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
      <div className="sticky top-0 z-40 flex flex-wrap justify-end gap-2 bg-white/95 px-4 py-2 shadow-sm" aria-label="Learning settings">
        <AccessibilityMenu />
        <SoundToggle />
      </div>
      {children}
    </>
  );
}
