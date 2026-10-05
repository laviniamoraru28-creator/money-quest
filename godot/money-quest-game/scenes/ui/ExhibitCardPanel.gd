extends CanvasLayer
## ExhibitCardPanel — the Museum's exhibit card: title, category, a short
## summary + optional "Tell Me More" detail toggle, a Learn More button
## (opens the real official source), an optional "Explore this in ___"
## cross-link, and a source toggle (project brief Sections 10-22). For a
## Failure Museum exhibit (`exhibit_category == "failure-museum"`), the
## summary/detail are replaced by the brief's required 4-part structure
## (What Happened / What Went Wrong / What Could Differ / What We Learn)
## — see ExhibitData.gd's own comment. An optional "Continue the Story"
## button launches `followup_quest_id` after closing, same pattern
## MentorCardPanel uses for "Try This."

## Any of this panel's finishing buttons -> the waiting show function
## resumes. (A signal, not a local flag: a GDScript 4 lambda only changes
## its own copy of a captured local, so the old flag never reached the
## waiting loop and the panel never closed.)
signal _closed

@onready var panel: PanelContainer = $Panel
@onready var title_label: Label = $Panel/VBox/TitleLabel
@onready var category_label: Label = $Panel/VBox/CategoryLabel
@onready var summary_label: Label = $Panel/VBox/SummaryLabel
@onready var detail_toggle_button: Button = $Panel/VBox/DetailToggleButton
@onready var detail_label: Label = $Panel/VBox/DetailLabel
@onready var what_happened_label: Label = $Panel/VBox/WhatHappenedLabel
@onready var what_went_wrong_label: Label = $Panel/VBox/WhatWentWrongLabel
@onready var what_could_differ_label: Label = $Panel/VBox/WhatCouldDifferLabel
@onready var what_we_learn_label: Label = $Panel/VBox/WhatWeLearnLabel
@onready var learn_more_button: Button = $Panel/VBox/LearnMoreButton
@onready var continue_story_button: Button = $Panel/VBox/ContinueStoryButton
@onready var explore_button: Button = $Panel/VBox/ExploreButton
@onready var source_toggle_button: Button = $Panel/VBox/SourceToggleButton
@onready var source_label: Label = $Panel/VBox/SourceLabel
@onready var close_button: Button = $Panel/VBox/CloseButton

const CATEGORY_KEYS: Dictionary = {
	"money-through-time": "museum.category.money_through_time",
	"business-stories": "museum.category.business_stories",
	"failure-museum": "museum.category.failure_museum",
	"great-ideas": "museum.category.great_ideas",
	"leadership-stories": "museum.category.leadership_stories",
	"innovation": "museum.category.innovation",
}


func _ready() -> void:
	visible = false
	source_toggle_button.pressed.connect(_on_source_toggle_pressed)
	detail_toggle_button.pressed.connect(_on_detail_toggle_pressed)


func show_exhibit(exhibit: ExhibitData) -> void:
	title_label.text = Localization.t(exhibit.title_key)

	var category_key: String = CATEGORY_KEYS.get(exhibit.exhibit_category, "")
	category_label.visible = not category_key.is_empty()
	if category_label.visible:
		category_label.text = Localization.t(category_key)

	var is_failure: bool = exhibit.exhibit_category == "failure-museum"

	summary_label.visible = not is_failure
	detail_toggle_button.visible = not is_failure and not exhibit.detail_key.is_empty()
	detail_label.visible = false
	if not is_failure:
		summary_label.text = Localization.t(exhibit.summary_key)
		detail_toggle_button.text = Localization.t("museum.card.tell_me_more_button")
		detail_label.text = Localization.t(exhibit.detail_key)

	what_happened_label.visible = is_failure
	what_went_wrong_label.visible = is_failure
	what_could_differ_label.visible = is_failure
	what_we_learn_label.visible = is_failure
	if is_failure:
		what_happened_label.text = "%s\n%s" % [Localization.t("museum.failure.what_happened_label"), Localization.t(exhibit.what_happened_key)]
		what_went_wrong_label.text = "%s\n%s" % [Localization.t("museum.failure.what_went_wrong_label"), Localization.t(exhibit.what_went_wrong_key)]
		what_could_differ_label.text = "%s\n%s" % [Localization.t("museum.failure.what_could_differ_label"), Localization.t(exhibit.what_could_differ_key)]
		what_we_learn_label.text = "%s\n%s" % [Localization.t("museum.failure.what_we_learn_label"), Localization.t(exhibit.what_we_learn_key)]

	learn_more_button.visible = not exhibit.source_url.is_empty()
	learn_more_button.text = Localization.t("museum.card.learn_more_button")
	if learn_more_button.visible:
		learn_more_button.set_meta("exhibit", exhibit)
		if not learn_more_button.pressed.is_connected(_on_learn_more_pressed):
			learn_more_button.pressed.connect(_on_learn_more_pressed)

	continue_story_button.visible = not exhibit.followup_quest_id.is_empty()
	if continue_story_button.visible:
		continue_story_button.text = Localization.t("museum.card.continue_story_button")

	explore_button.visible = not exhibit.cross_link_zone_id.is_empty()
	if explore_button.visible:
		var zone: ZoneData = WorldManager.get_zone(exhibit.cross_link_zone_id)
		var zone_name: String = Localization.t(zone.display_name_key) if zone else ""
		explore_button.text = Localization.t("library.book_card.explore_button", {"zone_name": zone_name})

	source_toggle_button.visible = not exhibit.source_name.is_empty()
	source_label.visible = false
	source_label.text = Localization.t("library.card.source_line", {"source_name": exhibit.source_name})

	close_button.text = Localization.t("common.close_button")

	var on_continue_story := func():
		visible = false
		await QuestManager.start_quest(exhibit.followup_quest_id)
		_closed.emit()
	var on_explore := func():
		visible = false
		WorldManager.travel_to(exhibit.cross_link_zone_id)
		_closed.emit()
	if continue_story_button.visible:
		continue_story_button.pressed.connect(on_continue_story, CONNECT_ONE_SHOT)
	if explore_button.visible:
		explore_button.pressed.connect(on_explore, CONNECT_ONE_SHOT)
	close_button.pressed.connect(func(): _closed.emit(), CONNECT_ONE_SHOT)

	visible = true
	await _closed
	visible = false

	if continue_story_button.visible and continue_story_button.pressed.is_connected(on_continue_story):
		continue_story_button.pressed.disconnect(on_continue_story)
	if explore_button.visible and explore_button.pressed.is_connected(on_explore):
		explore_button.pressed.disconnect(on_explore)


func _on_learn_more_pressed() -> void:
	var exhibit: ExhibitData = learn_more_button.get_meta("exhibit")
	if exhibit and not exhibit.source_url.is_empty():
		OS.shell_open(exhibit.source_url)


func _on_detail_toggle_pressed() -> void:
	detail_label.visible = not detail_label.visible


func _on_source_toggle_pressed() -> void:
	source_label.visible = not source_label.visible
