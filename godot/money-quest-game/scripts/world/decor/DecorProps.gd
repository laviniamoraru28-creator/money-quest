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
