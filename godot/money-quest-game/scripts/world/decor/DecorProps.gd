@tool
class_name DecorProps
extends RefCounted
## DecorProps — the reusable environment pieces (StylizedTree, bush, rock,
## bench, decorative lamp, flower bed, treasure chest, crate...) as small
## builder functions. Each one writes its parts into a MeshMerger at a given
## transform, so a scene can place dozens of them and still bake them into
## a few merged meshes. Prop.gd wraps any of these as a standalone,
## editor-placeable component for zones that want a single prop.
##
## Shapes are deliberately soft and chunky — low-segment spheres, cones and
## rounded proportions — the shared "toy-like" language of the whole world.

const K = preload("res://scripts/world/decor/DecorKit.gd")

const TREE_KINDS: Array[String] = ["round", "pine", "blossom"]


static func tree(m: MeshMerger, x: Transform3D, kind: String = "round", s: float = 1.0, sway_profile: String = "tree") -> void:
	m.origin = x * Transform3D(Basis.from_scale(Vector3.ONE * s), Vector3.ZERO)
	match kind:
		"pine":
			m.part(K.cyl(0.12, 0.17, 1.0, 8), K.mat("wood"), Vector3(0, 0.5, 0))
			m.part(K.cyl(0.0, 1.05, 1.5, 8), K.sway("leaf_dark", sway_profile), Vector3(0, 1.55, 0))
			m.part(K.cyl(0.0, 0.82, 1.25, 8), K.sway("leaf_dark", sway_profile), Vector3(0, 2.35, 0))
			m.part(K.cyl(0.0, 0.58, 1.0, 8), K.sway("leaf", sway_profile), Vector3(0, 3.05, 0))
		"blossom":
			m.part(K.cyl(0.13, 0.19, 1.4, 8), K.mat("wood_dark"), Vector3(0, 0.7, 0))
			m.part(K.sphere(1.0, 10, 5), K.sway("blossom", sway_profile), Vector3(0, 2.05, 0))
			m.part(K.sphere(0.72, 10, 5), K.sway("blossom_white", sway_profile), Vector3(0.55, 1.75, 0.25))
			m.part(K.sphere(0.68, 10, 5), K.sway("blossom", sway_profile), Vector3(-0.5, 1.8, -0.2))
			m.part(K.sphere(0.55, 10, 5), K.sway("blossom_white", sway_profile), Vector3(0.0, 2.75, 0.1))
		_:
			m.part(K.cyl(0.14, 0.2, 1.4, 8), K.mat("wood"), Vector3(0, 0.7, 0))
			m.part(K.sphere(1.1, 10, 5), K.sway("leaf", sway_profile), Vector3(0, 2.1, 0))
			m.part(K.sphere(0.8, 10, 5), K.sway("leaf_light", sway_profile), Vector3(0.6, 1.75, 0.25))
			m.part(K.sphere(0.75, 10, 5), K.sway("leaf", sway_profile), Vector3(-0.55, 1.8, -0.25))
			m.part(K.sphere(0.62, 10, 5), K.sway("leaf_light", sway_profile), Vector3(0.1, 2.85, 0.05))


## A weeping willow — Calm World's signature tree: one soft crown with
## long hanging fronds.
static func willow(m: MeshMerger, x: Transform3D, s: float = 1.0) -> void:
	m.origin = x * Transform3D(Basis.from_scale(Vector3.ONE * s), Vector3.ZERO)
	m.part(K.cyl(0.22, 0.32, 2.2, 8), K.mat("wood_dark"), Vector3(0, 1.1, 0))
	m.part(K.sphere(1.7, 12, 6), K.sway("leaf_soft", "calm"), Vector3(0, 2.9, 0), Vector3.ZERO, Vector3(1.0, 0.62, 1.0))
	m.part(K.sphere(1.1, 10, 5), K.sway("leaf_light", "calm"), Vector3(0.2, 3.4, -0.1), Vector3.ZERO, Vector3(1.0, 0.7, 1.0))
	for i in 12:
		var a: float = TAU * float(i) / 12.0
		var r: float = 1.45 if i % 2 == 0 else 1.2
		var h: float = 1.7 if i % 3 == 0 else 1.35
		m.part(K.cyl(0.07, 0.05, h, 5), K.sway("leaf_soft", "calm"), Vector3(cos(a) * r, 2.75 - h * 0.5, sin(a) * r))


