class_name InteractionData
extends Resource
## InteractionData — one optional thing a child can do in the world, as
## data. The interaction engine (WorldInteractable + InteractionCard) never
## needs to change to add one: drop a new .tres into data/interactions/.
##
## Every player-facing string is a translation key. Default length is one
## short sentence (text_key), plus an optional second (text2_key); deeper
## learning belongs to the zone/quest/Library content the action opens.
##
## kind sets how relevant it is when several things are in reach
## (see priority()): gateway > activity > info > rest > secret.

@export var interaction_id: String = ""
@export_enum("info", "gateway", "activity", "rest", "secret") var kind: String = "info"

@export_group("Placement")
## Node (relative to the scene root) the position is local to — e.g.
## "Landmarks/MoneyQuestLandmark". Empty = the scene root.
@export var anchor: String = ""
@export var position: Vector3 = Vector3.ZERO
## Reach in metres — generous on purpose (no precise aiming needed).
@export var radius: float = 2.0
@export var prompt_height: float = 2.4

@export_group("Text")
@export var title_key: String = ""
@export var text_key: String = ""
@export var text2_key: String = ""
@export var prompt_key: String = "interaction.look_prompt"
## Palette colour (DecorKit) for the card's accent stripe — the district's.
@export var accent: String = "gold"

@export_group("Try it (optional two-choice moment)")
## A tiny, non-punishing "what would you do?" — every answer is safe and
## gets a short, kind explanation. Leave empty for a plain card.
@export var question_key: String = ""
@export var choice_keys: Array[String] = []
@export var result_keys: Array[String] = []

@export_group("Action")
## none | open_zone (front door to an existing zone, respecting locks) |
## library_book | mentor | exhibit (open the existing verified card) |
## rest (a quiet moment — nothing to complete)
@export_enum("none", "open_zone", "library_book", "mentor", "exhibit", "rest") var action: String = "none"
@export var target_id: String = ""
@export var action_label_key: String = "interaction.explore_more"

@export_group("Memory and feedback")
## Remember (locally) that the child found this — no reward attached.
@export var remember: bool = true
## AmbientDirector reaction played when the card opens ("" = none).
@export var reaction: String = ""


func priority() -> int:
	match kind:
		"gateway":
			return 60
		"activity":
			return 45
		"info":
			return 40
		"rest":
			return 35
		_:
			return 30
