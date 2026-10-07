class_name CharacterBuilder
extends RefCounted
## CharacterBuilder — turns a CharacterLook into Money Quest World's
## stylised human character. One builder for every character: the player's
## avatar, every NPC and the avatar-screen preview all come from here, so
## an improvement to a hand or a shoe reaches all of them.
##
## The look (2nd pass, "real game" upgrade):
## - Head: a rounded cranium over a softer, narrower jaw and chin; ears with
##   an inner fold; big friendly eyes (white, iris, pupil, two highlights,
##   an upper lash line); arched two-part brows; a small nose; a curved
##   smile; soft cheeks. Clearly stylised — never a mannequin, never
##   realistic.
## - Body: a neck, rounded shoulders, a chest that is wider than the waist,
##   child proportions (slightly larger head, compact torso, short legs).
## - Hands: a palm, a curled block of fingers and a thumb — reads as a hand
##   at any distance, still cheap.
## - Feet: shoes with a rounded sole, a lighter toe cap and laces.
## - Clothing shape (CharacterPalette.OUTFIT_STYLES): tee (short sleeves),
##   hoodie (hood, pocket, cuffs), jacket (open front, lapels), dress
##   (flared skirt over leggings) or overalls (bib and straps).
## - Hair: twelve styles with real volume, so silhouettes differ from far
##   away. Accessories (glasses, cap, hearing aid, cane, wheelchair) and
##   cosmetics (scarf, backpack, headband, star pin) are independent.
##
## Two output modes, same look:
## - animated (the player / preview): separate pivots for head, arms, hips
##   and knees so CharacterRig can walk, look around and react;
## - static (NPCs): four cached meshes (body+legs, head, right arm, left
##   arm) in a resting pose, shared by identical looks — many NPCs stay
##   cheap, but they can still turn their head and use both hands.
## Plain colours are baked as vertex colours (CharacterPalette.mat), so a
## whole character's matte parts render as one surface.
##
## Coordinates: feet on y = 0, facing +Z (the direction Player.gd turns
## the body toward), character's right hand on -X.

const HEAD_R: float = 0.25
## The head (with its hair and accessories) is built at HEAD_R and scaled by
## this: a slightly larger head than an adult's reads as a child character,
## while staying a person rather than a doll.
const HEAD_SCALE: float = 0.9
const EYE_X: float = 0.09
const EYE_Y: float = 0.012
const EYE_Z: float = 0.203
const INK := Color("1C2624")
const WHITE := Color("FFFFFF")
const CREAM := Color("F4EEDF")
const LONG_SLEEVES: Array[String] = ["hoodie", "jacket"]

static var _npc_mesh_cache: Dictionary = {}


static func build(look: CharacterLook, animated: bool) -> CharacterRig:
	var rig := CharacterRig.new()
	rig.name = "VisualRoot"
	rig.seated = look.seated
	var d := _dims(look)
	var body := Node3D.new()
	body.name = "Body"
	rig.add_child(body)
	rig.body = body
	if look.seated:
		body.position.y = 0.56 - d.hip_y
		rig.add_child(_wheelchair(rig))
	rig.body_base_y = body.position.y

	var neck := Vector3(0, _neck_y(d), 0)
	if not animated:
		# NPC: four cached meshes so CharacterRig can turn the head and use
		# both hands. Identical looks share the same meshes.
		var key: String = look.key()
		if not _npc_mesh_cache.has(key):
			var bm := MeshMerger.new()
			_torso(bm, look, d, Transform3D.IDENTITY)
			for side in [-1.0, 1.0]:
				_leg(bm, look, d, _hip_xf(d, side), look.seated)
			var hm := MeshMerger.new()
			_head_group(hm, look, _head_local(d))
			var arm_r := MeshMerger.new()
			_arm(arm_r, look, d, Transform3D.IDENTITY, -1.0)
			var arm_l := MeshMerger.new()
			_arm(arm_l, look, d, Transform3D.IDENTITY, 1.0)
			_npc_mesh_cache[key] = [bm.commit(), hm.commit(), arm_r.commit(), arm_l.commit()]
		var meshes: Array = _npc_mesh_cache[key]
		var mi := MeshInstance3D.new()
		mi.name = "Mesh"
		mi.mesh = meshes[0]
		body.add_child(mi)
		var head := MeshInstance3D.new()
		head.name = "Head"
		head.mesh = meshes[1]
		head.position = neck
		body.add_child(head)
		rig.head = head
		_add_face_parts(rig, look, head, _head_local(d))
		for side in [-1.0, 1.0]:
			var arm := MeshInstance3D.new()
			arm.name = "ArmR" if side < 0.0 else "ArmL"
			arm.mesh = meshes[2] if side < 0.0 else meshes[3]
			arm.transform = _arm_rest(d, side, look.seated)
			body.add_child(arm)
			if side < 0.0:
				rig.arm_r = arm
			else:
				rig.arm_l = arm
		rig.apply_rest_pose()
		return rig

	var torso := MeshMerger.new()
	_torso(torso, look, d, Transform3D.IDENTITY)
	torso.commit_to(body, "Torso")
	# The head on its own pivot (top of the neck) so the player's character
	# can look at things and react.
	var head_pivot := Node3D.new()
	head_pivot.name = "Head"
	head_pivot.position = neck
	body.add_child(head_pivot)
	var hm2 := MeshMerger.new()
	_head_group(hm2, look, _head_local(d))
	hm2.commit_to(head_pivot, "Mesh")
	rig.head = head_pivot
	_add_face_parts(rig, look, head_pivot, _head_local(d))
	for side in [-1.0, 1.0]:
		var arm_pivot := Node3D.new()
		arm_pivot.name = "ArmR" if side < 0.0 else "ArmL"
		arm_pivot.transform = _arm_rest(d, side, look.seated)
		var am := MeshMerger.new()
		_arm(am, look, d, Transform3D.IDENTITY, side)
		am.commit_to(arm_pivot, "Mesh")
		body.add_child(arm_pivot)

		var hip := Node3D.new()
		hip.name = "HipR" if side < 0.0 else "HipL"
		hip.transform = _hip_xf(d, side)
		var thigh := MeshMerger.new()
		_thigh(thigh, look, d)
		thigh.commit_to(hip, "Thigh")
		var knee := Node3D.new()
		knee.name = "Knee"
		knee.position = Vector3(0, -d.thigh, 0)
		var shin := MeshMerger.new()
		_shin(shin, look, d)
		shin.commit_to(knee, "Shin")
		hip.add_child(knee)
		body.add_child(hip)
		if side < 0.0:
			rig.arm_r = arm_pivot
			rig.hip_r = hip
			rig.knee_r = knee
		else:
			rig.arm_l = arm_pivot
			rig.hip_l = hip
			rig.knee_l = knee
	rig.apply_rest_pose()
	return rig


