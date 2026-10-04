class_name CalmGardenConfig
extends Resource
## CalmGardenConfig — a child's personal "Create Your Own Calm Garden"
## (project brief Section 11): a handful of independent category
## choices, deliberately not a full city-builder. Every option is purely
## visual/decorative; there is no "correct" combination — the same
## sensory-choice principle (project brief Section 12) that governs the
## rest of Calm World applies here too. Persisted the same minimal way
## AvatarConfig.gd already is — see SaveManager.gd's own save/load block
## — so this needed no new save file, database, or account.

@export var background_id: String = "meadow"      # "meadow" | "night_sky" | "desert" | "underwater_blue"
@export var water_id: String = "pond"              # "pond" | "stream" | "none"
@export var plants_id: String = "flowers"          # "flowers" | "tall_grass" | "none"
@export var light_id: String = "none"              # "lanterns" | "fireflies" | "none"
@export var bubbles_id: String = "none"            # "bubbles" | "none"
@export var stones_id: String = "none"             # "stones" | "none"
@export var creature_id: String = "none"           # "fish" | "butterflies" | "none"
