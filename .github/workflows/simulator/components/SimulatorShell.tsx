"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { SimScenario, SimRunningState, WeekAllocation } from "../types";
import { createInitialState } from "../types";
import { applyWeek, getSpendableIncome } from "../engine";
import { formatCurrency } from "@/lib/currency/format";
import { WeekAllocationPanel } from "./WeekAllocationPanel";
import { EventCard } from "./EventCard";
import { WeekSummaryCard } from "./WeekSummaryCard";
import { FinalReportCard } from "./FinalReportCard";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface SimulatorShellProps {
  scenario: SimScenario;
  currencyCode: string;
  simulationActivityId: string;
  backHref: string;
  /** Same decoupled-from-storage callback pattern as GameShell and
   * LessonPlayer — not yet wired to a page (the Simulator's local-
   * storage port is a documented follow-up, not done this session; see
   * docs/final-architecture-report.md), but this component itself no
   * longer depends on the deleted account/database Server Action
   * either way. */
  onComplete: (activityId: string, wasCorrect: boolean, xpReward: number, coinRewardMinorUnits: number) => { xpAwarded: number; coinsAwarded: number };
}

type Phase = "allocating" | "awaiting-choice" | "week-summary" | "finished";

/**
 * The one component every Money Life Simulator scenario runs through —
 * same relationship to scenarios as GameShell has to games (see
 * docs/money-simulator.md). A new scenario is a new SimScenario config
 * object; this component never changes to add one.
 */
export function SimulatorShell({ scenario, currencyCode, simulationActivityId, backHref, onComplete }: SimulatorShellProps) {
  const router = useRouter();
  const uiLocale = useLocale();
  const t = useTranslations();
  const [state, setState] = useState<SimRunningState>(() => createInitialState(scenario));
  const [phase, setPhase] = useState<Phase>("allocating");
  const [pendingAllocation, setPendingAllocation] = useState<WeekAllocation | null>(null);
  const [isAwarding, setIsAwarding] = useState(false);
  const [award, setAward] = useState<{ xp: number; coins: number } | null>(null);

  const week = scenario.weeks[state.weekIndex];

  async function finishSimulation() {
    setPhase("finished");
    setIsAwarding(true);
    // xpReward/coinRewardMinorUnits are hardcoded here rather than
    // read from a config, matching how this component's completion
    // reward already worked before this decoupling — a real config-
    // driven reward is part of the same follow-up as the local-storage
    // port itself, not introduced or removed by this refactor.
    const result = await Promise.resolve(onComplete(simulationActivityId, true, 30, 1000));
    setIsAwarding(false);
    setAward({ xp: result.xpAwarded, coins: result.coinsAwarded });
  }

  function resolveWeek(allocation: WeekAllocation, eventChoiceKey?: string) {
    if (!week) return;
    const result = applyWeek(state, scenario, week, allocation, eventChoiceKey);
    setState(result.newState);
    setPendingAllocation(null);
    setPhase("week-summary");
  }

  function handleAllocationConfirm(allocation: WeekAllocation) {
    if (!week) return;
    if (week.event?.type === "opportunity") {
      setPendingAllocation(allocation);
      setPhase("awaiting-choice");
    } else {
      resolveWeek(allocation);
    }
  }

  function handleEventChoice(choiceKey: string) {
    if (!pendingAllocation) return;
    resolveWeek(pendingAllocation, choiceKey);
  }

  function handleContinue() {
    if (state.weekIndex >= scenario.weeks.length) {
      void finishSimulation();
    } else {
      setPhase("allocating");
    }
  }

  if (phase === "finished") {
    if (isAwarding || !award) {
      return <p className="text-center text-base text-ink/70">{t("simulator.addingUpReport")}</p>;
    }
    return (
      <FinalReportCard
        state={state}
        scenario={scenario}
        currencyCode={currencyCode}
        uiLocale={uiLocale}
        award={award}
        onDone={() => router.push(backHref)}
      />
    );
  }

  if (!week) {
    // Unreachable in normal play: weekIndex only ever advances up to
    // scenario.weeks.length via resolveWeek, and reaching that exact
    // value routes to the "finished" phase above before this render is
    // ever reached with no week available.
    return null;
  }

  const spendableIncome = getSpendableIncome(week);
  const lastLogEntry = state.log[state.log.length - 1];

  return (
    <div className="flex flex-col gap-sm">
      <div>
        <p className="text-sm text-ink/70">
          {t("simulator.weekOf", { week: week.weekLabel, total: scenario.weeks.length })}
        </p>
        <div className="mt-3xs h-2 w-full">
          <ProgressBar percent={((state.weekIndex + 1) / scenario.weeks.length) * 100} label={t("simulator.weekProgressLabel")} />
        </div>
      </div>

      <div className="rounded-md border border-ink/10 bg-white p-sm text-center">
        <p className="text-sm text-ink/70">{t("simulator.youReceiveThisWeek")}</p>
        <p className="font-display text-3xl font-bold text-teal">{formatCurrency(week.incomeMinorUnits, currencyCode, uiLocale)}</p>
        {week.event?.type === "windfall" && (
          <p className="mt-2xs text-sm font-medium text-gold-text">
            {t("simulator.bonusThisWeek", { amount: formatCurrency(week.event.bonusMinorUnits ?? 0, currencyCode, uiLocale) })}
          </p>
        )}
      </div>

      {week.event && (week.event.type === "expense" || week.event.type === "windfall") && (
        <EventCard event={week.event} currencyCode={currencyCode} uiLocale={uiLocale} hasChosen />
      )}

      {phase === "allocating" && (
        <WeekAllocationPanel
          spendableIncomeMinorUnits={spendableIncome}
          currencyCode={currencyCode}
          uiLocale={uiLocale}
          onConfirm={handleAllocationConfirm}
        />
      )}

      {phase === "awaiting-choice" && week.event?.type === "opportunity" && (
        <EventCard event={week.event} currencyCode={currencyCode} uiLocale={uiLocale} onChoose={handleEventChoice} hasChosen={false} />
      )}

      {phase === "week-summary" && lastLogEntry && (
        <WeekSummaryCard
          entry={lastLogEntry}
          currencyCode={currencyCode}
          uiLocale={uiLocale}
          newBalanceMinorUnits={state.balanceMinorUnits}
          onContinue={handleContinue}
          isLastWeek={state.weekIndex >= scenario.weeks.length}
        />
      )}
    </div>
  );
}