# --- proportions -----------------------------------------------------------

class Dims:
	var h: float
	var w: float
	var hip_y: float
	var shoulder_y: float
	var head_y: float
	var thigh: float
	var shin: float
	var torso_r: float


static func _dims(look: CharacterLook) -> Dims:
	var d := Dims.new()
	d.h = look.height
	d.w = look.width
	d.hip_y = 0.70 * d.h
	d.thigh = 0.34 * d.h
	d.shin = 0.31 * d.h
	d.shoulder_y = d.hip_y + 0.48 * d.h
	d.head_y = d.shoulder_y + 0.31
	d.torso_r = 0.2 * d.w
	return d


static func _hip_xf(d: Dims, side: float) -> Transform3D:
	return Transform3D(Basis.IDENTITY, Vector3(side * 0.105 * d.w, d.hip_y, 0))


static func _arm_rest(d: Dims, side: float, seated: bool) -> Transform3D:
	var rot := Vector3(-0.35 if seated else 0.0, 0, side * deg_to_rad(7.0))
	return Transform3D(Basis.from_euler(rot), Vector3(side * (d.torso_r + 0.075), d.shoulder_y - 0.03, 0))


## Where the head pivots (top of the neck).
static func _neck_y(d: Dims) -> float:
	return d.shoulder_y + 0.14


## The head group's transform relative to the head pivot.
static func _head_local(d: Dims) -> Transform3D:
	return Transform3D(Basis.from_scale(Vector3.ONE * HEAD_SCALE), Vector3(0, d.head_y - _neck_y(d), 0))


# --- helpers ------------------------------------------------------------------

static func _p(m: MeshMerger, base: Transform3D, mesh: Mesh, c: Color, pos: Vector3, rot_deg: Vector3 = Vector3.ZERO, scl: Vector3 = Vector3.ONE, glow: float = 0.0) -> void:
	m.add(mesh, base * DecorKit.xf(pos, rot_deg, scl), CharacterPalette.mat(c, glow))


static func _capsule(radius: float, height: float, radial: int = 12) -> CapsuleMesh:
	var key: String = "cap|%s|%s|%d" % [radius, height, radial]
	if not DecorKit._meshes.has(key):
		var c := CapsuleMesh.new()
		c.radius = radius
		c.height = maxf(height, radius * 2.0)
		c.radial_segments = radial
		c.rings = 4
		DecorKit._meshes[key] = c
	return DecorKit._meshes[key]


static func _long_sleeves(look: CharacterLook) -> bool:
	return LONG_SLEEVES.has(look.outfit_style) or look.extras.has("cardigan")


# --- face ----------------------------------------------------------------------

## Closed eyelids (shown for a blink) and an open mouth (shown while
## talking or smiling): two tiny separate meshes, hidden at rest, so
## CharacterRig can blink and talk by toggling them — no per-frame mesh work.
static func _add_face_parts(rig: CharacterRig, look: CharacterLook, parent: Node3D, hx: Transform3D) -> void:
	var key: String = "face2|" + look.skin.to_html(false)
	if not _npc_mesh_cache.has(key):
		var lm := MeshMerger.new()
		for side in [-1.0, 1.0]:
			_p(lm, Transform3D.IDENTITY, DecorKit.sphere(0.057, 12, 6), look.skin.darkened(0.04), Vector3(side * EYE_X, EYE_Y, EYE_Z + 0.004), Vector3.ZERO, Vector3(0.95, 1.18, 0.74))
			_p(lm, Transform3D.IDENTITY, DecorKit.box(Vector3(0.08, 0.01, 0.01)), INK, Vector3(side * EYE_X, EYE_Y - 0.008, 0.247))
		var mm := MeshMerger.new()
		_p(mm, Transform3D.IDENTITY, DecorKit.sphere(0.034, 12, 6), Color("6E2A2A"), Vector3.ZERO, Vector3.ZERO, Vector3(1.4, 1.0, 0.4))
		_p(mm, Transform3D.IDENTITY, DecorKit.box(Vector3(0.05, 0.012, 0.01)), WHITE, Vector3(0, 0.022, 0.008))
		_npc_mesh_cache[key] = [lm.commit(), mm.commit()]
	var meshes: Array = _npc_mesh_cache[key]
	var lids := MeshInstance3D.new()
	lids.name = "Eyelids"
	lids.mesh = meshes[0]
	lids.transform = hx
	lids.visible = false
	lids.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	parent.add_child(lids)
	rig.eyelids = lids
	var mouth := MeshInstance3D.new()
	mouth.name = "Mouth"
	mouth.mesh = meshes[1]
	mouth.transform = hx * Transform3D(Basis.IDENTITY, Vector3(0, -0.083, 0.229))
	mouth.visible = false
	mouth.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	parent.add_child(mouth)
	rig.mouth = mouth


