"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { useEntrepreneurQuest } from "@/lib/entrepreneur-quest/use-entrepreneur-quest";
import { EQ_STAGES, EQ_REAL_WORLD_MISSION_IDS, EQ_BADGE_IDS } from "@/content/entrepreneur-quest/structures";
import { formatCurrency } from "@/lib/currency/format";
import { computeProfitMinorUnits } from "@/lib/entrepreneur-quest/state";
import type { EntrepreneurQuestState } from "@/lib/entrepreneur-quest/state";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EntrepreneurQuestLogo } from "@/components/entrepreneur-quest/EntrepreneurQuestLogo";
import { DashboardExpander } from "@/components/entrepreneur-quest/DashboardExpander";

const EQ_BADGE_ID_LIST = Object.values(EQ_BADGE_IDS);

export default function EntrepreneurQuestHubPage() {
  const uiLocale = useLocale();
  const t = useTranslations();
  const { state: progressState, isLoaded: progressLoaded } = useLocalProgress();
  const { state, isLoaded, toggleRealWorldMission, updateBusinessField } = useEntrepreneurQuest();

  if (!isLoaded || !progressLoaded) {
    return <div className="grid min-h-screen place-items-center bg-fog text-ink/60">{t("common.loading")}</div>;
  }

  const stageCount = state.completedStageIds.length;
  const totalStages = EQ_STAGES.length;
  const hasStarted = stageCount > 0;
  const isPitchReady = state.completedStageIds.includes("create-your-final-pitch");
  const earnedEQBadges = EQ_BADGE_ID_LIST.filter((id) => progressState.earnedBadgeIds.includes(id));
  const currencyCode = progressState.currencyCode;

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main className="mx-auto max-w-[700px]">
        <div className="flex flex-wrap gap-2xs">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal transition-colors duration-quick hover:bg-teal/5"
          >
            <span aria-hidden="true">🏠</span> {t("nav.home")}
          </Link>
          <Link
            href="/play"
            className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal transition-colors duration-quick hover:bg-teal/5"
          >
            {t("play.yourWorldMap")}
          </Link>
        </div>

        <h1 className="mt-sm font-display text-2xl font-bold">{t("entrepreneurQuest.hubTitle")}</h1>
        <p className="mt-2xs text-base text-ink/70">{t("entrepreneurQuest.hubIntro")}</p>
        <p className="mt-2xs text-xs text-ink/50">{t("entrepreneurQuest.virtualMoneyExplainer")}</p>

        {hasStarted && (
          <PhaseProgressStrip buildDone={state.pitchCompleted} rescueGrowUnlocked={state.completedProblemIds.length > 0} />
        )}

        {hasStarted ? (
          <CompanyDashboard
            state={state}
            currencyCode={currencyCode}
            uiLocale={uiLocale}
            stageCount={stageCount}
            totalStages={totalStages}
            onSaveGoal={(goal) => updateBusinessField("goal", goal)}
          />
        ) : (
          <Card variant="data" className="mt-md">
            <p className="text-sm text-ink/60">{t("entrepreneurQuest.myBusinessTitle")}</p>
            <p className="mt-2xs text-base text-ink/70">{t("entrepreneurQuest.myBusinessEmptyHint")}</p>
            <Link href="/entrepreneur-quest/build" className="mt-sm block">
              <Button variant="quest-primary" className="w-full">
                {t("entrepreneurQuest.startBuildingButton")}
              </Button>
            </Link>
          </Card>
        )}

        <div className="mt-sm grid gap-sm sm:grid-cols-3">
          <Link href="/entrepreneur-quest/simulator" className="flex items-center gap-xs rounded-lg border-2 border-ink/10 bg-white p-sm shadow-resting transition-shadow hover:shadow-floating hover:border-teal">
            <span aria-hidden="true" className="text-2xl">🧮</span>
            <span className="font-medium">{t("entrepreneurQuest.simulatorLink")}</span>
          </Link>
          <Link href="/entrepreneur-quest/challenges" className="flex items-center gap-xs rounded-lg border-2 border-ink/10 bg-white p-sm shadow-resting transition-shadow hover:shadow-floating hover:border-teal">
            <span aria-hidden="true" className="text-2xl">🧩</span>
            <span className="font-medium">{t("entrepreneurQuest.challengesLink")}</span>
          </Link>
          {isPitchReady ? (
            <Link href="/entrepreneur-quest/pitch" className="flex items-center gap-xs rounded-lg border-2 border-ink/10 bg-white p-sm shadow-resting transition-shadow hover:shadow-floating hover:border-teal">
              <span aria-hidden="true" className="text-2xl">📇</span>
              <span className="font-medium">{t("entrepreneurQuest.pitchLink")}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-xs rounded-lg border-2 border-ink/10 bg-white/60 p-sm opacity-60">
              <span aria-hidden="true" className="text-2xl">📇</span>
              <span className="text-sm text-ink/60">{t("entrepreneurQuest.pitchLinkLockedHint")}</span>
            </div>
          )}
          {state.pitchCompleted ? (
            <Link href="/entrepreneur-quest/run" className="flex items-center gap-xs rounded-lg border-2 border-ink/10 bg-white p-sm shadow-resting transition-shadow hover:shadow-floating hover:border-teal">
              <span aria-hidden="true" className="text-2xl">🏃</span>
              <span className="font-medium">{t("entrepreneurQuest.run.hubTitle")}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-xs rounded-lg border-2 border-ink/10 bg-white/60 p-sm opacity-60">
              <span aria-hidden="true" className="text-2xl">🏃</span>
              <span className="text-sm text-ink/60">{t("entrepreneurQuest.run.lockedHint")}</span>
            </div>
          )}
          {state.completedProblemIds.length > 0 ? (
            <Link href="/entrepreneur-quest/rescue-grow" className="flex items-center gap-xs rounded-lg border-2 border-ink/10 bg-white p-sm shadow-resting transition-shadow hover:shadow-floating hover:border-teal">
              <span aria-hidden="true" className="text-2xl">🚀</span>
              <span className="font-medium">{t("entrepreneurQuest.rescueGrow.hubTitle")}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-xs rounded-lg border-2 border-ink/10 bg-white/60 p-sm opacity-60">
              <span aria-hidden="true" className="text-2xl">🚀</span>
              <span className="text-sm text-ink/60">{t("entrepreneurQuest.rescueGrow.lockedHint")}</span>
            </div>
          )}
        </div>

        <Card variant="data" className="mt-md">
          <p className="font-medium">{t("entrepreneurQuest.badgesEarnedTitle")}</p>
          {earnedEQBadges.length === 0 ? (
            <p className="mt-2xs text-sm text-ink/60">{t("entrepreneurQuest.noBadgesYetHint")}</p>
          ) : (
            <div className="mt-2xs flex flex-wrap gap-2xs">
              {earnedEQBadges.map((badgeId) => (
                <span key={badgeId} className="rounded-full bg-gold/20 px-sm py-3xs text-sm font-medium">
                  🏅 {t(`entrepreneurQuest.badges.${badgeId}.name`)}
                </span>
              ))}
            </div>
          )}
        </Card>

        <Card variant="data" className="mt-sm">
          <p className="font-medium">{t("entrepreneurQuest.realWorldMissionsTitle")}</p>
          <p className="mt-2xs text-sm text-ink/60">{t("entrepreneurQuest.realWorldMissionsHint")}</p>
          <div className="mt-sm grid gap-2xs">
            {EQ_REAL_WORLD_MISSION_IDS.map((missionId) => {
              const isDone = state.realWorldMissionsDone.includes(missionId);
              return (
                <label key={missionId} className="flex min-h-touch-min-child cursor-pointer items-start gap-xs rounded-sm border border-ink/10 p-xs">
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => toggleRealWorldMission(missionId)}
                    className="mt-3xs h-5 w-5 shrink-0"
                    aria-label={t("entrepreneurQuest.realWorldMissionDoneLabel")}
                  />
                  <span className={["text-sm", isDone ? "text-ink/50 line-through" : "text-ink/80"].join(" ")}>
                    {t(`entrepreneurQuest.realWorldMissions.${missionId}`)}
                  </span>
                </label>
              );
            })}
          </div>
        </Card>

        {hasStarted && (
          <div className="mt-md flex justify-end">
            <ResetBusinessButton />
          </div>
        )}
      </main>
    </div>
  );
}

