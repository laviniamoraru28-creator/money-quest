import copy from "./shop-flow-copy.json";
import type {Locale} from "@/i18n/config";
export const shopFlowCopy=copy satisfies Record<Locale,Record<keyof typeof copy.en,string>>;
export type ShopFlowCopy=typeof copy.en;
