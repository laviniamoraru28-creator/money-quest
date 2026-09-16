import type { GameConfig } from "./types";

/**
 * Phrases that must never appear in any game's feedback copy — anything
 * that characterises the CHILD (rather than the choice) negatively.
 * Checked case-insensitively against whole feedback strings.
 */
const BANNED_PATTERNS: RegExp[] = [
  /you'?re\s+(bad|terrible|awful|hopeless)\s+(at|with)/i,
  /you\s+(can'?t|cannot)\s+(do|understand)/i,
  /wrong\s+again/i,
  /that'?s\s+(stupid|silly|dumb)/i,
  /you\s+(never|always)\s+get/i,
  /(bad|poor)\s+with\s+money/i,
];

/** At least one of these redirect-style phrases (or a close variant)
 * should appear in incorrect-answer feedback, per the brief's explicit
 * examples ("Let's think about another option.", "Here's what would
 * happen.", "Try again."). This is a soft check (a warning, not a hard
 * failure) since good redirect language has more valid forms than any
 * fixed list can enumerate — the banned list above is the hard rule. */
const RECOMMENDED_REDIRECT_PATTERNS: RegExp[] = [
  /let'?s\s+think\s+about/i,
  /here'?s\s+what\s+would\s+happen/i,
  /try\s+again/i,
  /let'?s\s+look\s+at/i,
  /another\s+option/i,
  /let'?s\s+\w+.*again/i, // e.g. "Let's check that balance again.", "Let's grow that number again."
];

export interface FeedbackValidationResult {
  gameKey: string;
  errors: string[];
  warnings: string[];
}

/** Run across every game config at build/content-review time (see
 * scripts/validate-game-feedback.ts) — never at runtime in the app
 * itself, since this is a content-authoring safeguard, not a per-request
 * check. */
export function validateGameFeedback(config: GameConfig): FeedbackValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const allIncorrectStrings = [
    config.feedback.incorrect,
    ...config.variants.flatMap((v) => v.rounds.map((r) => r.explanation)),
  ];

  for (const text of allIncorrectStrings) {
    for (const pattern of BANNED_PATTERNS) {
      if (pattern.test(text)) {
        errors.push(`Banned shaming pattern ${pattern} found in: "${text}"`);
      }
    }
  }

  const hasRecommendedPhrase = RECOMMENDED_REDIRECT_PATTERNS.some((p) => p.test(config.feedback.incorrect));
  if (!hasRecommendedPhrase) {
    warnings.push(
      `Game "${config.key}"'s top-level incorrect-feedback ("${config.feedback.incorrect}") doesn't match any recommended redirect phrasing — double-check it reads as a redirect, not a correction of the child.`
    );
  }

  return { gameKey: config.key, errors, warnings };
}
