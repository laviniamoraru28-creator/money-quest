class_name UIFocus
extends RefCounted
## UIFocus — gives a modal panel's primary control keyboard/gamepad focus
## when the panel opens, so the arrow keys / D-pad / left stick move
## between its buttons and Enter, Space or the gamepad's A button press the
## focused one (ui_accept). Panels call it once when they open (or switch
## views) — never per frame and never again while open, so it can't pull
## focus away from wherever the child has moved. Godot releases the focus
## by itself when a panel hides, so the next A / E press goes back to the
## 3D world.


## Focuses `control`, or — for a container — its first usable button,
## skipping buttons a previous rebuild has queued for deletion.
static func focus(control: Control) -> void:
	var target: Control = first_button(control) if control is Container else control
	if target and target.is_inside_tree():
		target.grab_focus()


static func first_button(root: Node) -> Control:
	for child in root.get_children():
		if child.is_queued_for_deletion():
			continue
		if child is BaseButton and child.visible and not child.disabled and child.focus_mode != Control.FOCUS_NONE:
			return child
		var inner: Control = first_button(child)
		if inner:
			return inner
	return null


## The control that has keyboard/gamepad focus right now, if it is actually
## on screen — or null. (A hidden control can keep focus; it must never
## block walking, the camera or the help key.)
static func visible_focus(viewport: Viewport) -> Control:
	var f: Control = viewport.gui_get_focus_owner()
	return f if f != null and f.is_visible_in_tree() else null
