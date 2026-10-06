class_name PlayerSafety
extends Node
## PlayerSafety — the universal "never stuck" net, part of every Player (so
## every zone has it without any zone scene changing).
##
## - Remembers the last safe position: standing on the floor, inside the
##   zone's playable area, sampled a few times a second.
## - Detects a fall (below the floor) or leaving the playable area (past the
##   zone's ground plus a margin) and brings the player back: a short soft
##   sound, a calm fade with "Let's try that again!", and the player stands
##   at the last safe position again. Nothing is lost: quest progress,
##   coins and activities are untouched. Never a punishment.
## - recover_to_start(): the help panel's "Take me back to the start" — a
##   way out for any situation the automatic checks cannot see.
##
## The playable area comes from the zone itself: its Ground collision box
## (every zone room has one), or — for the round World Hub — a node with a
## `boundary_radius` (HubLandscape's hedge). Without either it falls back
## to a generous square.

signal recovered(to_start: bool)

const FALL_Y: float = -4.0           # this far below the floor = fell
const OUTSIDE_MARGIN: float = 6.0    # metres past the ground's edge
const SAMPLE_SECONDS: float = 0.3
const SAFE_EDGE: float = 0.6         # never remember a spot right at an edge

var _player: CharacterBody3D
var _half: Vector2 = Vector2(40, 40)
var _center: Vector2 = Vector2.ZERO
var _radius: float = 0.0           # > 0: a round play area (the Hub)
var _spawn: Vector3
var _last_safe: Vector3
var _timer: float = 0.0
var _recovering: bool = false
var recover_count: int = 0


func _ready() -> void:
	_player = get_parent() as CharacterBody3D
	_read_area.call_deferred()


func _read_area() -> void:
	if not is_instance_valid(_player):
		return
	_spawn = _player.global_position
	_last_safe = _spawn
	var zone: Node = _player.get_parent()
	var shape_node := zone.get_node_or_null("Ground/CollisionShape3D") as CollisionShape3D
	if shape_node and shape_node.shape is BoxShape3D:
		var s: Vector3 = (shape_node.shape as BoxShape3D).size
		var c: Vector3 = shape_node.global_position
		_half = Vector2(s.x, s.z) * 0.5
		_center = Vector2(c.x, c.z)
		return
	for n in zone.find_children("*", "Node3D", true, false):
		if "boundary_radius" in n:
			_radius = float(n.boundary_radius)
			_center = Vector2(n.global_position.x, n.global_position.z)
			return


## Called by Main after it places the player at the zone's spawn point.
func set_spawn(position: Vector3) -> void:
	_spawn = position
	_last_safe = position


func _physics_process(delta: float) -> void:
	if _recovering or not is_instance_valid(_player):
		return
	var p: Vector3 = _player.global_position
	# Rooms: a few metres of grace past the edge (a fall is caught by FALL_Y
	# anyway). The round Hub is hedged in, so anything past the hedge is out.
	var grace: float = 2.0 if _radius > 0.0 else OUTSIDE_MARGIN
	if p.y < FALL_Y or not is_inside_play_area(p, -grace):
		recover(false)
		return
	_timer += delta
	if _timer < SAMPLE_SECONDS:
		return
	_timer = 0.0
	if _player.is_on_floor() and is_inside_play_area(p, SAFE_EDGE) and absf(p.y) < 0.5:
		_last_safe = p


## True when `p` is inside the play area shrunk by `margin` metres (a
## negative margin grows it).
func is_inside_play_area(p: Vector3, margin: float = 0.0) -> bool:
	var flat := Vector2(p.x, p.z) - _center
	if _radius > 0.0:
		return flat.length() < _radius - margin
	return absf(flat.x) < _half.x - margin and absf(flat.y) < _half.y - margin


func last_safe_position() -> Vector3:
	return _last_safe


func is_recovering() -> bool:
	return _recovering


## Brings the player back to the last safe spot (or the zone's start).
func recover(to_start: bool = false) -> void:
	if _recovering:
		return
	_recovering = true
	recover_count += 1
	var target: Vector3 = _spawn if to_start else _last_safe
	AudioManager.play_sfx("respawn")
	_player.set_physics_process(false)
	_player.velocity = Vector3.ZERO
	var hud: Node = get_tree().get_first_node_in_group("mq_hud")
	var place := func():
		_player.global_position = target
		_player.velocity = Vector3.ZERO
		if "_has_target" in _player:
			_player._has_target = false
	if hud and hud.get("screen_fade"):
		await hud.screen_fade.play(Localization.t("safety.try_again"), place)
	else:
		place.call()
	if is_instance_valid(_player):
		_player.set_physics_process(true)
	_recovering = false
	recovered.emit(to_start)


func recover_to_start() -> void:
	recover(true)
