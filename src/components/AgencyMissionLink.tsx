import {useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import {AGENCY_MISSIONS} from "@/lib/agency/missions";
import type {Quest} from "@/lib/agency/engine";
import type {AgeBand} from "@/types/database.types";

export const agencyHubPaths = {money:"/play", entrepreneur:"/entrepreneur-quest", leadership:"/leadership-quest", ai:"/ai-quest"} as const;

export function AgencyMissionLink({quest, band}: {quest: Quest; band: AgeBand | null}) {
  const t = useTranslations();
  const mission = Object.values(AGENCY_MISSIONS).find(item => item.quest === quest && item.band === band);
  if (!mission) return null;
  return <Link href={`/agency/${mission.id}`} className="inline-flex min-h-12 items-center font-semibold underline">
    {t(`agency.missions.${mission.id}.title`)}
  </Link>;
}
