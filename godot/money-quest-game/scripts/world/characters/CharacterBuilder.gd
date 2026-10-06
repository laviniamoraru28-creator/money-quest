class_name CharacterBuilder
extends RefCounted
## CharacterBuilder — turns a CharacterLook into Money Quest World's
## stylised human character: a rounded, child-proportioned body (slightly
## oversized head, compact torso, short legs, small hands and shoes), a
## simple friendly face built from geometry (eyes with a highlight, brows,
## nose, smile, soft cheeks), one of CharacterPalette.HAIR_STYLES, simple
## clothing, and any accessories (glasses, cap, hearing aid, cane,
## wheelchair) — each independent of the others.
##
## Two output modes, same look:
## - animated (the player): separate pivots for arms, hips and knees so
##   CharacterRig can play a gentle walk;
## - static (NPCs): everything baked into ONE merged mesh in a resting
##   pose, cached by look, so many NPCs stay cheap.
##
## Coordinates: feet on y = 0, facing +Z (the direction Player.gd turns
## the body toward), character's right hand on -X.

const HEAD_R: float = 0.25
## The head (with its hair and accessories) is built at HEAD_R and scaled by
## this: a slightly smaller head on a taller body reads as a person rather
## than a doll, while staying soft and friendly.
const HEAD_SCALE: float = 0.88
const EYE_X: float = 0.088
const EYE_Y: float = 0.012
const INK := Color("1C2624")
const WHITE := Color("FFFFFF")

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

	if not animated:
		# NPC: three cached meshes — body (torso, legs, left arm), head and
		# right arm — so CharacterRig can add a glance, a nod and an
		# occasional wave. Identical looks share the same meshes.
		var key: String = look.key()
		if not _npc_mesh_cache.has(key):
			var bm := MeshMerger.new()
			_torso(bm, look, d, Transform3D.IDENTITY)
			_arm(bm, look, d, _arm_rest(d, 1.0, look.seated), 1.0)
			for side in [-1.0, 1.0]:
				_leg(bm, look, d, _hip_xf(d, side), look.seated)
			var hm := MeshMerger.new()
			_head_group(hm, look, _head_local(d))
			var am := MeshMerger.new()
			_arm(am, look, d, Transform3D.IDENTITY, -1.0)
			_npc_mesh_cache[key] = [bm.commit(), hm.commit(), am.commit()]
		var meshes: Array = _npc_mesh_cache[key]
		var mi := MeshInstance3D.new()
		mi.name = "Mesh"
		mi.mesh = meshes[0]
		body.add_child(mi)
		var head := MeshInstance3D.new()
		head.name = "Head"
		head.mesh = meshes[1]
		head.position = Vector3(0, _neck_y(d), 0)
		body.add_child(head)
		rig.head = head
		_add_face_parts(rig, look, head, _head_local(d))
		var arm := MeshInstance3D.new()
		arm.name = "ArmR"
		arm.mesh = meshes[2]
		arm.transform = _arm_rest(d, -1.0, look.seated)
		body.add_child(arm)
		rig.arm_r = arm
		rig.apply_rest_pose()
		return rig

	var torso := MeshMerger.new()
	_torso_and_head(torso, look, d, Transform3D.IDENTITY)
	torso.commit_to(body, "Torso")
	_add_face_parts(rig, look, body, Transform3D(Basis.from_scale(Vector3.ONE * HEAD_SCALE), Vector3(0, d.head_y, 0)))
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
	d.head_y = d.shoulder_y + 0.30
	d.torso_r = 0.2 * d.w
	return d


static func _hip_xf(d: Dims, side: float) -> Transform3D:
	return Transform3D(Basis.IDENTITY, Vector3(side * 0.105 * d.w, d.hip_y, 0))


static func _arm_rest(d: Dims, side: float, seated: bool) -> Transform3D:
	var rot := Vector3(-0.35 if seated else 0.0, 0, side * deg_to_rad(7.0))
	return Transform3D(Basis.from_euler(rot), Vector3(side * (d.torso_r + 0.075), d.shoulder_y - 0.02, 0))


# --- body parts -------------------------------------------------------------

