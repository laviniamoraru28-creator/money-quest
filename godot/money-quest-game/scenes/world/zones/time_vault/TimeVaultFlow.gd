extends Node3D
## TimeVaultFlow — the Time Vault, Money Quest World's first gold-standard
## interaction:
##
##   SEE       three places for money, different by shape (piggy / bank /
##             vault with a padlock); the keeper points at each
##   DO        walk to a place and put a coin in (one per press); the purse
##             in the HUD shows what is left
##   CHOOSE    how to share the coins out — no right answer
##   CONSEQUENCE  pull the clock: years pass (seasons in the window, the
##             calendar counts, the tree and the avatar grow), the numbers
##             over the places change. Then the bike breaks: take coins out
##             of open places and fix it — the vault stays locked. At the
##             end the vault opens and everything is counted.
##   WHAT IF?  your way next to another way (WhatIf), as pictures
##   REPEAT    try again (your way), try that way, or done
##
## Words are never needed: pictures, objects, characters and numbers carry
## it; the words that exist ("ISA" on the UK vault, short mission lines)
## are optional. The "More" stand opens the deeper layers (InfoLayers).
##
## Complexity follows the child's own level in what this develops
## (Competency, via data/activities/time_vault_spec.tres) — never age: the
## room grows from two places (level 1) to a third locked place and a need
## (2), a goal (3), new numbers (4), rising prices (5–6), two needs (7) and
## choosing their own goal (8). See TimeVaultModel.STAGES.

const SPEC: ActivitySpec = preload("res://data/activities/time_vault_spec.tres")
const STATE: String = "time_vault"
const PLACE_POS: Dictionary = {
	"piggy": Vector3(-4.6, 0, -3.2),
	"bank": Vector3(0.0, 0, -3.6),
	"vault": Vector3(4.6, 0, -3.2),
}
const MACHINE_POS: Vector3 = Vector3(7.4, 0, 1.2)
## In view of a child standing at the clock (the camera looks past them
## into the room), between the clock and the bank.
const NEED_POS: Array = [Vector3(3.0, 0, 0.6), Vector3(-1.8, 0, 0.8)]
const GOAL_POS: Vector3 = Vector3(7.2, 0, -6.6)
const KEEPER_POS: Vector3 = Vector3(-2.2, 0, 2.2)
const INFO_POS: Vector3 = Vector3(-8.4, 0, 6.4)
const YEAR_SECONDS: float = 0.55
const GROWTH_PER_YEAR: float = 0.012
const MISSION_ICONS: Dictionary = {
	"tv.time": ["you", "then", "clock"],
	"tv.next": ["you", "then", "retry", "door"],
}

var level: int = 1
var st: Dictionary = {}
var places: Dictionary = {}           # kind -> MoneyPlace
var machine: TimeMachine
var window: SeasonWindow
var needs: Array[NeedStand] = []
var keeper: NPC
var info: InfoStand
var guidance: GuidanceSystem
var purse: PursePanel
var goal_node: Node3D
var _goal_label: Label3D

var phase: String = "start"   # place | time | need | end | compare | done
var year: float = 0.0
## This run's own money (a separate MoneyBook — never the child's real
## MoneyLife): the purse and one account per place, each with its product
## rule. Coins move by transfers; growth is the rule's, paid each year.
var book: MoneyBook
## Coins in hand (the purse account).
var pocket: int:
	get:
		return book.balance("purse") if book != null else 0
var alloc: Dictionary = {}           # coins placed when time started
var book_year: int = 0               # whole years the book has lived
var need_index: int = -1
var paid: Array = []
var goal_amount: int = 0
var attempts: int = 0
var demo_watched: bool = false
var _trail_before: int = 0
var _busy: bool = false
var _demo_done: bool = false


