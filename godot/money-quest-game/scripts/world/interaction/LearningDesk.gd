class_name LearningDesk
extends ActivityStation
## LearningDesk — "I used a resource to learn something" (Money is a tool).
## A reading desk with a lamp and an open book. Bring a notebook (bought
## with coins at Market Town's paper stall) and use it here: the notebook
## goes onto the desk, the pages fill, and the child learns a skill —
## "price detective": from now on every stall marks its cheapest thing
## with a star (ShopCard), so what was learned changes how they shop.
##
##   coins → notebook → desk → skill (star) → a new possibility at the stalls
##
## Without a notebook nothing is locked away: the desk shows, in pictures,
## where one comes from (the paper stall). Reading the library's books
## stays free, as in a real library. Once learned, using the desk again
## just shows what was learned. Pictures first; words optional.

const SKILL_PRICES: String = "skill:price_detective"
const NOTEBOOK: String = "product:notebook"
const NOTEBOOK_FANCY: String = "product:notebook_fancy"
const XP: int = 15

signal learned

var _pages: Node3D


func _init() -> void:
	prompt_key = "interaction.learn_prompt"


static func has_notebook() -> String:
	for id in [NOTEBOOK, NOTEBOOK_FANCY]:
		if ProgressManager.owns(id):
			return id
	return ""


static func is_learned() -> bool:
	return ProgressManager.is_activity_completed(SKILL_PRICES)


func _build_visual() -> Node3D:
	var root := Node3D.new()
	root.name = "Desk"
	var m := MeshMerger.new()
	m.part(DecorKit.box(Vector3(1.4, 0.08, 0.8)), DecorKit.mat("wood"), Vector3(0, 0.78, 0))
	for x in [-0.62, 0.62]:
		for z in [-0.32, 0.32]:
			m.part(DecorKit.box(Vector3(0.08, 0.78, 0.08)), DecorKit.mat("wood_dark"), Vector3(x, 0.39, z))
	# The open book.
	m.part(DecorKit.box(Vector3(0.34, 0.03, 0.44)), DecorKit.mat("cream"), Vector3(-0.17, 0.835, 0), Vector3(0, 0, 6))
	m.part(DecorKit.box(Vector3(0.34, 0.03, 0.44)), DecorKit.mat("cream"), Vector3(0.17, 0.835, 0), Vector3(0, 0, -6))
	m.part(DecorKit.box(Vector3(0.72, 0.02, 0.48)), DecorKit.mat("sky"), Vector3(0, 0.815, 0))
	# A lamp.
	m.part(DecorKit.cyl(0.1, 0.12, 0.04, 12), DecorKit.mat("teal"), Vector3(0.52, 0.84, -0.22))
	m.part(DecorKit.cyl(0.02, 0.02, 0.4, 6), DecorKit.mat("ink"), Vector3(0.52, 1.04, -0.22))
	m.part(DecorKit.cyl(0.06, 0.16, 0.14, 12), DecorKit.mat("gold", 0.5), Vector3(0.52, 1.24, -0.22))
	m.commit_to(root, "DeskMesh", true)
	var body := StaticBody3D.new()
	body.collision_layer = 1
	body.collision_mask = 0
	root.add_child(body)
	DecorKit.add_box_collider(body, Vector3(1.4, 0.85, 0.8), DecorKit.xf(Vector3(0, 0.42, 0)))
	# The notebook, once it is here (shown after learning).
	var nm := MeshMerger.new()
	nm.part(DecorKit.box(Vector3(0.26, 0.04, 0.34)), DecorKit.mat("sky"), Vector3.ZERO)
	nm.part(DecorKit.box(Vector3(0.2, 0.045, 0.02)), DecorKit.mat("cream"), Vector3(0, 0.002, 0.08))
	_pages = Node3D.new()
	_pages.name = "Notebook"
	nm.commit_to(_pages, "NotebookMesh", false)
	_pages.position = Vector3(-0.45, 0.84, 0.18)
	_pages.visible = is_learned()
	root.add_child(_pages)
	return root


func interact() -> void:
	used.emit()
	if is_learned():
		ResourcePurpose.show_outcome(self, ["book"], ["star", "stall"], "learn.desk.remember")
		return
	var nb: String = has_notebook()
	if nb.is_empty():
		# Where a notebook comes from, in pictures (nothing is locked away).
		ResourcePurpose.show_outcome(self, ["coin", "then", "stall"], ["item:notebook:6FA8DC", "then", "book"], "learn.desk.need_notebook")
		return
	await _learn(nb)


func _learn(nb: String) -> void:
	ProgressManager.mark_item_used(nb)
	# The notebook arrives on the desk (a short drop; instant with Reduced Motion).
	_pages.visible = true
	if not Settings.reduced_motion:
		var y: float = _pages.position.y
		_pages.position.y = y + 0.6
		var tw := create_tween()
		tw.tween_property(_pages, "position:y", y, 0.4).set_trans(Tween.TRANS_BOUNCE).set_ease(Tween.EASE_OUT)
		await tw.finished
	AudioManager.play_sfx("xp", 1.0, -4.0)
	ProgressManager.complete_activity(SKILL_PRICES)
	SupportProfile.record_success()
	GameState.add_xp(XP)
	_react_nearby()
	learned.emit()
	await ResourcePurpose.show_outcome(self, ["item:notebook:6FA8DC", "then", "book"], ["star", "stall"], "learn.desk.learned")


## Someone nearby (the librarian) is pleased: a happy reaction, no words.
func _react_nearby() -> void:
	for n in get_tree().get_nodes_in_group("mq_npc"):
		if n is NPC and n.visual and n.global_position.distance_to(global_position) < 7.0:
			n.visual.play_reaction("celebrate")
