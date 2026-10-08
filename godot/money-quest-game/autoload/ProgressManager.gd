extends Node
## ProgressManager — "what has this child ever completed," the durable
## half of progress (as opposed to GameState's live session values).
## Mirrors applyActivityCompletion()/awardBadge() in the website's
## src/lib/local-progress/state.ts: every award function here is
## idempotent (completing the same lesson twice, or awarding the same
## badge twice, never double-counts), the same guarantee the website's
## pure functions provide.

signal lesson_completed(lesson_id: String)
signal badge_awarded(badge_id: String)
signal quest_completed(quest_id: String)

var completed_lesson_ids: Array[String] = []
var earned_badge_ids: Array[String] = []

## Money Quest World additions (see docs/money-quest-world-architecture.md
## Section 8) — additive to the fields above, never replacing them, so an
## older save made before this phase still loads correctly (see
## SaveManager's merge-over-defaults).
var completed_quest_ids: Array[String] = []
var unlocked_zone_ids: Array[String] = []

## skill_id -> number of times a completed quest/mission tagged that skill.
## A running tally for a future Leadership Profile-style summary — never
## displayed as a single "intelligence score" (project brief Section 17).
var skill_points: Dictionary = {}

## Library/Museum/Dictionary entry ids the child has opened at least once —
## empty until those destinations have real content (Section 6).
var discovered_entry_ids: Array[String] = []

## Optional things the child has found while exploring the 3D world (a
## district reached for the first time, a fountain looked at, a little
## secret spotted) — ids like "landmark:PortalLibrary" or "hub:fountain".
## Memory only: it decides things like "show the first-visit hint once",
## never rewards, coins, unlocks or a completion percentage.
var world_discovery_ids: Array[String] = []

signal world_discovered(discovery_id: String)

var avatar_config: AvatarConfig = AvatarConfig.new()

## A child's personal "Create Your Own Calm Garden" choices (Calm World's
## 8th space) — purely decorative, see CalmGardenConfig.gd's own comment.
var calm_garden_config: CalmGardenConfig = CalmGardenConfig.new()

## True once the child has gone through AvatarCreation.tscn at least once —
## lets MainMenu skip straight back into the world on return visits instead
## of forcing avatar creation again every launch.
var has_created_avatar: bool = false


func is_lesson_completed(lesson_id: String) -> bool:
	return completed_lesson_ids.has(lesson_id)


func has_badge(badge_id: String) -> bool:
	return earned_badge_ids.has(badge_id)


## Call once when a child finishes a lesson's final beat. Awards XP/coins
## only the FIRST time a lesson is completed — replaying an already-done
## lesson for practice should never double-award, mirroring exactly how
## the website's applyActivityCompletion() only pays out on first
## completion.
func complete_lesson(lesson_id: String, xp_reward: int, coin_reward: int) -> void:
	if is_lesson_completed(lesson_id):
		return
	completed_lesson_ids.append(lesson_id)
	GameState.add_xp(xp_reward)
	GameState.add_coins(coin_reward, "lesson:" + lesson_id, "book", "reward")
	lesson_completed.emit(lesson_id)


func award_badge(badge_id: String) -> void:
	if has_badge(badge_id):
		return
	earned_badge_ids.append(badge_id)
	badge_awarded.emit(badge_id)


func is_quest_completed(quest_id: String) -> bool:
	return completed_quest_ids.has(quest_id)


## Called by QuestManager once a quest's full experience finishes. Only the
## FIRST completion counts toward skill_points — replaying a quest for
## practice never inflates the tally, the same idempotency every other
## award function here guarantees.
func complete_quest(quest_id: String, skill_ids: Array[String] = []) -> void:
	if is_quest_completed(quest_id):
		return
	completed_quest_ids.append(quest_id)
	for skill_id in skill_ids:
		skill_points[skill_id] = skill_points.get(skill_id, 0) + 1
	quest_completed.emit(quest_id)


## Returns true the first time an id is discovered.
func discover_world(discovery_id: String) -> bool:
	if discovery_id.is_empty() or world_discovery_ids.has(discovery_id):
		return false
	world_discovery_ids.append(discovery_id)
	world_discovered.emit(discovery_id)
	return true


func has_discovered_world(discovery_id: String) -> bool:
	return world_discovery_ids.has(discovery_id)


func discover_entry(entry_id: String) -> void:
	if not discovered_entry_ids.has(entry_id):
		discovered_entry_ids.append(entry_id)


# --- Activities (vertical slice) ---------------------------------------------
# A small, reusable record of hands-on activities (an in-world mini-game, a
# tutorial step, coins found in a zone): which are complete, plus a little
# free-form state per activity (e.g. which coins were already picked up), so
# leaving the zone, falling, or closing the game never loses progress.

signal activity_changed(activity_id: String)

var completed_activity_ids: Array[String] = []
var activity_state: Dictionary = {}


func is_activity_completed(activity_id: String) -> bool:
	return completed_activity_ids.has(activity_id)


func complete_activity(activity_id: String) -> void:
	if activity_id.is_empty() or is_activity_completed(activity_id):
		return
	completed_activity_ids.append(activity_id)
	activity_changed.emit(activity_id)


func get_activity_state(activity_id: String, key: String, fallback: Variant = null) -> Variant:
	var s: Variant = activity_state.get(activity_id, {})
	return (s as Dictionary).get(key, fallback) if s is Dictionary else fallback


func set_activity_state(activity_id: String, key: String, value: Variant) -> void:
	if not (activity_state.get(activity_id) is Dictionary):
		activity_state[activity_id] = {}
	activity_state[activity_id][key] = value
	activity_changed.emit(activity_id)


# --- Owned items (Phase 6: the world's simple "what do I have") -----------------
# Deliberately NOT an RPG inventory: no slots, weight, rarity or crafting.
# Only: does the child own it, how many, when it was first acquired, and
# whether it has been used. Saved as "owned_items" (older saves: none).

signal item_acquired(item_id: String, count: int)

## item_id -> {"count": int, "acquired": int (unix seconds), "used": bool}
var owned_items: Dictionary = {}


func own_item(item_id: String, count: int = 1) -> void:
	if item_id.is_empty() or count <= 0:
		return
	var rec: Dictionary = owned_items.get(item_id, {"count": 0, "acquired": int(Time.get_unix_time_from_system()), "used": false})
	rec["count"] = int(rec.get("count", 0)) + count
	owned_items[item_id] = rec
	item_acquired.emit(item_id, rec["count"])


func owned_count(item_id: String) -> int:
	var rec: Variant = owned_items.get(item_id, null)
	return int((rec as Dictionary).get("count", 0)) if rec is Dictionary else 0


func owns(item_id: String) -> bool:
	return owned_count(item_id) > 0


func mark_item_used(item_id: String) -> void:
	if owned_items.has(item_id):
		owned_items[item_id]["used"] = true
		item_acquired.emit(item_id, owned_count(item_id))


func is_item_used(item_id: String) -> bool:
	var rec: Variant = owned_items.get(item_id, null)
	return bool((rec as Dictionary).get("used", false)) if rec is Dictionary else false
