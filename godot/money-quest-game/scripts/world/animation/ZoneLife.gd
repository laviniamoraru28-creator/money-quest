class_name ZoneLife
extends Node3D
## ZoneLife — a place's quiet environmental life, configured by a profile:
##
## - a very light drift of particles (dust motes in a vault's warm light,
##   pollen over a town square, a few slow fireflies-like glints in a calm
##   garden) — one CPUParticles3D, one draw call;
## - occasional small EVENTS, one at a time, many seconds apart, at spots
##   the dressing registered (add_spot): a coin glints, a bird lands on a
##   lamp and hops before flying off, a leaf drifts down, a butterfly rests
##   on a flower, a lantern swells a little brighter. Whoever is standing
##   near an event (NPCs) glances at it — the world notices itself.
##
## Controlled randomness: a fixed seed per place, so the rhythm is varied
## but never chaotic, and never two things at once. Driven by the scene's
## AmbientDirector (group "mq_ambient_updatable"): with Reduced Motion, or
## ambient animation off, everything here is hidden and nothing happens.
## The "calm" profile (Calm World) is slower, sparser and dimmer still.

## profile → [particles kind, particle amount, events, seconds between events (min, max)]
const PROFILES: Dictionary = {
	"vault": ["dust", 26, ["sparkle", "sparkle", "glow"], Vector2(9, 18)],
	"town": ["pollen", 18, ["bird_visit", "leaf_fall", "butterfly", "bird_visit"], Vector2(8, 16)],
	"hub": ["pollen", 14, ["bird_visit", "leaf_fall", "butterfly", "sparkle"], Vector2(10, 20)],
	"workshop": ["dust", 18, ["sparkle", "glow"], Vector2(12, 22)],
	"gallery": ["dust", 14, ["sparkle", "glow"], Vector2(14, 26)],
	"library": ["dust", 20, ["glow", "sparkle"], Vector2(14, 26)],
	"calm_lab": ["dust", 10, ["glow"], Vector2(18, 32)],
	"calm": ["glint", 8, ["butterfly", "leaf_fall"], Vector2(22, 40)],
	"none": ["", 0, [], Vector2(30, 60)],
}
const EVENT_SECONDS: Dictionary = {
	"sparkle": 1.4, "glow": 3.5, "bird_visit": 7.0, "leaf_fall": 5.5, "butterfly": 6.5,
}
const NOTICE_RADIUS: float = 8.0

@export var profile: String = "none"
## Centre and half-size (metres) of the area the particles drift in.
@export var area_center: Vector3 = Vector3(0, 2.0, 0)
@export var area_extents: Vector3 = Vector3(8, 1.6, 8)
@export var seed_value: int = 1
## A reaction id for AmbientDirector.react() used by the "glow" event.
@export var glow_reaction: String = ""

var spots: Dictionary = {}   # kind -> Array[Vector3] (world positions)
var event: String = ""        # current event ("" = none) — tests read it
var event_count: int = 0
## How many NPCs glanced at the last event (tests read it).
var noticed: int = 0

var _particles: CPUParticles3D
var _active: bool = true
var _rng := RandomNumberGenerator.new()
var _next_event: float = 6.0
var _event_t: float = 0.0
var _event_pos: Vector3
var _event_from: Vector3
var _actor: MeshInstance3D
var _meshes: Dictionary = {}
var _time: float = 0.0


func _ready() -> void:
	add_to_group("mq_ambient_updatable")
	_rng.seed = seed_value
	var p: Array = PROFILES.get(profile, PROFILES["none"])
	_next_event = _rng.randf_range(3.0, 7.0)
	if p[1] > 0:
		_particles = _make_particles(p[0], p[1])
		add_child(_particles)
	_actor = MeshInstance3D.new()
	_actor.name = "EventActor"
	_actor.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	_actor.visible = false
	add_child(_actor)


## Register a place where an event can happen: "sparkle" (a coin / jar /
## gem that can glint), "perch" (a lamp top or roof edge a bird can land
## on), "tree" (a canopy a leaf can fall from), "flower" (a bed a
## butterfly can visit).
func add_spot(kind: String, world_pos: Vector3) -> void:
	if not spots.has(kind):
		spots[kind] = []
	spots[kind].append(world_pos)