static func bush(m: MeshMerger, x: Transform3D, s: float = 1.0, leaf: String = "leaf") -> void:
	m.origin = x * Transform3D(Basis.from_scale(Vector3.ONE * s), Vector3.ZERO)
	m.part(K.sphere(0.6, 10, 5), K.mat(leaf), Vector3(0, 0.38, 0), Vector3.ZERO, Vector3(1.0, 0.8, 1.0))
	m.part(K.sphere(0.45, 10, 5), K.mat("leaf_light"), Vector3(0.45, 0.3, 0.1), Vector3.ZERO, Vector3(1.0, 0.8, 1.0))
	m.part(K.sphere(0.42, 10, 5), K.mat(leaf), Vector3(-0.42, 0.28, -0.08), Vector3.ZERO, Vector3(1.0, 0.8, 1.0))


static func rock(m: MeshMerger, x: Transform3D, s: float = 1.0, yaw: float = 0.0) -> void:
	m.origin = x * Transform3D(Basis.from_scale(Vector3.ONE * s), Vector3.ZERO)
	m.part(K.sphere(0.6, 6, 3), K.mat("rock"), Vector3(0, 0.15, 0), Vector3(0, yaw, 8), Vector3(1.0, 0.62, 0.8))
	m.part(K.sphere(0.35, 6, 3), K.mat("stone_dark"), Vector3(0.45, 0.08, 0.15), Vector3(0, yaw + 40.0, 0), Vector3(1.0, 0.6, 0.85))


## A park bench; its back faces local -Z, so a child sitting on it looks
## toward local +Z.
static func bench(m: MeshMerger, x: Transform3D) -> void:
	m.origin = x
	m.part(K.box(Vector3(1.8, 0.1, 0.5)), K.mat("wood"), Vector3(0, 0.46, 0))
	m.part(K.box(Vector3(1.8, 0.42, 0.08)), K.mat("wood"), Vector3(0, 0.78, -0.24), Vector3(-10, 0, 0))
	for sx in [-0.75, 0.75]:
		m.part(K.box(Vector3(0.1, 0.46, 0.46)), K.mat("teal_dark"), Vector3(sx, 0.23, 0))
		m.part(K.box(Vector3(0.1, 0.5, 0.08)), K.mat("teal_dark"), Vector3(sx, 0.72, -0.24), Vector3(-10, 0, 0))


## A friendly lantern post. The lantern glows by material, not by a real
## light — many real lights would be costly on the Compatibility renderer.
static func lamp(m: MeshMerger, x: Transform3D, cap_color: String = "gold") -> void:
	m.origin = x
	m.part(K.cyl(0.2, 0.26, 0.3, 8), K.mat("teal_dark"), Vector3(0, 0.15, 0))
	m.part(K.cyl(0.07, 0.09, 2.7, 8), K.mat("teal_dark"), Vector3(0, 1.6, 0))
	m.part(K.sphere(0.27, 10, 5), K.mat("window_warm", 1.4), Vector3(0, 3.1, 0))
	m.part(K.cyl(0.0, 0.32, 0.3, 8), K.mat(cap_color), Vector3(0, 3.45, 0))
	m.part(K.sphere(0.06, 6, 3), K.mat(cap_color), Vector3(0, 3.65, 0))


## A round raised bed of flowers. Colours come from the palette so beds
## near a district can echo its accent.
static func flower_bed(m: MeshMerger, x: Transform3D, rng: RandomNumberGenerator, radius: float = 1.4, colors: Array = ["coral", "gold", "blossom", "lilac", "cream"]) -> void:
	m.origin = x
	m.part(K.cyl(radius + 0.15, radius + 0.2, 0.3, 16), K.mat("stone"), Vector3(0, 0.15, 0))
	m.part(K.cyl(radius, radius, 0.06, 16), K.mat("soil"), Vector3(0, 0.3, 0))
	var count: int = int(radius * radius * 9.0)
	for i in count:
		var a: float = rng.randf() * TAU
		var r: float = sqrt(rng.randf()) * (radius - 0.15)
		var p := Vector3(cos(a) * r, 0.3, sin(a) * r)
		var h: float = rng.randf_range(0.25, 0.5)
		m.part(K.cyl(0.02, 0.025, h, 4), K.sway("leaf_dark", "flower"), p + Vector3(0, h * 0.5, 0))
		m.part(K.sphere(0.11, 6, 3), K.sway(colors[rng.randi() % colors.size()], "flower"), p + Vector3(0, h + 0.04, 0))
	m.part(K.sphere(0.4, 8, 4), K.mat("leaf_light"), Vector3(0, 0.45, 0), Vector3.ZERO, Vector3(1, 0.7, 1))


