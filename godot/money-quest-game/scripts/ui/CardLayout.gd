class_name CardLayout
extends RefCounted
## CardLayout — the shared reading layout for the Library / Museum / Mentor
## Hall cards (BookCardPanel, ExhibitCardPanel, MentorCardPanel), applied at
## start-up to each card's existing nodes (their content logic is untouched):
##
##   [picture header + title]            pictures are a cue, never a replacement
##   ┌ scrolling body ─────────────────┐  the card's text at a readable size;
##   │ text…  [Read more] [Explore] …  │  long text scrolls instead of shrinking
##   │ [Where this comes from]         │
##   └─────────────────────────────────┘
##   [ Listen ]              [ Close ]   always reachable (touch, mouse, keys)
##
## A solid cream panel (UIStyle) placed below the top bar, never over it,
## and sized to the screen at every "Text and interface size". The card is
## read aloud on opening only when the player has turned narration on (the
## game's own setting); otherwise only the Listen button speaks.

const BODY_TEXT := 22
const SMALL_TEXT := 20
const MAX_WIDTH := 760.0
const MARGIN := 12.0
const HEADER_PICTURE := 56.0
const HEADER_PICTURE_WORDS_OFF := 72.0


## Rebuilds `vbox` (the card's existing VBox) into header / scrolling body /
## bottom row. `title` goes in the header; `body` nodes (labels and the
## optional buttons, in order) go in the scrolling body; `close` and a new
## Listen button form the bottom row. Returns the new parts.
static func setup(panel: PanelContainer, vbox: VBoxContainer, title: Label, body: Array, close: Button) -> Dictionary:
	panel.add_theme_stylebox_override("panel", UIStyle.panel(UIStyle.GOLD, 22))
	vbox.add_theme_constant_override("separation", 12)

	var header := HBoxContainer.new()
	header.name = "PictureHeader"
	header.add_theme_constant_override("separation", 14)
	header.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var picture := MissionStrip.new(HEADER_PICTURE)
	picture.name = "HeaderPicture"
	picture.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	header.add_child(picture)
	vbox.add_child(header)
	vbox.move_child(header, 0)
	title.reparent(header)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	title.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	style_label(title, UIStyle.TITLE, UIStyle.INK)

	var scroll := ScrollContainer.new()
	scroll.name = "BodyScroll"
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.follow_focus = true   # keyboard / gamepad focus scrolls to the button
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	var inner := VBoxContainer.new()
	inner.name = "Body"
	inner.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	inner.add_theme_constant_override("separation", 10)
	scroll.add_child(inner)
	vbox.add_child(scroll)
	vbox.move_child(scroll, 1)
	for n in body:
		(n as Node).reparent(inner)
		if n is Button:
			style_button(n, false)

	var bottom := HBoxContainer.new()
	bottom.name = "BottomRow"
	bottom.add_theme_constant_override("separation", 12)
	var listen: Button = Narration.listen_button()
	listen.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	listen.custom_minimum_size.y = UIStyle.BUTTON_HEIGHT
	bottom.add_child(listen)
	vbox.add_child(bottom)
	close.reparent(bottom)
	close.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	style_button(close, true)
	return {"header": header, "picture": picture, "scroll": scroll, "body": inner, "listen": listen, "close": close}


## Shows the card's picture cue (larger with words off) and sizes it to the
## screen below the top bar. Call after the card's text is set, before showing.
static func prepare(panel: PanelContainer, parts: Dictionary, tokens: Array) -> void:
	var words: bool = SupportProfile.show_text()
	var picture: MissionStrip = parts["picture"]
	var px: float = HEADER_PICTURE if words else HEADER_PICTURE_WORDS_OFF
	if not is_equal_approx(picture.px, px):
		picture.px = px
		picture.show_tokens([])   # (it rebuilds only for new pictures, not a new size)
	picture.show_tokens(tokens)
	(parts["scroll"] as ScrollContainer).scroll_vertical = 0
	link_focus(parts)
	fit(panel)


