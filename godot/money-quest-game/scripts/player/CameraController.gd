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

@onready var _camera: Camera3D = $Camera3D

var _yaw: float = 0.0


func _ready() -> void:
	_camera.current = true
	_yaw = follow_offset.signed_angle_to(Vector3.FORWARD, Vector3.UP) if follow_offset.length() > 0.0 else 0.0


func _unhandled_input(event: InputEvent) -> void:
	# Desktop-only nicety — touch and gamepad players never trigger this,
	# and the camera still follows correctly without it (see _physics_process).
	if event is InputEventMouseMotion and Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT):
		_yaw -= event.relative.x * mouse_look_sensitivity


func _physics_process(delta: float) -> void:
	if not target:
		return

	var rotated_offset: Vector3 = follow_offset.rotated(Vector3.UP, _yaw)
	var desired_position: Vector3 = target.global_position + rotated_offset
	if Settings.reduced_motion:
		# The follow-smoothing itself is the non-essential animation here
		# (per Settings.gd's own "any tween/animation anywhere in this
		# project MUST check reduced_motion" rule) — snap straight to the
		# target position instead of easing into it.
		global_position = desired_position
	else:
		global_position = global_position.lerp(desired_position, 1.0 - exp(-follow_speed * delta))
	look_at(target.global_position + Vector3.UP * 1.0, Vector3.UP)