static func _head_group(m: MeshMerger, look: CharacterLook, hb: Transform3D) -> void:
	_head(m, look, hb)
	_hair(m, look, hb)
	_head_accessories(m, look, hb)


static func _head(m: MeshMerger, look: CharacterLook, hb: Transform3D) -> void:
	var r := HEAD_R
	var skin: Color = look.skin
	# A rounded head, very slightly taller than wide, with a soft little chin.
	_p(m, hb, DecorKit.sphere(r, 24, 12), skin, Vector3.ZERO, Vector3.ZERO, Vector3(1.0, 1.0, 0.96))
	_p(m, hb, DecorKit.sphere(0.1, 12, 6), skin, Vector3(0, -0.16, 0.1), Vector3.ZERO, Vector3(1.25, 0.72, 0.95))
	var brow_c: Color = look.hair.darkened(0.2) if look.hair_style != "none" else skin.darkened(0.45)
	for side in [-1.0, 1.0]:
		# Ears with an inner fold
		_p(m, hb, DecorKit.sphere(0.06, 10, 5), skin, Vector3(side * 0.236, -0.015, -0.01), Vector3(0, side * -12.0, 0), Vector3(0.45, 1.0, 0.75))
		_p(m, hb, DecorKit.sphere(0.034, 8, 4), skin.darkened(0.14), Vector3(side * 0.258, -0.015, 0.0), Vector3.ZERO, Vector3(0.28, 0.7, 0.55))
		# Eyes: white, iris, pupil, two highlights and an upper lash line —
		# big, friendly and alive, clearly stylised.
		var ex: float = side * EYE_X
		_p(m, hb, DecorKit.sphere(0.052, 14, 7), WHITE, Vector3(ex, EYE_Y, EYE_Z), Vector3.ZERO, Vector3(0.92, 1.15, 0.55))
		_p(m, hb, DecorKit.sphere(0.035, 12, 6), look.eyes, Vector3(ex, EYE_Y - 0.006, 0.224), Vector3.ZERO, Vector3(1.0, 1.08, 0.4))
		_p(m, hb, DecorKit.sphere(0.019, 10, 5), INK, Vector3(ex, EYE_Y - 0.006, 0.233), Vector3.ZERO, Vector3(1.0, 1.0, 0.4))
		_p(m, hb, DecorKit.sphere(0.0105, 6, 3), WHITE, Vector3(ex + 0.013, EYE_Y + 0.012, 0.24), Vector3.ZERO, Vector3.ONE, 0.5)
		_p(m, hb, DecorKit.sphere(0.005, 6, 3), WHITE, Vector3(ex - 0.01, EYE_Y - 0.018, 0.239), Vector3.ZERO, Vector3.ONE, 0.5)
		_p(m, hb, DecorKit.box(Vector3(0.082, 0.01, 0.012)), INK, Vector3(ex, EYE_Y + 0.056, 0.226), Vector3(-20, side * -6.0, side * -6.0))
		# Brows: two parts, gently arched, slightly thicker toward the middle
		_p(m, hb, DecorKit.box(Vector3(0.048, 0.022, 0.02)), brow_c, Vector3(ex - side * 0.016, 0.116, 0.217), Vector3(-14, 0, side * 6.0))
		_p(m, hb, DecorKit.box(Vector3(0.044, 0.018, 0.02)), brow_c, Vector3(ex + side * 0.024, 0.11, 0.211), Vector3(-14, side * 10.0, side * -16.0))
		# Soft cheeks
		_p(m, hb, DecorKit.sphere(0.042, 8, 4), skin.lerp(Color("F07A5A"), 0.28), Vector3(side * 0.13, -0.05, 0.19), Vector3.ZERO, Vector3(1.0, 0.6, 0.3))
	# Nose: small and rounded
	_p(m, hb, DecorKit.sphere(0.03, 10, 5), skin.darkened(0.07), Vector3(0, -0.032, 0.238), Vector3.ZERO, Vector3(0.9, 0.82, 0.9))
	# Smile: a smooth curved line and a hint of a lower lip
	for i in 13:
		var a: float = deg_to_rad(-56.0 + 112.0 * float(i) / 12.0)
		_p(m, hb, DecorKit.sphere(0.0085, 6, 3), Color("6E3029"), Vector3(sin(a) * 0.046, -0.076 - cos(a) * 0.019, 0.233 - absf(sin(a)) * 0.014))
	_p(m, hb, DecorKit.sphere(0.02, 8, 4), skin.lerp(Color("D9776A"), 0.25), Vector3(0, -0.108, 0.225), Vector3.ZERO, Vector3(1.4, 0.4, 0.45))


