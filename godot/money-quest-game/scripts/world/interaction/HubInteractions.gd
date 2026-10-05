class_name HubInteractions
extends Node
## HubInteractions — places the World Hub's optional interactions and its
## district "arrival" moments, all from data:
##
## - every InteractionData in DATA_DIR becomes a WorldInteractable at its
##   anchor (usually a landmark) + local position, so adding or moving an
##   interaction is a data change, never an engine change;
## - one wide Area3D per district (centred on its portal) notices the child
##   arriving: the district's soft "magic moment" plays (AmbientDirector
##   reaction, skipped with Reduced Motion), and on the very first visit
##   only, a short non-blocking toast names the place in one sentence.
##
## Detection is the physics engine's Area3D overlap signals — nothing here
## runs per frame.

const DATA_DIR: String = "res://data/interactions/hub/"
const ARRIVAL_RADIUS: float = 9.0

## Portal node -> [first-visit sentence key, reaction id]
const DISTRICTS: Dictionary = {
	"PortalMoneyQuest": ["discovery.money_quest", "money"],
	"PortalEntrepreneurQuest": ["discovery.entrepreneur", "entrepreneur"],
	"PortalLeadershipQuest": ["discovery.leadership", "leadership"],
	"PortalLibrary": ["discovery.library", "library"],
	"PortalMuseum": ["discovery.museum", "museum"],
	"PortalMindLab": ["discovery.mind_lab", "mindlab"],
	"PortalCalmWorld": ["discovery.calm_world", "calm"],
}

var spawned: Array[WorldInteractable] = []


func _ready() -> void:
	_spawn.call_deferred()


func _spawn() -> void:
	var root: Node3D = get_parent() as Node3D
	for file_name in DirAccess.get_files_at(DATA_DIR):
		# Exported builds list resources as "x.tres.remap".
		var res_name: String = file_name.trim_suffix(".remap")
		if not res_name.ends_with(".tres"):
			continue
		var data := load(DATA_DIR + res_name) as InteractionData
		if data == null:
			continue
		var anchor: Node3D = root.get_node_or_null(data.anchor) as Node3D if not data.anchor.is_empty() else root
		if anchor == null:
			push_warning("HubInteractions: anchor '%s' not found for '%s'" % [data.anchor, data.interaction_id])
			continue
		var wi := WorldInteractable.new()
		wi.name = "Interact_" + data.interaction_id
		wi.data = data
		wi.monitorable = false
		wi.collision_layer = 0
		wi.collision_mask = 1
		wi.add_child(_cylinder(data.radius))
		root.add_child(wi)
		wi.global_position = anchor.global_transform * data.position
		spawned.append(wi)
		_warn_if_inside_portal(wi)

	for portal_name: String in DISTRICTS:
		var portal := root.get_node_or_null(portal_name) as Node3D
		if portal == null:
			continue
		var area := Area3D.new()
		area.name = "Arrival_" + portal_name
		area.monitorable = false
		area.collision_layer = 0
		area.collision_mask = 1
		area.add_child(_cylinder(ARRIVAL_RADIUS))
		root.add_child(area)
		area.global_position = portal.global_position
		area.body_entered.connect(_on_district_entered.bind(portal_name))


## A child standing on an interaction spot must never be inside a portal's
## reach — the portal outranks everything, so pressing interact there would
## travel instead of opening the card. Flags any misplaced spot early.
func _warn_if_inside_portal(wi: WorldInteractable) -> void:
	const PLAYER_RADIUS: float = 0.4
	for portal_name: String in DISTRICTS:
		var portal := get_parent().get_node_or_null(portal_name) as Node3D
		if portal == null:
			continue
		var flat := Vector2(wi.global_position.x - portal.global_position.x, wi.global_position.z - portal.global_position.z)
		if flat.length() < 2.5 + PLAYER_RADIUS:
			push_warning("HubInteractions: '%s' sits inside %s's reach" % [wi.data.interaction_id, portal_name])


func _cylinder(radius: float) -> CollisionShape3D:
	var shape := CylinderShape3D.new()
	shape.radius = radius
	shape.height = 3.0
	var cs := CollisionShape3D.new()
	cs.shape = shape
	cs.position.y = 1.5
	return cs


func _on_district_entered(body: Node3D, portal_name: String) -> void:
	if not body.is_in_group("player"):
		return
	var spec: Array = DISTRICTS[portal_name]
	var director := get_tree().get_first_node_in_group("mq_ambient_director") as AmbientDirector
	if director:
		director.react(spec[1])
	if ProgressManager.discover_world("landmark:" + portal_name):
		var hud := get_tree().get_first_node_in_group("mq_hud")
		var portal: Node = get_parent().get_node(portal_name)
		if hud:
			hud.show_discovery(Localization.t(portal.get("label_key")), Localization.t(spec[0]))
