"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { useEntrepreneurQuest } from "@/lib/entrepreneur-quest/use-entrepreneur-quest";
import { formatCurrency, toMinorUnits } from "@/lib/currency/format";
import {
  EQ_STAGES,
  EQ_BADGE_IDS,
  EQ_PRODUCT_CATEGORY_IDS,
  EQ_CUSTOMER_CATEGORY_IDS,
  EQ_MARKETING_APPROACH_IDS,
  EQ_LOGO_SHAPE_IDS,
  EQ_LOGO_COLOR_IDS,
  EQ_LOGO_SYMBOL_OPTIONS,
  EQ_MARKET_DETECTIVE_SCENARIO,
  EQ_DEMAND_LADDER,
  EQ_TEST_IDEA_TEST_FIRST_KEY,
  getEQStageByOrder,
} from "@/content/entrepreneur-quest/structures";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { MissionMechanic } from "@/game-engine/mechanics/MissionMechanic";
import type { MissionRound } from "@/game-engine/types";
import type { BusinessLogo, BusinessProfile } from "@/lib/entrepreneur-quest/state";
import { EntrepreneurQuestLogo } from "@/components/entrepreneur-quest/EntrepreneurQuestLogo";
import { CategorySelect } from "@/components/entrepreneur-quest/CategorySelect";
import { BarRow } from "@/components/entrepreneur-quest/BarRow";

/** Which single free-text BusinessProfile field each "reflect-text"
 * stage collects — kept here (not in structures.ts) since it's a
 * detail of how THIS page renders a stage, not a locale-independent
 * fact about the stage itself. */
const REFLECT_FIELD_BY_STAGE: Record<string, keyof BusinessProfile> = {
  "find-a-problem": "problem",
  "create-an-idea": "ideaDescription",
  "name-your-business": "businessName",
};

/** Tailwind utility classes, not CSS custom properties — this app's
 * design-system colors (tailwind.config.ts) are only exposed as
 * Tailwind classes (e.g. `bg-teal/10`), and dynamic template-literal
 * class names like `bg-${colorKey}` aren't detected by Tailwind's
 * static analysis, so each option needs its own literal class here. */
const LOGO_COLOR_BG_CLASS: Record<string, string> = {
  teal: "bg-teal",
  coral: "bg-coral",
  gold: "bg-gold",
  "soft-blue": "bg-soft-blue",
};

/** Builds a full MissionRound from EQ's own leaner decision-event
 * content (situation + choices only). MissionMechanic never reads
 * prompt/hint/explanation, so empty strings here are never shown to
 * anyone — kept as real fields only because MissionRound's type
 * requires them. */
function toMissionRound(eventId: string, situation: string, choices: MissionRound["choices"]): MissionRound {
  return { id: eventId, mechanic: "mission", prompt: "", hint: "", explanation: "", situation, choices };
}