static func _p(m: MeshMerger, base: Transform3D, mesh: Mesh, c: Color, pos: Vector3, rot_deg: Vector3 = Vector3.ZERO, scl: Vector3 = Vector3.ONE, glow: float = 0.0) -> void:
	m.add(mesh, base * DecorKit.xf(pos, rot_deg, scl), CharacterPalette.mat(c, glow))


static func _capsule(radius: float, height: float) -> CapsuleMesh:
	var key: String = "cap|%s|%s" % [radius, height]
	if not DecorKit._meshes.has(key):
		var c := CapsuleMesh.new()
		c.radius = radius
		c.height = maxf(height, radius * 2.0)
		c.radial_segments = 12
		c.rings = 4
		DecorKit._meshes[key] = c
	return DecorKit._meshes[key]


static func _torso_and_head(m: MeshMerger, look: CharacterLook, d: Dims, base: Transform3D) -> void:
	_torso(m, look, d, base)
	_head_group(m, look, base * Transform3D(Basis.from_scale(Vector3.ONE * HEAD_SCALE), Vector3(0, d.head_y, 0)))


## The head group's transform relative to an NPC's head pivot.
static func _head_local(d: Dims) -> Transform3D:
	return Transform3D(Basis.from_scale(Vector3.ONE * HEAD_SCALE), Vector3(0, d.head_y - _neck_y(d), 0))


## Closed eyelids (shown for a blink) and an open mouth (shown while
## talking): two tiny separate meshes, hidden at rest, so CharacterRig can
## blink and talk by toggling them — no per-frame mesh work.
static func _add_face_parts(rig: CharacterRig, look: CharacterLook, parent: Node3D, hx: Transform3D) -> void:
	var key: String = "face|" + look.skin.to_html(false)
	if not _npc_mesh_cache.has(key):
		var lm := MeshMerger.new()
		for side in [-1.0, 1.0]:
			_p(lm, Transform3D.IDENTITY, DecorKit.sphere(0.05, 12, 6), look.skin.darkened(0.04), Vector3(side * EYE_X, EYE_Y, 0.2), Vector3.ZERO, Vector3(1.0, 1.16, 0.62))
			_p(lm, Transform3D.IDENTITY, DecorKit.box(Vector3(0.07, 0.008, 0.01)), look.skin.darkened(0.35), Vector3(side * EYE_X, EYE_Y - 0.004, 0.232))
		var mm := MeshMerger.new()
		_p(mm, Transform3D.IDENTITY, DecorKit.sphere(0.03, 10, 5), Color("6E2A2A"), Vector3.ZERO, Vector3.ZERO, Vector3(1.35, 1.0, 0.4))
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
	mouth.transform = hx * Transform3D(Basis.IDENTITY, Vector3(0, -0.068, 0.226))
	mouth.visible = false
	mouth.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	parent.add_child(mouth)
	rig.mouth = mouth


## Where an NPC's head pivots (top of the neck).
static func _neck_y(d: Dims) -> float:
	return d.shoulder_y + 0.14


static func _head_group(m: MeshMerger, look: CharacterLook, hb: Transform3D) -> void:
	_head(m, look, hb)
	_hair(m, look, hb)
	_head_accessories(m, look, hb)


static func _torso(m: MeshMerger, look: CharacterLook, d: Dims, base: Transform3D) -> void:
	var front: float = d.torso_r * 0.86
	# Hips / shorts and torso (top)
	# Slightly wider than the torso's lower edge, so the waistline is one
	# clean line instead of two surfaces fighting.
	_p(m, base, DecorKit.cyl(0.214 * d.w, 0.22 * d.w, 0.2, 16), look.bottom, Vector3(0, d.hip_y + 0.0, 0), Vector3.ZERO, Vector3(1, 1, 0.86))
	var torso_h: float = 0.62 * d.h
	_p(m, base, _capsule(d.torso_r, torso_h), look.top, Vector3(0, d.hip_y + 0.27 * d.h, 0), Vector3.ZERO, Vector3(1, 1, 0.86))
	_p(m, base, DecorKit.torus(0.065, 0.1, 14, 6), look.top.darkened(0.12), Vector3(0, d.shoulder_y + 0.06, 0))
	_p(m, base, DecorKit.cyl(0.072, 0.078, 0.14, 10), look.skin, Vector3(0, d.shoulder_y + 0.09, 0))
	_extras(m, look, d, base, front)


