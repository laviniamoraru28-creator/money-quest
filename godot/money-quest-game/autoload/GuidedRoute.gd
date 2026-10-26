extends Node
## GuidedRoute — the guided adventure: chapters of missions played in
## order, so a child always knows the current mission, what to do, whether
## it is done and what comes next — without wandering the Hub looking for
## a door or a person.
##
## A thin layer over what already exists; it replaces nothing:
## - the missions are the places' own activities (their flows, quests and
##   lessons, with their own pictures, hints and demonstrations);
## - "done" is read from ProgressManager (already saved), so a loaded game
##   resumes at the first unfinished mission — no new save data;
## - travel is WorldManager.travel_to (straight to the right place);
## - only the child's "not now" (pause) is remembered, in
##   ProgressManager.activity_state.
##
## When a mission is offered: once per session on the first arrival
## somewhere, after a mission is done (once the place's own celebration is
## over), and when the child asks for it (Help → Mission). Never inside
## Calm World, never on top of another panel, and never repeatedly — the
## Hub and free exploration stay open to everyone.

signal route_changed

## The chapters, in order (data/route/). Listed (not scanned) so exported
## builds find them.
const CHAPTER_PATHS: Array[String] = [
	"res://data/route/chapter_1_coins.tres",
	"res://data/route/chapter_2_money.tres",
]
const STATE: String = "guided-route"
## The screen must be calm this long before a mission card appears.
const IDLE_SECONDS: float = 1.2

var chapters: Array[RouteChapterData] = []
var _offered_this_session: bool = false
## The mission that was current when last looked at: when it becomes done,
## its "Done!" card (with the next mission) is shown.
var _watching: MissionStepData = null
var _waiting: bool = false
## A mission finished somewhere the child has since left: its card waits
## for the next arrival.
var _pending_done: MissionStepData = null
var _card: GuidedMissionCard = null


func _ready() -> void:
	for p in CHAPTER_PATHS:
		var ch: RouteChapterData = load(p)
		if ch:
			chapters.append(ch)
	chapters.sort_custom(func(a: RouteChapterData, b: RouteChapterData) -> bool: return a.order < b.order)
	WorldManager.zone_loaded.connect(_on_zone_loaded)
	# Going somewhere else closes an open card (nothing is paused or lost).
	WorldManager.zone_change_requested.connect(func(_z: ZoneData) -> void:
		if is_instance_valid(_card):
			_card._finish("dismiss"))
	ProgressManager.activity_changed.connect(func(_id: String) -> void: _check())
	ProgressManager.quest_completed.connect(func(_id: String) -> void: _check())
	ProgressManager.lesson_completed.connect(func(_id: String) -> void: _check())
	ProgressManager.badge_awarded.connect(func(_id: String) -> void: _check())


# --- where the child is on the route --------------------------------------------------

## The first unfinished mission: {"chapter", "chapter_index", "step",
## "index", "count"} — or {} when every mission is done.
func current() -> Dictionary:
	for ci in chapters.size():
		var ch: RouteChapterData = chapters[ci]
		for i in ch.steps.size():
			if not is_step_done(ch.steps[i]):
				return {"chapter": ch, "chapter_index": ci, "step": ch.steps[i], "index": i, "count": ch.steps.size()}
	return {}


func is_step_done(step: MissionStepData) -> bool:
	# "a|b": done when any of the ways the game records it is true (e.g. a
	# first purchase made through Market Town's guided tutorial, or later).
	for cond in step.done_when.split("|", false):
		if _condition_met(cond.strip_edges()):
			return true
	return false


func _condition_met(cond: String) -> bool:
	var parts: PackedStringArray = cond.split(":", true, 1)
	if parts.size() < 2:
		return false
	match parts[0]:
		"activity":
			return ProgressManager.is_activity_completed(parts[1])
		"quest":
			return ProgressManager.is_quest_completed(parts[1])
		"lesson":
			return ProgressManager.is_lesson_completed(parts[1])
		"badge":
			return ProgressManager.has_badge(parts[1])
		"state":
			var sk: PackedStringArray = parts[1].split(":")
			return sk.size() == 2 and int(ProgressManager.get_activity_state(sk[0], sk[1], 0)) > 0
	return false


func is_paused() -> bool:
	return bool(ProgressManager.get_activity_state(STATE, "paused", false))


## The route is guiding right now (not paused, a mission left).
func is_active() -> bool:
	return not is_paused() and not current().is_empty()


## For the mission card on the HUD: the chapter and how far along it is.
func progress() -> Dictionary:
	var cur: Dictionary = current()
	if cur.is_empty():
		return {}
	return {"index": int(cur["index"]), "count": int(cur["count"]), "chapter": (cur["chapter"] as RouteChapterData).title_key}


# --- pause and resume (the child's own pace) ---------------------------------------------

## "Not now": the route waits (remembered across sessions) until the child
## chooses Mission again in Help.
func pause() -> void:
	ProgressManager.set_activity_state(STATE, "paused", true)
	route_changed.emit()


func resume() -> void:
	ProgressManager.set_activity_state(STATE, "paused", false)
	route_changed.emit()
	var cur: Dictionary = current()
	if not cur.is_empty():
		_watching = cur["step"]
		offer(cur)


