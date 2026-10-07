class_name DistrictStyle
extends RefCounted
## DistrictStyle — the visual language of each major district, as data, so
## every room in a district looks like it belongs there and every district
## looks different from the others (by shape and props as well as colour).
## ZoneDressing applies a style by id (district_style), and the zone's
## ZoneLife reads its life profile. Adding a district = one entry here.
##
## Each entry:
##   palette — ZoneDressing colours (DecorKit names): floor, floor_accent,
##             wall, wainscot, trim, pilaster, path, kerb, accent
##   sun     — interior sun energy (open-air squares are brighter)
##   open_air — true: a town square (shopfront façades instead of hall
##             walls, open sky, the shared outdoor environment)
##   life    — ZoneLife profile: what quietly happens here (see ZoneLife)
##   motifs  — the district's recurring shapes, for props and signs
##   kit     — purposeful details ZoneDressing places along the walls of
##             any room in the district that has no dressing subclass of
##             its own (see ZoneDressing._build_kit)
##
## The identities (theme → visual language):
##   golden_vault — saving, security, growth: gold & teal, vault door,
##                  coins, savings jars, growth displays, warm light
##   market_town  — buying, choosing, everyday money: a sunny town square,
##                  striped stall awnings, baskets, crates, bunting
##   idea_lab     — ideas and making: ember & bulb yellow, idea boards,
##                  sketches, prototypes on workbenches
##   museum       — history and discovery: coral & stone, display cases,
##                  plinths, exhibit labels, a calm gallery light
##   library      — knowledge: warm wood & book red, shelves, reading
##                  chairs, an open book, a book cart, cosy lamps
##   mentor_hall  — people and inspiration: portraits, statues, keepsakes
##   mind_lab     — thinking and feelings: soft lilac, thought bubbles,
##                  emotion displays, quiet reflection corners
##   calm_world   — choice and calm: greens, water, soft light — the
##                  quietest life profile of all
##   leadership   — teamwork: sky blue, round tables, challenge boards

const STYLES: Dictionary = {
	"golden_vault": {
		"palette": {"floor": "stone_dark", "floor_accent": "path_stone", "wall": "plaster", "wainscot": "stone",
			"trim": "gold", "pilaster": "teal", "path": "gold", "kerb": "teal_dark", "accent": "gold"},
		"sun": 0.6, "open_air": false, "life": "vault", "motifs": ["coin", "jar", "vault_door", "growth"],
	},
	"market_town": {
		"palette": {"floor": "rock", "floor_accent": "stone_dark", "wall": "plaster", "wainscot": "stone",
			"trim": "cream", "pilaster": "coral", "path": "path_terracotta", "kerb": "wood_dark", "accent": "coral"},
		"sun": 0.75, "open_air": true, "life": "town", "motifs": ["awning", "basket", "crate", "bunting"],
	},
	"idea_lab": {
		"palette": {"floor": "fog", "floor_accent": "path_stone", "wall": "cream", "wainscot": "wood",
			"trim": "bulb", "pilaster": "ember", "path": "path_terracotta", "kerb": "wood_dark", "accent": "ember"},
		"sun": 0.65, "open_air": false, "life": "workshop", "motifs": ["bulb", "sketch", "gear", "workbench"],
		"kit": ["workbench", "picture_board", "crate_stack", "workbench", "potted_plant", "picture_board"],
	},
	"museum": {
		"palette": {"floor": "stone_dark", "floor_accent": "stone", "wall": "parchment", "wainscot": "stone_dark",
			"trim": "gold", "pilaster": "coral", "path": "path_stone", "kerb": "stone_dark", "accent": "coral"},
		"sun": 0.6, "open_air": false, "life": "gallery", "motifs": ["column", "case", "plinth", "label"],
		"kit": ["display_case:coin", "display_case:shell", "bench", "display_case:note", "display_case:vase", "potted_plant"],
	},
	"library": {
		"palette": {"floor": "stone", "floor_accent": "path_wood", "wall": "parchment", "wainscot": "wood_dark",
			"trim": "gold", "pilaster": "book_red", "path": "path_wood", "kerb": "wood_dark", "accent": "book_red"},
		"sun": 0.55, "open_air": false, "life": "library", "motifs": ["shelf", "book", "lamp", "chair"],
		"kit": ["reading_chair", "book_cart", "lectern_book", "lamp", "potted_plant", "reading_chair"],
	},
	"mentor_hall": {
		"palette": {"floor": "stone", "floor_accent": "path_stone", "wall": "plaster", "wainscot": "wood",
			"trim": "gold", "pilaster": "book_red", "path": "path_wood", "kerb": "wood_dark", "accent": "gold"},
		"sun": 0.6, "open_air": false, "life": "gallery", "motifs": ["portrait", "statue", "keepsake"],
	},
	"mind_lab": {
		"palette": {"floor": "path_lilac", "floor_accent": "fog", "wall": "fog", "wainscot": "lilac",
			"trim": "cream", "pilaster": "lilac_dark", "path": "path_lilac", "kerb": "lilac_dark", "accent": "lilac"},
		"sun": 0.6, "open_air": false, "life": "calm_lab", "motifs": ["bubble", "puzzle", "display"],
	},
	"calm_world": {
		"palette": {"floor": "grass_light", "floor_accent": "grass", "wall": "fog", "wainscot": "leaf_soft",
			"trim": "cream", "pilaster": "leaf", "path": "path_moss", "kerb": "leaf_dark", "accent": "leaf_soft"},
		"sun": 0.55, "open_air": true, "life": "calm", "motifs": ["leaf", "water", "lantern"],
	},
	"leadership": {
		"palette": {"floor": "stone", "floor_accent": "path_slate", "wall": "plaster", "wainscot": "sky_light",
			"trim": "cream", "pilaster": "sky", "path": "path_slate", "kerb": "sky", "accent": "sky"},
		"sun": 0.65, "open_air": false, "life": "workshop", "motifs": ["round_table", "board", "flag"],
	},
}


static func has(style_id: String) -> bool:
	return STYLES.has(style_id)


static func get_style(style_id: String) -> Dictionary:
	return STYLES.get(style_id, {})


## Applies a style's palette and light to a ZoneDressing (before it builds).
static func apply(d: ZoneDressing, style_id: String) -> void:
	var s: Dictionary = get_style(style_id)
	if s.is_empty():
		return
	var p: Dictionary = s["palette"]
	d.floor_color = p["floor"]
	d.floor_accent = p["floor_accent"]
	d.wall_color = p["wall"]
	d.wainscot_color = p["wainscot"]
	d.trim_color = p["trim"]
	d.pilaster_color = p["pilaster"]
	d.path_color = p["path"]
	d.kerb_color = p["kerb"]
	d.accent = p["accent"]
	d.sun_energy = s["sun"]
	d.open_air = s["open_air"]
	d.life_profile = s["life"]
	d.kit = s.get("kit", [])