static func _extras(m: MeshMerger, look: CharacterLook, d: Dims, base: Transform3D, front: float) -> void:
	var chest_y: float = d.shoulder_y - 0.12
	if look.extras.has("apron"):
		# Bib, skirt, pocket and neck strap — reads as an apron, not a sign.
		var ap: Color = look.accent
		_p(m, base, DecorKit.box(Vector3(0.38 * d.w, 0.3 * d.h, 0.03)), ap, Vector3(0, d.hip_y - 0.02 * d.h, front + 0.04))
		_p(m, base, DecorKit.box(Vector3(0.22 * d.w, 0.24 * d.h, 0.03)), ap, Vector3(0, d.hip_y + 0.24 * d.h, front + 0.012))
		_p(m, base, DecorKit.box(Vector3(0.14, 0.08, 0.02)), ap.darkened(0.18), Vector3(0, d.hip_y - 0.04 * d.h, front + 0.06))
		_p(m, base, DecorKit.torus(0.075, 0.095, 14, 4), ap.darkened(0.1), Vector3(0, d.shoulder_y + 0.04, 0.02), Vector3(-25, 0, 0))
	if look.extras.has("cardigan"):
		_p(m, base, DecorKit.box(Vector3(0.09, 0.5 * d.h, 0.03)), Color("F2E8D5"), Vector3(0, d.hip_y + 0.26 * d.h, front + 0.005))
		for i in 3:
			_p(m, base, DecorKit.sphere(0.014, 6, 3), Color("6B4A33"), Vector3(0.06, d.hip_y + (0.12 + 0.12 * i) * d.h, front + 0.02))
	if look.extras.has("tie"):
		_p(m, base, DecorKit.box(Vector3(0.12, 0.05, 0.03)), WHITE, Vector3(0, d.shoulder_y + 0.0, front - 0.01))
		_p(m, base, DecorKit.box(Vector3(0.05, 0.05, 0.03)), look.accent, Vector3(0, d.shoulder_y - 0.04, front + 0.01))
		_p(m, base, DecorKit.box(Vector3(0.055, 0.2, 0.02)), look.accent, Vector3(0, d.shoulder_y - 0.17, front + 0.01))
	if look.extras.has("badge"):
		_p(m, base, DecorKit.cyl(0.045, 0.045, 0.02, 12), Color("E8A33D"), Vector3(0.09 * d.w, chest_y, front + 0.01), Vector3(90, 0, 0), Vector3.ONE, 0.25)


static func _head(m: MeshMerger, look: CharacterLook, hb: Transform3D) -> void:
	var r := HEAD_R
	_p(m, hb, DecorKit.sphere(r, 20, 10), look.skin, Vector3.ZERO, Vector3.ZERO, Vector3(1.0, 0.97, 0.95))
	for side in [-1.0, 1.0]:
		_p(m, hb, DecorKit.sphere(0.055, 8, 4), look.skin, Vector3(side * 0.243, -0.01, 0), Vector3.ZERO, Vector3(0.55, 1.0, 0.8))
		# Eyes: white, a coloured iris, a dark pupil and a bright highlight —
		# expressive and alive, still clearly stylised.
		var ex: float = side * EYE_X
		_p(m, hb, DecorKit.sphere(0.046, 12, 6), WHITE, Vector3(ex, EYE_Y, 0.198), Vector3.ZERO, Vector3(0.95, 1.12, 0.55))
		_p(m, hb, DecorKit.sphere(0.03, 10, 5), look.eyes, Vector3(ex, EYE_Y - 0.004, 0.221), Vector3.ZERO, Vector3(1.0, 1.06, 0.5))
		_p(m, hb, DecorKit.sphere(0.016, 8, 4), INK, Vector3(ex, EYE_Y - 0.004, 0.232), Vector3.ZERO, Vector3(1.0, 1.0, 0.5))
		_p(m, hb, DecorKit.sphere(0.008, 6, 3), WHITE, Vector3(ex + 0.011, EYE_Y + 0.013, 0.239), Vector3.ZERO, Vector3.ONE, 0.4)
		# Brows
		_p(m, hb, DecorKit.box(Vector3(0.072, 0.018, 0.02)), look.hair.darkened(0.15), Vector3(ex, 0.094, 0.208), Vector3(0, 0, side * -8.0))
		# Soft cheeks
		_p(m, hb, DecorKit.sphere(0.04, 8, 4), look.skin.lerp(Color("F07A5A"), 0.3), Vector3(side * 0.135, -0.045, 0.185), Vector3.ZERO, Vector3(1.0, 0.6, 0.3))
	# Nose and smile
	_p(m, hb, DecorKit.sphere(0.026, 8, 4), look.skin.darkened(0.08), Vector3(0, -0.03, 0.237))
	for i in 7:
		var a: float = deg_to_rad(-55.0 + 110.0 * float(i) / 6.0)
		_p(m, hb, DecorKit.sphere(0.012, 6, 3), Color("7A3B33"), Vector3(sin(a) * 0.045, -0.06 - cos(a) * 0.022, 0.222))


