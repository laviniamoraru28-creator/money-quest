class_name Destinations
extends RefCounted
## Destinations — the one list of Money Quest World's important places, so
## every way of naming a place agrees: the sign over its entrance
## (DestinationSign), the big "Enter …" prompt (HUD DestinationPrompt), the
## "You are entering" banner (ZoneBanner) and the help panel.
##
## Keyed by zone id. Each place has:
##   title    — its name (translation key; existing names are reused)
##   district — optional quest/district name shown small above the title
##   purpose  — one short line: what you can do there
##   icon     — a simple shape that says the same without reading (coin,
##              book, bulb, column, mind, leaf, star, bag, frame, compass)
##   accent   — DecorKit colour of its district
##   prompt   — false: no big entry prompt (default true)
## A new destination joins by adding one entry here.

const ENTRIES: Dictionary = {
	"world-hub": {"title": "zone.world_hub.name", "prompt": false, "purpose": "place.world_hub.purpose", "icon": "compass", "accent": "teal_light"},
	"golden-vault": {"title": "place.golden_vault.name", "district": "place.district.money_quest", "purpose": "place.golden_vault.purpose", "icon": "coin", "accent": "gold"},
	"time-vault": {"title": "place.time_vault.name", "district": "place.district.money_quest", "purpose": "place.time_vault.purpose", "icon": "coin", "accent": "teal"},
	"idea-lab": {"title": "zone.idea_lab.name", "district": "hub.portal.entrepreneur_quest", "purpose": "place.idea_lab.purpose", "icon": "bulb", "accent": "ember"},
	"leadership-academy": {"title": "zone.leadership_academy.name", "district": "hub.portal.leadership_quest", "purpose": "place.leadership_academy.purpose", "icon": "star", "accent": "sky"},
	"library": {"title": "hub.portal.library", "purpose": "place.library.purpose", "icon": "book", "accent": "book_red"},
	"museum": {"title": "hub.portal.museum", "purpose": "place.museum.purpose", "icon": "column", "accent": "coral"},
	"mind-lab": {"title": "hub.portal.mind_lab", "purpose": "place.mind_lab.purpose", "icon": "mind", "accent": "lilac"},
	"calm-world-bubble-garden": {"title": "hub.portal.calm_world", "purpose": "place.calm_world.purpose", "icon": "leaf", "accent": "leaf_soft"},
	"market-town": {"title": "place.market_town.name", "district": "place.district.money_quest", "purpose": "place.market_town.purpose", "icon": "bag", "accent": "gold"},
	"mentor-hall": {"title": "zone.mentor_hall.name", "purpose": "place.mentor_hall.purpose", "icon": "frame", "accent": "book_red"},
}


static func has(zone_id: String) -> bool:
	return ENTRIES.has(zone_id)


static func entry(zone_id: String) -> Dictionary:
	return ENTRIES.get(zone_id, {})


## Whether reaching this place's entrance shows the big DestinationPrompt
## (the way back to the Hub keeps the ordinary small prompt: it sits right
## behind every arrival point).
static func wants_prompt(zone_id: String) -> bool:
	return has(zone_id) and bool(entry(zone_id).get("prompt", true))


## The place's name: its own title, or the zone's display name.
static func title(zone_id: String) -> String:
	var e: Dictionary = entry(zone_id)
	if e.has("title"):
		return Localization.t(e["title"])
	var z: ZoneData = WorldManager.get_zone(zone_id)
	return Localization.t(z.display_name_key) if z else ""


static func district(zone_id: String) -> String:
	var e: Dictionary = entry(zone_id)
	return Localization.t(e["district"]) if e.has("district") else ""


static func purpose(zone_id: String) -> String:
	var e: Dictionary = entry(zone_id)
	return Localization.t(e["purpose"]) if e.has("purpose") else ""


static func icon(zone_id: String) -> String:
	return String(entry(zone_id).get("icon", "compass"))


static func accent(zone_id: String) -> Color:
	return DecorKit.color(String(entry(zone_id).get("accent", "gold")))