## An educational "treasure chest" — closed, tidy, a symbol of saving
## rather than of prizes.
static func chest(m: MeshMerger, x: Transform3D) -> void:
	m.origin = x
	m.part(K.box(Vector3(1.0, 0.55, 0.65)), K.mat("wood"), Vector3(0, 0.28, 0))
	m.part(K.cyl(0.33, 0.33, 1.0, 10), K.mat("wood_dark"), Vector3(0, 0.56, 0), Vector3(0, 0, 90), Vector3(1, 1, 0.98))
	for sx in [-0.32, 0.32]:
		m.part(K.box(Vector3(0.1, 0.62, 0.7)), K.mat("gold"), Vector3(sx, 0.3, 0))
	m.part(K.box(Vector3(0.18, 0.2, 0.06)), K.mat("gold"), Vector3(0, 0.5, 0.34))


## A small round tree in a pot with a trim-coloured rim — indoor greenery.
static func potted_plant(m: MeshMerger, x: Transform3D, pot_color: String = "coral", rim_color: String = "gold") -> void:
	m.origin = x
	m.part(K.cyl(0.42, 0.32, 0.6, 12), K.mat(pot_color), Vector3(0, 0.3, 0))
	m.part(K.torus(0.36, 0.46, 16, 4), K.mat(rim_color), Vector3(0, 0.6, 0), Vector3.ZERO, Vector3(1, 0.5, 1))
	tree(m, x * K.xf(Vector3(0, 0.45, 0)), "round", 0.55)


## A hanging banner on a rod, for a wall: `x` is on the wall face at floor
## level, local +Z pointing into the room. The cloth ripples (cloth group);
## the coin emblem is static and stands just clear of the ripple.
static func wall_banner(m: MeshMerger, x: Transform3D, cloth_color: String = "teal", emblem_color: String = "gold") -> void:
	m.origin = x
	m.part(K.cyl(0.05, 0.05, 1.3, 6), K.mat("wood_dark"), Vector3(0, 4.6, 0.05), Vector3(0, 0, 90))
	m.part(K.box(Vector3(0.9, 2.2, 0.05)), K.cloth(cloth_color), Vector3(0, 3.45, 0.08))
	m.part(K.prism(Vector3(0.9, 0.4, 0.05)), K.cloth(cloth_color), Vector3(0, 2.15, 0.08), Vector3(0, 0, 180))
	m.part(K.cyl(0.24, 0.24, 0.04, 16), K.mat(emblem_color), Vector3(0, 3.7, 0.2), Vector3(90, 0, 0))
	m.part(K.cyl(0.15, 0.15, 0.05, 16), K.mat("gold_deep"), Vector3(0, 3.7, 0.21), Vector3(90, 0, 0))


static func crate(m: MeshMerger, x: Transform3D, fruit: String = "coral") -> void:
	m.origin = x
	m.part(K.box(Vector3(0.7, 0.4, 0.5)), K.mat("wood"), Vector3(0, 0.2, 0))
	for i in 4:
		m.part(K.sphere(0.12, 8, 4), K.mat(fruit), Vector3(-0.2 + 0.13 * i, 0.44, 0.06 * (i % 2)))


## A gentle low-poly cloud (several merged white puffs).
static func cloud(m: MeshMerger, x: Transform3D, rng: RandomNumberGenerator) -> void:
	m.origin = x
	var puffs: int = rng.randi_range(4, 6)
	for i in puffs:
		var r: float = rng.randf_range(2.0, 3.6)
		m.part(K.sphere(r, 10, 5), K.mat("cloud"), Vector3(i * 2.6 - puffs * 1.3, rng.randf_range(-0.4, 0.8), rng.randf_range(-1.2, 1.2)), Vector3.ZERO, Vector3(1.0, 0.62, 1.0))


