import { isSupportedLocale, type Locale } from "@/i18n/config";

export const actions = ["understand", "more", "challenge", "question"] as const;
export type AssistantAction = typeof actions[number];
export const questionLimit = 240;
export const choiceIcons = {
  coin: "🪙", wallet: "👛", jar: "🫙", basket: "🧺", shop: "🏪",
  food: "🍎", book: "📚", gift: "🎁", bike: "🚲", bag: "🎒",
  team: "🤝", chart: "📊", calendar: "📅", yes: "✅", wait: "⏳",
} as const;

export type Choice = { label: string; icon: keyof typeof choiceIcons };
export type Answer = {
  text: string;
  challenge: { choices: Choice[]; correct: number; explanation: string } | null;
};
export type AssistantRequest = {
  lessonId: string;
  locale: Locale;
  action: AssistantAction;
  question: string;
  followUp: string;
};
export type AssistantStatus = "disabled" | "daily" | "monthly" | "unavailable" | "scope" | "private";

export function parseRequest(value: unknown): AssistantRequest | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const { lessonId, locale, action, question = "", followUp = "" } = value as Record<string, unknown>;
  if (typeof lessonId !== "string" || !/^[a-z0-9_-]{1,75}$/.test(lessonId) ||
    typeof locale !== "string" || !isSupportedLocale(locale) ||
    !actions.includes(action as AssistantAction) ||
    typeof question !== "string" || question.length > questionLimit ||
    typeof followUp !== "string" || followUp.length > 3000 ||
    (action === "question" ? !question.trim() : !!question || !!followUp)) return null;
  return { lessonId, locale, action: action as AssistantAction, question: question.trim(), followUp };
}
