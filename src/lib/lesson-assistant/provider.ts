import { choiceIcons, type Answer } from "./protocol";

type Schema = Record<string, unknown>;
export type ProviderRequest = {
  system: string;
  data: string;
  schema: Schema;
  maxOutput: number;
};
export type TokenUsage = { input: number; output: number };
export type AssistantProvider = (request: ProviderRequest) => Promise<{ value: unknown; usage: TokenUsage }>;

export const model = "gpt-4.1-mini-2025-04-14";
export const answerTokens = 360;
export const reviewTokens = 32;

// Account for message framing/schema overhead and use UTF-8 bytes as an
// intentionally conservative bound for the pinned byte-level tokenizer.
export function inputBound(request: ProviderRequest) {
  return 768 + Buffer.byteLength(JSON.stringify([request.system, request.data, request.schema]));
}

export function microPounds(usage: TokenUsage, gbpPerUsdWithBuffer: number) {
  return Math.ceil((usage.input * 0.4 + usage.output * 1.6) * gbpPerUsdWithBuffer);
}

function isTokenCount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= 2_000_000;
}

export function openAIProvider(apiKey: string): AssistantProvider {
  return async ({ system, data, schema, maxOutput }) => {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model, store: false, service_tier: "default", max_completion_tokens: maxOutput,
        messages: [{ role: "system", content: system }, { role: "user", content: data }],
        response_format: { type: "json_schema", json_schema: { name: "money_quest", strict: true, schema } },
      }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error("provider-http");
    const payload = await response.json();
    const { prompt_tokens: input, completion_tokens: output } = payload.usage ?? {};
    if (payload.model !== model || !isTokenCount(input) || !isTokenCount(output)) throw new Error("provider-usage");
    const choice = payload.choices?.[0];
    let value: unknown = null;
    if (choice?.finish_reason === "stop" && typeof choice.message?.content === "string" && choice.message.content.length <= 6000) {
      try { value = JSON.parse(choice.message.content); } catch { /* billed response with invalid content */ }
    }
    return { value, usage: { input, output } };
  };
}

const string = { type: "string" };
function object(properties: Schema) {
  return { type: "object", properties, required: Object.keys(properties), additionalProperties: false };
}

export const answerSchema = object({
  kind: { type: "string", enum: ["answer", "challenge", "scope"] },
  text: string,
  choices: { type: "array", items: object({ label: string, icon: { type: "string", enum: Object.keys(choiceIcons) } }) },
  correct: { type: "integer" },
  explanation: string,
});

export const reviewSchema = object({ safe: { type: "boolean" } });

const unsafePresentation = /https?:|www\.|\[[^\]]+\]\(|[<>]/iu;

function cleanText(value: unknown, max: number): value is string {
  return typeof value === "string" && !!value.trim() && value.length <= max &&
    !unsafePresentation.test(value) && !/[\p{Cc}\p{Cf}]/u.test(value.replace(/\n/g, ""));
}

export function parseAnswer(value: unknown, requiresChallenge: boolean, explorer: boolean): Answer | "scope" | null {
  if (!value || typeof value !== "object") return null;
  const { kind, text, choices, correct, explanation } = value as Record<string, unknown>;
  if (kind === "scope") return "scope";
  if (!cleanText(text, explorer ? 340 : 850) || !Array.isArray(choices)) return null;
  if (kind === "answer" && !requiresChallenge && choices.length === 0) return { text, challenge: null };
  if (kind !== "challenge" || !requiresChallenge || choices.length < 2 || choices.length > (explorer ? 2 : 3) ||
    typeof correct !== "number" || !Number.isInteger(correct) || correct < 0 || correct >= choices.length ||
    !cleanText(explanation, explorer ? 120 : 320)) return null;
  if (!choices.every((item) => item && cleanText(item.label, explorer ? 28 : 80) &&
    typeof item.icon === "string" && Object.hasOwn(choiceIcons, item.icon)) ||
    new Set(choices.map((item) => item.label.toLowerCase().trim())).size !== choices.length ||
    (explorer && new Set(choices.map((item) => item.icon)).size !== choices.length)) return null;
  return { text, challenge: { choices, correct, explanation } };
}
