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

const SETTINGS_MENU_SCENE: PackedScene = preload("res://scenes/menus/SettingsMenu.tscn")

@onready var coins_label: Label = $Bar/CoinsLabel
@onready var level_label: Label = $Bar/LevelLabel
@onready var settings_button: Button = $Bar/SettingsButton
@onready var talk_button: Button = $TalkButton

var _current_interaction_manager: InteractionManager = null


func _ready() -> void:
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
	coins_label.text = Localization.t("money.virtual_coins", {"amount": new_balance})


func _on_xp_changed(_new_total: int) -> void:
	level_label.text = Localization.t("hud.level_label", {"level": GameState.compute_level()})


func _on_zone_loaded(_zone_data: ZoneData) -> void:
	if _current_interaction_manager and _current_interaction_manager.nearest_interaction_changed.is_connected(_on_nearest_interaction_changed):
		_current_interaction_manager.nearest_interaction_changed.disconnect(_on_nearest_interaction_changed)

	var player: Node = get_tree().get_first_node_in_group("player")
	if player == null:
		_current_interaction_manager = null
		talk_button.visible = false
		return

	_current_interaction_manager = player.interaction_manager
	_current_interaction_manager.nearest_interaction_changed.connect(_on_nearest_interaction_changed)
	talk_button.visible = _current_interaction_manager.get_nearest() != null


func _on_nearest_interaction_changed(interaction: Interaction) -> void:
	talk_button.visible = interaction != null


func _on_talk_pressed() -> void:
	var player: Node = get_tree().get_first_node_in_group("player")
	if player:
		player.request_interact()


func _on_settings_pressed() -> void:
	get_tree().current_scene.add_child(SETTINGS_MENU_SCENE.instantiate())