export default function EntrepreneurQuestBuildPage() {
  const uiLocale = useLocale();
  const router = useRouter();
  const t = useTranslations();
  const { state: progressState, awardBadge } = useLocalProgress();
  const { state, isLoaded, updateBusinessField, updateLogo, completeStage, recordDecision, completePitch } = useEntrepreneurQuest();
  const [missionStepIndex, setMissionStepIndex] = useState(0);
  const [marketingSubStep, setMarketingSubStep] = useState<"category" | "event">("category");

  if (!isLoaded) {
    return <div className="grid min-h-screen place-items-center bg-fog text-ink/60">{t("common.loading")}</div>;
  }

  // Resume at the first not-yet-completed stage, or the first stage if
  // starting fresh — a simple, linear progression matching the brief's
  // LEARN -> CREATE -> DECIDE flow rather than letting a child jump
  // around and lose the sense of building one thing step by step.
  const currentOrder = Math.min(EQ_STAGES.length, state.completedStageIds.length + 1);
  const stage = getEQStageByOrder(currentOrder);

  if (!stage) {
    // Every stage already completed — send back to the hub, where the
    // pitch card is now unlocked.
    router.push("/entrepreneur-quest");
    return null;
  }

  function goToNextStage() {
    setMissionStepIndex(0);
    setMarketingSubStep("category");
    completeStage(stage!.id);
    if (stage!.id === "find-a-problem") awardBadge(EQ_BADGE_IDS.problemSolver);
    if (stage!.id === "create-an-idea") awardBadge(EQ_BADGE_IDS.ideaFinder);
    if (stage!.id === "calculate-your-profit") awardBadge(EQ_BADGE_IDS.moneyManager);
    if (stage!.id === "create-your-marketing") awardBadge(EQ_BADGE_IDS.marketingExplorer);
    if (currentOrder === EQ_STAGES.length) {
      router.push("/entrepreneur-quest/pitch");
    }
  }

  const reflectField = REFLECT_FIELD_BY_STAGE[stage.id];

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main className="mx-auto max-w-[700px]">
        <div className="flex flex-wrap items-center gap-xs">
          <Link
            href="/entrepreneur-quest"
            className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal transition-colors duration-quick hover:bg-teal/5"
          >
            <span aria-hidden="true">←</span> {t("entrepreneurQuest.backToHub")}
          </Link>
          <span className="ml-auto rounded-full bg-teal/10 px-sm py-3xs text-sm font-medium text-teal">
            {t("entrepreneurQuest.stageProgress", { current: currentOrder, total: EQ_STAGES.length })}
          </span>
        </div>

        <div className="mt-sm h-2 w-full">
          <ProgressBar percent={(currentOrder / EQ_STAGES.length) * 100} label={t("entrepreneurQuest.stageProgress", { current: currentOrder, total: EQ_STAGES.length })} />
        </div>

        <Card variant="activity" className="mt-sm">
          <h1 className="font-display text-xl font-bold">{t(`entrepreneurQuest.stages.${stage.id}.title`)}</h1>
          <p className="mt-2xs text-base text-ink/80">{t(`entrepreneurQuest.stages.${stage.id}.learnText`)}</p>

          {reflectField && (
            <ReflectTextStage
              stageId={stage.id}
              value={state.business[reflectField] as string}
              onChange={(value) => updateBusinessField(reflectField, value)}
              onContinue={goToNextStage}
              showSafetyHint={stage.id === "name-your-business"}
            />
          )}

          {stage.id === "research-demand" && (
            <MarketDetectiveStage
              stepIndex={missionStepIndex}
              currencyCode={progressState.currencyCode}
              uiLocale={uiLocale}
              onChoose={(eventId, choiceKey) => recordDecision(eventId, choiceKey)}
              onFinishStage={goToNextStage}
            />
          )}

          {stage.id === "test-the-idea" && stage.missionEventIds && (
            <MissionStage
              stageId={stage.id}
              eventIds={stage.missionEventIds}
              stepIndex={missionStepIndex}
              currencyCode={progressState.currencyCode}
              uiLocale={uiLocale}
              onChoose={(eventId, choiceKey) => {
                recordDecision(eventId, choiceKey);
                if (eventId === "test-before-invest") {
                  updateBusinessField("testedIdeaFirst", choiceKey === EQ_TEST_IDEA_TEST_FIRST_KEY);
                }
              }}
              onAdvanceStep={() => setMissionStepIndex((i) => i + 1)}
              onFinishStage={goToNextStage}
            />
          )}

          {stage.id === "create-your-logo" && (
            <LogoStage
              logo={state.business.logo}
              slogan={state.business.slogan}
              onChangeLogo={updateLogo}
              onChangeSlogan={(value) => updateBusinessField("slogan", value)}
              onContinue={goToNextStage}
            />
          )}

          {stage.id === "choose-your-product" && (
            <ProductStage
              category={state.business.productCategory}
              description={state.business.productDescription}
              onChangeCategory={(value) => updateBusinessField("productCategory", value)}
              onChangeDescription={(value) => updateBusinessField("productDescription", value)}
              onContinue={goToNextStage}
            />
          )}

          {stage.id === "choose-your-customer" && (
            <CustomerStage
              category={state.business.customerCategory}
              onChangeCategory={(value) => updateBusinessField("customerCategory", value)}
              onContinue={goToNextStage}
            />
          )}

          {stage.id === "understand-costs" && (
            <NumericMoneyStage
              value={state.business.costPerUnitMinorUnits}
              currencyCode={progressState.currencyCode}
              uiLocale={uiLocale}
              onChange={(minorUnits) => updateBusinessField("costPerUnitMinorUnits", minorUnits)}
              onContinue={goToNextStage}
              labelText={t("entrepreneurQuest.stages.understand-costs.fieldLabel")}
            />
          )}

          {stage.id === "set-your-price" && (
            <NumericMoneyStage
              value={state.business.priceMinorUnits}
              currencyCode={progressState.currencyCode}
              uiLocale={uiLocale}
              onChange={(minorUnits) => updateBusinessField("priceMinorUnits", minorUnits)}
              onContinue={goToNextStage}
              labelText={t("entrepreneurQuest.stages.set-your-price.fieldLabel")}
              helpText={t("entrepreneurQuest.stages.set-your-price.helpText")}
            />
          )}

          {stage.id === "create-your-marketing" && stage.missionEventIds && (
            marketingSubStep === "category" ? (
              <div className="mt-sm">
                <CategorySelect
                  ids={EQ_MARKETING_APPROACH_IDS}
                  selectedId={state.business.marketingApproach}
                  onSelect={(id) => updateBusinessField("marketingApproach", id)}
                  getLabel={(id) => t(`entrepreneurQuest.marketingApproaches.${id}`)}
                />
                <Button
                  variant="quest-primary"
                  className="mt-sm w-full"
                  disabled={!state.business.marketingApproach}
                  onClick={() => setMarketingSubStep("event")}
                >
                  {t("entrepreneurQuest.continueButton")}
                </Button>
              </div>
            ) : (
              <MissionStage
                stageId={stage.id}
                eventIds={stage.missionEventIds}
                stepIndex={missionStepIndex}
                currencyCode={progressState.currencyCode}
                uiLocale={uiLocale}
                onChoose={(eventId, choiceKey) => recordDecision(eventId, choiceKey)}
                onAdvanceStep={() => setMissionStepIndex((i) => i + 1)}
                onFinishStage={goToNextStage}
              />
            )
          )}

          {stage.id === "make-your-first-sale" && (
            <div className="mt-sm">
              <Link href="/entrepreneur-quest/simulator">
                <Button variant="quest-primary" className="w-full" onClick={goToNextStage}>
                  {t("entrepreneurQuest.stages.make-your-first-sale.ctaButton")}
                </Button>
              </Link>
            </div>
          )}

          {stage.id === "calculate-your-profit" && (
            <ProfitReflectStage
              profitMinorUnits={state.latestSimulatorRun?.profitMinorUnits ?? null}
              currencyCode={progressState.currencyCode}
              uiLocale={uiLocale}
              onContinue={goToNextStage}
            />
          )}

          {stage.kind === "mission" && stage.missionEventIds && (
            <MissionStage
              stageId={stage.id}
              eventIds={stage.missionEventIds}
              stepIndex={missionStepIndex}
              currencyCode={progressState.currencyCode}
              uiLocale={uiLocale}
              onChoose={(eventId, choiceKey) => recordDecision(eventId, choiceKey)}
              onAdvanceStep={() => setMissionStepIndex((i) => i + 1)}
              onFinishStage={goToNextStage}
            />
          )}

          {stage.id === "create-your-final-pitch" && (
            <PitchHandoffStage
              whyChooseUs={state.business.whyChooseUs}
              nextStep={state.business.nextStep}
              onChangeWhyChooseUs={(value) => updateBusinessField("whyChooseUs", value)}
              onChangeNextStep={(value) => updateBusinessField("nextStep", value)}
              onFinish={() => {
                completeStage(stage.id);
                completePitch();
                awardBadge(EQ_BADGE_IDS.youngFounder);
                router.push("/entrepreneur-quest/pitch");
              }}
            />
          )}
        </Card>
      </main>
    </div>
  );
}

