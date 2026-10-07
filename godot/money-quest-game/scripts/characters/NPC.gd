class_name NPC
extends Interaction
## NPC — a character the player can walk up to and talk to. Extends
## Interaction directly rather than composing one, since "this object
## reacts when talked to" IS an NPC's whole purpose here — a future object
## that needs to be interactable but ISN'T a character (a shelf, a sign)
## would extend Interaction directly instead, as the base class intends.
##
## Feels like someone, not a mannequin (vertical slice):
## - Notices you: within a few metres the head turns to look at you; closer
##   still, the whole body turns to face you; the first time you come near
##   on a visit they give a small wave (and, if a zone gives them one, call
##   out a short line — always shown as a subtitle). With nobody near, they
##   now and then glance at a neighbouring NPC, as if chatting.
## - Talks: while their line is on screen their mouth moves, with small
##   nods and a hand gesture.
## - Says what they offer, with a quiet visual hierarchy: a small "…" bubble
##   when they have something to say (set by the zone), and a gold "!"
##   bubble — gently bobbing — only when they are the current mission.
## - The talk prompt is the HUD's large "Talk  E / A / Click" pill.
## - Idles in character (CharacterBehaviour): a librarian reads, a
##   shopkeeper checks the counter, a child bounces on their toes — chosen
##   from the id, or set with behaviour_profile. Greets in that way too.
## - Reacts to the child's answers: after this NPC has been talking, a
##   right answer gets a happy little bounce, a "let's look again" gets a
##   thoughtful head-scratch (the words are always on screen as well).

## A structural id, e.g. "maya" — resolves to a display name via
## Localization ("npc.maya.name") so the same NPC script works for any
## character without hard-coding a name anywhere, the same "character id
## is structural, display name is translated" split the website's
## Leadership Quest characters already use.
@export var npc_id: String = ""

## Optional short greeting shown in the shared InteractionCard when the
## child talks to this NPC (title = the NPC's translated name). Used by the
## Hub's district greeters; zone NPCs leave it empty and keep their own
## talked_to-driven dialogue and quests exactly as before.
@export var greeting: InteractionData

## How this character idles and greets (a CharacterBehaviour preset id:
## "mentor", "shopkeeper", "child", "librarian", "guide", "gardener"...).
## Empty = chosen from npc_id.
@export var behaviour_profile: String = ""

signal talked_to(npc_id: String)

enum Indicator { NONE, TALK, QUEST }

const NOTICE_RANGE: float = 6.5
const FACE_RANGE: float = 4.0

## Label3D, not a Control/Label — in the 3D world a name floats above the
## NPC's head in world space (billboarded toward the camera).
@onready var _name_label: Label3D = $NameLabel if has_node("NameLabel") else null
@onready var _prompt_label: Label3D = $PromptLabel if has_node("PromptLabel") else null

## The character body, built from this NPC's id (see CharacterLook.for_npc):
## the same npc_id always gets the same appearance, in every zone and on
## every launch. Purely visual — the interaction range is CollisionShape3D.
var visual: CharacterRig = null
## What this NPC offers when they are not the current mission (zones set it).
var indicator: Indicator = Indicator.NONE
## A short line called out the first time the player comes near (a
## translation key; empty = just a wave). Shown as a subtitle.
var call_out_key: String = ""

var _bubble: Node3D
var _bubble_talk: Node3D
var _bubble_quest: Node3D
var _player: Node3D
var _greeted: bool = false
var _time: float = 0.0
var _neighbour: Node3D = null
var _neighbour_checked: bool = false
var _last_spoke: float = -100.0
var _linger: float = 0.0
var _lingered: bool = false


func _ready() -> void:
	super._ready()
	add_to_group("mq_npc")
	if interaction_priority == 10:
		interaction_priority = 50
	prompt_height = 2.6
	visual = CharacterBuilder.build(CharacterLook.for_npc(npc_id), false)
	visual.idle_phase = float(absi(npc_id.hash()) % 1000) * 0.0063
	visual.can_wave = npc_id == "hub-guide"
	visual.behaviour = CharacterBehaviour.preset(behaviour_profile if not behaviour_profile.is_empty() else CharacterBehaviour.preset_id_for_npc(npc_id))
	add_child(visual)
	if _name_label:
		_name_label.text = get_display_name()
		# Names show when you're near enough to meet someone; distant name
		# tags would only clutter the view (and cost draw calls).
		_name_label.visibility_range_end = 16.0
		_name_label.position.y = 2.25
	if _prompt_label:
		# The HUD's prompt pill names the action and the control instead.
		_prompt_label.visible = false
	_build_bubble()
	DialogueBox.line_shown.connect(_on_line_shown)
	DialogueBox.closed.connect(_on_dialogue_closed)
	ChoicePanel.answer_checked.connect(_on_answer_checked)