# --- purposeful details (character & world upgrade) ---------------------------
# Small props that say what a place is FOR without words: a savings jar, a
# coin-counting table, a market stall, baskets waiting to be filled, scales
# for comparing, an idea board, a tree in a planter.


## A glass savings jar with coins inside and a slot lid. `fill` 0..1.
static func savings_jar(m: MeshMerger, x: Transform3D, fill: float = 0.5, label_color: String = "teal") -> void:
	m.origin = x
	m.part(K.cyl(0.28, 0.28, 0.08, 14), K.mat("stone_dark"), Vector3(0, 0.04, 0))
	m.part(K.cyl(0.25, 0.27, 0.62, 16), K.mat("sky_light"), Vector3(0, 0.39, 0))
	var coins: int = int(round(fill * 7.0))
	for i in coins:
		m.part(K.cyl(0.19, 0.19, 0.07, 12), K.mat("gold" if i % 2 == 0 else "gold_deep"), Vector3(0.02 * sin(i), 0.12 + i * 0.07, 0.02 * cos(i * 1.3)))
	m.part(K.cyl(0.22, 0.22, 0.08, 14), K.mat(label_color), Vector3(0, 0.74, 0))
	m.part(K.box(Vector3(0.16, 0.02, 0.04)), K.mat("ink"), Vector3(0, 0.785, 0))
	m.part(K.box(Vector3(0.3, 0.16, 0.02)), K.mat("parchment"), Vector3(0, 0.42, 0.26))


## A low table where coins are being counted: neat stacks, a tray and a
## little abacus — counting and sorting, never gambling.
static func coin_counting_table(m: MeshMerger, x: Transform3D) -> void:
	m.origin = x
	m.part(K.box(Vector3(1.6, 0.08, 0.9)), K.mat("wood"), Vector3(0, 0.78, 0))
	for sx in [-0.7, 0.7]:
		for sz in [-0.35, 0.35]:
			m.part(K.cyl(0.05, 0.05, 0.76, 6), K.mat("wood_dark"), Vector3(sx, 0.38, sz))
	for i in 4:
		var n: int = [2, 4, 6, 3][i]
		for j in n:
			m.part(K.cyl(0.09, 0.09, 0.035, 12), K.mat("gold" if j % 2 == 0 else "gold_deep"), Vector3(-0.55 + i * 0.22, 0.84 + j * 0.036, -0.15))
	m.part(K.box(Vector3(0.5, 0.04, 0.32)), K.mat("teal_dark"), Vector3(0.45, 0.84, 0.12))
	# Abacus: frame and beads
	m.part(K.box(Vector3(0.44, 0.3, 0.03)), K.mat("wood_dark"), Vector3(-0.2, 0.98, 0.25), Vector3(-15, 0, 0))
	for r in 3:
		for b in 4:
			m.part(K.sphere(0.03, 6, 3), K.mat(["coral", "gold", "teal"][r]), Vector3(-0.34 + b * 0.05 + (0.12 if r == 1 else 0.0), 0.9 + r * 0.08, 0.27), Vector3.ZERO, Vector3(1, 0.8, 0.8))


## A "growth chart" board: bars that rise left to right, topped by a sprout.
static func growth_board(m: MeshMerger, x: Transform3D) -> void:
	m.origin = x
	m.part(K.box(Vector3(1.6, 1.2, 0.08)), K.mat("parchment"), Vector3(0, 1.6, 0))
	m.part(K.box(Vector3(1.7, 0.08, 0.12)), K.mat("wood_dark"), Vector3(0, 2.22, 0))
	m.part(K.box(Vector3(1.7, 0.08, 0.12)), K.mat("wood_dark"), Vector3(0, 0.98, 0))
	for sx in [-0.78, 0.78]:
		m.part(K.box(Vector3(0.08, 2.2, 0.1)), K.mat("wood_dark"), Vector3(sx, 1.1, -0.02))
	for i in 4:
		var hh: float = 0.18 + i * 0.2
		m.part(K.box(Vector3(0.22, hh, 0.04)), K.mat(["teal_light", "teal", "gold_deep", "gold"][i]), Vector3(-0.5 + i * 0.33, 1.1 + hh * 0.5, 0.05))
	m.part(K.sphere(0.1, 8, 4), K.mat("leaf_light"), Vector3(0.5, 2.0, 0.07), Vector3(0, 0, 30), Vector3(1, 0.5, 0.5))
	m.part(K.sphere(0.1, 8, 4), K.mat("leaf_light"), Vector3(0.62, 2.03, 0.07), Vector3(0, 0, -30), Vector3(1, 0.5, 0.5))


