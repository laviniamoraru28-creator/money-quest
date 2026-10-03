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

@export var pair_id: String = ""
@export var left_text_key: String = ""
@export var right_character_id: String = ""
