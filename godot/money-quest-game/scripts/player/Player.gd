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
const STEP_LENGTH: float = 0.62

@onready var interaction_manager: InteractionManager = $InteractionManager

## The stylised character body built from the child's AvatarConfig (see
## CharacterBuilder) — a child node named "VisualRoot". It only reads this
## body's velocity to animate; it never moves anything itself.
var visual: CharacterRig = null

var _target_position: Vector3 = Vector3.ZERO
var _has_target: bool = false
var _step_distance: float = 0.0
var _step_left: bool = false
## The universal safety net (see PlayerSafety): brings the player back to
## safe ground after a fall or if they leave the playable area.
var safety: PlayerSafety


func _ready() -> void:
	add_to_group("player")
	_target_position = global_position
	safety = PlayerSafety.new()
	safety.name = "Safety"
	add_child(safety)
	_apply_avatar_config()
	ChoicePanel.answer_checked.connect(_on_answer_checked)
	ObjectiveManager.objective_completed.connect(_on_objective_completed)
	interaction_manager.nearest_interaction_changed.connect(_on_nearest_changed)


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
	# The player's own character idles only after standing still a while,
	# looks toward whatever is in reach, and reacts to what happens.
	visual.behaviour = CharacterBehaviour.preset("player")
	visual.idle_delay = 6.0
	visual.idle_phase = 0.41


func _unhandled_input(event: InputEvent) -> void:
	# Space and the gamepad's A button are both "interact" and "ui_accept".
	# While a UI button has focus, that press belongs to the button (Godot
	# doesn't mark it handled), so it must not also reach the world here.
	if event.is_action("ui_accept") and get_viewport().gui_get_focus_owner() != null:
		return
	if event.is_action_pressed("interact"):
		request_interact()
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
	# While a menu or dialogue has keyboard/gamepad focus, the arrows and the
	# stick move between its buttons — they must not also walk the player.
	if _ui_has_focus():
		move_input = Vector2.ZERO

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
	_footsteps(delta)


## Soft footsteps while walking on the ground (alternating, slightly
## varied); a wheelchair rolls quietly instead. Nothing important is ever
## carried by this sound.
func _footsteps(delta: float) -> void:
	var speed: float = Vector2(velocity.x, velocity.z).length()
	if not is_on_floor() or speed < 0.5:
		_step_distance = 0.0
		return
	_step_distance += speed * delta
	if _step_distance >= STEP_LENGTH:
		_step_distance = 0.0
		if visual and visual.seated:
			return
		_step_left = not _step_left
		AudioManager.play_sfx("step_a" if _step_left else "step_b", randf_range(0.92, 1.08), -10.0)


## True while a visible on-screen control (a menu, a dialogue button) has
## keyboard/gamepad focus. A hidden control that still holds focus never
## blocks walking.
func _ui_has_focus() -> bool:
	return UIFocus.visible_focus(get_viewport()) != null


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
	if visual and interaction_manager.get_nearest() != null:
		visual.play_reaction("interact")
	interaction_manager.try_interact()


# --- reactions (purely visual; the meaning is always also shown as text) ---

## Look toward the thing in reach (an NPC's face, an object's middle).
func _on_nearest_changed(target: Interaction) -> void:
	if visual == null:
		return
	visual.look_target = target
	if target:
		visual.look_height = 1.45 if target is NPC else clampf(target.prompt_height * 0.45, 0.4, 2.0)


func _on_answer_checked(correct: bool) -> void:
	if visual and is_inside_tree():
		visual.play_reaction("happy" if correct else "confused")


## A small celebration when a mission step is done (the objective card
## says so in words as well).
func _on_objective_completed(_id: String) -> void:
	if visual and is_inside_tree():
		visual.play_reaction("celebrate")
		_confetti()


## A small, short burst of paper confetti around the character (none with
## Reduced Motion). One-shot particles, freed when done.
func _confetti() -> void:
	if Settings.reduced_motion:
		return
	var p := CPUParticles3D.new()
	p.name = "Confetti"
	p.one_shot = true
	p.amount = 36
	p.lifetime = 1.6
	p.explosiveness = 0.9
	p.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
	p.emission_sphere_radius = 0.3
	p.direction = Vector3.UP
	p.spread = 55.0
	p.initial_velocity_min = 2.5
	p.initial_velocity_max = 4.0
	p.gravity = Vector3(0, -6.0, 0)
	p.angular_velocity_min = -360.0
	p.angular_velocity_max = 360.0
	var q := QuadMesh.new()
	q.size = Vector2(0.07, 0.11)
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.vertex_color_use_as_albedo = true
	mat.billboard_mode = BaseMaterial3D.BILLBOARD_PARTICLES
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	q.material = mat
	p.mesh = q
	var g := Gradient.new()
	g.offsets = PackedFloat32Array([0.0, 0.25, 0.5, 0.75, 1.0])
	g.colors = PackedColorArray([Color("E8A33D"), Color("0F7A6B"), Color("F07A5A"), Color("367D99"), Color("A99BD9")])
	p.color_initial_ramp = g
	p.position = Vector3(0, 1.8, 0)
	p.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(p)
	p.emitting = true
	p.finished.connect(p.queue_free)