/**
 * "Research Demand" (v2, brief section 4-5): the Market Detective's
 * ONE fixed fictional market, shown as plain data cards (never a
 * single "right answer" is implied — the reflection choice further
 * below is a genuine MissionMechanic with no correct pick), plus the
 * Idea -> Interest -> Demand -> Purchases -> Repeat ladder as plain
 * width-bars (BarRow — no chart library exists in this codebase).
 */
function MarketDetectiveStage({
  stepIndex,
  currencyCode,
  uiLocale,
  onChoose,
  onFinishStage,
}: {
  stepIndex: number;
  currencyCode: string;
  uiLocale: string;
  onChoose: (eventId: string, choiceKey: string) => void;
  onFinishStage: () => void;
}) {
  const t = useTranslations();
  const scenario = EQ_MARKET_DETECTIVE_SCENARIO;
  return (
    <div className="mt-sm">
      <p className="font-medium">{t("entrepreneurQuest.marketDetective.scenarioTitle")}</p>
      <div className="mt-2xs grid grid-cols-2 gap-2xs">
        <DataCard label={t("entrepreneurQuest.marketDetective.interestedCustomersLabel")} value={String(scenario.interestedCustomers)} />
        <DataCard label={t("entrepreneurQuest.marketDetective.recentBuyersLabel")} value={String(scenario.recentBuyers)} />
        <DataCard label={t("entrepreneurQuest.marketDetective.competitorCountLabel")} value={String(scenario.competitorCount)} />
        <DataCard label={t("entrepreneurQuest.marketDetective.competitorPriceLabel")} value={formatCurrency(scenario.competitorPriceMinorUnits, currencyCode, uiLocale)} />
        <DataCard label={t("entrepreneurQuest.marketDetective.productionCostLabel")} value={formatCurrency(scenario.productionCostMinorUnits, currencyCode, uiLocale)} />
        <DataCard label={t("entrepreneurQuest.marketDetective.weekendDemandLabel")} value={t(`entrepreneurQuest.demandLevels.${scenario.weekendDemand}`)} />
        <DataCard label={t("entrepreneurQuest.marketDetective.winterDemandLabel")} value={t(`entrepreneurQuest.demandLevels.${scenario.winterDemand}`)} />
      </div>

      <p className="mt-md font-medium">{t("entrepreneurQuest.marketDetective.demandLadderTitle")}</p>
      <div className="mt-2xs">
        {EQ_DEMAND_LADDER.map((step) => (
          <BarRow
            key={step.key}
            label={t(`entrepreneurQuest.marketDetective.demandLadder.${step.key}`)}
            value={step.value}
            maxValue={100}
            displayValue={String(step.value)}
          />
        ))}
      </div>

      <div className="mt-md">
        <MissionStage
          stageId="research-demand"
          eventIds={["market-detective-reflection"]}
          stepIndex={stepIndex}
          currencyCode={currencyCode}
          uiLocale={uiLocale}
          onChoose={onChoose}
          onAdvanceStep={() => {}}
          onFinishStage={onFinishStage}
        />
      </div>
    </div>
  );
}

function DataCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-ink/10 p-xs">
      <p className="text-xs text-ink/50">{label}</p>
      <p className="text-base font-medium text-ink">{value}</p>
    </div>
  );
}

function ReflectTextStage({
  stageId,
  value,
  onChange,
  onContinue,
  showSafetyHint,
}: {
  stageId: string;
  value: string;
  onChange: (value: string) => void;
  onContinue: () => void;
  showSafetyHint?: boolean;
}) {
  const t = useTranslations();
  const isBusinessName = stageId === "name-your-business";
  return (
    <div className="mt-sm">
      <label htmlFor={`eq-field-${stageId}`} className="text-sm font-medium">
        {t(`entrepreneurQuest.stages.${stageId}.fieldLabel`)}
      </label>
      {isBusinessName ? (
        <input
          id={`eq-field-${stageId}`}
          type="text"
          value={value}
          onChange={(e: { target: { value: string } }) => onChange(e.target.value)}
          placeholder={t(`entrepreneurQuest.stages.${stageId}.placeholder`)}
          maxLength={40}
          className="mt-2xs w-full rounded-sm border border-ink/20 px-xs py-2xs"
        />
      ) : (
        <textarea
          id={`eq-field-${stageId}`}
          value={value}
          onChange={(e: { target: { value: string } }) => onChange(e.target.value)}
          placeholder={t(`entrepreneurQuest.stages.${stageId}.placeholder`)}
          maxLength={200}
          rows={3}
          className="mt-2xs w-full rounded-sm border border-ink/20 px-xs py-2xs"
        />
      )}
      {showSafetyHint && <p className="mt-2xs text-xs text-ink/50">{t("entrepreneurQuest.safety.nameHint")}</p>}
      <Button variant="quest-primary" className="mt-sm w-full" disabled={!value.trim()} onClick={onContinue}>
        {t("entrepreneurQuest.saveAndContinueButton")}
      </Button>
    </div>
  );
}

