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
	# On its own layer under the HUD (9) and this card (12), above the world:
	# the burst shows around them, never over the card's words or the HUD.
	var confetti_layer := CanvasLayer.new()
	confetti_layer.name = "ConfettiLayer"
	confetti_layer.layer = 8
	add_child(confetti_layer)
	confetti_layer.add_child(_confetti)
	_build_words_off(vbox)


# --- words off: the card speaks in pictures and numbers ------------------------------
# ✓ instead of the title; the sentence steps aside (Listen still reads it);
# the rewards as "+15 XP" and a coin with its number (as the HUD shows coins);
# a new level as "Level 2" (the HUD's own words); Continue as an arrow (as in
# the dialogue box). With words on, nothing changes.
var _tick_box: CenterContainer
var _pictures: HBoxContainer
var _xp_label: Label
var _coin_strip: MissionStrip
var _arrow: Control


func _build_words_off(vbox: VBoxContainer) -> void:
	_tick_box = CenterContainer.new()
	_tick_box.name = "DoneTick"
	_tick_box.add_child(MoneyIcons.Tick.new(64.0))
	_tick_box.visible = false
	vbox.add_child(_tick_box)
	vbox.move_child(_tick_box, 0)
	_pictures = HBoxContainer.new()
	_pictures.name = "RewardPictures"
	_pictures.alignment = BoxContainer.ALIGNMENT_CENTER
	_pictures.add_theme_constant_override("separation", 22)
	_pictures.visible = false
	_xp_label = UIStyle.label("", 30, Color("9A5B00"))
	_pictures.add_child(_xp_label)
	_coin_strip = MissionStrip.new(56.0)
	_pictures.add_child(_coin_strip)
	vbox.add_child(_pictures)
	vbox.move_child(_pictures, rewards_label.get_index() + 1)
	_arrow = MoneyIcons.Arrow.new(40.0)
	_arrow.name = "ContinueArrow"
	_arrow.set_anchors_preset(Control.PRESET_CENTER)
	_arrow.offset_left = -20.0
	_arrow.offset_right = 20.0
	_arrow.offset_top = -20.0
	_arrow.offset_bottom = 20.0
	_arrow.visible = false
	continue_button.add_child(_arrow)


## Shows the card in words or in pictures (SupportProfile.show_text()). The
## words are always set, so Listen / read-aloud say the whole thing.
func _apply_words(xp: int, coins: int, level_up: int, badge_line: String) -> void:
	var words: bool = SupportProfile.show_text()
	_tick_box.visible = not words
	title_label.visible = words
	message_label.visible = words and not message_label.text.is_empty()
	rewards_label.visible = words and not rewards_label.text.is_empty()
	_pictures.visible = not words and (xp > 0 or coins > 0)
	_xp_label.visible = xp > 0
	_coin_strip.show_tokens(["coin", "num:%d" % coins] if coins > 0 else [], {})
	_coin_strip.visible = coins > 0
	if not words:
		var short: PackedStringArray = []
		if not badge_line.is_empty():
			short.append(badge_line)
		if level_up > 0:
			short.append(Localization.t("hud.level_label", {"level": level_up}))
		extra_label.text = "\n".join(short)
		extra_label.visible = not short.is_empty()
	continue_button.text = InputHints.prompt(Localization.t("common.nice_button"), "confirm") if words else ""
	_arrow.visible = not words


## The original API (lessons and quests): message + XP + virtual coins.
## `level_at_start` (optional): the level when the quest / lesson began, so a
## level reached during it (e.g. from a choice's XP) is announced too.
func show_reward(message_key: String, xp: int, coins: int, level_at_start: int = -1) -> void:
	await celebrate("reward.well_done", message_key, xp, coins, "", level_at_start)


## Whether the last card was a milestone (full) or compact (tests read it).
var last_was_milestone: bool = false


## The celebration. `badge_key`: a badge name key to announce (or "").
func celebrate(title_key: String, message_key: String, xp: int, coins: int, badge_key: String = "", level_at_start: int = -1) -> void:
	var level_before: int = level_at_start if level_at_start > 0 else GameState.compute_level() - _pending_level_delta(xp)
	title_label.text = Localization.t(title_key)
	message_label.text = Localization.t(message_key) if not message_key.is_empty() else ""
	message_label.visible = not message_label.text.is_empty()
	_set_rewards(xp if Settings.reduced_motion else 0, xp, coins)
	var extras: PackedStringArray = []
	if not badge_key.is_empty():
		extras.append(Localization.t("reward.new_badge", {"badge": Localization.t(badge_key)}))
	if GameState.compute_level() > level_before:
		extras.append(Localization.t("reward.level_up", {"level": GameState.compute_level()}))
	extra_label.text = "\n".join(extras)
	extra_label.visible = not extras.is_empty()
	continue_button.text = InputHints.prompt(Localization.t("common.nice_button"), "confirm")
	var new_level: int = GameState.compute_level() if GameState.compute_level() > level_before else 0
	_apply_words(xp, coins, new_level, extras[0] if not badge_key.is_empty() else "")
	# A real milestone (a new badge, a new level) gets the full celebration;
	# a routine finish a calm, compact one: the same card and words, no
	# fanfare, confetti or pop. Rewards back the learning, they are not it.
	var milestone: bool = not extras.is_empty()
	last_was_milestone = milestone
	# The card is as tall as what it says (never cut: measured after the
	# words are in, so larger text sizes still fit) — a milestone too, so a
	# words-off card is never half empty; the milestone keeps its fanfare,
	# confetti and level line.
	panel.offset_top = -220.0
	panel.offset_bottom = 220.0
	# Measured laid out at its real width (a hidden card measures wrapped
	# text one word per line): shown fully transparent, its button off, for
	# two frames — nothing can be pressed or seen — then sized and revealed.
	panel.modulate.a = 0.0
	continue_button.disabled = true
	visible = true
	await get_tree().process_frame
	await get_tree().process_frame
	var h: float = clampf(panel.get_combined_minimum_size().y, 260.0, 440.0)
	panel.offset_top = -h * 0.5
	panel.offset_bottom = h * 0.5
	panel.modulate.a = 1.0
	continue_button.disabled = false
	panel.pivot_offset = Vector2(320.0, h * 0.5)   # the pop scales from the card's centre

	visible = true
	UIFocus.focus(continue_button)
	AudioManager.play_sfx("fanfare" if milestone else "success", 1.0, 0.0 if milestone else -4.0)
	AudioManager.narrate("%s %s" % [title_label.text, message_label.text])
	if not milestone:
		panel.scale = Vector2.ONE
		_set_rewards(xp, xp, coins)
	elif not Settings.reduced_motion:
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
	rewards_label.visible = not parts.is_empty() and SupportProfile.show_text()
	if _xp_label:
		_xp_label.text = "+" + Localization.t("reward.xp_earned", {"amount": xp_shown})


## XP is usually added just before the celebration; this lets "Level up!"
## compare against the level before that XP arrived.
func _pending_level_delta(xp: int) -> int:
	var before: int = int(floor((GameState.xp_total - xp) / 100.0)) + 1
	return GameState.compute_level() - before
