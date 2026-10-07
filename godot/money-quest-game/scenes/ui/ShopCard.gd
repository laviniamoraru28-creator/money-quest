class_name ShopCard
extends Control
## ShopCard — looking, choosing and buying at a stall, as part of the world
## (the same bottom card look as InteractionCard; it never blocks walking,
## closes when the child walks away, Escape / B closes it).
##
##   LIST     the stall's products (picture, price as coins, "yours")
##   PRODUCT  big picture, need/want mark, the price as coins against the
##            child's own coins (missing coins drawn hollow), and what
##            buying would leave: [coin] 3 → [coin] 1
##   CONFIRM  coins → product, and the same before → after
##   BOUGHT   before → after, the product goes into the bag
##
## Universal Play & Learn: words are an optional layer. Every state is
## understandable from pictures, coins and numbers alone
## (SupportProfile.show_text() off hides the words; Listen still reads
## them aloud); buttons carry icons (coin→bag = buy, tick = yes, arrow =
## back, cross = close). How many products are offered at once follows
## SupportProfile.choice_count() (two very different ones at level 1).
## When something costs too much the purchase simply does not happen: the
## missing coins show hollow, the keeper nods kindly, the child picks again.
##
## Money and ownership go through Shop (GameState + ProgressManager, saved
## at once). Keyboard, mouse, gamepad and tap; nothing depends on motion,
## colour or sound alone.

const INK := Color("1C2624")
const CREAM := Color("FBF8EF")
const TEAL := Color("0F7A6B")
const MAX_WIDTH: float = 660.0

signal closed
signal purchased(product_id: String)
signal not_enough(product_id: String)

enum View { LIST, PRODUCT, CONFIRM, BOUGHT }

var shop: ShopData
var view: View = View.LIST
var product: ProductData
## Balance just before the last purchase (for the before → after picture).
var last_before: int = -1
var _stall: Node = null
var _busy: bool = false
var _only_ids: Array = []

var _panel: PanelContainer
var _stripe: StyleBoxFlat
var _title: Label
var _body: Label
var _balance: Label
var _list: VBoxContainer
var _detail: HBoxContainer
var _icon: ItemVisual.Icon
var _tag_row: HBoxContainer
var _tag_label: Label
var _fact: Label
var _visual: VBoxContainer
var _status: Label
var _buttons: HBoxContainer
var _listen: Button


static func find(from: Node) -> ShopCard:
	return from.get_tree().get_first_node_in_group("mq_shop_card") as ShopCard


func _ready() -> void:
	add_to_group("mq_shop_card")
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_build()
	visible = false
	set_process(false)
	Localization.locale_changed.connect(func(_l: String) -> void:
		if visible:
			_show(view))
	GameState.coins_changed.connect(func(_b: int) -> void:
		if visible and view != View.BOUGHT and not _busy:
			_show(view))
	Settings.changed.connect(func(k: String, _v: Variant) -> void:
		if visible and k in ["show_text", "support_level", "visual_guidance"]:
			_show(view))


func is_open() -> bool:
	return visible


func is_open_for(source: Node) -> bool:
	return visible and _stall == source


func toggle(p_shop: ShopData, source: Node) -> void:
	if is_open_for(source):
		close()
		return
	open(p_shop, source)


## `only_ids`: offer just these products (an activity's chosen choices).
## Empty = as many as the support level suggests.
func open(p_shop: ShopData, source: Node, only_ids: Array = []) -> void:
	shop = p_shop
	_stall = source
	_only_ids = only_ids
	product = null
	var other: InteractionCard = InteractionCard.find(self)
	if other:
		other.close()
	visible = true
	set_process(true)
	if not Settings.reduced_motion:
		_panel.modulate.a = 0.0
		create_tween().tween_property(_panel, "modulate:a", 1.0, 0.18)
	else:
		_panel.modulate.a = 1.0
	_show(View.LIST)
	_react("browse")
	ProgressManager.set_activity_state("shop:" + shop.shop_id, "visited", true)


func close() -> void:
	if not visible:
		return
	visible = false
	set_process(false)
	_stall = null
	closed.emit()


func _process(_delta: float) -> void:
	if _busy:
		return
	# Walked away (or the zone changed): put the card away quietly.
	if _stall == null or not is_instance_valid(_stall) or ("player_in_range" in _stall and not _stall.player_in_range and not (_stall.get("keeper") and is_instance_valid(_stall.keeper) and _stall.keeper.player_in_range)):
		close()


