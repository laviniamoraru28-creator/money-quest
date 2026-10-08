class_name ResourcePurpose
extends RefCounted
## ResourcePurpose — "Money is a tool": the things a child can do with what
## they have (coins, and sometimes time), as one small shared vocabulary.
##
##   earn  save  spend  learn  create  help  improve  enjoy
##   (business: stock  equipment  idea)
##
## Each purpose is a picture (a MissionStrip / PurposeGlyphs token) and an
## optional short word. It is an underlying design vocabulary, NOT a menu:
## a place presents its purposes naturally, as things in the world (a
## savings jar, a bare flower bed, a learning desk, a business decision),
## and the child discovers them by exploring. A small picture choice
## (PurposeChoiceCard) appears only AT such a thing, with only the choices
## that make sense there ("put a coin in / take one out", "plant seeds /
## later") — never a generic "save / learn / help..." menu after a purchase.
## The best choice depends on what the child is trying to do.
##
## There is no "right" purpose: every option is a real choice with its own
## consequence. Nothing here scores or judges a choice.
##
## Option (a Dictionary):
##   "purpose"  one of PURPOSES' keys
##   "icons"    picture preview of what happens, e.g. ["coin", "then", "jar"]
##              (default: just the purpose's picture)
##   "cost"     coins it needs now (0 = no coins: time, effort, or later)
##   "key"      optional word key (default "purpose.<id>")
##   "id"       optional caller id (returned untouched)
##   "picture"  optional token for the big picture (default: the purpose's)

const PURPOSES: Dictionary = {
	"earn": "coin",
	"save": "jar",
	"spend": "stall",
	"learn": "book",
	"create": "tools",
	"help": "heart",
	"improve": "sprout",
	"enjoy": "play",
	"stock": "box",
	"equipment": "tools",
	"idea": "bulb",
}


static func glyph(purpose: String) -> String:
	return PURPOSES.get(purpose, "question")


static func word_key(option: Dictionary) -> String:
	return String(option.get("key", "purpose." + String(option.get("purpose", ""))))


## The options to show at the current support level: as many as
## SupportProfile.choice_count() suggests (the caller lists the most
## relevant first), never fewer than two.
static func for_support(options: Array) -> Array:
	return options.slice(0, maxi(SupportProfile.choice_count(), 2))


## Asks "What will you do?" and returns the chosen option (or {} for
## "later"). `have` is the child's coins (shown as pictures, and to show
## which options need more).
static func choose(host: Node, options: Array, have: int, header_icons: Array = [], header_params: Dictionary = {}) -> Dictionary:
	var card := PurposeChoiceCard.new()
	card.options = options
	card.have = have
	card.header_icons = header_icons
	card.header_params = header_params
	var hud: Node = host.get_tree().get_first_node_in_group("mq_hud")
	(hud if hud else host.get_tree().current_scene).add_child(card)
	var picked: int = await card.chosen
	return options[picked] if picked >= 0 and picked < options.size() else {}


## A short, wordless "what changed": [before pictures] → [after pictures]
## with a tick, for consequences that are not coins (coins already show
## BEFORE → AFTER in the HUD). Optional words underneath. Not blocking.
static func show_outcome(host: Node, before: Array, after: Array, key: String = "", params: Dictionary = {}) -> void:
	await show_change(host, [[before, after, params.get("before", {}), params.get("after", {})]], key, params)


## Several before → after rows in one card (e.g. "cost per item 2 → 1"
## and, under it, "profit 12 → 18"). Each row: [before, after] or
## [before, after, before_params, after_params]. Stays a little longer
## when there is more to see. Not blocking.
## `story` (lessons): the change belongs to the story on screen, not to the
## player's own money — the card sits with the dialogue (just above it, away
## from the HUD's real coin counters) and stays for the whole result line,
## until the lesson dismisses it (dismiss_change).
static func show_change(host: Node, rows: Array, key: String = "", params: Dictionary = {}, story: bool = false) -> void:
	var hud: Node = host.get_tree().get_first_node_in_group("mq_hud")
	if hud == null:
		return
	var panel := PanelContainer.new()
	panel.name = "PurposeOutcome"
	panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	panel.add_theme_stylebox_override("panel", UIStyle.panel(UIStyle.TEAL, 18))
	var v := VBoxContainer.new()
	v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	panel.add_child(v)
	for r in rows:
		var row := HBoxContainer.new()
		row.mouse_filter = Control.MOUSE_FILTER_IGNORE
		row.alignment = BoxContainer.ALIGNMENT_CENTER
		row.add_theme_constant_override("separation", 10)
		var a := MissionStrip.new(56.0)
		a.show_tokens(r[0], r[2] if r.size() > 2 else {})
		row.add_child(a)
		row.add_child(MoneyIcons.Arrow.new(34.0))
		var b := MissionStrip.new(56.0)
		b.show_tokens(r[1], r[3] if r.size() > 3 else {})
		row.add_child(b)
		row.add_child(MoneyIcons.Tick.new(40.0))
		v.add_child(row)
	if not key.is_empty() and SupportProfile.show_text():
		var l := UIStyle.label(Localization.t(key, params), UIStyle.TEXT)
		l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		v.add_child(l)
		AudioManager.narrate(l.text)
	hud.add_child(panel)
	panel.reset_size()
	var vp: Vector2 = panel.get_viewport_rect().size
	# Centred, but never over the mission card: beside it when there is
	# room, otherwise just under it.
	var pos := Vector2((vp.x - panel.size.x) * 0.5, vp.y * 0.22)
	var op: Control = hud.get("objective_panel")
	if op and op.visible:
		var r: Rect2 = op.get_global_rect()
		if Rect2(pos, panel.size).intersects(r):
			if r.end.x + 16.0 + panel.size.x <= vp.x - 8.0:
				pos.x = r.end.x + 16.0
			else:
				pos.y = r.end.y + 12.0
	panel.position = pos
	AudioManager.play_sfx("success", 1.0, -6.0)
	panel.modulate.a = 0.0
	if story:
		# Placed once the dialogue line under it has its size.
		for i in 2:
			await hud.get_tree().process_frame
		if not is_instance_valid(panel):
			return
		var box: Control = DialogueBox.panel
		if DialogueBox.visible:
			pos = Vector2((vp.x - panel.size.x) * 0.5, box.get_global_rect().position.y - panel.size.y - 12.0)
		panel.position = pos
	if Settings.reduced_motion:
		panel.modulate.a = 1.0
	else:
		panel.create_tween().tween_property(panel, "modulate:a", 1.0, 0.25)
	if story:
		return
	await hud.get_tree().create_timer(3.2 + 1.2 * (rows.size() - 1)).timeout
	if is_instance_valid(panel):
		panel.queue_free()


## Removes a story change card (the lesson moved on).
static func dismiss_change(host: Node) -> void:
	var hud: Node = host.get_tree().get_first_node_in_group("mq_hud")
	var panel: Node = hud.get_node_or_null("PurposeOutcome") if hud else null
	if panel:
		panel.queue_free()
