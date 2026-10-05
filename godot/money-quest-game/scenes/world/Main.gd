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
		player.global_position = zone_data.player_spawn_position

	WorldManager.notify_zone_loaded(zone_data)


func _apply_zone_environment(zone: Node) -> void:
	var override := zone.get_node_or_null("EnvironmentOverride") as EnvironmentOverride
	if override and override.environment:
		world_environment.environment = override.environment
	else:
		world_environment.environment = _shared_environment