func _unhandled_input(event: InputEvent) -> void:
	if visible and not _busy and event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		match view:
			View.PRODUCT, View.BOUGHT:
				_show(View.LIST)
			View.CONFIRM:
				_show(View.PRODUCT)
			_:
				close()


## What Listen reads: every line of the card (even with words hidden — the
## spoken layer is separate from the written one), in order.
func listen_text() -> String:
	if not visible:
		return ""
	var parts: PackedStringArray = []
	for l in [_title, _body, _balance, _status, _tag_label, _fact]:
		if l.get_meta("has", false) and l.is_inside_tree():
			parts.append(l.text)
	if view == View.LIST:
		for b in _list.get_children():
			if b is Button:
				parts.append(String(b.get_meta("spoken", "")))
	return _sentences(parts)


## Joins parts into sentences without doubling punctuation ("juice!." ).
static func _sentences(parts: PackedStringArray) -> String:
	var out: String = ""
	for p in parts:
		var s: String = p.strip_edges()
		if s.is_empty():
			continue
		if not out.is_empty():
			out += " " if out[-1] in [".", "!", "?", ":", "…"] else ". "
		out += s
	return out


# --- views -------------------------------------------------------------------

func select_product(product_id: String) -> void:
	product = shop.product(product_id)
	if product:
		_show(View.PRODUCT)


## The products offered right now: an activity's own choices, or as many as
## the support level suggests — the most different ones first (cheapest and
## dearest), so two choices are always clearly distinct.
func visible_products() -> Array[ProductData]:
	var out: Array[ProductData] = []
	if not _only_ids.is_empty():
		for id in _only_ids:
			var p: ProductData = shop.product(String(id))
			if p:
				out.append(p)
		return out
	var n: int = SupportProfile.choice_count()
	if n >= shop.products.size():
		out.assign(shop.products)
		return out
	var sorted: Array = shop.products.duplicate()
	sorted.sort_custom(func(a: ProductData, b: ProductData) -> bool: return a.price < b.price)
	var picked: Array = [sorted[0], sorted[-1]]
	var i: int = 1
	while picked.size() < n and i < sorted.size() - 1:
		picked.insert(picked.size() - 1, sorted[i])
		i += 1
	# Keep the stall's own order on the card.
	for p in shop.products:
		if p in picked:
			out.append(p)
	return out