function LogoStage({
  logo,
  slogan,
  onChangeLogo,
  onChangeSlogan,
  onContinue,
}: {
  logo: BusinessLogo;
  slogan: string;
  onChangeLogo: <K extends keyof BusinessLogo>(field: K, value: BusinessLogo[K]) => void;
  onChangeSlogan: (value: string) => void;
  onContinue: () => void;
}) {
  const t = useTranslations();
  return (
    <div className="mt-sm">
      <div className="flex justify-center">
        <EntrepreneurQuestLogo logo={logo} size={96} />
      </div>

      <p className="mt-sm text-sm font-medium">{t("entrepreneurQuest.stages.create-your-logo.shapeLabel")}</p>
      <div className="mt-2xs flex flex-wrap gap-2xs">
        {EQ_LOGO_SHAPE_IDS.map((shape) => (
          <button
            key={shape}
            type="button"
            onClick={() => onChangeLogo("shape", shape)}
            aria-pressed={logo.shape === shape}
            aria-label={t(`entrepreneurQuest.logoShapes.${shape}`)}
            className={["min-h-touch-min-child rounded-sm border-2 px-sm py-2xs text-sm font-medium", logo.shape === shape ? "border-teal bg-teal/5 text-teal" : "border-ink/15 text-ink/80"].join(" ")}
          >
            {t(`entrepreneurQuest.logoShapes.${shape}`)}
          </button>
        ))}
      </div>

      <p className="mt-sm text-sm font-medium">{t("entrepreneurQuest.stages.create-your-logo.colorLabel")}</p>
      <div className="mt-2xs flex flex-wrap gap-2xs">
        {EQ_LOGO_COLOR_IDS.map((colorKey) => (
          <button
            key={colorKey}
            type="button"
            onClick={() => onChangeLogo("colorKey", colorKey)}
            aria-pressed={logo.colorKey === colorKey}
            aria-label={colorKey}
            className={[
              "h-touch-min-child w-touch-min-child rounded-full border-2",
              LOGO_COLOR_BG_CLASS[colorKey] ?? "bg-teal",
              logo.colorKey === colorKey ? "border-ink" : "border-ink/15",
            ].join(" ")}
          />
        ))}
      </div>

      <p className="mt-sm text-sm font-medium">{t("entrepreneurQuest.stages.create-your-logo.symbolLabel")}</p>
      <div className="mt-2xs flex flex-wrap gap-2xs">
        {EQ_LOGO_SYMBOL_OPTIONS.map((symbol) => (
          <button
            key={symbol}
            type="button"
            onClick={() => onChangeLogo("symbol", symbol)}
            aria-pressed={logo.symbol === symbol}
            className={["grid h-touch-min-child w-touch-min-child place-items-center rounded-sm border-2 text-2xl", logo.symbol === symbol ? "border-teal bg-teal/5" : "border-ink/15"].join(" ")}
          >
            {symbol}
          </button>
        ))}
      </div>

      <label htmlFor="eq-slogan" className="mt-sm block text-sm font-medium">
        {t("entrepreneurQuest.stages.create-your-logo.sloganLabel")}
      </label>
      <input
        id="eq-slogan"
        type="text"
        value={slogan}
        onChange={(e: { target: { value: string } }) => onChangeSlogan(e.target.value)}
        placeholder={t("entrepreneurQuest.stages.create-your-logo.sloganPlaceholder")}
        maxLength={60}
        className="mt-2xs w-full rounded-sm border border-ink/20 px-xs py-2xs"
      />

      <Button variant="quest-primary" className="mt-sm w-full" onClick={onContinue}>
        {t("entrepreneurQuest.saveAndContinueButton")}
      </Button>
    </div>
  );
}

