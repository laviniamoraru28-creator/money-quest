extends Node
## WorldManager — "which zone is currently loaded," and the one place that
## swaps zone content under Main.tscn's ZoneContainer. Never all zones
## resident at once (see docs/money-quest-world-architecture.md Section
## 21's performance requirement) — only the active zone's scene exists in
## memory; the previous one is freed before the new one loads.
##
## Main.tscn listens for `zone_loaded` and does the actual instancing
## (WorldManager holds no Node3D references itself, keeping it a plain
## data/orchestration autoload, consistent with every other autoload here).

signal zone_change_requested(zone_data: ZoneData)
signal zone_loaded(zone_data: ZoneData)

const ZONES_DIR: String = "res://data/zones/"

var current_zone_id: String = ""
var _zone_registry: Dictionary = {}   # zone_id -> ZoneData, populated by register_zone()


func _ready() -> void:
	_load_all_zones()


## Data-driven on purpose: adding zone 8 means dropping a new .tres file
## into data/zones/ — never editing this script (see the brief's explicit
## "add a new zone without rebuilding the world" requirement).
func _load_all_zones() -> void:
	var dir := DirAccess.open(ZONES_DIR)
	if dir == null:
		push_warning("WorldManager: could not open %s" % ZONES_DIR)
		return
	dir.list_dir_begin()
	var file_name := dir.get_next()
	while file_name != "":
		if file_name.ends_with(".tres"):
			var zone: ZoneData = load(ZONES_DIR + file_name)
			if zone != null:
				register_zone(zone)
		file_name = dir.get_next()
	dir.list_dir_end()


func register_zone(zone_data: ZoneData) -> void:
	_zone_registry[zone_data.zone_id] = zone_data


func get_zone(zone_id: String) -> ZoneData:
	return _zone_registry.get(zone_id)


func is_zone_unlocked(zone_id: String) -> bool:
	if ProgressManager.unlocked_zone_ids.has(zone_id):
		return true
	var zone: ZoneData = get_zone(zone_id)
	if zone == null:
		return false
	if zone.unlock_condition_quest_id.is_empty():
		return true
	return ProgressManager.completed_quest_ids.has(zone.unlock_condition_quest_id)


## Call this to travel to a zone (from a portal, a door, or the title
## screen's initial load). Main.tscn is the only listener that actually
## instances the scene — WorldManager just decides and announces.
func travel_to(zone_id: String) -> void:
	var zone: ZoneData = get_zone(zone_id)
	if zone == null:
		push_error("WorldManager: unknown zone_id '%s'" % zone_id)
		return
	if not is_zone_unlocked(zone_id):
		push_warning("WorldManager: zone '%s' is locked, ignoring travel request" % zone_id)
		return
	if zone_id != current_zone_id:
		previous_zone_id = current_zone_id
	current_zone_id = zone_id
	zone_change_requested.emit(zone)


## Called by Main.tscn once it has actually finished instancing the new
## zone scene and placing the player — lets anything waiting on "the zone
## is ready" (e.g. a fade-in) proceed.
func notify_zone_loaded(zone_data: ZoneData) -> void:
	zone_loaded.emit(zone_data)



# --- navigation: ← BACK and → FORWARD, the same everywhere ------------------------

## The zone the player was in before this one ("" at the start): the player
## arrives beside the door that leads back there (Main).
var previous_zone_id: String = ""


## Where ← BACK leads from `zone_id` (ZoneData.back_zone_id): the previous
## room of its chain, or the Hub. "" for the Hub itself.
func back_of(zone_id: String) -> String:
	var z: ZoneData = get_zone(zone_id)
	return z.back_zone_id if z else ""


## A door in `from_zone` leading to `target`: "back" when it is where ← BACK
## leads, otherwise "forward" (→, further along, or into a place).
func door_role(from_zone: String, target: String) -> String:
	return "back" if not target.is_empty() and target == back_of(from_zone) else "forward"


## The place whose emblem stands for `zone_id`: itself when it has one
## (Destinations), otherwise the first place up its BACK chain that does —
## so every room of the Museum shows the Museum's column, every Calm World
## room the leaf. One meaning per emblem, everywhere.
func emblem_place(zone_id: String) -> String:
	var z: String = zone_id
	for i in 20:
		if Destinations.has(z):
			return z
		var b: String = back_of(z)
		if b.is_empty() or b == "world-hub":
			return z
		z = b
	return z

func unlock_zone(zone_id: String) -> void:
	if not ProgressManager.unlocked_zone_ids.has(zone_id):
		ProgressManager.unlocked_zone_ids.append(zone_id)
		SaveManager.save_progress()