func _show(v: View) -> void:
	view = v
	_stripe.border_color = DecorKit.color(shop.accent)
	_clear(_buttons)
	_clear(_list)
	_clear(_visual)
	_list.visible = v == View.LIST
	_detail.visible = v != View.LIST
	_visual.visible = v != View.LIST
	_say(_fact, "")
	_tag_row.visible = false
	_say(_balance, Localization.t("shop.balance", {"coins": Shop.coins(GameState.wallet.balance)}))
	_say(_status, "")
	match v:
		View.LIST:
			_say(_title, Localization.t(shop.name_key))
			_say(_body, Localization.t(shop.welcome_key) if not shop.welcome_key.is_empty() else "")
			for p in visible_products():
				_list.add_child(_product_row(p))
			if shop.compare_ids.size() == 2 and _only_ids.is_empty():
				var cmp_icon := HBoxContainer.new()
				var pa := MoneyIcons.Pips.new()
				pa.coin_px = 12.0
				pa.filled = 2
				var pb := MoneyIcons.Pips.new()
				pb.coin_px = 12.0
				pb.filled = 5
				cmp_icon.add_child(pa)
				cmp_icon.add_child(pb)
				var cmp := _button(Localization.t("shop.compare_button"), false, cmp_icon)
				cmp.name = "CompareButton"
				cmp.pressed.connect(_compare)
				_buttons.add_child(cmp)
			_add_close()
		View.PRODUCT:
			_fill_product()
			var q: Dictionary = Shop.quote(product)
			_visual.add_child(_price_row(product.price, q["balance"]))
			match q["status"]:
				Shop.OK:
					_say(_status, Localization.t("shop.after_buying", {"left": Shop.coins(q["after"])}))
					_visual.add_child(_before_after(q["balance"], q["after"]))
					var buy := _button(Localization.t("shop.buy_button", {"price": Shop.coins(product.price)}), true, _buy_icon())
					buy.name = "BuyButton"
					buy.pressed.connect(func() -> void: _show(View.CONFIRM))
					_buttons.add_child(buy)
				Shop.NOT_ENOUGH:
					_say(_balance, "")   # the status line says balance, price and the gap
					_say(_status, "%s %s %s %s" % [
						Localization.t("shop.you_have", {"coins": Shop.coins(q["balance"])}),
						Localization.t("shop.this_costs", {"price": q["price"]}),
						Localization.t("shop.you_need_more", {"more": q["needed"]}),
						Localization.t("shop.save_up_hint")])
					_react("not_enough")
					not_enough.emit(product.product_id)
				Shop.ALREADY_HAVE:
					_say(_status, Localization.t("shop.already_have"))
					_visual.add_child(_owned_row())
				Shop.SOLD_OUT:
					_say(_status, Localization.t("shop.sold_out"))
			_add_back()
		View.CONFIRM:
			_fill_product()
			var q2: Dictionary = Shop.quote(product)
			var text: String = Localization.t("shop.confirm", {"name": Localization.t(product.name_key), "price": Shop.coins(product.price), "left": Shop.coins(q2["after"])})
			if product.tag == "want" and q2["after"] <= 1:
				text += " " + Localization.t("shop.confirm_low_hint")
			_say(_status, text)
			_visual.add_child(_pay_row(product))
			_visual.add_child(_before_after(q2["balance"], q2["after"]))
			var yes := _button(Localization.t("shop.confirm_yes"), true, MoneyIcons.Tick.new(30.0))
			yes.name = "ConfirmBuy"
			yes.pressed.connect(_buy)
			_buttons.add_child(yes)
			var no := _button(Localization.t("shop.confirm_no"), false, MoneyIcons.Arrow.new(30.0, true))
			no.name = "ConfirmCancel"
			no.pressed.connect(func() -> void: _show(View.PRODUCT))
			_buttons.add_child(no)
		View.BOUGHT:
			_fill_product()
			_say(_status, Localization.t("shop.bought", {"name": Localization.t(product.name_key), "left": Shop.coins(GameState.wallet.balance)}))
			if last_before >= 0:
				_visual.add_child(_before_after(last_before, GameState.wallet.balance))
			_visual.add_child(_owned_row())
			var more := _button(Localization.t("shop.keep_looking"), true, MoneyIcons.Arrow.new(30.0, true))
			more.name = "KeepLooking"
			more.pressed.connect(func() -> void: _show(View.LIST))
			_buttons.add_child(more)
			_add_close()
	_buttons.add_child(_listen)
	_apply_text_layer()
	_layout()
	_focus_first.call_deferred()
	AudioManager.present.call_deferred(listen_text())


func _fill_product() -> void:
	_say(_title, Localization.t(product.name_key))
	_say(_body, Localization.t(product.description_key))
	_icon.shape = product.visual
	_icon.tint = product.color
	if product.tag in ["need", "want", "useful"]:
		_tag_row.visible = true
		_say(_tag_label, Localization.t("shop.tag." + product.tag))
		(_tag_row.get_child(0) as TagMark).kind = product.tag
	# The optional "did you know?" line: not in Focus Mode.
	if not product.fact_key.is_empty() and not Settings.focus_mode:
		_say(_fact, Localization.t(product.fact_key))
	_say(_balance, Localization.t("shop.price_and_balance", {"price": Shop.coins(product.price), "coins": Shop.coins(GameState.wallet.balance)}))


## Sets a label's text and remembers whether it has something to say
## (Listen reads it even when words are hidden).
func _say(l: Label, text: String) -> void:
	l.text = text
	l.set_meta("has", not text.is_empty())
	l.visible = not text.is_empty()


## Words on or off (Universal Play & Learn): the pictures stay either way.
func _apply_text_layer() -> void:
	var words: bool = SupportProfile.show_text()
	for l in [_title, _body, _balance, _status, _tag_label, _fact]:
		l.visible = words and bool(l.get_meta("has", false))
	for b in _list.get_children() + _buttons.get_children():
		var lbl: Node = b.get_node_or_null("Row/Words") if b is Button else null
		if lbl:
			lbl.visible = words
		var name_l: Node = b.get_node_or_null("Row/Name") if b is Button else null
		if name_l:
			name_l.visible = words