# --- offering missions -------------------------------------------------------------------

func _on_zone_loaded(zone: ZoneData) -> void:
	var cur: Dictionary = current()
	if _watching == null and not cur.is_empty():
		_watching = cur["step"]
	route_changed.emit()
	if zone.kind == ZoneData.ZoneKind.CALM:
		return   # Calm World never gets a mission card
	if _pending_done and not is_paused():
		# A mission finished in the last place: its "done" card, on arrival.
		var done: MissionStepData = _pending_done
		_pending_done = null
		_offered_this_session = true
		if await _wait_until_calm(null) and WorldManager.current_zone_id == zone.zone_id:
			offer(current(), done)
		return
	if _offered_this_session or is_paused() or cur.is_empty():
		return
	_offered_this_session = true
	if (cur["step"] as MissionStepData).zone_id == zone.zone_id:
		return   # already where the mission is: the place guides from here
	if not await _wait_until_calm(null):
		return
	if is_active() and WorldManager.current_zone_id == zone.zone_id:
		offer(current())


## A mission may have just been finished.
func _check() -> void:
	if _waiting or _watching == null or not is_step_done(_watching):
		return
	var done: MissionStepData = _watching
	var zone_done: String = WorldManager.current_zone_id
	_waiting = true
	var ok: bool = await _wait_until_calm(done)
	_waiting = false
	var cur: Dictionary = current()
	_watching = cur.get("step", null)
	route_changed.emit()
	if not ok or is_paused():
		return
	if WorldManager.current_zone_id != zone_done:
		# The child has moved on and may be busy with something else: the
		# "done" card never interrupts them there — it waits for their next
		# arrival somewhere, before anything starts.
		_pending_done = done
		return
	offer(cur, done)


## Shows the mission card: the finished mission's ✓ (if any), then the
## next mission's goal, one instruction and "Let's go" / "Not now".
func offer(cur: Dictionary, done: MissionStepData = null) -> void:
	if is_instance_valid(_card):
		return
	var chapter_done: bool = done != null and (cur.is_empty() or _chapter_of(done) != cur.get("chapter"))
	_card = GuidedMissionCard.new()
	add_child(_card)
	var choice: String = await _card.present(cur, done, chapter_done, _chapter_of(done) if done else null)
	_card = null
	match choice:
		"go":
			go(cur)
		"later":
			pause()


## Takes the child straight to the mission's place (no walking through
## other rooms). Already there: the place's own guidance takes over.
func go(cur: Dictionary) -> void:
	if cur.is_empty():
		return
	var step: MissionStepData = cur["step"]
	if WorldManager.current_zone_id != step.zone_id:
		WorldManager.travel_to(step.zone_id)


## The mission's goal picture while the child is in its place — the HUD
## mission card falls back to it when the place's current step has no
## picture of its own, so there is always a picture goal (words off too).
func goal_icons_here() -> Array:
	if not is_active():
		return []
	var step: MissionStepData = current()["step"]
	return Array(step.goal_icons) if step.zone_id == WorldManager.current_zone_id else []


func card_open() -> bool:
	return is_instance_valid(_card)


func _chapter_of(step: MissionStepData) -> RouteChapterData:
	for ch in chapters:
		if ch.steps.has(step):
			return ch
	return null


## Waits until nothing else is on screen (dialogue, a choice, a reward, a
## focused panel) for IDLE_SECONDS — and, for a finished mission whose
## place ends with its own objective, until that objective is up (or the
## child has left). False if the zone was left before an offer at arrival.
func _wait_until_calm(done: MissionStepData) -> bool:
	var zone_at_start: String = WorldManager.current_zone_id
	var calm: float = 0.0
	while calm < IDLE_SECONDS:
		await get_tree().create_timer(0.2).timeout
		if done == null and WorldManager.current_zone_id != zone_at_start:
			return false
		var ready: bool = _screen_is_calm()
		if ready and done and not done.finish_objective.is_empty() and WorldManager.current_zone_id == done.zone_id:
			ready = ObjectiveManager.objective_id == done.finish_objective
		calm = calm + 0.2 if ready else 0.0
	return true


func _screen_is_calm() -> bool:
	if DialogueBox.visible or ChoicePanel.visible or RewardPopup.visible:
		return false
	if get_tree().paused:
		return false
	# A place's own picture intro is showing: let the child read it first
	# (two cards never overlap).
	for n in get_tree().get_nodes_in_group("mq_visual_intro"):
		if not n.is_queued_for_deletion():
			return false
	# ...and the place's name ("You are entering") has had its moment.
	var hud: Node = get_tree().get_first_node_in_group("mq_hud")
	if hud and hud.get("zone_banner") and (hud.zone_banner as CanvasItem).visible:
		return false
	# ...and an activity's result card (✓ / not yet) has gone by itself.
	if hud:
		for n in ["FeedbackSuccess", "FeedbackNotYet"]:
			var fb: Node = hud.get_node_or_null(n)
			if fb and not fb.is_queued_for_deletion():
				return false
	return UIFocus.visible_focus(get_viewport()) == null
