@tool
extends Landmark
## Calm World — reached over a wide, gentle bridge across a quiet stream,
## through a vine-covered pergola gate into a small garden with a pond,
## lily pads, a weeping willow, soft lanterns and benches. Muted natural
## colours, nothing bright or busy: the first glimpse should already feel
## peaceful. The bridge is as wide as the path itself and lies directly on
## the way in, so the water adds calm without adding a barrier.

const K = preload("res://scripts/world/decor/DecorKit.gd")

## Distance (local +Z, toward the plaza) from the gate to the stream.
const STREAM_Z: float = 4.0
const BRIDGE_HALF_WIDTH: float = 1.95


func _build(m: MeshMerger, body: StaticBody3D) -> void:
	_gate(m, body)
	_garden(m, body)
	_stream_and_bridge(m, body)
	if not Engine.is_editor_hint():
		# Calm World's only creatures: two slow, pale butterflies over the
		# pond and the willow — no other moving life here.
		var butterflies := AmbientCreatures.new()
		butterflies.name = "Butterflies"
		butterflies.kind = "butterfly"
		butterflies.calm = true
		butterflies.wing_color = Color("D9E8F5")
		butterflies.anchors = [Vector3(-3.5, 0, -5.4), Vector3(3.2, 0, -4.6)] as Array[Vector3]
		butterflies.radius = 1.6
		butterflies.height = 1.1
		add_child(butterflies)


func _gate(m: MeshMerger, body: StaticBody3D) -> void:
	m.origin = Transform3D.IDENTITY
	for sx in [-3.15, 3.15]:
		box_part(m, body, Vector3(0.36, 3.4, 0.36), Vector3(sx, 1.7, 0), "wood")
	for bz in [-0.4, 0.4]:
		m.part(K.box(Vector3(7.0, 0.24, 0.3)), K.mat("wood"), Vector3(0, 3.42, bz))
	for i in 7:
		m.part(K.box(Vector3(0.18, 0.16, 1.3)), K.mat("wood_dark"), Vector3(-2.7 + 0.9 * i, 3.6, 0))
	var vines: Array[Vector3] = [
		Vector3(-3.15, 3.5, 0.2), Vector3(-2.2, 3.7, -0.1), Vector3(-1.0, 3.75, 0.25),
		Vector3(0.4, 3.7, -0.15), Vector3(1.6, 3.75, 0.2), Vector3(2.8, 3.6, -0.05),
		Vector3(-3.25, 2.4, 0.15), Vector3(3.3, 2.6, 0.1), Vector3(-3.2, 1.3, -0.1), Vector3(3.2, 1.1, 0.12),
	]
	for i in vines.size():
		m.part(K.sphere(0.42 if i < 6 else 0.32, 10, 5), K.sway("leaf_soft" if i % 2 == 0 else "leaf_light", "calm"), vines[i], Vector3.ZERO, Vector3(1.2, 0.8, 1.0))
	for i in 6:
		m.part(K.sphere(0.1, 6, 3), K.mat("blossom_white" if i % 2 == 0 else "blossom"), vines[i] + Vector3(0.25, 0.25, 0.25))


