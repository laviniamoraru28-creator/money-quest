class_name AvatarConfig
extends Resource
## AvatarConfig — a minimal, inclusive-by-construction avatar description.
## Scope deliberately small: a palette of options, not a narrow set of
## forced identities (project brief: "do not force the player into a
## single character identity"). Presets include a wheelchair-seated look;
## accessories include glasses, a cap, a hearing aid, and a cane — all
## listed together as equally normal choices, never a separate
## "accessibility" section (see AvatarCreation.gd). Every option here is
## purely visual: Player.gd applies this config to the 3D model's color,
## shape, and attachments only, never to movement speed, collision, or any
## gameplay behavior. More presets/accessories can be added later as pure
## content (new entries in AvatarCreation.gd's lists plus a matching node
## in Player.tscn), never an architecture change.

@export var body_preset_id: String = "preset-a"
@export var outfit_color: Color = Color(0.059, 0.478, 0.42)
@export var accessory_id: String = ""   # "" = none; always optional
