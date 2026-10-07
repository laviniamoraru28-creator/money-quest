class_name SupportProfile
extends RefCounted
## SupportProfile — how much support the game gives right now, in one
## place. Not a separate "mode": every child plays the SAME activities; the
## profile only changes how they are presented (how many choices, how
## strongly things are pointed out, whether a character demonstrates first,
## whether words are shown).
##
## Inputs (existing Settings, so it is part of the accessibility settings
## the child or a grown-up already uses):
##   Settings.support_level   0 = Auto, or a fixed 1–4
##   Settings.visual_guidance "strong" | "normal" | "light"
##   Settings.show_text       words on/off (never required either way)
##   Settings.reduced_motion  calm, still presentation
##   Settings.sound_muted     (sound is never needed to understand anything)
##
## Auto level is inferred locally from successful play only — a count of
## things done ("support" activity state), never a test, never profiling,
## never sent anywhere. Levels:
##   1  two very different choices, strong pointing, a demonstration first
##   2  three choices, normal pointing, demonstration on request
##   3  a budget to stay within, comparing, lighter pointing
##   4  minimal guidance — the child decides

const SUCCESS_STATE: String = "support"
## Successful actions needed to reach levels 2, 3 and 4 automatically.
const LEVEL_THRESHOLDS: Array[int] = [2, 5, 9]


static func level() -> int:
	if Settings.support_level > 0:
		return Settings.support_level
	var n: int = successes()
	var lvl: int = 1
	for t in LEVEL_THRESHOLDS:
		if n >= t:
			lvl += 1
	return lvl


static func successes() -> int:
	return int(ProgressManager.get_activity_state(SUCCESS_STATE, "successes", 0))


## Record one successful action (a purchase, a correct comparison, a
## completed activity). Local only.
static func record_success() -> void:
	ProgressManager.set_activity_state(SUCCESS_STATE, "successes", successes() + 1)


static func choice_count() -> int:
	return [2, 3, 3, 4][level() - 1]


## 0..1: how strongly targets are pointed out (beacon size, trail).
static func highlight_strength() -> float:
	match Settings.visual_guidance:
		"strong":
			return 1.0
		"light":
			return 0.0
	return [0.6, 0.6, 0.35, 0.0][level() - 1]   # level 4: a quiet ring only


## Whether a character shows how to do it before the child tries.
static func demonstration_enabled() -> bool:
	if Settings.visual_guidance == "strong":
		return true
	if Settings.visual_guidance == "light":
		return false
	return level() <= 2


## Words on cards, prices and the balance (always optional).
static func show_text() -> bool:
	return Settings.show_text


## Purchases are always confirmed (a deliberate second step).
static func confirmation_required() -> bool:
	return true


## 0 with Reduced Motion (instant, still), else 1.
static func animation_speed() -> float:
	return 0.0 if Settings.reduced_motion else 1.0


## Seconds without progress before the world offers more help.
static func interaction_timeout() -> float:
	match Settings.visual_guidance:
		"strong":
			return 8.0
		"light":
			return 30.0
	# Normal guidance: help comes sooner at level 1, later as the child
	# grows more independent.
	return [12.0, 18.0, 24.0, 30.0][level() - 1]
