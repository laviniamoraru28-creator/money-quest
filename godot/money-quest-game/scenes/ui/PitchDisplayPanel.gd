extends CanvasLayer
## PitchDisplayPanel — the final, read-only "My First Business" summary
## shown once all 18 BUILD stages are done — ports
## src/app/[locale]/entrepreneur-quest/pitch/page.tsx's own label/value
## layout verbatim, reusing the same LogoPreviewDraw shape preview
## LogoBuilderPanel uses. Deliberately omits the real website's
## `reputationOutOf5` line — see BusinessProfileData's own comment on
## why this project never tracks that running stat.

## Any of this panel's finishing buttons -> the waiting show function
## resumes. (A signal, not a local flag: a GDScript 4 lambda only changes
## its own copy of a captured local, so the old flag never reached the
## waiting loop and the panel never closed.)
signal _closed

@onready var panel: PanelContainer = $Panel
@onready var preview: LogoPreviewDraw = $Panel/VBox/PreviewRow/Preview
@onready var preview_symbol_label: Label = $Panel/VBox/PreviewRow/Preview/SymbolLabel
@onready var business_name_label: Label = $Panel/VBox/BusinessNameLabel
@onready var slogan_label: Label = $Panel/VBox/SloganLabel
@onready var lines_label: Label = $Panel/VBox/ScrollContainer/LinesLabel
@onready var done_button: Button = $Panel/VBox/DoneButton

const COLOR_BY_KEY: Dictionary = {
	"teal": Color(0.059, 0.478, 0.420, 1),
	"coral": Color(0.941, 0.471, 0.353, 1),
	"gold": Color(0.910, 0.639, 0.239, 1),
	"soft-blue": Color(0.498, 0.702, 0.800, 1),
}

var _listen_text: String = ""


func _ready() -> void:
	panel.add_theme_stylebox_override("panel", UIStyle.dark_panel())
	visible = false
	done_button.text = Localization.t("eq_build.pitch.done_button")


func show_pitch(profile: BusinessProfileData) -> void:
	done_button.text = Localization.t("eq_build.pitch.done_button")
	PictureChoice.action_symbol(done_button, "done")
	preview.refresh(profile.logo.shape, COLOR_BY_KEY.get(profile.logo.color_key, Color.WHITE))
	preview_symbol_label.text = profile.logo.symbol

	var not_set: String = Localization.t("eq_build.pitch.not_set_yet")
	business_name_label.text = profile.business_name if not profile.business_name.is_empty() else not_set
	slogan_label.visible = not profile.slogan.is_empty()
	slogan_label.text = "\"%s\"" % profile.slogan

	var customer_text: String = Localization.t("eq_build.category.customer.%s" % profile.customer_category) if not profile.customer_category.is_empty() else not_set
	var per_item: String = Localization.t("eq_build.pitch.per_item_suffix")
	var profit_text: String = str(profile.last_profit) if profile.has_simulator_run else not_set

	var lines: Array[String] = [
		_pitch_line(Localization.t("eq_build.pitch.my_business_is_label"), profile.business_name, not_set),
		_pitch_line(Localization.t("eq_build.pitch.it_helps_label"), profile.problem, not_set),
		_pitch_line(Localization.t("eq_build.pitch.my_customers_are_label"), customer_text, not_set),
		_pitch_line(Localization.t("eq_build.pitch.my_product_is_label"), profile.product_description, not_set),
		_pitch_line(Localization.t("eq_build.pitch.it_costs_me_label"), "%d %s" % [profile.cost_per_unit, per_item], not_set),
		_pitch_line(Localization.t("eq_build.pitch.i_would_charge_label"), "%d %s" % [profile.price, per_item], not_set),
		_pitch_line(Localization.t("eq_build.pitch.i_could_make_label"), profit_text, not_set),
		_pitch_line(Localization.t("eq_build.pitch.why_choose_label"), profile.why_choose_us, not_set),
		_pitch_line(Localization.t("eq_build.pitch.next_step_label"), profile.next_step, not_set),
	]
	lines_label.text = "\n\n".join(lines)

	# What Listen reads: the same pitch, but a typed answer is spoken as
	# "your own words" — the child's own text never goes to a speech voice.
	var spoken_lines: Array[String] = [
		_pitch_line(Localization.t("eq_build.pitch.my_business_is_label"), _spoken(profile.business_name), not_set),
		_pitch_line(Localization.t("eq_build.pitch.it_helps_label"), _spoken(profile.problem), not_set),
		_pitch_line(Localization.t("eq_build.pitch.my_customers_are_label"), customer_text, not_set),
		_pitch_line(Localization.t("eq_build.pitch.my_product_is_label"), _spoken(profile.product_description), not_set),
		_pitch_line(Localization.t("eq_build.pitch.it_costs_me_label"), "%d %s" % [profile.cost_per_unit, per_item], not_set),
		_pitch_line(Localization.t("eq_build.pitch.i_would_charge_label"), "%d %s" % [profile.price, per_item], not_set),
		_pitch_line(Localization.t("eq_build.pitch.i_could_make_label"), profit_text, not_set),
		_pitch_line(Localization.t("eq_build.pitch.why_choose_label"), _spoken(profile.why_choose_us), not_set),
		_pitch_line(Localization.t("eq_build.pitch.next_step_label"), _spoken(profile.next_step), not_set),
	]
	var spoken: Array[String] = [preview_symbol_label.text,
		_spoken(profile.business_name) if not profile.business_name.is_empty() else not_set]
	if slogan_label.visible:
		spoken.append(_spoken(profile.slogan))
	spoken.append_array(spoken_lines)
	spoken.append(done_button.text)
	var parts: PackedStringArray = []
	for s in spoken:
		if not s.strip_edges().is_empty():
			parts.append(s.strip_edges())
	_listen_text = ". ".join(parts)

	done_button.pressed.connect(func(): _closed.emit(), CONNECT_ONE_SHOT)

	visible = true
	UIFocus.focus(done_button)
	await _closed
	visible = false


## The Listen control's text (AudioManager.listen_text): the pitch with
## typed answers replaced by "your own words" (built in show_pitch).
func listen_text() -> String:
	return _listen_text if visible else ""


## An answer as Listen says it; empty stays empty (shown as "not set yet").
func _spoken(value: String) -> String:
	return "" if value.is_empty() else BusinessBuilder.spoken_answer(value)


func _pitch_line(label_text: String, value: String, not_set_text: String) -> String:
	var shown_value: String = value if not value.is_empty() else not_set_text
	return "%s\n%s" % [label_text, shown_value]
