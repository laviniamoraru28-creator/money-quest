@tool
extends Landmark
## Entrepreneur Quest — a creative little market street. A workshop with a
## giant light bulb on its roof (the Idea Lab it leads to), two small shops
## with striped awnings, bunting, crates of goods, an idea board and a
## delivery cart: "I can make something here."

const K = preload("res://scripts/world/decor/DecorKit.gd")


func _build(m: MeshMerger, body: StaticBody3D) -> void:
	m.origin = Transform3D.IDENTITY
	# Workshop
	var w := Vector3(0, 0, -6.0)
	m.part(K.box(Vector3(6.6, 0.35, 5.6)), K.mat("stone"), w + Vector3(0, 0.17, 0))
	box_part(m, body, Vector3(6.0, 4.2, 5.0), w + Vector3(0, 2.45, 0), "plaster")
	m.part(K.box(Vector3(6.1, 0.3, 5.1)), K.mat("ember"), w + Vector3(0, 4.6, 0))
	m.part(K.prism(Vector3(6.8, 2.2, 5.6)), K.mat("ember"), w + Vector3(0, 5.85, 0))
	side_windows(m, w + Vector3(0, 2.45, 0), Vector3(6.0, 4.2, 5.0), 2, [2.6], "coral")
	corner_trims(m, w + Vector3(0, 2.45, 0), Vector3(6.0, 4.2, 5.0), "coral")
	m.part(K.box(Vector3(2.0, 2.9, 0.2)), K.mat("wood_dark"), w + Vector3(0, 1.8, 2.5))
	m.part(K.box(Vector3(2.4, 0.25, 0.3)), K.mat("coral"), w + Vector3(0, 3.35, 2.52))
	for sx in [-2.0, 2.0]:
		m.part(K.box(Vector3(1.1, 1.3, 0.12)), K.mat("window_warm", 0.35), w + Vector3(sx, 2.6, 2.52))
		m.part(K.box(Vector3(1.3, 0.14, 0.25)), K.mat("coral"), w + Vector3(sx, 1.88, 2.6))
	# The giant idea bulb on the roof
	var bulb := w + Vector3(0, 7.0, 0)
	m.part(K.cyl(0.45, 0.55, 0.7, 12), K.mat("stone_dark"), bulb + Vector3(0, 0.35, 0))
	for i in 3:
		m.part(K.torus(0.42, 0.56, 16, 6), K.mat("stone"), bulb + Vector3(0, 0.15 + 0.2 * i, 0))
	m.part(K.sphere(1.05, 16, 8), K.mat("bulb", 0.9), bulb + Vector3(0, 1.55, 0))
	m.part(K.sphere(0.6, 12, 6), K.mat("bulb", 0.9), bulb + Vector3(0, 0.95, 0))

	# Two shops angled toward the street
	_shop(m, body, Vector3(-5.0, 0, -2.6), 22.0, "coral", "ember")
	_shop(m, body, Vector3(5.0, 0, -2.6), -22.0, "teal_light", "sky")

	# Bunting between the shops and the workshop
	var left := Vector3(-4.0, 4.4, -2.2)
	var right := Vector3(4.0, 4.4, -2.2)
	var flag_colors: Array[String] = ["ember", "gold", "sky", "coral", "teal_light"]
	for i in 13:
		var t: float = float(i) / 12.0
		var p: Vector3 = left.lerp(right, t) + Vector3(0, -0.5 * sin(t * PI), 0)
		m.part(K.prism(Vector3(0.36, 0.42, 0.03)), K.cloth(flag_colors[i % flag_colors.size()]), p + Vector3(0, -0.22, 0), Vector3(0, 0, 180))

	# Idea board and delivery cart
	var board := Vector3(-2.6, 0, -1.3)
	for sx in [-0.8, 0.8]:
		m.part(K.cyl(0.06, 0.06, 1.9, 6), K.mat("wood_dark"), board + Vector3(sx, 0.95, 0))
	m.part(K.box(Vector3(1.8, 1.1, 0.08)), K.mat("cream"), board + Vector3(0, 1.45, 0))
	var note_colors: Array[String] = ["gold", "coral", "sky_light", "leaf_light", "lilac"]
	for i in 5:
		m.part(K.box(Vector3(0.28, 0.28, 0.02)), K.mat(note_colors[i]), board + Vector3(-0.6 + 0.3 * i, 1.45 + 0.22 * ((i % 2) * 2 - 1), 0.05), Vector3(0, 0, 6.0 * ((i % 3) - 1)))
	m.part(K.sphere(0.18, 8, 4), K.mat("bulb", 0.6), board + Vector3(0.7, 2.15, 0.02))
	K.add_box_collider(body, Vector3(1.9, 1.9, 0.3), K.xf(board + Vector3(0, 0.95, 0)))

	var cart := Vector3(2.7, 0, -1.1)
	m.part(K.box(Vector3(1.4, 0.55, 0.85)), K.mat("gold"), cart + Vector3(0, 0.75, 0))
	for sx in [-0.45, 0.45]:
		m.part(K.cyl(0.32, 0.32, 0.1, 12), K.mat("ink"), cart + Vector3(sx, 0.32, 0.47), Vector3(90, 0, 0))
		m.part(K.cyl(0.32, 0.32, 0.1, 12), K.mat("ink"), cart + Vector3(sx, 0.32, -0.47), Vector3(90, 0, 0))
	m.part(K.cyl(0.04, 0.04, 1.0, 6), K.mat("wood_dark"), cart + Vector3(-1.15, 0.85, 0), Vector3(0, 0, 70))
	DecorProps.crate(m, K.xf(cart + Vector3(-0.25, 1.03, 0)), "coral")
	DecorProps.crate(m, K.xf(cart + Vector3(0.35, 1.03, 0.05), Vector3(0, 12, 0)), "leaf_light")
	K.add_box_collider(body, Vector3(1.5, 1.4, 1.0), K.xf(cart + Vector3(0, 0.7, 0)))


