import type { AgeBand } from "@/types/database.types";
import type { SimScenario } from "./types";
import type { LocalizedScenarioText } from "./localized-types";
import { SCENARIO_STRUCTURES } from "./structures";
import { buildScenarioFromStructure } from "./build-scenario";

/**
 * Adding scenario #N: write its structural entry in structures.ts and
 * its translatable content in messages/en.json (and every other
 * locale) under `simulatorScenarios.<key>` — SimulatorShell and
 * getStandardScenarioForAgeBand() pick it up automatically, exactly
 * like the game engine's GAME_STRUCTURES registry.
 *
 * SCENARIO_STRUCTURES holds only structural (locale-independent) data
 * — see structures.ts and localized-types.ts for why the translatable
 * text lives in messages/*.json instead.
 */
export const SCENARIO_KEYS: string[] = SCENARIO_STRUCTURES.map((s) => s.key);

/** Minimal shape of next-intl's translator this function needs — kept
 * structural rather than importing next-intl's own type, matching the
 * same reasoning as report.ts's Translator type. Deliberately only
 * `raw` — that's the only method either function below actually
 * calls. An earlier version also declared a callable `(key, values?)
 * => string` signature that was never used by this file at all; it
 * looked harmless but made this type WIDER than next-intl's real
 * translator (whose `values` parameter only accepts next-intl's own
 * TranslationValues, not an arbitrary Record<string, unknown>), which
 * is exactly backwards for a parameter type — TypeScript correctly
 * rejected passing the real, narrower `t` in. Keeping the type to
 * only the methods actually called sidesteps the mismatch entirely,
 * rather than trying to hand-copy next-intl's own (more complex,
 * versioned) type signature here. */
type Translator = { raw: (key: string) => unknown };

/**
 * t.raw() — next-intl's API for a structured JSON value — retrieves
 * the whole `simulatorScenarios.<key>` blob in one call, matching the
 * same pattern used for lesson and game content.
 */
export function getStandardScenarioForAgeBand(ageBand: AgeBand, t: Translator): SimScenario | undefined {
  const structure = SCENARIO_STRUCTURES.find((s) => s.ageBand === ageBand && s.difficulty === "standard");
  if (!structure) return undefined;
  const text = t.raw(`simulatorScenarios.${structure.key}`) as LocalizedScenarioText;
  return buildScenarioFromStructure(structure, text);
}

export function getScenarioByKey(key: string, t: Translator): SimScenario | undefined {
  const structure = SCENARIO_STRUCTURES.find((s) => s.key === key);
  if (!structure) return undefined;
  const text = t.raw(`simulatorScenarios.${key}`) as LocalizedScenarioText;
  return buildScenarioFromStructure(structure, text);
}