# --- pictures ------------------------------------------------------------------------

## [product] = [coins]: the price as coins; with `have`, the coins the child
## has are gold and the missing ones hollow.
func _price_row(price: int, have: int) -> HBoxContainer:
	var row := HBoxContainer.new()
	row.name = "PriceRow"
	row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_theme_constant_override("separation", 10)
	var pv := MoneyIcons.PriceView.new()
	pv.name = "Price"
	pv.set_amount(price, have, 24.0)
	row.add_child(pv)
	return row


## [coin] 3 → [coin] 1 : what buying does to your coins.
func _before_after(before: int, after: int) -> HBoxContainer:
	var row := HBoxContainer.new()
	row.name = "BeforeAfter"
	row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_theme_constant_override("separation", 10)
	row.add_child(_coin_amount(before))
	row.add_child(MoneyIcons.Arrow.new(30.0))
	row.add_child(_coin_amount(after))
	return row


## [coins] → [product]: paying coins gives you the thing.
func _pay_row(p: ProductData) -> HBoxContainer:
	var row := HBoxContainer.new()
	row.name = "PayRow"
	row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_theme_constant_override("separation", 10)
	var pips := MoneyIcons.Pips.new()
	pips.coin_px = 22.0
	pips.filled = p.price
	pips.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	row.add_child(pips)
	row.add_child(MoneyIcons.Arrow.new(30.0))
	var ic := ItemVisual.Icon.new()
	ic.shape = p.visual
	ic.tint = p.color
	ic.custom_minimum_size = Vector2(48, 48)
	row.add_child(ic)
	return row


## [bag] [product]: it is yours.
func _owned_row() -> HBoxContainer:
	var row := HBoxContainer.new()
	row.name = "OwnedRow"
	row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_theme_constant_override("separation", 8)
	row.add_child(MoneyIcons.Bag.new(40.0))
	var ic := ItemVisual.Icon.new()
	ic.shape = product.visual
	ic.tint = product.color
	ic.custom_minimum_size = Vector2(44, 44)
	row.add_child(ic)
	var n := Label.new()
	n.text = "×%d" % ProgressManager.owned_count(product.item_id())
	n.add_theme_font_size_override("font_size", 22)
	n.add_theme_color_override("font_color", INK)
	n.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	row.add_child(n)
	return row


func _coin_amount(n: int) -> HBoxContainer:
	var h := HBoxContainer.new()
	h.mouse_filter = Control.MOUSE_FILTER_IGNORE
	h.add_theme_constant_override("separation", 4)
	var c := MoneyIcons.Coin.new(28.0)
	c.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	h.add_child(c)
	var l := Label.new()
	l.text = str(n)
	l.add_theme_font_size_override("font_size", 26)
	l.add_theme_color_override("font_color", INK)
	h.add_child(l)
	return h


## Buy: coin → bag.
func _buy_icon() -> Control:
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 2)
	h.add_child(MoneyIcons.Coin.new(26.0))
	h.add_child(MoneyIcons.Arrow.new(22.0))
	h.add_child(MoneyIcons.Bag.new(28.0))
	return h


