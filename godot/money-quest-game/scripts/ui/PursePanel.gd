class_name PursePanel
extends PanelContainer
## PursePanel — "what you are holding" during an activity: the child's
## face, a coin and how many coins are left to place, as pips (gold = in
## your hand). Used whenever an activity gives the child a set of coins to
## share out (the Time Vault, budgeting, planning). Separate from the
## wallet: activity coins never touch the child's real (virtual) wallet.
##
## Every change pops (none with Reduced Motion) and, when a world position
## is given, a coin flies between the place and the purse.

var amount: int = 0
var total: int = 0
var _pips: MoneyIcons.Pips
var _number: Label


static func open(host: Node, p_amount: int, p_total: int = -1) -> PursePanel:
	var hud: Node = host.get_tree().get_first_node_in_group("mq_hud")
	var p := PursePanel.new()
	p.total = p_total if p_total >= 0 else p_amount
	(hud if hud else host.get_tree().current_scene).add_child(p)
	p.set_amount(p_amount)
	return p


func _ready() -> void:
	name = "PursePanel"
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_theme_stylebox_override("panel", UIStyle.panel(UIStyle.GOLD, 16))
	var row := HBoxContainer.new()
	row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_theme_constant_override("separation", 10)
	add_child(row)
	row.add_child(MissionStrip.Face.new(52.0, ""))
	var c := MoneyIcons.Coin.new(34.0)
	c.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	row.add_child(c)
	_number = UIStyle.label("0", UIStyle.TITLE)
	_number.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	row.add_child(_number)
	_pips = MoneyIcons.Pips.new()
	_pips.coin_px = 18.0
	_pips.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	row.add_child(_pips)
	_place.call_deferred()


func _place() -> void:
	reset_size()
	var vp: Vector2 = get_viewport_rect().size
	position = Vector2(vp.x - size.x - 16.0, 70.0)


func set_amount(n: int, from_world: Vector3 = Vector3.INF) -> void:
	var before: int = amount
	amount = maxi(n, 0)
	if _number == null:
		return
	_number.text = str(amount)
	_pips.filled = amount
	_pips.hollow = maxi(total - amount, 0)
	_place.call_deferred()
	if before == amount or Settings.reduced_motion or not is_inside_tree():
		return
	pivot_offset = size * 0.5
	var tw := create_tween()
	tw.tween_property(self, "scale", Vector2.ONE * 1.12, 0.08)
	tw.tween_property(self, "scale", Vector2.ONE, 0.15)
	if from_world != Vector3.INF:
		_fly(from_world, amount > before)


## Where on screen the purse is (for coins flying in or out).
func screen_center() -> Vector2:
	return get_global_rect().get_center()


func _fly(world: Vector3, into_purse: bool) -> void:
	var cam: Camera3D = get_viewport().get_camera_3d()
	if cam == null or cam.is_position_behind(world):
		return
	var p: Vector2 = cam.unproject_position(world)
	var coin := MoneyIcons.Coin.new(26.0)
	coin.size = Vector2(26, 26)
	get_parent().add_child(coin)
	var a: Vector2 = p if into_purse else screen_center()
	var b: Vector2 = screen_center() if into_purse else p
	coin.position = a - coin.size * 0.5
	var tw := coin.create_tween()
	tw.tween_property(coin, "position", b - coin.size * 0.5, 0.45).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN_OUT)
	tw.tween_callback(coin.queue_free)
