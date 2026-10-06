class_name GuidanceSystem
extends Node3D
## GuidanceSystem — helps the player find the current objective without
## pushing them down a corridor. Add one to a zone (a zone flow does).
##
## Guidance grows only when it is needed (levels):
##   1  nothing obvious — the room's own landmarks and paths do the work;
##   2  the goal itself is easy to spot (the gold "!" bubble over an NPC,
##      a shimmering coin, a glowing jar — the targets do this);
##   3  a small gold marker floats over a goal that is not a person;
##   4  "Need a little help?" — if the player seems stuck (no progress
##      toward the goal for a while), a friendly offer appears; accepting
##      it (or "Show me the way" in the help panel) lights a trail of soft
##      gold lights on the floor from the player to the goal;
##   5  if they are still stuck after the trail, a short spoken/subtitled
##      direction ("Follow the golden lights!").
## Declining is always fine and nothing is ever lost. Hints can be turned
## off (Settings.hints); the help panel always works.
##
## Cheap by design: progress is checked once a second, the trail is one
## MultiMesh rebuilt a few times a second only while it is shown, and its
## shimmer runs on the GPU (stopped by Reduced Motion).

const CHECK_SECONDS: float = 1.0
const STUCK_SECONDS: float = 18.0     # no progress for this long = maybe stuck
const PROGRESS_METRES: float = 1.5    # getting this much closer counts as progress
const OFFER_COOLDOWN: float = 45.0
const TRAIL_SECONDS: float = 20.0
const TRAIL_SPACING: float = 0.8
const ARRIVED_METRES: float = 3.0
const MAX_DOTS: int = 40

var level: int = 2
var offers_made: int = 0
var trail_shown_count: int = 0

var _player: Node3D
var _check: float = 0.0
var _best_distance: float = INF
var _stuck_for: float = 0.0
var _since_offer: float = OFFER_COOLDOWN
var _trail_left: float = 0.0
var _trail_refresh: float = 0.0
var _after_trail_stuck: float = 0.0
var _objective_id: String = ""
var _trail: MultiMeshInstance3D
var _marker: Node3D
var _time: float = 0.0
static var _dot_material: ShaderMaterial


func _ready() -> void:
	name = "GuidanceSystem"
	_trail = MultiMeshInstance3D.new()
	_trail.name = "Trail"
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.mesh = DecorKit.cyl(0.24, 0.24, 0.02, 16)
	mm.instance_count = MAX_DOTS
	mm.visible_instance_count = 0
	_trail.multimesh = mm
	_trail.material_override = _dot_mat()
	_trail.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(_trail)
	_marker = _build_marker()
	add_child(_marker)
	ObjectiveManager.objective_changed.connect(_on_objective_changed)
	var hud: Node = get_tree().get_first_node_in_group("mq_hud")
	if hud:
		hud.show_way_requested.connect(show_trail)
	Settings.reduced_motion_changed.connect(func(_v): _apply_motion())
	_apply_motion()
	_on_objective_changed()


func _exit_tree() -> void:
	var hud: Node = get_tree().get_first_node_in_group("mq_hud") if is_inside_tree() else null
	if hud and hud.show_way_requested.is_connected(show_trail):
		hud.show_way_requested.disconnect(show_trail)


func _on_objective_changed() -> void:
	if ObjectiveManager.objective_id != _objective_id:
		_objective_id = ObjectiveManager.objective_id
		_best_distance = INF
		_stuck_for = 0.0
		_after_trail_stuck = 0.0
		hide_trail()


func is_trail_visible() -> bool:
	return _trail_left > 0.0


## Lights the trail to the current objective (level 4).
func show_trail() -> void:
	if ObjectiveManager.target() == null:
		return
	level = maxi(level, 4)
	trail_shown_count += 1
	_trail_left = TRAIL_SECONDS
	_trail_refresh = 0.0
	_after_trail_stuck = 0.0
	AudioManager.play_sfx("hint", 1.2, -4.0)


func hide_trail() -> void:
	_trail_left = 0.0
	_trail.multimesh.visible_instance_count = 0