static func _hair(m: MeshMerger, look: CharacterLook, hb: Transform3D) -> void:
	var c: Color = look.hair
	var hi: Color = c.lightened(0.12)
	var cap_mesh: SphereMesh = DecorKit.sphere(0.27, 22, 9, true)
	match look.hair_style:
		"none":
			return
		"buzz":
			# Close-cropped: a snug shell kept clearly outside the head surface.
			_p(m, hb, DecorKit.sphere(0.262, 20, 8, true), c, Vector3(0, -0.005, -0.008), Vector3(-20, 0, 0), Vector3(1.0, 0.98, 0.99))
			return
	# Every other style starts from the same hairline cap, tilted so the
	# forehead and eyes always stay clear, with a little volume at the back.
	_p(m, hb, cap_mesh, c, Vector3(0, 0.02, -0.015), Vector3(-24, 0, 0), Vector3(1.03, 0.95, 1.04))
	_p(m, hb, DecorKit.sphere(0.24, 16, 8), c, Vector3(0, 0.02, -0.07), Vector3.ZERO, Vector3(1.06, 1.0, 0.95))
	match look.hair_style:
		"short":
			# A soft side-swept fringe
			for i in 4:
				var x: float = -0.12 + i * 0.075
				_p(m, hb, DecorKit.sphere(0.08, 10, 5), c if i % 2 == 0 else hi, Vector3(x, 0.165 - absf(x + 0.03) * 0.3, 0.185 - absf(x) * 0.12), Vector3(0, 0, -15), Vector3(1.1, 0.58, 0.6))
		"curly":
			var spots: Array[Vector3] = [
				Vector3(0, 0.26, 0.02), Vector3(0.13, 0.23, 0.08), Vector3(-0.13, 0.23, 0.08), Vector3(0.21, 0.12, -0.02),
				Vector3(-0.21, 0.12, -0.02), Vector3(0.11, 0.21, -0.15), Vector3(-0.11, 0.21, -0.15), Vector3(0, 0.13, -0.23),
				Vector3(0.19, 0.0, -0.15), Vector3(-0.19, 0.0, -0.15), Vector3(0.06, 0.18, 0.18), Vector3(-0.06, 0.18, 0.18),
				Vector3(0.0, 0.22, -0.08), Vector3(0.0, -0.05, -0.24),
			]
			for i in spots.size():
				_p(m, hb, DecorKit.sphere(0.088, 8, 4), c if i % 3 else hi, spots[i])
		"coily":
			_p(m, hb, DecorKit.sphere(0.32, 18, 9), c, Vector3(0, 0.15, -0.1), Vector3.ZERO, Vector3(1.1, 0.96, 1.02))
		"bob":
			for side in [-1.0, 1.0]:
				_p(m, hb, _capsule(0.1, 0.34), c, Vector3(side * 0.205, -0.07, -0.02), Vector3(0, 0, side * -6.0))
			_p(m, hb, DecorKit.sphere(0.235, 14, 7), c, Vector3(0, -0.03, -0.12), Vector3.ZERO, Vector3(1.12, 0.98, 0.86))
			for x in [-0.12, -0.04, 0.04, 0.12]:
				_p(m, hb, DecorKit.sphere(0.07, 10, 5), c, Vector3(x, 0.155 - absf(x) * 0.25, 0.19), Vector3.ZERO, Vector3(1.0, 0.62, 0.6))
		"long":
			_p(m, hb, _capsule(0.21, 0.7), c, Vector3(0, -0.24, -0.13), Vector3(8, 0, 0), Vector3(1.22, 1.0, 0.62))
			for side in [-1.0, 1.0]:
				_p(m, hb, _capsule(0.075, 0.48), c, Vector3(side * 0.21, -0.18, 0.03))
			for x in [-0.1, 0.0, 0.1]:
				_p(m, hb, DecorKit.sphere(0.07, 10, 5), hi, Vector3(x, 0.16 - absf(x) * 0.25, 0.19), Vector3.ZERO, Vector3(1.0, 0.55, 0.55))
		"ponytail":
			_p(m, hb, DecorKit.sphere(0.055, 8, 4), look.accent, Vector3(0, 0.1, -0.268))
			_p(m, hb, _capsule(0.09, 0.4), c, Vector3(0, -0.06, -0.33), Vector3(24, 0, 0))
			_p(m, hb, DecorKit.sphere(0.075, 8, 4), hi, Vector3(0, -0.26, -0.39))
		"bun":
			_p(m, hb, DecorKit.sphere(0.12, 12, 6), c, Vector3(0, 0.25, -0.13))
			_p(m, hb, DecorKit.torus(0.08, 0.11, 14, 4), look.accent, Vector3(0, 0.19, -0.1), Vector3(-30, 0, 0))
		"braids":
			for side in [-1.0, 1.0]:
				for j in 4:
					_p(m, hb, DecorKit.sphere(0.058 - j * 0.004, 8, 4), c if j % 2 == 0 else hi, Vector3(side * 0.2, -0.13 - j * 0.085, -0.06 + j * 0.01))
				_p(m, hb, DecorKit.sphere(0.03, 6, 3), look.accent, Vector3(side * 0.2, -0.47, -0.03))
		"spiky":
			for i in 7:
				var a: float = deg_to_rad(-75.0 + 150.0 * float(i) / 6.0)
				var base_p := Vector3(sin(a) * 0.16, 0.2 + cos(a) * 0.06, -0.02 + cos(a) * 0.05)
				_p(m, hb, DecorKit.cyl(0.0, 0.07, 0.17, 8), c if i % 2 else hi, base_p + Vector3(0, 0.07, 0), Vector3(-20, 0, -rad_to_deg(a) * 0.6))
		"puffs":
			for side in [-1.0, 1.0]:
				_p(m, hb, DecorKit.sphere(0.15, 14, 7), c, Vector3(side * 0.2, 0.22, -0.06))
				_p(m, hb, DecorKit.torus(0.09, 0.12, 14, 4), look.accent, Vector3(side * 0.17, 0.14, -0.05), Vector3(0, 0, side * 35.0))


