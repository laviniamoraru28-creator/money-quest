extends CanvasLayer
## RewardPopup — the celebration when something is finished. Short, warm
## and clear:
##   WELL DONE!            (a title: "Well done!", "Quest complete!"...)
##   Saving Superstar       (what you achieved — the reward message)
##   +30 XP   ·   4 virtual coins
##   New badge: Golden Coin Badge   (only when one was earned)
##   Level 2!                        (only when the level went up)
## with a fanfare, the XP counting up, and a little confetti. With Reduced
## Motion everything simply appears (no bounce, no count, no confetti).
## Coins are always labelled virtual (money.virtual_coins) so a child never
## reads them as real money.

@onready var panel: PanelContainer = $Panel
@onready var message_label: Label = $Panel/VBox/MessageLabel
@onready var rewards_label: Label = $Panel/VBox/RewardsLabel
@onready var continue_button: Button = $Panel/VBox/ContinueButton

signal continued

var title_label: Label
var extra_label: Label
var _confetti: CPUParticles2D


func _ready() -> void:
	visible = false
	continue_button.pressed.connect(func(): continued.emit())
	panel.add_theme_stylebox_override("panel", UIStyle.panel(UIStyle.GOLD, 26))
	panel.offset_left = -320.0
	panel.offset_right = 320.0
	panel.offset_top = -220.0
	panel.offset_bottom = 220.0
	panel.pivot_offset = Vector2(320, 220)
	var vbox: VBoxContainer = $Panel/VBox
	title_label = UIStyle.label("", 40, UIStyle.TEAL_DARK)
	title_label.name = "TitleLabel"
	title_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(title_label)
	vbox.move_child(title_label, 0)
	message_label.add_theme_font_size_override("font_size", 28)
	message_label.add_theme_color_override("font_color", UIStyle.INK)
	rewards_label.add_theme_font_size_override("font_size", 30)
	rewards_label.add_theme_color_override("font_color", Color("9A5B00"))
	extra_label = UIStyle.label("", UIStyle.TEXT, UIStyle.TEAL_DARK)
	extra_label.name = "ExtraLabel"
	extra_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	extra_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	vbox.add_child(extra_label)
	vbox.move_child(extra_label, rewards_label.get_index() + 1)
	var styled := UIStyle.button("")
	for state in ["normal", "hover", "pressed", "disabled"]:
		continue_button.add_theme_stylebox_override(state, styled.get_theme_stylebox(state))
	for c in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color", "font_hover_pressed_color"]:
		continue_button.add_theme_color_override(c, Color.WHITE)
	continue_button.add_theme_font_size_override("font_size", UIStyle.BUTTON)
	styled.free()
	_confetti = CPUParticles2D.new()
	_confetti.name = "Confetti"
	_confetti.emitting = false
	_confetti.one_shot = true
	_confetti.amount = 70
	_confetti.lifetime = 1.6
	_confetti.explosiveness = 0.85
	_confetti.direction = Vector2(0, -1)
	_confetti.spread = 70.0
	_confetti.initial_velocity_min = 260.0
	_confetti.initial_velocity_max = 480.0
	_confetti.gravity = Vector2(0, 520)
	_confetti.scale_amount_min = 5.0
	_confetti.scale_amount_max = 9.0
	var ramp := Gradient.new()
	ramp.set_color(0, Color("E8A33D"))
	ramp.set_color(1, Color("0F7A6B"))
	ramp.add_point(0.5, Color("F07A5A"))
	_confetti.color_initial_ramp = ramp
	add_child(_confetti)


## The original API (lessons and quests): message + XP + virtual coins.
func show_reward(message_key: String, xp: int, coins: int) -> void:
	await celebrate("reward.well_done", message_key, xp, coins)


## The full celebration. `badge_key`: a badge name key to announce (or "").
func celebrate(title_key: String, message_key: String, xp: int, coins: int, badge_key: String = "") -> void:
	var level_before: int = GameState.compute_level() - _pending_level_delta(xp)
	title_label.text = Localization.t(title_key)
	message_label.text = Localization.t(message_key)
	_set_rewards(xp if Settings.reduced_motion else 0, xp, coins)
	var extras: PackedStringArray = []
	if not badge_key.is_empty():
		extras.append(Localization.t("reward.new_badge", {"badge": Localization.t(badge_key)}))
	if GameState.compute_level() > level_before:
		extras.append(Localization.t("reward.level_up", {"level": GameState.compute_level()}))
	extra_label.text = "\n".join(extras)
	extra_label.visible = not extras.is_empty()
	continue_button.text = InputHints.prompt(Localization.t("common.nice_button"), "confirm")

	visible = true
	UIFocus.focus(continue_button)
	AudioManager.play_sfx("fanfare")
	AudioManager.narrate("%s %s" % [title_label.text, message_label.text])
	if not Settings.reduced_motion:
		panel.scale = Vector2(0.85, 0.85)
		create_tween().tween_property(panel, "scale", Vector2.ONE, 0.3).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		_confetti.position = get_viewport().get_visible_rect().size * Vector2(0.5, 0.42)
		_confetti.restart()
		_confetti.emitting = true
		if xp > 0:
			var tw := create_tween()
			tw.tween_method(func(v: int): _set_rewards(v, xp, coins), 0, xp, 0.9)
			tw.tween_callback(func(): AudioManager.play_sfx("xp", 1.0, -6.0))
	else:
		panel.scale = Vector2.ONE
	if extra_label.visible:
		AudioManager.play_sfx("level_up", 1.0, -6.0)
	await continued
	visible = false


## What the Listen control reads: the whole celebration.
func listen_text() -> String:
	if not visible:
		return ""
	return " ".join([title_label.text, message_label.text, rewards_label.text, extra_label.text if extra_label.visible else ""]).strip_edges()


func _set_rewards(xp_shown: int, _xp: int, coins: int) -> void:
	var parts: PackedStringArray = []
	if _xp > 0:
		parts.append("+" + Localization.t("reward.xp_earned", {"amount": xp_shown}))
	if coins > 0:
		parts.append(Localization.tn("money.virtual_coins", coins))
	rewards_label.text = "   ·   ".join(parts)
	rewards_label.visible = not parts.is_empty()


## XP is usually added just before the celebration; this lets "Level up!"
## compare against the level before that XP arrived.
func _pending_level_delta(xp: int) -> int:
	var before: int = int(floor((GameState.xp_total - xp) / 100.0)) + 1
	return GameState.compute_level() - before
