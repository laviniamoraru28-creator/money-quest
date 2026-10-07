@tool
extends ZoneDressing
## Golden Vault — inside the vault the Hub's Money Quest landmark leads
## into: a teal-and-gold hall with the giant round vault door on the back
## wall (its wheel turns very slowly), coin towers, closed treasure chests
## (savings symbols, never prizes), a "growing savings" row of rising coin
## stacks, banners, lanterns, potted plants and benches. Only decoration —
## the zone's NPCs, quests and portals are untouched.
##
## Purposeful details make saving visible: a row of savings jars filling
## up, a coin-counting table with an abacus, a growth chart; dust motes
## drift in the warm light and a coin glints now and then (ZoneLife
## "vault"). Two optional curiosities: a savings jar by the way in and, for
## explorers, the smallest vault in the world hidden in a corner.

const VAULT_WHEEL_SPEED: float = 0.05   # radians per second — barely moving


func _init() -> void:
	# The vault's theme on top of ZoneDressing's standard room: a rich gold
	# aisle leading to the vault door (the Money Quest district's gold).
	district_style = "golden_vault"
	path_color = "gold"


func _build_props(m: MeshMerger, body: StaticBody3D) -> void:
	var h: Vector2 = half()
	var back_z: float = -h.y + 0.5
	m.origin = Transform3D.IDENTITY

	# Vault door set into the back wall
	var door := Vector3(0, 2.7, back_z + 0.05)
	m.part(K.cyl(2.5, 2.5, 0.35, 32), K.mat("teal_dark"), door, Vector3(90, 0, 0))
	m.part(K.cyl(2.2, 2.2, 0.4, 32), K.mat("gold_deep"), door + Vector3(0, 0, 0.12), Vector3(90, 0, 0))
	m.part(K.cyl(1.9, 1.9, 0.3, 32), K.mat("gold"), door + Vector3(0, 0, 0.3), Vector3(90, 0, 0))
	m.part(K.torus(1.3, 1.5, 32, 6), K.mat("gold_deep"), door + Vector3(0, 0, 0.45), Vector3(90, 0, 0))
	for i in 8:
		var a: float = TAU * i / 8.0
		m.part(K.cyl(0.13, 0.13, 0.12, 10), K.mat("gold_deep"), door + Vector3(cos(a) * 2.05, sin(a) * 2.05, 0.3), Vector3(90, 0, 0))
	var wheel := MeshMerger.new()
	for spoke in [0.0, 60.0, 120.0]:
		wheel.part(K.box(Vector3(2.5, 0.16, 0.12)), K.mat("teal_dark"), Vector3.ZERO, Vector3(0, 0, spoke))
	wheel.part(K.cyl(0.42, 0.42, 0.22, 16), K.mat("teal_dark"), Vector3.ZERO, Vector3(90, 0, 0))
	wheel.part(K.sphere(0.16, 10, 5), K.mat("gold", 0.35), Vector3(0, 0, 0.12))
	AmbientPart.make(self, "VaultWheel", wheel, Transform3D(Basis.IDENTITY, door + Vector3(0, 0, 0.56)), "spin", VAULT_WHEEL_SPEED, 0.0, Vector3.BACK)
	m.origin = Transform3D.IDENTITY
	# A low step (no collider: it is ankle-high, so it never blocks the aisle)
	m.part(K.box(Vector3(6.0, 0.13, 1.2)), K.mat("stone"), Vector3(0, 0.065, back_z + 0.7))

	# Banners flanking the door
	for bx in [-3.55, 3.55]:
		DecorProps.wall_banner(m, K.xf(Vector3(bx, 0, back_z + 0.3)), "teal")

	# Coin towers in the back corners
	for side in [-1.0, 1.0]:
		var c := Vector3(side * (h.x - 2.2), 0, back_z + 1.9)
		if is_free(c, 1.4):
			_coin_tower(m, body, c, 11)

	# Treasure chests near the back wall
	for cx in [-6.2, 6.2]:
		var c := Vector3(cx, 0, back_z + 1.2)
		if is_free(c, 0.7):
			DecorProps.chest(m, K.xf(c, Vector3(0, -cx * 2.0, 0)))
			K.add_box_collider(body, Vector3(1.0, 0.9, 0.7), K.xf(c + Vector3(0, 0.45, 0), Vector3(0, -cx * 2.0, 0)))

	# "Growing savings": three pedestals with rising coin stacks, along the right wall
	var gx: float = h.x - 1.6
	var heights: Array[int] = [2, 5, 9]
	var tallest_built := false
	for i in 3:
		var p := Vector3(gx, 0, 4.5 - i * 2.2)
		if not is_free(p, 0.6):
			continue
		tallest_built = i == 2
		m.origin = Transform3D.IDENTITY
		m.part(K.box(Vector3(1.1, 0.8, 1.1)), K.mat("stone"), p + Vector3(0, 0.4, 0))
		m.part(K.box(Vector3(1.2, 0.1, 1.2)), K.mat(trim_color), p + Vector3(0, 0.82, 0))
		for j in heights[i]:
			m.part(K.cyl(0.36, 0.36, 0.12, 14), K.mat("gold" if j % 2 == 0 else "gold_deep"), p + Vector3(0.02 * sin(j), 0.93 + j * 0.13, 0.02 * cos(j)))
		K.add_box_collider(body, Vector3(1.1, 0.9, 1.1), K.xf(p + Vector3(0, 0.45, 0)))
	# ...the tallest stack sprouts a little plant: savings that grow.
	if tallest_built:
		m.origin = Transform3D.IDENTITY
		var sprout := Vector3(gx, 0.93 + heights[2] * 0.13, 4.5 - 2 * 2.2)
		m.part(K.cyl(0.03, 0.04, 0.4, 6), K.mat("leaf_dark"), sprout + Vector3(0, 0.2, 0))
		m.part(K.sphere(0.2, 8, 4), K.sway("leaf_light", "flower"), sprout + Vector3(-0.14, 0.42, 0), Vector3(0, 0, 30), Vector3(1, 0.45, 0.6))
		m.part(K.sphere(0.2, 8, 4), K.sway("leaf_light", "flower"), sprout + Vector3(0.14, 0.45, 0), Vector3(0, 0, -30), Vector3(1, 0.45, 0.6))

	# Lanterns, plants and benches around the hall
	for lp in [Vector3(-6.8, 0, 5.6), Vector3(6.8, 0, 5.6), Vector3(-h.x + 1.4, 0, -4.0), Vector3(h.x - 1.4, 0, -6.6)]:
		if is_free(lp, 0.4):
			DecorProps.lamp(m, K.xf(lp))
			K.add_cyl_collider(body, 0.25, 3.0, K.xf(lp + Vector3(0, 1.5, 0)))
	for pp in [Vector3(-h.x + 1.7, 0, h.y - 1.8), Vector3(h.x - 1.7, 0, h.y - 1.8), Vector3(-h.x + 1.7, 0, 0.6)]:
		if is_free(pp, 0.7):
			DecorProps.potted_plant(m, K.xf(pp), "coral", trim_color)
			K.add_cyl_collider(body, 0.45, 1.5, K.xf(pp + Vector3(0, 0.75, 0)))
	for bp in [[Vector3(-h.x + 1.7, 0, 4.2), 90.0], [Vector3(h.x - 1.7, 0, -4.4), -90.0]]:
		if is_free(bp[0], 0.9):
			DecorProps.bench(m, K.xf(bp[0], Vector3(0, bp[1], 0)))
			K.add_box_collider(body, Vector3(1.8, 0.9, 0.55), K.xf(bp[0] + Vector3(0, 0.45, 0), Vector3(0, bp[1], 0)))

	# A gold coin medallion in the floor where the aisle meets the vault
	m.origin = Transform3D.IDENTITY
	m.part(K.cyl(1.3, 1.3, 0.02, 32), K.mat("gold"), Vector3(0, 0.1, back_z + 2.6))
	m.part(K.cyl(0.95, 0.95, 0.024, 32), K.mat("gold_deep"), Vector3(0, 0.102, back_z + 2.6))
	m.part(K.torus(0.55, 0.7, 28, 4), K.mat("gold"), Vector3(0, 0.104, back_z + 2.6), Vector3.ZERO, Vector3(1, 0.05, 1))

	_purposeful_details(m, body, h, back_z)


