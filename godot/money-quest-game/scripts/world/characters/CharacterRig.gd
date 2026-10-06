class_name CharacterRig
extends Node3D
## CharacterRig — the "alive" layer on top of a built character (see
## CharacterBuilder). Everything is procedural and cheap (a few transform
## writes per frame, no skeleton):
##
## - Walk: alternating legs with a soft knee bend, opposite arm swing, a
##   small step bounce (the player); wheel spin for a wheelchair.
## - Idle: breathing, a slow weight shift, natural blinking, and — for NPCs
##   — glances around, a small nod.
## - Attention: look_target makes the head turn toward someone (an NPC
##   looking at the player who comes near); wave_once() gives a friendly
##   wave; `talking` opens and closes the mouth with small nods and a hand
##   gesture while that character's line is on screen.
##
## Movement stays authoritative: the rig only READS its parent
## CharacterBody3D's velocity. Reduced motion (Settings.reduced_motion):
## every part of this is non-essential animation, so the rig holds a still,
## stable resting pose — eyes open, mouth closed, no bounce or gestures.

const WALK_SPEED_REFERENCE: float = 4.5   # Player.SPEED — full stride at walking speed
const STRIDE_RATE: float = 9.4           # radians of walk cycle per second at full speed
const WHEEL_RADIUS: float = 0.3
const BLINK_SECONDS: float = 0.12
const LOOK_RANGE: float = 7.0
const WAVE_SECONDS: float = 2.6

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
## NPC idle life (see _npc_idle): a deterministic phase from the NPC's id
## so neighbours never move in unison, and whether this NPC occasionally
## gives a small wave by itself (only the Hub Guide does).
var idle_phase: float = 0.0
var can_wave: bool = false
## Someone to look at (the head turns toward them while they are near).
var look_target: Node3D = null
## While true: mouth moves, small nods and a hand gesture.
var talking: bool = false

var _arm_rest_l: Basis
var _arm_rest_r: Basis
var _phase: float = 0.0
var _walk: float = 0.0
var _time: float = 0.0
var _resting: bool = false
var _next_blink: float = 2.0
var _blink_until: float = -1.0
var _wave_t: float = -1.0
var _head_yaw: float = 0.0
var _head_pitch: float = 0.0


func _ready() -> void:
	# Each character breathes (and blinks) slightly out of step with the others.
	_time = float(get_instance_id() % 997) * 0.37
	_next_blink = _time + 1.0 + fmod(idle_phase * 13.0, 3.0)
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


## A friendly wave (e.g. greeting the player). Ignored with Reduced Motion.
func wave_once() -> void:
	if not Settings.reduced_motion and arm_r:
		_wave_t = 0.0


func is_waving() -> bool:
	return _wave_t >= 0.0


func _process(delta: float) -> void:
	if Settings.reduced_motion:
		if not _resting:
			apply_rest_pose()
			_resting = true
		_wave_t = -1.0
		return
	_resting = false
	_time += delta
	_blink()
	_mouth()

	var speed: float = 0.0
	var parent := get_parent()
	if parent is CharacterBody3D:
		speed = Vector2(parent.velocity.x, parent.velocity.z).length()
	_walk = lerpf(_walk, clampf(speed / WALK_SPEED_REFERENCE, 0.0, 1.0), 1.0 - exp(-10.0 * delta))

	if hip_l == null:
		_npc_idle(delta)
		return

	if seated:
		if wheel_l and speed > 0.01:
			var spin: float = speed * delta / WHEEL_RADIUS
			wheel_l.rotate_x(spin)
			wheel_r.rotate_x(spin)
		if body:
			body.position.y = body_base_y + sin(_time * 1.6) * 0.003
		return

	_phase = fmod(_phase + delta * STRIDE_RATE * _walk, TAU)
	var s: float = sin(_phase)
	hip_l.rotation.x = s * 0.5 * _walk
	hip_r.rotation.x = -s * 0.5 * _walk
	knee_l.rotation.x = maxf(0.0, s) * 0.7 * _walk
	knee_r.rotation.x = maxf(0.0, -s) * 0.7 * _walk
	arm_l.basis = _arm_rest_l * Basis(Vector3.RIGHT, -s * 0.45 * _walk)
	arm_r.basis = _arm_rest_r * Basis(Vector3.RIGHT, s * 0.45 * _walk)
	var bounce: float = absf(cos(_phase)) * 0.022 * _walk
	var breath: float = sin(_time * 1.8) * 0.005 * (1.0 - _walk)
	body.position.y = body_base_y + bounce + breath
	# Standing still: a slow, slight weight shift from foot to foot.
	body.rotation.z = sin(_time * 0.45 + idle_phase) * 0.012 * (1.0 - _walk)


