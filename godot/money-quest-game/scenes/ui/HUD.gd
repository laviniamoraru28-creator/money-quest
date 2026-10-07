extends CanvasLayer
## HUD — the small always-visible top bar (virtual coin balance, level,
## and a Settings button) plus a mobile-friendly "Talk" button. Purely
## reactive to GameState's signals for the coin/level display; never
## queries anything itself on a timer, so it can never show a stale value.
##
## The Talk button mirrors InteractionManager.try_interact()'s own doc
## comment ("a lesson scene can also call try_interact() directly from an
## on-screen Talk button tap") — this is that button, finally wired up. It
## only appears once something is actually in range to interact with
## (InteractionManager.nearest_interaction_changed), never as a dead
## button with nothing for it to do. Since WorldManager swaps in a brand
## new Player (and a brand new InteractionManager) on every zone change,
## HUD re-acquires the reference each time via WorldManager.zone_loaded —
## HUD itself is the one node in this project that is NOT re-instantiated
## per zone (see Main.tscn), so this reconnect is necessary, not optional.
##
## Guidance layer (vertical slice), all shared by every zone:
## - the large prompt pill over whatever is in reach ("Talk  E / A / Click",
##   InputHints), hidden while any panel is open; NPCs use it too;
## - the mission card (ObjectivePanel) with a "?" for "What am I doing?"
##   (HelpPanel; also the help control H / Y), shown once a zone sets a
##   mission (ObjectiveManager) and only after the place's name banner;
## - the "Where am I?" ZoneBanner on every arrival, the "Need a little
##   help?" HintToast (GuidanceSystem), SubtitleLine for spoken lines, and
##   ScreenFade for being brought back to safe ground (PlayerSafety).

const SETTINGS_MENU_SCENE: PackedScene = preload("res://scenes/menus/SettingsMenu.tscn")

@onready var coins_label: Label = $Bar/CoinsLabel
@onready var level_label: Label = $Bar/LevelLabel
@onready var settings_button: Button = $Bar/SettingsButton
@onready var talk_button: Button = $TalkButton

var _current_interaction_manager: InteractionManager = null

## World interaction UI (Phase 5) — one shared set for every zone:
## a small prompt "pill" over whatever is in reach (tap/click it, press
## E / Space, or the gamepad's A button), the InteractionCard, and a short
## non-blocking toast for the first visit to a district.
var _card: InteractionCard
## Looking, choosing and buying at a stall (Phase 6).
var shop_card: ShopCard
var _pill: Button
## The big entry card for important places (Destinations) — used instead of
## the pill when the thing in reach is a door to one of them.
var destination_prompt: DestinationPrompt
var _toast: PanelContainer
var _toast_title: Label
var _toast_text: Label
var _toast_serial: int = 0
var _last_xp: int = -1
var _last_coins: int = -1
## The picture layer for money and owned things (coin, before → after, bag).
var money_hud: MoneyHUD

## Guidance UI (vertical slice): the mission card, the "Where am I?"
## banner, the help offer, subtitles and the soft screen fade used when the
## player is brought back to safe ground. The help panel opens on demand.
signal show_way_requested
var objective_panel: ObjectivePanel
var zone_banner: ZoneBanner
var hint_toast: HintToast
var subtitle_line: SubtitleLine
var screen_fade: ScreenFade
var _help_panel: HelpPanel


func _ready() -> void:
	add_to_group("mq_hud")
	_build_interaction_ui()
	_build_guidance_ui()
	GameState.coins_changed.connect(_on_coins_changed)
	GameState.xp_changed.connect(_on_xp_changed)
	Localization.locale_changed.connect(func(_l): _refresh())
	WorldManager.zone_loaded.connect(_on_zone_loaded)
	settings_button.pressed.connect(_on_settings_pressed)
	talk_button.pressed.connect(_on_talk_pressed)
	_refresh()


func _refresh() -> void:
	_on_coins_changed(GameState.wallet.balance)
	_on_xp_changed(GameState.xp_total)
	settings_button.text = Localization.t("common.settings_button")
	talk_button.text = Localization.t("hud.talk_button")