static func _hair(m: MeshMerger, look: CharacterLook, hb: Transform3D) -> void:
	var c: Color = look.hair
	var cap_mesh: SphereMesh = DecorKit.sphere(0.268, 20, 8, true)
	match look.hair_style:
		"none":
			return
		"buzz":
			# Close-cropped: a snug shell kept clearly outside the head
			# surface so the two never flicker against each other.
			_p(m, hb, DecorKit.sphere(0.262, 20, 8, true), c, Vector3(0, -0.005, -0.008), Vector3(-20, 0, 0), Vector3(1.0, 0.98, 0.99))
			return
	# Every other style starts from the same hairline cap, tilted so the
	# forehead and eyes always stay clear.
	_p(m, hb, cap_mesh, c, Vector3(0, 0.02, -0.015), Vector3(-24, 0, 0), Vector3(1.0, 0.92, 1.02))
	match look.hair_style:
		"short":
			for x in [-0.09, 0.0, 0.09]:
				_p(m, hb, DecorKit.sphere(0.075, 10, 5), c, Vector3(x, 0.155 - absf(x) * 0.3, 0.19), Vector3.ZERO, Vector3(1.0, 0.6, 0.6))
		"curly":
			var spots: Array[Vector3] = [
				Vector3(0, 0.25, 0.02), Vector3(0.13, 0.22, 0.08), Vector3(-0.13, 0.22, 0.08), Vector3(0.2, 0.12, -0.02),
				Vector3(-0.2, 0.12, -0.02), Vector3(0.1, 0.2, -0.15), Vector3(-0.1, 0.2, -0.15), Vector3(0, 0.12, -0.22),
				Vector3(0.18, 0.0, -0.14), Vector3(-0.18, 0.0, -0.14), Vector3(0.06, 0.17, 0.17), Vector3(-0.06, 0.17, 0.17),
			]
			for s in spots:
				_p(m, hb, DecorKit.sphere(0.085, 8, 4), c, s)
		"coily":
			_p(m, hb, DecorKit.sphere(0.31, 18, 9), c, Vector3(0, 0.15, -0.1), Vector3.ZERO, Vector3(1.08, 0.95, 1.0))
		"bob":
			for side in [-1.0, 1.0]:
				_p(m, hb, _capsule(0.1, 0.32), c, Vector3(side * 0.2, -0.06, -0.02), Vector3(0, 0, side * -6.0))
			_p(m, hb, DecorKit.sphere(0.23, 14, 7), c, Vector3(0, -0.02, -0.12), Vector3.ZERO, Vector3(1.1, 0.95, 0.85))
			for x in [-0.12, -0.04, 0.04, 0.12]:
				_p(m, hb, DecorKit.sphere(0.07, 10, 5), c, Vector3(x, 0.15 - absf(x) * 0.25, 0.19), Vector3.ZERO, Vector3(1.0, 0.65, 0.6))
		"long":
			_p(m, hb, _capsule(0.2, 0.62), c, Vector3(0, -0.2, -0.13), Vector3(8, 0, 0), Vector3(1.2, 1.0, 0.6))
			for side in [-1.0, 1.0]:
				_p(m, hb, _capsule(0.07, 0.42), c, Vector3(side * 0.205, -0.16, 0.03))
		"ponytail":
			_p(m, hb, DecorKit.sphere(0.055, 8, 4), look.accent, Vector3(0, 0.1, -0.265))
			_p(m, hb, _capsule(0.085, 0.36), c, Vector3(0, -0.05, -0.32), Vector3(22, 0, 0))


