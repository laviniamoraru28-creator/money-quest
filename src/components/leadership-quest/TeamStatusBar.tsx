"use client";

import { useTranslations } from "next-intl";
import type { LQTeamState } from "@/lib/leadership-quest/state";

/**
 * The Team Status readout (brief section 5's own example format):
 *
 * 🤝 Trust: 4/5
 * 😊 Morale: 3/5
 * 🎯 Progress: 70%
 * ⚡ Energy: 4/5
 *
 * Deliberately plain text values, not a corporate dashboard — every
 * number is always visible as text (never conveyed by animation alone,
 * per the accessibility brief), and the emoji are `aria-hidden` since
 * the label text already says what each stat is.
 */
export function TeamStatusBar({ team }: { team: LQTeamState }) {
  const t = useTranslations();

  return (
    <div
      role="group"
      aria-label={t("leadershipQuest.teamStatus.title")}
      className="grid grid-cols-2 gap-sm rounded-md border border-ink/10 bg-cream p-sm sm:grid-cols-4"
    >
      <StatItem emoji="🤝" label={t("leadershipQuest.teamStatus.trust")} value={`${team.trust}/5`} />
      <StatItem emoji="😊" label={t("leadershipQuest.teamStatus.morale")} value={`${team.morale}/5`} />
      <StatItem emoji="🎯" label={t("leadershipQuest.teamStatus.progress")} value={`${Math.round(team.progress)}%`} />
      <StatItem emoji="⚡" label={t("leadershipQuest.teamStatus.energy")} value={`${team.energy}/5`} />
    </div>
  );
}

function StatItem({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2xs">
      <span aria-hidden="true" className="text-xl">
        {emoji}
      </span>
      <div>
        <p className="text-xs text-ink/60">{label}</p>
        <p className="text-sm font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}
