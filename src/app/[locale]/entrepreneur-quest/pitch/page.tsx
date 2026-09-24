"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { useEntrepreneurQuest } from "@/lib/entrepreneur-quest/use-entrepreneur-quest";
import { formatCurrency } from "@/lib/currency/format";
import { computeProfitMinorUnits } from "@/lib/entrepreneur-quest/state";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EntrepreneurQuestLogo } from "@/components/entrepreneur-quest/EntrepreneurQuestLogo";

export default function EntrepreneurQuestPitchPage() {
  const uiLocale = useLocale();
  const t = useTranslations();
  const { state: progressState, isLoaded: progressLoaded } = useLocalProgress();
  const { state, isLoaded } = useEntrepreneurQuest();

  if (!isLoaded || !progressLoaded) {
    return <div className="grid min-h-screen place-items-center bg-fog text-ink/60">{t("common.loading")}</div>;
  }

  if (!state.pitchCompleted) {
    return (
      <div className="min-h-screen bg-fog px-sm py-lg">
        <main className="mx-auto max-w-[700px] text-center">
          <h1 className="font-display text-xl font-bold">{t("entrepreneurQuest.pitch.notReadyTitle")}</h1>
          <p className="mt-2xs text-base text-ink/70">{t("entrepreneurQuest.pitch.notReadyHint")}</p>
          <Link href="/entrepreneur-quest/build" className="mt-sm inline-block">
            <Button variant="quest-primary">{t("entrepreneurQuest.pitch.goToBuildButton")}</Button>
          </Link>
        </main>
      </div>
    );
  }

  const { business, stats } = state;
  const currencyCode = progressState.currencyCode;
  const profitMinorUnits = computeProfitMinorUnits(stats);

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main className="mx-auto max-w-[700px]">
        <Link
          href="/entrepreneur-quest"
          className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal transition-colors duration-quick hover:bg-teal/5"
        >
          <span aria-hidden="true">←</span> {t("entrepreneurQuest.backToHub")}
        </Link>

        <h1 className="mt-sm font-display text-2xl font-bold">{t("entrepreneurQuest.pitch.title")}</h1>

        <Card variant="reward" className="mt-md text-center">
          <div className="flex justify-center">
            <EntrepreneurQuestLogo logo={business.logo} size={80} />
          </div>
          <h2 className="mt-2xs font-display text-xl font-bold">{business.businessName || t("entrepreneurQuest.pitch.notSetYet")}</h2>
          {business.slogan && <p className="mt-3xs text-sm italic text-ink/70">"{business.slogan}"</p>}

          <dl className="mt-md grid gap-sm text-left">
            <PitchLine label={t("entrepreneurQuest.pitch.myBusinessIsLabel")} value={business.businessName} />
            <PitchLine label={t("entrepreneurQuest.pitch.itHelpsLabel")} value={business.problem} />
            <PitchLine
              label={t("entrepreneurQuest.pitch.myCustomersAreLabel")}
              value={business.customerCategory ? t(`entrepreneurQuest.customerCategories.${business.customerCategory}`) : ""}
            />
            <PitchLine label={t("entrepreneurQuest.pitch.myProductIsLabel")} value={business.productDescription} />
            <PitchLine
              label={t("entrepreneurQuest.pitch.itCostsMeLabel")}
              value={`${formatCurrency(business.costPerUnitMinorUnits, currencyCode, uiLocale)} ${t("entrepreneurQuest.pitch.perItemSuffix")}`}
            />
            <PitchLine
              label={t("entrepreneurQuest.pitch.iWouldChargeLabel")}
              value={`${formatCurrency(business.priceMinorUnits, currencyCode, uiLocale)} ${t("entrepreneurQuest.pitch.perItemSuffix")}`}
            />
            <PitchLine label={t("entrepreneurQuest.pitch.iCouldMakeLabel")} value={formatCurrency(profitMinorUnits, currencyCode, uiLocale)} />
            <PitchLine label={t("entrepreneurQuest.pitch.reputationLabel")} value={t("entrepreneurQuest.pitch.reputationValue", { stars: stats.reputationOutOf5.toFixed(1) })} />
            <PitchLine label={t("entrepreneurQuest.pitch.whyChooseLabel")} value={business.whyChooseUs} />
            <PitchLine label={t("entrepreneurQuest.pitch.nextStepLabel")} value={business.nextStep} />
          </dl>
        </Card>

        <Link href="/entrepreneur-quest/build" className="mt-sm block">
          <Button variant="secondary" className="w-full">
            {t("entrepreneurQuest.pitch.editBusinessButton")}
          </Button>
        </Link>
      </main>
    </div>
  );
}

function PitchLine({ label, value }: { label: string; value: string }) {
  const t = useTranslations();
  return (
    <div>
      <dt className="text-sm text-ink/60">{label}</dt>
      <dd className="mt-3xs text-base font-medium text-ink">{value || t("entrepreneurQuest.pitch.notSetYet")}</dd>
    </div>
  );
}
