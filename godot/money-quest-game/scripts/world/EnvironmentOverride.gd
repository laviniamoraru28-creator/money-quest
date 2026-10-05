class_name EnvironmentOverride
extends Node
## EnvironmentOverride — lets one zone have its own atmosphere instead of
## Main.tscn's shared world environment (e.g. a softer, quieter sky for a
## Calm World garden). Add a node of this type named "EnvironmentOverride"
## at the root of a zone scene and assign an Environment; Main.gd applies
## it when that zone loads and restores the shared one when the player
## leaves. Zones without one simply use the shared environment.

@export var environment: Environment
