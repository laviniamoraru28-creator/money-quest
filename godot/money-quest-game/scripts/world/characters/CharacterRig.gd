class_name CharacterRig
extends Node3D
## CharacterRig — the "alive" layer on top of a built character (see
## CharacterBuilder). Everything is procedural and cheap (a few transform
## writes per frame, no skeleton, no AnimationPlayer):
##
## - Walk: alternating legs with a soft knee bend, opposite arm swing, a
##   small step bounce (the player); wheel spin for a wheelchair.
## - Idle: breathing, a slow weight shift, natural blinking, and quiet idle
##   ACTIONS chosen by the character's CharacterBehaviour profile (a
##   librarian reads, a shopkeeper checks the counter, a child bounces on
##   their toes, a guide points at an exhibit...). One action at a time,
##   several seconds apart; none while the player is close.
## - Attention: look_target turns the head toward someone or something;
##   glance_at() looks at a world point for a moment (an ambient event);
##   greet() says hello in the profile's way (wave / nod / both hands).
## - Talking: the mouth moves with small nods and hand gestures (one hand,
##   or both for "lively" talkers) while their line is on screen.
## - Reactions: play_reaction() — "happy", "celebrate", "confused",
##   "nod", "interact", "wave" — short, small and never repeated in a loop.
##
## Movement stays authoritative: the rig only READS its parent
## CharacterBody3D's velocity. Reduced Motion (Settings.reduced_motion):
## all of this is non-essential, so the rig holds a still resting pose —
## eyes open, mouth closed, no bounce, gestures or reactions (whatever a
## reaction communicates is always shown as text too). Characters far from
## the camera skip their update entirely.

const WALK_SPEED_REFERENCE: float = 4.5   # Player.SPEED — full stride at walking speed
const STRIDE_RATE: float = 9.4           # radians of walk cycle per second at full speed
const WHEEL_RADIUS: float = 0.3
const BLINK_SECONDS: float = 0.12
const LOOK_RANGE: float = 7.0
const WAVE_SECONDS: float = 2.6
## Beyond this distance from the camera a character is not animated.
const CULL_DISTANCE: float = 30.0
## Idle actions and how long each lasts (seconds).
const ACTIONS: Dictionary = {
	"nod": 1.6, "gesture": 2.6, "look_side": 3.2, "point": 3.0, "check_counter": 3.4,
	"read": 4.0, "adjust_glasses": 1.8, "tend": 3.6, "bounce": 1.6, "stretch": 2.8,
	"hands_behind": 4.0,
}
const REACTIONS: Dictionary = {
	"happy": 1.4, "celebrate": 1.9, "confused": 2.0, "nod": 1.2, "interact": 0.7, "both_wave": 2.2,
}

var body: Node3D
var arm_l: Node3D
var arm_r: Node3D
var hip_l: Node3D
var hip_r: Node3D
var knee_l: Node3D
var knee_r: Node3D
var wheel_l: Node3D
var wheel_r: Node3D
var head: Node3D
var eyelids: Node3D
var mouth: Node3D
var seated: bool = false
var body_base_y: float = 0.0
## A deterministic phase from the character's id, so neighbours never
## move in unison.
var idle_phase: float = 0.0
## The Hub Guide also gives a small wave by itself now and then.
var can_wave: bool = false
## Someone (or something) to look at while they are near.
var look_target: Node3D = null
## Height of the point on look_target to look at (a person's eyes ≈ 1.45).
var look_height: float = 1.45
## While true: mouth moves, small nods and hand gestures.
var talking: bool = false
## How this character idles (see CharacterBehaviour).
var behaviour: CharacterBehaviour = CharacterBehaviour.preset("default")
## The player's character idles only after standing still this long.
var idle_delay: float = 0.0
## Walking speed (m/s) for a character moved by script rather than by
## physics (an NPC demonstrating something); -1 = read the parent body.
var walk_override: float = -1.0

var _arm_rest_l: Basis
var _arm_rest_r: Basis
var _phase: float = 0.0
var _walk: float = 0.0
var _time: float = 0.0
var _still_time: float = 0.0
var _resting: bool = false
var _next_blink: float = 2.0
var _blink_until: float = -1.0
var _wave_t: float = -1.0
var _head_yaw: float = 0.0
var _head_pitch: float = 0.0
var _head_roll: float = 0.0
var _action: String = ""
var _action_t: float = 0.0
var _next_action: float = 6.0
var _action_count: int = 0
var _reaction: String = ""
var _reaction_t: float = 0.0
var _glance_point: Vector3 = Vector3.ZERO
var _glance_until: float = -1.0
var _cull_check: float = 0.0
var _culled: bool = false
# The pose offsets for this frame (filled by _pose_*; scaled by envelopes).
var _o_head := Vector3.ZERO     # pitch, yaw, roll
var _o_arm_r := Vector3.ZERO    # x (forward raise -), z (side raise), y twist
var _o_arm_l := Vector3.ZERO
var _o_body_pitch: float = 0.0
var _o_body_y: float = 0.0
var _o_mouth: float = 0.0


