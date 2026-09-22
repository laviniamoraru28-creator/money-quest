"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { formatCurrency, toMinorUnits } from "@/lib/currency/format";
import { computeWeeksToGoal } from "@/lib/local-progress/state";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

export default function GoalsPage() {
  const uiLocale = useLocale();
  const t = useTranslations();
  const { state, isLoaded, createGoal, contributeToGoal, withdrawFromGoal, removeGoal } = useLocalProgress();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");

  if (!isLoaded) return <div className="grid min-h-screen place-items-center bg-fog text-ink/60">{t("common.loading")}</div>;

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main className="mx-auto max-w-[700px]">
        <Link
          href="/play"
          className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal transition-colors duration-quick hover:bg-teal/5"
        >
          <span aria-hidden="true">←</span> {t("nav.backToWorldMap")}
        </Link>
        <h1 className="mt-sm font-display text-2xl font-bold">{t("play.mySavingsGoalsTitle")}</h1>
        <p className="mt-2xs text-sm text-ink/70">{t("play.goalsSavedLocallyHint")}</p>

        <Card variant="data" className="mt-md">
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink/60">{t("play.yourCoins")}</p>
            <button type="button" onClick={() => setShowForm((v) => !v)} className="text-sm font-medium text-teal hover:underline">
              {showForm ? t("common.cancel") : t("play.newGoal")}
            </button>
          </div>
          <p className="font-display text-2xl font-bold text-teal">{formatCurrency(state.walletBalanceMinorUnits, state.currencyCode, uiLocale)}</p>
        </Card>

        {showForm && (
          <Card variant="data" className="mt-sm">
            <label htmlFor="goalName" className="text-sm font-medium">
              {t("play.whatAreYouSavingFor")}
            </label>
            <input
              id="goalName"
              value={name}
              onChange={(e: { target: { value: string } }) => setName(e.target.value)}
              maxLength={60}
              className="mt-2xs min-h-touch-min-child w-full rounded-sm border border-ink/20 px-xs py-2xs"
            />
            <label htmlFor="goalTarget" className="mt-sm block text-sm font-medium">
              {t("play.howMuchToSave")}
            </label>
            <input
              id="goalTarget"
              type="number"
              min="0.01"
              step="0.01"
              value={target}
              onChange={(e: { target: { value: string } }) => setTarget(e.target.value)}
              className="mt-2xs min-h-touch-min-child w-full rounded-sm border border-ink/20 px-xs py-2xs"
            />
            <button
              type="button"
              onClick={() => {
                const amountMajor = Number(target);
                if (!name.trim() || Number.isNaN(amountMajor) || amountMajor <= 0) return;
                createGoal(name.trim(), toMinorUnits(amountMajor, state.currencyCode));
                setName("");
                setTarget("");
                setShowForm(false);
              }}
              className="mt-sm min-h-touch-min-child w-full rounded-lg bg-teal px-md py-xs font-medium text-white shadow-resting hover:bg-teal/90"
            >
              {t("play.startSaving")}
            </button>
          </Card>
        )}

        <div className="mt-sm grid gap-sm">
          {state.goals.length === 0 && <p className="text-base text-ink/60">{t("play.noGoalsYet")}</p>}
          {state.goals.map((goal) => {
            const percent = Math.min(100, Math.round((goal.currentMinorUnits / goal.targetMinorUnits) * 100));
            return (
              <Card key={goal.id} variant="data">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{goal.name}</span>
                  {goal.achievedAt && <span className="rounded-full bg-gold/20 px-2xs py-[1px] text-xs font-medium">🏆 {t("play.achieved")}</span>}
                </div>
                <div className="mt-2xs h-3 w-full">
                  <ProgressBar percent={percent} label={t("play.progressTowardGoal", { goalName: goal.name })} />
                </div>
                <p className="mt-2xs text-sm text-ink/60">
                  {t("play.amountOfTarget", { current: formatCurrency(goal.currentMinorUnits, state.currencyCode, uiLocale), target: formatCurrency(goal.targetMinorUnits, state.currencyCode, uiLocale) })}
                </p>
                {!goal.achievedAt && (
                  <>
                    <ContributeRow goal={goal} currencyCode={state.currencyCode} onContribute={(minorUnits) => contributeToGoal(goal.id, minorUnits)} />
                    <SavingPlanner
                      remainingMinorUnits={Math.max(0, goal.targetMinorUnits - goal.currentMinorUnits)}
                      currencyCode={state.currencyCode}
                      uiLocale={uiLocale}
                    />
                    {goal.currentMinorUnits > 0 && (
                      <WithdrawRow
                        goal={goal}
                        currencyCode={state.currencyCode}
                        onWithdraw={(minorUnits) => withdrawFromGoal(goal.id, minorUnits)}
                      />
                    )}
                  </>
                )}
                <button type="button" onClick={() => removeGoal(goal.id)} className="mt-2xs text-xs text-ink/40 hover:text-error">
                  {t("play.removeGoal")}
                </button>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function ContributeRow({ goal, currencyCode, onContribute }: { goal: { id: string }; currencyCode: string; onContribute: (minorUnits: number) => void }) {
  const t = useTranslations();
  const [amount, setAmount] = useState("");
  return (
    <div className="mt-sm flex items-center gap-2xs">
      <label htmlFor={`contribute-${goal.id}`} className="sr-only">
        {t("play.amountToAdd")}
      </label>
      <input
        id={`contribute-${goal.id}`}
        type="number"
        min="0.01"
        step="0.01"
        value={amount}
        onChange={(e: { target: { value: string } }) => setAmount(e.target.value)}
        placeholder={t("play.amount")}
        className="w-24 min-h-touch-min-child rounded-sm border border-ink/20 px-2xs py-3xs"
      />
      <button
        type="button"
        onClick={() => {
          const major = Number(amount);
          if (Number.isNaN(major) || major <= 0) return;
          onContribute(toMinorUnits(major, currencyCode));
          setAmount("");
        }}
        className="min-h-touch-min-child rounded-sm border-2 border-teal px-sm py-2xs text-sm font-medium text-teal hover:bg-teal/5"
      >
        {t("play.addCoins")}
      </button>
    </div>
  );
}

/**
 * "Savings Goal Adventure" experimentation panel — the part of the
 * brief that a create-and-contribute form alone doesn't cover: letting
 * a child try out a hypothetical weekly saving rate and immediately
 * see how long the goal would take, with a couple of quick presets so
 * comparing "save more vs. save less" doesn't require typing two
 * different numbers by hand. computeWeeksToGoal is a pure calculation
 * (see state.ts) — nothing here writes to progress state, so
 * experimenting costs nothing and never risks the child's real goal.
 */
function SavingPlanner({ remainingMinorUnits, currencyCode, uiLocale }: { remainingMinorUnits: number; currencyCode: string; uiLocale: string }) {
  const t = useTranslations();
  const [weeklyAmount, setWeeklyAmount] = useState("");
  const weeklyMajor = Number(weeklyAmount);
  const weeklyMinorUnits = !Number.isNaN(weeklyMajor) && weeklyMajor > 0 ? toMinorUnits(weeklyMajor, currencyCode) : 0;
  const weeks = computeWeeksToGoal(remainingMinorUnits, weeklyMinorUnits);

  // Presets scale with the goal itself rather than being fixed numbers,
  // so "small/medium/large" means something sensible whether the
  // remaining amount is a few coins or a much bigger goal.
  const presetMajors = [0.05, 0.1, 0.2]
    .map((fraction) => Math.max(1, Math.round((remainingMinorUnits * fraction) / 100) * 100))
    .map((minor) => minor / 100)
    .filter((value, index, arr) => arr.indexOf(value) === index);

  return (
    <div className="mt-sm border-t border-ink/10 pt-sm">
      <p className="text-sm font-medium">{t("play.planYourSavingTitle")}</p>
      <div className="mt-2xs flex items-center gap-2xs">
        <label htmlFor={`plan-${currencyCode}-${remainingMinorUnits}`} className="sr-only">
          {t("play.weeklyAmountLabel")}
        </label>
        <input
          id={`plan-${currencyCode}-${remainingMinorUnits}`}
          type="number"
          min="0.01"
          step="0.01"
          value={weeklyAmount}
          onChange={(e: { target: { value: string } }) => setWeeklyAmount(e.target.value)}
          placeholder={t("play.weeklyAmountPlaceholder")}
          className="w-28 min-h-touch-min-child rounded-sm border border-ink/20 px-2xs py-3xs"
        />
        <div className="flex gap-3xs">
          {presetMajors.map((major) => (
            <button
              key={major}
              type="button"
              onClick={() => setWeeklyAmount(String(major))}
              className="min-h-touch-min-child rounded-sm border border-ink/15 px-2xs py-3xs text-xs text-ink/70 hover:border-teal hover:text-teal"
            >
              {formatCurrency(toMinorUnits(major, currencyCode), currencyCode, uiLocale)}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-2xs text-sm text-ink/70" aria-live="polite">
        {weeks === null
          ? t("play.planYourSavingPrompt")
          : weeks === 0
            ? t("play.planYourSavingReached")
            : t("play.planYourSavingResult", { weeks })}
      </p>
    </div>
  );
}

function WithdrawRow({ goal, currencyCode, onWithdraw }: { goal: { id: string; currentMinorUnits: number }; currencyCode: string; onWithdraw: (minorUnits: number) => void }) {
  const t = useTranslations();
  const [amount, setAmount] = useState("");
  return (
    <div className="mt-2xs">
      <p className="text-xs text-ink/50">{t("play.whatIfYouSpendSome")}</p>
      <div className="mt-3xs flex items-center gap-2xs">
        <label htmlFor={`withdraw-${goal.id}`} className="sr-only">
          {t("play.amountToWithdraw")}
        </label>
        <input
          id={`withdraw-${goal.id}`}
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e: { target: { value: string } }) => setAmount(e.target.value)}
          placeholder={t("play.amount")}
          className="w-24 min-h-touch-min-child rounded-sm border border-ink/20 px-2xs py-3xs"
        />
        <button
          type="button"
          onClick={() => {
            const major = Number(amount);
            if (Number.isNaN(major) || major <= 0) return;
            onWithdraw(toMinorUnits(major, currencyCode));
            setAmount("");
          }}
          className="min-h-touch-min-child rounded-sm border border-ink/20 px-sm py-2xs text-sm font-medium text-ink/70 hover:border-ink/40"
        >
          {t("play.spendSome")}
        </button>
      </div>
    </div>
  );
}
