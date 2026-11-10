class_name CozyScatter
extends Node
## CozyScatter — many copies of one small kit piece (a fern, flowers, a grass
## tuft) under a CozySlotLayer. No collision and no animation; the layer
## checks every spot and merges all of a zone's small pieces into one mesh,
## so a whole meadow costs a few draws.

## The kit file, without folder or extension.
@export var piece: String = ""
## One entry per copy: x, turn in degrees, z (metres, in the zone).
@export var spots: PackedVector3Array = PackedVector3Array()
