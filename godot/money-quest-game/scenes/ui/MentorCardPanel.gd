extends CanvasLayer
## MentorCardPanel — Mentor Hall's profile card: who they are, what they
## did, a real mistake/challenge they faced, what skill we can learn, and
## an optional "Try a challenge inspired by this skill" button (project
## brief Sections 8-9). Deliberately never phrases the challenge as the
## real person addressing the child — see MentorData.gd's own comment.

## Any of this panel's finishing buttons -> the waiting show function
## resumes. (A signal, not a local flag: a GDScript 4 lambda only changes
## its own copy of a captured local, so the old flag never reached the
## waiting loop and the panel never closed.)
signal _closed

@onready var panel: PanelContainer = $Panel
@onready var name_label: Label = $Panel/VBox/NameLabel
@onready var who_label: Label = $Panel/VBox/WhoLabel
@onready var known_for_label: Label = $Panel/VBox/KnownForLabel
@onready var challenge_label: Label = $Panel/VBox/ChallengeLabel
@onready var lesson_label: Label = $Panel/VBox/LessonLabel
@onready var try_button: Button = $Panel/VBox/TryButton
@onready var explore_button: Button = $Panel/VBox/ExploreButton
@onready var source_toggle_button: Button = $Panel/VBox/SourceToggleButton
@onready var source_label: Label = $Panel/VBox/SourceLabel
@onready var close_button: Button = $Panel/VBox/CloseButton


## The shared reading layout (CardLayout): picture header, scrolling body,
## Listen + Close.
var _layout: Dictionary = {}


func _ready() -> void:
	visible = false
	source_toggle_button.pressed.connect(_on_source_toggle_pressed)
	_layout = CardLayout.setup(panel, $Panel/VBox, name_label, [who_label, known_for_label, challenge_label, lesson_label, try_button, explore_button, source_toggle_button, source_label], close_button)
	for l in [who_label, known_for_label, challenge_label]:
		CardLayout.style_label(l, CardLayout.BODY_TEXT, UIStyle.INK)
	CardLayout.style_label(lesson_label, CardLayout.BODY_TEXT, UIStyle.TEAL_DARK)
	CardLayout.style_label(source_label, CardLayout.SMALL_TEXT, UIStyle.MUTED)


func show_mentor(mentor: MentorData) -> void:
	name_label.text = Localization.t(mentor.title_key)
	who_label.text = Localization.t(mentor.summary_key)
	known_for_label.text = Localization.t(mentor.known_for_key)
	challenge_label.visible = not mentor.mistake_or_challenge_key.is_empty()
	if challenge_label.visible:
		challenge_label.text = Localization.t(mentor.mistake_or_challenge_key)
	lesson_label.text = Localization.t(mentor.lesson_key)

	try_button.visible = not mentor.try_quest_id.is_empty()
	if try_button.visible:
		try_button.text = Localization.t("library.mentor_card.try_button")

	explore_button.visible = not mentor.cross_link_zone_id.is_empty()
	if explore_button.visible:
		var zone: ZoneData = WorldManager.get_zone(mentor.cross_link_zone_id)
		var zone_name: String = Localization.t(zone.display_name_key) if zone else ""
		explore_button.text = Localization.t("library.book_card.explore_button", {"zone_name": zone_name})

	source_toggle_button.visible = not mentor.source_name.is_empty()
	source_label.visible = false
	source_label.text = Localization.t("library.card.source_line", {"source_name": mentor.source_name})
	CardLayout.label_source_button(source_toggle_button, false)

	close_button.text = Localization.t("common.close_button")

	var on_try := func():
		visible = false
		await QuestManager.start_quest(mentor.try_quest_id)
		_closed.emit()
	var on_explore := func():
		visible = false
		WorldManager.travel_to(mentor.cross_link_zone_id)
		_closed.emit()
	if try_button.visible:
		try_button.pressed.connect(on_try, CONNECT_ONE_SHOT)
	if explore_button.visible:
		explore_button.pressed.connect(on_explore, CONNECT_ONE_SHOT)
	close_button.pressed.connect(func(): _closed.emit(), CONNECT_ONE_SHOT)

	CardLayout.prepare(panel, _layout, ["star", "then", "hand"])
	visible = true
	UIFocus.focus(close_button)
	AudioManager.present(listen_text())
	await _closed
	visible = false

	if try_button.visible and try_button.pressed.is_connected(on_try):
		try_button.pressed.disconnect(on_try)
	if explore_button.visible and explore_button.pressed.is_connected(on_explore):
		explore_button.pressed.disconnect(on_explore)


func _on_source_toggle_pressed() -> void:
	CardLayout.toggle_source(source_toggle_button, source_label)


## What Listen reads: the title and the card's visible text.
func listen_text() -> String:
	return CardLayout.listen_text(_layout, name_label)
