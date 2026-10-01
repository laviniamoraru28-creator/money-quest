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
	if _label and not label_key.is_empty():
		_label.text = Localization.t(label_key)


func interact() -> void:
	if not target_zone_id.is_empty():
		WorldManager.travel_to(target_zone_id)
	else:
		DialogueBox.show_text(coming_soon_message_key)
