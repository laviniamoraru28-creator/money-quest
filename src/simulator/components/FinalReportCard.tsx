import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/currency/format";
import type { SimRunningState, SimScenario } from "../types";
import { generateReportInsights } from "../report";
import { useSound } from "@/lib/audio/use-sound";

interface FinalReportCardProps {
  state: SimRunningState;
  scenario: SimScenario;
  currencyCode: string;
  uiLocale: string;
  award: { xp: number; coins: number } | null;
  onDone: () => void;
}

export function FinalReportCard({ state, scenario, currencyCode, uiLocale, award, onDone }: FinalReportCardProps) {
  const t = useTranslations();
  const { playComplete, playGoalReached } = useSound();
  const insights = generateReportInsights(state, scenario, t);
  const fmt = (v: number) => formatCurrency(v, currencyCode, uiLocale);
  const goalPercent = Math.round((state.goalProgressMinorUnits / scenario.savingsGoal.targetMinorUnits) * 100);
  const goalReached = state.goalProgressMinorUnits >= scenario.savingsGoal.targetMinorUnits;

  // Plays once, when this report first mounts (i.e. exactly when the
  // Simulator scenario finishes) — not on every re-render, since props
  // like `award` can update after the initial mount while the reward
  // is being calculated. A distinct, slightly fuller sound plays if
  // the child actually reached their savings goal, matching the same
  // "meaningful milestone" restraint as playGoalReached's own doc
  // comment in sound-manager.ts.
  useEffect(() => {
    if (goalReached) {
      playGoalReached();
    } else {
      playComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-lg border border-ink/10 bg-white p-md">
      <h2 className="font-display text-2xl font-bold">{t("simulator.reportTitle")}</h2>
      <p className="mt-2xs text-base text-ink/70">{t("simulator.reportSubtitle", { weeks: scenario.weeks.length })}</p>

      {/* Required figures: starting balance, income, spending, savings, remaining balance, goal progress */}
      <div className="mt-md grid grid-cols-2 gap-sm sm:grid-cols-3">
        <Stat label={t("simulator.startingBalance")} value={fmt(scenario.startingBalanceMinorUnits)} />
        <Stat label={t("simulator.incomeReceived")} value={fmt(state.totalIncomeMinorUnits)} />
        <Stat label={t("simulator.spentOnNeeds")} value={fmt(state.totalNeedsMinorUnits)} />
        <Stat label={t("simulator.spentOnWants")} value={fmt(state.totalWantsMinorUnits)} />
        <Stat label={t("simulator.given")} value={fmt(state.totalGivingMinorUnits)} />
        <Stat label={t("simulator.saved")} value={fmt(state.totalSavingsMinorUnits)} />
        <Stat label={t("simulator.remainingBalance")} value={fmt(state.balanceMinorUnits)} highlight />
        <Stat
          label={t("simulator.goalLabel", { name: scenario.savingsGoal.name })}
          value={`${fmt(state.goalProgressMinorUnits)} / ${fmt(scenario.savingsGoal.targetMinorUnits)} (${Math.min(goalPercent, 100)}%)`}
        />
      </div>

      <div className="mt-md">
        <h3 className="font-display text-lg font-bold">{t("simulator.whatThisShows")}</h3>
        <ul className="mt-2xs grid gap-2xs">
          {insights.map((insight, i) => (
            <li key={i} className="rounded-sm bg-fog p-sm text-base text-ink/80">
              {insight}
            </li>
          ))}
        </ul>
      </div>

      {award && (award.xp > 0 || award.coins > 0) && (
        <div className="mt-md flex items-center gap-md rounded-sm border border-gold/40 bg-gold/10 p-sm">
          <span className="font-bold text-teal">{t("lesson.xpEarned", { xp: award.xp })}</span>
          <span className="flex flex-col items-start">
            <span className="text-xs font-normal text-ink/60">{t("lesson.virtualCoinsLabel")}</span>
            <span className="font-bold text-ink">+{fmt(award.coins)}</span>
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={onDone}
        className="mt-md min-h-touch-min-child w-full rounded-lg bg-teal px-md py-xs font-medium text-white shadow-resting"
      >
        {t("simulator.backToMyWorld")}
      </button>
    </div>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={["rounded-sm border p-xs", highlight ? "border-teal bg-teal/5" : "border-ink/10"].join(" ")}>
      <p className="text-sm text-ink/70">{label}</p>
      <p className={["mt-3xs font-bold tabular-nums", highlight ? "text-teal" : "text-ink"].join(" ")}>{value}</p>
    </div>
  );
}
