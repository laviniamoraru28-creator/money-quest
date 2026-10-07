extends Node
## Localization — thin wrapper around Godot's built-in TranslationServer.
##
## Mirrors the website's i18n/config.ts: the same 9 locale codes, the same
## "English is always a complete fallback" guarantee. Scripts should NEVER
## call tr() directly or hard-code user-facing text — always go through
## Localization.t(key) so there is a single place to extend substitution
## syntax later (Godot's .csv translations only support simple %s-style
## placeholders natively; this wrapper adds named {placeholder} substitution
## so lesson content authored with {amount}-style keys, the same convention
## messages/en.json already uses, works unchanged in Godot).

## Matches src/i18n/config.ts's LOCALES exactly — do not reorder without
## checking that file too, since this list is the documentation of parity.
const SUPPORTED_LOCALES: Array[String] = [
	"en", "ro", "es", "fr", "de", "it", "pt", "nl", "pl"
]
const DEFAULT_LOCALE: String = "en"

signal locale_changed(new_locale: String)

var current_locale: String = DEFAULT_LOCALE


func _ready() -> void:
	set_locale(DEFAULT_LOCALE)


func set_locale(locale_code: String) -> void:
	if not SUPPORTED_LOCALES.has(locale_code):
		push_warning("Localization: unsupported locale '%s', falling back to '%s'" % [locale_code, DEFAULT_LOCALE])
		locale_code = DEFAULT_LOCALE
	current_locale = locale_code
	TranslationServer.set_locale(locale_code)
	locale_changed.emit(locale_code)


## The one function every script should call for user-facing text.
## `params` supports {name}-style placeholders, e.g.
## Localization.t("lesson.week_label", {"week": 2}) with a CSV value of
## "Week {week}" — the same placeholder convention messages/*.json uses.
func t(key: String, params: Dictionary = {}) -> String:
	var translated: String = tr(key)
	if translated == key:
		# Godot's tr() returns the key itself when no translation is
		# loaded for it — surface this loudly in debug builds rather than
		# silently showing a raw key to a child, mirroring the website's
		# dev-only missing-key warning in src/i18n/request.ts.
		if OS.is_debug_build():
			push_warning("Localization: missing translation key '%s' for locale '%s'" % [key, current_locale])
	for param_key in params.keys():
		translated = translated.replace("{%s}" % param_key, str(params[param_key]))
	return translated


## Like t(), for a phrase with a count: picks `key_one`, `key_few`,
## `key_many` or plain `key` (the "other" form) by the current language's
## plural rule, with `{amount}` = n. A form a language does not need is
## simply left empty in the CSV and falls back to `key`.
##   en es fr de it pt nl: one (1; French also 0) / other
##   ro: one (1) / few (0, 2–19, or ending 01–19) / other (20+, "de")
##   pl: one (1) / few (2–4, 22–24…, not 12–14) / many (everything else)
func tn(key: String, n: int, params: Dictionary = {}) -> String:
	var form: String = plural_form(n)
	var p: Dictionary = params.duplicate()
	p["amount"] = n
	if form != "other":
		var k: String = "%s_%s" % [key, form]
		if tr(k) != k:
			return t(k, p)
	return t(key, p)


func plural_form(n: int) -> String:
	var a: int = absi(n)
	match current_locale:
		"pl":
			if a == 1:
				return "one"
			if a % 10 >= 2 and a % 10 <= 4 and not (a % 100 >= 12 and a % 100 <= 14):
				return "few"
			return "many"
		"ro":
			if a == 1:
				return "one"
			if a == 0 or (a % 100 >= 1 and a % 100 <= 19):
				return "few"
			return "other"
		"fr":
			return "one" if a <= 1 else "other"
		_:
			return "one" if a == 1 else "other"
