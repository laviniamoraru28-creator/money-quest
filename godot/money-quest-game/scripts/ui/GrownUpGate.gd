class_name GrownUpGate
extends RefCounted
## GrownUpGate — the "Ask a grown-up" step shown before the game opens a
## website from a Library book card or a Museum exhibit card (owner decision
## D3, 2026-10-21). Nothing is sent, stored or collected: on "Open the
## website" the caller opens exactly the same URL it always did; on "Not
## now" nothing happens. "Not now" gets focus, so the safe choice is the
## default for keyboard and gamepad, and the question is read aloud for
## children who do not read yet (when narration is on).

const NODE_NAME := "GrownUpGate"


## Shows the question right under `anchor` (inside the same container) and
## returns true only when "Open the website" is pressed.
static func ask(anchor: Control) -> bool:
	var container: Node = anchor.get_parent()
	cancel_all(container)
	var gate := _Gate.new()
	var box := VBoxContainer.new()
	box.name = NODE_NAME
	box.add_theme_constant_override("separation", 10)
	box.set_meta("gate", gate)
	var msg := UIStyle.label(Localization.t("grownup_gate.message"))
	msg.name = "GrownUpMessage"
	msg.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	box.add_child(msg)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 12)
	var no := UIStyle.button(Localization.t("grownup_gate.cancel_button"), false)
	no.name = "GrownUpNo"
	var yes := UIStyle.button(Localization.t("grownup_gate.open_button"), true)
	yes.name = "GrownUpYes"
	row.add_child(no)
	row.add_child(yes)
	box.add_child(row)
	container.add_child(box)
	container.move_child(box, anchor.get_index() + 1)
	no.pressed.connect(func() -> void: gate.chosen.emit(false))
	yes.pressed.connect(func() -> void: gate.chosen.emit(true))
	AudioManager.narrate(msg.text)
	UIFocus.focus(no)
	var ok: bool = await gate.chosen
	if is_instance_valid(box):
		box.queue_free()
	if is_instance_valid(anchor) and anchor.is_visible_in_tree():
		UIFocus.focus(anchor)
	return ok


## Closes any open question in `container` as "Not now" (used when its card
## is closed or reopened while the question is still showing).
static func cancel_all(container: Node) -> void:
	if container == null:
		return
	for child in container.get_children():
		if child.name == NODE_NAME:
			var gate: _Gate = child.get_meta("gate") if child.has_meta("gate") else null
			container.remove_child(child)
			child.queue_free()
			if gate != null:
				gate.chosen.emit(false)


class _Gate extends RefCounted:
	signal chosen(ok: bool)
