/**
 * Static, bundled world metadata — replaces the `worlds` table.
 * Extracted directly from 0004_seed_worlds_and_activities.sql, values
 * copied exactly, not re-derived, so this is a faithful move rather
 * than a re-invention. Part of the privacy-first redesign: content
 * with no personal data in it has no reason to live in a database that
 * also, before this redesign, held real people's information — see
 * docs/data-flow-inventory-pre-redesign.md.
 */
export interface WorldMeta {
  id: string;
  name: string;
  orderIndex: number;
  themeColor: string;
  description: string;
}

export const WORLDS: WorldMeta[] = [
  { id: "coin-cove", name: "Coin Cove", orderIndex: 1, themeColor: "#E8A33D", description: "Where every quest begins - meet money, coins, and your first earnings." },
  { id: "market-town", name: "Market Town", orderIndex: 2, themeColor: "#D13E19", description: "Bustling stalls and smart choices: needs, wants, and clever shopping." },
  { id: "golden-vault", name: "Golden Vault", orderIndex: 3, themeColor: "#0B5C50", description: "Grow your savings and set goals in the safest vault around." },
  { id: "sky-exchange", name: "Sky Exchange", orderIndex: 4, themeColor: "#367D99", description: "Digital coins, cards, and currencies from across the world." },
  { id: "guardian-gate", name: "Guardian Gate", orderIndex: 5, themeColor: "#5B4B8A", description: "Stay sharp: spot scams, phishing, and stay safe online." },
  { id: "horizon-peaks", name: "Horizon Peaks", orderIndex: 6, themeColor: "#6E7B8B", description: "Think ahead: big decisions and long-term plans." },
  { id: "kindness-grove", name: "Kindness Grove", orderIndex: 7, themeColor: "#C97C93", description: "The joy of giving and helping others with what you have." },
];

export function getWorldById(worldId: string): WorldMeta | undefined {
  return WORLDS.find((w) => w.id === worldId);
}
