extends CanvasLayer
## DialogueBox — shows one line of dialogue/narration at a time with a
## single large "Continue" button. Used for both NPC dialogue
## (speaker name + portrait) and narrator/explanation text (no speaker).
##
## Every screen this shows is driven entirely by translation keys passed
## in from LessonData — this scene contains no lesson-specific text.

@onready var panel: PanelContainer = $Panel
@onready var speaker_label: Label = $Panel/VBox/SpeakerLabel
@onready var text_label: Label = $Panel/VBox/TextLabel
@onready var continue_button: Button = $Panel/VBox/ContinueButton

signal advanced

var _waiting: bool = false


func _ready() -> void:
	visible = false
	continue_button.pressed.connect(_on_continue_pressed)
	Localization.locale_changed.connect(func(_l): _refresh_current_text())

var _current_speaker_id: String = ""
var _current_text_key: String = ""
var _current_text_params: Dictionary = {}


## Shows one DialogueLine and waits for the child to tap Continue.
func show_line(line: DialogueLine) -> void:
	_current_speaker_id = line.speaker_id
	_current_text_key = line.text_key
	_current_text_params = {}
	_refresh_current_text()
	await _wait_for_continue()


## Shows a single translated text block with no named speaker — used for
## the lesson's consequence/explanation/feedback beats. `params` fills
## any `{placeholder}` tokens the key's own translation contains (see
## Localization.t) — e.g. a dynamically computed amount.
func show_text(text_key: String, params: Dictionary = {}) -> void:
	_current_speaker_id = ""
	_current_text_key = text_key
	_current_text_params = params
	_refresh_current_text()
	await _wait_for_continue()


func _refresh_current_text() -> void:
	if _current_text_key.is_empty():
		return
	speaker_label.visible = not _current_speaker_id.is_empty()
	if speaker_label.visible:
		speaker_label.text = Localization.t("npc.%s.name" % _current_speaker_id)
	text_label.text = Localization.t(_current_text_key, _current_text_params)
	continue_button.text = Localization.t("common.continue_button")


func _wait_for_continue() -> void:
	visible = true
	_waiting = true
	# Touch target follows the website's own min-touch-target discipline
	# (see docs/godot-architecture-plan.md Section 4) — kept comfortably
	# large and full-width at the bottom of the screen for one-handed use.
	await advanced
	visible = false


func _on_continue_pressed() -> void:
	if _waiting:
		_waiting = false
		advanced.emit()