static func _head_accessories(m: MeshMerger, look: CharacterLook, hb: Transform3D) -> void:
	if look.has("glasses"):
		for side in [-1.0, 1.0]:
			_p(m, hb, DecorKit.torus(0.05, 0.064, 20, 4), INK, Vector3(side * EYE_X, EYE_Y + 0.002, 0.247), Vector3(90, 0, 0))
			_p(m, hb, DecorKit.box(Vector3(0.012, 0.012, 0.21)), INK, Vector3(side * 0.152, 0.03, 0.14), Vector3(0, side * 8.0, 0))
		_p(m, hb, DecorKit.box(Vector3(0.05, 0.012, 0.012)), INK, Vector3(0, 0.03, 0.252))
	if look.has("hearing_aid"):
		# Behind the right ear: a small, clearly visible device in a friendly colour.
		_p(m, hb, _capsule(0.026, 0.09), Color("367D99"), Vector3(-0.258, 0.0, -0.05), Vector3(20, 0, 0))
		_p(m, hb, DecorKit.sphere(0.018, 6, 3), Color("367D99"), Vector3(-0.252, -0.015, -0.005))
	if look.has("headband") and not look.has("cap"):
		_p(m, hb, DecorKit.torus(0.255, 0.285, 28, 4), look.accent, Vector3(0, 0.1, -0.03), Vector3(-22, 0, 0), Vector3(1.03, 1.0, 1.04))
		_p(m, hb, DecorKit.sphere(0.05, 8, 4), look.accent.lightened(0.2), Vector3(0.17, 0.2, 0.12))
	if look.has("cap"):
		var y: float = 0.24 if look.hair_style == "coily" or look.hair_style == "puffs" else 0.07
		var s: float = 1.12 if look.hair_style == "coily" else 1.0
		_p(m, hb, DecorKit.sphere(0.278, 18, 7, true), look.cap_color, Vector3(0, y, -0.005), Vector3.ZERO, Vector3(s, 0.78, s))
		_p(m, hb, DecorKit.cyl(0.155, 0.155, 0.03, 16), look.cap_color.darkened(0.15), Vector3(0, y + 0.03, 0.225 * s), Vector3(8, 0, 0), Vector3(1.0, 1.0, 1.3))
		_p(m, hb, DecorKit.sphere(0.025, 6, 3), look.cap_color.darkened(0.2), Vector3(0, y + 0.215, 0))


# --- body -------------------------------------------------------------------------

static func _torso(m: MeshMerger, look: CharacterLook, d: Dims, base: Transform3D) -> void:
	var top: Color = look.top
	var front: float = d.torso_r * 0.86
	var torso_h: float = 0.62 * d.h
	var mid_y: float = d.hip_y + 0.27 * d.h
	# Hips / trousers, the torso, and a chest a little wider than the waist
	# with rounded shoulders: a clear, friendly silhouette.
	_p(m, base, DecorKit.cyl(0.214 * d.w, 0.225 * d.w, 0.2, 16), look.bottom, Vector3(0, d.hip_y, 0), Vector3.ZERO, Vector3(1, 1, 0.86))
	_p(m, base, _capsule(d.torso_r * 0.96, torso_h, 16), top, Vector3(0, mid_y, 0), Vector3.ZERO, Vector3(1, 1, 0.84))
	_p(m, base, DecorKit.sphere(d.torso_r * 1.02, 16, 8), top, Vector3(0, d.shoulder_y - 0.14, 0), Vector3.ZERO, Vector3(1.06, 0.74, 0.82))
	for side in [-1.0, 1.0]:
		_p(m, base, DecorKit.sphere(0.074, 10, 5), top, Vector3(side * (d.torso_r + 0.02), d.shoulder_y - 0.04, 0), Vector3.ZERO, Vector3(1.0, 0.8, 0.95))
	# Neck and collar
	_p(m, base, DecorKit.cyl(0.07, 0.078, 0.16, 12), look.skin, Vector3(0, d.shoulder_y + 0.09, 0))
	_p(m, base, DecorKit.torus(0.068, 0.1, 16, 6), top.darkened(0.14), Vector3(0, d.shoulder_y + 0.05, 0.005))
	# A hem band where the top meets the trousers
	_p(m, base, DecorKit.cyl(d.torso_r * 0.98, d.torso_r * 0.99, 0.045, 16), top.darkened(0.1), Vector3(0, d.hip_y + 0.1, 0), Vector3.ZERO, Vector3(1, 1, 0.86))
	match look.outfit_style:
		"hoodie":
			_p(m, base, DecorKit.sphere(0.17, 12, 6), top.darkened(0.12), Vector3(0, d.shoulder_y + 0.04, -0.12), Vector3(-20, 0, 0), Vector3(1.35, 0.75, 0.75))
			_p(m, base, DecorKit.box(Vector3(0.26 * d.w, 0.12, 0.03)), top.darkened(0.08), Vector3(0, d.hip_y + 0.17, front + 0.01))
			for side in [-1.0, 1.0]:
				_p(m, base, DecorKit.cyl(0.008, 0.008, 0.14, 4), CREAM, Vector3(side * 0.035, d.shoulder_y - 0.04, front + 0.03))
		"jacket":
			_p(m, base, DecorKit.box(Vector3(0.11 * d.w, 0.5 * d.h, 0.02)), CREAM, Vector3(0, mid_y + 0.02, front + 0.012))
			for side in [-1.0, 1.0]:
				_p(m, base, DecorKit.box(Vector3(0.05, 0.2, 0.02)), top.darkened(0.2), Vector3(side * 0.07, d.shoulder_y - 0.1, front + 0.022), Vector3(0, 0, side * 14.0))
			for i in 2:
				_p(m, base, DecorKit.sphere(0.014, 6, 3), INK, Vector3(0.075, d.hip_y + (0.2 + 0.13 * i) * d.h, front + 0.02))
		"dress":
			_p(m, base, DecorKit.cyl(0.21 * d.w, 0.33 * d.w, 0.3 * d.h, 18), top, Vector3(0, d.hip_y - 0.07 * d.h, 0), Vector3.ZERO, Vector3(1, 1, 0.9))
			_p(m, base, DecorKit.cyl(0.335 * d.w, 0.335 * d.w, 0.03, 18), top.darkened(0.15), Vector3(0, d.hip_y - 0.215 * d.h, 0), Vector3.ZERO, Vector3(1, 1, 0.9))
		"overalls":
			var ov: Color = look.bottom
			_p(m, base, DecorKit.box(Vector3(0.26 * d.w, 0.2 * d.h, 0.03)), ov, Vector3(0, d.hip_y + 0.18 * d.h, front + 0.008))
			_p(m, base, DecorKit.box(Vector3(0.1, 0.06, 0.02)), ov.darkened(0.15), Vector3(0, d.hip_y + 0.17 * d.h, front + 0.03))
			for side in [-1.0, 1.0]:
				_p(m, base, DecorKit.box(Vector3(0.045, 0.34 * d.h, 0.02)), ov, Vector3(side * 0.075, d.shoulder_y - 0.08, front - 0.005), Vector3(-6, 0, 0))
				_p(m, base, DecorKit.cyl(0.018, 0.018, 0.012, 8), Color("E8A33D"), Vector3(side * 0.075, d.hip_y + 0.27 * d.h, front + 0.03), Vector3(90, 0, 0))
		_:   # tee: a small chest pocket
			_p(m, base, DecorKit.box(Vector3(0.07, 0.07, 0.015)), top.darkened(0.1), Vector3(0.085 * d.w, d.shoulder_y - 0.15, front + 0.012))
	_extras(m, look, d, base, front)
	_body_cosmetics(m, look, d, base, front)