func _ready() -> void:
	# Each character breathes (and blinks) slightly out of step with the others.
	_time = float(get_instance_id() % 997) * 0.37
	_next_blink = _time + 1.0 + fmod(idle_phase * 13.0, 3.0)
	_next_action = _time + 3.0 + fmod(idle_phase * 31.0, 6.0)
	if arm_l:
		_arm_rest_l = arm_l.basis
	if arm_r:
		_arm_rest_r = arm_r.basis


func apply_rest_pose() -> void:
	if body:
		body.position.y = body_base_y
		body.scale = Vector3.ONE
		body.rotation = Vector3.ZERO
	for hip in [hip_l, hip_r]:
		if hip:
			hip.rotation = Vector3(-PI * 0.5 if seated else 0.0, 0, 0)
	for knee in [knee_l, knee_r]:
		if knee:
			knee.rotation = Vector3(PI * 0.5 if seated else 0.0, 0, 0)
	if arm_l and _arm_rest_l != Basis():
		arm_l.basis = _arm_rest_l
	if arm_r and _arm_rest_r != Basis():
		arm_r.basis = _arm_rest_r
	if head:
		head.rotation = Vector3.ZERO
	if eyelids:
		eyelids.visible = false
	if mouth:
		mouth.visible = false
	_head_yaw = 0.0
	_head_pitch = 0.0
	_head_roll = 0.0


# --- public ----------------------------------------------------------------------

## A friendly wave (e.g. greeting the player). Ignored with Reduced Motion.
func wave_once() -> void:
	if not Settings.reduced_motion and arm_r:
		_wave_t = 0.0


func is_waving() -> bool:
	return _wave_t >= 0.0


## Says hello the way this character does (behaviour.greet).
func greet() -> void:
	match behaviour.greet:
		"nod":
			play_reaction("nod")
		"both":
			play_reaction("both_wave")
		_:
			wave_once()


## A short reaction: "happy", "celebrate", "confused", "nod", "interact",
## "both_wave". Ignored with Reduced Motion (the meaning is always also
## shown as text by whoever triggers it).
func play_reaction(kind: String) -> void:
	if Settings.reduced_motion or not REACTIONS.has(kind):
		return
	_reaction = kind
	_reaction_t = 0.0
	_action = ""   # a reaction interrupts an idle action


func is_reacting() -> bool:
	return _reaction != ""


func current_action() -> String:
	return _action


## Turn toward a world point and point at it (a demonstration: "this one").
func point_at(world_pos: Vector3, seconds: float = 2.4) -> void:
	var d: Vector3 = world_pos - global_position
	d.y = 0.0
	if d.length() > 0.05:
		global_rotation.y = atan2(d.x, d.z)
	glance_at(world_pos + Vector3(0, 0.3, 0), seconds)
	if Settings.reduced_motion or arm_r == null:
		return
	_reaction = ""
	_action = "point"
	_action_t = 0.0
	_next_action = _time + seconds + 4.0


## Something held in the right hand (a coin to pay with, a bought item);
## null to let go. Returns the holder node.
func hold(item: Node3D) -> void:
	if arm_r == null:
		return
	var old: Node = arm_r.get_node_or_null("Held")
	if old:
		old.queue_free()
	if item == null:
		return
	item.name = "Held"
	item.position = Vector3(0, -0.5, 0.06)
	arm_r.add_child(item)


## Look at a world point for a few seconds (something happening nearby).
func glance_at(point: Vector3, seconds: float = 2.5) -> void:
	_glance_point = point
	_glance_until = _time + seconds


# --- update ------------------------------------------------------------------------

