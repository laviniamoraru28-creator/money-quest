class_name MissionStepData
extends Resource
## MissionStepData — one mission of the guided adventure (GuidedRoute):
## where it happens, what its goal looks like, the one short instruction,
## and how the game already records that it is done. It never holds the
## activity itself — the place's own activity (its flow, quest or lesson)
## is the mission; this only points at it, so nothing is duplicated.

@export var mission_id: String = ""
## The place the mission happens in (ZoneData.zone_id). "Let's go" takes
## the child straight there.
@export var zone_id: String = ""
## The goal as pictures (MissionStrip tokens), e.g. ["coin", "then", "jar"].
@export var goal_icons: Array[String] = []
## One short, specific instruction (words are an extra layer).
@export var instruction_key: String = ""
## How the existing progress already records it as done (kept in the
## save, so a loaded game resumes at the next unfinished mission):
##   "activity:<id>"            ProgressManager.is_activity_completed
##   "quest:<id>"               ProgressManager.is_quest_completed
##   "lesson:<id>"              ProgressManager.is_lesson_completed
##   "badge:<id>"               ProgressManager.has_badge
##   "state:<activity>:<key>"   a counter in ProgressManager.activity_state > 0
## Several ways separated by "|" (any one is enough).
@export var done_when: String = ""
## Optional: the place's own objective that shows its activity has really
## finished (e.g. the Time Vault's "tv.next" after its comparison) — the
## mission's "Done!" waits for it, so the guided card never interrupts.
@export var finish_objective: String = ""
