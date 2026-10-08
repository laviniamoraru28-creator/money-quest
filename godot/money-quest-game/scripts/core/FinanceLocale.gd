class_name FinanceLocale
extends RefCounted
## FinanceLocale — keeps three things apart, for every financial topic:
##
##   CONCEPT   what the money does, true everywhere
##             ("money you agree not to touch for years can grow more")
##   PRODUCT   a real product in a real country, with its real rules
##             (UK: Junior ISA — tax-free, locked until 18)
##   TERMS     the words a place uses for either (translation keys)
##
## A region gets a product only when a real one exists and has been
## checked (PRODUCTS, with its source). Where there is none, the game
## teaches the concept with neutral words and invents nothing: no fake
## "ISA" in Romanian, no made-up local accounts. Adding a country later is
## data only: a PRODUCTS entry (after a person has verified it) and its
## terms in translations.csv.
##
## Region: Settings.region if a grown-up chose one, else from the language
## (en → GB, ro → RO, …). English players elsewhere can pick their own.

const REGIONS: Array[String] = ["GB", "RO", "ES", "FR", "DE", "IT", "PT", "NL", "PL"]
const REGION_FOR_LOCALE: Dictionary = {
	"en": "GB", "ro": "RO", "es": "ES", "fr": "FR", "de": "DE",
	"it": "IT", "pt": "PT", "nl": "NL", "pl": "PL",
}

## Concepts: icon (Symbols token), a short name and optional layers.
const CONCEPTS: Dictionary = {
	"cash_at_home": {
		"icon": "piggy", "name_key": "concept.cash_at_home.name",
		"short_key": "concept.cash_at_home.short",
	},
	"instant_access_saving": {
		"icon": "bank", "name_key": "concept.instant_saving.name",
		"short_key": "concept.instant_saving.short",
	},
	"locked_long_term_saving": {
		"icon": "vault", "name_key": "concept.locked_saving.name",
		"short_key": "concept.locked_saving.short",
		"deep_keys": ["concept.locked_saving.deep"],
	},
}

## Real products, by id. Only verified entries; each names its source.
const PRODUCTS: Dictionary = {
	"gb_junior_isa": {
		"region": "GB",
		"concept": "locked_long_term_saving",
		"name_key": "product.gb_junior_isa.name",          # "ISA"
		"short_key": "product.gb_junior_isa.short",
		"tax_free": true,
		"locked_until_age": 18,
		"source": "gov.uk/junior-individual-savings-accounts",
	},
}


static func region() -> String:
	if not Settings.region.is_empty():
		return Settings.region
	return REGION_FOR_LOCALE.get(Localization.current_locale, "GB")


## The real product for this concept in the current region, or {}.
static func product_for(concept: String) -> Dictionary:
	var r: String = region()
	for id in PRODUCTS:
		var p: Dictionary = PRODUCTS[id]
		if p["concept"] == concept and p["region"] == r:
			var out: Dictionary = p.duplicate()
			out["id"] = id
			return out
	return {}


static func has_product(concept: String) -> bool:
	return not product_for(concept).is_empty()


## The short name to show for a concept here: the product's own name where
## one exists (e.g. "ISA" in the UK), else the concept's neutral name.
## The concept's own name — the idea comes first everywhere; a real
## product is only an example in the deep layer (deep_keys).
static func name_key(concept: String) -> String:
	return String(CONCEPTS.get(concept, {}).get("name_key", ""))


## The real product's short name here ("" where none exists).
static func product_name_key(concept: String) -> String:
	return String(product_for(concept).get("name_key", ""))


static func icon(concept: String) -> String:
	return String(CONCEPTS.get(concept, {}).get("icon", "question"))


## Layer 2 (short, optional) for the concept here.
static func short_key(concept: String) -> String:
	return String(CONCEPTS.get(concept, {}).get("short_key", ""))


## Layer 3: the concept explained, then — only where a real product exists
## — that product as one short example (never a whole lesson).
static func deep_keys(concept: String) -> Array:
	var out: Array = (CONCEPTS.get(concept, {}).get("deep_keys", []) as Array).duplicate()
	var p: Dictionary = product_for(concept)
	if not p.is_empty():
		out.append(String(p["short_key"]))
	return out


## Real rules that change the experience (only from a real product).
static func is_tax_free(concept: String) -> bool:
	return bool(product_for(concept).get("tax_free", false))