func _shop(m: MeshMerger, body: StaticBody3D, pos: Vector3, yaw: float, wall: String, roof: String) -> void:
	var base: Transform3D = K.xf(pos, Vector3(0, yaw, 0))
	m.origin = base
	m.part(K.box(Vector3(3.4, 0.3, 3.4)), K.mat("stone"), Vector3(0, 0.15, 0))
	m.part(K.box(Vector3(3.0, 3.0, 3.0)), K.mat(wall), Vector3(0, 1.8, 0))
	m.part(K.prism(Vector3(3.5, 1.4, 3.4)), K.mat(roof), Vector3(0, 4.0, 0))
	m.part(K.box(Vector3(2.0, 1.1, 0.1)), K.mat("window_warm", 0.3), Vector3(0, 1.75, 1.52))
	m.part(K.box(Vector3(2.6, 0.5, 0.12)), K.mat("gold"), Vector3(0, 3.1, 1.55))
	# Striped awning
	for i in 6:
		var stripe_color: String = "ember" if i % 2 == 0 else "cream"
		m.part(K.box(Vector3(0.5, 0.06, 1.2)), K.cloth(stripe_color), Vector3(-1.25 + 0.5 * i, 2.55, 1.95), Vector3(-22, 0, 0))
	# Counter with goods
	m.part(K.box(Vector3(2.4, 0.8, 0.6)), K.mat("wood"), Vector3(0, 0.4, 2.0))
	var goods: Array[String] = ["gold", "coral", "sky_light", "leaf_light"]
	for i in 4:
		m.part(K.sphere(0.16, 8, 4), K.mat(goods[i]), Vector3(-0.75 + 0.5 * i, 0.95, 2.0))
	DecorKit.add_box_collider(body, Vector3(3.0, 3.0, 3.8), base * K.xf(Vector3(0, 1.5, 0.35)))
	m.origin = Transform3D.IDENTITY