static func _extras(m: MeshMerger, look: CharacterLook, d: Dims, base: Transform3D, front: float) -> void:
	var chest_y: float = d.shoulder_y - 0.12
	if look.extras.has("apron"):
		# Bib, skirt, pocket and neck strap — reads as an apron, not a sign.
		var ap: Color = look.accent
		_p(m, base, DecorKit.box(Vector3(0.38 * d.w, 0.3 * d.h, 0.03)), ap, Vector3(0, d.hip_y - 0.02 * d.h, front + 0.04))
		_p(m, base, DecorKit.box(Vector3(0.22 * d.w, 0.24 * d.h, 0.03)), ap, Vector3(0, d.hip_y + 0.24 * d.h, front + 0.014))
		_p(m, base, DecorKit.box(Vector3(0.14, 0.08, 0.02)), ap.darkened(0.18), Vector3(0, d.hip_y - 0.04 * d.h, front + 0.06))
		_p(m, base, DecorKit.torus(0.075, 0.095, 14, 4), ap.darkened(0.1), Vector3(0, d.shoulder_y + 0.04, 0.02), Vector3(-25, 0, 0))
	if look.extras.has("cardigan"):
		_p(m, base, DecorKit.box(Vector3(0.09, 0.5 * d.h, 0.03)), Color("F2E8D5"), Vector3(0, d.hip_y + 0.26 * d.h, front + 0.006))
		for i in 3:
			_p(m, base, DecorKit.sphere(0.014, 6, 3), Color("6B4A33"), Vector3(0.06, d.hip_y + (0.12 + 0.12 * i) * d.h, front + 0.022))
	if look.extras.has("tie"):
		_p(m, base, DecorKit.box(Vector3(0.12, 0.05, 0.03)), WHITE, Vector3(0, d.shoulder_y + 0.0, front - 0.01))
		_p(m, base, DecorKit.box(Vector3(0.05, 0.05, 0.03)), look.accent, Vector3(0, d.shoulder_y - 0.04, front + 0.016))
		_p(m, base, DecorKit.box(Vector3(0.055, 0.2, 0.02)), look.accent, Vector3(0, d.shoulder_y - 0.17, front + 0.016))
	if look.extras.has("badge"):
		_p(m, base, DecorKit.cyl(0.045, 0.045, 0.02, 12), Color("E8A33D"), Vector3(0.09 * d.w, chest_y, front + 0.016), Vector3(90, 0, 0), Vector3.ONE, 0.25)