/** A small Build -> Run -> Rescue & Grow progress strip (v2) — purely
 * informational, matches the brief's own phase names, computed from
 * existing state (pitchCompleted, completedProblemIds) rather than a
 * new stored "current phase" field, so there's only ever one source
 * of truth for how far along the child is. */
function PhaseProgressStrip({ buildDone, rescueGrowUnlocked }: { buildDone: boolean; rescueGrowUnlocked: boolean }) {
  const t = useTranslations();
  return (
    <div className="mt-sm flex flex-wrap items-center gap-2xs text-sm">
      <PhaseChip label={t("entrepreneurQuest.phases.build")} done={buildDone} locked={false} />
      <span aria-hidden="true" className="text-ink/30">
        →
      </span>
      <PhaseChip label={t("entrepreneurQuest.phases.run")} done={false} locked={!buildDone} />
      <span aria-hidden="true" className="text-ink/30">
        →
      </span>
      <PhaseChip label={t("entrepreneurQuest.phases.rescueGrow")} done={false} locked={!rescueGrowUnlocked} />
    </div>
  );
}

function PhaseChip({ label, done, locked }: { label: string; done: boolean; locked: boolean }) {
  return (
    <span
      className={[
        "rounded-full px-sm py-3xs font-medium",
        done ? "bg-success/15 text-success" : locked ? "bg-ink/5 text-ink/40" : "bg-teal/10 text-teal",
      ].join(" ")}
    >
      {done ? "✓ " : ""}
      {label}
    </span>
  );
}

