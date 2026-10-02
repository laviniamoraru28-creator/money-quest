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