static func _body_cosmetics(m: MeshMerger, look: CharacterLook, d: Dims, base: Transform3D, front: float) -> void:
	if look.has("scarf"):
		var sc: Color = look.accent
		_p(m, base, DecorKit.torus(0.07, 0.125, 18, 8), sc, Vector3(0, d.shoulder_y + 0.04, 0.01), Vector3(-8, 0, 0), Vector3(1.05, 1.6, 1.0))
		_p(m, base, DecorKit.box(Vector3(0.07, 0.22, 0.03)), sc, Vector3(0.07, d.shoulder_y - 0.1, front + 0.03), Vector3(0, 0, 6))
		_p(m, base, DecorKit.box(Vector3(0.072, 0.02, 0.032)), sc.darkened(0.2), Vector3(0.07, d.shoulder_y - 0.19, front + 0.03), Vector3(0, 0, 6))
	if look.has("backpack") and not look.seated:
		var bp: Color = look.accent.darkened(0.1)
		_p(m, base, DecorKit.box(Vector3(0.3 * d.w, 0.34, 0.15)), bp, Vector3(0, d.shoulder_y - 0.2, -d.torso_r * 0.84 - 0.06))
		_p(m, base, DecorKit.box(Vector3(0.22 * d.w, 0.13, 0.05)), bp.lightened(0.15), Vector3(0, d.shoulder_y - 0.29, -d.torso_r * 0.84 - 0.15))
		for side in [-1.0, 1.0]:
			_p(m, base, DecorKit.box(Vector3(0.04, 0.3, 0.02)), bp.darkened(0.15), Vector3(side * 0.1 * d.w, d.shoulder_y - 0.12, front - 0.005), Vector3(-8, 0, 0))
	if look.has("star_pin"):
		var c := Vector3(-0.09 * d.w, d.shoulder_y - 0.12, front + 0.02)
		_p(m, base, DecorKit.prism(Vector3(0.07, 0.05, 0.015)), Color("E8A33D"), c + Vector3(0, 0.01, 0), Vector3.ZERO, Vector3.ONE, 0.3)
		_p(m, base, DecorKit.prism(Vector3(0.07, 0.05, 0.015)), Color("E8A33D"), c + Vector3(0, -0.006, 0), Vector3(0, 0, 180), Vector3.ONE, 0.3)


static func _arm(m: MeshMerger, look: CharacterLook, d: Dims, base: Transform3D, side: float) -> void:
	var long: bool = _long_sleeves(look)
	var sleeve: Color = look.top
	_p(m, base, DecorKit.sphere(0.078, 10, 5), sleeve, Vector3.ZERO)
	_p(m, base, _capsule(0.074, 0.28 * d.h), sleeve, Vector3(0, -0.12 * d.h, 0))
	if not long:
		# Short sleeve: a cuff where the sleeve ends, then a bare forearm.
		_p(m, base, DecorKit.cyl(0.078, 0.08, 0.04, 12), sleeve.darkened(0.12), Vector3(0, -0.2 * d.h, 0))
	_p(m, base, _capsule(0.062 if long else 0.058, 0.24 * d.h), sleeve if long else look.skin, Vector3(0, -0.31 * d.h, 0))
	if long:
		_p(m, base, DecorKit.cyl(0.066, 0.066, 0.05, 12), sleeve.darkened(0.15), Vector3(0, -0.4 * d.h, 0))
	# Hand: palm, a softly curled block of fingers and a thumb.
	var hand_y: float = -0.445 * d.h
	_p(m, base, DecorKit.sphere(0.06, 10, 5), look.skin, Vector3(0, hand_y, 0.005), Vector3.ZERO, Vector3(0.78, 1.0, 0.98))
	_p(m, base, _capsule(0.03, 0.1, 8), look.skin, Vector3(0, hand_y - 0.055, 0.016), Vector3(-14, 0, 0), Vector3(1.55, 1.0, 1.15))
	_p(m, base, DecorKit.sphere(0.026, 8, 4), look.skin, Vector3(-side * 0.04, hand_y + 0.005, 0.04), Vector3(0, 0, side * 20.0), Vector3(0.8, 1.35, 0.8))
	if side > 0.0 and look.extras.has("book"):
		# A book held in the left hand (librarians): a cover and pages.
		_p(m, base, DecorKit.box(Vector3(0.05, 0.2, 0.15)), Color("A0553E"), Vector3(-0.03, hand_y - 0.04, 0.06))
		_p(m, base, DecorKit.box(Vector3(0.042, 0.18, 0.135)), CREAM, Vector3(-0.034, hand_y - 0.04, 0.062))
	if side < 0.0 and look.has("cane") and not look.seated:
		# A white mobility cane with a red band, held in the right hand.
		var cane_len: float = d.shoulder_y - 0.02 + hand_y
		_p(m, base, DecorKit.cyl(0.016, 0.016, cane_len, 8), WHITE, Vector3(0, hand_y - cane_len * 0.5, 0.07))
		_p(m, base, DecorKit.cyl(0.019, 0.019, 0.12, 8), Color("C6433A"), Vector3(0, hand_y - cane_len + 0.08, 0.07))
		_p(m, base, _capsule(0.024, 0.14), INK, Vector3(0, hand_y + 0.02, 0.06), Vector3(90, 0, 0))


static func _thigh(m: MeshMerger, look: CharacterLook, d: Dims) -> void:
	_p(m, Transform3D.IDENTITY, _capsule(0.088, d.thigh + 0.1), look.bottom, Vector3(0, -d.thigh * 0.5, 0))


static func _shin(m: MeshMerger, look: CharacterLook, d: Dims, base: Transform3D = Transform3D.IDENTITY) -> void:
	_p(m, base, _capsule(0.076, d.shin + 0.06), look.bottom, Vector3(0, -d.shin * 0.5, 0))
	# Trouser hem, a little sock, then the shoe.
	_p(m, base, DecorKit.cyl(0.08, 0.082, 0.04, 12), look.bottom.darkened(0.15), Vector3(0, -d.shin + 0.05, 0))
	_p(m, base, DecorKit.cyl(0.06, 0.06, 0.05, 10), WHITE, Vector3(0, -d.shin + 0.02, 0))
	_shoe(m, look, Transform3D(base.basis, base * Vector3(0, -d.shin, 0)))


