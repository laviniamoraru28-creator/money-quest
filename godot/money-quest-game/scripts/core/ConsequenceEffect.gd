class_name ConsequenceEffect
extends Resource
## ConsequenceEffect — what happens after a choice is made.
##
## Mirrors the website's own "every mission choice has its own consequence,
## never a bare correct/incorrect judgment" principle (see MissionMechanic
## in the website's game-engine) and the Leadership Quest pattern of never
## showing a raw number to the child — `consequence_text_key` is always a
## natural-language sentence; `coin_delta`/`xp_delta` are applied silently
## to GameState, not printed as "+5 coins" floating text unless a specific
## UI moment (like RewardPopup) explicitly chooses to show the running
## total.

@export var coin_delta: int = 0
@export var xp_delta: int = 0
## A full sentence, e.g. "lesson.builder_saving_l1.choice.save.consequence"
## resolving to "Maya keeps her goal in mind and buys the sketchbook
## herself three weeks later." — never a raw number.
@export var consequence_text_key: String = ""
