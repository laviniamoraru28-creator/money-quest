export const AI_QUEST_STORAGE_KEY = "moneyquest_ai_quest_v1";
export type AIQuestBand = "explorer" | "builder" | "strategist";
export type AIQuestProgress = Record<AIQuestBand, number[]>;

export function safeAIMissionIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter(
    (item): item is number => typeof item === "number" && Number.isInteger(item) && item >= 0 && item < 5
  )));
}

export function parseAIQuestProgress(value: unknown): AIQuestProgress {
  const data = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
  return {
    explorer: safeAIMissionIds(data.explorer),
    builder: safeAIMissionIds(data.builder),
    strategist: safeAIMissionIds(data.strategist),
  };
}

export function isAIQuestComplete(progress: AIQuestProgress, band: AIQuestBand): boolean {
  return safeAIMissionIds(progress[band]).length === 5;
}
