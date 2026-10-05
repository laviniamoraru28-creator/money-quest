class_name AmbientDirector
extends Node
## AmbientDirector — the one place that makes a scene gently alive, and the
## one place that makes it still again. Drop one into a scene (the World
## Hub has one); it drives every ambient effect inside its parent scene:
##
## - Shader-animated geometry (foliage sway, cloth ripple, water) runs on
##   the GPU with no script cost; the director only flips each shared
##   material's `motion` switch (1.0 / 0.0).
## - Small moving parts (a museum globe, a clock hand, a telescope...) join
##   the "mq_ambient" group with a few metadata values (see AmbientPart);
##   the director moves all of them from this single _process().
## - Glowing materials (lanterns, entrance arches, the idea bulb...) breathe
##   very slowly: a few percent of brightness over many seconds — never a
##   flash, never a colour change.
## - Clouds drift around the sky; "mq_ambient_updatable" nodes (fountain
##   droplets, butterflies, birds) get ambient_update(time, delta).
##
## Reduced Motion (Settings.reduced_motion) is a hard switch, not a
## slowdown: every moving part returns to its resting pose, every glow
## returns to its normal brightness, shader motion is 0.0, and droplets
## and creatures are hidden — a still, static presentation. `enabled`
## turns ambient animation off globally in the same way.
##
## All variation is deterministic (fixed phases from positions / ids); no
## state here is saved, and nothing here affects gameplay.

## Breathing glows: palette colour, glow level, brightness range (fraction),
## period in seconds. Long periods and small ranges by design.
const PULSES: Array = [
	["window_warm", 1.4, 0.06, 7.0],   # Hub lanterns
	["window_warm", 0.6, 0.08, 9.0],   # Library round window
	["bulb", 0.9, 0.12, 6.0],          # Entrepreneur Quest idea bulb
	["bulb", 0.6, 0.15, 5.0],          # idea-board bulb
	["gold", 0.35, 0.25, 6.5],         # Savings Tower star, vault finial
	["gold", 0.9, 0.12, 8.0],          # Mind Lab star lanterns
	["cream", 0.5, 0.06, 12.0],        # Calm World lanterns — slowest, softest
	["gold", 0.55, 0.1, 8.0],          # entrance arches...
	["ember", 0.55, 0.1, 8.0],
	["sky", 0.55, 0.1, 8.0],
	["book_red", 0.55, 0.1, 8.0],
	["coral", 0.55, 0.1, 8.0],
	["lilac", 0.55, 0.1, 8.0],
	# (Calm World's arch is deliberately left out: it stays perfectly still.)
	["cream", 0.25, 0.0, 10.0],        # Mind Lab thought bubbles (steady; reacts on approach)
]

## Landmark "magic moments" (Phase 5): a short, soft swell of something
## that already exists when the child comes close or interacts — never a
## flash, burst, sound or popup. kind, then parameters:
##   glow  — [color, glow level, peak multiplier] on that shared material
##   cloth — banners ripple a little more for a moment
##   spin  — a moving part turns faster for a moment (by node name)
##   ripple — one slow ring spreads across water (by node name)
const REACTIONS: Dictionary = {
	"money": ["glow", "gold", 0.35, 2.4],
	"entrepreneur": ["glow", "bulb", 0.9, 1.8],
	"leadership": ["cloth", 1.8],
	"library": ["glow", "window_warm", 0.6, 1.9],
	"museum": ["spin", "Globe", 5.0],
	"mindlab": ["glow", "cream", 0.25, 2.6],
	"calm": ["ripple", "PondRipple"],
}
const REACTION_SECONDS: float = 3.5
const REACTION_COOLDOWN: float = 8.0
const CLOUD_DRIFT: float = 0.004   # radians per second around the Hub

static var enabled: bool = true

@export var time_scale: float = 1.0

var _parts: Array = []       # [node, kind, base Transform3D, speed, amplitude, phase, axis]
var _pulses: Array = []      # [material, base energy, range, period, phase]
var _updatables: Array = []
var _clouds: Node3D
var _clouds_base: Transform3D
var _time: float = 0.0
var _active: bool = true
var _reactions: Dictionary = {}   # reaction id -> start time
var _boost: Dictionary = {}       # Material -> multiplier this frame
var _spin_extra: Dictionary = {}  # node -> extra angle accumulated by "spin" reactions


func _ready() -> void:
	add_to_group("mq_ambient_director")
	Settings.reduced_motion_changed.connect(func(_v: bool) -> void: _apply_state())
	_collect.call_deferred()


## Plays a landmark reaction (see REACTIONS). Does nothing with Reduced
## Motion on, while one is already playing, or within its cooldown.
func react(reaction_id: String) -> void:
	if not _active or not REACTIONS.has(reaction_id):
		return
	if _reactions.has(reaction_id) and _time - _reactions[reaction_id] < REACTION_COOLDOWN:
		return
	_reactions[reaction_id] = _time


func is_reacting(reaction_id: String) -> bool:
	return _reactions.has(reaction_id) and _time - _reactions[reaction_id] < REACTION_SECONDS


## 0 → 1 → 0 over REACTION_SECONDS: quick-ish in, long gentle out.
func _envelope(reaction_id: String) -> float:
	if not _reactions.has(reaction_id):
		return 0.0
	var u: float = (_time - _reactions[reaction_id]) / REACTION_SECONDS
	if u < 0.0 or u > 1.0:
		return 0.0
	return smoothstep(0.0, 0.2, u) * (1.0 - smoothstep(0.35, 1.0, u))