func _process(delta: float) -> void:
	if Settings.reduced_motion:
		if not _resting:
			apply_rest_pose()
			_resting = true
		_wave_t = -1.0
		_reaction = ""
		_action = ""
		return
	_resting = false
	# Far from the camera: nobody can see the detail — skip the update
	# (checked a few times a second, not every frame).
	_cull_check -= delta
	if _cull_check <= 0.0:
		_cull_check = 0.3
		var cam: Camera3D = get_viewport().get_camera_3d()
		_culled = cam != null and cam.global_position.distance_to(global_position) > CULL_DISTANCE
	if _culled:
		return
	_time += delta * (0.85 + 0.15 * behaviour.energy)
	_blink()

	var speed: float = 0.0
	var parent := get_parent()
	if walk_override >= 0.0:
		speed = walk_override
	elif parent is CharacterBody3D:
		speed = Vector2(parent.velocity.x, parent.velocity.z).length()
	_walk = lerpf(_walk, clampf(speed / WALK_SPEED_REFERENCE, 0.0, 1.0), 1.0 - exp(-10.0 * delta))
	_still_time = 0.0 if speed > 0.2 else _still_time + delta

	_o_head = Vector3.ZERO
	_o_arm_r = Vector3.ZERO
	_o_arm_l = Vector3.ZERO
	_o_body_pitch = 0.0
	_o_body_y = 0.0
	_o_mouth = 0.0
	_update_action(delta)
	_update_reaction(delta)
	_mouth()

	if hip_l == null:
		_npc_pose(delta)
		return
	if seated:
		if wheel_l and speed > 0.01:
			var spin: float = speed * delta / WHEEL_RADIUS
			wheel_l.rotate_x(spin)
			wheel_r.rotate_x(spin)
		if body:
			body.position.y = body_base_y + sin(_time * 1.6) * 0.003 + _o_body_y * 0.3
		_arms(Basis(), Basis())
		_head(delta)
		return

	_phase = fmod(_phase + delta * STRIDE_RATE * _walk, TAU)
	var s: float = sin(_phase)
	hip_l.rotation.x = s * 0.5 * _walk
	hip_r.rotation.x = -s * 0.5 * _walk
	knee_l.rotation.x = maxf(0.0, s) * 0.7 * _walk
	knee_r.rotation.x = maxf(0.0, -s) * 0.7 * _walk
	_arms(Basis(Vector3.RIGHT, -s * 0.45 * _walk), Basis(Vector3.RIGHT, s * 0.45 * _walk))
	var bounce: float = absf(cos(_phase)) * 0.022 * _walk
	var breath: float = sin(_time * 1.8) * 0.005 * (1.0 - _walk)
	body.position.y = body_base_y + bounce + breath + _o_body_y
	# Standing still: a slow, slight weight shift from foot to foot.
	body.rotation.z = sin(_time * 0.45 + idle_phase) * 0.012 * (1.0 - _walk)
	body.rotation.x = _o_body_pitch
	_head(delta)


## Blinks every 2.5–5.5 s (sometimes a quick double blink).
func _blink() -> void:
	if eyelids == null:
		return
	if _time >= _next_blink:
		_blink_until = _time + BLINK_SECONDS
		var r: float = _rand(_time * 12.9898)
		_next_blink = _time + (0.25 if r < 0.12 else 2.5 + r * 3.0)
	eyelids.visible = _time < _blink_until


func _mouth() -> void:
	if mouth == null:
		return
	var open: float = 0.0
	if talking:
		open = 0.35 + 0.65 * absf(sin(_time * 10.5)) * (0.6 + 0.4 * sin(_time * 3.1))
	elif _o_mouth > 0.05:
		open = _o_mouth   # a happy, open smile during a reaction
	mouth.visible = open > 0.0
	if mouth.visible:
		# Talking opens and closes; a happy reaction is a wide, flat smile.
		mouth.scale = Vector3(1.0, open, 1.0) if talking else Vector3(1.2, open * 0.55, 1.0)


## A deterministic pseudo-random value in [0, 1) for this character.
func _rand(x: float) -> float:
	return fposmod(sin(x + idle_phase * 78.233) * 43758.5453, 1.0)


## 0 → 1 → 0 over `dur`: eases in over `in_s`, out over the last `out_s`.
static func _env(t: float, dur: float, in_s: float = 0.4, out_s: float = 0.5) -> float:
	return smoothstep(0.0, in_s, t) * (1.0 - smoothstep(dur - out_s, dur, t))


# --- idle actions --------------------------------------------------------------------

