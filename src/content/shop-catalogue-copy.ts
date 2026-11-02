import copy from "./shop-catalogue-copy.json";
import type {Locale} from "@/i18n/config";
type ProductCopy={title:string;description:string;pages:string;includes:string[];imageAlt:string;sampleLabel:string};
export type ShopCatalogueCopy={copy:Record<keyof typeof copy.en.copy,string>;products:Record<keyof typeof copy.en.products,ProductCopy>};
export const shopCatalogueCopy=copy satisfies Record<Locale,ShopCatalogueCopy>;
