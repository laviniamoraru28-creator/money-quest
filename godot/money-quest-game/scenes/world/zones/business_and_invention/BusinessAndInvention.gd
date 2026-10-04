extends Node3D
## BusinessAndInvention — Museum Room 8: one real, well-documented
## "idea evolution" exhibit (project brief Section 18) plus 8 small,
## purely decorative signs visualizing the Problem -> Idea -> Product ->
## Customer -> Price -> Sale -> Feedback -> Improvement chain the brief
## describes. The chain signs are generic process labels, not a
## historical claim, so they need no source of their own; the exhibit
## itself does. Connects to Entrepreneur Quest.

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController

@onready var _chain_labels: Array[Label3D] = [
	$ChainSigns/Sign1, $ChainSigns/Sign2, $ChainSigns/Sign3,
	$ChainSigns/Sign4, $ChainSigns/Sign5, $ChainSigns/Sign6,
	$ChainSigns/Sign7, $ChainSigns/Sign8,
]
const CHAIN_KEYS: Array[String] = [
	"museum.business_and_invention.chain.problem",
	"museum.business_and_invention.chain.idea",
	"museum.business_and_invention.chain.product",
	"museum.business_and_invention.chain.customer",
	"museum.business_and_invention.chain.price",
	"museum.business_and_invention.chain.sale",
	"museum.business_and_invention.chain.feedback",
	"museum.business_and_invention.chain.improvement",
]


func _ready() -> void:
	camera_controller.target = player
	for i in CHAIN_KEYS.size():
		_chain_labels[i].text = Localization.t(CHAIN_KEYS[i])
