extends Node3D
## CreateYourOwnGarden — Calm World's 8th space (project brief Section
## 11): a simple, personal garden the child builds from independent
## category choices, never a full city-builder. Every option is purely
## decorative; there is no "correct" combination — the same sensory-
## choice principle (Section 12) that governs the rest of Calm World
## applies here too. Reuses the existing `CategoryPickerPanel` autoload
## (already built for Entrepreneur Quest's BUILD stepper) for the
## picking flow, and the existing ProgressManager/SaveManager pipeline
## for persistence — no new UI system, no new save file.
##
## Reachable from Bubble Garden with no unlock condition, same as every
## other Calm World space.

const BACKGROUND_IDS: Array[String] = ["meadow", "night_sky", "desert", "underwater_blue"]
const WATER_IDS: Array[String] = ["pond", "stream", "none"]
const PLANTS_IDS: Array[String] = ["flowers", "tall_grass", "none"]
const LIGHT_IDS: Array[String] = ["lanterns", "fireflies", "none"]
const BUBBLES_IDS: Array[String] = ["bubbles", "none"]
const STONES_IDS: Array[String] = ["stones", "none"]
const CREATURE_IDS: Array[String] = ["fish", "butterflies", "none"]

const LABEL_PREFIX: String = "zone.create_your_own_garden.option"

const BACKGROUND_COLORS: Dictionary = {
	"meadow": Color(0.78, 0.88, 0.62, 1),
	"night_sky": Color(0.18, 0.2, 0.38, 1),
	"desert": Color(0.9, 0.82, 0.6, 1),
	"underwater_blue": Color(0.45, 0.68, 0.85, 1),
}

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var palette: GardenPaletteInteraction = $GardenPalette
@onready var _ground_mesh: MeshInstance3D = $Ground/MeshInstance3D

@onready var _water_pond: Node3D = $Decor/WaterPond
@onready var _water_stream: Node3D = $Decor/WaterStream
@onready var _plants_flowers: Node3D = $Decor/PlantsFlowers
@onready var _plants_tall_grass: Node3D = $Decor/PlantsTallGrass
@onready var _light_lanterns: Node3D = $Decor/LightLanterns
@onready var _light_fireflies: Node3D = $Decor/LightFireflies
@onready var _bubbles: Node3D = $Decor/Bubbles
@onready var _stones: Node3D = $Decor/Stones
@onready var _creature_fish: Node3D = $Decor/CreatureFish
@onready var _creature_butterflies: Node3D = $Decor/CreatureButterflies

var _time: float = 0.0

var _bubble_base_heights: Array[float] = []
var _fish_centers: Array[Vector3] = []
var _butterfly_base_heights: Array[float] = []
var _firefly_base_heights: Array[float] = []


func _ready() -> void:
	camera_controller.target = player
	palette.palette_interacted.connect(_on_palette_interacted)
	for child in _bubbles.get_children():
		_bubble_base_heights.append(child.position.y)
	for child in _creature_fish.get_children():
		_fish_centers.append(Vector3(child.position.x, 0.0, child.position.z))
	for child in _creature_butterflies.get_children():
		_butterfly_base_heights.append(child.position.y)
	for child in _light_fireflies.get_children():
		_firefly_base_heights.append(child.position.y)
	_apply_config()


## Respects reduced_motion exactly like every other Calm World space —
## every group simply holds its authored position/scale instead of
## animating when it's on. Only currently-visible groups are animated,
## the same "no wasted work on something nobody can see" discipline the
## rest of this project's performance budget already follows.
func _process(delta: float) -> void:
	if Settings.reduced_motion:
		return
	_time += delta
	if _bubbles.visible:
		for i in range(_bubbles.get_child_count()):
			var b: Node3D = _bubbles.get_child(i)
			b.position.y = _bubble_base_heights[i] + sin(_time * 0.6 + i * 1.3) * 0.3
	if _creature_fish.visible:
		for i in range(_creature_fish.get_child_count()):
			var f: Node3D = _creature_fish.get_child(i)
			var angle: float = _time * 0.3 + i * 2.0
			var c: Vector3 = _fish_centers[i]
			f.position = Vector3(c.x + cos(angle) * 1.1, f.position.y, c.z + sin(angle) * 1.1)
	if _creature_butterflies.visible:
		for i in range(_creature_butterflies.get_child_count()):
			var bf: Node3D = _creature_butterflies.get_child(i)
			bf.position.y = _butterfly_base_heights[i] + sin(_time * 0.7 + i * 1.6) * 0.3
	if _light_fireflies.visible:
		for i in range(_light_fireflies.get_child_count()):
			var ff: Node3D = _light_fireflies.get_child(i)
			ff.position.y = _firefly_base_heights[i] + sin(_time * 0.5 + i * 1.8) * 0.25
	if _light_lanterns.visible:
		for i in range(_light_lanterns.get_child_count()):
			var l: Node3D = _light_lanterns.get_child(i)
			l.scale = Vector3.ONE * (1.0 + sin(_time * 0.5 + i * 1.4) * 0.12)


func _on_palette_interacted() -> void:
	var config: CalmGardenConfig = ProgressManager.calm_garden_config
	config.background_id = await _pick("background", BACKGROUND_IDS, config.background_id)
	config.water_id = await _pick("water", WATER_IDS, config.water_id)
	config.plants_id = await _pick("plants", PLANTS_IDS, config.plants_id)
	config.light_id = await _pick("light", LIGHT_IDS, config.light_id)
	config.bubbles_id = await _pick("bubbles", BUBBLES_IDS, config.bubbles_id)
	config.stones_id = await _pick("stones", STONES_IDS, config.stones_id)
	config.creature_id = await _pick("creature", CREATURE_IDS, config.creature_id)
	SaveManager.save_progress()
	_apply_config()
	await DialogueBox.show_text("zone.create_your_own_garden.saved_message")


func _pick(category_key: String, ids: Array[String], initial: String) -> String:
	var result: Dictionary = await CategoryPickerPanel.show_category_picker(
		"zone.create_your_own_garden.instructions.%s" % category_key,
		ids, LABEL_PREFIX, false, "", "", initial, ""
	)
	return result["category"]


func _apply_config() -> void:
	var config: CalmGardenConfig = ProgressManager.calm_garden_config
	var mat := StandardMaterial3D.new()
	mat.albedo_color = BACKGROUND_COLORS.get(config.background_id, BACKGROUND_COLORS["meadow"])
	_ground_mesh.set_surface_override_material(0, mat)

	_water_pond.visible = config.water_id == "pond"
	_water_stream.visible = config.water_id == "stream"
	_plants_flowers.visible = config.plants_id == "flowers"
	_plants_tall_grass.visible = config.plants_id == "tall_grass"
	_light_lanterns.visible = config.light_id == "lanterns"
	_light_fireflies.visible = config.light_id == "fireflies"
	_bubbles.visible = config.bubbles_id == "bubbles"
	_stones.visible = config.stones_id == "stones"
	_creature_fish.visible = config.creature_id == "fish"
	_creature_butterflies.visible = config.creature_id == "butterflies"
