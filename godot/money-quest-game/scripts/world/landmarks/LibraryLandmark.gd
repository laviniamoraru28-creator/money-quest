@tool
extends Landmark
## Library — unmistakably a library from across the Hub: the roof is a
## giant open book, the façade's columns are enormous book spines, warm
## light glows from the round window, and outside there is a reading nook
## with book-stack seats and a lectern holding an open book.

const K = preload("res://scripts/world/decor/DecorKit.gd")


func _build(m: MeshMerger, body: StaticBody3D) -> void:
	m.origin = Transform3D.IDENTITY
	var c := Vector3(0, 0, -6.6)
	m.part(K.box(Vector3(10.2, 0.35, 6.8)), K.mat("stone"), c + Vector3(0, 0.17, 0))
	m.part(K.box(Vector3(9.4, 4.6, 6.0)), K.mat("parchment"), c + Vector3(0, 2.65, 0))
	m.part(K.box(Vector3(9.5, 0.5, 6.1)), K.mat("wood"), c + Vector3(0, 0.6, 0))
	side_windows(m, c + Vector3(0, 2.65, 0), Vector3(9.4, 4.6, 6.0), 3, [2.0, 3.7])
	corner_trims(m, c + Vector3(0, 2.65, 0), Vector3(9.4, 4.6, 6.0), "wood")
	K.add_box_collider(body, Vector3(9.8, 5.2, 6.6), K.xf(c + Vector3(0, 2.6, 0.1)))

	# Book-spine columns
	var spine_x: Array[float] = [-4.1, -2.6, 2.6, 4.1]
	var spine_colors: Array[String] = ["teal", "book_red", "sky", "lilac_dark"]
	for i in 4:
		var p := Vector3(spine_x[i], 2.95, -3.45)
		m.part(K.box(Vector3(1.15, 5.2, 0.7)), K.mat(spine_colors[i]), p)
		m.part(K.box(Vector3(1.2, 0.12, 0.74)), K.mat("gold"), p + Vector3(0, -1.95, 0))
		m.part(K.box(Vector3(1.2, 0.12, 0.74)), K.mat("gold"), p + Vector3(0, 1.95, 0))
		m.part(K.box(Vector3(0.6, 1.0, 0.04)), K.mat("cream"), p + Vector3(0, 0.25, 0.36))

	# Door, golden arch and warm round window
	m.part(K.box(Vector3(2.0, 2.7, 0.2)), K.mat("wood_dark"), Vector3(0, 1.7, -3.55))
	m.part(K.cyl(1.0, 1.0, 0.2, 20), K.mat("wood_dark"), Vector3(0, 3.05, -3.55), Vector3(90, 0, 0))
	m.part(K.torus(1.0, 1.2, 24, 6), K.mat("gold"), Vector3(0, 3.05, -3.5), Vector3(90, 0, 0))
	m.part(K.box(Vector3(0.08, 2.4, 0.05)), K.mat("gold"), Vector3(0, 1.75, -3.43))
	m.part(K.cyl(0.6, 0.6, 0.1, 20), K.mat("window_warm", 0.6), Vector3(0, 4.45, -3.58), Vector3(90, 0, 0))
	m.part(K.torus(0.58, 0.72, 20, 6), K.mat("gold"), Vector3(0, 4.45, -3.55), Vector3(90, 0, 0))
	m.part(K.box(Vector3(3.2, 0.22, 1.4)), K.mat("stone"), Vector3(0, 0.11, -2.7))

	# Open-book roof: cover below, pages above, meeting at a low spine
	var tilt: float = 11.0
	var half: float = 2.45
	var cy: float = 5.15
	for side in [-1.0, 1.0]:
		var cx: float = side * half * cos(deg_to_rad(tilt))
		var lift: float = half * sin(deg_to_rad(tilt))
		m.part(K.box(Vector3(5.1, 0.22, 7.0)), K.mat("book_red"), c + Vector3(cx, cy + lift, 0), Vector3(0, 0, side * tilt))
		m.part(K.box(Vector3(4.8, 0.42, 6.6)), K.mat("parchment"), c + Vector3(cx * 0.97, cy + lift + 0.3, 0), Vector3(0, 0, side * tilt))
		for line in 4:
			m.part(K.box(Vector3(4.2, 0.02, 0.05)), K.mat("stone_dark"), c + Vector3(cx * 0.97, cy + lift + 0.53, -2.2 + 1.45 * line), Vector3(0, 0, side * tilt))

	# Reading nook: book-stack seats and a lamp
	_book_stack(m, body, Vector3(3.5, 0, -1.2), 14.0)
	_book_stack(m, body, Vector3(4.7, 0, -0.2), -20.0)
	DecorProps.lamp(m, K.xf(Vector3(5.0, 0, -1.9)))
	K.add_cyl_collider(body, 0.25, 3.0, K.xf(Vector3(5.0, 1.5, -1.9)))

	# Lectern with an open book
	var lec := Vector3(-3.6, 0, -1.2)
	m.origin = Transform3D.IDENTITY
	m.part(K.cyl(0.35, 0.45, 0.15, 10), K.mat("wood_dark"), lec + Vector3(0, 0.07, 0))
	m.part(K.cyl(0.1, 0.12, 1.0, 8), K.mat("wood"), lec + Vector3(0, 0.6, 0))
	m.part(K.box(Vector3(0.9, 0.06, 0.6)), K.mat("wood"), lec + Vector3(0, 1.12, 0.05), Vector3(25, 0, 0))
	for side in [-1.0, 1.0]:
		m.part(K.box(Vector3(0.4, 0.05, 0.5)), K.mat("cream"), lec + Vector3(side * 0.2, 1.18, 0.08), Vector3(25, 0, side * 6.0))
	# Now and then a single page lifts, as if a breeze turned it.
	var page := MeshMerger.new()
	page.part(K.box(Vector3(0.36, 0.012, 0.46)), K.mat("white"), Vector3(0.18, 0.0, 0))
	AmbientPart.make(self, "TurningPage", page, K.xf(lec + Vector3(0.01, 1.215, 0.08), Vector3(25, 0, 6)), "nod", 0.33, 0.6, Vector3.BACK, 1.0)
	K.add_cyl_collider(body, 0.45, 1.3, K.xf(lec + Vector3(0, 0.65, 0)))


func _book_stack(m: MeshMerger, body: StaticBody3D, pos: Vector3, yaw: float) -> void:
	var colors: Array[String] = ["teal", "gold", "book_red", "sky"]
	m.origin = Transform3D.IDENTITY
	for i in 3:
		m.part(K.box(Vector3(1.3, 0.3, 0.95)), K.mat(colors[(i + int(absf(yaw))) % colors.size()]), pos + Vector3(0, 0.15 + 0.3 * i, 0), Vector3(0, yaw + 9.0 * i, 0))
		m.part(K.box(Vector3(1.22, 0.24, 0.9)), K.mat("parchment"), pos + Vector3(0.05, 0.15 + 0.3 * i, 0), Vector3(0, yaw + 9.0 * i, 0))
	K.add_box_collider(body, Vector3(1.3, 0.9, 1.0), K.xf(pos + Vector3(0, 0.45, 0), Vector3(0, yaw, 0)))