## The vault at work: savings jars filling up on a long shelf, a table where
## coins are being counted, a growth chart — saving made visible.
func _purposeful_details(m: MeshMerger, body: StaticBody3D, h: Vector2, back_z: float) -> void:
	# A row of savings jars on a low plinth along the left wall, fuller and
	# fuller toward the vault door.
	var row := Vector3(-h.x + 1.4, 0, -5.2)
	if is_free(row, 0.6) and _clear_of_flow(row, 1.6):
		m.origin = Transform3D.IDENTITY
		m.part(K.box(Vector3(0.9, 0.5, 3.2)), K.mat("stone"), row + Vector3(0, 0.25, 0))
		m.part(K.box(Vector3(1.0, 0.08, 3.3)), K.mat(trim_color), row + Vector3(0, 0.52, 0))
		for i in 4:
			var jp: Vector3 = row + Vector3(0, 0.56, 1.2 - i * 0.8)
			DecorProps.savings_jar(m, K.xf(jp, Vector3(0, 90, 0)), 0.2 + i * 0.25, ["teal", "coral", "sky", "gold_deep"][i])
			spot("sparkle", jp + Vector3(0, 0.9, 0))
		K.add_box_collider(body, Vector3(0.9, 1.4, 3.2), K.xf(row + Vector3(0, 0.7, 0)))
	# The coin-counting table near the back, with a stool.
	var table := Vector3(-5.0, 0, back_z + 3.4)
	if is_free(table, 0.9) and _clear_of_flow(table, 1.6):
		DecorProps.coin_counting_table(m, K.xf(table, Vector3(0, 15, 0)))
		m.origin = Transform3D.IDENTITY
		m.part(K.cyl(0.25, 0.22, 0.5, 10), K.mat("wood_dark"), table + Vector3(0.2, 0.25, 0.85))
		K.add_box_collider(body, Vector3(1.6, 0.9, 0.9), K.xf(table + Vector3(0, 0.45, 0), Vector3(0, 15, 0)))
		spot("sparkle", table + Vector3(-0.3, 1.2, -0.15))
	# A growth chart on the left wall (beside the bench).
	var board := Vector3(-h.x + 0.75, 0, 7.4)
	if is_free(board, 0.4):
		DecorProps.growth_board(m, K.xf(board, Vector3(0, 90, 0)))
	# Glints on the coin towers' gold tops and the floor medallion.
	for side in [-1.0, 1.0]:
		spot("sparkle", Vector3(side * (h.x - 2.2), 4.4, back_z + 1.9))
	spot("sparkle", Vector3(0, 0.35, back_z + 2.6))
	if life:
		life.glow_reaction = "money"

	# Curiosities (optional): a savings jar near the way in, and — for
	# explorers — the smallest vault in the world, tucked into a corner.
	if not Engine.is_editor_hint():
		var jar := Vector3(-4.6, 0, 5.6)
		if is_free(jar, 0.5) and _clear_of_flow(jar, 1.5):
			CuriosityProp.make(self, "vault_jar", "savings_jar", jar, 20.0, "curio.vault_jar.title", "curio.vault_jar.text", "bounce")
		var tiny := Vector3(h.x - 1.4, 0, 7.6)
		if is_free(tiny, 0.5) and _clear_of_flow(tiny, 1.5):
			CuriosityProp.make(self, "tiny_vault", "tiny_vault", tiny, -90.0, "curio.tiny_vault.title", "curio.tiny_vault.text", "wobble", 1.5, "secret")