func _garden(m: MeshMerger, body: StaticBody3D) -> void:
	m.origin = Transform3D.IDENTITY
	# Stepping stones winding in
	var stones: Array[Vector3] = [Vector3(0, 0, -1.6), Vector3(0.5, 0, -2.8), Vector3(0.2, 0, -4.0), Vector3(-0.4, 0, -5.2), Vector3(0.1, 0, -6.4), Vector3(0.6, 0, -7.6)]
	for p in stones:
		m.part(K.cyl(0.48, 0.52, 0.06, 10), K.mat("stone"), p + Vector3(0, 0.03, 0))
	# Pond with lily pads
	var pond := Vector3(-3.5, 0, -5.4)
	m.part(K.cyl(2.4, 2.4, 0.06, 28), K.water_mat("water_deep", true), pond + Vector3(0, 0.04, 0))
	m.part(K.torus(2.35, 2.8, 28, 6), K.mat("stone"), pond + Vector3(0, 0.06, 0), Vector3.ZERO, Vector3(1, 0.45, 1))
	for lp in [Vector3(-0.8, 0, 0.6), Vector3(0.9, 0, -0.4), Vector3(0.2, 0, 1.2), Vector3(-1.1, 0, -0.9)]:
		m.part(K.cyl(0.32, 0.32, 0.02, 10), K.mat("leaf"), pond + lp + Vector3(0, 0.085, 0))
	m.part(K.sphere(0.12, 8, 4), K.mat("blossom"), pond + Vector3(0.9, 0.17, -0.4))
	m.part(K.sphere(0.1, 8, 4), K.mat("blossom_white"), pond + Vector3(-1.1, 0.16, -0.9))
	K.add_cyl_collider(body, 2.7, 1.0, K.xf(pond + Vector3(0, 0.5, 0)))
	# One soft ring that can spread across the pond when the child arrives
	# (AmbientDirector "calm" reaction) — hidden the rest of the time, and
	# always with Reduced Motion.
	if not Engine.is_editor_hint():
		var ring := MeshInstance3D.new()
		ring.name = "PondRipple"
		ring.mesh = K.torus(2.0, 2.08, 40, 3)
		ring.material_override = K.mat("water")
		ring.position = pond + Vector3(0, 0.075, 0)
		ring.scale = Vector3(0.25, 1.0, 0.25)
		ring.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		ring.visible = false
		ring.add_to_group("mq_ripple")
		add_child(ring)
	# A small secret: a frog sitting near the willow, very calm about
	# everything.
	var frog := Vector3(2.8, 0, -4.2)
	m.origin = Transform3D.IDENTITY
	m.part(K.sphere(0.16, 10, 5), K.mat("leaf"), frog + Vector3(0, 0.12, 0), Vector3.ZERO, Vector3(1.1, 0.75, 1.0))
	m.part(K.sphere(0.11, 10, 5), K.mat("leaf"), frog + Vector3(0, 0.25, 0.08), Vector3.ZERO, Vector3(1.1, 0.8, 0.9))
	for side in [-1.0, 1.0]:
		m.part(K.sphere(0.04, 8, 4), K.mat("white"), frog + Vector3(side * 0.06, 0.33, 0.12))
		m.part(K.sphere(0.022, 6, 3), K.mat("ink"), frog + Vector3(side * 0.06, 0.34, 0.15))
		m.part(K.sphere(0.06, 8, 4), K.mat("leaf_dark"), frog + Vector3(side * 0.12, 0.05, 0.08), Vector3.ZERO, Vector3(1.0, 0.5, 1.4))
	# Willow and blossom trees
	DecorProps.willow(m, K.xf(Vector3(3.9, 0, -5.8)), 1.15)
	K.add_cyl_collider(body, 0.4, 2.5, K.xf(Vector3(3.9, 1.25, -5.8)))
	DecorProps.tree(m, K.xf(Vector3(-6.2, 0, -8.6)), "blossom", 1.2, "calm")
	DecorProps.tree(m, K.xf(Vector3(6.6, 0, -9.2)), "blossom", 1.1, "calm")
	# Low hedges framing the garden
	for side in [-1.0, 1.0]:
		for i in 5:
			var hp := Vector3(side * 5.9, 0, -1.6 - 1.7 * i)
			DecorProps.bush(m, K.xf(hp, Vector3(0, i * 37.0, 0)), 1.05, "leaf_soft")
		K.add_box_collider(body, Vector3(1.0, 1.2, 8.8), K.xf(Vector3(side * 5.9, 0.6, -5.0)))
	# Benches facing the pond and the willow
	DecorProps.bench(m, K.xf(Vector3(-0.6, 0, -4.6), Vector3(0, -90, 0)))
	DecorProps.bench(m, K.xf(Vector3(1.4, 0, -3.8), Vector3(0, 90, 0)))
	K.add_box_collider(body, Vector3(0.55, 0.9, 1.8), K.xf(Vector3(-0.6, 0.45, -4.6)))
	K.add_box_collider(body, Vector3(0.55, 0.9, 1.8), K.xf(Vector3(1.4, 0.45, -3.8)))
	# Soft low lanterns along the stones
	m.origin = Transform3D.IDENTITY
	for lp in [Vector3(-1.1, 0, -2.2), Vector3(1.5, 0, -5.9), Vector3(-1.4, 0, -7.2)]:
		m.part(K.cyl(0.12, 0.15, 0.5, 8), K.mat("stone"), lp + Vector3(0, 0.25, 0))
		m.part(K.sphere(0.17, 8, 4), K.mat("cream", 0.5), lp + Vector3(0, 0.62, 0))