func set_ambient_active(active: bool) -> void:
	_active = active
	visible = active
	if _particles:
		_particles.emitting = active
	if not active:
		_end_event()


## Starts an event now (tests, or a scripted moment). Returns false if it
## cannot happen here (no spot for it) or life is off.
func trigger(kind: String) -> bool:
	if not _active or not EVENT_SECONDS.has(kind):
		return false
	var pos: Variant = _pick_spot(kind)
	if pos == null:
		return false
	_start_event(kind, pos)
	return true


func ambient_update(_t: float, delta: float) -> void:
	if not _active:
		return
	_time += delta
	if event != "":
		_event_t += delta
		_update_event()
		if _event_t >= EVENT_SECONDS[event]:
			_end_event()
		return
	if _time < _next_event:
		return
	var p: Array = PROFILES.get(profile, PROFILES["none"])
	var events: Array = p[2]
	_next_event = _time + _rng.randf_range(p[3].x, p[3].y)
	if events.is_empty():
		return
	var kind: String = events[_rng.randi() % events.size()]
	var pos: Variant = _pick_spot(kind)
	if pos != null:
		_start_event(kind, pos)


# --- events ----------------------------------------------------------------------

func _pick_spot(kind: String) -> Variant:
	var key: String = {"sparkle": "sparkle", "glow": "sparkle", "bird_visit": "perch", "leaf_fall": "tree", "butterfly": "flower"}.get(kind, kind)
	if kind == "glow":
		return Vector3.ZERO if not glow_reaction.is_empty() else null
	var list: Array = spots.get(key, [])
	if list.is_empty():
		return null
	return list[_rng.randi() % list.size()]


func _start_event(kind: String, pos: Vector3) -> void:
	event = kind
	event_count += 1
	_event_t = 0.0
	_event_pos = pos
	match kind:
		"glow":
			var d := _director()
			if d:
				d.react(glow_reaction)
			return
		"bird_visit":
			_actor.mesh = _mesh("bird")
			var away := Vector3(_rng.randf_range(-1, 1), 0, _rng.randf_range(-1, 1)).normalized()
			_event_from = pos + away * 14.0 + Vector3(0, 9, 0)
		"leaf_fall":
			_actor.mesh = _mesh("leaf")
			_event_from = pos
		"butterfly":
			_actor.mesh = _mesh("butterfly")
			_event_from = pos + Vector3(_rng.randf_range(-4, 4), 2.5, _rng.randf_range(-4, 4))
		_:
			_actor.mesh = _mesh("glint")
	_actor.visible = true
	_update_event()
	_notify_neighbours(pos)


func _end_event() -> void:
	event = ""
	if _actor:
		_actor.visible = false