## A rounded trainer: darker sole, coloured upper, lighter toe cap, laces.
static func _shoe(m: MeshMerger, look: CharacterLook, at: Transform3D) -> void:
	var s: Color = look.shoes
	_p(m, at, DecorKit.sphere(0.1, 12, 6), Color("3A3F44") if s.get_luminance() > 0.3 else Color("E9E4D6"), Vector3(0, -0.038, 0.048), Vector3.ZERO, Vector3(0.95, 0.3, 1.55))
	_p(m, at, DecorKit.sphere(0.096, 12, 6), s, Vector3(0, -0.006, 0.045), Vector3.ZERO, Vector3(0.9, 0.58, 1.45))
	_p(m, at, DecorKit.sphere(0.064, 10, 5), s.lightened(0.28), Vector3(0, -0.016, 0.115), Vector3.ZERO, Vector3(1.05, 0.62, 0.85))
	for i in 2:
		_p(m, at, DecorKit.box(Vector3(0.07, 0.012, 0.016)), WHITE if s.get_luminance() < 0.75 else INK, Vector3(0, 0.035 - i * 0.012, 0.06 + i * 0.03), Vector3(-35, 0, 0))


## Static (NPC) leg in its resting pose — standing, or seated (thigh
## forward, shin down) when in a wheelchair.
static func _leg(m: MeshMerger, look: CharacterLook, d: Dims, hip: Transform3D, seated: bool) -> void:
	var hip_rot: Basis = Basis.from_euler(Vector3(-PI * 0.5 if seated else 0.0, 0, 0))
	var hx: Transform3D = hip * Transform3D(hip_rot, Vector3.ZERO)
	_p(m, hx, _capsule(0.088, d.thigh + 0.1), look.bottom, Vector3(0, -d.thigh * 0.5, 0))
	var kx: Transform3D = hx * Transform3D(Basis.from_euler(Vector3(PI * 0.5 if seated else 0.0, 0, 0)), Vector3(0, -d.thigh, 0))
	_shin(m, look, d, kx)


# --- wheelchair ---------------------------------------------------------------

## A clean, light wheelchair: cushioned seat and backrest, a slim teal
## frame, two large rear wheels with push rims, small front casters and a
## footrest. Purely visual — movement and collision are the same as for
## every other avatar.
static func _wheelchair(rig: CharacterRig) -> Node3D:
	var chair := Node3D.new()
	chair.name = "Wheelchair"
	var frame := Color("0F7A6B")
	var cushion := Color("2F4B7C")
	var tyre := Color("2A2E33")
	var metal := Color("B8C2C8")
	var m := MeshMerger.new()
	var I := Transform3D.IDENTITY
	_p(m, I, DecorKit.box(Vector3(0.46, 0.07, 0.44)), cushion, Vector3(0, 0.47, 0.02))
	_p(m, I, DecorKit.box(Vector3(0.44, 0.4, 0.06)), cushion, Vector3(0, 0.72, -0.22), Vector3(-6, 0, 0))
	for side in [-1.0, 1.0]:
		var x: float = side * 0.235
		_p(m, I, DecorKit.cyl(0.02, 0.02, 0.62, 8), frame, Vector3(x, 0.66, -0.24), Vector3(-6, 0, 0))
		_p(m, I, DecorKit.cyl(0.02, 0.02, 0.5, 8), frame, Vector3(x, 0.43, 0.02), Vector3(90, 0, 0))
		_p(m, I, DecorKit.cyl(0.02, 0.02, 0.32, 8), frame, Vector3(x * 0.85, 0.3, 0.27), Vector3(-30, 0, 0))
		_p(m, I, DecorKit.box(Vector3(0.05, 0.035, 0.3)), frame, Vector3(side * 0.25, 0.66, -0.02))
		_p(m, I, DecorKit.cyl(0.018, 0.018, 0.16, 8), INK, Vector3(x, 0.98, -0.3), Vector3(70, 0, 0))
		# Front caster with its fork
		_p(m, I, DecorKit.cyl(0.012, 0.012, 0.16, 6), metal, Vector3(side * 0.2, 0.15, 0.3))
		_p(m, I, DecorKit.cyl(0.065, 0.065, 0.035, 12), tyre, Vector3(side * 0.2, 0.065, 0.3), Vector3(0, 0, 90))
	_p(m, I, DecorKit.box(Vector3(0.36, 0.03, 0.13)), frame, Vector3(0, 0.215, 0.36))
	m.commit_to(chair, "Frame")

	for side in [-1.0, 1.0]:
		var wheel := Node3D.new()
		wheel.name = "WheelR" if side < 0.0 else "WheelL"
		wheel.position = Vector3(side * 0.305, 0.3, -0.06)
		var wm := MeshMerger.new()
		_p(wm, I, DecorKit.torus(0.25, 0.3, 28, 8), tyre, Vector3.ZERO, Vector3(0, 0, 90))
		_p(wm, I, DecorKit.torus(0.235, 0.25, 28, 4), metal, Vector3(side * 0.035, 0, 0), Vector3(0, 0, 90))
		_p(wm, I, DecorKit.cyl(0.05, 0.05, 0.07, 12), frame, Vector3.ZERO, Vector3(0, 0, 90))
		for a in [0.0, 60.0, 120.0]:
			_p(wm, I, DecorKit.box(Vector3(0.012, 0.48, 0.018)), metal, Vector3.ZERO, Vector3(a, 0, 0))
		wm.commit_to(wheel, "Mesh")
		chair.add_child(wheel)
		if side < 0.0:
			rig.wheel_r = wheel
		else:
			rig.wheel_l = wheel
	return chair