func _on_coins_changed(new_balance: int) -> void:
	if _last_coins >= 0 and new_balance != _last_coins and money_hud:
		money_hud.balance_changed(_last_coins, new_balance)
	_last_coins = new_balance
	# Always the number (beside a gold coin); the words only when words are on.
	coins_label.text = Localization.tn("money.virtual_coins", new_balance) if SupportProfile.show_text() else str(new_balance)


func _on_xp_changed(new_total: int) -> void:
	level_label.text = Localization.t("hud.level_label", {"level": GameState.compute_level()})
	if _last_xp >= 0 and new_total > _last_xp:
		_show_chip(Localization.t("hud.xp_gain", {"xp": new_total - _last_xp}), level_label)
	_last_xp = new_total


## "+30 XP" beside the level for a moment: words, not only a sound. It
## floats up a little and fades, or simply appears and goes with Reduced
## Motion.
func _show_chip(text: String, beside: Control) -> void:
	var chip := UIStyle.label(text, 22, Color("FFE7A0"))
	chip.name = "XpChip" if beside == level_label else "CoinChip"
	chip.mouse_filter = Control.MOUSE_FILTER_IGNORE
	chip.add_theme_color_override("font_outline_color", UIStyle.INK)
	chip.add_theme_constant_override("outline_size", 8)
	add_child(chip)
	# Just after the top bar (never over the next label), coins above XP.
	var end_x: float = settings_button.global_position.x + settings_button.size.x + 14.0
	chip.global_position = Vector2(end_x, settings_button.global_position.y + (0.0 if beside == coins_label else 52.0))
	var tw := create_tween()
	if Settings.reduced_motion:
		tw.tween_interval(2.4)
	else:
		tw.tween_property(chip, "position:y", chip.position.y - 14.0, 2.2).set_trans(Tween.TRANS_SINE)
		tw.parallel().tween_property(chip, "modulate:a", 0.0, 0.6).set_delay(1.8)
	tw.tween_callback(chip.queue_free)


func _on_zone_loaded(_zone_data: ZoneData) -> void:
	_last_xp = GameState.xp_total
	_last_coins = GameState.wallet.balance
	shop_card.close()
	zone_banner.show_zone(_zone_data)
	hint_toast.dismiss()
	# Arriving somewhere new: nothing from the last place stays on screen,
	# and the mission card waits until the place's name has been shown.
	_toast_serial += 1
	_toast.visible = false
	_pill.visible = false
	destination_prompt.hide_prompt()
	objective_panel.hold(ZoneBanner.SHOW_SECONDS)
	if _current_interaction_manager and _current_interaction_manager.nearest_interaction_changed.is_connected(_on_nearest_interaction_changed):
		_current_interaction_manager.nearest_interaction_changed.disconnect(_on_nearest_interaction_changed)

	var player: Node = _live_player()
	if player == null:
		_current_interaction_manager = null
		talk_button.visible = false
		return

	_current_interaction_manager = player.interaction_manager
	_current_interaction_manager.nearest_interaction_changed.connect(_on_nearest_interaction_changed)
	talk_button.visible = _current_interaction_manager.get_nearest() != null
	_card.close()
	set_process(_current_interaction_manager.has_any())


func _on_nearest_interaction_changed(interaction: Interaction) -> void:
	talk_button.visible = interaction != null and (InputHints.device == InputHints.TOUCH or interaction.has_node("PromptLabel"))
	set_process(interaction != null)
	if interaction == null:
		_pill.visible = false
		destination_prompt.hide_prompt()
		_place_bottom_ui()


