extends Node3D
## Main — the persistent root for every explorable 3D zone. Holds the one
## always-present HUD and a ZoneContainer that WorldManager's requests swap
## content into — only the active zone is ever resident in memory (see
## docs/money-quest-world-architecture.md Section 21's performance note).
##
## Reached from MainMenu (after AvatarCreation on a first launch) via
## change_scene_to_file — Main itself is never project.godot's main_scene,
## so a child always sees the menu first.

const STARTING_ZONE_ID: String = "world-hub"

@onready var zone_container: Node3D = $ZoneContainer
## The one shared atmosphere (sky, ambient light, fog) every zone lives
## under. A zone can swap in its own via an EnvironmentOverride node.
@onready var world_environment: WorldEnvironment = $WorldEnvironment
@onready var _shared_environment: Environment = world_environment.environment

var _current_zone_instance: Node = null


func _ready() -> void:
	WorldManager.zone_change_requested.connect(_on_zone_change_requested)
	WorldManager.travel_to(STARTING_ZONE_ID)


func _on_zone_change_requested(zone_data: ZoneData) -> void:
	if _current_zone_instance:
		_current_zone_instance.queue_free()
		_current_zone_instance = null

	var zone_scene: PackedScene = load(zone_data.scene_path)
	_current_zone_instance = zone_scene.instantiate()
	zone_container.add_child(_current_zone_instance)
	_apply_zone_environment(_current_zone_instance)

	var player: Node3D = _current_zone_instance.find_child("Player", true, false)
	if player:
		var arrive: Vector3 = _arrival_point(zone_data)
		player.global_position = arrive
		if player.get("safety"):
			player.safety.set_spawn(arrive)

	WorldManager.notify_zone_loaded(zone_data)


## Where the player appears: beside the door that leads back to the place
## they just came from (so "I came through that door" is true, and ← BACK is
## right behind them), a few steps into the room, out of the door's reach.
## Falls back to the zone's own spawn point (first arrival, no such door).
const ARRIVE_FROM_DOOR: float = 3.2
## A place whose own (designed) spawn point is already this close to that
## door keeps it: the player is beside the door either way.
const SPAWN_BESIDE_DOOR: float = 6.0

func _arrival_point(zone_data: ZoneData) -> Vector3:
	var spawn: Vector3 = zone_data.player_spawn_position
	var from: String = WorldManager.previous_zone_id
	if from.is_empty():
		return spawn
	for n in _current_zone_instance.find_children("*", "Area3D", true, false):
		if n is PortalInteraction and (n as PortalInteraction).target_zone_id == from:
			var door: Vector3 = (n as Node3D).global_position
			var inward := Vector3(spawn.x - door.x, 0, spawn.z - door.z)
			if inward.length() <= SPAWN_BESIDE_DOOR:
				return spawn
			var p: Vector3 = door + inward.normalized() * ARRIVE_FROM_DOOR
			return Vector3(p.x, spawn.y, p.z)
	return spawn


func _apply_zone_environment(zone: Node) -> void:
	var override := zone.get_node_or_null("EnvironmentOverride") as EnvironmentOverride
	if override and override.environment:
		world_environment.environment = override.environment
	else:
		world_environment.environment = _shared_environment
