import {isSupportedLocale} from "@/i18n/config";

export const SUPPORT_APP = "moneyquest-voluntary-support-v1";
export const MIN_PENCE = 200;
export const MAX_PENCE = 10000;
export function amountInPence(value: unknown): number {
  if (typeof value !== "string" || !/^\d{1,3}(?:[.,]\d{1,2})?$/.test(value)) throw new Error("amount");
  const [pounds, pennies = ""] = value.replace(",", ".").split(".");
  const amount = Number(pounds) * 100 + Number(pennies.padEnd(2, "0"));
  if (!Number.isSafeInteger(amount) || amount < MIN_PENCE || amount > MAX_PENCE) throw new Error("amount");
  return amount;
}
export function checkoutInput(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("choices");
  const v = value as Record<string, unknown>;
  if (Object.keys(v).some(k => !["amount", "locale", "adult", "requestId"].includes(k)) || v.adult !== true || typeof v.locale !== "string" || !isSupportedLocale(v.locale) || typeof v.requestId !== "string" || !/^[a-f0-9-]{36}$/.test(v.requestId)) throw new Error("choices");
  return {amount: amountInPence(v.amount), locale: v.locale, requestId: v.requestId};
}
