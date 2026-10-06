class_name CameraController
extends Node3D
## CameraController — a simple third-person follow camera. New this phase:
## the 2D prototype had no camera system at all (the viewport simply showed
## the whole 2D room), but a real 3D world needs one. Kept deliberately
## plain — a fixed offset that smoothly follows the player and an optional
## mouse-look yaw for desktop — rather than a full orbit/collision camera
## rig, matching the brief's "do not over-engineer what a first playable
## slice needs."
##
## Expected scene placement: a sibling of Player inside each zone scene,
## with `target` assigned to that zone's Player instance — see
## scenes/world/zones/golden_vault/GoldenVault.tscn.

@export var target: Node3D
@export var follow_offset: Vector3 = Vector3(0, 5, 7)
@export var follow_speed: float = 6.0
@export var mouse_look_sensitivity: float = 0.005
## Optional: physics layers that block the camera's view of the player.
## When set, the camera moves in front of anything on these layers instead
## of ending up inside it (the World Hub uses this for its landmark
## buildings, which sit on layer 2). 0 — the default — keeps the original
## plain follow behaviour, so zones that don't opt in are unchanged.
@export_flags_3d_physics var occlusion_mask: int = 0

## Optional: when true, the camera starts exactly at follow_offset (behind
## and above the player, looking the way the scene was authored). The
## default `false` keeps the original start-up yaw derived in _ready(),
## which turns the offset roughly 145° — every existing zone was built and
## tested with that, so it stays unchanged unless a scene opts in.
@export var use_authored_offset: bool = false

const OCCLUSION_MARGIN: float = 0.4
const TURN_SPEED: float = 1.8   # radians per second at full stick / key

@onready var _camera: Camera3D = $Camera3D

var _yaw: float = 0.0


func _ready() -> void:
	_camera.current = true
	_camera.fov = Settings.camera_fov
	Settings.changed.connect(_on_setting_changed)
	if use_authored_offset:
		_yaw = 0.0
	else:
		_yaw = follow_offset.signed_angle_to(Vector3.FORWARD, Vector3.UP) if follow_offset.length() > 0.0 else 0.0


func _unhandled_input(event: InputEvent) -> void:
	# Desktop-only nicety — touch and gamepad players never trigger this,
	# and the camera still follows correctly without it (see _physics_process).
	if event is InputEventMouseMotion and Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT):
		_yaw -= event.relative.x * mouse_look_sensitivity * Settings.camera_sensitivity


func _physics_process(delta: float) -> void:
	if not target:
		return
	# Keyboard (Z / X) and the right stick turn the camera too, at a calm
	# pace scaled by the camera-speed setting. Only ever on the player's
	# own input — the camera never turns by itself.
	var turn: float = Input.get_axis("camera_left", "camera_right")
	if turn != 0.0 and UIFocus.visible_focus(get_viewport()) == null:
		_yaw -= turn * TURN_SPEED * Settings.camera_sensitivity * delta

	var rotated_offset: Vector3 = follow_offset.rotated(Vector3.UP, _yaw)
	var desired_position: Vector3 = target.global_position + rotated_offset
	var pulled_in: bool = false
	if occlusion_mask != 0:
		var unblocked: Vector3 = _unoccluded_position(target.global_position + Vector3.UP * 1.2, desired_position)
		pulled_in = not unblocked.is_equal_approx(desired_position)
		desired_position = unblocked
	if Settings.reduced_motion or pulled_in or not Settings.camera_smoothing:
		# The follow-smoothing itself is the non-essential animation here
		# (per Settings.gd's own "any tween/animation anywhere in this
		# project MUST check reduced_motion" rule) — snap straight to the
		# target position instead of easing into it. Pulling in front of an
		# occluding building also snaps: easing would let the camera pass
		# through the wall first.
		global_position = desired_position
	else:
		global_position = global_position.lerp(desired_position, 1.0 - exp(-follow_speed * delta))
	look_at(target.global_position + Vector3.UP * 1.0, Vector3.UP)


func _unoccluded_position(from: Vector3, to: Vector3) -> Vector3:
	var query := PhysicsRayQueryParameters3D.create(from, to, occlusion_mask)
	var hit: Dictionary = get_world_3d().direct_space_state.intersect_ray(query)
	if hit.is_empty():
		return to
	return hit.position + (from - to).normalized() * OCCLUSION_MARGIN


func _on_setting_changed(key: String, value: Variant) -> void:
	if key == "camera_fov" and is_instance_valid(_camera):
		_camera.fov = float(value)
