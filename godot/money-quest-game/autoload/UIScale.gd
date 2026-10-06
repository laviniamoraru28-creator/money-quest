extends Node
## UIScale — applies the player's "Text and interface size" setting
## (Settings.ui_scale: Small / Medium / Large / Extra Large) to the whole
## 2D interface at once, by scaling the root window's content. Menus,
## dialogue, objectives, prompts and rewards all grow together, keeping
## their layout; the 3D world itself is not affected.
##
## Never cut off: some older panels (mini-games, cards) are fixed-size
## boxes laid out for the smallest size. Whenever a panel layer shows (and
## when the size or the window changes), its "Panel" box is checked against
## the screen and, if it would not fit, gently scaled down around its centre
## until it does — at Extra Large that still keeps text at least as large as
## the Small setting. Event-driven: nothing runs per frame.

const MARGIN: float = 12.0

var _layers: Array[CanvasLayer] = []


func _ready() -> void:
	apply()
	Settings.changed.connect(_on_setting_changed)
	get_tree().node_added.connect(_on_node_added)
	get_tree().root.size_changed.connect(_refit_all)
	_scan_root.call_deferred()


func _on_setting_changed(key: String, _value: Variant) -> void:
	if key == "ui_scale":
		apply()


func apply() -> void:
	get_tree().root.content_scale_factor = Settings.ui_scale_factor()
	_refit_all.call_deferred()


func _scan_root() -> void:
	for n in get_tree().root.get_children():
		_on_node_added(n)


func _on_node_added(node: Node) -> void:
	if node is CanvasLayer and not _layers.has(node):
		_layers.append(node)
		(node as CanvasLayer).visibility_changed.connect(_on_layer_visibility.bind(node))
		node.tree_exiting.connect(func(): _layers.erase(node))
		if (node as CanvasLayer).visible:
			_fit_later(node)


func _on_layer_visibility(layer: CanvasLayer) -> void:
	if layer.visible:
		_fit_later(layer)


func _refit_all() -> void:
	for layer in _layers:
		if is_instance_valid(layer) and layer.visible:
			_fit_later(layer)


## After the layout settles, scale the layer's "Panel" down to fit if needed.
func _fit_later(layer: CanvasLayer) -> void:
	var panel := layer.get_node_or_null("Panel") as Control
	if panel == null:
		return
	await get_tree().process_frame
	if not is_instance_valid(panel):
		return
	fit(panel)


## Scales `panel` (around its centre) so it fits on screen; 1 when it does.
static func fit(panel: Control) -> float:
	var vp: Vector2 = panel.get_viewport_rect().size
	var s: Vector2 = panel.size
	var k: float = 1.0
	if s.x > 0.0 and s.y > 0.0:
		k = minf(1.0, minf((vp.x - MARGIN * 2.0) / s.x, (vp.y - MARGIN * 2.0) / s.y))
	panel.pivot_offset = s * 0.5
	panel.scale = Vector2(k, k)
	panel.set_meta("fit_scale", k)
	return k