func _exit_tree() -> void:
	# Shared materials outlive this scene: leave them in their resting state.
	for p in _pulses:
		p[0].emission_energy_multiplier = p[1]
	DecorKit.group_material("cloth").set_shader_parameter("amplitude", 0.045)


func is_active() -> bool:
	return enabled and not Settings.reduced_motion


func animated_part_count() -> int:
	return _parts.size()


func updatable_count() -> int:
	return _updatables.size()


func _update_reactions(delta: float) -> void:
	_boost.clear()
	var cloth_mult: float = 1.0
	for id: String in REACTIONS:
		var spec: Array = REACTIONS[id]
		var e: float = _envelope(id)
		match spec[0]:
			"glow":
				if e > 0.0:
					_boost[DecorKit.mat(spec[1], spec[2])] = 1.0 + (spec[3] - 1.0) * e
			"cloth":
				cloth_mult = maxf(cloth_mult, 1.0 + (spec[1] - 1.0) * e)
			"spin":
				if e > 0.0:
					for p in _parts:
						if is_instance_valid(p[0]) and p[0].name == spec[1]:
							_spin_extra[p[0]] = float(_spin_extra.get(p[0], 0.0)) + delta * p[3] * (spec[2] - 1.0) * e
			"ripple":
				for r in get_tree().get_nodes_in_group("mq_ripple"):
					if r.name != spec[1]:
						continue
					var u: float = (_time - float(_reactions.get(id, -100.0))) / (REACTION_SECONDS * 1.4)
					r.visible = u >= 0.0 and u <= 1.0
					if r.visible:
						var s: float = lerpf(0.25, 1.0, u)
						r.scale = Vector3(s, 1.0, s)
	DecorKit.group_material("cloth").set_shader_parameter("amplitude", 0.045 * cloth_mult)


func _collect() -> void:
	var root: Node = get_parent()
	for n in get_tree().get_nodes_in_group("mq_ambient"):
		if root.is_ancestor_of(n):
			_parts.append([n, n.get_meta("mq_kind", "spin"), n.transform,
				float(n.get_meta("mq_speed", 0.2)), float(n.get_meta("mq_amp", 0.1)),
				float(n.get_meta("mq_phase", 0.0)), n.get_meta("mq_axis", Vector3.UP)])
	for n in get_tree().get_nodes_in_group("mq_ambient_updatable"):
		if root.is_ancestor_of(n):
			_updatables.append(n)
	_clouds = root.find_child("Clouds", true, false) as Node3D
	if _clouds:
		_clouds_base = _clouds.transform
	var seen: Dictionary = {}
	for i in PULSES.size():
		var spec: Array = PULSES[i]
		var m: StandardMaterial3D = DecorKit.mat(spec[0], spec[1])
		if seen.has(m):
			continue
		seen[m] = true
		_pulses.append([m, m.emission_energy_multiplier, spec[2], spec[3], float(i) * 1.37])
	_apply_state()


func _apply_state() -> void:
	_active = is_active()
	for m in DecorKit.motion_materials():
		m.set_shader_parameter("motion", 1.0 if _active else 0.0)
	if not _active:
		_reactions.clear()
		_spin_extra.clear()
		DecorKit.group_material("cloth").set_shader_parameter("amplitude", 0.045)
		for r in get_tree().get_nodes_in_group("mq_ripple"):
			r.visible = false
		for p in _parts:
			if is_instance_valid(p[0]):
				p[0].transform = p[2]
		for p in _pulses:
			p[0].emission_energy_multiplier = p[1]
		if _clouds:
			_clouds.transform = _clouds_base
	for u in _updatables:
		if is_instance_valid(u):
			u.set_ambient_active(_active)


func _process(delta: float) -> void:
	if _active != is_active():
		_apply_state()
	if not _active:
		return
	_time += delta * time_scale
	var t: float = _time
	_update_reactions(delta)
	for p in _parts:
		var node: Node3D = p[0]
		if not is_instance_valid(node):
			continue
		var base: Transform3D = p[2]
		var w: float = t * p[3] + p[5] + float(_spin_extra.get(node, 0.0))
		match p[1]:
			"spin":
				node.transform = Transform3D(base.basis * Basis(p[6], w), base.origin)
			"sweep":
				node.transform = Transform3D(base.basis * Basis(p[6], sin(w) * p[4]), base.origin)
			"nod":
				node.transform = Transform3D(base.basis * Basis(p[6], pow(maxf(0.0, sin(w)), 6.0) * p[4]), base.origin)
			"bob":
				node.transform = Transform3D(base.basis, base.origin + Vector3(0, sin(w) * p[4], 0))
	for p in _pulses:
		p[0].emission_energy_multiplier = p[1] * (1.0 + p[2] * sin(TAU * t / p[3] + p[4])) * float(_boost.get(p[0], 1.0))
	if _clouds:
		_clouds.transform = Transform3D(Basis(Vector3.UP, t * CLOUD_DRIFT), Vector3.ZERO) * _clouds_base
	for u in _updatables:
		if is_instance_valid(u):
			u.ambient_update(t, delta)