func _update_event() -> void:
	var t: float = _event_t
	var dur: float = EVENT_SECONDS.get(event, 1.0)
	match event:
		"sparkle":
			# A quick four-point glint: grows, turns a little, fades.
			var k: float = sin(PI * clampf(t / dur, 0.0, 1.0))
			_actor.global_transform = Transform3D(Basis(Vector3.BACK, t * 1.2).scaled(Vector3.ONE * maxf(k, 0.01)), _event_pos)
			_face_camera()
		"bird_visit":
			# Glides in (2 s), hops twice, looks about, flies off (last 1.8 s).
			var pos: Vector3
			var look: Vector3
			if t < 2.0:
				var u: float = smoothstep(0.0, 1.0, t / 2.0)
				pos = _event_from.lerp(_event_pos, u) + Vector3(0, sin(u * PI) * 1.2, 0)
				look = _event_pos - _event_from
			elif t < dur - 1.8:
				var hop: float = maxf(0.0, sin((t - 2.0) * 5.0)) * 0.08 if t - 2.0 < 1.3 else 0.0
				pos = _event_pos + Vector3(0, hop, 0)
				look = Vector3(sin(t * 0.9), 0, cos(t * 0.9))
			else:
				var u2: float = smoothstep(0.0, 1.0, (t - (dur - 1.8)) / 1.8)
				var out: Vector3 = _event_pos + (_event_pos - _event_from).normalized() * 12.0 + Vector3(0, 8, 0)
				pos = _event_pos.lerp(out, u2)
				look = out - _event_pos
			look.y = 0.0
			if look.length() < 0.01:
				look = Vector3.FORWARD
			_actor.global_transform = Transform3D(Basis.looking_at(look.normalized(), Vector3.UP), pos)
		"leaf_fall":
			# Drifts down in slow swings, lands, then shrinks away.
			var fall: float = minf(t / (dur - 1.0), 1.0)
			var y: float = lerpf(_event_from.y, 0.05, fall)
			var sway := Vector3(sin(t * 1.6) * 0.7, 0, cos(t * 1.1) * 0.4) * (1.0 - fall * 0.6)
			var s: float = 1.0 if t < dur - 1.0 else maxf(dur - t, 0.01)
			_actor.global_transform = Transform3D(Basis.from_euler(Vector3(sin(t * 2.2) * 0.8, t * 0.7, cos(t * 1.7) * 0.6)).scaled(Vector3.ONE * s), Vector3(_event_from.x, y, _event_from.z) + sway)
		"butterfly":
			# Flutters to the flower, rests with slow wing beats, flutters off.
			var pos2: Vector3
			var flap: float
			if t < 2.2:
				var u3: float = smoothstep(0.0, 1.0, t / 2.2)
				pos2 = _event_from.lerp(_event_pos + Vector3(0, 0.25, 0), u3) + Vector3(sin(t * 4.0) * 0.2, sin(t * 6.0) * 0.15, 0)
				flap = 0.35 + 0.65 * absf(sin(t * 9.0))
			elif t < dur - 1.6:
				pos2 = _event_pos + Vector3(0, 0.25, 0)
				flap = 0.6 + 0.4 * absf(sin(t * 2.0))
			else:
				var u4: float = smoothstep(0.0, 1.0, (t - (dur - 1.6)) / 1.6)
				pos2 = (_event_pos + Vector3(0, 0.25, 0)).lerp(_event_from + Vector3(3, 1, -2), u4)
				flap = 0.35 + 0.65 * absf(sin(t * 9.0))
			_actor.global_transform = Transform3D(Basis(Vector3.UP, t * 0.5).scaled(Vector3(flap, 1, 1)), pos2)


func _face_camera() -> void:
	var cam: Camera3D = get_viewport().get_camera_3d()
	if cam:
		var b: Basis = _actor.global_transform.basis
		var s: Vector3 = b.get_scale()
		var look := Basis.looking_at(cam.global_position - _actor.global_position, Vector3.UP)
		_actor.global_transform.basis = (look * Basis(Vector3.BACK, _event_t * 1.2)).scaled(s)


## NPCs standing near an event glance at it for a moment.
func _notify_neighbours(pos: Vector3) -> void:
	noticed = 0
	for n in get_tree().get_nodes_in_group("mq_npc"):
		if n is NPC and n.visual and not n.is_queued_for_deletion() and n.global_position.distance_to(pos) < NOTICE_RADIUS:
			n.visual.glance_at(pos, 2.5)
			noticed += 1


func _director() -> AmbientDirector:
	for d in get_tree().get_nodes_in_group("mq_ambient_director"):
		if d.get_parent() and d.get_parent().is_ancestor_of(self):
			return d
	return null


# --- meshes --------------------------------------------------------------------