## Keeps the prompt pill over the most relevant thing in reach. Runs only
## while something is in reach (set_process above).
func _process(_delta: float) -> void:
	var im := _current_interaction_manager
	if im == null or not is_instance_valid(im):
		_pill.visible = false
		destination_prompt.hide_prompt()
		set_process(false)
		return
	var target: Interaction = im.get_nearest()
	if target == null:
		_pill.visible = false
		destination_prompt.hide_prompt()
		return
	var prompt: String = Localization.t(target.prompt_text_key)
	talk_button.text = prompt
	# Objects that still show their own floating prompt (books, exhibits)
	# keep it — never two prompts for one thing. NPCs use this pill.
	var cam: Camera3D = get_viewport().get_camera_3d()
	var anchor: Vector3 = target.global_position + Vector3.UP * target.prompt_height
	# No prompt while a dialogue, choice, reward or menu is open.
	if _modal_open():
		_pill.visible = false
		destination_prompt.hide_prompt()
		talk_button.visible = false
		return
	# The door to an important place: the big fixed entry card instead of
	# the small floating pill (and no separate touch Talk button — the card
	# itself is the button).
	var place: String = _destination_of(target)
	if not place.is_empty():
		_pill.visible = false
		talk_button.visible = false
		destination_prompt.show_for(place, WorldManager.get_zone(place) != null and not WorldManager.is_zone_unlocked(place))
		_place_bottom_ui()
		return
	if destination_prompt.visible:
		destination_prompt.hide_prompt()
		_place_bottom_ui()
	if _card.is_open_for(target) or _has_own_prompt(target) or cam == null or cam.is_position_behind(anchor):
		_pill.visible = false
		talk_button.visible = not _card.is_open_for(target)
		return
	_pill.text = InputHints.prompt(prompt)
	_pill.reset_size()
	var p: Vector2 = cam.unproject_position(anchor) - Vector2(_pill.size.x * 0.5, _pill.size.y)
	var vp: Vector2 = get_viewport().get_visible_rect().size
	_pill.position = Vector2(clampf(p.x, 8.0, vp.x - _pill.size.x - 8.0), clampf(p.y, 64.0, vp.y - _pill.size.y - 8.0))
	_pill.visible = true
	talk_button.visible = InputHints.device == InputHints.TOUCH


## The destination a portal in reach leads to, when it is one of the
## important places that get the big entry prompt (else "").
func _destination_of(target: Interaction) -> String:
	if not (target is PortalInteraction):
		return ""
	var zone_id: String = (target as PortalInteraction).target_zone_id
	return zone_id if Destinations.wants_prompt(zone_id) else ""


## Keeps the bottom-of-screen pieces from covering each other: the entry
## card sits above a "Need a little help?" offer, and subtitles above both.
func _place_bottom_ui() -> void:
	var bottom: float = 24.0
	if hint_toast.visible:
		bottom = 30.0 + hint_toast.size.y + 12.0
	if destination_prompt.visible:
		destination_prompt.place(bottom)
	var sub: float = 120.0
	if destination_prompt.visible:
		sub = maxf(sub, bottom + destination_prompt.size.y + 14.0)
	subtitle_line.offset_bottom = -sub


func _modal_open() -> bool:
	return DialogueBox.visible or ChoicePanel.visible or RewardPopup.visible or is_instance_valid(_help_panel) or UIFocus.visible_focus(get_viewport()) != null


func _has_own_prompt(target: Interaction) -> bool:
	var label: Node = target.get_node_or_null("PromptLabel")
	return label != null and label.visible


## A short, non-blocking "you found a new place" note (first visit only —
## see HubInteractions). It never stops the player and fades by itself;
## with Reduced Motion it simply appears and disappears.
func show_discovery(title: String, text: String) -> void:
	_toast_title.text = title
	_toast_text.text = text
	_toast.visible = true
	_toast_serial += 1
	var serial: int = _toast_serial
	if not Settings.reduced_motion:
		_toast.modulate.a = 0.0
		create_tween().tween_property(_toast, "modulate:a", 1.0, 0.4)
	else:
		_toast.modulate.a = 1.0
	await get_tree().create_timer(4.5).timeout
	if serial != _toast_serial:
		return
	if not Settings.reduced_motion:
		var tw := create_tween()
		tw.tween_property(_toast, "modulate:a", 0.0, 0.6)
		await tw.finished
	if serial == _toast_serial:
		_toast.visible = false


