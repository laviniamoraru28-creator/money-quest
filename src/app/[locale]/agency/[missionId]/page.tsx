"use client";

import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { useAgencyMission } from "@/lib/agency/use-agency-mission";
import { getMission } from "@/lib/agency/missions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ReadAloudButton } from "@/components/ui/ReadAloudButton";
import { LessonAssistant } from "@/components/lesson/LessonAssistant";
import { isSupportedLocale } from "@/i18n/config";

/**
 * One generic page renders every Agency mission, driven entirely by
 * AGENCY_MISSIONS + the `agency.missions.<id>.*` translation keys -
 * same "structural id in, localized content out" pattern as every
 * other quest/mission page here (see e.g.
 * real-life-quests/missions/[missionId]/page.tsx), rather than one
 * hand-written page per mission.
 *
 * Deliberately plain: no custom animation, no extra navigation
 * screens, large touch-friendly buttons, one decision visible at a
 * time - brief Phase 9's "avoid excessive animations, unnecessary
 * screens" and Phase 5's Explorer requirements (large elements, no
 * more than a couple of choices, minimal mandatory reading backed by
 * read-aloud).
 */
export default function AgencyMissionPage() {
  const params = useParams<{ missionId: string }>();
  const t = useTranslations();
  const uiLocale = useLocale();
  const { isLoaded: progressLoaded } = useLocalProgress();
  const missionId = params.missionId;
  const def = getMission(missionId);
  const { state, choices, isLoaded, decide, requestRecovery, restart } = useAgencyMission(
    def ?? getMission("money-explorer-week-one")!
  );

  if (!progressLoaded || !isLoaded) {
    return <div className="grid min-h-screen place-items-center bg-fog text-ink/70">{t("common.loading")}</div>;
  }

  if (!def) {
    return (
      <main id="main-content" tabIndex={-1} className="grid min-h-screen place-items-center bg-fog px-sm text-center">
        <div>
          <p className="text-base text-ink/70">{t("errors.genericTryAgain")}</p>
          <Link href="/" className="mt-sm inline-block text-teal-text hover:underline">
            {t("nav.home")}
          </Link>
        </div>
      </main>
    );
  }

  const base = `agency.missions.${def.id}`;
  const node = def.nodes[state.currentNodeId];
  const nodePrompt = t(`${base}.nodes.${state.currentNodeId}.prompt`);
  const resourceEntries = Object.entries(state.resources);

  function outcomeTextFor(entry: (typeof state.history)[number]): string | null {
    if (entry.choiceId === "__recovery__") return null;
    const entryNode = def!.nodes[entry.nodeId];
    const choice = entryNode?.choices.find((c) => c.id === entry.choiceId);
    const tag = choice?.consequence.outcomeTag;
    return tag ? t(`${base}.outcomes.${tag}`) : null;
  }

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-[700px]">
        <h1 className="break-words font-display text-2xl font-bold">{t(`${base}.title`)}</h1>
        {state.history.length === 0 && <p className="mt-2xs text-base text-ink/80">{t(`${base}.intro`)}</p>}

        {/* Resource display - always visible, never hidden behind a
            menu, so a child can see the real consequence of a choice
            the moment they make it. aria-live announces a change to
            screen reader users without needing a separate live log. */}
        <div aria-live="polite" className="mt-sm flex flex-wrap gap-xs">
          {resourceEntries.map(([key, value]) => (
            <Card key={key} variant="data" className="px-sm py-2xs text-center">
              <p className="text-xs uppercase tracking-wide text-ink/60">{t(`agency.resourceLabels.${key}`)}</p>
              <p className="font-display text-xl font-bold">{value}</p>
            </Card>
          ))}
        </div>

        {state.status !== "completed" ? (
          <Card variant="activity" className="mt-md">
            {state.status === "recovering" && (
              <p className="mb-xs inline-block rounded-sm bg-gold/20 px-xs py-2xs text-sm font-medium text-ink">
                {t("agency.recoveryBadge")}
              </p>
            )}
            <div className="flex items-start justify-between gap-sm">
              <p className="text-base font-medium text-ink">{nodePrompt}</p>
              <ReadAloudButton text={nodePrompt} uiLocale={uiLocale} />
            </div>

            {/* At most 2-3 choices per node by mission design (see
                validateMission's own Explorer-band test), each a full
                real <button> for native keyboard + screen reader
                support - never a custom click target. */}
            <div className="mt-sm flex flex-col gap-xs">
              {choices.map((choice) => (
                <Button
                  key={choice.id}
                  variant="quest-primary"
                  size="large"
                  disabled={!choice.affordable}
                  aria-disabled={!choice.affordable}
                  onClick={() => decide(choice.id)}
                  className="w-full justify-start text-left"
                >
                  {t(`${base}.choices.${choice.id}`)}
                </Button>
              ))}
            </div>

            {/* Always available, never only shown after things go
                wrong - brief: "Asking for help must never be
                punished." isRecoveryNode on the current node means
                we're already there; no need to offer it twice. */}
            {!node?.isRecoveryNode && (
              <button
                type="button"
                onClick={() => requestRecovery()}
                className="mt-sm text-sm font-medium text-teal-text underline-offset-2 hover:underline"
              >
                {t("agency.askForHelpButton")}
              </button>
            )}
          </Card>
        ) : (
          <Card variant="reward" className="mt-md">
            <h2 className="font-display text-xl font-bold">{t("agency.statusCompletedHeading")}</h2>
            <p className="mt-2xs text-base text-ink/80">{t("agency.statusCompletedBody")}</p>

            <h3 className="mt-sm text-sm font-medium uppercase tracking-wide text-ink/60">{t("agency.historyHeading")}</h3>
            <ul className="mt-2xs flex flex-col gap-2xs">
              {state.history.map((entry, index) => {
                const outcome = outcomeTextFor(entry);
                return outcome ? (
                  <li key={index} className="text-base text-ink/80">
                    {outcome}
                  </li>
                ) : null;
              })}
            </ul>

            <Button variant="quest-primary" size="large" onClick={() => restart()} className="mt-md w-full">
              {t("agency.restartButton")}
            </Button>
          </Card>
        )}

        {isSupportedLocale(uiLocale) && (
          <div className="mt-md">
            <LessonAssistant lessonId={def.id} locale={uiLocale} />
          </div>
        )}
      </main>
    </div>
  );
}
