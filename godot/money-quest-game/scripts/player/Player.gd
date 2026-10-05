class_name Player
extends CharacterBody3D
## Player — the 3D explorer controller for Money Quest World's persistent
## zones (Hub, Golden Vault, ...). Ported from the original 2D tap-to-move
## prototype — see docs/money-quest-world-architecture.md's "what needed
## refactoring" assessment.
##
## THREE input paths feed the same movement, so no platform is a second-
## class citizen (project brief: "do not assume desktop-only interaction"):
##   - Touch / mouse: tap/click a point on the ground, walk there — kept
##     unchanged from the 2D prototype's own reasoning ("navigation must be
##     easy with one hand," no precision clicking required). A virtual
##     joystick overlay is NOT introduced; tap-to-move already satisfies
##     that goal without a new UI control.
##   - Keyboard: WASD / arrow keys via the move_left/right/up/down actions,
##     camera-relative.
##   - Gamepad: left stick, bound to the SAME four actions (Godot's
##     Input.get_vector already merges keyboard and joypad axis input, so
##     no separate gamepad branch is needed).
##
## CameraController (see CameraController.gd) supplies the camera whose
## forward/right vectors keyboard/gamepad movement is projected onto; tap-
## to-move needs no camera reference beyond casting the initial ray.

const SPEED: float = 4.5
const ARRIVE_DISTANCE: float = 0.3
const GRAVITY: float = 9.8
const ROTATION_SPEED: float = 10.0

@onready var interaction_manager: InteractionManager = $InteractionManager

## The stylised character body built from the child's AvatarConfig (see
## CharacterBuilder) — a child node named "VisualRoot". It only reads this
## body's velocity to animate; it never moves anything itself.
var visual: CharacterRig = null

var _target_position: Vector3 = Vector3.ZERO
var _has_target: bool = false


func _ready() -> void:
	add_to_group("player")
	_target_position = global_position
	_apply_avatar_config()


## Renders the child's AvatarCreation.tscn choices as this 3D body —
## every choice there is purely cosmetic (see AvatarConfig.gd), so nothing
## here changes SPEED, the collision shape, or any gameplay behavior,
## including the wheelchair look (preset-d), which is just another look and
## never tied to a different movement speed or interaction range.
func _apply_avatar_config() -> void:
	if visual:
		visual.queue_free()
	visual = CharacterBuilder.build(CharacterLook.from_avatar_config(ProgressManager.avatar_config), true)
	add_child(visual)


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("interact"):
		interaction_manager.try_interact()
		return
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		_set_target_from_screen_point(event.position)
	elif event is InputEventScreenTouch and event.pressed:
		_set_target_from_screen_point(event.position)


## Casts a ray from the active camera through the tapped/clicked screen
## point and intersects it with the zone's ground plane (y = 0, per every
## zone's own authoring convention) — the 3D equivalent of the 2D
## prototype's "walk to where you tapped," resolved through the camera
## instead of a flat 2D view. Works even before a zone has real floor
## collision geometry, since it never requires a physics raycast hit.
func _set_target_from_screen_point(screen_point: Vector2) -> void:
	var camera: Camera3D = get_viewport().get_camera_3d()
	if not camera:
		return
	var from: Vector3 = camera.project_ray_origin(screen_point)
	var direction: Vector3 = camera.project_ray_normal(screen_point)
	if absf(direction.y) < 0.0001:
		return
	var t: float = -from.y / direction.y
	if t < 0.0:
		return
	_target_position = from + direction * t
	_target_position.y = global_position.y
	_has_target = true


func _physics_process(delta: float) -> void:
	var move_input: Vector2 = Input.get_vector("move_left", "move_right", "move_up", "move_down")

	if move_input != Vector2.ZERO:
		# A keyboard/gamepad nudge always overrides a pending tap-to-move
		# target — whichever input the child used most recently wins.
		_has_target = false
		_move(_camera_relative_direction(move_input), delta)
	elif _has_target:
		var to_target: Vector3 = _target_position - global_position
		to_target.y = 0.0
		if to_target.length() <= ARRIVE_DISTANCE:
			_has_target = false
			velocity.x = 0.0
			velocity.z = 0.0
		else:
			_move(to_target.normalized(), delta)
	else:
		velocity.x = 0.0
		velocity.z = 0.0

	if not is_on_floor():
		velocity.y -= GRAVITY * delta
	else:
		velocity.y = 0.0

	move_and_slide()


func _camera_relative_direction(move_input: Vector2) -> Vector3:
	var camera: Camera3D = get_viewport().get_camera_3d()
	var basis: Basis = camera.global_transform.basis if camera else Basis.IDENTITY
	var forward: Vector3 = -basis.z
	var right: Vector3 = basis.x
	forward.y = 0.0
	right.y = 0.0
	return forward.normalized() * -move_input.y + right.normalized() * move_input.x


func _move(direction: Vector3, delta: float) -> void:
	velocity.x = direction.x * SPEED
	velocity.z = direction.z * SPEED
	if direction.length() > 0.01:
		var target_angle: float = atan2(direction.x, direction.z)
		if Settings.reduced_motion:
			# The turn-to-face easing is the non-essential animation here
			# (see Settings.gd's project-wide reduced-motion rule) — snap
			# to facing the move direction instead of smoothly rotating.
			rotation.y = target_angle
		else:
			rotation.y = lerp_angle(rotation.y, target_angle, ROTATION_SPEED * delta)


## Called by an on-screen mobile "Talk" button as an alternative to the
## keyboard/gamepad interact action — see InteractionManager.try_interact()'s
## own comment for why both input paths are first-class, not a fallback.
func request_interact() -> void:
	interaction_manager.try_interact()
