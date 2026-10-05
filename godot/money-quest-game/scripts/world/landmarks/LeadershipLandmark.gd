@tool
extends Landmark
## Leadership Academy — a welcoming campus: a long academy hall with a
## central clock tower (the tallest silhouette on the Hub's east side),
## banners, a notice board and a small open-air amphitheatre where a group
## could gather — learning, leading and working together.

const K = preload("res://scripts/world/decor/DecorKit.gd")


func _build(m: MeshMerger, body: StaticBody3D) -> void:
	m.origin = Transform3D.IDENTITY
	# Academy hall
	m.part(K.box(Vector3(9.8, 0.35, 5.4)), K.mat("stone"), Vector3(0, 0.17, -6.4))
	box_part(m, body, Vector3(9.0, 4.2, 4.5), Vector3(0, 2.45, -6.4), "plaster")
	m.part(K.box(Vector3(9.2, 0.3, 4.7)), K.mat("teal"), Vector3(0, 4.6, -6.4))
	m.part(K.prism(Vector3(9.6, 1.8, 5.0)), K.mat("sky"), Vector3(0, 5.65, -6.4))
	side_windows(m, Vector3(0, 2.45, -6.4), Vector3(9.0, 4.2, 4.5), 2, [1.7, 3.4], "teal_dark")
	corner_trims(m, Vector3(0, 2.45, -6.4), Vector3(9.0, 4.2, 4.5), "teal")
	for sx in [-3.6, -2.4, 2.4, 3.6]:
		for wy in [1.7, 3.4]:
			m.part(K.box(Vector3(0.75, 1.05, 0.1)), K.mat("window_warm", 0.25), Vector3(sx, wy, -4.12))
			m.part(K.box(Vector3(0.9, 0.12, 0.2)), K.mat("teal_dark"), Vector3(sx, wy - 0.6, -4.08))

	# Clock tower
	var t := Vector3(0, 0, -3.6)
	box_part(m, body, Vector3(2.8, 8.6, 2.8), t + Vector3(0, 4.65, 0), "plaster")
	m.part(K.box(Vector3(2.95, 0.3, 2.95)), K.mat("teal"), t + Vector3(0, 6.5, 0))
	m.part(K.box(Vector3(2.95, 0.3, 2.95)), K.mat("teal"), t + Vector3(0, 8.95, 0))
	m.part(K.box(Vector3(2.3, 1.4, 2.3)), K.mat("sky_light"), t + Vector3(0, 9.8, 0))
	m.part(K.cyl(0.0, 2.1, 2.6, 4), K.mat("sky"), t + Vector3(0, 11.8, 0), Vector3(0, 45, 0))
	m.part(K.sphere(0.25, 10, 5), K.mat("gold"), t + Vector3(0, 13.25, 0))
	# Clock face
	var face := t + Vector3(0, 7.7, 1.42)
	m.part(K.cyl(0.95, 0.95, 0.08, 24), K.mat("cream"), face, Vector3(90, 0, 0))
	m.part(K.torus(0.92, 1.08, 24, 6), K.mat("gold"), face + Vector3(0, 0, 0.02), Vector3(90, 0, 0))
	m.part(K.box(Vector3(0.5, 0.08, 0.04)), K.mat("ink"), face + Vector3(0.22, 0, 0.07))
	# The minute hand creeps round once every four minutes — alive, never
	# distracting.
	var hand := MeshMerger.new()
	hand.part(K.box(Vector3(0.07, 0.68, 0.04)), K.mat("ink"), Vector3(0, 0.3, 0))
	AmbientPart.make(self, "MinuteHand", hand, Transform3D(Basis.IDENTITY, face + Vector3(0, 0, 0.09)), "spin", -TAU / 240.0, 0.0, Vector3.BACK)
	m.part(K.sphere(0.08, 8, 4), K.mat("gold"), face + Vector3(0, 0, 0.08))
	# Tower door
	m.part(K.box(Vector3(1.5, 2.4, 0.15)), K.mat("wood_dark"), t + Vector3(0, 1.55, 1.42))
	m.part(K.torus(0.62, 0.78, 20, 6), K.mat("gold"), t + Vector3(0, 2.75, 1.45), Vector3(90, 0, 0))
	m.part(K.box(Vector3(3.4, 0.22, 1.2)), K.mat("stone"), Vector3(0, 0.11, -1.8))

	banner(m, Vector3(-4.3, 0, -2.6), "teal")
	banner(m, Vector3(3.3, 0, -2.6), "sky")

	# Notice board
	var nb := Vector3(3.6, 0, -0.9)
	for sx in [-0.75, 0.75]:
		m.part(K.cyl(0.06, 0.06, 2.0, 6), K.mat("wood_dark"), nb + Vector3(sx, 1.0, 0))
	m.part(K.box(Vector3(1.7, 1.1, 0.08)), K.mat("sky"), nb + Vector3(0, 1.5, 0))
	m.part(K.prism(Vector3(1.9, 0.35, 0.3)), K.mat("teal"), nb + Vector3(0, 2.2, 0))
	var paper_colors: Array[String] = ["cream", "gold", "cream", "coral"]
	for i in 4:
		m.part(K.box(Vector3(0.32, 0.4, 0.02)), K.mat(paper_colors[i]), nb + Vector3(-0.55 + 0.37 * i, 1.5 + 0.1 * (i % 2), 0.05))
	K.add_box_collider(body, Vector3(1.8, 2.0, 0.3), K.xf(nb + Vector3(0, 1.0, 0)))

	# Small amphitheatre: a round stage and a ring of benches facing it
	var stage := Vector3(-5.3, 0, 0.3)
	m.part(K.cyl(1.2, 1.3, 0.2, 20), K.mat("stone"), stage + Vector3(0, 0.1, 0))
	m.part(K.torus(1.2, 1.35, 20, 4), K.mat("sky"), stage + Vector3(0, 0.2, 0), Vector3.ZERO, Vector3(1, 0.3, 1))
	for a_deg in [20.0, 55.0, 90.0, 125.0, 160.0]:
		var a: float = deg_to_rad(a_deg)
		var u := Vector3(cos(a), 0, sin(a))
		var pos: Vector3 = stage + u * 2.5
		var yaw: float = rad_to_deg(atan2(-u.x, -u.z))
		DecorProps.bench(m, K.xf(pos, Vector3(0, yaw, 0)))
		K.add_box_collider(body, Vector3(1.8, 0.9, 0.55), K.xf(pos + Vector3(0, 0.45, 0), Vector3(0, yaw, 0)))