func _process(delta: float) -> void:
	_time += delta
	if _player == null or not is_instance_valid(_player) or _player.is_queued_for_deletion():
		_player = _find_player()
	_update_bubble()
	if _player == null or visual == null:
		return
	var to_player: Vector3 = _player.global_position - global_position
	to_player.y = 0.0
	var d: float = to_player.length()
	visual.look_target = _player if d < NOTICE_RANGE else _neighbour_glance()
	if d < NOTICE_RANGE and not _greeted:
		_greeted = true
		visual.greet()
		if not call_out_key.is_empty():
			AudioManager.say(Localization.t(call_out_key), get_display_name())
	# A small easter egg: stay near someone for a while without talking and
	# they notice — a happy two-handed hello and a friendly line (shown as
	# a subtitle). Once per visit; never during a conversation.
	if not _lingered and d < 3.2 and _player is CharacterBody3D and Vector2(_player.velocity.x, _player.velocity.z).length() < 0.1 and not DialogueBox.visible and not ChoicePanel.visible:
		_linger += delta
		if _linger > 9.0:
			_lingered = true
			visual.play_reaction("both_wave")
			AudioManager.say(Localization.t("npc.linger_hello"), get_display_name())
	else:
		_linger = 0.0
	if d < FACE_RANGE and d > 0.2:
		var target_yaw: float = atan2(to_player.x, to_player.z)
		if Settings.reduced_motion:
			visual.rotation.y = target_yaw
		else:
			visual.rotation.y = lerp_angle(visual.rotation.y, target_yaw, 1.0 - exp(-4.0 * delta))


## When the player is not nearby, now and then look at a neighbouring NPC
## for a few seconds — two people standing together, chatting.
func _neighbour_glance() -> Node3D:
	if not _neighbour_checked:
		_neighbour_checked = true
		for n in get_parent().get_children():
			if n != self and n is NPC and n.global_position.distance_to(global_position) < 5.0:
				_neighbour = n
				break
	if _neighbour == null or not is_instance_valid(_neighbour):
		return null
	var cycle: float = fposmod(_time + float(absi(npc_id.hash()) % 7), 11.0)
	return _neighbour if cycle < 3.5 else null


func get_display_name() -> String:
	return Localization.t("npc.%s.name" % npc_id)


func interact() -> void:
	talked_to.emit(npc_id)
	if greeting:
		var card: InteractionCard = InteractionCard.find(self)
		if card:
			card.toggle(greeting, self, get_display_name())


func is_current_objective() -> bool:
	return ObjectiveManager.target() == self


## The player of THIS zone (an NPC may be nested inside a landmark, so the
## player is not always a sibling; the old zone still in the tree during a
## zone change never counts).
func _find_player() -> Node3D:
	for p in get_tree().get_nodes_in_group("player"):
		if not p.is_queued_for_deletion() and p.get_parent() and p.get_parent().is_ancestor_of(self):
			return p
	return null


# --- speaking ---------------------------------------------------------------

func _on_line_shown(speaker_id: String) -> void:
	if visual:
		visual.talking = speaker_id == npc_id
	if speaker_id == npc_id:
		_last_spoke = _time


func _on_dialogue_closed() -> void:
	if visual:
		visual.talking = false


# --- the "…" / "!" bubble ----------------------------------------------------

func _build_bubble() -> void:
	_bubble = Node3D.new()
	_bubble.name = "Indicator"
	_bubble.position = Vector3(0, 2.75, 0)
	_bubble.scale = Vector3.ONE * 1.4
	add_child(_bubble)
	_bubble_talk = _bubble_mesh("talk", "cream", "teal_dark")
	_bubble_quest = _bubble_mesh("quest", "gold", "ink")
	_bubble.add_child(_bubble_talk)
	_bubble.add_child(_bubble_quest)
	_bubble.visible = false


static var _bubble_cache: Dictionary = {}

## A soft speech bubble: "…" (three dots) or "!" (a bar and a dot).
func _bubble_mesh(kind: String, fill: String, mark: String) -> MeshInstance3D:
	if not _bubble_cache.has(kind):
		var m := MeshMerger.new()
		var glow: float = 0.45 if kind == "quest" else 0.0
		m.part(DecorKit.sphere(0.24, 16, 8), DecorKit.mat(fill, glow), Vector3.ZERO, Vector3.ZERO, Vector3(1.25, 1.0, 0.5))
		m.part(DecorKit.cyl(0.0, 0.09, 0.16, 8), DecorKit.mat(fill, glow), Vector3(-0.12, -0.24, 0), Vector3(0, 0, 160))
		if kind == "quest":
			m.part(DecorKit.box(Vector3(0.06, 0.2, 0.06)), DecorKit.mat(mark), Vector3(0, 0.05, 0.12))
			m.part(DecorKit.sphere(0.04, 8, 4), DecorKit.mat(mark), Vector3(0, -0.12, 0.12))
		else:
			for x in [-0.1, 0.0, 0.1]:
				m.part(DecorKit.sphere(0.035, 8, 4), DecorKit.mat(mark), Vector3(x, 0, 0.12))
		_bubble_cache[kind] = m.commit()
	var mi := MeshInstance3D.new()
	mi.mesh = _bubble_cache[kind]
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	return mi


func _update_bubble() -> void:
	var quest: bool = is_current_objective()
	var talk: bool = not quest and indicator == Indicator.TALK
	_bubble.visible = quest or talk
	if not _bubble.visible:
		return
	_bubble_quest.visible = quest
	_bubble_talk.visible = talk
	# Always readable from the camera: turn the bubble to face it.
	var cam: Camera3D = get_viewport().get_camera_3d()
	if cam:
		var to_cam: Vector3 = cam.global_position - _bubble.global_position
		_bubble.rotation.y = atan2(to_cam.x, to_cam.z) - global_rotation.y
	var bob: float = 0.0 if Settings.reduced_motion or not quest else sin(_time * 2.4) * 0.06
	_bubble.position.y = 2.75 + bob


## The NPC who has just been talking reacts to the child's answer.
func _on_answer_checked(correct: bool) -> void:
	if visual == null or _time - _last_spoke > 60.0:
		return
	if _player == null or _player.global_position.distance_to(global_position) > NOTICE_RANGE:
		return
	visual.play_reaction("happy" if correct else "confused")
