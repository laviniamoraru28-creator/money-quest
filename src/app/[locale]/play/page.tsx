"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { WORLDS } from "@/content/worlds";
import { getWorldCatalog } from "@/content/catalog";
import { formatCurrency } from "@/lib/currency/format";
import { CURRENCIES } from "@/data/currencies";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { LevelProgressRing } from "@/components/ui/LevelProgressRing";
import { LevelBadgeStar } from "@/components/ui/LevelBadgeStar";
import { CharacterPip } from "@/components/characters/CharacterPip";
import type { AgeBand } from "@/types/database.types";

/**
 * The entire entry point to the app, replacing signup, login, and the
 * 4-step onboarding wizard — no account, no server round-trip. A level
 * choice is a local, unsaved-until-picked UI preference (stored only
 * in this browser's localStorage), exactly as requested: "This
 * selection must not be stored on the server and must not identify
 * the child." There is genuinely nowhere for it to be stored except
 * here, since there is no longer a server-side profile of any kind to
 * store it in.
 */
const LEVEL_OPTIONS: { ageBand: AgeBand; labelKey: string; rangeKey: string }[] = [
  { ageBand: "explorer", labelKey: "play.earlyLearner", rangeKey: "play.earlyLearnerRange" },
  { ageBand: "builder", labelKey: "play.primary", rangeKey: "play.primaryRange" },
  { ageBand: "strategist", labelKey: "play.olderLearner", rangeKey: "play.olderLearnerRange" },
];

export default function PlayPage() {
  const uiLocale = useLocale();
  const t = useTranslations();
  const { state, isLoaded, level, setAgeBand, setCurrencyCode } = useLocalProgress();

  if (!isLoaded) {
    return <div className="grid min-h-screen place-items-center bg-fog text-ink/60">{t("common.loading")}</div>;
  }

  if (!state.ageBand) {
    return (
      <div className="min-h-screen bg-fog px-sm py-lg">
        <main className="mx-auto max-w-lg text-center">
          <div className="flex justify-center">
            <CharacterPip size={80} />
          </div>
          <h1 className="mt-sm font-display text-2xl font-bold">{t("play.chooseYourLevel")}</h1>
          <p className="mt-2xs text-base text-ink/70">{t("play.levelChoiceHint")}</p>
          <div className="mt-md grid gap-sm">
            {LEVEL_OPTIONS.map((option) => (
              <button
                key={option.ageBand}
                type="button"
                onClick={() => setAgeBand(option.ageBand)}
                className="min-h-touch-min-child rounded-lg border-2 border-ink/20 bg-white p-md text-left shadow-resting hover:border-teal hover:bg-teal/5"
              >
                <span className="font-display text-lg font-bold">{t(option.labelKey)}</span>
                <span className="ml-2xs text-sm text-ink/60">{t(option.rangeKey)}</span>
              </button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main className="mx-auto max-w-[900px]">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">{t("play.yourWorldMap")}</h1>
          <button type="button" onClick={() => setAgeBand(null)} className="text-sm text-teal hover:underline">
            {t("play.changeLevel")}
          </button>
        </div>

        <div className="mt-sm grid gap-sm sm:grid-cols-3">
          <Card variant="data">
            <p className="text-sm text-ink/60">{t("dashboard.level")}</p>
            <p className="mt-2xs font-display text-2xl font-bold">{level}</p>
            <div className="mt-2xs h-2 w-full">
              <ProgressBar percent={state.xpTotal % 100} label={t("a11y.xpProgressLabel")} />
            </div>
          </Card>
          <Card variant="data">
            <p className="text-sm text-ink/60">{t("play.yourCoins")}</p>
            <p className="mt-2xs font-display text-2xl font-bold text-teal">
              {formatCurrency(state.walletBalanceMinorUnits, state.currencyCode, uiLocale)}
            </p>
          </Card>
          <Card variant="data">
            <label htmlFor="currency-select" className="text-sm text-ink/60">
              {t("play.currency")}
            </label>
            <select
              id="currency-select"
              value={state.currencyCode}
              onChange={(e: { target: { value: string } }) => setCurrencyCode(e.target.value)}
              className="mt-2xs w-full rounded-sm border border-ink/20 px-2xs py-2xs"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.symbol})
                </option>
              ))}
            </select>
          </Card>
        </div>

        <p className="mt-sm text-xs text-ink/50">{t("play.virtualMoneyExplainer")}</p>

        <div className="mt-md grid gap-sm sm:grid-cols-2">
          {WORLDS.map((world) => {
            const catalog = getWorldCatalog(world.id, state.ageBand as AgeBand, t);
            const completedCount = catalog.filter((entry) => state.completedActivityIds.includes(entry.id)).length;
            const percent = catalog.length > 0 ? (completedCount / catalog.length) * 100 : 0;
            const isComplete = catalog.length > 0 && completedCount === catalog.length;
            return (
              <Link
                key={world.id}
                href={`/play/world/${world.id}`}
                className="flex items-center gap-sm rounded-lg border-2 p-md shadow-resting transition-shadow hover:shadow-floating"
                style={{ borderColor: world.themeColor }}
              >
                <LevelProgressRing percent={percent} color={world.themeColor} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink/50">
                    {t("play.levelLabel", { number: world.orderIndex })}
                  </p>
                  <h2 className="font-display text-lg font-bold leading-tight">{t(`levels.${world.id}`)}</h2>
                  <p className="text-sm text-ink/60">{world.name}</p>
                  <p className="mt-2xs text-xs text-ink/50">
                    {t("play.completeOfTotal", { completed: completedCount, total: catalog.length })}
                  </p>
                </div>
                {isComplete && <LevelBadgeStar size={32} className="shrink-0" />}
              </Link>
            );
          })}
        </div>

        <div className="mt-md flex items-center justify-between text-sm">
          <div className="flex flex-wrap gap-md">
            <Link href="/play/goals" className="text-teal hover:underline">
              {t("play.mySavingsGoals")}
            </Link>
            <Link href="/play/simulator" className="text-teal hover:underline">
              {t("play.moneyLifeSimulator")}
            </Link>
            <Link href="/play/money-personality" className="text-teal hover:underline">
              {t("play.moneyPersonalityLink")}
            </Link>
            <Link href="/play/investing-lab" className="text-teal hover:underline">
              {t("play.investingLabLink")}
            </Link>
          </div>
          <ResetProgressButton />
        </div>
      </main>
    </div>
  );
}

function ResetProgressButton() {
  const t = useTranslations();
  const { resetProgress } = useLocalProgress();
  return (
    <button
      type="button"
      onClick={() => {
        if (window.confirm(t("play.resetConfirm"))) {
          resetProgress();
        }
      }}
      className="text-ink/40 hover:text-error hover:underline"
    >
      {t("play.resetProgress")}
    </button>
  );
}
