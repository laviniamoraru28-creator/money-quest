class_name Collectible
extends Area3D
## Collectible — something small to find and pick up by simply walking
## into it (no button needed: forgiving for every input). A gold coin by
## default: it spins slowly and shimmers so it reads as "for me", plays a
## chime and a little pop when collected, and remembers that it was
## collected (ProgressManager activity state), so it never comes back after
## leaving the zone, a fall, or a restart. Reduced Motion: still, no pop.

signal collected(collectible_id: String)

## Which activity this belongs to, and this item's own id within it.
@export var activity_id: String = ""
@export var collectible_id: String = ""

var _visual: Node3D
var _time: float = 0.0
var _taken: bool = false

static var _mesh: Mesh


func _ready() -> void:
	collision_layer = 0
	collision_mask = 1
	monitoring = true
	var shape := CollisionShape3D.new()
	var s := SphereShape3D.new()
	s.radius = 0.9
	shape.shape = s
	shape.position = Vector3(0, 0.8, 0)
	add_child(shape)
	_visual = MeshInstance3D.new()
	_visual.name = "Coin"
	(_visual as MeshInstance3D).mesh = _coin_mesh()
	_visual.position = Vector3(0, 0.9, 0)
	add_child(_visual)
	set_meta("marker_height", 1.7)
	if is_collected():
		_taken = true
		visible = false
		monitoring = false
		return
	body_entered.connect(_on_body_entered)


static func _coin_mesh() -> Mesh:
	if _mesh == null:
		var m := MeshMerger.new()
		m.part(DecorKit.cyl(0.28, 0.28, 0.07, 24), DecorKit.mat("gold", 0.45), Vector3.ZERO, Vector3(90, 0, 0))
		m.part(DecorKit.cyl(0.2, 0.2, 0.08, 24), DecorKit.mat("gold_deep"), Vector3.ZERO, Vector3(90, 0, 0))
		m.part(DecorKit.box(Vector3(0.05, 0.2, 0.09)), DecorKit.mat("gold", 0.45), Vector3.ZERO)
		_mesh = m.commit()
	return _mesh


func is_collected() -> bool:
	var got: Array = ProgressManager.get_activity_state(activity_id, "collected", [])
	return got.has(collectible_id)


func _process(delta: float) -> void:
	if _taken or Settings.reduced_motion:
		return
	_time += delta
	_visual.rotation.y = _time * 1.8
	_visual.position.y = 0.9 + sin(_time * 2.2) * 0.08


func _on_body_entered(body: Node3D) -> void:
	if _taken or not body.is_in_group("player"):
		return
	_taken = true
	var got: Array = ProgressManager.get_activity_state(activity_id, "collected", []).duplicate()
	if not got.has(collectible_id):
		got.append(collectible_id)
	ProgressManager.set_activity_state(activity_id, "collected", got)
	AudioManager.play_sfx("coin")
	set_deferred("monitoring", false)
	collected.emit(collectible_id)
	if Settings.reduced_motion:
		visible = false
		return
	var tw := create_tween()
	tw.tween_property(_visual, "position:y", 2.0, 0.35).set_ease(Tween.EASE_OUT)
	tw.parallel().tween_property(_visual, "scale", Vector3.ONE * 0.2, 0.35)
	tw.tween_callback(func(): visible = false)