func _build_interaction_ui() -> void:
	_card = InteractionCard.new()
	_card.name = "InteractionCard"
	add_child(_card)
	shop_card = ShopCard.new()
	shop_card.name = "ShopCard"
	add_child(shop_card)
	shop_card.visibility_changed.connect(_on_shop_card_visibility)

	_pill = Button.new()
	_pill.name = "InteractionPrompt"
	_pill.visible = false
	_pill.custom_minimum_size = Vector2(0, 58)
	_pill.focus_mode = Control.FOCUS_NONE
	_pill.add_theme_font_size_override("font_size", 26)
	for state in ["normal", "hover", "pressed"]:
		var sb := StyleBoxFlat.new()
		sb.bg_color = Color("FBF8EF") if state != "pressed" else Color("EDE6D3")
		sb.set_corner_radius_all(29)
		sb.border_color = Color("0F7A6B")
		sb.set_border_width_all(3 if state == "normal" else 4)
		sb.content_margin_left = 24
		sb.content_margin_right = 24
		_pill.add_theme_stylebox_override(state, sb)
	for c in ["font_color", "font_hover_color", "font_pressed_color"]:
		_pill.add_theme_color_override(c, Color("1C2624"))
	_pill.pressed.connect(_on_talk_pressed)
	add_child(_pill)

	_toast = PanelContainer.new()
	_toast.name = "DiscoveryToast"
	_toast.visible = false
	_toast.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_toast.anchor_left = 0.5
	_toast.anchor_right = 0.5
	_toast.grow_horizontal = Control.GROW_DIRECTION_BOTH
	_toast.offset_top = 64.0
	var tsb := StyleBoxFlat.new()
	tsb.bg_color = Color("FBF8EF")
	tsb.set_corner_radius_all(16)
	tsb.border_color = Color("E8A33D")
	tsb.border_width_bottom = 4
	tsb.content_margin_left = 22
	tsb.content_margin_right = 22
	tsb.content_margin_top = 10
	tsb.content_margin_bottom = 10
	_toast.add_theme_stylebox_override("panel", tsb)
	var tbox := VBoxContainer.new()
	_toast.add_child(tbox)
	_toast_title = Label.new()
	_toast_title.add_theme_font_size_override("font_size", 22)
	_toast_title.add_theme_color_override("font_color", Color("1C2624"))
	_toast_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	tbox.add_child(_toast_title)
	_toast_text = Label.new()
	_toast_text.add_theme_font_size_override("font_size", 18)
	_toast_text.add_theme_color_override("font_color", Color("1C2624"))
	_toast_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	tbox.add_child(_toast_text)
	add_child(_toast)
	set_process(false)


func _on_talk_pressed() -> void:
	var player: Node = _live_player()
	if player:
		player.request_interact()


## The current zone's player. When a new zone reports loaded, the previous
## zone (queued for deletion until the end of the frame) is still in the
## tree and its player comes first in the group — never connect to that one.
func _live_player() -> Node:
	for p in get_tree().get_nodes_in_group("player"):
		var n: Node = p
		while n != null and not n.is_queued_for_deletion():
			n = n.get_parent()
		if n == null:
			return p
	return null


## Gamepad route into the HUD: with nothing focused (exploring the world),
## D-pad up puts focus on the Settings button, A opens it and B leaves the
## HUD again. Keyboard arrows and the left stick still only move the player,
## and nothing here runs per frame.
func _unhandled_input(event: InputEvent) -> void:
	var focus: Control = get_viewport().gui_get_focus_owner()
	# The help control (H / Y): accept a pending "Need a little help?" offer,
	# otherwise open "What am I doing?".
	if event.is_action_pressed("help") and UIFocus.visible_focus(get_viewport()) == null:
		get_viewport().set_input_as_handled()
		if hint_toast.visible:
			hint_toast.accept()
		else:
			open_help()
		return
	if focus == null and event is InputEventJoypadButton and event.pressed and event.button_index == JOY_BUTTON_DPAD_UP:
		settings_button.grab_focus()
		get_viewport().set_input_as_handled()
	elif focus == settings_button and event.is_action_pressed("ui_cancel"):
		settings_button.release_focus()
		get_viewport().set_input_as_handled()


func _on_settings_pressed() -> void:
	get_tree().current_scene.add_child(SETTINGS_MENU_SCENE.instantiate())