static func _head_accessories(m: MeshMerger, look: CharacterLook, hb: Transform3D) -> void:
	if look.has("glasses"):
		for side in [-1.0, 1.0]:
			_p(m, hb, DecorKit.torus(0.046, 0.06, 18, 4), INK, Vector3(side * 0.085, 0.015, 0.243), Vector3(90, 0, 0))
			_p(m, hb, DecorKit.box(Vector3(0.012, 0.012, 0.21)), INK, Vector3(side * 0.148, 0.03, 0.135), Vector3(0, side * 8.0, 0))
		_p(m, hb, DecorKit.box(Vector3(0.05, 0.012, 0.012)), INK, Vector3(0, 0.03, 0.248))
	if look.has("hearing_aid"):
		# Behind the right ear: a small, clearly visible device in a friendly colour.
		_p(m, hb, _capsule(0.026, 0.09), Color("367D99"), Vector3(-0.258, 0.0, -0.045), Vector3(20, 0, 0))
		_p(m, hb, DecorKit.sphere(0.018, 6, 3), Color("367D99"), Vector3(-0.252, -0.015, 0.0))
	if look.has("cap"):
		var y: float = 0.24 if look.hair_style == "coily" else 0.07
		var s: float = 1.12 if look.hair_style == "coily" else 1.0
		_p(m, hb, DecorKit.sphere(0.272, 18, 7, true), look.cap_color, Vector3(0, y, -0.005), Vector3.ZERO, Vector3(s, 0.78, s))
		_p(m, hb, DecorKit.cyl(0.15, 0.15, 0.03, 16), look.cap_color.darkened(0.15), Vector3(0, y + 0.03, 0.22 * s), Vector3(8, 0, 0), Vector3(1.0, 1.0, 1.3))
		_p(m, hb, DecorKit.sphere(0.025, 6, 3), look.cap_color.darkened(0.2), Vector3(0, y + 0.21, 0))


static func _arm(m: MeshMerger, look: CharacterLook, d: Dims, base: Transform3D, side: float) -> void:
	_p(m, base, DecorKit.sphere(0.085, 10, 5), look.top, Vector3.ZERO)
	_p(m, base, _capsule(0.074, 0.28 * d.h), look.top, Vector3(0, -0.12 * d.h, 0))
	_p(m, base, _capsule(0.06, 0.24 * d.h), look.skin, Vector3(0, -0.31 * d.h, 0))
	var hand_y: float = -0.44 * d.h
	_p(m, base, DecorKit.sphere(0.072, 10, 5), look.skin, Vector3(0, hand_y, 0.01), Vector3.ZERO, Vector3(0.9, 1.0, 1.0))
	# A thumb on the inner side: reads as a hand, not a ball.
	_p(m, base, DecorKit.sphere(0.03, 8, 4), look.skin, Vector3(-side * 0.045, hand_y + 0.025, 0.04), Vector3.ZERO, Vector3(0.8, 1.2, 0.8))
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
	_p(m, base, DecorKit.cyl(0.06, 0.06, 0.05, 10), WHITE, Vector3(0, -d.shin + 0.02, 0))
	# Rounded trainer: soft upper on a slightly darker rounded sole.
	_p(m, base, DecorKit.sphere(0.096, 12, 6), Color("3A3F44"), Vector3(0, -d.shin - 0.035, 0.045), Vector3.ZERO, Vector3(0.95, 0.32, 1.5))
	_p(m, base, DecorKit.sphere(0.095, 12, 6), look.shoes, Vector3(0, -d.shin - 0.005, 0.045), Vector3.ZERO, Vector3(0.9, 0.58, 1.45))


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
