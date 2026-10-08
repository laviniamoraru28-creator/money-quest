class_name PortalInteraction
extends Interaction
## PortalInteraction — a Hub portal the player walks up to and interacts
## with to travel to a destination zone, or hears a short "coming soon"
## line if that destination isn't built yet. Reused as-is for all 7 of the
## Hub's destinations (see docs/money-quest-world-architecture.md Section 2)
## — a built portal sets target_zone_id; an unbuilt one leaves it empty and
## relies on coming_soon_message_key instead. No separate "locked portal"
## scene/script exists.

## Shown above the portal at all times (not just when in range) so the
## Hub reads as a real plaza of named places, not an unlabeled cluster of
## shapes — see WorldHub.tscn's Label3D child.
@export var label_key: String = ""

## Empty for a not-yet-built destination.
@export var target_zone_id: String = ""

## Only used when target_zone_id is empty.
@export var coming_soon_message_key: String = "portal.coming_soon"

@onready var _label: Label3D = $Label if has_node("Label") else null


func _ready() -> void:
	super._ready()
	# A doorway is the most relevant thing in reach, and its prompt says
	# what it does ("Go in"), not the NPC default ("Talk").
	interaction_priority = 70
	if prompt_text_key == "interaction.talk_prompt":
		prompt_text_key = "interaction.enter_prompt"
	if _label and not label_key.is_empty():
		_label.text = Localization.t(label_key)
	_apply_navigation()


## "back" or "forward" in the room this door stands in (see below).
var role: String = "forward"


## ← BACK / → FORWARD, the same rule in every room (WorldManager.back_of):
## the door to where BACK leads is the BACK door; every other door goes
## FORWARD. In a room deeper in a chain, the old way straight to the Hub
## becomes the way BACK to the room before (so ← always means "the room I
## came through"; the Hub is one step from Help, and BACK, BACK... reaches
## it too). The door shows where it goes and which way (DoorMarker); its
## written label is for readers and steps aside with words off.
func _apply_navigation() -> void:
	var here: String = WorldManager.current_zone_id
	if here.is_empty() or here == "world-hub" or target_zone_id.is_empty():
		return
	var back: String = WorldManager.back_of(here)
	if target_zone_id == "world-hub" and not back.is_empty() and back != "world-hub":
		target_zone_id = back
		if _label:
			_label.text = Destinations.title(back)
	role = WorldManager.door_role(here, target_zone_id)
	var marker := DoorMarker.make(target_zone_id, role)
	var top: float = (_label.position.y + 1.0) if _label else 3.4
	marker.position = Vector3(0, maxf(top, 3.4), 0)
	add_child(marker)
	if _label:
		_label.visible = SupportProfile.show_text()


func interact() -> void:
	if not target_zone_id.is_empty():
		if WorldManager.get_zone(target_zone_id) != null and not WorldManager.is_zone_unlocked(target_zone_id):
			# A locked door explains itself gently instead of silently doing
			# nothing — the child should never think the game is broken.
			DialogueBox.show_text("interaction.locked")
			return
		AudioManager.play_sfx("portal")
		WorldManager.travel_to(target_zone_id)
	else:
		DialogueBox.show_text(coming_soon_message_key)
