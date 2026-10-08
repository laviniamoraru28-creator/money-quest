class_name DoorMarker
extends Sprite3D
## DoorMarker — over every door inside the world (not the Hub's, which have
## their big DestinationSigns): WHERE it goes and WHICH WAY, without words.
##   ← [emblem]   BACK: the room before this one (or the Hub)
##   [emblem] →   FORWARD: on, further along
## The same NavArrow and DestinationIcon pictures as the HUD's entry card,
## drawn once per door kind into a small texture (cached) and shown as a
## billboard (2.2 m wide) that always faces the camera. Nothing moves (Reduced Motion
## needs nothing extra). Added by PortalInteraction itself — no per-zone code.

const PX: int = 128
static var _cache: Dictionary = {}     # "role|zone" -> Texture2D
static var _pending: Dictionary = {}   # "role|zone" -> Array[DoorMarker]

var zone_id: String = ""
var role: String = "forward"


static func make(p_zone_id: String, p_role: String) -> DoorMarker:
	var m := DoorMarker.new()
	m.name = "DoorMarker"
	m.zone_id = p_zone_id
	m.role = p_role
	return m


func _ready() -> void:
	billboard = BaseMaterial3D.BILLBOARD_ENABLED
	no_depth_test = false
	shaded = false
	pixel_size = 2.2 / float(PX * 2)   # 2.2 m wide: readable from across a room
	var key: String = role + "|" + zone_id
	if _cache.has(key):
		texture = _cache[key]
		return
	visible = false
	if _pending.has(key):
		_pending[key].append(self)
		return
	_pending[key] = [self]
	_render(key, zone_id, role)


static func _render(key: String, p_zone: String, p_role: String) -> void:
	var tree := Engine.get_main_loop() as SceneTree
	var vp := SubViewport.new()
	vp.size = Vector2i(PX * 2, PX)
	vp.transparent_bg = true
	vp.render_target_update_mode = SubViewport.UPDATE_ONCE
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 0)
	row.size = Vector2(PX * 2, PX)
	var icon := DestinationIcon.new()
	icon.icon = Destinations.icon(p_zone)
	icon.accent = Destinations.accent(p_zone)
	icon.custom_minimum_size = Vector2(PX, PX)
	var arrow := NavArrow.new(p_role, PX)
	if p_role == "back":
		row.add_child(arrow)
		row.add_child(icon)
	else:
		row.add_child(icon)
		row.add_child(arrow)
	vp.add_child(row)
	tree.root.add_child(vp)
	await RenderingServer.frame_post_draw
	await RenderingServer.frame_post_draw
	var img: Image = vp.get_texture().get_image() if vp.get_texture() else null
	vp.queue_free()
	var tex: Texture2D = ImageTexture.create_from_image(img) if img and not img.is_empty() else null
	if tex:
		_cache[key] = tex
	for m in _pending.get(key, []):
		if is_instance_valid(m):
			m.texture = tex
			m.visible = tex != null
	_pending.erase(key)
