import copy from "./parent-guide-copy.json";
import type {Locale} from "@/i18n/config";
export const parentGuideCopy=copy satisfies Record<Locale,Record<keyof typeof copy.en,string>>;
export type ParentGuideCopy=typeof copy.en;
export const PARENT_GUIDE_CHECKED="2026-10-28";
export const PARENT_GUIDE_SOURCES=[
 {id:"castNote",title:"CAST UDL Guidelines 3.0: Action and Expression",url:"https://udlguidelines.cast.org/action-expression/"},
 {id:"eefNote",title:"EEF: Universal approaches to inclusive teaching",url:"https://educationendowmentfoundation.org.uk/education-evidence/inclusive-teaching/universal-approaches"},
 {id:"moneyNote",title:"MoneyHelper: Talk Learn Do",url:"https://www.moneyhelper.org.uk/en/family-and-care/talk-money/talk-learn-do"}
] as const;
