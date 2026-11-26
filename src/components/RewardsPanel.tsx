"use client";
import Image from "next/image";
import { useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { rewardLabels } from "@/content/reward-labels";
import { EQ_BADGE_IDS } from "@/content/entrepreneur-quest/structures";
import { LQ_BADGE_IDS } from "@/content/leadership-quest/structures";
import { cinematicQuests } from "@/content/cinematic-quests";
import { questBadges } from "@/content/quest-milestones";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { useEntrepreneurQuest } from "@/lib/entrepreneur-quest/use-entrepreneur-quest";
import { useLeadershipQuest } from "@/lib/leadership-quest/use-leadership-quest";
import { isCertificateEligible } from "@/lib/certificates/eligibility";
import { formatCurrency } from "@/lib/currency/format";

export function RewardsPanel() {
  const ref = useRef<HTMLDialogElement>(null);
  const locale = useLocale();
  const labels = rewardLabels[locale] ?? rewardLabels.en!;
  const t = useTranslations();
  const { state } = useLocalProgress();
  const business = useEntrepreneurQuest();
  const leadership = useLeadershipQuest();
  if (!state.ageBand) return null;
  const count = state.completedActivityIds.length;
  const earned = {
    money: isCertificateEligible(state.completedActivityIds, state.ageBand),
    entrepreneur: business.state.pitchCompleted,
    leadership: leadership.state.completedMissionIds.includes("final-challenge"),
    ai: state.completedActivityIds.includes(`ai-quest-${state.ageBand}`),
  };
  return <>
    <button aria-label={labels[1]} aria-haspopup="dialog" className="grid h-11 w-11 place-items-center rounded-lg border border-gold bg-[#243448] text-xl xl:fixed xl:right-3 xl:top-1/3" onClick={() => ref.current?.showModal()}>🏆</button>
    <dialog ref={ref} aria-labelledby="collection-heading" className="fixed inset-y-0 left-auto right-0 m-0 h-[100dvh] max-h-none w-80 max-w-[95vw] overflow-y-auto bg-[#14263e] p-5 text-white backdrop:bg-black/50">
      <div className="flex items-center justify-between gap-2">
        <h2 id="collection-heading" className="font-display text-xl font-bold">{labels[1]}</h2>
        <button autoFocus aria-label={t("common.back")} className="h-11 w-11 shrink-0" onClick={() => ref.current?.close()}>✕</button>
      </div>
      <p className="mt-4">{t("play.yourCoins")} · {formatCurrency(state.walletBalanceMinorUnits,state.currencyCode,locale)}</p>
      <p className="mt-1 text-sm">{t("play.virtualMoneyExplainer")}</p>
      <ul className="mt-4 grid grid-cols-2 gap-2">
        {[1,5,15,30].map((threshold,i) => <li key={threshold} className="rounded-xl border border-gold/50 p-2 text-center">
          <span aria-hidden="true" className={count < threshold ? "grayscale opacity-60" : ""}>{["🌟","🥉","🥈","🏆"][i]}</span>
          <p>{labels[i+3]}</p><small>{count >= threshold ? labels[7] : count + " / " + threshold}</small>
        </li>)}
        {cinematicQuests.map(quest => <li key={quest.key} className="rounded-xl border border-gold/50 p-2 text-center">
          <Image unoptimized alt="" width={56} height={56} className={"mx-auto " + (earned[quest.key] ? "" : "grayscale opacity-50")} src={`/cinematic/rewards/badge-${questBadges[quest.key]}.webp`}/>
          <p>{quest.title}</p><small>{earned[quest.key] ? labels[7] : "0 / 1"}</small>
        </li>)}
        {[...Object.values(EQ_BADGE_IDS).map(id => ({id, group:"entrepreneurQuest"})), ...Object.values(LQ_BADGE_IDS).map(id => ({id,group:"leadershipQuest"}))].map(({id,group}) =>
          <li key={id} className="rounded-xl border border-gold/50 p-2 text-center">
            <span aria-hidden="true">{state.earnedBadgeIds.includes(id) ? "🏅" : "🔒"}</span>
            <p>{t(`${group}.badges.${id}.name`)}</p><small>{state.earnedBadgeIds.includes(id) ? labels[7] : "0 / 1"}</small>
          </li>)}
      </ul>
    </dialog>
  </>;
}