func _ready() -> void:
	Competency.register_activity(SPEC)
	VisualMissions.register(MISSION_ICONS)
	var root: Node3D = self
	for kind in TimeVaultModel.PLACES_ALL:
		var p := MoneyPlace.new()
		p.kind = kind
		p.name = "Place_" + kind
		p.position = PLACE_POS[kind]
		root.add_child(p)
		p.used.connect(_on_place_used.bind(kind))
		places[kind] = p
	machine = TimeMachine.new()
	machine.name = "TimeMachine"
	machine.position = MACHINE_POS
	machine.rotation_degrees.y = -70.0
	root.add_child(machine)
	machine.used.connect(_on_machine_used)
	window = SeasonWindow.new()
	window.position = Vector3(-1.0, 0, -10.9)
	root.add_child(window)
	window.base_growth = 0.05 * mini(int(ProgressManager.get_activity_state(STATE, "runs", 0)), 6)
	window.set_time(0.0)
	for i in NEED_POS.size():
		var n := NeedStand.new()
		n.kind = "bike" if i == 0 else "tools"
		n.name = "Need_%d" % i
		n.position = NEED_POS[i]
		root.add_child(n)
		n.used.connect(_on_need_used.bind(n))
		needs.append(n)
	_build_goal(root)
	keeper = load("res://scenes/characters/NPC.tscn").instantiate()
	keeper.npc_id = "time_keeper"
	keeper.behaviour_profile = "guide"
	keeper.animated_body = true
	root.add_child(keeper)
	keeper.position = KEEPER_POS
	info = InfoStand.new()
	info.name = "MoreStand"
	info.topic = "long_term_saving"
	info.position = INFO_POS
	info.rotation_degrees.y = 40.0
	root.add_child(info)
	guidance = GuidanceSystem.new()
	guidance.level = 1
	add_child(guidance)
	_start.call_deferred()


func _exit_tree() -> void:
	ObjectiveManager.intro_available = false
	if is_instance_valid(purse):
		purse.queue_free()
	_grow_avatar(0.0)


# --- a run --------------------------------------------------------------------------------

func _start() -> void:
	if not is_inside_tree():
		return
	purse = PursePanel.open(self, 0)
	await reset_run()
	_intro()
	_demonstrate()


## A fresh start at the child's current level (re-read every time: after
## showing understanding, "Try again" may open the next stage).
func reset_run() -> void:
	level = Competency.challenge_level(SPEC)
	st = TimeVaultModel.stage(level)
	phase = "place"
	demo_watched = false   # a demonstration counts for the run it was shown in
	year = 0.0
	book_year = 0
	need_index = -1
	paid = []
	alloc = {}
	book = TimeVaultModel.new_book(st)
	for kind in places:
		var p: MoneyPlace = places[kind]
		p.set_present(st["places"].has(kind))
		p.set_value(0.0)
		p.set_rule(TimeVaultModel.PLACE_PRODUCT[kind])
		# The padlock shows which place locks its money once the clock starts.
		p.set_locked(ProductRules.is_locked_product(TimeVaultModel.PLACE_PRODUCT[kind]))
		p.set_verb("interaction.put_prompt")
	for n in needs:
		n.set_state(false, false)
	window.set_time(0.0)
	machine.set_years(0.0)
	_grow_avatar(0.0)
	purse.total = pocket
	purse.set_amount(pocket)
	goal_amount = int(st.get("goal", 0))
	_show_goal()
	if st.has("goal_choices"):
		await _choose_goal()
	_trail_before = guidance.trail_shown_count
	_mission_place()


func _intro() -> void:
	if ProgressManager.get_activity_state(STATE, "intro_seen", false):
		ObjectiveManager.intro_available = true
		ObjectiveManager.intro_requested.connect(_play_intro)
		return
	ProgressManager.set_activity_state(STATE, "intro_seen", true)
	ObjectiveManager.intro_available = true
	ObjectiveManager.intro_requested.connect(_play_intro)
	await get_tree().create_timer(1.0).timeout
	_play_intro()


func _play_intro() -> void:
	if not is_inside_tree() or VisualIntro.find(self):
		return
	var rows: Array = [{"icons": ["you", "coins", "then"] + Array(st["places"]), "params": {"have": 3, "need": 3}, "key": "intro.tv.place"}]
	rows.append({"icons": ["clock", "then", "growth"], "key": "intro.tv.time"})
	if not st["needs"].is_empty():
		rows.append({"icons": ["bike_broken", "then", "question"], "key": "intro.tv.need"})
	VisualIntro.play(self, "time-vault", rows)


