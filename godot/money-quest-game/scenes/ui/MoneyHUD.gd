class_name MoneyHUD
extends Node
## MoneyHUD — the HUD's picture layer for money and things you own
## (Universal Play & Learn). Part of the HUD; it never needs reading:
##
## - a gold coin beside the balance (the number is always there; the words
##   "virtual coins" only when words are on);
## - every change shows BEFORE → AFTER right under the balance: a coin and
##   the old number, an arrow, a coin and the new number, with the coins
##   gained (gold) or spent (hollow) drawn as pips — so "I had 10, now I
##   have 6" is visible, not written;
## - coins fly from where they came from (a coin picked up in the world)
##   into the balance, and from the balance to a shop when spending;
## - a bag shows how many different things you own; something bought flies
##   into it.
##
## Reduced Motion: nothing flies or pops — the before → after strip simply
## appears, so the information is identical. Sound is never needed.

const STRIP_SECONDS: float = 3.2

var hud: CanvasLayer
var coin_icon: MoneyIcons.Coin
var bag: Control
var bag_count: Label
var _strip: Control
var _strip_serial: int = 0
## Set before a coin change to make coins fly from there (screen position).
var _fly_from: Vector2 = Vector2(-1, -1)


func setup(p_hud: CanvasLayer, bar: Container, coins_label: Label, before_node: Control) -> void:
	hud = p_hud
	coin_icon = MoneyIcons.Coin.new(30.0)
	coin_icon.name = "CoinIcon"
	coin_icon.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	bar.add_child(coin_icon)
	bar.move_child(coin_icon, coins_label.get_index())
	# The bag: "things that are yours".
	bag = HBoxContainer.new()
	bag.name = "BagView"
	bag.mouse_filter = Control.MOUSE_FILTER_IGNORE
	(bag as HBoxContainer).add_theme_constant_override("separation", 4)
	var bag_icon := MoneyIcons.Bag.new(32.0)
	bag_icon.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	bag.add_child(bag_icon)
	bag_count = Label.new()
	bag_count.add_theme_font_size_override("font_size", 24)
	bag_count.add_theme_color_override("font_color", Color.WHITE)
	bag_count.add_theme_color_override("font_outline_color", UIStyle.INK)
	bag_count.add_theme_constant_override("outline_size", 8)
	bag.add_child(bag_count)
	bar.add_child(bag)
	bar.move_child(bag, before_node.get_index())
	ProgressManager.item_acquired.connect(func(_id: String, _n: int) -> void: refresh_bag(true))
	refresh_bag(false)


## How many different products the child owns.
func owned_kinds() -> int:
	var n: int = 0
	for id in ProgressManager.owned_items:
		if String(id).begins_with("product:"):
			n += 1
	return n


func refresh_bag(pop: bool) -> void:
	var n: int = owned_kinds()
	bag.visible = n > 0
	bag_count.text = str(n)
	if pop:
		_pop(bag)


## Make the next coin change fly coins from this world position.
func coins_from_world(world_pos: Vector3) -> void:
	var cam: Camera3D = hud.get_viewport().get_camera_3d()
	if cam and not cam.is_position_behind(world_pos):
		_fly_from = cam.unproject_position(world_pos)


## Called by the HUD when the balance changes.
func balance_changed(before: int, after: int) -> void:
	if before == after:
		return
	_show_strip(before, after)
	_pop(coin_icon)
	var gained: bool = after > before
	if Settings.reduced_motion:
		_fly_from = Vector2(-1, -1)
		return
	var target: Vector2 = coin_icon.get_global_rect().get_center()
	var n: int = mini(absi(after - before), 6)
	if gained and _fly_from.x >= 0.0:
		for i in n:
			_fly_coin(_fly_from + Vector2(randf_range(-14, 14), randf_range(-14, 14)), target, i * 0.08)
	elif not gained:
		# Spending: coins leave the balance and fall away toward the shop.
		var away: Vector2 = target + Vector2(0, 160)
		if _fly_from.x >= 0.0:
			away = _fly_from
		for i in n:
			_fly_coin(target, away + Vector2(randf_range(-20, 20), 0), i * 0.08)
	_fly_from = Vector2(-1, -1)


