class_name MessageBoard
extends ActivityStation
## MessageBoard — Guardian Gate's message board: "Spot the tricks." The
## child walks up and uses it; the room's flow opens the picture spot
## (SpotPanel): six messages as picture cards — three tricks (a prize
## pop-up, someone asking for a secret code, "send coins, get more coins")
## and three fine ones (family, a school trip, a friend asking to play).
## Tapping a trick marks it found; a fine one says "this one is OK".

const ACTIVITY: String = "gg-spot-trick"
const XP: int = 15

const MESSAGES: Array = [
	{"id": "prize", "label": "gg.msg.prize", "icons": ["popup", "star"], "trick": true},
	{"id": "secret", "label": "gg.msg.secret", "icons": ["chat", "lock"], "trick": true},
	{"id": "double", "label": "gg.msg.double", "icons": ["coin", "then", "coin", "coin", "coin"], "trick": true},
	{"id": "family", "label": "gg.msg.family", "icons": ["chat", "heart"], "trick": false},
	{"id": "trip", "label": "gg.msg.trip", "icons": ["chat", "calendar"], "trick": false},
	{"id": "play", "label": "gg.msg.play", "icons": ["chat", "game"], "trick": false},
]


func _init() -> void:
	prompt_key = "interaction.try_prompt"


func _build_visual() -> Node3D:
	var n := Node3D.new()
	var m := MeshMerger.new()
	DecorProps.picture_board(m, Transform3D.IDENTITY, "wood_dark", ["coral", "sky", "gold", "teal"])
	m.origin = Transform3D.IDENTITY
	m.commit_to(n, "Board", true)
	var body := StaticBody3D.new()
	body.collision_layer = 1
	body.collision_mask = 0
	n.add_child(body)
	DecorKit.add_box_collider(body, Vector3(1.6, 2.2, 0.3), DecorKit.xf(Vector3(0, 1.1, 0)))
	return n


static func done() -> bool:
	return ProgressManager.is_activity_completed(ACTIVITY)


## Runs the spot; records the activity (and a little XP) the first time.
func play() -> void:
	var items: Array[SpotItemData] = []
	for msg in MESSAGES:
		var d := SpotItemData.new()
		d.item_id = msg["id"]
		d.text_key = msg["label"]
		d.is_suspicious = msg["trick"]
		d.icon_tokens.assign(msg["icons"])
		items.append(d)
	await SpotPanel.show_spot("gg.spot.instructions", items)
	if not done():
		GameState.add_xp(XP)
		ProgressManager.complete_activity(ACTIVITY)
	Feedback.success(self, ["shield", "then", "npc:grown_up"], "gg.spot.done")