## SEE: the keeper points at each place, then at the clock — only when this
## child's level in what this develops calls for a demonstration.
func _demonstrate() -> void:
	if not WorldGuide.wants_demonstration(SPEC.competencies) or _demo_done:
		return
	_demo_done = true   # once per visit; retries are the child's own
	await get_tree().create_timer(1.6).timeout
	demo_watched = true
	for kind in st["places"]:
		if not is_inside_tree() or phase != "place":
			return
		await WorldGuide.show(keeper, places[kind], 1.4)
		WorldGuide.unlook(places[kind])
	if is_inside_tree() and phase == "place":
		WorldGuide.react(keeper, "happy", 1.6)


func _mission_place() -> void:
	ObjectiveManager.set_objective("tv.place", "objective.tv.place", {"have": pocket, "need": int(st["coins"])}, places[st["places"][0]])
	ObjectiveManager.set_icons(["you", "coins", "then"] + Array(st["places"]))


# --- DO / CHOOSE: sharing the coins out -------------------------------------------------

func _on_place_used(kind: String) -> void:
	if _busy:
		return
	var p: MoneyPlace = places[kind]
	match phase:
		"place":
			if pocket > 0:
				book.transfer("purse", kind, 1, "time_vault")
				p.set_value(book.balance(kind))
				p.pulse()
				purse.set_amount(pocket, p.global_position + Vector3(0, 1.4, 0))
				AudioManager.play_sfx("coin", 1.0 + float(book.balance(kind) % 5) * 0.05, -6.0)
				if pocket == 0:
					_all_placed()
				else:
					ObjectiveManager.set_objective("tv.place", "objective.tv.place", {"have": pocket, "need": int(st["coins"])}, p)
			elif book.balance(kind) >= 1:
				# Hands empty: using a place takes a coin back out (change your
				# mind — before time starts every place is still open).
				book.post("transfer", 1, kind, "purse", "time_vault", "coin")
				p.set_value(book.balance(kind))
				purse.set_amount(pocket, p.global_position + Vector3(0, 1.4, 0))
				_mission_place()
				_update_verbs()
		"need":
			await _take_for_need(kind)
		"done":
			await reset_run()


func _all_placed() -> void:
	_update_verbs()
	ObjectiveManager.set_objective("tv.time", "objective.tv.time", {}, machine)
	WorldGuide.look(machine, 3.4)


func _update_verbs() -> void:
	for kind in places:
		var verb: String = "interaction.put_prompt" if phase == "place" and pocket > 0 else "interaction.take_prompt"
		places[kind].set_verb(verb)


# --- CONSEQUENCE: time ---------------------------------------------------------------------

func _on_machine_used() -> void:
	if _busy:
		return
	match phase:
		"place":
			if pocket == int(st["coins"]):
				# Nothing placed yet: the places, in pictures.
				Feedback.not_yet(self, ["coins", "then"] + Array(st["places"]))
				WorldGuide.react(keeper, "thinking")
				return
			alloc = {}
			for kind in st["places"]:
				alloc[kind] = book.balance(kind)
			TimeVaultModel.start_clock(book)
			WorldGuide.unlook(machine)
			await _run_time()
		"need":
			# Go on without paying: the need stays as it is (no punishment —
			# it just isn't fixed).
			paid.append(false)
			WorldGuide.react(keeper, "oh_no", 1.8)
			await _run_time()
		"done":
			await reset_run()


## Years pass until the next need, or the end.
func _run_time() -> void:
	_busy = true
	phase = "time"
	ObjectiveManager.clear()
	machine.pull()
	_update_verbs()
	var stop: int = TimeVaultModel.YEARS
	var next_need: Dictionary = {}
	if need_index + 1 < st["needs"].size():
		next_need = st["needs"][need_index + 1]
		stop = int(next_need["year"])
	var from: float = float(book_year)
	if Settings.reduced_motion:
		_apply_time(float(stop))
	else:
		var tw := create_tween()
		tw.tween_method(_apply_time, from, float(stop), YEAR_SECONDS * (stop - from)).set_trans(Tween.TRANS_LINEAR)
		await tw.finished
	_apply_time(float(stop))
	_busy = false
	if not next_need.is_empty():
		_start_need(next_need)
	else:
		await _end()