func _update_action(delta: float) -> void:
	var busy: bool = talking or _reaction != "" or _wave_t >= 0.0 or _walk > 0.15 or _still_time < idle_delay
	var attending: bool = _look_direction() != Vector3.ZERO and hip_l == null   # an NPC with the player near
	if _action == "":
		if _time >= _next_action:
			if busy or attending:
				_next_action = _time + 2.0
			else:
				_action_count += 1
				_action = behaviour.pick(_rand(float(_action_count) * 7.31))
				_action_t = 0.0
				var r: float = _rand(float(_action_count) * 3.17 + 1.0)
				_next_action = _time + ACTIONS.get(_action, 2.0) + lerpf(behaviour.every.x, behaviour.every.y, r)
		return
	_action_t += delta
	var dur: float = ACTIONS.get(_action, 2.0)
	if _action_t >= dur or talking or _walk > 0.3:
		_action = ""
		return
	_pose_action(_action, _action_t, _env(_action_t, dur))


## The pose of an idle action at time t, scaled by its envelope k.
func _pose_action(a: String, t: float, k: float) -> void:
	var side: float = 1.0 if _rand(float(_action_count)) < 0.5 else -1.0
	match a:
		"nod":
			_o_head.x += (0.12 * maxf(0.0, sin(t * 7.5))) * k
		"gesture":
			_o_arm_r += Vector3(-0.75 - 0.12 * sin(t * 3.0), 0, -0.25) * k
			_o_head.z += 0.06 * k
		"look_side":
			_o_head.y += 0.55 * side * behaviour.glance * k
			_o_head.x += -0.05 * k
		"point":
			_o_arm_r += Vector3(-1.35, 0, -0.45) * k
			_o_head.y += -0.45 * k
		"check_counter":
			_o_head.x += 0.38 * k
			_o_arm_r += Vector3(-0.55 + 0.1 * sin(t * 2.4), 0, 0.12) * k
			_o_arm_l += Vector3(-0.5 - 0.1 * sin(t * 2.4), 0, -0.12) * k
			_o_body_pitch += 0.06 * k
		"read":
			_o_head.x += 0.42 * k
			_o_arm_l += Vector3(-1.0, 0, -0.35) * k
			_o_arm_r += Vector3(-0.85, 0, 0.3) * k
		"adjust_glasses":
			_o_arm_r += Vector3(-2.15, 0, -0.55) * k
			_o_head.x += -0.06 * k
		"tend":
			_o_body_pitch += 0.22 * k
			_o_head.x += 0.35 * k
			_o_arm_r += Vector3(-0.6 + 0.08 * sin(t * 3.0), 0, 0) * k
		"bounce":
			_o_body_y += 0.035 * absf(sin(t * 5.8)) * k
		"stretch":
			_o_arm_r += Vector3(0, 0, -2.6) * k
			_o_arm_l += Vector3(0, 0, 2.6) * k
			_o_head.x += -0.18 * k
		"hands_behind":
			_o_arm_r += Vector3(0.38, 0, 0.12) * k
			_o_arm_l += Vector3(0.38, 0, -0.12) * k


# --- reactions -------------------------------------------------------------------------

func _update_reaction(delta: float) -> void:
	if _reaction == "":
		return
	_reaction_t += delta
	var dur: float = REACTIONS.get(_reaction, 1.0)
	if _reaction_t >= dur:
		_reaction = ""
		return
	var t: float = _reaction_t
	var k: float = _env(t, dur, 0.18, 0.4)
	match _reaction:
		"happy":
			_o_body_y += 0.06 * maxf(0.0, sin(t * 6.5)) * k
			_o_arm_r += Vector3(-1.05, 0, -0.45) * k
			_o_arm_l += Vector3(-1.05, 0, 0.45) * k
			_o_head.x += -0.12 * k
			_o_mouth = 0.8 * k
		"celebrate":
			_o_body_y += 0.12 * maxf(0.0, sin(t * 5.0)) * k
			_o_arm_r += Vector3(0, 0, -2.7 + 0.15 * sin(t * 9.0)) * k
			_o_arm_l += Vector3(0, 0, 2.7 - 0.15 * sin(t * 9.0)) * k
			_o_head.x += -0.2 * k
			_o_mouth = 1.0 * k
		"confused":
			_o_head.z += 0.22 * k
			_o_head.x += -0.06 * k
			_o_arm_r += Vector3(-2.35 + 0.08 * sin(t * 14.0), 0, -0.95) * k
		"nod":
			_o_head.x += 0.16 * maxf(0.0, sin(t * 8.0)) * k
		"interact":
			_o_arm_r += Vector3(-1.15, 0, -0.1) * k
			_o_body_pitch += 0.05 * k
		"both_wave":
			_o_arm_r += Vector3(0, 0, -2.4 + 0.25 * sin(t * 9.0)) * k
			_o_arm_l += Vector3(0, 0, 2.4 - 0.25 * sin(t * 9.0)) * k
			_o_body_y += 0.03 * maxf(0.0, sin(t * 6.0)) * k
			_o_mouth = 0.7 * k


