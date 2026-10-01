class_name ZoneData
extends Resource
## ZoneData — describes EVERY place in Money Quest World, the World Hub
## included. One resource shape for every destination, tagged with `kind`
## so the loader/UI can decide behavior without a family of subclasses —
## see docs/money-quest-world-architecture.md Section 3 for the rationale.

enum ZoneKind { HUB, QUEST, LIBRARY, MUSEUM, MIND_LAB, CALM }

@export var zone_id: String = ""                  # e.g. "world-hub", "golden-vault"
@export var display_name_key: String = ""
@export var scene_path: String = ""               # res:// path to this zone's 3D scene

@export var kind: ZoneKind = ZoneKind.QUEST

@export var theme_color: Color = Color.WHITE       # from the website's world.* tokens where one exists
## "" = always unlocked (the Hub and every Calm World garden are always
## "" here, per the brief's explicit "never gated" instruction for Calm
## World). Otherwise, the id of a quest that must be completed first.
@export var unlock_condition_quest_id: String = ""

@export var npc_ids: Array[String] = []
@export var quest_ids: Array[String] = []          # populated for QUEST zones
@export var exhibit_ids: Array[String] = []        # populated for MUSEUM zones
@export var book_ids: Array[String] = []           # populated for LIBRARY zones

## Where the player avatar appears when entering this zone (local to the
## zone's own scene). Read by WorldManager after instancing the zone.
@export var player_spawn_position: Vector3 = Vector3.ZERO
