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
@export var mentor_ids: Array[String] = []         # populated for LIBRARY zones hosting a Mentor Hall
@export var mindlab_entry_ids: Array[String] = []  # populated for MIND_LAB zones hosting MindLabEntryData entries

## Where the player avatar appears when entering this zone (local to the
## zone's own scene). Read by WorldManager after instancing the zone.
@export var player_spawn_position: Vector3 = Vector3.ZERO

## Where ← BACK leads from here (ZoneNavigation): the previous room of this
## place's chain, or the Hub for a place the Hub opens onto directly. Empty
## only for the Hub itself. The door that leads there is this room's BACK
## door; every other door goes FORWARD. (tests check it matches the doors.)
@export var back_zone_id: String = ""
