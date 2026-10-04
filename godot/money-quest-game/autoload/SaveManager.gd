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
	"music_volume": 0.8,
	"sfx_volume": 0.8,
	"voice_volume": 0.8,
	"ambient_volume": 0.8,
	"locale": "en",
	"completed_quest_ids": [],
	"unlocked_zone_ids": [],
	"skill_points": {},
	"discovered_entry_ids": [],
	"avatar_body_preset_id": "preset-a",
	"avatar_outfit_color": "0F7A6B",
	"avatar_accessory_id": "",
	"has_created_avatar": false,
	"business_profile": {},
	"calm_garden_background_id": "meadow",
	"calm_garden_water_id": "pond",
	"calm_garden_plants_id": "flowers",
	"calm_garden_light_id": "none",
	"calm_garden_bubbles_id": "none",
	"calm_garden_stones_id": "none",
	"calm_garden_creature_id": "none",
}


func _ready() -> void:
	load_progress()
	# Auto-save whenever anything meaningful changes — mirrors the
	# website's "persist on every mutation" use-local-progress.ts pattern,
	# so a crash or sudden quit never loses more than the current moment.
	ProgressManager.lesson_completed.connect(func(_id): save_progress())
	ProgressManager.badge_awarded.connect(func(_id): save_progress())
	ProgressManager.quest_completed.connect(func(_id): save_progress())
	BusinessBuilder.profile_changed.connect(func(): save_progress())
	Settings.reduced_motion_changed.connect(func(_v): save_progress())
	Settings.theme_changed.connect(func(_v): save_progress())
	Settings.music_volume_changed.connect(func(_v): save_progress())
	Settings.sfx_volume_changed.connect(func(_v): save_progress())
	Settings.voice_volume_changed.connect(func(_v): save_progress())
	Settings.ambient_volume_changed.connect(func(_v): save_progress())
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

	var completed_quests: Array = data.get("completed_quest_ids", [])
	ProgressManager.completed_quest_ids.assign(completed_quests)

	var unlocked_zones: Array = data.get("unlocked_zone_ids", [])
	ProgressManager.unlocked_zone_ids.assign(unlocked_zones)

	ProgressManager.skill_points = data.get("skill_points", {}).duplicate()

	var discovered: Array = data.get("discovered_entry_ids", [])
	ProgressManager.discovered_entry_ids.assign(discovered)

	ProgressManager.avatar_config.body_preset_id = data.get(
		"avatar_body_preset_id", DEFAULT_SAVE["avatar_body_preset_id"]
	)
	ProgressManager.avatar_config.outfit_color = Color.html(
		data.get("avatar_outfit_color", DEFAULT_SAVE["avatar_outfit_color"])
	)
	ProgressManager.avatar_config.accessory_id = data.get("avatar_accessory_id", "")
	ProgressManager.has_created_avatar = data.get("has_created_avatar", false)

	_load_business_profile(data.get("business_profile", {}))

	ProgressManager.calm_garden_config.background_id = data.get(
		"calm_garden_background_id", DEFAULT_SAVE["calm_garden_background_id"]
	)
	ProgressManager.calm_garden_config.water_id = data.get(
		"calm_garden_water_id", DEFAULT_SAVE["calm_garden_water_id"]
	)
	ProgressManager.calm_garden_config.plants_id = data.get(
		"calm_garden_plants_id", DEFAULT_SAVE["calm_garden_plants_id"]
	)
	ProgressManager.calm_garden_config.light_id = data.get(
		"calm_garden_light_id", DEFAULT_SAVE["calm_garden_light_id"]
	)
	ProgressManager.calm_garden_config.bubbles_id = data.get(
		"calm_garden_bubbles_id", DEFAULT_SAVE["calm_garden_bubbles_id"]
	)
	ProgressManager.calm_garden_config.stones_id = data.get(
		"calm_garden_stones_id", DEFAULT_SAVE["calm_garden_stones_id"]
	)
	ProgressManager.calm_garden_config.creature_id = data.get(
		"calm_garden_creature_id", DEFAULT_SAVE["calm_garden_creature_id"]
	)

	Settings.theme_mode = data.get("theme", "system")
	Settings.reduced_motion = data.get("reduced_motion", false)
	Settings.music_volume = data.get("music_volume", DEFAULT_SAVE["music_volume"])
	Settings.sfx_volume = data.get("sfx_volume", DEFAULT_SAVE["sfx_volume"])
	Settings.voice_volume = data.get("voice_volume", DEFAULT_SAVE["voice_volume"])
	Settings.ambient_volume = data.get("ambient_volume", DEFAULT_SAVE["ambient_volume"])

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
		"music_volume": Settings.music_volume,
		"sfx_volume": Settings.sfx_volume,
		"voice_volume": Settings.voice_volume,
		"ambient_volume": Settings.ambient_volume,
		"locale": Localization.current_locale,
		"completed_quest_ids": ProgressManager.completed_quest_ids,
		"unlocked_zone_ids": ProgressManager.unlocked_zone_ids,
		"skill_points": ProgressManager.skill_points,
		"discovered_entry_ids": ProgressManager.discovered_entry_ids,
		"avatar_body_preset_id": ProgressManager.avatar_config.body_preset_id,
		"avatar_outfit_color": ProgressManager.avatar_config.outfit_color.to_html(false),
		"avatar_accessory_id": ProgressManager.avatar_config.accessory_id,
		"has_created_avatar": ProgressManager.has_created_avatar,
		"business_profile": _serialize_business_profile(),
		"calm_garden_background_id": ProgressManager.calm_garden_config.background_id,
		"calm_garden_water_id": ProgressManager.calm_garden_config.water_id,
		"calm_garden_plants_id": ProgressManager.calm_garden_config.plants_id,
		"calm_garden_light_id": ProgressManager.calm_garden_config.light_id,
		"calm_garden_bubbles_id": ProgressManager.calm_garden_config.bubbles_id,
		"calm_garden_stones_id": ProgressManager.calm_garden_config.stones_id,
		"calm_garden_creature_id": ProgressManager.calm_garden_config.creature_id,
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