## A fixed D-pad / arrow-key order (the nearest-on-screen search would also
## pick body buttons scrolled out of sight behind the bottom row): the body's
## buttons in a column; down from the last one is Close; Listen and Close
## side by side; up from either goes back into the body.
static func link_focus(parts: Dictionary) -> void:
	var listen: Button = parts["listen"]
	var close: Button = parts["close"]
	var column: Array[Control] = []
	for c in (parts["body"] as Node).get_children():
		if c is Button and (c as Button).visible:
			column.append(c)
	for i in column.size():
		var b: Control = column[i]
		b.focus_neighbor_top = b.get_path_to(column[i - 1] if i > 0 else b)
		b.focus_neighbor_bottom = b.get_path_to(column[i + 1] if i < column.size() - 1 else close)
		b.focus_neighbor_left = b.get_path_to(b)
		b.focus_neighbor_right = b.get_path_to(b)
	var above: Control = column[-1] if not column.is_empty() else null
	for b in [listen, close]:
		b.focus_neighbor_top = b.get_path_to(above if above else b)
		b.focus_neighbor_bottom = b.get_path_to(b)
	listen.focus_neighbor_left = listen.get_path_to(listen)
	listen.focus_neighbor_right = listen.get_path_to(close)
	close.focus_neighbor_left = close.get_path_to(listen if listen.visible else close)
	close.focus_neighbor_right = close.get_path_to(close)


## Width ≤ MAX_WIDTH, centred; top just below the HUD's top bar; height up to
## the bottom of the screen. The body scrolls inside it.
static func fit(panel: PanelContainer) -> void:
	var vp: Vector2 = panel.get_viewport_rect().size
	var top: float = hud_bottom(panel) + MARGIN
	var w: float = minf(MAX_WIDTH, vp.x - MARGIN * 2.0)
	var h: float = maxf(vp.y - top - MARGIN, 200.0)
	panel.anchor_left = 0.5
	panel.anchor_right = 0.5
	panel.anchor_top = 0.0
	panel.anchor_bottom = 0.0
	panel.offset_left = -w * 0.5
	panel.offset_right = w * 0.5
	panel.offset_top = top
	panel.offset_bottom = top + h
	panel.scale = Vector2.ONE


## The bottom edge of the HUD's top bar (coins, level, Settings), in the
## card's coordinates; a safe default when there is no HUD.
static func hud_bottom(node: Node) -> float:
	var hud: Node = node.get_tree().get_first_node_in_group("mq_hud") if node.is_inside_tree() else null
	var bottom: float = 64.0
	if hud:
		for c in [hud.get("coins_label"), hud.get("level_label"), hud.get("settings_button")]:
			if c is Control and (c as Control).is_visible_in_tree():
				bottom = maxf(bottom, (c as Control).get_global_rect().end.y)
	return bottom


## The source button says what it does: "Show where this comes from" /
## "Hide where this comes from" (also its tooltip, for mouse users).
static func label_source_button(b: Button, shown: bool) -> void:
	b.text = Localization.t("library.card.source_hide" if shown else "library.card.source_show")
	b.tooltip_text = b.text


## Shows or hides the source line under its button, and scrolls it into view.
static func toggle_source(b: Button, source: Label) -> void:
	source.visible = not source.visible
	label_source_button(b, source.visible)
	if source.visible:
		reveal(source)


## Scrolls the card's body so `c` (just shown) is in view — its start
## first, when it is taller than the visible part.
static func reveal(c: Control) -> void:
	var scroll := c.get_parent().get_parent() as ScrollContainer
	if scroll == null:
		return
	# The wrapped text's new height is known once the body has been laid out.
	for i in 2:
		await c.get_tree().process_frame
	if not is_instance_valid(c) or not c.is_visible_in_tree():
		return
	var top: float = c.position.y
	var bottom: float = top + c.size.y
	var view: float = scroll.size.y
	if bottom - scroll.scroll_vertical > view:
		scroll.scroll_vertical = int(minf(top, bottom - view))
	if top < scroll.scroll_vertical:
		scroll.scroll_vertical = int(top)


## What Listen reads: the title and the card's visible text, in order (not
## the buttons).
static func listen_text(parts: Dictionary, title: Label) -> String:
	var lines: PackedStringArray = [title.text]
	for c in (parts["body"] as Node).get_children():
		if c is Label and (c as Label).visible and not (c as Label).text.strip_edges().is_empty():
			lines.append((c as Label).text.strip_edges())
	return ". ".join(lines)


static func style_label(l: Label, size: int, color: Color) -> void:
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART


## The game's own button look (UIStyle.button) applied to an existing button.
static func style_button(b: Button, primary: bool) -> void:
	var model: Button = UIStyle.button("", primary)
	b.custom_minimum_size.y = maxf(b.custom_minimum_size.y, UIStyle.BUTTON_HEIGHT)
	b.add_theme_font_size_override("font_size", UIStyle.BUTTON)
	for state in ["normal", "hover", "pressed", "disabled"]:
		b.add_theme_stylebox_override(state, model.get_theme_stylebox(state))
	for c in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color", "font_hover_pressed_color"]:
		b.add_theme_color_override(c, model.get_theme_color(c))
	b.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	model.free()