/**
 * The Company Dashboard: the ONE persistent place a child returns to and
 * sees their own business exactly as it stands right now. Every value
 * here reads straight from the saved EntrepreneurQuestState - nothing on
 * this card is hard-coded - so it updates automatically as stages are
 * completed, decisions are made, and simulator runs accumulate into the
 * company's running stats.
 */
function CompanyDashboard({
  state,
  currencyCode,
  uiLocale,
  stageCount,
  totalStages,
  onSaveGoal,
}: {
  state: EntrepreneurQuestState;
  currencyCode: string;
  uiLocale: string;
  stageCount: number;
  totalStages: number;
  onSaveGoal: (goal: string) => void;
}) {
  const t = useTranslations();
  const { business, stats } = state;
  const notSetYet = t("entrepreneurQuest.pitch.notSetYet");
  const profitPerSaleMinorUnits = business.priceMinorUnits - business.costPerUnitMinorUnits;
  const profitMinorUnits = computeProfitMinorUnits(stats);
  const [goalDraft, setGoalDraft] = useState(business.goal);
  const goalChanged = goalDraft !== business.goal;

  return (
    <Card variant="reward" className="mt-md">
      <p className="text-sm font-medium uppercase tracking-wide text-ink/50">{t("entrepreneurQuest.dashboard.title")}</p>

      <div className="mt-2xs flex items-center gap-sm">
        <EntrepreneurQuestLogo logo={business.logo} size={72} />
        <div>
          <p className="font-display text-xl font-bold text-teal">{business.businessName || notSetYet}</p>
          {business.slogan && <p className="text-sm italic text-ink/70">&ldquo;{business.slogan}&rdquo;</p>}
        </div>
      </div>

      <div className="mt-2xs h-2 w-full">
        <ProgressBar percent={(stageCount / totalStages) * 100} label={t("entrepreneurQuest.stageProgress", { current: stageCount, total: totalStages })} />
      </div>
      <p className="mt-2xs text-xs text-ink/50">{t("entrepreneurQuest.stageProgress", { current: stageCount, total: totalStages })}</p>

      <dl className="mt-sm grid grid-cols-2 gap-sm">
        <DashboardStat
          label={t("entrepreneurQuest.dashboard.productLabel")}
          value={business.productCategory ? t(`entrepreneurQuest.productCategories.${business.productCategory}`) : notSetYet}
        />
        <DashboardStat
          label={t("entrepreneurQuest.dashboard.customersLabel")}
          value={business.customerCategory ? t(`entrepreneurQuest.customerCategories.${business.customerCategory}`) : notSetYet}
        />
        <DashboardStat label={t("entrepreneurQuest.dashboard.priceLabel")} value={formatCurrency(business.priceMinorUnits, currencyCode, uiLocale)} />
        <DashboardStat label={t("entrepreneurQuest.dashboard.costLabel")} value={formatCurrency(business.costPerUnitMinorUnits, currencyCode, uiLocale)} />
        <DashboardStat label={t("entrepreneurQuest.dashboard.profitPerSaleLabel")} value={formatCurrency(profitPerSaleMinorUnits, currencyCode, uiLocale)} />
        <DashboardStat label={t("entrepreneurQuest.dashboard.salesLabel")} value={String(stats.salesCount)} />
        <DashboardStat label={t("entrepreneurQuest.dashboard.revenueLabel")} value={formatCurrency(stats.revenueMinorUnits, currencyCode, uiLocale)} />
        <DashboardStat label={t("entrepreneurQuest.dashboard.costsLabel")} value={formatCurrency(stats.costsMinorUnits, currencyCode, uiLocale)} />
        <DashboardStat label={t("entrepreneurQuest.dashboard.profitLabel")} value={formatCurrency(profitMinorUnits, currencyCode, uiLocale)} />
        <DashboardStat
          label={t("entrepreneurQuest.dashboard.reputationLabel")}
          value={`⭐ ${t("entrepreneurQuest.dashboard.reputationValue", { stars: stats.reputationOutOf5.toFixed(1) })}`}
        />
      </dl>

      <DashboardExpander>
        <dl className="grid grid-cols-2 gap-sm">
          <DashboardStat label={t("entrepreneurQuest.dashboard.cashLabel")} value={formatCurrency(stats.cashMinorUnits, currencyCode, uiLocale)} />
          <DashboardStat label={t("entrepreneurQuest.dashboard.customersTotalLabel")} value={String(stats.customersTotal)} />
          <DashboardStat label={t("entrepreneurQuest.dashboard.repeatCustomersLabel")} value={String(stats.repeatCustomers)} />
          <DashboardStat label={t("entrepreneurQuest.dashboard.stockLabel")} value={t(`entrepreneurQuest.levels.${stats.stockLevel}`)} />
          <DashboardStat label={t("entrepreneurQuest.dashboard.demandLabel")} value={t(`entrepreneurQuest.demandLevels.${stats.demandLevel}`)} />
        </dl>
      </DashboardExpander>

      <label htmlFor="eq-dashboard-goal" className="mt-sm block text-sm font-medium">
        {t("entrepreneurQuest.dashboard.goalLabel")}
      </label>
      <div className="mt-2xs flex gap-2xs">
        <input
          id="eq-dashboard-goal"
          type="text"
          value={goalDraft}
          onChange={(e: { target: { value: string } }) => setGoalDraft(e.target.value)}
          placeholder={t("entrepreneurQuest.dashboard.goalPlaceholder")}
          maxLength={60}
          className="w-full rounded-sm border border-ink/20 px-xs py-2xs"
        />
        {goalChanged && (
          <Button variant="quest-primary" onClick={() => onSaveGoal(goalDraft)}>
            {t("entrepreneurQuest.dashboard.saveGoalButton")}
          </Button>
        )}
      </div>

      <Link href="/entrepreneur-quest/build" className="mt-sm block">
        <Button variant="secondary" className="w-full">
          {t("entrepreneurQuest.continueBuildingButton")}
        </Button>
      </Link>
    </Card>
  );
}

function DashboardStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink/60">{label}</dt>
      <dd className="mt-3xs text-base font-medium text-ink">{value}</dd>
    </div>
  );
}

function ResetBusinessButton() {
  const t = useTranslations();
  const { resetBusiness } = useEntrepreneurQuest();
  return (
    <Button
      type="button"
      variant="destructive"
      onClick={() => {
        if (window.confirm(t("entrepreneurQuest.resetBusinessConfirm"))) {
          resetBusiness();
        }
      }}
    >
      {t("entrepreneurQuest.resetBusinessButton")}
    </Button>
  );
}
