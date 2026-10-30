class_name CozySlot
extends Marker3D
## CozySlot — one place in a zone where a Cozy Atlas piece stands. The slot
## is authored once (position, facing, kind); CozySlotLayer fills it with
## the kit asset when it exists, or with a matching placeholder until then,
## so swapping placeholders for art never moves or re-authors anything.
##
## The piece's front (+Z) faces along the slot's own +Z. `radius` is the
## piece's ground footprint, used for the clearance checks (doors,
## interactables, the spawn point, paths and other slots).

## A CozyKit kind ("pavilion", "pond", "tree_hero"…).
@export var kind: String = ""
## Ground footprint radius in metres (0 = the kind's default).
@export var radius: float = 0.0


func footprint() -> float:
	return radius if radius > 0.0 else CozyKit.default_radius(kind)