func _product_row(p: ProductData) -> Button:
	var b := Button.new()
	_style_button(b, false)
	b.name = "Product_" + p.product_id
	b.custom_minimum_size = Vector2(0, 66)
	var row := HBoxContainer.new()
	row.name = "Row"
	row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_theme_constant_override("separation", 14)
	row.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	row.offset_left = 10
	row.offset_right = -10
	b.add_child(row)
	var icon := ItemVisual.Icon.new()
	icon.shape = p.visual
	icon.tint = p.color
	icon.custom_minimum_size = Vector2(50, 50)
	icon.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	row.add_child(icon)
	var name_l := _label(20)
	name_l.name = "Name"
	name_l.text = Localization.t(p.name_key)
	name_l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	name_l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	name_l.autowrap_mode = TextServer.AUTOWRAP_OFF
	name_l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_child(name_l)
	var spacer := Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	spacer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_child(spacer)
	# The price as coins; coins the child does not have yet are hollow, so
	# "can I afford it?" is visible before choosing.
	var pv := MoneyIcons.PriceView.new()
	pv.name = "Price"
	pv.set_amount(p.price, GameState.wallet.balance, 18.0)
	pv.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	row.add_child(pv)
	var spoken: String = "%s, %s" % [name_l.text, Shop.coins(p.price)]
	# Learned in the Library ("price detective", LearningDesk): the cheapest
	# thing at this stall gets a star — what was learned changes how the
	# child shops.
	if ProgressManager.is_activity_completed(LearningDesk.SKILL_PRICES) and shop and p.price == shop.cheapest_price():
		var star := MissionStrip.Glyph.new("star", 34.0)
		star.name = "CheapestMark"
		star.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		row.add_child(star)
		spoken += ", " + Localization.t("shop.cheapest_mark")
	if ProgressManager.owns(p.item_id()):
		var bag := MoneyIcons.Bag.new(28.0)
		bag.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		row.add_child(bag)
		spoken += ", " + Localization.t("shop.owned_mark")
	b.set_meta("spoken", spoken)
	b.tooltip_text = spoken
	Narration.read_on_focus(b, spoken)
	b.pressed.connect(select_product.bind(p.product_id))
	return b


# --- actions --------------------------------------------------------------------

func _buy() -> void:
	var before: int = GameState.wallet.balance
	var hud: Node = get_tree().get_first_node_in_group("mq_hud")
	var from_world: Vector3 = Vector3.INF
	if _stall and is_instance_valid(_stall) and _stall.has_method("product_world_position"):
		from_world = _stall.product_world_position(product.product_id)
	if hud and hud.money_hud and from_world != Vector3.INF:
		hud.money_hud.coins_from_world(from_world)
	var r: Dictionary = Shop.buy(product, shop.shop_id)
	if r["status"] != Shop.OK:
		_show(View.PRODUCT)
		return
	last_before = before
	SupportProfile.record_success()
	AudioManager.play_sfx("coin", 0.9, -3.0)
	AudioManager.play_sfx("success", 1.0, -8.0)
	_react("bought")
	var player: Node = _find_player()
	if player and player.visual:
		player.visual.play_reaction("happy")
	if hud and hud.money_hud:
		hud.money_hud.item_to_bag(product.visual, product.color, from_world)
	purchased.emit(product.product_id)
	_show(View.BOUGHT)


## "Which costs less?" (a real question, answers shuffled by AnswerOrder,
## try again until right) then "Which would you choose?" (every choice is
## fine — the card says what each would leave). First time right: a little
## XP, once.
func _compare() -> void:
	var a: ProductData = shop.product(shop.compare_ids[0])
	var b: ProductData = shop.product(shop.compare_ids[1])
	if a == null or b == null:
		return
	_busy = true
	visible = false
	var keys: Array[String] = [a.name_key, b.name_key]
	var texts: Array[String] = [
		Localization.t("shop.compare_option", {"name": Localization.t(a.name_key), "price": Shop.coins(a.price)}),
		Localization.t("shop.compare_option", {"name": Localization.t(b.name_key), "price": Shop.coins(b.price)}),
	]
	var cheaper: int = 0 if a.price <= b.price else 1
	var first_try: bool = true
	while true:
		var right: bool = await ChoicePanel.show_quiz(shop.compare_question_key, keys, cheaper, texts)
		if right:
			break
		first_try = false
	var activity: String = "compare:" + shop.shop_id
	if first_try and not ProgressManager.is_activity_completed(activity):
		GameState.add_xp(5)
	if first_try:
		SupportProfile.record_success()
	ProgressManager.complete_activity(activity)
	_react("compare_ok")
	# Then a free choice: what would you pick? (No wrong answer.)
	var choice := DialogueChoice.new()
	choice.situation_text_key = shop.compare_choose_key
	for p in [a, b]:
		var o := ChoiceOption.new()
		o.label_key = p.name_key
		choice.options.append(o)
	var picked: ChoiceOption = await ChoicePanel.show_choice(choice)
	_busy = false
	if not is_instance_valid(_stall):
		return
	visible = true
	var chosen: ProductData = a if picked and picked.label_key == a.name_key else b
	var diff: int = absi(a.price - b.price)
	product = chosen
	_show(View.PRODUCT)
	var line: String = Localization.t("shop.compare_cheaper_choice", {"more": diff}) if chosen.price == mini(a.price, b.price) else Localization.t("shop.compare_dearer_choice", {"more": diff})
	_say(_status, line + " " + _status.text)
	_apply_text_layer()
	_layout()
	AudioManager.narrate(line)


