class_name InfoStand
extends ActivityStation
## InfoStand — a reading stand with an open book: the "More" place for a
## topic (InfoLayers layers 2 and 3). Always optional — nothing in the
## activity needs it — and placed a little aside so it never gets in the
## way. Reusable in any zone: set `topic`.

@export var topic: String = ""


func _init() -> void:
	prompt_key = "interaction.more_prompt"
	reach = 1.8


func _build_visual() -> Node3D:
	var root := Node3D.new()
	root.name = "Stand"
	var m := MeshMerger.new()
	DecorProps.lectern_book(m, Transform3D.IDENTITY)
	m.commit_to(root, "StandMesh", true)
	var body := StaticBody3D.new()
	body.collision_layer = 1
	body.collision_mask = 0
	root.add_child(body)
	DecorKit.add_box_collider(body, Vector3(0.7, 1.2, 0.6), DecorKit.xf(Vector3(0, 0.6, 0)))
	return root


func interact() -> void:
	used.emit()
	if InfoLayers.has_topic(topic):
		InfoLayers.open(self, topic)
