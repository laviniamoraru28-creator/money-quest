import copy from "./parent-bonus-copy.json";
import type {Locale} from "@/i18n/config";
export const parentBonusCopy=copy satisfies Record<Locale,Record<keyof typeof copy.en,string>>;
export const parentBonusTitle="Little Minds, Smart Money";