## The vault's own activity pieces (GoldenVaultFlow: three hidden coins and
## the savings jar) are created after the dressing, so keep clear of their
## known places explicitly.
func _clear_of_flow(pos: Vector3, radius: float) -> bool:
	for p in [Vector3(-8.4, 0, 2.6), Vector3(8.4, 0, 1.4), Vector3(-7.6, 0, -8.4), Vector3(6.9, 0, -0.6)]:
		if Vector2(pos.x, pos.z).distance_to(Vector2(p.x, p.z)) < radius + 0.8:
			return false
	return true


func _coin_tower(m: MeshMerger, body: StaticBody3D, p: Vector3, coins: int) -> void:
	m.origin = Transform3D.IDENTITY
	m.part(K.cyl(1.1, 1.25, 0.4, 16), K.mat("stone"), p + Vector3(0, 0.2, 0))
	var y: float = 0.4
	for i in coins:
		var wobble := Vector3(0.06 * sin(i * 1.7), 0, 0.06 * cos(i * 2.3))
		m.part(K.cyl(0.8, 0.8, 0.3, 16), K.mat("gold" if i % 2 == 0 else "gold_deep"), p + wobble + Vector3(0, y + 0.15, 0))
		y += 0.31
	m.part(K.sphere(0.3, 12, 6), K.mat("gold", 0.35), p + Vector3(0, y + 0.3, 0))
	K.add_cyl_collider(body, 1.0, y + 0.6, K.xf(p + Vector3(0, (y + 0.6) * 0.5, 0)))
