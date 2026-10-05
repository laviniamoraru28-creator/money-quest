@tool
extends Landmark
## Money Quest — the Golden Vault district. A round teal vault with a gold
## dome and a giant vault door (the destination it leads to), flanked by
## the Savings Tower — a tall stack of coins, the tallest landmark in the
## Hub and the first thing a child sees from spawn — and a "growing
## savings" sculpture of rising bars topped by a sprout. Coins appear only
## as symbols of saving and growth: no slot machines, dice or prizes.

const K = preload("res://scripts/world/decor/DecorKit.gd")


func _build(m: MeshMerger, body: StaticBody3D) -> void:
	m.origin = Transform3D.IDENTITY
	# Plinth and vault drum
	m.part(K.cyl(5.8, 6.0, 0.4, 24), K.mat("stone"), Vector3(0, 0.2, -6.6))
	m.part(K.cyl(5.0, 5.0, 5.0, 24), K.mat("teal"), Vector3(0, 2.9, -6.6))
	m.part(K.cyl(5.1, 5.1, 0.32, 24), K.mat("gold"), Vector3(0, 0.75, -6.6))
	m.part(K.cyl(5.12, 5.12, 0.35, 24), K.mat("gold"), Vector3(0, 5.25, -6.6))
	m.part(K.sphere(4.95, 24, 8, true), K.mat("gold"), Vector3(0, 5.4, -6.6))
	m.part(K.cyl(0.35, 0.5, 0.7, 10), K.mat("teal_dark"), Vector3(0, 10.6, -6.6))
	m.part(K.sphere(0.55, 12, 6), K.mat("gold", 0.35), Vector3(0, 11.35, -6.6))
	K.add_cyl_collider(body, 5.1, 6.0, K.xf(Vector3(0, 3.0, -6.6)))

	# Windows around the drum (only the front half is ever seen)
	for i in 5:
		var a: float = deg_to_rad(-60.0 + 30.0 * i)
		var p := Vector3(sin(a) * 4.98, 3.6, -6.6 + cos(a) * 4.98)
		if absf(p.x) < 1.5:
			continue
		m.part(K.box(Vector3(0.8, 1.3, 0.12)), K.mat("window_warm", 0.35), p, Vector3(0, rad_to_deg(a), 0))

	# Giant vault door on the façade
	var door_z: float = -1.45
	m.part(K.cyl(2.15, 2.15, 0.5, 28), K.mat("gold_deep"), Vector3(0, 2.6, door_z - 0.1), Vector3(90, 0, 0))
	m.part(K.cyl(1.85, 1.85, 0.3, 28), K.mat("gold"), Vector3(0, 2.6, door_z + 0.15), Vector3(90, 0, 0))
	m.part(K.torus(1.25, 1.45, 28, 6), K.mat("gold_deep"), Vector3(0, 2.6, door_z + 0.3), Vector3(90, 0, 0))
	for spoke in [0.0, 60.0, 120.0]:
		m.part(K.box(Vector3(2.4, 0.16, 0.12)), K.mat("teal_dark"), Vector3(0, 2.6, door_z + 0.35), Vector3(0, 0, spoke))
	m.part(K.cyl(0.42, 0.42, 0.25, 16), K.mat("teal_dark"), Vector3(0, 2.6, door_z + 0.42), Vector3(90, 0, 0))
	m.part(K.box(Vector3(5.2, 0.22, 1.4)), K.mat("stone"), Vector3(0, 0.11, -0.9))

	# Savings Tower — a stack of coins
	var tower := Vector3(5.6, 0, -3.4)
	m.part(K.cyl(1.9, 2.1, 0.5, 16), K.mat("stone"), tower + Vector3(0, 0.25, 0))
	var y: float = 0.5
	for i in 18:
		var wobble := Vector3(0.09 * sin(i * 1.7), 0, 0.09 * cos(i * 2.3))
		var coin_color: String = "gold" if i % 2 == 0 else "gold_deep"
		m.part(K.cyl(1.35, 1.35, 0.42, 16), K.mat(coin_color), tower + wobble + Vector3(0, y + 0.21, 0))
		m.part(K.cyl(1.0, 1.0, 0.44, 16), K.mat("gold"), tower + wobble + Vector3(0, y + 0.21, 0))
		y += 0.44
	m.part(K.cyl(0.0, 1.1, 1.5, 12), K.mat("teal"), tower + Vector3(0, y + 0.75, 0))
	m.part(K.sphere(0.4, 12, 6), K.mat("gold", 0.35), tower + Vector3(0, y + 1.7, 0))
	m.part(K.cyl(0.04, 0.04, 1.6, 6), K.mat("wood_dark"), tower + Vector3(0, y + 2.6, 0))
	m.part(K.box(Vector3(0.9, 0.55, 0.04)), K.cloth("teal"), tower + Vector3(0.47, y + 3.1, 0))
	K.add_cyl_collider(body, 1.5, y + 2.0, K.xf(tower + Vector3(0, (y + 2.0) * 0.5, 0)))

	# "Growing savings" — three rising bars with a sprout on top
	var bars := Vector3(-5.4, 0, -3.2)
	m.part(K.box(Vector3(3.6, 0.3, 1.6)), K.mat("stone"), bars + Vector3(0, 0.15, 0))
	var heights: Array[float] = [1.2, 2.2, 3.4]
	var bar_colors: Array[String] = ["teal_light", "teal", "gold"]
	for i in 3:
		var bx: float = -1.1 + 1.1 * i
		m.part(K.box(Vector3(0.85, heights[i], 0.85)), K.mat(bar_colors[i]), bars + Vector3(bx, 0.3 + heights[i] * 0.5, 0))
		m.part(K.cyl(0.32, 0.32, 0.12, 12), K.mat("gold"), bars + Vector3(bx, 0.36 + heights[i], 0))
	m.part(K.cyl(0.05, 0.06, 0.7, 6), K.mat("leaf_dark"), bars + Vector3(1.1, 4.3, 0))
	m.part(K.sphere(0.3, 8, 4), K.sway("leaf_light"), bars + Vector3(0.88, 4.65, 0), Vector3(0, 0, 35), Vector3(1.0, 0.45, 0.6))
	m.part(K.sphere(0.3, 8, 4), K.sway("leaf_light"), bars + Vector3(1.32, 4.7, 0), Vector3(0, 0, -35), Vector3(1.0, 0.45, 0.6))
	K.add_box_collider(body, Vector3(3.6, 3.8, 1.6), K.xf(bars + Vector3(0, 1.9, 0)))

	# Treasure chests (savings symbols) by the entrance
	DecorProps.chest(m, K.xf(Vector3(-3.2, 0, -1.0), Vector3(0, 20, 0)))
	DecorProps.chest(m, K.xf(Vector3(3.3, 0, -1.2), Vector3(0, -15, 0)))
	K.add_box_collider(body, Vector3(1.0, 0.9, 0.7), K.xf(Vector3(-3.2, 0.45, -1.0), Vector3(0, 20, 0)))
	K.add_box_collider(body, Vector3(1.0, 0.9, 0.7), K.xf(Vector3(3.3, 0.45, -1.2), Vector3(0, -15, 0)))
