import {shopProducts,type ShopProduct} from "@/content/shop";
import {shopCatalogueCopy,type ShopCatalogueCopy} from "@/content/shop-catalogue-copy";
import {shopFlowCopy} from "@/content/shop-flow-copy";
import {REGIONAL_LOCALES,type Locale} from "@/i18n/config";
import {sourceFingerprint,assertTranslationShape} from "./content-translations";
import manifest from "@/content/translations/shop-catalogue.sources.json";

export function shopCatalogueProductSource(product:ShopProduct){
 return {title:product.title,description:product.description,pages:product.pages,includes:product.includes};
}
/** Draft display copy cannot replace commerce fields or claim translated files exist. */
export function shopCataloguePresentation(locale:Locale){
 const edition:ShopCatalogueCopy=shopCatalogueCopy[locale];
 if(sourceFingerprint(shopCatalogueCopy.en)!==manifest.sourceHash)throw new Error("Stale shop catalogue UI drafts");
 assertTranslationShape(shopCatalogueCopy.en,edition,`shop-catalogue/${locale}`);
 const products=shopProducts.map(product=>{
  if(sourceFingerprint(shopCatalogueProductSource(product))!==manifest.products[product.id])throw new Error(`Stale shop product draft: ${product.id}`);
  const text=edition.products[product.id];
  return {id:product.id,image:product.image,sample:product.sample,
   title:text.title,description:text.description,pages:text.pages,includes:text.includes,
   imageAlt:text.imageAlt,sampleLabel:text.sampleLabel,
   priceLabel:new Intl.NumberFormat(REGIONAL_LOCALES[locale],{style:"currency",currency:"GBP"}).format(product.price/100)};
 });
 return {copy:edition.copy,products,flowCopy:shopFlowCopy[locale]};
}
export type ShopCataloguePresentation=ReturnType<typeof shopCataloguePresentation>;
