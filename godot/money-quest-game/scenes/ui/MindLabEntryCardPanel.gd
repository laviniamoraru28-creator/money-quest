extends CanvasLayer
## MindLabEntryCardPanel — the compact card shown when a child tries a
## Calm & Reset Lab strategy or opens a Discovery Room mind fact: title,
## short summary, a longer "detail" toggle, an optional "Want to explore
## a calm space?"-style cross-link (project brief Section 7), and an
## optional "About this" source toggle for any entry that makes a factual
## claim (mirrors BookCardPanel's own conventions exactly).

## Any of this panel's finishing buttons -> the waiting show function
## resumes. (A signal, not a local flag: a GDScript 4 lambda only changes
## its own copy of a captured local, so the old flag never reached the
## waiting loop and the panel never closed.)
signal _closed

@onready var panel: PanelContainer = $Panel
@onready var title_label: Label = $Panel/VBox/TitleLabel
@onready var summary_label: Label = $Panel/VBox/SummaryLabel
@onready var detail_toggle_button: Button = $Panel/VBox/DetailToggleButton
@onready var detail_label: Label = $Panel/VBox/DetailLabel
@onready var explore_button: Button = $Panel/VBox/ExploreButton
@onready var source_toggle_button: Button = $Panel/VBox/SourceToggleButton
@onready var source_label: Label = $Panel/VBox/SourceLabel
@onready var close_button: Button = $Panel/VBox/CloseButton


func _ready() -> void:
	visible = false
	detail_toggle_button.pressed.connect(_on_detail_toggle_pressed)
	source_toggle_button.pressed.connect(_on_source_toggle_pressed)


func show_entry(entry: MindLabEntryData) -> void:
	title_label.text = Localization.t(entry.title_key)
	summary_label.text = Localization.t(entry.summary_key)

	detail_toggle_button.visible = not entry.detail_key.is_empty()
	detail_toggle_button.text = Localization.t("mindlab.card.detail_toggle_button")
	detail_label.visible = false
	detail_label.text = Localization.t(entry.detail_key)

	explore_button.visible = not entry.cross_link_zone_id.is_empty()
	if explore_button.visible:
		var zone: ZoneData = WorldManager.get_zone(entry.cross_link_zone_id)
		var zone_name: String = Localization.t(zone.display_name_key) if zone else ""
		explore_button.text = Localization.t("mindlab.card.explore_button", {"zone_name": zone_name})

	source_toggle_button.visible = not entry.source_name.is_empty()
	source_label.visible = false
	source_label.text = Localization.t("library.card.source_line", {"source_name": entry.source_name})

	close_button.text = Localization.t("common.close_button")

	var on_explore := func():
		visible = false
		WorldManager.travel_to(entry.cross_link_zone_id)
		_closed.emit()
	if explore_button.visible:
		explore_button.pressed.connect(on_explore, CONNECT_ONE_SHOT)
	close_button.pressed.connect(func(): _closed.emit(), CONNECT_ONE_SHOT)

	visible = true
	await _closed
	visible = false

	if explore_button.visible and explore_button.pressed.is_connected(on_explore):
		explore_button.pressed.disconnect(on_explore)


func _on_detail_toggle_pressed() -> void:
	detail_label.visible = not detail_label.visible


func _on_source_toggle_pressed() -> void:
	source_label.visible = not source_label.visible
