class_name AvatarConfig
extends Resource
## AvatarConfig — a minimal, inclusive-by-construction avatar description.
## Scope deliberately small for this phase: a palette of options, not a
## narrow set of forced identities (project brief: "do not force the
## player into a single character identity"). More presets/accessories —
## including ones that visibly represent glasses, hearing aids, or
## mobility aids — can be added later as pure content (new entries in
## AvatarCreation.gd's lists), never an architecture change.

@export var body_preset_id: String = "preset-a"
@export var outfit_color: Color = Color(0.059, 0.478, 0.42)
@export var accessory_id: String = ""   # "" = none; always optional