func _build_guidance_ui() -> void:
	# Top bar text: larger, with an outline so it reads over any sky.
	for l in [coins_label, level_label]:
		l.add_theme_font_size_override("font_size", 24)
		l.add_theme_color_override("font_color", Color.WHITE)
		l.add_theme_color_override("font_outline_color", UIStyle.INK)
		l.add_theme_constant_override("outline_size", 8)
	settings_button.add_theme_font_size_override("font_size", 22)
	settings_button.custom_minimum_size = Vector2(0, 48)

	money_hud = MoneyHUD.new()
	money_hud.name = "MoneyHUD"
	add_child(money_hud)
	money_hud.setup(self, $Bar, coins_label, settings_button)
	Settings.changed.connect(func(k: String, _v: Variant) -> void:
		if k == "show_text":
			_on_coins_changed(GameState.wallet.balance))
	objective_panel = ObjectivePanel.new()
	objective_panel.position = Vector2(16, 70)
	objective_panel.help_requested.connect(open_help)
	add_child(objective_panel)
	zone_banner = ZoneBanner.new()
	add_child(zone_banner)
	subtitle_line = SubtitleLine.new()
	add_child(subtitle_line)
	hint_toast = HintToast.new()
	hint_toast.accepted.connect(func(): show_way_requested.emit())
	add_child(hint_toast)
	screen_fade = ScreenFade.new()
	add_child(screen_fade)
	destination_prompt = DestinationPrompt.new()
	destination_prompt.pressed.connect(_on_talk_pressed)
	add_child(destination_prompt)
	# The prompt pill draws above the cards (it may sit near the mission card).
	move_child(_pill, get_child_count() - 1)
	move_child(screen_fade, get_child_count() - 1)
	InputHints.device_changed.connect(func(_d): _on_device_changed())


func _on_device_changed() -> void:
	if _current_interaction_manager and is_instance_valid(_current_interaction_manager):
		set_process(_current_interaction_manager.has_any())


## Opens "What am I doing?" (once; pressing help again closes it).
func open_help() -> void:
	if is_instance_valid(_help_panel):
		return
	hint_toast.dismiss()
	_help_panel = HelpPanel.new()
	_help_panel.show_way_requested.connect(func(): show_way_requested.emit())
	add_child(_help_panel)


## Offers gentle help ("Need a little help?") — see GuidanceSystem.
func offer_hint() -> void:
	if is_instance_valid(_help_panel):
		return
	hint_toast.offer()


## What the Listen control reads when no panel is open: the open
## interaction card, or else the current mission (and its how-to tip).
func listen_text() -> String:
	if shop_card.is_open():
		return shop_card.listen_text()
	if _card.is_open():
		return _card.listen_text()
	if destination_prompt.visible:
		return destination_prompt.listen_text()
	if not ObjectiveManager.has_objective():
		return ""
	var parts: PackedStringArray = [Localization.t("help.mission"), ObjectiveManager.text()]
	if not ObjectiveManager.tip_text.is_empty():
		parts.append(ObjectiveManager.tip_text)
	return ". ".join(parts)


## While the shop card is open it needs the screen: the mission card steps
## aside, and spoken lines (subtitles) move above the card.
func _on_shop_card_visibility() -> void:
	if objective_panel:
		objective_panel.suppressed = shop_card.visible
	if shop_card.visible:
		_toast_serial += 1
		_toast.visible = false
	if not shop_card.visible:
		subtitle_line.offset_bottom = -120.0
		_fit_subtitle()


## Called by the shop card when it settles its size (see ShopCard._place).
func shop_card_layout(panel_rect: Rect2) -> void:
	if not shop_card.visible:
		return   # (a late layout pass after the card closed)
	var vp: Vector2 = get_viewport().get_visible_rect().size
	subtitle_line.offset_bottom = -maxf(120.0, vp.y - panel_rect.position.y + 12.0)
	_fit_subtitle()


## Keeps the subtitle box hugging its line after it is moved.
func _fit_subtitle() -> void:
	subtitle_line.offset_top = subtitle_line.offset_bottom - subtitle_line.get_combined_minimum_size().y
