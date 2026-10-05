@tool
class_name CharacterLook
extends RefCounted
## CharacterLook — one character's fully resolved appearance, ready for
## CharacterBuilder: colours, hair style, proportions, accessories and a
## few purely visual role details (apron, badge, tie, cardigan).
##
## Built either from the player's saved AvatarConfig, or deterministically
## from an NPC's npc_id — the same NPC always looks the same, in every
## zone and on every launch, because its look is derived from its id, never
## from a random roll at load time.

var skin: Color = CharacterPalette.skin(CharacterPalette.DEFAULT_SKIN_TONE)
var hair_style: String = CharacterPalette.DEFAULT_HAIR_STYLE
var hair: Color = CharacterPalette.hair(CharacterPalette.DEFAULT_HAIR_COLOR)
var top: Color = Color("0F7A6B")
var bottom: Color = Color("34495E")
var shoes: Color = Color("F2EEE6")
## Proportions: 1.0 is the standard child build. Height stretches legs and
## torso (never the head), width the shoulders and body.
var height: float = 1.0
var width: float = 1.0
var seated: bool = false
## Any of: "glasses", "cap", "hearing_aid", "cane".
var accessories: Array[String] = []
var cap_color: Color = Color("D13E19")
## Visual-only role details: "apron", "badge", "tie", "cardigan".
var extras: Array[String] = []
var accent: Color = Color("E8A33D")


func has(item: String) -> bool:
	return accessories.has(item) or extras.has(item)


## A stable string describing this look — used to share one baked mesh
## between identical characters.
func key() -> String:
	return "%s|%s|%s|%s|%s|%s|%.2f|%.2f|%s|%s|%s|%s|%s" % [
		skin.to_html(false), hair_style, hair.to_html(false), top.to_html(false),
		bottom.to_html(false), shoes.to_html(false), height, width, seated,
		",".join(accessories), cap_color.to_html(false), ",".join(extras), accent.to_html(false),
	]


static func from_avatar_config(config: AvatarConfig) -> CharacterLook:
	var look := CharacterLook.new()
	look.skin = CharacterPalette.skin(config.skin_tone_id)
	look.hair_style = config.hair_style_id if CharacterPalette.HAIR_STYLES.has(config.hair_style_id) else CharacterPalette.DEFAULT_HAIR_STYLE
	look.hair = CharacterPalette.hair(config.hair_color_id)
	look.top = config.outfit_color
	look.bottom = CharacterPalette.bottom_for(config.outfit_color)
	look.seated = config.is_seated()
	for id in config.get_accessory_ids():
		look.accessories.append(id)
	match config.body_preset_id:
		"preset-b":
			look.width = 1.14
			look.height = 0.94
		"preset-c":
			look.width = 0.92
			look.height = 1.07
	return look


## Deterministic NPC look from its id. Role keywords in the id add small
## visual cues (a librarian's glasses, a shopkeeper's apron) — appearance
## only, never dialogue or behaviour.
static func for_npc(npc_id: String) -> CharacterLook:
	var look := CharacterLook.new()
	var rng := RandomNumberGenerator.new()
	rng.seed = npc_id.hash()
	var tones: Array = CharacterPalette.SKIN_TONES.keys()
	look.skin = CharacterPalette.SKIN_TONES[tones[rng.randi() % tones.size()]]
	var styles: Array[String] = CharacterPalette.HAIR_STYLES
	look.hair_style = styles[rng.randi() % (styles.size() - 1)] if rng.randf() > 0.05 else "none"
	var natural: Array = ["black", "dark-brown", "brown", "auburn", "ginger", "blonde", "light-blonde", "grey"]
	var hair_id: String = natural[rng.randi() % natural.size()] if rng.randf() > 0.08 else ["blue", "lilac"][rng.randi() % 2]
	look.hair = CharacterPalette.hair(hair_id)
	look.top = CharacterPalette.OUTFIT_COLORS[rng.randi() % CharacterPalette.OUTFIT_COLORS.size()]
	look.bottom = CharacterPalette.BOTTOM_COLORS[rng.randi() % CharacterPalette.BOTTOM_COLORS.size()]
	look.height = rng.randf_range(1.0, 1.12)
	look.width = rng.randf_range(0.94, 1.1)
	look.cap_color = CharacterPalette.OUTFIT_COLORS[rng.randi() % CharacterPalette.OUTFIT_COLORS.size()]
	if rng.randf() < 0.2:
		look.accessories.append("glasses")
	if rng.randf() < 0.1:
		look.accessories.append("hearing_aid")
	if rng.randf() < 0.08:
		look.accessories.append("cap")
	look.seated = rng.randf() < 0.07

	var id := npc_id.to_lower()
	if _has_any(id, ["librar", "bookkeeper", "research", "accountant"]):
		if not look.accessories.has("glasses"):
			look.accessories.append("glasses")
		look.extras.append("cardigan")
		look.top = Color("A0553E")
	elif _has_any(id, ["mentor", "coach", "advisor", "analyst", "inspector", "scientist", "detective"]):
		look.extras.append("tie")
		look.top = [Color("2F4B7C"), Color("367D99"), Color("3A3F44")][rng.randi() % 3]
		look.accent = [Color("E8A33D"), Color("D13E19"), Color("0F7A6B")][rng.randi() % 3]
	elif _has_any(id, ["shop", "baker", "trader", "supplier", "stock", "warehouse", "sticker", "pricing", "sales", "market"]):
		look.extras.append("apron")
		look.accent = [Color("F2C14E"), Color("9CCB8E"), Color("F07A5A"), Color("7DB6CF")][rng.randi() % 4]
	elif _has_any(id, ["calm"]):
		look.top = [Color("9CCB8E"), Color("7DB6CF"), Color("C9BFE6")][rng.randi() % 3]
		look.bottom = Color("6B7F8E")
		look.accessories.erase("cap")
	if _has_any(id, ["guide", "keeper", "museum", "curator"]) and not look.extras.has("apron"):
		look.extras.append("badge")
	if id == "hub-guide":
		look.top = Color("0F7A6B")
		look.accessories.erase("cap")
	if _has_any(id, ["mum", "grown_up"]):
		look.height = 1.15
	elif _has_any(id, ["friend", "teammate"]):
		look.height = 0.98
	return look


static func _has_any(text: String, words: Array) -> bool:
	for w in words:
		if text.contains(w):
			return true
	return false