func _apply_time(y: float) -> void:
	year = y
	window.set_time(y)
	machine.set_years(y)
	# Each whole year the book lives a year: every place's product rule is
	# applied (growth arrives as whole coins — a place that doesn't grow,
	# doesn't).
	while book_year < int(floor(y + 0.0001)) and book_year < TimeVaultModel.YEARS:
		TimeVaultModel.pass_years(book, 1)
		book_year += 1
		for kind in st["places"]:
			var p: MoneyPlace = places[kind]
			if p.shown() != book.balance(kind):
				p.set_value(book.balance(kind))
				p.pulse()
	_grow_avatar(y)
	_show_goal()


## Storytelling only: the avatar grows a little over the years (never a
## gate or a difficulty; off in Settings → avatar_growth).
func _grow_avatar(y: float) -> void:
	var player: Node = _player()
	if player == null or player.get("visual") == null:
		return
	var s: float = 1.0 + (GROWTH_PER_YEAR * y if Settings.avatar_growth else 0.0)
	(player.get("visual") as Node3D).scale = Vector3.ONE * s


# --- a need comes up -----------------------------------------------------------------------

func _start_need(need: Dictionary) -> void:
	need_index += 1
	phase = "need"
	var stand: NeedStand = needs[need_index]
	stand.set_price(TimeVaultModel.need_cost(st, need))
	stand.set_state(true, false)
	AudioManager.play_sfx("retry", 0.7, -6.0)
	WorldGuide.react(keeper, "oh_no", 2.2)
	WorldGuide.show(keeper, stand, 1.8)
	var icon: String = "bike_broken" if stand.kind == "bike" else "tools"
	ObjectiveManager.set_objective("tv.need", "objective.tv.need", {}, stand)
	ObjectiveManager.set_icons([icon, "then", "coin", "num:%d" % stand.price])
	_update_verbs()


## Taking coins out for the need: open places give; the vault won't.
func _take_for_need(kind: String) -> void:
	var p: MoneyPlace = places[kind]
	if not book.can_access(kind):
		# The product's rule: locked until the time is up (shown as a lock and
		# the calendar — never an age).
		p.refuse()
		WorldGuide.react(keeper, "locked", 2.0)
		Feedback.not_yet(self, [kind, "lock", "calendar"])
		return
	if book.balance(kind) < 1:
		Feedback.not_yet(self, [kind, "num:0"])
		return
	book.post("transfer", 1, kind, "purse", "time_vault", "coin")
	p.set_value(book.balance(kind))
	purse.total = maxi(purse.total, pocket)
	purse.set_amount(pocket, p.global_position + Vector3(0, 1.4, 0))
	AudioManager.play_sfx("coin", 1.1, -6.0)
	var stand: NeedStand = needs[need_index]
	if pocket >= stand.price:
		WorldGuide.look(stand)


func _on_need_used(stand: NeedStand) -> void:
	if _busy or phase != "need" or need_index < 0 or needs[need_index] != stand or stand.fixed:
		return
	if pocket < stand.price:
		# Not yet: how many coins are missing, and where coins could come from.
		Feedback.not_yet(self, ["coin", "num:%d" % (stand.price - pocket)])
		WorldGuide.react(keeper, "thinking")
		for kind in st["places"]:
			if book.can_access(kind) and book.balance(kind) >= 1:
				WorldGuide.show(keeper, places[kind], 1.4)
				break
		return
	_busy = true
	book.spend(stand.price, "time_vault:need", stand.kind, "purse")
	purse.set_amount(pocket, stand.global_position + Vector3(0, 1.2, 0))
	WorldGuide.unlook(stand)
	stand.fix()
	paid.append(true)
	WorldGuide.react(keeper, "happy", 2.0)
	var me: Node = _player()
	if me:
		WorldGuide.react(me, "happy", 1.6)
	Feedback.success(self, ["bike" if stand.kind == "bike" else "tools"])
	await get_tree().create_timer(1.4).timeout
	_busy = false
	if is_inside_tree():
		await _run_time()


# --- the end: counting, the vault opens, What if? -----------------------------------------

