@tool
extends Landmark
## Mind Lab — "let's understand how our minds work". A round observatory
## with a soft lilac dome and a telescope pointing at the sky, warm
## porthole windows, a thought-bubble sculpture rising beside the entrance
## and two giant interlocking puzzle pieces. Curious and gentle — nothing
## clinical.

const K = preload("res://scripts/world/decor/DecorKit.gd")


func _build(m: MeshMerger, body: StaticBody3D) -> void:
	m.origin = Transform3D.IDENTITY
	var c := Vector3(0, 0, -7.0)
	m.part(K.cyl(4.7, 4.9, 0.35, 24), K.mat("stone"), c + Vector3(0, 0.17, 0))
	m.part(K.cyl(4.2, 4.2, 3.6, 24), K.mat("plaster"), c + Vector3(0, 2.15, 0))
	m.part(K.cyl(4.26, 4.26, 0.3, 24), K.mat("teal"), c + Vector3(0, 0.6, 0))
	m.part(K.cyl(4.28, 4.28, 0.32, 24), K.mat("lilac_dark"), c + Vector3(0, 3.85, 0))
	m.part(K.sphere(4.1, 24, 8, true), K.mat("lilac"), c + Vector3(0, 3.95, 0))
	m.part(K.torus(3.95, 4.35, 32, 6), K.mat("gold"), c + Vector3(0, 4.0, 0), Vector3.ZERO, Vector3(1, 0.5, 1))
	K.add_cyl_collider(body, 4.3, 5.0, K.xf(c + Vector3(0, 2.5, 0)))
	# Telescope peeking out of the dome
	# The telescope slowly scans the sky (a few degrees over many seconds).
	var scope := MeshMerger.new()
	scope.part(K.cyl(0.42, 0.55, 3.4, 12), K.mat("teal_dark"), Vector3.ZERO, Vector3(40, 0, 0))
	scope.part(K.torus(0.5, 0.64, 16, 6), K.mat("gold"), Vector3(0, 1.2, 1.0), Vector3(40, 0, 0))
	AmbientPart.make(self, "Telescope", scope, Transform3D(Basis.IDENTITY, c + Vector3(0.6, 7.0, 1.2)), "sweep", 0.16, 0.14, Vector3.UP)
	m.part(K.sphere(0.35, 10, 5), K.mat("gold", 0.4), c + Vector3(0, 8.1, 0))
	# Porthole windows
	for a_deg in [-70.0, -38.0, 38.0, 70.0]:
		var a: float = deg_to_rad(a_deg)
		var p: Vector3 = c + Vector3(sin(a) * 4.18, 2.4, cos(a) * 4.18)
		m.part(K.cyl(0.5, 0.5, 0.12, 16), K.mat("window_warm", 0.35), p, Vector3(90, a_deg, 0))
		m.part(K.torus(0.48, 0.62, 16, 6), K.mat("gold"), p, Vector3(90, a_deg, 0))

	# Entrance annex
	box_part(m, body, Vector3(3.4, 3.0, 2.6), Vector3(0, 1.85, -3.0), "plaster")
	m.part(K.sphere(1.75, 16, 6, true), K.mat("lilac_dark"), Vector3(0, 3.35, -3.0), Vector3.ZERO, Vector3(1, 0.6, 0.8))
	m.part(K.box(Vector3(1.5, 2.3, 0.15)), K.mat("teal_dark"), Vector3(0, 1.5, -1.68))
	m.part(K.sphere(0.22, 4, 2), K.mat("gold", 0.6), Vector3(0, 2.95, -1.62))
	m.part(K.box(Vector3(2.8, 0.22, 1.1)), K.mat("stone"), Vector3(0, 0.11, -1.2))

	# Thought-bubble sculpture
	var tb := Vector3(3.5, 0, -1.6)
	m.part(K.cyl(0.5, 0.6, 0.6, 12), K.mat("stone"), tb + Vector3(0, 0.3, 0))
	# The thought bubbles float up and down very slowly.
	var bubbles := MeshMerger.new()
	bubbles.part(K.sphere(0.28, 12, 6), K.mat("cream", 0.25), Vector3(0, 0.95, 0))
	bubbles.part(K.sphere(0.48, 12, 6), K.mat("cream", 0.25), Vector3(0.45, 1.85, -0.35))
	bubbles.part(K.sphere(0.95, 16, 8), K.mat("cream", 0.25), Vector3(1.0, 3.35, -0.9))
	bubbles.part(K.sphere(0.7, 14, 7), K.mat("cream", 0.25), Vector3(0.25, 3.5, -0.75))
	bubbles.part(K.sphere(0.7, 14, 7), K.mat("cream", 0.25), Vector3(1.75, 3.45, -1.05))
	bubbles.part(K.sphere(0.22, 4, 2), K.mat("gold", 0.7), Vector3(1.0, 3.45, -0.02))
	AmbientPart.make(self, "ThoughtBubbles", bubbles, Transform3D(Basis.IDENTITY, tb), "bob", 0.45, 0.07)
	K.add_cyl_collider(body, 0.6, 1.2, K.xf(tb + Vector3(0, 0.6, 0)))

	# Two interlocking puzzle pieces standing on edge
	_puzzle_piece(m, Vector3(-3.9, 0, -1.7), "teal_light", 12.0)
	_puzzle_piece(m, Vector3(-3.0, 0, -2.5), "lilac", -8.0)
	K.add_box_collider(body, Vector3(2.4, 1.9, 1.6), K.xf(Vector3(-3.45, 0.95, -2.1), Vector3(0, 20, 0)))

	# Star lanterns
	for sp in [Vector3(-5.3, 0, -3.8), Vector3(5.6, 0, -4.2)]:
		m.part(K.cyl(0.07, 0.09, 2.6, 6), K.mat("lilac_dark"), sp + Vector3(0, 1.3, 0))
		m.part(K.sphere(0.32, 4, 2), K.mat("gold", 0.9), sp + Vector3(0, 2.85, 0))


func _puzzle_piece(m: MeshMerger, pos: Vector3, color_name: String, yaw: float) -> void:
	m.origin = K.xf(pos, Vector3(0, yaw, 0))
	m.part(K.box(Vector3(1.3, 1.3, 0.35)), K.mat(color_name), Vector3(0, 0.95, 0))
	m.part(K.cyl(0.3, 0.3, 0.35, 14), K.mat(color_name), Vector3(0.78, 0.95, 0), Vector3(90, 0, 0))
	m.part(K.cyl(0.3, 0.3, 0.35, 14), K.mat(color_name), Vector3(0, 1.73, 0), Vector3(90, 0, 0))
	m.origin = Transform3D.IDENTITY
