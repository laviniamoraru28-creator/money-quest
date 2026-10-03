class_name SpotItemData
extends Resource
## SpotItemData — one selectable statement/observation in a SPOT-kind
## quest's "spot the problem" mini-game (e.g. Leadership Quest's "The Team
## Conflict"/"The Motivation Problem"). The child toggles any number of
## items, then submits; SpotPanel checks the selected set against every
## item's `is_suspicious` flag exactly (an exact-set match, not partial
## credit) — the same contract the website's own SpotMechanic uses.

@export var item_id: String = ""
@export var text_key: String = ""
@export var is_suspicious: bool = false
