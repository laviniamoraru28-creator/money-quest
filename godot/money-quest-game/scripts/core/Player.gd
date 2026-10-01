class_name Player
extends CharacterBody2D
## Player — a minimal top-down controller shared by every lesson that has
## a walk-around component (not every lesson needs one; a pure dialogue
## lesson simply never instances this scene).
##
## Movement is TAP-TO-MOVE: the player taps/clicks anywhere on the ground
## and the character walks there. This is a deliberate mobile-first choice
## (project brief Phase 2: "interactive elements must not require
## precision clicking," "navigation must be easy with one hand") — no
## virtual joystick overlay is needed, and the exact same input works
## identically with mouse on desktop, satisfying both platforms with one
## implementation rather than two parallel control schemes.

const SPEED: float = 160.0
const ARRIVE_DISTANCE: float = 4.0

@onready var interaction_manager: InteractionManager = $InteractionManager

var _target_position: Vector2 = Vector2.ZERO
var _has_target: bool = false


func _ready() -> void:
	add_to_group("player")
	_target_position = global_position


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		_set_target(get_global_mouse_position())
	elif event is InputEventScreenTouch and event.pressed:
		_set_target(get_global_transform().affine_inverse() * event.position + global_position)
	elif event.is_action_pressed("interact"):
		interaction_manager.try_interact()


func _set_target(world_position: Vector2) -> void:
	_target_position = world_position
	_has_target = true


func _physics_process(_delta: float) -> void:
	if not _has_target:
		velocity = Vector2.ZERO
		return

	var to_target: Vector2 = _target_position - global_position
	if to_target.length() <= ARRIVE_DISTANCE:
		velocity = Vector2.ZERO
		_has_target = false
		return

	velocity = to_target.normalized() * SPEED
	move_and_slide()


## Called by an on-screen mobile "Talk" button as an alternative to the
## keyboard interact action — see InteractionManager.try_interact()'s own
## comment for why both input paths are first-class, not a fallback.
func request_interact() -> void:
	interaction_manager.try_interact()
