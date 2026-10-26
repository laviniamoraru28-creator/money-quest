class_name MoneySortTable
extends ActivityStation
## MoneySortTable — Coin Cove's sorting table: "Is it money?" The child
## walks up and uses it (E / A / tap the prompt); the room's flow opens the
## picture sort (SortPanel): a coin, a banknote and a bank card go to
## "money" (a coin with ✓), a leaf, a stone and an apple to "not money"
## (a coin with ✗). The table is a real thing in the room (it glows and is
## marked while it is the mission), clearly apart from the scenery.

const ACTIVITY: String = "cc-money-sort"
const XP: int = 15

const BUCKETS: Array = [
	{"key": "money", "label": "cc.sort.money", "icons": ["coin", "tick"]},
	{"key": "not_money", "label": "cc.sort.not_money", "icons": ["coin", "close"]},
]
const ITEMS: Array = [
	{"id": "coin", "label": "cc.item.coin", "icons": ["coin"], "bucket": "money"},
	{"id": "note", "label": "cc.item.note", "icons": ["note"], "bucket": "money"},
	{"id": "card", "label": "cc.item.card", "icons": ["card"], "bucket": "money"},
	{"id": "leaf", "label": "cc.item.leaf", "icons": ["leaf"], "bucket": "not_money"},
	{"id": "rock", "label": "cc.item.rock", "icons": ["rock"], "bucket": "not_money"},
	{"id": "apple", "label": "cc.item.apple", "icons": ["item:apple"], "bucket": "not_money"},
]


func _init() -> void:
	prompt_key = "interaction.try_prompt"


func _build_visual() -> Node3D:
	var n := Node3D.new()
	var m := MeshMerger.new()
	DecorProps.coin_counting_table(m, Transform3D.IDENTITY)
	m.origin = Transform3D.IDENTITY
	m.commit_to(n, "Table", true)
	var body := StaticBody3D.new()
	body.collision_layer = 1
	body.collision_mask = 0
	n.add_child(body)
	DecorKit.add_box_collider(body, Vector3(1.8, 1.0, 1.0), DecorKit.xf(Vector3(0, 0.5, 0)))
	return n


static func done() -> bool:
	return ProgressManager.is_activity_completed(ACTIVITY)


## Runs the sort; records the activity (and a little XP) the first time.
func play() -> void:
	var buckets: Array[SortBucketData] = []
	for b in BUCKETS:
		var d := SortBucketData.new()
		d.bucket_key = b["key"]
		d.label_key = b["label"]
		d.icon_tokens.assign(b["icons"])
		buckets.append(d)
	var items: Array[SortItemData] = []
	for it in ITEMS:
		var d := SortItemData.new()
		d.item_id = it["id"]
		d.text_key = it["label"]
		d.correct_bucket_key = it["bucket"]
		d.icon_tokens.assign(it["icons"])
		items.append(d)
	await SortPanel.show_sort(buckets, items, "cc.sort.instructions")
	if not done():
		GameState.add_xp(XP)
		ProgressManager.complete_activity(ACTIVITY)
	Feedback.success(self, ["coin", "note", "card"], "cc.sort.done")
