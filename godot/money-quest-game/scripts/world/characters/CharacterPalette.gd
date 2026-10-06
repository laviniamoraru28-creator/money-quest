@tool
class_name CharacterPalette
extends RefCounted
## CharacterPalette — the data behind every character's appearance: skin
## tones, hair colours, hair styles and outfit colours, each under a stable
## string id (what AvatarConfig and the save file store — never a node or
## a raw colour index). Adding an option is one more entry here.
##
## Everything is a free visual choice. Nothing is tied to a gender, an age,
## a body preset or anything else: every hair style works with every skin
## tone, outfit and accessory, and none of them is "the default person".

## Ordered light → deep. Stylised (slightly warm, softly saturated) so they
## sit naturally beside the Money Quest palette.
const SKIN_TONES: Dictionary = {
	"tone-1": Color("F7DCC9"),
	"tone-2": Color("EFC4A4"),
	"tone-3": Color("E2AB86"),
	"tone-4": Color("CB9068"),
	"tone-5": Color("B07752"),
	"tone-6": Color("8F5B3D"),
	"tone-7": Color("6F442D"),
	"tone-8": Color("4F3021"),
}

## Natural colours first, then two playful ones.
const HAIR_COLORS: Dictionary = {
	"black": Color("2A2321"),
	"dark-brown": Color("4A3227"),
	"brown": Color("7A5136"),
	"auburn": Color("8E3B26"),
	"ginger": Color("C8642E"),
	"blonde": Color("E1B865"),
	"light-blonde": Color("EEDDB4"),
	"grey": Color("A9A6A3"),
	"blue": Color("4C7FC8"),
	"lilac": Color("9C7FD1"),
}

## Every style is available to everyone. "none" is a real choice too
## (some children have no hair), not a missing option.
const HAIR_STYLES: Array[String] = ["short", "buzz", "curly", "coily", "bob", "long", "ponytail", "none"]

## Outfit swatches offered on the avatar screen — Money Quest brand colours
## plus a few friendly extras. AvatarConfig stores the actual Color, so any
## colour (e.g. from the existing colour picker) keeps working.
const OUTFIT_COLORS: Array[Color] = [
	Color("0F7A6B"), Color("367D99"), Color("2F4B7C"), Color("7A68B8"),
	Color("D13E19"), Color("F07A5A"), Color("E8A33D"), Color("4F9B5C"),
	Color("B54A3C"), Color("3A3F44"),
]

## Trousers / shorts for NPC variety (the player's are derived from the
## outfit colour so they always match).
const BOTTOM_COLORS: Array[Color] = [
	Color("34495E"), Color("2F4B7C"), Color("5B4B3A"), Color("3A3F44"), Color("6B7F8E"), Color("7A5B45"),
]

const DEFAULT_SKIN_TONE: String = "tone-4"
const DEFAULT_HAIR_STYLE: String = "short"
const DEFAULT_HAIR_COLOR: String = "dark-brown"

static var _materials: Dictionary = {}


static func skin(id: String) -> Color:
	return SKIN_TONES.get(id, SKIN_TONES[DEFAULT_SKIN_TONE])


static func hair(id: String) -> Color:
	return HAIR_COLORS.get(id, HAIR_COLORS[DEFAULT_HAIR_COLOR])


## A cached matte material for any colour, so a hundred characters sharing
## a skin tone or outfit colour share one material.
static func mat(c: Color, glow: float = 0.0) -> StandardMaterial3D:
	var key: String = "%s|%.2f" % [c.to_html(false), glow]
	if _materials.has(key):
		return _materials[key]
	var m := StandardMaterial3D.new()
	m.albedo_color = c
	m.roughness = 1.0
	m.metallic_specular = 0.25
	if glow > 0.0:
		m.emission_enabled = true
		m.emission = c
		m.emission_energy_multiplier = glow
	else:
		# Baked as a vertex colour by MeshMerger: a whole character's plain
		# parts render as one surface instead of one per colour.
		DecorKit.tag_vertex_color(m, "character", c)
	_materials[key] = m
	return m


## Trousers that always suit the chosen top: a deep, desaturated version of
## it (navy-ish for blues, warm dark for reds), never a clashing colour.
static func bottom_for(top: Color) -> Color:
	var b := Color.from_hsv(top.h, clampf(top.s * 0.45, 0.12, 0.4), 0.3)
	return b
