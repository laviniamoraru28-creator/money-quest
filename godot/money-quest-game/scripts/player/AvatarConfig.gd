class_name AvatarConfig
extends Resource
## AvatarConfig — a minimal, inclusive-by-construction avatar description.
## Scope deliberately small: a palette of options, not a narrow set of
## forced identities (project brief: "do not force the player into a
## single character identity"). There is no gender field and nothing here
## implies one: every skin tone, hair style, hair colour, outfit colour and
## accessory is available in every combination. Presets include a
## wheelchair-seated look; accessories include glasses, a cap, a hearing
## aid and a cane — all listed together as equally normal choices, never a
## separate "accessibility" section (see AvatarCreation.gd). Every option
## here is purely visual: Player.gd turns this config into the 3D
## character (via CharacterLook / CharacterBuilder) and never changes
## movement speed, collision, or any gameplay behavior from it.
##
## Options are stored as stable string ids (see CharacterPalette), so more
## appearance options can be added later as pure content, never an
## architecture change, and old saves keep loading.

## "preset-a" | "preset-b" | "preset-c" — body proportions;
## "preset-d" — seated in a wheelchair (unchanged from the original design).
@export var body_preset_id: String = "preset-a"
@export var outfit_color: Color = Color(0.059, 0.478, 0.42)
## Legacy single accessory from the first avatar screen ("" = none). Still
## read for older saves; new saves use accessory_ids and keep this in step
## (first accessory) so an older build can still open them.
@export var accessory_id: String = ""

## Added with the character system — safe defaults for older saves.
@export var skin_tone_id: String = CharacterPalette.DEFAULT_SKIN_TONE
@export var hair_style_id: String = CharacterPalette.DEFAULT_HAIR_STYLE
@export var hair_color_id: String = CharacterPalette.DEFAULT_HAIR_COLOR
## Any combination of "glasses", "cap", "hearing_aid", "cane" and the
## cosmetics "scarf", "backpack", "headband", "star_pin" — all optional
## and independent of each other.
@export var accessory_ids: Array[String] = []

## Added with the character upgrade — safe defaults for older saves (an old
## save simply looks exactly as it did: a tee, cream trainers, brown eyes).
## Cosmetics (scarf, backpack, headband, star pin) live in accessory_ids
## alongside the everyday accessories, so no new save field is needed.
@export var outfit_style_id: String = CharacterPalette.DEFAULT_OUTFIT_STYLE
@export var shoe_color_id: String = CharacterPalette.DEFAULT_SHOE_COLOR
@export var eye_color_id: String = CharacterPalette.DEFAULT_EYE_COLOR


## Every accessory to show, merging the legacy single field.
func get_accessory_ids() -> Array[String]:
	var ids: Array[String] = accessory_ids.duplicate()
	if not accessory_id.is_empty() and not ids.has(accessory_id):
		ids.append(accessory_id)
	return ids


func has_accessory(id: String) -> bool:
	return get_accessory_ids().has(id)


func set_accessory(id: String, enabled: bool) -> void:
	var ids: Array[String] = get_accessory_ids()
	if enabled and not ids.has(id):
		ids.append(id)
	elif not enabled:
		ids.erase(id)
	accessory_ids = ids
	accessory_id = ids[0] if ids.size() > 0 else ""


func is_seated() -> bool:
	return body_preset_id == "preset-d"