## A market stall: a counter with produce, a striped awning on poles and
## a little hanging sign with a picture (not words).
static func market_stall(m: MeshMerger, x: Transform3D, awning: String = "ember", goods: Array = ["coral", "gold", "leaf_light"], sign_color: String = "gold") -> void:
	m.origin = x
	m.part(K.box(Vector3(2.2, 0.9, 0.9)), K.mat("wood"), Vector3(0, 0.45, 0))
	m.part(K.box(Vector3(2.3, 0.08, 1.0)), K.mat("wood_dark"), Vector3(0, 0.94, 0))
	m.part(K.box(Vector3(2.0, 0.5, 0.04)), K.mat("parchment"), Vector3(0, 0.5, 0.46))
	# Produce in three trays
	for t in 3:
		var tx: float = -0.7 + t * 0.7
		m.part(K.box(Vector3(0.6, 0.1, 0.6)), K.mat("wood_dark"), Vector3(tx, 1.03, 0))
		if goods.is_empty():
			continue   # an empty counter: a shop places its own products
		for k in 5:
			m.part(K.sphere(0.1, 8, 4), K.mat(goods[t % goods.size()]), Vector3(tx - 0.18 + (k % 3) * 0.18, 1.13 + (0.08 if k > 2 else 0.0), -0.1 + (k / 3) * 0.2))
	# Poles and a striped awning
	for sx in [-1.05, 1.05]:
		for sz in [-0.45, 0.45]:
			m.part(K.cyl(0.05, 0.05, 2.4, 6), K.mat("cream"), Vector3(sx, 1.2, sz))
	for s in 7:
		var ax: float = -1.15 + (s + 0.5) * (2.3 / 7.0)
		m.part(K.box(Vector3(2.3 / 7.0, 0.05, 1.3)), K.cloth(awning if s % 2 == 0 else "cream"), Vector3(ax, 2.45, 0.05), Vector3(-12, 0, 0))
		m.part(K.prism(Vector3(2.3 / 7.0, 0.2, 0.04)), K.cloth(awning if s % 2 == 0 else "cream"), Vector3(ax, 2.22, 0.72), Vector3(180, 0, 0))
	# A hanging round sign with a picture of what is sold
	if goods.is_empty():
		return
	m.part(K.cyl(0.26, 0.26, 0.05, 16), K.mat(sign_color), Vector3(1.05, 1.9, 0.62), Vector3(90, 0, 0))
	m.part(K.sphere(0.12, 8, 4), K.mat(goods[0]), Vector3(1.05, 1.88, 0.67), Vector3.ZERO, Vector3(1, 1, 0.3))
	m.part(K.sphere(0.05, 6, 3), K.mat("leaf"), Vector3(1.1, 2.0, 0.68), Vector3.ZERO, Vector3(1, 0.5, 0.3))


## A woven shopping basket, empty or with a few things in it.
static func basket(m: MeshMerger, x: Transform3D, items: Array = []) -> void:
	m.origin = x
	m.part(K.cyl(0.26, 0.2, 0.3, 12), K.mat("path_wood"), Vector3(0, 0.15, 0))
	m.part(K.torus(0.24, 0.28, 16, 4), K.mat("wood"), Vector3(0, 0.3, 0))
	m.part(K.torus(0.2, 0.235, 16, 4), K.mat("wood"), Vector3(0, 0.3, 0), Vector3(90, 0, 0), Vector3(1.0, 1.4, 1.0))
	for i in items.size():
		m.part(K.sphere(0.08, 8, 4), K.mat(items[i]), Vector3(-0.08 + 0.08 * i, 0.3, 0.04 * (i % 2)))


