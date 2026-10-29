import type {ShopFlowCopy} from "@/content/shop-flow-copy";
const ERROR_COPY={
 purchases_closed:"checkoutClosed",checkout_use_site:"checkoutUseSite",checkout_choices:"checkoutChoices",
 checkout_adult:"checkoutAdult",product_unavailable:"productUnavailable",checkout_unavailable:"checkoutUnavailable",
 order_use_site:"orderUseSite",order_not_ready:"orderNotReady"
} as const satisfies Record<string,keyof ShopFlowCopy>;
export function shopErrorKey(data:unknown,fallback:"checkoutUnavailable"|"orderUnavailable"):keyof ShopFlowCopy {
 if(!data||typeof data!=="object")return fallback;
 const value=data as Record<string,unknown>;
 if(typeof value.code==="string"&&Object.hasOwn(ERROR_COPY,value.code))return ERROR_COPY[value.code as keyof typeof ERROR_COPY];
 const legacy:Record<string,keyof ShopFlowCopy>={
  "Purchases are not open yet. Free samples are available.":"checkoutClosed",
  "Use the Money Quest checkout page.":"checkoutUseSite",
  "Check the checkout choices.":"checkoutChoices",
  "An adult must confirm both digital-download choices.":"checkoutAdult",
  "This download is not available for purchase yet.":"productUnavailable",
  "Checkout could not be opened. You have not been charged by this request.":"checkoutUnavailable",
  "Use Money Quest to retrieve your order":"orderUseSite",
  "Order not ready or this browser cannot verify it. Retry after payment completes; do not pay again.":"orderNotReady"
 };
 return typeof value.message==="string"&&Object.hasOwn(legacy,value.message)?legacy[value.message]!:fallback;
}
export function validatedCheckoutUrl(value:unknown) {
 if(typeof value!=="string")throw new Error("Invalid checkout URL");
 const url=new URL(value);
 if(url.protocol!=="https:"||url.hostname!=="checkout.stripe.com"||url.username||url.password||url.port&&url.port!=="443")throw new Error("Invalid checkout URL");
 return url.href;
}
