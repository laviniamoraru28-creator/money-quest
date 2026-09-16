/**
 * The closed set of avatar options available at Avatar Creation and later
 * customisation. Deliberately small and curated (per the visual design
 * system, Section 7.1) — fictional creature characters, never a
 * human-likeness generator, keeping the experience clearly make-believe
 * and avoiding any path toward a child creating something that
 * resembles a real photo of themselves.
 */

export type AvatarBase = "fox" | "owl" | "otter" | "dragon";

export interface AvatarColorOption {
  key: string;
  label: string; // non-colour-alone identifying label, per the a11y baseline
  hex: string;
}

export interface AvatarBaseOption {
  key: AvatarBase;
  label: string;
}

export interface AvatarConfig {
  base: AvatarBase;
  colorKey: string;
}

export const AVATAR_BASES: AvatarBaseOption[] = [
  { key: "fox", label: "Fox" },
  { key: "owl", label: "Owl" },
  { key: "otter", label: "Otter" },
  { key: "dragon", label: "Dragon" },
];

// All six colours are available from day one (unlike cosmetic accessories,
// which unlock later via XP per the design system) — colour is a starter
// choice, not a reward.
export const AVATAR_COLORS: AvatarColorOption[] = [
  { key: "teal", label: "Quest Teal", hex: "#0F7A6B" },
  { key: "gold", label: "Coin Gold", hex: "#E8A33D" },
  { key: "ember", label: "Ember Orange", hex: "#D13E19" },
  { key: "sky", label: "Sky Blue", hex: "#367D99" },
  { key: "violet", label: "Guardian Violet", hex: "#5B4B8A" },
  { key: "rose", label: "Grove Rose", hex: "#C97C93" },
];

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  base: "fox",
  colorKey: "teal",
};