func _stream_and_bridge(m: MeshMerger, body: StaticBody3D) -> void:
	m.origin = Transform3D.IDENTITY
	var z: float = STREAM_Z
	# Stream with a pond at each end
	m.part(K.box(Vector3(19.0, 0.04, 2.4)), K.water_mat("water_deep", true), Vector3(0, 0.03, z))
	for ex in [-9.5, 9.5]:
		m.part(K.cyl(2.2, 2.2, 0.05, 24), K.water_mat("water_deep", true), Vector3(ex, 0.035, z))
		m.part(K.torus(2.15, 2.55, 24, 6), K.mat("rock"), Vector3(ex, 0.06, z), Vector3.ZERO, Vector3(1, 0.4, 1))
		K.add_cyl_collider(body, 2.4, 2.0, K.xf(Vector3(ex, 1.0, z)))
	# Rocky banks (left open where the bridge is)
	var rng := RandomNumberGenerator.new()
	rng.seed = 4242
	for i in 12:
		var bx: float = -7.6 + 1.4 * i
		if absf(bx) < BRIDGE_HALF_WIDTH + 0.6:
			continue
		for bank in [-1.0, 1.0]:
			DecorProps.rock(m, K.xf(Vector3(bx + rng.randf_range(-0.3, 0.3), 0, z + bank * 1.35)), rng.randf_range(0.45, 0.8), rng.randf_range(0, 180))
	# DecorProps.rock() moved the merger's origin to the last rock: reset it
	# so the bridge below is built where the path crosses the stream.
	m.origin = Transform3D.IDENTITY
	# Water blocks walking everywhere except across the bridge
	var block_len: float = 11.7 - BRIDGE_HALF_WIDTH
	for side in [-1.0, 1.0]:
		K.add_box_collider(body, Vector3(block_len, 2.0, 2.4), K.xf(Vector3(side * (BRIDGE_HALF_WIDTH + block_len * 0.5), 1.0, z)))

	# The bridge: a flat walkable deck with gently arched rails
	m.part(K.box(Vector3(3.9, 0.12, 3.6)), K.mat("wood"), Vector3(0, 0.07, z))
	for i in 6:
		m.part(K.box(Vector3(3.9, 0.02, 0.06)), K.mat("wood_dark"), Vector3(0, 0.135, z - 1.5 + 0.6 * i))
	for sx in [-BRIDGE_HALF_WIDTH, BRIDGE_HALF_WIDTH]:
		for pz in [-1.75, 0.0, 1.75]:
			var ph: float = 1.15 if pz == 0.0 else 0.95
			m.part(K.cyl(0.08, 0.09, ph, 8), K.mat("wood_dark"), Vector3(sx, ph * 0.5, z + pz))
			m.part(K.sphere(0.1, 8, 4), K.mat("leaf_soft"), Vector3(sx, ph + 0.05, z + pz))
		for half in [-1.0, 1.0]:
			m.part(K.box(Vector3(0.1, 0.1, 1.78)), K.mat("wood"), Vector3(sx, 1.05, z + half * 0.875), Vector3(half * 6.5, 0, 0))
		K.add_box_collider(body, Vector3(0.15, 1.2, 3.6), K.xf(Vector3(sx, 0.6, z)))
