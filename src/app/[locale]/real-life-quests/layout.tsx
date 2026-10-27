import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { AccessibilityMenu } from "@/components/ui/AccessibilityMenu";
import { SoundToggle } from "@/components/ui/SoundToggle";

interface LayoutProps {
  params: Promise<{ locale: string }>;
}

/**
 * Real Life Quests is an interactive app section with client-side,
 * localStorage-personalized state (mission status, chosen version,
 * reflections) — same treatment as /play, /entrepreneur-quest, and
 * /leadership-quest (see robots.ts). noindex is set explicitly here too,
 * belt and suspenders, same reasoning as those layouts.
 *
 * AccessibilityMenu/SoundToggle are the exact same persistent, floating
 * controls every other quest section already gets — reused here, not
 * re-implemented, so Real Life Quests has the same accessibility
 * affordances as the rest of the app, never a second, separate system.
 */
export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "realLifeQuests" });
  return {
    title: t("hubTitle"),
    description: t("hubTagline"),
    robots: { index: false, follow: true },
  };
}

export default function RealLifeQuestsLayout({ children }: LayoutProps & { children: ReactNode }) {
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