## Crates stacked, waiting to be unpacked onto the shelves.
static func crate_stack(m: MeshMerger, x: Transform3D, fruit: Array = ["coral", "gold"]) -> void:
	crate(m, x, fruit[0])
	m.origin = x
	m.part(K.box(Vector3(0.7, 0.4, 0.5)), K.mat("wood_dark"), Vector3(0.75, 0.2, 0.05))
	m.part(K.box(Vector3(0.66, 0.36, 0.46)), K.mat("wood"), Vector3(0.4, 0.6, 0.0), Vector3(0, 12, 0))
	for i in 3:
		m.part(K.box(Vector3(0.72, 0.04, 0.06)), K.mat("wood_dark"), Vector3(0.75, 0.1 + i * 0.12, 0.28))


## Balance scales on a little stand — for comparing (prices, choices).
static func scales(m: MeshMerger, x: Transform3D) -> void:
	m.origin = x
	m.part(K.cyl(0.35, 0.4, 0.75, 12), K.mat("wood_dark"), Vector3(0, 0.375, 0))
	m.part(K.cyl(0.12, 0.16, 0.08, 10), K.mat("gold_deep"), Vector3(0, 0.79, 0))
	m.part(K.cyl(0.03, 0.03, 0.6, 6), K.mat("gold_deep"), Vector3(0, 1.1, 0))
	m.part(K.box(Vector3(0.9, 0.04, 0.04)), K.mat("gold"), Vector3(0, 1.4, 0), Vector3(0, 0, -6))
	for sx in [-0.42, 0.42]:
		var y: float = 1.12 + (0.05 if sx < 0 else -0.05)
		m.part(K.cyl(0.005, 0.005, 0.28, 4), K.mat("ink"), Vector3(sx, y + 0.14, 0))
		m.part(K.cyl(0.17, 0.12, 0.05, 12), K.mat("gold"), Vector3(sx, y, 0))
	m.part(K.sphere(0.07, 8, 4), K.mat("coral"), Vector3(-0.42, 1.21, 0))
	m.part(K.cyl(0.05, 0.05, 0.03, 10), K.mat("gold_deep"), Vector3(0.42, 1.1, 0))


## A board on legs with simple picture cards pinned to it (price tags,
## ideas, a plan) — shapes, not text.
static func picture_board(m: MeshMerger, x: Transform3D, frame: String = "wood_dark", cards: Array = ["coral", "gold", "teal", "sky"]) -> void:
	m.origin = x
	m.part(K.box(Vector3(1.5, 1.1, 0.07)), K.mat("parchment"), Vector3(0, 1.55, 0))
	m.part(K.box(Vector3(1.6, 0.08, 0.1)), K.mat(frame), Vector3(0, 2.13, 0))
	for sx in [-0.72, 0.72]:
		m.part(K.box(Vector3(0.08, 2.1, 0.09)), K.mat(frame), Vector3(sx, 1.05, -0.02))
	for i in cards.size():
		var cx: float = -0.42 + (i / 2) * 0.84
		var cy: float = 1.78 - (i % 2) * 0.46
		m.part(K.box(Vector3(0.36, 0.32, 0.02)), K.mat("cream"), Vector3(cx, cy, 0.05), Vector3(0, 0, -4 + i * 3))
		m.part(K.sphere(0.08, 8, 4), K.mat(cards[i]), Vector3(cx, cy + 0.02, 0.065), Vector3.ZERO, Vector3(1, 1, 0.3))
		m.part(K.sphere(0.02, 6, 3), K.mat("ember"), Vector3(cx, cy + 0.15, 0.07))


## A tree in a square wooden planter (town squares).
static func planter_tree(m: MeshMerger, x: Transform3D) -> void:
	m.origin = x
	m.part(K.box(Vector3(1.1, 0.6, 1.1)), K.mat("wood"), Vector3(0, 0.3, 0))
	m.part(K.box(Vector3(1.2, 0.08, 1.2)), K.mat("wood_dark"), Vector3(0, 0.62, 0))
	m.part(K.box(Vector3(1.0, 0.04, 1.0)), K.mat("soil"), Vector3(0, 0.62, 0))
	tree(m, x * K.xf(Vector3(0, 0.6, 0)), "round", 0.7)


# --- district kits (Library, Museum, Idea Lab...) ---------------------------------


