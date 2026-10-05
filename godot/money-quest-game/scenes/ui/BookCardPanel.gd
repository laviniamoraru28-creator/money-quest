extends CanvasLayer
## BookCardPanel — the compact book card shown when a child opens a real
## Library book: title, author, age range, 3-5 short "what you'll
## discover" bullets, then Read More (opens the real official source in
## the system browser), an optional "Explore this topic in ___" cross-
## link, and an optional "About this book" source toggle (project brief
## Sections 5 and 22 — source metadata stays hidden by default, never
## shown as the first thing a child sees).

## Any of this panel's finishing buttons -> the waiting show function
## resumes. (A signal, not a local flag: a GDScript 4 lambda only changes
## its own copy of a captured local, so the old flag never reached the
## waiting loop and the panel never closed.)
signal _closed

@onready var panel: PanelContainer = $Panel
@onready var title_label: Label = $Panel/VBox/TitleLabel
@onready var author_label: Label = $Panel/VBox/AuthorLabel
@onready var age_label: Label = $Panel/VBox/AgeLabel
@onready var summary_label: Label = $Panel/VBox/SummaryLabel
@onready var discover_label: Label = $Panel/VBox/DiscoverLabel
@onready var read_more_button: Button = $Panel/VBox/ReadMoreButton
@onready var explore_button: Button = $Panel/VBox/ExploreButton
@onready var source_toggle_button: Button = $Panel/VBox/SourceToggleButton
@onready var source_label: Label = $Panel/VBox/SourceLabel
@onready var close_button: Button = $Panel/VBox/CloseButton

const AGE_BAND_KEYS: Dictionary = {
	"explorer": "library.age_band.explorer",
	"builder": "library.age_band.builder",
	"strategist": "library.age_band.strategist",
}


func _ready() -> void:
	visible = false
	source_toggle_button.pressed.connect(_on_source_toggle_pressed)


func show_book(book: BookData) -> void:
	title_label.text = Localization.t(book.title_key)
	author_label.visible = not book.author_key.is_empty()
	if author_label.visible:
		author_label.text = Localization.t("library.book_card.by_author", {"author": Localization.t(book.author_key)})

	var age_key: String = AGE_BAND_KEYS.get(book.recommended_age_band, "")
	age_label.visible = not age_key.is_empty()
	if age_label.visible:
		age_label.text = Localization.t(age_key)

	summary_label.text = Localization.t(book.summary_key)

	var discover_lines: Array[String] = []
	for point_key in book.discover_point_keys:
		discover_lines.append("• %s" % Localization.t(point_key))
	discover_label.visible = not discover_lines.is_empty()
	discover_label.text = "\n".join(discover_lines)

	read_more_button.visible = not book.source_url.is_empty()
	read_more_button.text = Localization.t("library.book_card.read_more_button")

	explore_button.visible = not book.cross_link_zone_id.is_empty()
	if explore_button.visible:
		var zone: ZoneData = WorldManager.get_zone(book.cross_link_zone_id)
		var zone_name: String = Localization.t(zone.display_name_key) if zone else ""
		explore_button.text = Localization.t("library.book_card.explore_button", {"zone_name": zone_name})

	source_toggle_button.visible = not book.source_name.is_empty()
	source_label.visible = false
	source_label.text = Localization.t("library.card.source_line", {"source_name": book.source_name})

	close_button.text = Localization.t("common.close_button")

	if not read_more_button.pressed.is_connected(_on_read_more_pressed):
		read_more_button.pressed.connect(_on_read_more_pressed)
	var current_book: BookData = book
	read_more_button.set_meta("book", current_book)

	var on_explore := func():
		visible = false
		WorldManager.travel_to(book.cross_link_zone_id)
		_closed.emit()
	if explore_button.visible:
		explore_button.pressed.connect(on_explore, CONNECT_ONE_SHOT)
	close_button.pressed.connect(func(): _closed.emit(), CONNECT_ONE_SHOT)

	visible = true
	UIFocus.focus(close_button)
	await _closed
	visible = false

	if explore_button.visible and explore_button.pressed.is_connected(on_explore):
		explore_button.pressed.disconnect(on_explore)


func _on_read_more_pressed() -> void:
	var book: BookData = read_more_button.get_meta("book")
	if book and not book.source_url.is_empty():
		OS.shell_open(book.source_url)


func _on_source_toggle_pressed() -> void:
	source_label.visible = not source_label.visible