func _mesh(kind: String) -> Mesh:
	if _meshes.has(kind):
		return _meshes[kind]
	var m := MeshMerger.new()
	match kind:
		"glint":
			m.part(DecorKit.box(Vector3(0.5, 0.06, 0.01)), DecorKit.mat("bulb", 2.2), Vector3.ZERO)
			m.part(DecorKit.box(Vector3(0.06, 0.5, 0.01)), DecorKit.mat("bulb", 2.2), Vector3.ZERO)
			m.part(DecorKit.box(Vector3(0.22, 0.04, 0.01)), DecorKit.mat("bulb", 2.2), Vector3.ZERO, Vector3(0, 0, 45))
			m.part(DecorKit.box(Vector3(0.04, 0.22, 0.01)), DecorKit.mat("bulb", 2.2), Vector3.ZERO, Vector3(0, 0, 45))
		"bird":
			var c := "wood_dark"
			m.part(DecorKit.sphere(0.1, 8, 4), DecorKit.mat(c), Vector3(0, 0.1, 0), Vector3.ZERO, Vector3(0.85, 0.8, 1.3))
			m.part(DecorKit.sphere(0.065, 8, 4), DecorKit.mat(c), Vector3(0, 0.19, 0.1))
			m.part(DecorKit.cyl(0.0, 0.02, 0.05, 6), DecorKit.mat("gold"), Vector3(0, 0.19, 0.17), Vector3(90, 0, 0))
			m.part(DecorKit.box(Vector3(0.06, 0.02, 0.12)), DecorKit.mat(c), Vector3(0, 0.12, -0.14), Vector3(-20, 0, 0))
			for side in [-1.0, 1.0]:
				m.part(DecorKit.box(Vector3(0.03, 0.09, 0.16)), DecorKit.mat("wood"), Vector3(side * 0.08, 0.12, -0.01))
				m.part(DecorKit.cyl(0.006, 0.006, 0.06, 4), DecorKit.mat("gold_deep"), Vector3(side * 0.03, 0.03, 0))
		"leaf":
			m.part(DecorKit.sphere(0.12, 8, 4), DecorKit.mat("leaf_light"), Vector3.ZERO, Vector3.ZERO, Vector3(1.0, 0.08, 0.55))
		"butterfly":
			for side in [-1.0, 1.0]:
				m.part(DecorKit.box(Vector3(0.16, 0.008, 0.12)), DecorKit.mat("coral"), Vector3(side * 0.085, 0, -0.01), Vector3(0, side * 10.0, 0))
				m.part(DecorKit.box(Vector3(0.1, 0.008, 0.08)), DecorKit.mat("gold"), Vector3(side * 0.06, 0, 0.07), Vector3(0, side * -15.0, 0))
			m.part(DecorKit.cyl(0.012, 0.012, 0.14, 6), DecorKit.mat("ink"), Vector3.ZERO, Vector3(90, 0, 0))
	_meshes[kind] = m.commit()
	return _meshes[kind]


## A sparse, slow drift: a few soft motes catching the light.
func _make_particles(kind: String, amount: int) -> CPUParticles3D:
	var p := CPUParticles3D.new()
	p.name = "Motes"
	p.amount = amount
	p.lifetime = 9.0 if kind != "glint" else 12.0
	p.preprocess = 9.0
	p.emission_shape = CPUParticles3D.EMISSION_SHAPE_BOX
	p.emission_box_extents = area_extents
	p.position = area_center
	p.direction = Vector3(0.3, 1, 0.1)
	p.spread = 60.0
	p.gravity = Vector3(0, -0.02 if kind == "pollen" else 0.0, 0)
	p.initial_velocity_min = 0.05
	p.initial_velocity_max = 0.15
	p.scale_amount_min = 0.6
	p.scale_amount_max = 1.2
	var curve := Curve.new()
	curve.add_point(Vector2(0, 0))
	curve.add_point(Vector2(0.2, 1))
	curve.add_point(Vector2(0.8, 1))
	curve.add_point(Vector2(1, 0))
	p.scale_amount_curve = curve
	var q := QuadMesh.new()
	q.size = Vector2(0.05, 0.05) if kind != "glint" else Vector2(0.08, 0.08)
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.billboard_mode = BaseMaterial3D.BILLBOARD_PARTICLES
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.albedo_color = {"dust": Color(1.0, 0.92, 0.7, 0.5), "pollen": Color(1.0, 0.97, 0.8, 0.55), "glint": Color(0.95, 1.0, 0.8, 0.45)}.get(kind, Color(1, 1, 1, 0.4))
	q.material = mat
	p.mesh = q
	p.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	return p