func _load_business_profile(data: Dictionary) -> void:
	var profile: BusinessProfileData = BusinessBuilder.profile
	profile.problem = data.get("problem", "")
	profile.idea_description = data.get("idea_description", "")
	profile.business_name = data.get("business_name", "")
	profile.slogan = data.get("slogan", "")
	profile.product_category = data.get("product_category", "")
	profile.product_description = data.get("product_description", "")
	profile.customer_category = data.get("customer_category", "")
	profile.cost_per_unit = data.get("cost_per_unit", 2)
	profile.price = data.get("price", 5)
	profile.marketing_approach = data.get("marketing_approach", "")
	profile.why_choose_us = data.get("why_choose_us", "")
	profile.next_step = data.get("next_step", "")
	profile.completed_stage_ids.assign(data.get("completed_stage_ids", []))
	profile.pitch_completed = data.get("pitch_completed", false)
	profile.has_simulator_run = data.get("has_simulator_run", false)
	profile.last_units_made = data.get("last_units_made", 0)
	profile.last_units_sold = data.get("last_units_sold", 0)
	profile.last_sales = data.get("last_sales", 0)
	profile.last_costs = data.get("last_costs", 0)
	profile.last_profit = data.get("last_profit", 0)
	profile.last_remaining_money = data.get("last_remaining_money", 0)

	var logo_data: Dictionary = data.get("logo", {})
	profile.logo.shape = logo_data.get("shape", "circle")
	profile.logo.color_key = logo_data.get("color_key", "teal")
	profile.logo.symbol = logo_data.get("symbol", "🚀")


func _serialize_business_profile() -> Dictionary:
	var profile: BusinessProfileData = BusinessBuilder.profile
	return {
		"problem": profile.problem,
		"idea_description": profile.idea_description,
		"business_name": profile.business_name,
		"slogan": profile.slogan,
		"logo": {
			"shape": profile.logo.shape,
			"color_key": profile.logo.color_key,
			"symbol": profile.logo.symbol,
		},
		"product_category": profile.product_category,
		"product_description": profile.product_description,
		"customer_category": profile.customer_category,
		"cost_per_unit": profile.cost_per_unit,
		"price": profile.price,
		"marketing_approach": profile.marketing_approach,
		"why_choose_us": profile.why_choose_us,
		"next_step": profile.next_step,
		"completed_stage_ids": profile.completed_stage_ids,
		"pitch_completed": profile.pitch_completed,
		"has_simulator_run": profile.has_simulator_run,
		"last_units_made": profile.last_units_made,
		"last_units_sold": profile.last_units_sold,
		"last_sales": profile.last_sales,
		"last_costs": profile.last_costs,
		"last_profit": profile.last_profit,
		"last_remaining_money": profile.last_remaining_money,
	}