func _process(delta: float) -> void:
	_time += delta
	var target: Node3D = ObjectiveManager.target()
	if _player == null or not is_instance_valid(_player):
		_player = _find_player()
	_update_marker(target)
	if target == null or _player == null:
		hide_trail()
		return
	if _trail_left > 0.0:
		_trail_left -= delta
		_trail_refresh -= delta
		if _trail_refresh <= 0.0:
			_trail_refresh = 0.25
			_build_trail(_player.global_position, target.global_position)
		if _trail_left <= 0.0 or _flat_distance(_player, target) < ARRIVED_METRES:
			hide_trail()
	_check += delta
	if _check < CHECK_SECONDS:
		return
	_check = 0.0
	_since_offer += CHECK_SECONDS
	if _busy():
		return
	var d: float = _flat_distance(_player, target)
	if d < _best_distance - PROGRESS_METRES or d < ARRIVED_METRES:
		_best_distance = d
		_stuck_for = 0.0
		_after_trail_stuck = 0.0
		return
	_stuck_for += CHECK_SECONDS
	if trail_shown_count > 0 and _trail_left <= 0.0:
		_after_trail_stuck += CHECK_SECONDS
		if _after_trail_stuck >= STUCK_SECONDS * 1.5:
			_after_trail_stuck = 0.0
			level = 5
			AudioManager.say(Localization.t("hint.direct", {"goal": ObjectiveManager.text()}))
	if Settings.hints and _stuck_for >= STUCK_SECONDS and _since_offer >= OFFER_COOLDOWN and _trail_left <= 0.0:
		_stuck_for = 0.0
		_since_offer = 0.0
		offers_made += 1
		var hud: Node = get_tree().get_first_node_in_group("mq_hud")
		if hud:
			hud.offer_hint()


## Not while a dialogue, panel or menu is open (the child is busy reading).
func _busy() -> bool:
	return UIFocus.visible_focus(get_viewport()) != null or DialogueBox.visible or QuestManager._active


func _flat_distance(a: Node3D, b: Node3D) -> float:
	return Vector2(a.global_position.x - b.global_position.x, a.global_position.z - b.global_position.z).length()


func _find_player() -> Node3D:
	for p in get_tree().get_nodes_in_group("player"):
		# The player whose zone contains this node (wherever it sits in it).
		if not p.is_queued_for_deletion() and p.get_parent().is_ancestor_of(self):
			return p
	return null


func _build_trail(from: Vector3, to: Vector3) -> void:
	var a := Vector3(from.x, 0.13, from.z)
	var b := Vector3(to.x, 0.13, to.z)
	var dir: Vector3 = b - a
	var length: float = dir.length() - 1.6
	if length <= 1.2:
		_trail.multimesh.visible_instance_count = 0
		return
	dir = dir.normalized()
	var n: int = mini(int((length - 1.2) / TRAIL_SPACING) + 1, MAX_DOTS)
	for i in n:
		var p: Vector3 = a + dir * (1.2 + i * TRAIL_SPACING)
		_trail.multimesh.set_instance_transform(i, Transform3D(Basis.IDENTITY, to_local(p)))
	_trail.multimesh.visible_instance_count = n


# --- the floating marker (goals that are not people) ------------------------------

func _build_marker() -> Node3D:
	var m := MeshMerger.new()
	m.part(DecorKit.prism(Vector3(0.36, 0.32, 0.12)), DecorKit.mat("gold", 0.6), Vector3(0, 0, 0), Vector3(0, 0, 180))
	m.part(DecorKit.sphere(0.07, 8, 4), DecorKit.mat("gold", 0.6), Vector3(0, 0.3, 0))
	var mi: MeshInstance3D = m.commit_to(self, "ObjectiveMarker", false)
	remove_child(mi)
	mi.visible = false
	return mi


func _update_marker(target: Node3D) -> void:
	var show: bool = target != null and not (target is NPC) and level >= 2
	_marker.visible = show
	if not show:
		return
	var bob: float = 0.0 if Settings.reduced_motion else sin(_time * 2.6) * 0.08
	var h: float = float(target.get_meta("marker_height", 1.6))
	_marker.global_position = target.global_position + Vector3(0, h + bob, 0)
	if not Settings.reduced_motion:
		_marker.rotation.y = _time * 1.2


static func _dot_mat() -> ShaderMaterial:
	if _dot_material == null:
		var sh := Shader.new()
		sh.code = """shader_type spatial;
render_mode unshaded, blend_mix, cull_disabled, shadows_disabled;
uniform float motion = 1.0;
varying float wave;
void vertex() {
	wave = 0.5 + 0.5 * sin(TIME * 4.0 - float(INSTANCE_ID) * 0.7);
}
void fragment() {
	ALBEDO = mix(vec3(1.0, 0.82, 0.25), vec3(1.0, 0.97, 0.7), wave * motion);
	ALPHA = 0.9;
}
"""
		_dot_material = ShaderMaterial.new()
		_dot_material.shader = sh
	return _dot_material


func _apply_motion() -> void:
	_dot_mat().set_shader_parameter("motion", 0.0 if Settings.reduced_motion else 1.0)
