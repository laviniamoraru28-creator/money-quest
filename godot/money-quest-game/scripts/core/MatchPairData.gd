class_name MatchPairData
extends Resource
## MatchPairData — one left/right pair for a MATCH-kind quest's matching
## mini-game (e.g. Leadership Quest's "Meet Your Team"/"First Challenge",
## which match a task to the teammate who's good at it). Tap-tap matching,
## never drag (see MatchPanel.gd's own comment on why).
##
## `right_character_id` is a structural npc id, not a translation key —
## MatchPanel looks up its display name via the same `npc.%s.name` dynamic
## pattern every NPC-speaker DialogueLine already uses, so no duplicate
## translation is ever needed for a character who already has one.
##
## `right_text_key` is an alternative to `right_character_id` for a pair
## whose right side isn't a character at all (e.g. Mind Lab's "Name That
## Feeling," matching a situation to a plain emotion word) — set exactly
## one of the two. MatchPanel prefers `right_text_key` when it's non-empty.

@export var pair_id: String = ""
@export var left_text_key: String = ""
@export var right_character_id: String = ""
@export var right_text_key: String = ""
