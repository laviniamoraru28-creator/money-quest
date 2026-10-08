class_name PlayActivity
extends Node
## PlayActivity — runs a PlayActivityData (Universal Play & Learn) using the
## systems the game already has, so an activity needs data, not new code:
##
##   VisualCues        "look here" beacons          (SEE)
##   Demonstration     characters showing how       (SEE)
##   GuidanceSystem    the trail of lights          (DO, when needed)
##   ObjectiveManager  the mission + its Done!      (FLOW)
##   ShopStall/ShopCard/Shop  choosing and buying   (CHOOSE / CONSEQUENCE)
##   GameState + MoneyHUD     coins flying in, before → after  (CONSEQUENCE)
##   ProgressManager   saved progress (a finished activity never repeats)
##
## Words are never needed: every step shows what to do (a beacon, a
## pointing character, a demonstration, coins moving). Optional lines
## ("say") are subtitles / narration only. If the child seems stuck on a
## DO step, help grows by itself after SupportProfile.interaction_timeout()
## (the guide points again, the trail of lights appears).
##
## Restart-safe: things already done stay done (collected coins are
## remembered by Collectible, purchases by Shop), so running again after a
## reload simply passes those steps quickly.

signal step_started(index: int, kind: String)
signal finished(activity_id: String)

var data: PlayActivityData
## Name → node (or Array of nodes), given by the zone.
var context: Dictionary = {}
var guidance: GuidanceSystem = null
var running: bool = false
var step_index: int = -1
var current_kind: String = ""


func run(p_data: PlayActivityData, p_context: Dictionary) -> void:
	add_to_group("mq_play_activity")
	data = p_data
	context = p_context
	if ProgressManager.is_activity_completed(data.activity_id):
		finished.emit(data.activity_id)
		return
	running = true
	for i in data.steps.size():
		if not is_inside_tree():
			return
		step_index = i
		var step: Dictionary = data.steps[i]
		current_kind = String(step.get("do", ""))
		step_started.emit(i, current_kind)
		await _run_step(step)
	ProgressManager.complete_activity(data.activity_id)
	SupportProfile.record_success()
	running = false
	finished.emit(data.activity_id)


func _node(name: String) -> Node3D:
	var v: Variant = context.get(name, null)
	return v as Node3D if v is Node3D and is_instance_valid(v) else null


func _nodes(name: String) -> Array:
	var v: Variant = context.get(name, [])
	return v if v is Array else ([v] if v != null else [])


func _player() -> Node3D:
	for p in get_tree().get_nodes_in_group("player"):
		if not p.is_queued_for_deletion() and p.get_parent() and p.get_parent().is_ancestor_of(self):
			return p
	return null


func _run_step(s: Dictionary) -> void:
	match String(s.get("do", "")):
		"highlight":
			VisualCues.beacon(_node(s["target"]), float(s.get("height", -1.0)))
		"unhighlight":
			VisualCues.clear(_node(s["target"]))
		"point":
			var who := _node(s["who"]) as NPC
			var target: Node3D = _node(s["target"])
			if who and target:
				VisualCues.beacon(target)
				await Demonstration.point(who, target.global_position + Vector3(0, 1.0, 0), float(s.get("seconds", 2.0)))
		"say":
			var who2 := _node(s.get("who", "")) as NPC
			AudioManager.say(Localization.t(s["key"]), who2.get_display_name() if who2 else "")
		"walk":
			var who3 := _node(s["who"]) as NPC
			var to: Node3D = _node(s["to"])
			if who3 and to:
				await Demonstration.walk_to(who3, to.global_position + Vector3(s.get("offset", Vector3.ZERO)))
		"demonstrate_buy":
			if SupportProfile.demonstration_enabled():
				await Demonstration.buy(_node(s["who"]) as NPC, _node(s["stall"]) as ShopStall, String(s["product"]))
		"objective":
			ObjectiveManager.set_objective(String(s["id"]), String(s["key"]), {}, _node(s.get("target", "")))
			if s.has("icons"):
				ObjectiveManager.set_icons(s["icons"])
		"complete_objective":
			if ObjectiveManager.objective_id == String(s["id"]):
				ObjectiveManager.complete(String(s["id"]))
		"wait_collect":
			await _wait_collect(_nodes(s["targets"]))
		"wait_near":
			await _wait_near(_node(s["target"]), float(s.get("radius", 3.0)), _node(s.get("helper", "")) as NPC)
		"choose_purchase":
			await _choose_purchase(_node(s["stall"]) as ShopStall, s.get("choices", []), _node(s.get("helper", "")) as NPC)
		"give_coins":
			var hud: Node = get_tree().get_first_node_in_group("mq_hud")
			var from: Node3D = _node(s.get("from", ""))
			if hud and hud.money_hud and from:
				hud.money_hud.coins_from_world(from.global_position + Vector3(0, 1.0, 0))
			GameState.add_coins(int(s["amount"]), "activity:" + data.activity_id, "coin", "reward")
		"reward":
			GameState.add_xp(int(s.get("xp", 0)))
		"wait":
			await get_tree().create_timer(float(s.get("seconds", 1.0))).timeout


