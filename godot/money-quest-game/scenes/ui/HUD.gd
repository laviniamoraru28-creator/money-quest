extends CanvasLayer
## HUD — the small always-visible top bar: virtual coin balance and level.
## Purely reactive to GameState's signals; never queries anything itself
## on a timer, so it can never show a stale value.

@onready var coins_label: Label = $Bar/CoinsLabel
@onready var level_label: Label = $Bar/LevelLabel


func _ready() -> void:
	GameState.coins_changed.connect(_on_coins_changed)
	GameState.xp_changed.connect(_on_xp_changed)
	Localization.locale_changed.connect(func(_l): _refresh())
	_refresh()


func _refresh() -> void:
	_on_coins_changed(GameState.wallet.balance)
	_on_xp_changed(GameState.xp_total)


func _on_coins_changed(new_balance: int) -> void:
	coins_label.text = Localization.t("money.virtual_coins", {"amount": new_balance})


func _on_xp_changed(_new_total: int) -> void:
	level_label.text = Localization.t("hud.level_label", {"level": GameState.compute_level()})