func _end() -> void:
	phase = "end"
	for kind in st["places"]:
		if places[kind].locked and book.can_access(kind):
			places[kind].set_locked(false, true)   # time is up: the lock opens
	var rows: Array = []
	for kind in st["places"]:
		rows.append([[kind, "num:%d" % int(alloc.get(kind, 0))], [kind, "num:%d" % places[kind].shown()]])
	await Feedback.changed(self, rows)
	var result: Dictionary = _my_result()
	if goal_amount > 0:
		if result["goal_met"]:
			_goal_glow()
			Feedback.success(self, ["flag", "item:kite:7A68B8"])
			WorldGuide.react(keeper, "proud", 2.0)
		else:
			Feedback.not_yet(self, ["flag", "num:%d" % (int(result["goal"]) - int(result["total"]))])
		await get_tree().create_timer(1.2).timeout
	await _compare(result)


func _my_result() -> Dictionary:
	var total: int = pocket
	var final: Dictionary = {}
	for kind in st["places"]:
		final[kind] = places[kind].shown()
		total += places[kind].shown()
	var gc: int = TimeVaultModel.goal_cost(st, goal_amount) if goal_amount > 0 else 0
	return {"final": final, "paid": paid.duplicate(), "total": total, "goal": gc, "goal_met": goal_amount <= 0 or total >= gc}


func _compare(mine: Dictionary) -> void:
	phase = "compare"
	ObjectiveManager.clear()
	var met: bool = TimeVaultModel.objective_met(st, alloc, mine)
	if met:
		Competency.record(SPEC, _evidence(), level)
	_remember_run(mine)
	var other_alloc: Dictionary = _alternative(alloc)
	var other: Dictionary = TimeVaultModel.simulate(st, other_alloc, goal_amount)
	var a := WhatIf.outcome(_choice_tokens(alloc), _result_rows(mine))
	var b := WhatIf.outcome(_choice_tokens(other_alloc), _result_rows(_rounded(other)))
	WhatIf.remember(SPEC.activity_id, a)
	var answer: String = await WhatIf.compare(self, a, b)
	if not is_inside_tree():
		return
	attempts += 1
	match answer:
		"again":
			await reset_run()
		"other":
			await reset_run()
			await _apply_alloc(other_alloc)
		_:
			phase = "done"
			ObjectiveManager.set_objective("tv.next", "objective.tv.next", {}, get_parent().get_node_or_null("PortalToGoldenVault"))
			_update_verbs()


## Which kind of success this was, for the competency record.
func _evidence() -> String:
	if demo_watched:
		return "after_demonstration"
	if Settings.visual_guidance == "strong" or guidance.trail_shown_count > _trail_before:
		return "supported"
	if attempts > 0:
		return "after_retry"
	return "independent"


## Another reasonable way to compare with: if most went into the locked
## vault, keep enough open for a need; otherwise put more in to grow.
static func _alternative_for(stage: Dictionary, a: Dictionary) -> Dictionary:
	var coins: int = int(stage["coins"])
	var has_vault: bool = stage["places"].has("vault")
	var out := {}
	for k in stage["places"]:
		out[k] = 0
	if not has_vault:
		out["piggy" if int(a.get("bank", 0)) >= coins / 2 else "bank"] = coins
		return out
	var need_total: int = 0
	for n in stage["needs"]:
		need_total += TimeVaultModel.need_cost(stage, n)
	if int(a.get("vault", 0)) > coins - need_total:
		out["bank"] = need_total
		out["vault"] = coins - need_total
	else:
		out["vault"] = coins
	return out


func _alternative(a: Dictionary) -> Dictionary:
	return _alternative_for(st, a)


## Places coins for "Try that way": they fly into the places one by one.
func _apply_alloc(a: Dictionary) -> void:
	for kind in st["places"]:
		for i in int(a.get(kind, 0)):
			if pocket <= 0:
				break
			_on_place_used(kind)
			if not Settings.reduced_motion:
				await get_tree().create_timer(0.06).timeout


func _choice_tokens(a: Dictionary) -> Array:
	var t: Array = []
	for kind in st["places"]:
		t += [kind, "num:%d" % int(a.get(kind, 0))]
	return t


