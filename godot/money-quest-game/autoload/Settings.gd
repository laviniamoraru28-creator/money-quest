extends Node
## Settings — the Godot equivalent of the website's accessibility
## preferences (src/lib/accessibility/use-accessibility-preferences.ts) and
## a future theme preference. Values here are loaded/overwritten by
## SaveManager at startup (see autoload order in project.godot); this
## script only holds the current in-memory values and notifies listeners.
##
## Reduced motion here plays the exact same role as the website's
## `data-reduced-motion` attribute: any tween/animation anywhere in this
## project MUST check Settings.reduced_motion before playing a
## non-essential animation, the same "respect it everywhere, don't bolt it
## on per-component" discipline the website's CSS rule already enforces.

signal reduced_motion_changed(enabled: bool)
signal theme_changed(mode: String)
signal music_volume_changed(value: float)
signal sfx_volume_changed(value: float)
signal voice_volume_changed(value: float)
signal ambient_volume_changed(value: float)

## "light" | "dark" | "system" — mirrors the website's proposed theme
## system (docs/godot-architecture-plan.md Section 4). Godot does not have
## a native "system theme" signal on every platform, so "system" falls
## back to "light" where the OS preference can't be read; this is a known,
## documented limitation, not a silent gap.
var theme_mode: String = "system"
var reduced_motion: bool = false

## Four independent volume channels (0.0–1.0 linear, matching how
## SettingsMenu.tscn's HSliders present them), one per AudioManager bus
## (Music/SFX/Voice/Ambient — see default_bus_layout.tres). AudioManager
## listens to the *_changed signals below and applies these to the real
## AudioServer bus; this script only holds the values and notifies
## listeners, same division of responsibility as reduced_motion/theme_mode.
var music_volume: float = 0.8
var sfx_volume: float = 0.8
var voice_volume: float = 0.8
var ambient_volume: float = 0.8


func set_reduced_motion(enabled: bool) -> void:
	if reduced_motion == enabled:
		return
	reduced_motion = enabled
	reduced_motion_changed.emit(enabled)


func set_theme_mode(mode: String) -> void:
	if not ["light", "dark", "system"].has(mode):
		push_warning("Settings: unknown theme mode '%s'" % mode)
		return
	if theme_mode == mode:
		return
	theme_mode = mode
	theme_changed.emit(mode)


func set_music_volume(value: float) -> void:
	value = clampf(value, 0.0, 1.0)
	if is_equal_approx(music_volume, value):
		return
	music_volume = value
	music_volume_changed.emit(value)


func set_sfx_volume(value: float) -> void:
	value = clampf(value, 0.0, 1.0)
	if is_equal_approx(sfx_volume, value):
		return
	sfx_volume = value
	sfx_volume_changed.emit(value)


func set_voice_volume(value: float) -> void:
	value = clampf(value, 0.0, 1.0)
	if is_equal_approx(voice_volume, value):
		return
	voice_volume = value
	voice_volume_changed.emit(value)


func set_ambient_volume(value: float) -> void:
	value = clampf(value, 0.0, 1.0)
	if is_equal_approx(ambient_volume, value):
		return
	ambient_volume = value
	ambient_volume_changed.emit(value)


## Returns the animation duration to use for a given "full" duration,
## collapsing to near-zero when reduced motion is on — the Godot analogue
## of the website's `animation-duration: 0.01ms !important` rule. Call
## sites should use this instead of a hard-coded tween duration.
func animation_duration(full_duration_seconds: float) -> float:
	return 0.01 if reduced_motion else full_duration_seconds


# --- Comfort, readability and guidance (vertical slice) ----------------------
# Each value below is saved (SaveManager) and announced through the one
# generic `changed` signal, so a new option never needs a new signal.

signal changed(key: String, value: Variant)

## Text and interface size. Applied to the whole 2D interface at once
## (UIScale) — the 3D world is unaffected. "large" is the default: the
## interface was laid out for a 1280×720 canvas, which on a small window
## made text too small for a child to read comfortably.
const UI_SCALES: Dictionary = {"small": 1.0, "medium": 1.15, "large": 1.3, "xlarge": 1.5}
## Defaults (keep in step with the var initialisers below).
const DEFAULTS: Dictionary = {
	"ui_scale": "large",
	"master_volume": 1.0,
	"sound_muted": false,
	"subtitles": true,
	"narration": false,
	"hints": true,
	"focus_mode": false,
	"show_text": true,
	"visual_guidance": "normal",
	"support_level": 0,
	"camera_sensitivity": 1.0,
	"camera_smoothing": true,
	"camera_fov": 65.0,
}

var ui_scale: String = "large"
var master_volume: float = 1.0
## One switch that silences everything without losing the volume levels.
var sound_muted: bool = false
## Spoken lines (narration) always have text on screen while this is on —
## and nothing important is ever audio-only either way.
var subtitles: bool = true
## Read objectives and dialogue aloud with the device's own voice (when
## the platform has one). Off by default; the game never depends on it.
var narration: bool = false
## Offer gentle help ("Need a little help?") when the player seems stuck.
var hints: bool = true
## Focus Mode (as on the website): only the main activity — optional extras
## (fun-fact lines, discovery glints, ambient events, chatty asides) are
## left out. Never hides anything needed to play.
var focus_mode: bool = false
## Universal Play & Learn (see SupportProfile): words are an extra layer —
## with show_text off, cards, prices and the balance speak in pictures,
## coins and numbers, and nothing needed to play is lost.
var show_text: bool = true
## How strongly the world points things out: "strong" | "normal" | "light".
var visual_guidance: String = "normal"
## 0 = Auto (inferred locally from successful play), or a fixed 1–4.
var support_level: int = 0
var camera_sensitivity: float = 1.0
## Smooth camera follow (off = the camera snaps, like Reduced Motion).
var camera_smoothing: bool = true
var camera_fov: float = 65.0


## Sets one of the options in DEFAULTS by name (clamped/validated) and
## announces it. Returns false for an unknown key or an invalid value.
func set_value(key: String, value: Variant) -> bool:
	if not DEFAULTS.has(key):
		push_warning("Settings: unknown setting '%s'" % key)
		return false
	match key:
		"ui_scale":
			if not UI_SCALES.has(value):
				return false
		"master_volume":
			value = clampf(float(value), 0.0, 1.0)
		"camera_sensitivity":
			value = clampf(float(value), 0.25, 3.0)
		"camera_fov":
			value = clampf(float(value), 55.0, 85.0)
		"visual_guidance":
			if not (value in ["strong", "normal", "light"]):
				return false
		"support_level":
			value = clampi(int(value), 0, 4)
		_:
			if typeof(DEFAULTS[key]) == TYPE_BOOL:
				value = bool(value)
	if get(key) == value:
		return true
	set(key, value)
	changed.emit(key, value)
	return true


func ui_scale_factor() -> float:
	return float(UI_SCALES.get(ui_scale, 1.3))