function ProductStage({
  category,
  description,
  onChangeCategory,
  onChangeDescription,
  onContinue,
}: {
  category: string;
  description: string;
  onChangeCategory: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onContinue: () => void;
}) {
  const t = useTranslations();
  return (
    <div className="mt-sm">
      <p className="text-sm font-medium">{t("entrepreneurQuest.stages.choose-your-product.categoryLabel")}</p>
      <CategorySelect
        ids={EQ_PRODUCT_CATEGORY_IDS}
        selectedId={category}
        onSelect={onChangeCategory}
        getLabel={(id) => t(`entrepreneurQuest.productCategories.${id}`)}
      />

      <label htmlFor="eq-product-description" className="mt-sm block text-sm font-medium">
        {t("entrepreneurQuest.stages.choose-your-product.descriptionLabel")}
      </label>
      <textarea
        id="eq-product-description"
        value={description}
        onChange={(e: { target: { value: string } }) => onChangeDescription(e.target.value)}
        placeholder={t("entrepreneurQuest.stages.choose-your-product.descriptionPlaceholder")}
        maxLength={200}
        rows={2}
        className="mt-2xs w-full rounded-sm border border-ink/20 px-xs py-2xs"
      />

      <Button variant="quest-primary" className="mt-sm w-full" disabled={!category || !description.trim()} onClick={onContinue}>
        {t("entrepreneurQuest.saveAndContinueButton")}
      </Button>
    </div>
  );
}

function CustomerStage({
  category,
  onChangeCategory,
  onContinue,
}: {
  category: string;
  onChangeCategory: (value: string) => void;
  onContinue: () => void;
}) {
  const t = useTranslations();
  return (
    <div className="mt-sm">
      <CategorySelect
        ids={EQ_CUSTOMER_CATEGORY_IDS}
        selectedId={category}
        onSelect={onChangeCategory}
        getLabel={(id) => t(`entrepreneurQuest.customerCategories.${id}`)}
      />
      <Button variant="quest-primary" className="mt-sm w-full" disabled={!category} onClick={onContinue}>
        {t("entrepreneurQuest.saveAndContinueButton")}
      </Button>
    </div>
  );
}

function NumericMoneyStage({
  value,
  currencyCode,
  uiLocale,
  onChange,
  onContinue,
  labelText,
  helpText,
}: {
  value: number;
  currencyCode: string;
  uiLocale: string;
  onChange: (minorUnits: number) => void;
  onContinue: () => void;
  labelText: string;
  helpText?: string;
}) {
  const t = useTranslations();
  const [text, setText] = useState(String(value / 100));

  return (
    <div className="mt-sm">
      <label htmlFor="eq-numeric-field" className="text-sm font-medium">
        {labelText}
      </label>
      {helpText && <p className="mt-3xs text-xs text-ink/60">{helpText}</p>}
      <input
        id="eq-numeric-field"
        type="number"
        min="0.01"
        step="0.01"
        value={text}
        onChange={(e: { target: { value: string } }) => setText(e.target.value)}
        className="mt-2xs w-full rounded-sm border border-ink/20 px-xs py-2xs"
      />
      <Button
        variant="quest-primary"
        className="mt-sm w-full"
        disabled={Number.isNaN(Number(text)) || Number(text) <= 0}
        onClick={() => {
          onChange(toMinorUnits(Number(text), currencyCode));
          onContinue();
        }}
      >
        {t("entrepreneurQuest.saveAndContinueButton")}
      </Button>
      <p className="mt-2xs text-xs text-ink/50">{formatCurrency(toMinorUnits(Number(text) || 0, currencyCode), currencyCode, uiLocale)}</p>
    </div>
  );
}

function ProfitReflectStage({
  profitMinorUnits,
  currencyCode,
  uiLocale,
  onContinue,
}: {
  profitMinorUnits: number | null;
  currencyCode: string;
  uiLocale: string;
  onContinue: () => void;
}) {
  const t = useTranslations();
  return (
    <div className="mt-sm">
      <p className="rounded-sm bg-fog p-sm text-sm text-ink/80">{t("entrepreneurQuest.simulator.formulaReminder")}</p>
      {profitMinorUnits === null ? (
        <p className="mt-sm text-base text-ink/70">{t("entrepreneurQuest.stages.calculate-your-profit.noRunYetHint")}</p>
      ) : (
        <>
          <p className="mt-sm text-sm text-ink/60">{t("entrepreneurQuest.stages.calculate-your-profit.resultHint")}</p>
          <p className="mt-2xs font-display text-2xl font-bold text-teal">{formatCurrency(profitMinorUnits, currencyCode, uiLocale)}</p>
        </>
      )}
      <Button variant="quest-primary" className="mt-sm w-full" onClick={onContinue}>
        {t("entrepreneurQuest.saveAndContinueButton")}
      </Button>
    </div>
  );
}

