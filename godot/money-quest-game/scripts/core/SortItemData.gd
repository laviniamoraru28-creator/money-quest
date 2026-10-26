class_name SortItemData
extends Resource
## SortItemData — one placeable item in a SORT-kind quest's sorting
## mini-game (e.g. Leadership Quest's "The Pressure Test"). The child taps
## an item, then taps a bucket to place it; SortPanel checks every item's
## `correct_bucket_key` against where it was actually placed — same
## contract the website's own SortMechanic uses.

@export var item_id: String = ""
@export var text_key: String = ""
@export var correct_bucket_key: String = ""
## Optional: the item as a picture (MissionStrip tokens). When a sort's
## items have pictures, SortPanel shows them as picture buttons (pictures
## only with words off). Left empty, nothing changes.
@export var icon_tokens: Array[String] = []