func _result_rows(r: Dictionary) -> Array:
	# One row for the places (compact enough for any screen), then each
	# need, the goal and the total.
	var places_row: Array = []
	for kind in st["places"]:
		places_row += [kind, "num:%d" % int(r["final"].get(kind, 0))]
	var rows: Array = [places_row]
	for i in st["needs"].size():
		var ok: bool = i < r["paid"].size() and r["paid"][i]
		var icon: String = "bike" if i == 0 else "tools"
		# Not fixed: the money it needed was locked away (or not there).
		rows.append([icon if ok else (icon + "_broken" if icon == "bike" else "tools"), "tick" if ok else "lock"])
	if goal_amount > 0:
		rows.append(["flag", "tick" if r["goal_met"] else "num:-%d" % (int(r["goal"]) - int(r["total"]))])
	rows.append(["coin", "num:%d" % int(r["total"])])
	return rows


func _rounded(sim: Dictionary) -> Dictionary:
	var final: Dictionary = {}
	for k in sim["final"]:
		final[k] = int(round(sim["final"][k]))
	return {"final": final, "paid": sim["paid"], "total": sim["total"], "goal": sim["goal"], "goal_met": sim["goal_met"]}


## Persistent: the tree outside keeps growing a little with every finished
## visit, and the best total is remembered.
func _remember_run(r: Dictionary) -> void:
	var runs: int = int(ProgressManager.get_activity_state(STATE, "runs", 0)) + 1
	ProgressManager.set_activity_state(STATE, "runs", runs)
	ProgressManager.set_activity_state(STATE, "best", maxi(int(ProgressManager.get_activity_state(STATE, "best", 0)), int(r["total"])))
	window.base_growth = 0.05 * mini(runs, 6)


# --- the goal ------------------------------------------------------------------------------

func _build_goal(root: Node3D) -> void:
	goal_node = Node3D.new()
	goal_node.name = "Goal"
	goal_node.position = GOAL_POS
	root.add_child(goal_node)
	var m := MeshMerger.new()
	m.part(DecorKit.cyl(0.5, 0.6, 0.9, 16), DecorKit.mat("cream"), Vector3(0, 0.45, 0))
	ItemVisual.model(m, DecorKit.xf(Vector3(0, 1.3, 0)), "kite", Color("7A68B8"))
	m.part(DecorKit.box(Vector3(0.05, 1.6, 0.05)), DecorKit.mat("ink"), Vector3(0.7, 0.8, 0))
	m.part(DecorKit.prism(Vector3(0.5, 0.35, 0.04)), DecorKit.mat("coral"), Vector3(0.95, 1.45, 0), Vector3(0, 0, -90))
	m.commit_to(goal_node, "GoalMesh", true)
	_goal_label = Label3D.new()
	_goal_label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	_goal_label.font_size = 96
	_goal_label.outline_size = 18
	_goal_label.outline_modulate = MoneyIcons.INK
	_goal_label.no_depth_test = true
	_goal_label.position = Vector3(0, 2.4, 0)
	goal_node.add_child(_goal_label)


func _show_goal() -> void:
	if goal_node == null:
		return
	goal_node.visible = goal_amount > 0
	if goal_amount > 0:
		# The goal's price as it is at this moment (it may rise with time).
		_goal_label.text = str(TimeVaultModel.price_at(goal_amount, int(floor(year)), st, bool(st.get("grow_goal", false))))


func _goal_glow() -> void:
	AudioManager.play_sfx("fanfare", 1.0, -6.0)
	if Settings.reduced_motion:
		return
	var tw := goal_node.create_tween()
	tw.tween_property(goal_node, "scale", Vector3.ONE * 1.15, 0.2)
	tw.tween_property(goal_node, "scale", Vector3.ONE, 0.3)


## Stage 8: the child picks their own goal first (pictures + prices).
func _choose_goal() -> void:
	var options: Array = []
	var shapes: Array = ["kite:7A68B8", "ball:367D99", "toy_car:D13E19"]
	var choices: Array = st["goal_choices"]
	for i in choices.size():
		options.append({"purpose": "save", "id": str(choices[i]), "picture": "item:" + shapes[i % shapes.size()], "icons": ["flag", "num:%d" % int(choices[i])]})
	var picked: Dictionary = await ResourcePurpose.choose(self, options, pocket, ["flag"])
	goal_amount = int(picked.get("id", choices[1])) if not picked.is_empty() else int(choices[1])
	_show_goal()


func _player() -> Node3D:
	for n in get_tree().get_nodes_in_group("player"):
		if not n.is_queued_for_deletion() and n.get_parent() and n.get_parent().is_ancestor_of(self):
			return n
	return null