## Blinks every 2.5–5.5 s (sometimes a quick double blink).
func _blink() -> void:
	if eyelids == null:
		return
	if _time >= _next_blink:
		_blink_until = _time + BLINK_SECONDS
		var r: float = fposmod(sin(_time * 12.9898 + idle_phase * 78.233) * 43758.5453, 1.0)
		_next_blink = _time + (0.25 if r < 0.12 else 2.5 + r * 3.0)
	eyelids.visible = _time < _blink_until


func _mouth() -> void:
	if mouth == null:
		return
	mouth.visible = talking
	if talking:
		var open: float = 0.35 + 0.65 * absf(sin(_time * 10.5)) * (0.6 + 0.4 * sin(_time * 3.1))
		mouth.scale = Vector3(1.0, open, 1.0)


## A standing NPC's quiet life: breathing, a slow weight shift, and either
## looking at someone nearby (look_target) or now and then a slow glance to
## one side and back. Waves when asked (or, for the Hub Guide, about every
## 16 seconds); talks with small nods and a hand gesture.
func _npc_idle(delta: float) -> void:
	if body:
		body.scale = Vector3(1.0, 1.0 + sin(_time * 1.7) * 0.006, 1.0)
		body.rotation.z = sin(_time * 0.4 + idle_phase) * 0.01
	if head:
		var yaw: float
		var pitch: float = sin(_time * 0.5 + idle_phase) * 0.035
		var target_dir: Vector3 = _look_direction()
		if target_dir != Vector3.ZERO:
			yaw = clampf(atan2(target_dir.x, target_dir.z), -1.1, 1.1)
			pitch = clampf(-atan2(target_dir.y, Vector2(target_dir.x, target_dir.z).length()), -0.25, 0.3)
		else:
			var g: float = sin(_time * 0.19 + idle_phase)
			yaw = 0.32 * signf(g) * smoothstep(0.55, 0.95, absf(g))
		if talking:
			pitch += sin(_time * 4.2) * 0.05
		var k: float = 1.0 - exp(-6.0 * delta)
		_head_yaw = lerpf(_head_yaw, yaw, k)
		_head_pitch = lerpf(_head_pitch, pitch, k)
		head.rotation = Vector3(_head_pitch, _head_yaw, 0.0)
	if arm_r == null:
		return
	if _wave_t >= 0.0:
		_wave_t += delta
		var k2: float = smoothstep(0.0, 0.5, _wave_t) * (1.0 - smoothstep(WAVE_SECONDS - 0.6, WAVE_SECONDS, _wave_t))
		arm_r.basis = _arm_rest_r * Basis(Vector3.BACK, -2.5 * k2 + sin(_wave_t * 8.0) * 0.2 * k2)
		if _wave_t >= WAVE_SECONDS:
			_wave_t = -1.0
	elif talking:
		arm_r.basis = _arm_rest_r * Basis(Vector3.RIGHT, -0.5 - 0.15 * sin(_time * 2.3)) * Basis(Vector3.BACK, -0.25)
	elif can_wave:
		var cycle: float = fposmod(_time + idle_phase * 3.0, 16.0)
		var k3: float = smoothstep(0.0, 0.6, cycle) * (1.0 - smoothstep(2.4, 3.0, cycle))
		arm_r.basis = _arm_rest_r * Basis(Vector3.BACK, -2.5 * k3 + sin(cycle * 8.0) * 0.2 * k3)
	else:
		arm_r.basis = _arm_rest_r


## Direction to look_target's head in this rig's own space, or ZERO when
## there is no target or it is too far away.
func _look_direction() -> Vector3:
	if look_target == null or not is_instance_valid(look_target) or head == null:
		return Vector3.ZERO
	var eye: Vector3 = head.global_position
	var at: Vector3 = look_target.global_position + Vector3(0, 1.45, 0)
	if eye.distance_to(at) > LOOK_RANGE:
		return Vector3.ZERO
	return global_transform.basis.inverse() * (at - eye)