## DO: walk into every coin (each one highlighted until it is picked up).
func _wait_collect(targets: Array) -> void:
	for t in targets:
		if is_instance_valid(t) and not t.get("_taken"):
			VisualCues.beacon(t, 1.7)
	var id: String = ObjectiveManager.objective_id
	var shown: int = -1
	while true:
		var left: int = 0
		for t in targets:
			if is_instance_valid(t) and not t.get("_taken"):
				left += 1
		# The mission counts along: gold coins found, hollow ones still to find.
		if left != shown and ObjectiveManager.objective_id == id and not id.is_empty():
			shown = left
			var next: Node3D = null
			for t in targets:
				if is_instance_valid(t) and not t.get("_taken"):
					next = t
					break
			ObjectiveManager.set_objective(id, ObjectiveManager.text_key, {"have": targets.size() - left, "need": targets.size()}, next if next else ObjectiveManager.target())
		if left == 0:
			return
		await get_tree().create_timer(0.2).timeout


## DO: go to the target. If the child seems stuck, help grows by itself:
## the helper points again, then the trail of lights shows the way.
func _wait_near(target: Node3D, radius: float, helper: NPC) -> void:
	if target == null:
		return
	VisualCues.beacon(target)
	var waited: float = 0.0
	var helped: int = 0
	var best: float = INF
	while true:
		var p: Node3D = _player()
		var d: float = Vector2(p.global_position.x - target.global_position.x, p.global_position.z - target.global_position.z).length() if p else INF
		if d <= radius:
			VisualCues.clear(target)
			return
		await get_tree().create_timer(0.25).timeout
		# On the way already? Then no extra help: it only grows while the
		# child is not getting any closer.
		if d < best - 0.3:
			best = d
			continue
		waited += 0.25
		if waited >= SupportProfile.interaction_timeout() * (helped + 1):
			helped += 1
			if helper:
				Demonstration.point(helper, target.global_position + Vector3(0, 1.0, 0))
			if guidance and helped >= 2:
				guidance.show_trail()


## CHOOSE: the child opens the stall themselves (DO), sees the choices
## (as many as their support level suggests), and buys one. "Not enough"
## simply shows the gap and lets them choose again; nothing is lost.
func _choose_purchase(stall: ShopStall, choices: Array, helper: NPC) -> void:
	if stall == null:
		return
	var n: int = SupportProfile.choice_count()
	var offered: Array = choices.slice(0, maxi(n, 2)) if not choices.is_empty() else []
	stall.offer_only = offered
	VisualCues.beacon(stall, 3.0)
	var card := ShopCard.find(self)
	var done := [false]
	var on_buy := func(_id: String) -> void: done[0] = true
	card.purchased.connect(on_buy)
	var waited: float = 0.0
	while not done[0]:
		await get_tree().create_timer(0.25).timeout
		if card.is_open_for(stall):
			VisualCues.clear(stall)
			waited = 0.0
		else:
			if not VisualCues.has_cue(stall):
				VisualCues.beacon(stall, 3.0)
			waited += 0.25
			if helper and waited >= SupportProfile.interaction_timeout():
				waited = 0.0
				Demonstration.point(helper, stall.global_position + Vector3(0, 1.2, 0))
	card.purchased.disconnect(on_buy)
	stall.offer_only = []
	VisualCues.clear(stall)
