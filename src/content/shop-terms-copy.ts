import copy from "./shop-terms-copy.json";
import type {Locale} from "@/i18n/config";
export const shopTermsCopy=copy satisfies Record<Locale,Record<keyof typeof copy.en,string>>;
export type ShopTermsCopy=typeof copy.en;
