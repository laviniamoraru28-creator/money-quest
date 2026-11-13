"use client";

import type {ComponentProps} from "react";
import {Link} from "@/i18n/navigation";
import {useLocalProgress} from "@/lib/local-progress/use-local-progress";
import type {AgeBand} from "@/types/database.types";

export function ChooseLearningLevelLink({ageBand, children, ...props}: Omit<ComponentProps<typeof Link>, "href"> & {ageBand: AgeBand}) {
  const {setAgeBand} = useLocalProgress();
  return <Link href="/play" {...props} onClick={event => {
    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) setAgeBand(ageBand);
  }}>{children}</Link>;
}
