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

## "light" | "dark" | "system" — mirrors the website's proposed theme
## system (docs/godot-architecture-plan.md Section 4). Godot does not have
## a native "system theme" signal on every platform, so "system" falls
## back to "light" where the OS preference can't be read; this is a known,
## documented limitation, not a silent gap.
var theme_mode: String = "system"
var reduced_motion: bool = false


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


## Returns the animation duration to use for a given "full" duration,
## collapsing to near-zero when reduced motion is on — the Godot analogue
## of the website's `animation-duration: 0.01ms !important` rule. Call
## sites should use this instead of a hard-coded tween duration.
func animation_duration(full_duration_seconds: float) -> float:
	return 0.01 if reduced_motion else full_duration_seconds
