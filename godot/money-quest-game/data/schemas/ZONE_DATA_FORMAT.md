# ZoneData format

This documents the shape every zone's `.tres` file follows — see
`scripts/world/ZoneData.gd` for the authoritative field list and
`data/zones/world-hub.tres` / `data/zones/golden-vault.tres` for complete
worked examples.

A new zone is **one `.tres` resource file**. Adding zone 3 should never
require changing `WorldManager.gd` — only content, plus the zone's own
scene file.

## Fields

| Field | Type | Notes |
|---|---|---|
| `zone_id` | String | Stable, lowercase-hyphenated, e.g. `"golden-vault"` |
| `display_name_key` | String | Translation key, never literal text |
| `scene_path` | String | `res://` path to the zone's `.tscn` — loaded and instanced by `Main.gd` on travel |
| `kind` | `ZoneKind` enum | `HUB` \| `QUEST` \| `LIBRARY` \| `MUSEUM` \| `MIND_LAB` \| `CALM` — see Section 3 of `docs/money-quest-world-architecture.md` |
| `theme_color` | Color | Used for this zone's portal/UI accent; pick from `tailwind.config.ts`'s design tokens, don't invent new colors |
| `unlock_condition_quest_id` | String | Empty = always unlocked. Otherwise, the zone unlocks once that quest id is in `ProgressManager.completed_quest_ids` (see `WorldManager.is_zone_unlocked`) |
| `npc_ids` / `quest_ids` / `exhibit_ids` / `book_ids` | `Array[String]` | Which content lives in this zone — informational/cross-reference only; the zone's own scene is the source of truth for what's actually placed |
| `player_spawn_position` | Vector3 | Where `Main.gd` places the player after instancing this zone |

## Rule: only one zone resident at a time

`Main.gd` frees the previous zone instance before instancing the next one
(see `_on_zone_change_requested`). A zone's own scene must not assume any
other zone's nodes exist.

## Rule: always-unlocked destinations

Per the project brief, Calm World zones must never be gated behind
progress — leave `unlock_condition_quest_id` empty for every `CALM`-kind
zone, always.

## Rule: zones vs. the Hub's 7 destinations

The Hub's 7 top-level destinations (Money Quest / Entrepreneur Quest /
Leadership Quest / Library / Museum / Mind Lab / Calm World) are reached
via `PortalInteraction` and are not themselves necessarily one `ZoneData`
each — "Money Quest" is a whole track that can contain many zones (Golden
Vault is the first). A portal's `target_zone_id` points at whichever zone
is that track's actual entry point.
