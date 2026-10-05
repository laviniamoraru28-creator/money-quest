@tool
extends Landmark
## Museum — an important civic landmark: stepped stone plinth, a portico
## of columns under a pediment with a gold medallion, a soft green dome,
## tall banners and two "exhibits" outside the entrance (a globe with a
## golden ring and a giant ancient coin on a stand).

const K = preload("res://scripts/world/decor/DecorKit.gd")


func _build(m: MeshMerger, body: StaticBody3D) -> void:
	m.origin = Transform3D.IDENTITY
	var c := Vector3(0, 0, -6.2)
	# Stepped plinth
	for i in 3:
		var shrink: float = 0.6 * i
		m.part(K.box(Vector3(10.0 - shrink, 0.25, 7.5 - shrink)), K.mat("stone"), c + Vector3(0, 0.125 + 0.25 * i, 0))
	K.add_box_collider(body, Vector3(10.0, 0.75, 7.5), K.xf(c + Vector3(0, 0.375, 0)))

	# Cella, roof, dome
	box_part(m, body, Vector3(8.4, 4.6, 4.4), Vector3(0, 3.05, -7.6), "stone")
	m.part(K.box(Vector3(8.6, 0.4, 4.6)), K.mat("stone_dark"), Vector3(0, 5.55, -7.6))
	m.part(K.cyl(2.65, 2.65, 0.7, 24), K.mat("stone"), Vector3(0, 6.1, -7.6))
	m.part(K.sphere(2.55, 24, 8, true), K.mat("verdigris"), Vector3(0, 6.45, -7.6))
	m.part(K.sphere(0.3, 10, 5), K.mat("gold"), Vector3(0, 9.1, -7.6))

	# Portico: columns, entablature, pediment
	for cx in [-3.7, -2.2, -0.75, 0.75, 2.2, 3.7]:
		m.part(K.box(Vector3(0.95, 0.25, 0.95)), K.mat("stone_dark"), Vector3(cx, 0.875, -3.6))
		m.part(K.cyl(0.36, 0.4, 4.0, 10), K.mat("cream"), Vector3(cx, 3.0, -3.6))
		m.part(K.box(Vector3(0.95, 0.25, 0.95)), K.mat("stone_dark"), Vector3(cx, 5.0, -3.6))
	m.part(K.box(Vector3(8.9, 0.6, 2.6)), K.mat("stone"), Vector3(0, 5.42, -4.4))
	m.part(K.box(Vector3(8.95, 0.12, 2.65)), K.mat("gold"), Vector3(0, 5.2, -4.4))
	m.part(K.prism(Vector3(9.0, 1.7, 2.6)), K.mat("stone"), Vector3(0, 6.57, -4.4))
	m.part(K.cyl(0.55, 0.55, 0.12, 20), K.mat("gold"), Vector3(0, 6.3, -3.08), Vector3(90, 0, 0))
	m.part(K.cyl(0.36, 0.36, 0.14, 20), K.mat("gold_deep"), Vector3(0, 6.3, -3.06), Vector3(90, 0, 0))

	# Doors and banners
	m.part(K.box(Vector3(2.0, 3.2, 0.2)), K.mat("wood_dark"), Vector3(0, 2.35, -5.35))
	for hx in [-0.25, 0.25]:
		m.part(K.sphere(0.08, 8, 4), K.mat("gold"), Vector3(hx, 2.3, -5.22))
	for bx in [-2.95, 2.95]:
		m.part(K.box(Vector3(0.75, 2.5, 0.05)), K.cloth("coral"), Vector3(bx, 3.75, -3.55))
		m.part(K.prism(Vector3(0.75, 0.3, 0.05)), K.cloth("coral"), Vector3(bx, 2.35, -3.55), Vector3(0, 0, 180))
		m.part(K.cyl(0.2, 0.2, 0.03, 12), K.cloth("gold"), Vector3(bx, 4.2, -3.5), Vector3(90, 0, 0))

	# Exhibits outside: a globe with a golden ring, and a giant ancient coin
	var globe := Vector3(3.9, 0, -0.9)
	m.part(K.box(Vector3(0.9, 1.1, 0.9)), K.mat("stone"), globe + Vector3(0, 0.55, 0))
	m.part(K.box(Vector3(1.05, 0.12, 1.05)), K.mat("gold"), globe + Vector3(0, 1.12, 0))
	m.part(K.torus(0.68, 0.78, 28, 6), K.mat("gold"), globe + Vector3(0, 1.85, 0), Vector3(70, 0, 20))
	# The globe itself turns very slowly inside its golden ring.
	var g := MeshMerger.new()
	g.part(K.sphere(0.6, 16, 8), K.mat("teal_light"))
	g.part(K.sphere(0.32, 10, 5), K.mat("leaf_light"), Vector3(0.22, 0.2, 0.38), Vector3.ZERO, Vector3(1, 0.7, 0.45))
	g.part(K.sphere(0.24, 10, 5), K.mat("leaf_light"), Vector3(-0.3, -0.12, -0.42), Vector3.ZERO, Vector3(1, 0.8, 0.5))
	AmbientPart.make(self, "Globe", g, K.xf(globe + Vector3(0, 1.85, 0), Vector3(0, 0, 18)), "spin", 0.12, 0.0, Vector3.UP)
	K.add_box_collider(body, Vector3(0.9, 2.4, 0.9), K.xf(globe + Vector3(0, 1.2, 0)))

	var coin := Vector3(-3.9, 0, -0.9)
	m.part(K.box(Vector3(0.9, 0.9, 0.7)), K.mat("stone"), coin + Vector3(0, 0.45, 0))
	m.part(K.box(Vector3(0.12, 0.6, 0.12)), K.mat("stone_dark"), coin + Vector3(0, 1.2, 0))
	m.part(K.cyl(0.62, 0.62, 0.14, 20), K.mat("gold_deep"), coin + Vector3(0, 2.0, 0), Vector3(90, 0, 0))
	m.part(K.cyl(0.45, 0.45, 0.16, 20), K.mat("gold"), coin + Vector3(0, 2.0, 0), Vector3(90, 0, 0))
	m.part(K.box(Vector3(0.18, 0.18, 0.18)), K.mat("gold_deep"), coin + Vector3(0, 2.0, 0), Vector3(0, 0, 45))
	K.add_box_collider(body, Vector3(0.9, 2.6, 0.7), K.xf(coin + Vector3(0, 1.3, 0)))
