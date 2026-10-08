class_name Feedback
extends RefCounted
## Feedback — one consistent way to say how it went, in pictures first,
## for every activity (the same symbols everywhere, so a child learns them
## once):
##
##   success(host, tokens)        ✓ + what was achieved      "it worked"
##   not_yet(host, tokens)        ↻ + why (e.g. lock, 18)    "not yet — look"
##   changed(host, rows)          [before] → [after] ✓       "this changed"
##   try_again_button(word)       a ↻ button, words optional
##
## Never a red cross, a buzzer or a "wrong!": a "not yet" shows the reason
## and invites another try. Each comes with a soft sound (never needed: the
## picture says the same) and respects Reduced Motion (no pop, no fade).
## Cards sit beside the mission card, never over it, and go by themselves.

const SECONDS: float = 2.6


static func success(host: Node, tokens: Array = [], key: String = "", params: Dictionary = {}) -> void:
	AudioManager.play_sfx("success", 1.0, -5.0)
	await _card(host, ["tick"] + tokens, UIStyle.TEAL, key, params, "FeedbackSuccess")


static func not_yet(host: Node, tokens: Array = [], key: String = "", params: Dictionary = {}) -> void:
	AudioManager.play_sfx("retry", 1.0, -8.0)
	await _card(host, ["retry"] + tokens, UIStyle.GOLD, key, params, "FeedbackNotYet")


static func changed(host: Node, rows: Array, key: String = "", params: Dictionary = {}, story: bool = false) -> void:
	await ResourcePurpose.show_change(host, rows, key, params, story)


## A "try again" button: the ↻ picture, plus the word when words are on.
static func try_again_button(primary: bool = false) -> Button:
	var words: bool = SupportProfile.show_text()
	var b := UIStyle.button(Localization.t("feedback.try_again") if words else "", primary)
	b.name = "TryAgainButton"
	b.custom_minimum_size = Vector2(150 if words else 96, 64)
	var g := MissionStrip.Glyph.new("retry", 44.0)
	g.set_anchors_preset(Control.PRESET_CENTER_LEFT if words else Control.PRESET_CENTER)
	g.offset_left = 10.0 if words else -22.0
	g.offset_top = -22.0
	g.offset_right = g.offset_left + 44.0
	g.offset_bottom = 22.0
	b.add_child(g)
	if words:
		b.add_theme_constant_override("h_separation", 0)
		b.text = "      " + b.text
	return b


static func _card(host: Node, tokens: Array, accent: Color, key: String, params: Dictionary, node_name: String) -> void:
	var hud: Node = host.get_tree().get_first_node_in_group("mq_hud")
	if hud == null:
		return
	# A new result replaces the last one (right or not yet), never stacks on it.
	for n in ["FeedbackSuccess", "FeedbackNotYet", node_name]:
		var old: Node = hud.get_node_or_null(n)
		if old:
			old.free()
	var panel := PanelContainer.new()
	panel.name = node_name
	panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	panel.add_theme_stylebox_override("panel", UIStyle.panel(accent, 18))
	var v := VBoxContainer.new()
	v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	panel.add_child(v)
	var strip := MissionStrip.new(60.0)
	strip.show_tokens(tokens, params)
	strip.alignment = BoxContainer.ALIGNMENT_CENTER
	v.add_child(strip)
	if not key.is_empty() and SupportProfile.show_text():
		var l := UIStyle.label(Localization.t(key, params), UIStyle.TEXT)
		l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		v.add_child(l)
		AudioManager.narrate(l.text)
	hud.add_child(panel)
	panel.reset_size()
	var vp: Vector2 = panel.get_viewport_rect().size
	var pos := Vector2((vp.x - panel.size.x) * 0.5, vp.y * 0.18)
	var op: Control = hud.get("objective_panel")
	if op and op.visible and Rect2(pos, panel.size).intersects(op.get_global_rect()):
		pos.x = op.get_global_rect().end.x + 16.0
	panel.position = pos
	if not Settings.reduced_motion:
		panel.pivot_offset = panel.size * 0.5
		panel.scale = Vector2.ONE * 0.7
		panel.create_tween().tween_property(panel, "scale", Vector2.ONE, 0.2).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	await hud.get_tree().create_timer(SECONDS).timeout
	if is_instance_valid(panel):
		panel.queue_free()
