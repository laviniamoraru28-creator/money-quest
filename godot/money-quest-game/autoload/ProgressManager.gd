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
	GameState.add_coins(coin_reward)
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
