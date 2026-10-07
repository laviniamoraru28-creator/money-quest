class_name VisualMissions
extends RefCounted
## VisualMissions — objectives as pictures (Universal Play & Learn). An
## objective id maps to a short row of picture tokens that MissionStrip
## draws on the mission card, so "what do I do now?" is answered without
## reading: "you → coins (1 of 3)", "you → walk → fruit stall", "you → pick
## → pay → bag". Words stay as an optional layer on the same card.
##
## A zone registers its own pictures (MarketTownFlow.MISSION_ICONS), or a
## PlayActivity "objective" step carries them ("icons": [...]); both end
## up in ObjectiveManager.icons(). Nothing here knows about any zone.
##
## Tokens (see MissionStrip for how each is drawn):
##   you            the child's own avatar (a picture of their character)
##   npc:<id>       a character's face (the guide, a keeper)
##   then           an arrow: "and then" / "go to"
##   coins          coin pips; with objective params "have"/"need" they
##                  count up (gold = found, hollow = still to find)
##   coin           one coin
##   pay            a coin leaving a hand
##   bag            "it is yours"
##   item:<shape>   a product picture (ItemVisual shapes), optional
##                  ":RRGGBB" tint
##   num:<n>        a number (amounts that pips cannot show)
##   stall, crate, board, door, eye, hand, walk, choose, star, tick
##                  simple drawn glyphs (MissionStrip.Glyph)

static var _registry: Dictionary = {}   # objective id -> Array of tokens


static func register(map: Dictionary) -> void:
	for id in map:
		_registry[id] = map[id]


static func icons_for(objective_id: String) -> Array:
	return _registry.get(objective_id, [])


static func has(objective_id: String) -> bool:
	return _registry.has(objective_id)
