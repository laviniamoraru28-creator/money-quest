@tool
extends ZoneDressing
## Market Town — a sunny town square, deliberately unlike the Golden
## Vault's hall: colourful shopfronts with striped awnings all around (the
## open_air façades), bunting overhead, market stalls piled with fruit and
## bread, baskets and crates waiting to be unpacked, a scales stand for
## comparing, a picture board of price tags, trees in planters, benches and
## lanterns. "Buying, choosing, everyday money" — said by the place itself.
##
## Two optional curiosities: the scales ("compare before you choose") and a
## shopping basket ("needs first, then wants"). The zone's NPCs, quests and
## portals are untouched; the shared outdoor environment stays (no
## EnvironmentOverride), so the square is under the same sky as the Hub.


func _init() -> void:
	district_style = "market_town"


func _build_props(m: MeshMerger, body: StaticBody3D) -> void:
	var h: Vector2 = half()

	# Market stalls around the square, facing its centre.
	var stalls: Array = [
		[Vector3(h.x - 2.4, 0, -3.2), -90.0, "ember", ["coral", "gold", "leaf_light"]],
		[Vector3(h.x - 2.4, 0, 2.4), -90.0, "teal", ["blossom", "coral", "gold"]],
		[Vector3(-h.x + 2.4, 0, 2.6), 90.0, "gold", ["parchment", "wood", "gold_deep"]],   # breads
		[Vector3(-3.4, 0, -h.y + 2.4), 0.0, "sky", ["leaf_light", "leaf", "gold"]],
		[Vector3(5.6, 0, -h.y + 2.4), 0.0, "coral", ["gold", "coral", "lilac"]],
	]
	for s in stalls:
		if is_free(s[0], 1.3):
			DecorProps.market_stall(m, K.xf(s[0], Vector3(0, s[1], 0)), s[2], s[3])
			K.add_box_collider(body, Vector3(2.3, 1.2, 1.0), K.xf(s[0] + Vector3(0, 0.6, 0), Vector3(0, s[1], 0)))
			spot("perch", s[0] + Vector3(0, 2.55, 0))
			# A basket and a crate stack beside some stalls: boxes waiting to
			# be stocked, baskets waiting to be filled.
			var side_off: Vector3 = Basis(Vector3.UP, deg_to_rad(s[1])) * Vector3(1.75, 0, 0.2)
			if is_free(s[0] + side_off, 0.45):
				DecorProps.basket(m, K.xf(s[0] + side_off), ["coral", "gold"] if s[1] < 0.0 else [])
	for c in [Vector3(h.x - 2.0, 0, -0.4), Vector3(-h.x + 2.0, 0, 5.2), Vector3(1.6, 0, -h.y + 1.9)]:
		if is_free(c, 0.8):
			DecorProps.crate_stack(m, K.xf(c, Vector3(0, 20.0 * signf(c.x), 0)), ["leaf_light", "gold"])
			K.add_box_collider(body, Vector3(1.4, 0.8, 0.6), K.xf(c + Vector3(0.35, 0.4, 0)))

	# Trees in planters in the corners and lanterns along the square.
	for tp in [Vector3(-h.x + 1.6, 0, -h.y + 1.6), Vector3(h.x - 1.6, 0, -h.y + 1.6), Vector3(-h.x + 1.6, 0, h.y - 2.6), Vector3(h.x - 1.6, 0, h.y - 2.6)]:
		if is_free(tp, 0.7):
			DecorProps.planter_tree(m, K.xf(tp))
			K.add_box_collider(body, Vector3(1.1, 1.2, 1.1), K.xf(tp + Vector3(0, 0.6, 0)))
			spot("tree", tp + Vector3(0, 2.6, 0))
	for lp in [Vector3(-4.2, 0, 5.6), Vector3(4.2, 0, 5.6), Vector3(-h.x + 1.3, 0, -2.0), Vector3(h.x - 1.3, 0, 5.0), Vector3(h.x - 1.3, 0, -7.0)]:
		if is_free(lp, 0.35):
			DecorProps.lamp(m, K.xf(lp), "coral")
			K.add_cyl_collider(body, 0.25, 3.0, K.xf(lp + Vector3(0, 1.5, 0)))
			spot("perch", lp + Vector3(0, 3.72, 0))
	for bp in [[Vector3(-6.6, 0, 6.0), 180.0], [Vector3(6.6, 0, 6.0), 180.0]]:
		if is_free(bp[0], 0.9):
			DecorProps.bench(m, K.xf(bp[0], Vector3(0, bp[1], 0)))
			K.add_box_collider(body, Vector3(1.8, 0.9, 0.55), K.xf(bp[0] + Vector3(0, 0.45, 0), Vector3(0, bp[1], 0)))

	# A picture board of price tags (shapes, not words) near the back.
	var pb := Vector3(-7.2, 0, -h.y + 1.4)
	if is_free(pb, 0.8):
		DecorProps.picture_board(m, K.xf(pb), "wood_dark", ["coral", "gold", "leaf_light", "sky"])
		K.add_box_collider(body, Vector3(1.6, 2.2, 0.3), K.xf(pb + Vector3(0, 1.1, 0)))

	# Flower tubs: butterflies visit them.
	var rng := RandomNumberGenerator.new()
	rng.seed = 4242
	for fp in [Vector3(-3.6, 0, 6.4), Vector3(3.6, 0, 6.4), Vector3(h.x - 2.2, 0, -6.2)]:
		if is_free(fp, 0.9):
			DecorProps.flower_bed(m, K.xf(fp), rng, 0.6)
			K.add_cyl_collider(body, 0.8, 0.6, K.xf(fp + Vector3(0, 0.3, 0)))
			spot("flower", fp + Vector3(0, 0.6, 0))

	# Curiosities (optional): the scales and a shopping basket.
	if not Engine.is_editor_hint():
		var sp := Vector3(-5.4, 0, 4.8)
		if is_free(sp, 0.6):
			CuriosityProp.make(self, "market_scales", "scales", sp, 30.0, "curio.market_scales.title", "curio.market_scales.text", "tip")
		var bk := Vector3(5.6, 0, 4.2)
		if is_free(bk, 0.5):
			CuriosityProp.make(self, "market_basket", "basket", bk, -20.0, "curio.market_basket.title", "curio.market_basket.text", "bounce")
