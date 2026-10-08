class_name WorldGuide
extends RefCounted
## WorldGuide — one way for any activity to communicate through the world
## instead of words (SEE → DO → CHOOSE → CONSEQUENCE). It wraps the pieces
## that already exist, so activities never re-implement them:
##
##   look(target)            "look here": a beacon (VisualCues), sized by
##                           the child's support for this skill
##   unlook(target)          clear it
##   go(guidance)            "go there": the trail of lights (GuidanceSystem)
##   show(npc, target)       a character turns, points and looks (Demonstration)
##   react(character, kind)  a character's face + emote + body reaction
##                           (CharacterRig.express / play_reaction)
##   demonstrate(npc, ...)   a character does it first (Demonstration.*),
##                           only if this child's support level wants it
##
## Every call respects Reduced Motion (via the wrapped systems) and never
## depends on sound or text. `competencies` lets the guide size its help
## to this child's level in what the activity develops (Competency).

const REACTION_BODY: Dictionary = {
	"happy": "happy", "proud": "celebrate", "thanks": "happy", "wow": "nod",
	"thinking": "confused", "oh_no": "confused",
}


static func look(target: Node3D, height: float = -1.0) -> void:
	if target:
		VisualCues.beacon(target, height)


static func unlook(target: Node3D) -> void:
	if target:
		VisualCues.clear(target)


static func go(guidance: GuidanceSystem) -> void:
	if guidance:
		guidance.show_trail()


## A character points at `target` (and the target gets a beacon).
static func show(npc: NPC, target: Node3D, seconds: float = 2.0) -> void:
	if npc == null or target == null:
		return
	look(target)
	await Demonstration.point(npc, target.global_position + Vector3(0, 1.0, 0), seconds)


## How a character feels: face, emote bubble and (motion allowed) body.
static func react(character: Node, kind: String, seconds: float = 2.2) -> void:
	var rig: CharacterRig = _rig(character)
	if rig == null:
		return
	rig.express(kind, seconds)
	if REACTION_BODY.has(kind):
		rig.play_reaction(REACTION_BODY[kind])


## Should a character show it first, for these skills, for this child?
static func wants_demonstration(competencies: Array = []) -> bool:
	return SupportProfile.demonstration_enabled_for(competencies)


static func _rig(character: Node) -> CharacterRig:
	if character is CharacterRig:
		return character
	if character is NPC:
		return (character as NPC).visual
	if character and character.get("visual") is CharacterRig:
		return character.get("visual")
	if character:
		for c in character.get_children():
			if c is CharacterRig:
				return c
	return null