## A soft reading armchair with a cushion and a book left open on the seat.
static func reading_chair(m: MeshMerger, x: Transform3D, fabric: String = "book_red") -> void:
	m.origin = x
	m.part(K.box(Vector3(1.1, 0.45, 0.9)), K.mat(fabric), Vector3(0, 0.3, 0))
	m.part(K.box(Vector3(1.1, 0.9, 0.25)), K.mat(fabric), Vector3(0, 0.75, -0.35), Vector3(-8, 0, 0))
	for sx in [-0.5, 0.5]:
		m.part(K.box(Vector3(0.2, 0.55, 0.85)), K.mat(fabric), Vector3(sx, 0.55, 0))
		m.part(K.cyl(0.04, 0.04, 0.1, 6), K.mat("wood_dark"), Vector3(sx * 0.9, 0.05, 0.35))
		m.part(K.cyl(0.04, 0.04, 0.1, 6), K.mat("wood_dark"), Vector3(sx * 0.9, 0.05, -0.35))
	m.part(K.box(Vector3(0.75, 0.12, 0.6)), K.mat("parchment"), Vector3(0, 0.58, 0.05))
	# The open book: two tilted pages on a cover
	m.part(K.box(Vector3(0.44, 0.02, 0.3)), K.mat("teal_dark"), Vector3(0.05, 0.66, 0.12), Vector3(0, 20, 0))
	for side in [-1.0, 1.0]:
		m.part(K.box(Vector3(0.2, 0.02, 0.28)), K.mat("cream"), Vector3(0.05 + side * 0.1, 0.69, 0.12), Vector3(0, 20, side * -8.0))


## A little wheeled cart of books waiting to go back on the shelves.
static func book_cart(m: MeshMerger, x: Transform3D) -> void:
	m.origin = x
	m.part(K.box(Vector3(1.0, 0.06, 0.5)), K.mat("wood"), Vector3(0, 0.35, 0))
	m.part(K.box(Vector3(1.0, 0.06, 0.5)), K.mat("wood"), Vector3(0, 0.85, 0))
	for sx in [-0.47, 0.47]:
		m.part(K.box(Vector3(0.05, 0.9, 0.5)), K.mat("wood_dark"), Vector3(sx, 0.6, 0))
		for sz in [-0.2, 0.2]:
			m.part(K.cyl(0.07, 0.07, 0.04, 10), K.mat("ink"), Vector3(sx, 0.08, sz), Vector3(0, 0, 90))
	var colours: Array = ["book_red", "teal", "gold", "sky", "leaf", "lilac", "coral"]
	for shelf in 2:
		for i in 7:
			var hgt: float = 0.24 + 0.06 * ((i * 3 + shelf) % 3)
			m.part(K.box(Vector3(0.1, hgt, 0.32)), K.mat(colours[(i + shelf * 2) % colours.size()]), Vector3(-0.38 + i * 0.12, 0.38 + shelf * 0.5 + hgt * 0.5, 0), Vector3(0, 0, -6.0 if i == 6 else 0.0))


## A reading stand holding a big open book.
static func lectern_book(m: MeshMerger, x: Transform3D) -> void:
	m.origin = x
	m.part(K.cyl(0.3, 0.38, 0.1, 10), K.mat("wood_dark"), Vector3(0, 0.05, 0))
	m.part(K.cyl(0.08, 0.1, 1.0, 8), K.mat("wood"), Vector3(0, 0.55, 0))
	m.part(K.box(Vector3(0.7, 0.06, 0.5)), K.mat("wood_dark"), Vector3(0, 1.1, 0), Vector3(-25, 0, 0))
	for side in [-1.0, 1.0]:
		m.part(K.box(Vector3(0.3, 0.03, 0.42)), K.mat("cream"), Vector3(side * 0.16, 1.15, 0.0), Vector3(-25, 0, side * -6.0))