func _react(kind: String) -> void:
	if _stall and is_instance_valid(_stall) and _stall.has_method("keeper_react"):
		_stall.keeper_react(kind)


func _find_player() -> Node:
	for p in get_tree().get_nodes_in_group("player"):
		if not p.is_queued_for_deletion():
			return p
	return null


# --- layout ------------------------------------------------------------------------

func _layout() -> void:
	var vp: Vector2 = get_viewport_rect().size
	var w: float = minf(MAX_WIDTH, vp.x - 32.0)
	var text_w: float = w - 60.0
	for l in [_title, _body, _balance, _status, _fact]:
		l.custom_minimum_size.x = text_w
	_body.custom_minimum_size.x = text_w - (90.0 if _detail.visible else 0.0)
	_panel.custom_minimum_size = Vector2(w, 0)
	_panel.reset_size()
	_place.call_deferred()


func _place() -> void:
	var vp: Vector2 = get_viewport_rect().size
	_panel.reset_size()
	_panel.position = Vector2((vp.x - _panel.size.x) * 0.5, maxf(vp.y - _panel.size.y - 24.0, 8.0))
	get_tree().call_group("mq_hud", "shop_card_layout", Rect2(_panel.position, _panel.size))


func _focus_first() -> void:
	if visible and is_inside_tree():
		var f: Control = _first_focus()
		if f and f.is_inside_tree():
			f.grab_focus()


func _first_focus() -> Control:
	for c in _list.get_children():
		if c is Button:
			return c
	for c in _buttons.get_children():
		if c is Button and c.visible and not c.disabled:
			return c
	return _listen


func _add_close() -> void:
	var b := _button(Localization.t("interaction.close_button"), false, MoneyIcons.Cross.new(26.0))
	b.name = "CloseButton"
	b.pressed.connect(close)
	_buttons.add_child(b)


func _add_back() -> void:
	var b := _button(Localization.t("shop.back_button"), false, MoneyIcons.Arrow.new(30.0, true))
	b.name = "BackButton"
	b.pressed.connect(func() -> void: _show(View.LIST))
	_buttons.add_child(b)


func _clear(box: Container) -> void:
	for c in box.get_children():
		if c == _listen:
			box.remove_child(c)
			continue
		box.remove_child(c)
		c.queue_free()


func _build() -> void:
	_panel = PanelContainer.new()
	_panel.name = "Panel"
	_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	_stripe = StyleBoxFlat.new()
	_stripe.bg_color = CREAM
	_stripe.set_corner_radius_all(18)
	_stripe.border_width_left = 10
	_stripe.border_color = Color("F07A5A")
	_stripe.content_margin_left = 24
	_stripe.content_margin_right = 20
	_stripe.content_margin_top = 16
	_stripe.content_margin_bottom = 16
	_stripe.shadow_color = Color(0, 0, 0, 0.18)
	_stripe.shadow_size = 8
	_panel.add_theme_stylebox_override("panel", _stripe)
	add_child(_panel)
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 8)
	_panel.add_child(box)
	_title = _label(24)
	box.add_child(_title)
	_detail = HBoxContainer.new()
	_detail.add_theme_constant_override("separation", 16)
	box.add_child(_detail)
	_icon = ItemVisual.Icon.new()
	_icon.custom_minimum_size = Vector2(72, 72)
	_detail.add_child(_icon)
	var dcol := VBoxContainer.new()
	dcol.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_detail.add_child(dcol)
	_tag_row = HBoxContainer.new()
	_tag_row.add_theme_constant_override("separation", 8)
	_tag_row.add_child(TagMark.new())
	_tag_label = _label(18)
	_tag_label.add_theme_color_override("font_color", Color("0B5C50"))
	_tag_label.autowrap_mode = TextServer.AUTOWRAP_OFF
	_tag_row.add_child(_tag_label)
	dcol.add_child(_tag_row)
	_visual = VBoxContainer.new()
	_visual.name = "Pictures"
	_visual.add_theme_constant_override("separation", 6)
	dcol.add_child(_visual)
	_body = _label(19)
	box.add_child(_body)
	_fact = _label(17)
	_fact.add_theme_color_override("font_color", Color("4A5653"))
	box.add_child(_fact)
	_balance = _label(19)
	_balance.add_theme_color_override("font_color", Color("0B5C50"))
	box.add_child(_balance)
	_list = VBoxContainer.new()
	_list.add_theme_constant_override("separation", 8)
	box.add_child(_list)
	_status = _label(20)
	box.add_child(_status)
	_buttons = HBoxContainer.new()
	_buttons.add_theme_constant_override("separation", 12)
	box.add_child(_buttons)
	_listen = Narration.listen_button()
	_listen.custom_minimum_size = Vector2(120, 56)
	_buttons.add_child(_listen)