## An item's picture flies from the world (or the screen centre) into the bag.
func item_to_bag(shape: String, tint: Color, from_world: Vector3 = Vector3.INF) -> void:
	refresh_bag(false)
	if Settings.reduced_motion or not bag.visible:
		return
	var icon := ItemVisual.Icon.new()
	icon.shape = shape
	icon.tint = tint
	icon.custom_minimum_size = Vector2(56, 56)
	icon.size = Vector2(56, 56)
	hud.add_child(icon)
	var start: Vector2 = hud.get_viewport().get_visible_rect().size * 0.5
	var cam: Camera3D = hud.get_viewport().get_camera_3d()
	if from_world != Vector3.INF and cam and not cam.is_position_behind(from_world):
		start = cam.unproject_position(from_world)
	icon.position = start - icon.size * 0.5
	var end: Vector2 = bag.get_global_rect().get_center() - icon.size * 0.5
	var tw := icon.create_tween()
	tw.tween_property(icon, "position", end, 0.8).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN_OUT)
	tw.parallel().tween_property(icon, "scale", Vector2.ONE * 0.5, 0.8)
	tw.tween_callback(icon.queue_free)
	tw.tween_callback(func() -> void: _pop(bag))


# --- pieces ------------------------------------------------------------------------

## BEFORE → AFTER under the balance: [coin] 10  →  [coin] 6, and the change
## as pips (gold = gained, hollow = spent).
func _show_strip(before: int, after: int) -> void:
	if _strip and is_instance_valid(_strip):
		_strip.queue_free()
	_strip_serial += 1
	var serial: int = _strip_serial
	var panel := PanelContainer.new()
	panel.name = "CoinChip"
	panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var sb := UIStyle.panel(UIStyle.GOLD, 14)
	sb.content_margin_left = 12
	sb.content_margin_right = 12
	sb.content_margin_top = 6
	sb.content_margin_bottom = 6
	panel.add_theme_stylebox_override("panel", sb)
	var row := HBoxContainer.new()
	row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_theme_constant_override("separation", 8)
	panel.add_child(row)
	row.add_child(_amount(before))
	row.add_child(MoneyIcons.Arrow.new(28.0))
	row.add_child(_amount(after))
	var diff := MoneyIcons.Pips.new()
	diff.coin_px = 16.0
	if after > before:
		diff.filled = after - before
	else:
		diff.hollow = before - after
	diff.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	var sign := Label.new()
	sign.text = ("+" if after > before else "−") + str(absi(after - before))
	sign.add_theme_font_size_override("font_size", 20)
	sign.add_theme_color_override("font_color", UIStyle.TEAL_DARK if after > before else Color("8E3B26"))
	row.add_child(sign)
	row.add_child(diff)
	hud.add_child(panel)
	_strip = panel
	# Just after the top bar (never over the mission card); XP chips go below.
	var sb_btn: Control = hud.settings_button
	panel.position = Vector2(sb_btn.global_position.x + sb_btn.size.x + 14.0, maxf(sb_btn.global_position.y - 6.0, 4.0))
	if not Settings.reduced_motion:
		panel.modulate.a = 0.0
		panel.create_tween().tween_property(panel, "modulate:a", 1.0, 0.2)
	await hud.get_tree().create_timer(STRIP_SECONDS).timeout
	if serial == _strip_serial and is_instance_valid(panel):
		panel.queue_free()


func _amount(n: int) -> HBoxContainer:
	var h := HBoxContainer.new()
	h.mouse_filter = Control.MOUSE_FILTER_IGNORE
	h.add_theme_constant_override("separation", 4)
	var c := MoneyIcons.Coin.new(24.0)
	c.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	h.add_child(c)
	var l := Label.new()
	l.text = str(n)
	l.add_theme_font_size_override("font_size", 24)
	l.add_theme_color_override("font_color", UIStyle.INK)
	h.add_child(l)
	return h


func _fly_coin(from: Vector2, to: Vector2, delay: float) -> void:
	var c := MoneyIcons.Coin.new(26.0)
	c.size = Vector2(26, 26)
	c.position = from - c.size * 0.5
	c.modulate.a = 0.0
	hud.add_child(c)
	var tw := c.create_tween()
	tw.tween_interval(delay)
	tw.tween_property(c, "modulate:a", 1.0, 0.05)
	tw.tween_property(c, "position", to - c.size * 0.5, 0.6).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	tw.tween_callback(c.queue_free)


func _pop(ctl: Control) -> void:
	if ctl == null or Settings.reduced_motion or not ctl.is_inside_tree():
		return
	ctl.pivot_offset = ctl.size * 0.5
	var tw := ctl.create_tween()
	tw.tween_property(ctl, "scale", Vector2.ONE * 1.3, 0.1)
	tw.tween_property(ctl, "scale", Vector2.ONE, 0.2)