## A glass display case on a plinth with an object inside ("coin", "shell",
## "note", "vase"): objects waiting to be discovered.
static func display_case(m: MeshMerger, x: Transform3D, object: String = "coin", trim: String = "gold") -> void:
	m.origin = x
	m.part(K.box(Vector3(0.9, 0.95, 0.9)), K.mat("stone"), Vector3(0, 0.475, 0))
	m.part(K.box(Vector3(1.0, 0.08, 1.0)), K.mat(trim), Vector3(0, 0.96, 0))
	m.part(K.box(Vector3(0.82, 0.62, 0.82)), K.veil_mat("sky_light"), Vector3(0, 1.31, 0))
	m.part(K.box(Vector3(0.86, 0.05, 0.86)), K.mat(trim), Vector3(0, 1.64, 0))
	match object:
		"shell":
			m.part(K.sphere(0.14, 10, 5), K.mat("blossom_white"), Vector3(0, 1.1, 0), Vector3(0, 0, 30), Vector3(1.3, 0.7, 1.0))
		"note":
			m.part(K.box(Vector3(0.42, 0.02, 0.22)), K.mat("leaf_light"), Vector3(0, 1.08, 0), Vector3(0, 15, 0))
			m.part(K.cyl(0.06, 0.06, 0.022, 12), K.mat("parchment"), Vector3(0.1, 1.09, 0.01), Vector3(0, 15, 0))
		"vase":
			m.part(K.cyl(0.08, 0.12, 0.32, 12), K.mat("path_terracotta"), Vector3(0, 1.17, 0))
			m.part(K.sphere(0.13, 10, 5), K.mat("path_terracotta"), Vector3(0, 1.1, 0))
		_:
			m.part(K.cyl(0.16, 0.16, 0.04, 18), K.mat("gold"), Vector3(0, 1.17, 0), Vector3(70, 0, 0))
			m.part(K.cyl(0.11, 0.11, 0.05, 18), K.mat("gold_deep"), Vector3(0, 1.17, 0.01), Vector3(70, 0, 0))
	# A little label plate (a shape, not text)
	m.part(K.box(Vector3(0.4, 0.14, 0.03)), K.mat("parchment"), Vector3(0, 0.8, 0.46))


## A workbench with a prototype in progress: gears, a little cart and a
## light bulb on a stand, tools hanging on a board — "someone is making
## something here".
static func workbench(m: MeshMerger, x: Transform3D, accent: String = "ember") -> void:
	m.origin = x
	m.part(K.box(Vector3(1.8, 0.1, 0.8)), K.mat("wood"), Vector3(0, 0.85, 0))
	for sx in [-0.8, 0.8]:
		m.part(K.box(Vector3(0.1, 0.85, 0.7)), K.mat("wood_dark"), Vector3(sx, 0.42, 0))
	m.part(K.box(Vector3(1.6, 0.05, 0.6)), K.mat("wood_dark"), Vector3(0, 0.3, 0))
	# A gear prototype, a tiny cart and a bulb on a stand
	m.part(K.torus(0.11, 0.18, 12, 4), K.mat("stone_dark"), Vector3(-0.5, 1.08, 0.05), Vector3(90, 0, 0))
	for i in 6:
		var a: float = TAU * i / 6.0
		m.part(K.box(Vector3(0.06, 0.06, 0.05)), K.mat("stone_dark"), Vector3(-0.5 + cos(a) * 0.2, 1.08 + sin(a) * 0.2, 0.05))
	m.part(K.box(Vector3(0.4, 0.12, 0.25)), K.mat(accent), Vector3(0.1, 0.97, 0.05))
	for sx in [-0.12, 0.12]:
		m.part(K.cyl(0.05, 0.05, 0.27, 10), K.mat("ink"), Vector3(0.1 + sx, 0.92, 0.05), Vector3(90, 0, 0))
	m.part(K.cyl(0.02, 0.02, 0.3, 6), K.mat("stone_dark"), Vector3(0.62, 1.05, -0.1))
	m.part(K.sphere(0.1, 10, 5), K.mat("bulb", 0.6), Vector3(0.62, 1.26, -0.1))
	# Pencil and sketch paper
	m.part(K.box(Vector3(0.36, 0.01, 0.26)), K.mat("cream"), Vector3(0.3, 0.905, 0.22), Vector3(0, -12, 0))
	m.part(K.cyl(0.012, 0.012, 0.2, 6), K.mat("gold"), Vector3(0.38, 0.92, 0.2), Vector3(0, 30, 90))
	# Tool board behind
	m.part(K.box(Vector3(1.6, 0.8, 0.05)), K.mat("parchment"), Vector3(0, 1.6, -0.38))
	for i in 4:
		m.part(K.box(Vector3(0.05, 0.3, 0.03)), K.mat(["stone_dark", accent, "teal", "wood_dark"][i]), Vector3(-0.5 + i * 0.33, 1.6, -0.34), Vector3(0, 0, 15.0 * (i % 2)))