func _label(size: int) -> Label:
	var l := Label.new()
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", INK)
	return l


## A button with an icon (always) and words (when words are on). The words
## are still its accessible name (tooltip, Listen on focus).
func _button(text: String, primary: bool, icon: Control = null) -> Button:
	var b := Button.new()
	_style_button(b, primary)
	b.custom_minimum_size = Vector2(72, 56)
	b.tooltip_text = text
	if icon == null:
		b.text = text
		return b
	var row := HBoxContainer.new()
	row.name = "Row"
	row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	row.add_theme_constant_override("separation", 8)
	row.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	icon.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	row.add_child(icon)
	var words := Label.new()
	words.name = "Words"
	words.text = text
	words.add_theme_font_size_override("font_size", 19)
	words.add_theme_color_override("font_color", Color.WHITE if primary else INK)
	words.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	row.add_child(words)
	b.add_child(row)
	# Size the button to its content (icon + words), at least touch size.
	var font: Font = words.get_theme_font("font")
	var tw: float = font.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, 19).x if SupportProfile.show_text() else 0.0
	b.custom_minimum_size = Vector2(maxf(72.0, icon.get_combined_minimum_size().x + tw + 44.0), 56)
	b.set_meta("spoken", text)
	Narration.read_on_focus(b, text)
	return b


func _style_button(b: Button, primary: bool) -> void:
	b.add_theme_font_size_override("font_size", 19)
	for state in ["normal", "hover", "pressed", "focus", "disabled"]:
		var sb := StyleBoxFlat.new()
		sb.set_corner_radius_all(12)
		sb.content_margin_left = 18
		sb.content_margin_right = 18
		if primary:
			sb.bg_color = TEAL.darkened(0.15) if state == "pressed" else TEAL
		else:
			sb.bg_color = Color("EDE6D3") if state != "disabled" else Color("EDE6D3", 0.5)
			sb.border_color = Color("B9AE97")
			sb.set_border_width_all(2)
		if state == "focus" or state == "hover":
			sb.border_color = INK
			sb.set_border_width_all(4)
		b.add_theme_stylebox_override(state, sb)
	var fc: Color = Color.WHITE if primary else INK
	for c in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color"]:
		b.add_theme_color_override(c, fc)


## The need / want / useful mark: a SHAPE as well as the word — a house
## (need), a star (want), a tool-ish square (useful).
class TagMark extends Control:
	var kind: String = "need":
		set(v):
			kind = v
			queue_redraw()

	func _init() -> void:
		custom_minimum_size = Vector2(26, 26)
		mouse_filter = Control.MOUSE_FILTER_IGNORE

	func _draw() -> void:
		var c: Vector2 = size * 0.5
		var r: float = minf(size.x, size.y) * 0.5
		var teal := Color("0F7A6B")
		match kind:
			"want":
				var pts := PackedVector2Array()
				for i in 10:
					var a: float = -PI * 0.5 + TAU * i / 10.0
					pts.append(c + Vector2(cos(a), sin(a)) * (r if i % 2 == 0 else r * 0.45))
				draw_colored_polygon(pts, Color("E8A33D"))
			"useful":
				draw_rect(Rect2(c - Vector2(r, r) * 0.75, Vector2(r, r) * 1.5), Color("367D99"))
			_:
				draw_colored_polygon(PackedVector2Array([c + Vector2(-r, 0), c + Vector2(0, -r), c + Vector2(r, 0)]), teal)
				draw_rect(Rect2(c + Vector2(-r * 0.7, 0), Vector2(r * 1.4, r * 0.9)), teal)
