extends Node
## SaveManager — the ONLY script that touches disk for progress data.
## Reads/writes a single user://progress.json file: the direct Godot
## equivalent of the website's localStorage key
## `moneyquest_local_progress_v1`. No database, no authentication, no
## network call — exactly the constraint the project brief requires.
##
## Autoload order (see project.godot) guarantees Localization, Settings,
## GameState, and ProgressManager already exist by the time this script's
## _ready() runs, so it's safe to push loaded values into them here.

const SAVE_PATH: String = "user://progress.json"

const DEFAULT_SAVE: Dictionary = {
	"age_band": "builder",
	"xp_total": 0,
	"virtual_coins": 0,
	"completed_lesson_ids": [],
	"earned_badge_ids": [],
	"theme": "system",
	"reduced_motion": false,
	"locale": "en",
}


func _ready() -> void:
	load_progress()
	# Auto-save whenever anything meaningful changes — mirrors the
	# website's "persist on every mutation" use-local-progress.ts pattern,
	# so a crash or sudden quit never loses more than the current moment.
	ProgressManager.lesson_completed.connect(func(_id): save_progress())
	ProgressManager.badge_awarded.connect(func(_id): save_progress())
	Settings.reduced_motion_changed.connect(func(_v): save_progress())
	Settings.theme_changed.connect(func(_v): save_progress())
	Localization.locale_changed.connect(func(_v): save_progress())


func load_progress() -> void:
	var data: Dictionary = DEFAULT_SAVE.duplicate(true)

	if FileAccess.file_exists(SAVE_PATH):
		var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
		var raw_text := file.get_as_text()
		file.close()
		var parsed: Variant = JSON.parse_string(raw_text)
		if parsed is Dictionary:
			# Merge over the defaults rather than trusting the file
			# wholesale — an older save missing a newer field (e.g. a
			# future "theme" addition) should never crash the game,
			# the same additive-schema safety the website's
			# readFromStorage() deep-merge already relies on.
			for key in parsed.keys():
				data[key] = parsed[key]
		else:
			push_warning("SaveManager: progress.json was not valid JSON — starting from defaults")

	GameState.age_band = data.get("age_band", DEFAULT_SAVE["age_band"])
	GameState.xp_total = data.get("xp_total", 0)
	GameState.wallet.balance = data.get("virtual_coins", 0)

	var completed: Array = data.get("completed_lesson_ids", [])
	ProgressManager.completed_lesson_ids.assign(completed)

	var badges: Array = data.get("earned_badge_ids", [])
	ProgressManager.earned_badge_ids.assign(badges)

	Settings.theme_mode = data.get("theme", "system")
	Settings.reduced_motion = data.get("reduced_motion", false)

	Localization.set_locale(data.get("locale", Localization.DEFAULT_LOCALE))


func save_progress() -> void:
	var data: Dictionary = {
		"age_band": GameState.age_band,
		"xp_total": GameState.xp_total,
		"virtual_coins": GameState.wallet.balance,
		"completed_lesson_ids": ProgressManager.completed_lesson_ids,
		"earned_badge_ids": ProgressManager.earned_badge_ids,
		"theme": Settings.theme_mode,
		"reduced_motion": Settings.reduced_motion,
		"locale": Localization.current_locale,
	}

	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		push_error("SaveManager: could not open %s for writing" % SAVE_PATH)
		return
	file.store_string(JSON.stringify(data, "\t"))
	file.close()


## For a future "reset progress" button, mirroring the website's existing
## reset-progress pattern in every quest feature.
func reset_progress() -> void:
	if FileAccess.file_exists(SAVE_PATH):
		DirAccess.remove_absolute(SAVE_PATH)
	load_progress()
