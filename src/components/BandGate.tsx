"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

/**
 * Gates an Entrepreneur Quest / Leadership Quest section to a single
 * required age band. Used for the content this redesign deliberately
 * reserves for Strategist (12-14) — Run Your Business, Rescue & Grow
 * and the AI Business Lab in Entrepreneur Quest — because their own
 * subject matter (cash flow, business ethics, AI literacy, pivoting a
 * struggling company) matches the brief's explicit Strategist activity
 * list, not Builder's. See docs/eq-lq-age-band-redesign.md section 7.
 *
 * A child below the required band sees a short, friendly explanation
 * instead of the section — never a broken page, never a silent
 * redirect. Nothing about the gated section's own saved progress is
 * touched here: switching up to the required band later (through the
 * existing global level selector) immediately un-gates it, picking up
 * whatever that band's own progress already is (band-scoped storage
 * keeps each band's slice independent — see band-scoped-storage.ts).
 */
export function BandGate({ requiredBand, hubHref, hubLabelKey, children }: { requiredBand: "strategist"; hubHref: string; hubLabelKey: string; children: React.ReactNode }) {
  const t = useTranslations();
  const { state, isLoaded } = useLocalProgress();

  if (!isLoaded) {
    return <div className="grid min-h-screen place-items-center bg-fog text-ink/70">{t("common.loading")}</div>;
  }

  if (state.ageBand !== requiredBand) {
    return (
      <div className="min-h-screen bg-fog px-sm py-lg">
        <main id="main-content" tabIndex={-1} className="mx-auto max-w-[560px]">
          <Card variant="data" className="mt-md text-center">
            <p aria-hidden="true" className="text-3xl">
              🔒
            </p>
            <h1 className="mt-xs font-display text-xl font-bold">{t("bandGate.strategistOnly.title")}</h1>
            <p className="mt-2xs text-base text-ink/70">{t("bandGate.strategistOnly.body")}</p>
            <Link href={hubHref} className="mt-sm block">
              <Button variant="quest-primary" className="w-full">
                {t(hubLabelKey)}
              </Button>
            </Link>
          </Card>
        </main>
      </div>
    );
  }

  return <>{children}</>;
}
