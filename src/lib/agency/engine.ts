export type Band = "explorer" | "builder" | "strategist";
export type Quest = "money" | "entrepreneur" | "leadership" | "ai";
export type Choice = { cost: number; impact: number };
export type State = { balance: number; impact: number; history: number[] };
export const initial = (band: Band): State => ({ balance: band === "explorer" ? 12 : band === "builder" ? 20 : 25, impact: 0, history: [] });
export function decide(state: State, choices: readonly Choice[], index: number): State {
  const choice = choices[index];
  if (!Number.isInteger(index) || !choice || !Number.isSafeInteger(choice.cost) || choice.cost < 0 || choice.cost > state.balance || !Number.isSafeInteger(choice.impact)) return state;
  return { balance: state.balance - choice.cost, impact: state.impact + choice.impact, history: [...state.history, index] };
}
export const costs = [[{cost: 2, impact: 1}, {cost: 4, impact: 2}], [{cost: 0, impact: 0}, {cost: 3, impact: 2}], [{cost: 1, impact: 1}, {cost: 5, impact: 3}]] as const;
