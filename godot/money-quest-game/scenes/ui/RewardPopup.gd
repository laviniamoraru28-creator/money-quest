extends CanvasLayer
## RewardPopup — the end-of-lesson celebration: the real reward message
## from LessonData, plus the XP/virtual-coins earned. Explicitly labels
## coins as virtual (via VirtualMoney.formatted() / the
## "money.virtual_coins" translation key) so a child never reads this as
## real money earned — see project brief Phase 7.
##
## The small scale-bounce on show is a purposeful micro-interaction (brief
## Phase 2.4: "subtle, purposeful... lesson completion, star/reward
## feedback") that fully respects Settings.reduced_motion — it still
## appears instantly, just without the bounce, when reduced motion is on.

@onready var panel: PanelContainer = $Panel
@onready var message_label: Label = $Panel/VBox/MessageLabel
@onready var rewards_label: Label = $Panel/VBox/RewardsLabel
@onready var continue_button: Button = $Panel/VBox/ContinueButton

signal continued


func _ready() -> void:
	visible = false
	continue_button.pressed.connect(func(): continued.emit())


func show_reward(message_key: String, xp: int, coins: int) -> void:
	message_label.text = Localization.t(message_key)
	rewards_label.text = "%s   %s" % [
		Localization.t("reward.xp_earned", {"amount": xp}),
		Localization.t("money.virtual_coins", {"amount": coins}),
	]
	continue_button.text = Localization.t("common.nice_button")

	visible = true
	UIFocus.focus(continue_button)
	panel.scale = Vector2(0.85, 0.85) if not Settings.reduced_motion else Vector2.ONE
	var tween := create_tween()
	tween.tween_property(panel, "scale", Vector2.ONE, Settings.animation_duration(0.25)) \
		.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

	AudioManager.play_sfx("lesson_complete")
	await continued
	visible = false
