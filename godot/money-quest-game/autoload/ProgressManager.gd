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

var completed_lesson_ids: Array[String] = []
var earned_badge_ids: Array[String] = []


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
