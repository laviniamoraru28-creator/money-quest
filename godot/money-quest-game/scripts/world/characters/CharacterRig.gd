class_name CharacterRig
extends Node3D
## CharacterRig — the minimal "alive" layer on top of a built character
## (see CharacterBuilder): a gentle procedural walk (alternating legs with a
## soft knee bend, opposite arm swing, a very small step bounce), a barely
## visible idle breath, and wheel spin for a wheelchair. No skeleton, no
## facial animation, no emotes — later phases can build on this.
##
## Movement stays authoritative: the rig only READS its parent
## CharacterBody3D's velocity, so walking speed, collision and turning are
## exactly what Player.gd decides. A rig with no moving parent (an NPC, the
## avatar preview) just breathes.
##
## Reduced motion (Settings.reduced_motion, the project-wide rule): every
## part of this is non-essential animation, so with it enabled the rig
## holds a still, stable resting pose — no bounce, no swing, no breathing,
## no wheel spin.

const WALK_SPEED_REFERENCE: float = 4.5   # Player.SPEED — full stride at walking speed
const STRIDE_RATE: float = 9.4           # radians of walk cycle per second at full speed
const WHEEL_RADIUS: float = 0.3

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
var seated: bool = false
var body_base_y: float = 0.0
## NPC idle life (see _npc_idle): a deterministic phase from the NPC's id
## so neighbours never move in unison, and whether this NPC occasionally
## gives a small wave (only the Hub Guide does).
var idle_phase: float = 0.0
var can_wave: bool = false

var _arm_rest_l: Basis
var _arm_rest_r: Basis
var _phase: float = 0.0
var _walk: float = 0.0
var _time: float = 0.0
var _resting: bool = false


func _ready() -> void:
	# Each character breathes slightly out of step with the others.
	_time = float(get_instance_id() % 997) * 0.37
	if arm_l:
		_arm_rest_l = arm_l.basis
	if arm_r:
		_arm_rest_r = arm_r.basis


func apply_rest_pose() -> void:
	if body:
		body.position.y = body_base_y
		body.scale = Vector3.ONE
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


func _process(delta: float) -> void:
	if Settings.reduced_motion:
		if not _resting:
			apply_rest_pose()
			_resting = true
		return
	_resting = false
	_time += delta

	var speed: float = 0.0
	var parent := get_parent()
	if parent is CharacterBody3D:
		speed = Vector2(parent.velocity.x, parent.velocity.z).length()
	_walk = lerpf(_walk, clampf(speed / WALK_SPEED_REFERENCE, 0.0, 1.0), 1.0 - exp(-10.0 * delta))

	if hip_l == null:
		_npc_idle()
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


## A standing NPC's quiet life: a barely visible breath, a tiny nod, and
## now and then a slow glance to one side and back (most of the time the
## head simply faces forward). The Hub Guide also gives a small friendly
## wave about every 16 seconds. No walking, no new behaviour.
func _npc_idle() -> void:
	if body:
		body.scale = Vector3(1.0, 1.0 + sin(_time * 1.7) * 0.006, 1.0)
	if head:
		var g: float = sin(_time * 0.19 + idle_phase)
		var yaw: float = 0.32 * signf(g) * smoothstep(0.55, 0.95, absf(g))
		head.rotation = Vector3(sin(_time * 0.5 + idle_phase) * 0.035, yaw, 0.0)
	if can_wave and arm_r:
		var cycle: float = fposmod(_time + idle_phase * 3.0, 16.0)
		var k: float = smoothstep(0.0, 0.6, cycle) * (1.0 - smoothstep(2.4, 3.0, cycle))
		var wave: float = sin(cycle * 8.0) * 0.2 * k
		arm_r.basis = _arm_rest_r * Basis(Vector3.BACK, -2.5 * k + wave)