function MissionStage({
  stageId,
  eventIds,
  stepIndex,
  currencyCode,
  uiLocale,
  onChoose,
  onAdvanceStep,
  onFinishStage,
}: {
  stageId: string;
  eventIds: string[];
  stepIndex: number;
  currencyCode: string;
  uiLocale: string;
  onChoose: (eventId: string, choiceKey: string) => void;
  onAdvanceStep: () => void;
  onFinishStage: () => void;
}) {
  const t = useTranslations();
  const eventId = eventIds[stepIndex];
  const [chosenKey, setChosenKey] = useState<string | null>(null);

  if (!eventId) return null;

  const situation = t(`entrepreneurQuest.decisionEvents.${eventId}.situation`);
  const choices = t.raw(`entrepreneurQuest.decisionEvents.${eventId}.choices`) as MissionRound["choices"];
  const round = toMissionRound(eventId, situation, choices);
  const isLastEvent = stepIndex === eventIds.length - 1;

  return (
    <div className="mt-sm" key={eventId}>
      <MissionMechanic
        round={round}
        currencyCode={currencyCode}
        uiLocale={uiLocale}
        usesCurrency={false}
        onAnswer={(_isCorrect, choiceKey) => {
          setChosenKey(choiceKey ?? "");
          onChoose(eventId, choiceKey ?? "");
        }}
        isResolved={false}
      />
      {chosenKey !== null && (
        <Button
          variant="quest-primary"
          className="mt-sm w-full"
          onClick={() => {
            setChosenKey(null);
            if (isLastEvent) {
              onFinishStage();
            } else {
              onAdvanceStep();
            }
          }}
        >
          {isLastEvent ? t("entrepreneurQuest.saveAndContinueButton") : t("entrepreneurQuest.continueButton")}
        </Button>
      )}
    </div>
  );
}

function PitchHandoffStage({
  whyChooseUs,
  nextStep,
  onChangeWhyChooseUs,
  onChangeNextStep,
  onFinish,
}: {
  whyChooseUs: string;
  nextStep: string;
  onChangeWhyChooseUs: (value: string) => void;
  onChangeNextStep: (value: string) => void;
  onFinish: () => void;
}) {
  const t = useTranslations();
  return (
    <div className="mt-sm">
      <label htmlFor="eq-why-choose" className="text-sm font-medium">
        {t("entrepreneurQuest.stages.create-your-final-pitch.whyChooseLabel")}
      </label>
      <textarea
        id="eq-why-choose"
        value={whyChooseUs}
        onChange={(e: { target: { value: string } }) => onChangeWhyChooseUs(e.target.value)}
        placeholder={t("entrepreneurQuest.stages.create-your-final-pitch.whyChoosePlaceholder")}
        maxLength={200}
        rows={2}
        className="mt-2xs w-full rounded-sm border border-ink/20 px-xs py-2xs"
      />
      <label htmlFor="eq-next-step" className="mt-sm block text-sm font-medium">
        {t("entrepreneurQuest.stages.create-your-final-pitch.nextStepLabel")}
      </label>
      <textarea
        id="eq-next-step"
        value={nextStep}
        onChange={(e: { target: { value: string } }) => onChangeNextStep(e.target.value)}
        placeholder={t("entrepreneurQuest.stages.create-your-final-pitch.nextStepPlaceholder")}
        maxLength={200}
        rows={2}
        className="mt-2xs w-full rounded-sm border border-ink/20 px-xs py-2xs"
      />
      <Button variant="quest-primary" className="mt-sm w-full" disabled={!whyChooseUs.trim() || !nextStep.trim()} onClick={onFinish}>
        {t("entrepreneurQuest.stages.create-your-final-pitch.viewPitchButton")}
      </Button>
    </div>
  );
}
