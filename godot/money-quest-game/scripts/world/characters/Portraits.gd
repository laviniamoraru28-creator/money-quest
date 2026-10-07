class_name Portraits
extends RefCounted
## Portraits — a head-and-shoulders picture of a character for the dialogue
## box, rendered once from the character itself (same CharacterLook as in
## the world, so it always matches) in a small off-screen viewport, then
## kept as a plain texture. One render per character per session; the
## viewport is freed straight after. Returns null until the picture exists
## (the box shows its round frame meanwhile) and calls back when ready.

const SIZE: int = 256

static var _cache: Dictionary = {}       # npc_id -> Texture2D
static var _pending: Dictionary = {}     # npc_id -> Array[Callable]


static func get_portrait(npc_id: String, on_ready: Callable = Callable()) -> Texture2D:
	if npc_id.is_empty():
		return null
	if _cache.has(npc_id):
		return _cache[npc_id]
	if _pending.has(npc_id):
		if on_ready.is_valid():
			_pending[npc_id].append(on_ready)
		return null
	_pending[npc_id] = [on_ready] if on_ready.is_valid() else []
	_render(npc_id)
	return null


## The player's own avatar as a picture (visual missions, the intro:
## "this is YOU"). Re-rendered when the look changes (keyed by the look).
static func get_avatar(on_ready: Callable = Callable()) -> Texture2D:
	var look := CharacterLook.from_avatar_config(ProgressManager.avatar_config)
	var key: String = "avatar|" + look.key()
	if _cache.has(key):
		return _cache[key]
	if _pending.has(key):
		if on_ready.is_valid():
			_pending[key].append(on_ready)
		return null
	_pending[key] = [on_ready] if on_ready.is_valid() else []
	_render(key, look)
	return null


static func _render(npc_id: String, look: CharacterLook = null) -> void:
	var tree := Engine.get_main_loop() as SceneTree
	var vp := SubViewport.new()
	vp.size = Vector2i(SIZE, SIZE)
	vp.transparent_bg = true
	vp.own_world_3d = true
	vp.render_target_update_mode = SubViewport.UPDATE_ONCE
	var env := Environment.new()
	env.background_mode = Environment.BG_CLEAR_COLOR
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(1, 0.97, 0.92)
	env.ambient_light_energy = 0.55
	var we := WorldEnvironment.new()
	we.environment = env
	vp.add_child(we)
	var sun := DirectionalLight3D.new()
	sun.rotation = Vector3(deg_to_rad(-30), deg_to_rad(25), 0)
	sun.light_energy = 0.9
	vp.add_child(sun)
	var rig: CharacterRig = CharacterBuilder.build(look if look else CharacterLook.for_npc(npc_id), false)
	rig.process_mode = Node.PROCESS_MODE_DISABLED   # a still, resting pose
	vp.add_child(rig)
	var cam := Camera3D.new()
	cam.fov = 32.0
	vp.add_child(cam)
	tree.root.add_child(vp)
	# Frames hair to shoulders (the head node is the neck pivot).
	var head_pos: Vector3 = rig.head.global_position + Vector3(0, 0.14, 0) if rig.head else Vector3(0, 1.6, 0)
	cam.global_position = head_pos + Vector3(0, 0.04, 1.3)
	cam.look_at(head_pos, Vector3.UP)
	await RenderingServer.frame_post_draw
	await RenderingServer.frame_post_draw
	var tex: Texture2D = null
	var img: Image = vp.get_texture().get_image() if vp.get_texture() else null
	if img and not img.is_empty():
		tex = ImageTexture.create_from_image(img)
	vp.queue_free()
	if tex:
		_cache[npc_id] = tex
	var callbacks: Array = _pending.get(npc_id, [])
	_pending.erase(npc_id)
	for cb in callbacks:
		if (cb as Callable).is_valid():
			(cb as Callable).call(tex)
