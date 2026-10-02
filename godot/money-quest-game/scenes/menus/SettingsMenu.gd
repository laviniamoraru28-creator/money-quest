extends CanvasLayer
## SettingsMenu — a reusable overlay reached from MainMenu and from the
## in-world HUD alike (see MainMenu.gd and HUD.gd's settings buttons), so
## the same controls are available whether or not a save file or avatar
## exists yet. Instantiated on demand by whoever opens it and freed on
## "Back" — not an autoload, since every opener already has a direct node
## reference to add a child to (get_tree().current_scene).
##
## CanvasLayer at layer 13 — above HUD (9), DialogueBox (10), ChoicePanel
## (11), and RewardPopup (12) — so Settings always renders on top of
## whatever was on screen when it was opened.

@onready var title_label: Label = $CenterContainer/Panel/VBox/TitleLabel
@onready var reduced_motion_label: Label = $CenterContainer/Panel/VBox/ReducedMotionRow/Label
@onready var reduced_motion_check: CheckButton = $CenterContainer/Panel/VBox/ReducedMotionRow/CheckButton
@onready var music_label: Label = $CenterContainer/Panel/VBox/MusicRow/Label
@onready var music_slider: HSlider = $CenterContainer/Panel/VBox/MusicRow/HSlider
@onready var sfx_label: Label = $CenterContainer/Panel/VBox/SfxRow/Label
@onready var sfx_slider: HSlider = $CenterContainer/Panel/VBox/SfxRow/HSlider
@onready var voice_label: Label = $CenterContainer/Panel/VBox/VoiceRow/Label
@onready var voice_slider: HSlider = $CenterContainer/Panel/VBox/VoiceRow/HSlider
@onready var ambient_label: Label = $CenterContainer/Panel/VBox/AmbientRow/Label
@onready var ambient_slider: HSlider = $CenterContainer/Panel/VBox/AmbientRow/HSlider
@onready var back_button: Button = $CenterContainer/Panel/VBox/BackButton


func _ready() -> void:
	title_label.text = Localization.t("settings.title")
	reduced_motion_label.text = Localization.t("settings.reduced_motion_label")
	music_label.text = Localization.t("settings.music_volume_label")
	sfx_label.text = Localization.t("settings.sfx_volume_label")
	voice_label.text = Localization.t("settings.voice_volume_label")
	ambient_label.text = Localization.t("settings.ambient_volume_label")
	back_button.text = Localization.t("settings.back_button")

	reduced_motion_check.button_pressed = Settings.reduced_motion
	music_slider.value = Settings.music_volume
	sfx_slider.value = Settings.sfx_volume
	voice_slider.value = Settings.voice_volume
	ambient_slider.value = Settings.ambient_volume

	reduced_motion_check.toggled.connect(Settings.set_reduced_motion)
	music_slider.value_changed.connect(Settings.set_music_volume)
	sfx_slider.value_changed.connect(Settings.set_sfx_volume)
	voice_slider.value_changed.connect(Settings.set_voice_volume)
	ambient_slider.value_changed.connect(Settings.set_ambient_volume)
	back_button.pressed.connect(queue_free)