# --- posing ----------------------------------------------------------------------------

## Arms: walk swing (or rest), then this frame's action / reaction / talk /
## wave offsets on top.
func _arms(walk_l: Basis, walk_r: Basis) -> void:
	var off_r: Vector3 = _o_arm_r
	var off_l: Vector3 = _o_arm_l
	if talking and _reaction == "":
		off_r += Vector3(-0.5 - 0.15 * sin(_time * 2.3), 0, -0.25)
		if behaviour.talk == "lively":
			off_l += Vector3(-0.35 - 0.15 * sin(_time * 1.9 + 1.3), 0, 0.2)
	if arm_r:
		var wave_basis := Basis()
		if _wave_t >= 0.0:
			_wave_t += get_process_delta_time()
			var k2: float = smoothstep(0.0, 0.5, _wave_t) * (1.0 - smoothstep(WAVE_SECONDS - 0.6, WAVE_SECONDS, _wave_t))
			wave_basis = Basis(Vector3.BACK, -2.5 * k2 + sin(_wave_t * 8.0) * 0.2 * k2)
			if _wave_t >= WAVE_SECONDS:
				_wave_t = -1.0
		elif can_wave and _action == "" and _reaction == "" and not talking:
			var cycle: float = fposmod(_time + idle_phase * 3.0, 16.0)
			var k3: float = smoothstep(0.0, 0.6, cycle) * (1.0 - smoothstep(2.4, 3.0, cycle))
			wave_basis = Basis(Vector3.BACK, -2.5 * k3 + sin(cycle * 8.0) * 0.2 * k3)
		arm_r.basis = _arm_rest_r * walk_r * wave_basis * Basis.from_euler(Vector3(off_r.x, off_r.y, off_r.z))
	if arm_l:
		arm_l.basis = _arm_rest_l * walk_l * Basis.from_euler(Vector3(off_l.x, off_l.y, off_l.z))


## Head: look at the target (or a glance point), else an occasional slow
## glance to one side; then action / reaction / talk offsets.
func _head(delta: float) -> void:
	if head == null:
		return
	var yaw: float = 0.0
	var pitch: float = sin(_time * 0.5 + idle_phase) * 0.035
	var target_dir: Vector3 = _look_direction()
	if target_dir != Vector3.ZERO:
		yaw = clampf(atan2(target_dir.x, target_dir.z), -1.1, 1.1)
		pitch = clampf(-atan2(target_dir.y, Vector2(target_dir.x, target_dir.z).length()), -0.3, 0.35)
	elif hip_l == null:
		var g: float = sin(_time * 0.19 * behaviour.glance + idle_phase)
		yaw = 0.32 * behaviour.glance * signf(g) * smoothstep(0.55, 0.95, absf(g))
	if talking:
		pitch += sin(_time * 4.2) * 0.05
	yaw += _o_head.y
	pitch += _o_head.x
	var k: float = 1.0 - exp(-6.0 * delta)
	_head_yaw = lerpf(_head_yaw, yaw, k)
	_head_pitch = lerpf(_head_pitch, pitch, k)
	_head_roll = lerpf(_head_roll, _o_head.z, k)
	head.rotation = Vector3(_head_pitch, _head_yaw, _head_roll)


## A standing NPC's quiet life: breathing, a slow weight shift, the head,
## arms and body from this frame's offsets.
func _npc_pose(delta: float) -> void:
	if body:
		var e: float = behaviour.energy
		body.scale = Vector3(1.0, 1.0 + sin(_time * 1.7 * e) * 0.006, 1.0)
		body.rotation.z = sin(_time * 0.4 * e + idle_phase) * 0.01 * e
		body.rotation.x = _o_body_pitch
		body.position.y = body_base_y + _o_body_y
	_head(delta)
	_arms(Basis(), Basis())


## Direction to what we are looking at, in this rig's own space, or ZERO.
func _look_direction() -> Vector3:
	if head == null:
		return Vector3.ZERO
	var eye: Vector3 = head.global_position
	if _time < _glance_until:
		return global_transform.basis.inverse() * (_glance_point - eye)
	if look_target == null or not is_instance_valid(look_target):
		return Vector3.ZERO
	var at: Vector3 = look_target.global_position + Vector3(0, look_height, 0)
	if eye.distance_to(at) > LOOK_RANGE:
		return Vector3.ZERO
	return global_transform.basis.inverse() * (at - eye)
