extends Node
## AudioManager — the one place that plays sound and touches AudioServer
## (same discipline SaveManager follows for disk I/O).
##
## - Five volume controls: Master plus the Music / SFX / Voice / Ambient
##   buses (default_bus_layout.tres), and one Mute switch (Settings).
## - Sound effects by key (play_sfx) from SoundSynth's generated set; a
##   real recorded file can replace any key later (override_sound) without
##   touching gameplay code. Unknown keys are a silent no-op, never a crash.
## - Music and a zone ambience that follow the current zone (Calm World
##   zones are left quiet for their own dedicated sound design later).
## - UI sounds for every button in the game, attached automatically.
## - Narration (narrate): reads a line aloud with the device's own voice
##   when Settings.narration is on and the platform has a voice for the
##   current language. Audio is never the only way anything is said: every
##   narrated line is also on screen (objective, dialogue, or the subtitle
##   line — `narrated` lets the HUD show it).

signal narrated(text: String)
## A short spoken line that should also appear as a subtitle (SubtitleLine).
signal subtitle_requested(text: String, speaker: String)

## Older content asks for these names; they map onto the generated set.
const ALIASES: Dictionary = {
	"button_tap": "ui_click",
	"correct_choice": "success",
	"incorrect_choice": "retry",
	"lesson_complete": "fanfare",
	"coin_reward": "coin",
}
const POOL_SIZE: int = 6
const MUSIC_DB: float = -9.0
const AMBIENT_DB: float = -4.0

var music_player: AudioStreamPlayer
var sfx_player: AudioStreamPlayer          # kept for compatibility (first pool player)
var voice_player: AudioStreamPlayer
var ambient_player: AudioStreamPlayer

## Recorded files can be dropped in by key: override_sound("coin", stream).
var sfx_library: Dictionary = {}

var _pool: Array[AudioStreamPlayer] = []
var _next: int = 0
var _music_stream: AudioStreamWAV
var _ambience: Dictionary = {}
## Loops still being built: [name, SoundSynth.Build] ("music", "amb:vault"...)
var _builds: Array = []
## Effects still to pre-build (one per frame at start-up, so the first coin
## or click never waits for its sound to be made).
var _sfx_to_warm: Array = []
var _ambient_kind: String = ""
var _want_music: bool = false


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	music_player = _player("Music")
	music_player.volume_db = MUSIC_DB
	voice_player = _player("Voice")
	ambient_player = _player("Ambient")
	ambient_player.volume_db = AMBIENT_DB
	for i in POOL_SIZE:
		_pool.append(_player("SFX"))
	sfx_player = _pool[0]

	_apply_bus_volume("Music", Settings.music_volume)
	_apply_bus_volume("SFX", Settings.sfx_volume)
	_apply_bus_volume("Voice", Settings.voice_volume)
	_apply_bus_volume("Ambient", Settings.ambient_volume)
	_apply_master()
	Settings.music_volume_changed.connect(func(v): _apply_bus_volume("Music", v))
	Settings.sfx_volume_changed.connect(func(v): _apply_bus_volume("SFX", v))
	Settings.voice_volume_changed.connect(func(v): _apply_bus_volume("Voice", v))
	Settings.ambient_volume_changed.connect(func(v): _apply_bus_volume("Ambient", v))
	Settings.changed.connect(_on_setting_changed)
	get_tree().node_added.connect(_on_node_added)
	_connect_world.call_deferred()
	# Loops take a moment to build: a slice per frame (see _process).
	_builds.append(["music", SoundSynth.music_build()])
	_sfx_to_warm = SoundSynth.SFX.keys()


func _player(bus_name: String) -> AudioStreamPlayer:
	var p := AudioStreamPlayer.new()
	p.bus = bus_name
	add_child(p)
	return p


func _connect_world() -> void:
	WorldManager.zone_loaded.connect(_on_zone_loaded)


## value is linear 0.0–1.0 (what the Settings sliders present) — converted
## to dB, with an explicit mute at 0 rather than linear_to_db(0) = -inf.
func _apply_bus_volume(bus_name: String, value: float) -> void:
	var bus_index: int = AudioServer.get_bus_index(bus_name)
	if bus_index == -1:
		return  # bus layout not loaded yet (e.g. in an isolated test run)
	AudioServer.set_bus_mute(bus_index, value <= 0.0)
	if value > 0.0:
		AudioServer.set_bus_volume_db(bus_index, linear_to_db(value))


func _apply_master() -> void:
	var idx: int = AudioServer.get_bus_index("Master")
	AudioServer.set_bus_mute(idx, Settings.sound_muted or Settings.master_volume <= 0.0)
	if Settings.master_volume > 0.0:
		AudioServer.set_bus_volume_db(idx, linear_to_db(Settings.master_volume))


func _on_setting_changed(key: String, _value: Variant) -> void:
	if key == "master_volume" or key == "sound_muted":
		_apply_master()
	elif key == "narration" and not Settings.narration:
		stop_narration()


# --- sound effects ---------------------------------------------------------------

func override_sound(sound_key: String, stream: AudioStream) -> void:
	sfx_library[sound_key] = stream


func has_sfx(sound_key: String) -> bool:
	var key: String = ALIASES.get(sound_key, sound_key)
	return sfx_library.has(key) or SoundSynth.SFX.has(key)


## Plays a sound effect by key on the next free voice of a small pool (so
## a coin chime never cuts off a footstep). `pitch` varies it slightly.
func play_sfx(sound_key: String, pitch: float = 1.0, volume_db: float = 0.0) -> void:
	var key: String = ALIASES.get(sound_key, sound_key)
	var stream: AudioStream = sfx_library.get(key, null)
	if stream == null:
		stream = SoundSynth.get_sfx(key)
	if stream == null:
		return  # unknown key — silent no-op by design
	var p: AudioStreamPlayer = _pool[_next]
	_next = (_next + 1) % _pool.size()
	p.stream = stream
	p.pitch_scale = pitch
	p.volume_db = volume_db
	p.play()


# --- music and ambience ------------------------------------------------------------

## About 3 ms of sound building per frame until every queued loop is ready
## (then this switches itself off). Music fades in once its loop exists.
const BUILD_BUDGET: int = 6000


func _process(_delta: float) -> void:
	if _builds.is_empty():
		if _sfx_to_warm.is_empty():
			set_process(false)
		else:
			SoundSynth.get_sfx(_sfx_to_warm.pop_back())
		return
	var entry: Array = _builds[0]
	if not (entry[1] as SoundSynth.Build).step(BUILD_BUDGET):
		return
	_builds.pop_front()
	var stream: AudioStreamWAV = entry[1].stream
	if entry[0] == "music":
		_music_stream = stream
		if _want_music:
			play_music("explore")
	else:
		var kind: String = String(entry[0]).trim_prefix("amb:")
		_ambience[kind] = stream
		if kind == _ambient_kind:
			ambient_player.stream = stream
			ambient_player.play()


func play_music(_track_key: String = "explore") -> void:
	_want_music = true
	if _music_stream == null or music_player.playing:
		return
	music_player.stream = _music_stream
	music_player.volume_db = -40.0
	music_player.play()
	create_tween().tween_property(music_player, "volume_db", MUSIC_DB, 2.0)


func stop_music() -> void:
	_want_music = false
	music_player.stop()


func play_ambient(kind: String) -> void:
	if kind == _ambient_kind and ambient_player.playing:
		return
	_ambient_kind = kind
	if kind.is_empty():
		ambient_player.stop()
		return
	if not _ambience.has(kind):
		ambient_player.stop()
		for e in _builds:
			if e[0] == "amb:" + kind:
				return   # already being built; starts when ready
		_builds.append(["amb:" + kind, SoundSynth.ambience_build(kind)])
		set_process(true)
		return
	ambient_player.stream = _ambience[kind]
	ambient_player.play()


func stop_ambient() -> void:
	_ambient_kind = ""
	ambient_player.stop()


## Zone soundscape: music everywhere except Calm World (its own sensory
## design comes later), plus a zone ambience where one exists.
func _on_zone_loaded(zone: ZoneData) -> void:
	if zone.kind == ZoneData.ZoneKind.CALM:
		stop_music()
		stop_ambient()
		return
	play_music("explore")
	match zone.zone_id:
		"world-hub":
			play_ambient("outdoor")
		"golden-vault":
			play_ambient("vault")
		_:
			stop_ambient()


# --- UI sounds ------------------------------------------------------------------------

## Every button in the game clicks when pressed; keyboard/gamepad focus
## moves give a very soft tick. Attached once per button as it appears.
func _on_node_added(node: Node) -> void:
	if node is BaseButton and not node.has_meta("mq_sound"):
		node.set_meta("mq_sound", true)
		(node as BaseButton).pressed.connect(func(): play_sfx("ui_click", 1.0, -4.0))
		(node as Control).focus_entered.connect(_on_focus_move)


func _on_focus_move() -> void:
	if not InputHints.is_pointer():
		play_sfx("ui_move", 1.0, -8.0)
		# With read-aloud on, the button the child moves onto is read (question
		# panels read their answers themselves — those are marked mq_read).
		var f: Control = get_viewport().gui_get_focus_owner()
		if f is Button and not f.has_meta("mq_read") and not (f as Button).text.is_empty():
			# (without the control hint after the label: "Continue   Enter" -> "Continue")
			read_focused((f as Button).text.split("   ")[0])


# --- narration ---------------------------------------------------------------------------

## Reads `text` aloud when narration is on and a voice exists for the
## current language; always announces it (narrated) so the HUD can show
## it as a subtitle. Safe to call anywhere — never required for play.
func narrate(text: String) -> void:
	if text.strip_edges().is_empty():
		return
	narrated.emit(text)
	if Settings.narration:
		_speak(text)


## Reads `text` aloud now, because the child asked (the Listen button, or
## L / gamepad X): works even when automatic narration is off; respects
## Mute. The text itself is always already on screen.
func speak_now(text: String) -> void:
	if text.strip_edges().is_empty():
		return
	narrated.emit(text)
	_speak(text)


## Replays whatever is in front of the child right now: the open question
## with its answers, the dialogue line, the reward, the card — or, with
## nothing open, the current mission (see listen_text()).
func replay() -> void:
	speak_now(listen_text())


## The text the Listen control reads: the topmost visible panel with
## something to say. A panel can say exactly what to read (a listen_text()
## method: the question panels, dialogue, rewards, the HUD's mission);
## any other open panel (a card, an input form, Settings) has its visible
## text read in on-screen order.
func listen_text() -> String:
	var best: CanvasLayer = null
	var best_text: String = ""
	for n in get_tree().root.find_children("*", "CanvasLayer", true, false):
		var layer := n as CanvasLayer
		if not layer.visible or layer.is_queued_for_deletion():
			continue
		var text: String = String(layer.listen_text()) if layer.has_method("listen_text") else _visible_text(layer)
		if text.strip_edges().is_empty():
			continue
		if best == null or layer.layer > best.layer:
			best = layer
			best_text = text
	return best_text


## The visible labels and buttons of a panel, top to bottom.
func _visible_text(layer: CanvasLayer) -> String:
	var parts: PackedStringArray = []
	for c in layer.find_children("*", "Control", true, false):
		var ctl := c as Control
		if not ctl.is_visible_in_tree():
			continue
		var t: String = ""
		if ctl is Label:
			t = (ctl as Label).text
		elif ctl is Button:
			t = (ctl as Button).text
		elif ctl is LineEdit:
			t = (ctl as LineEdit).text
		if not t.strip_edges().is_empty():
			parts.append(t.strip_edges())
	return ". ".join(parts)


## Reads one answer as the child moves onto it (keyboard / gamepad focus,
## or the pointer resting on it) — only with automatic narration on.
func read_focused(text: String) -> void:
	if Settings.narration:
		narrate(text)


## A panel just presented a whole question: read it (if narration is on).
## Panels focus their first answer BEFORE calling this, so the whole
## question simply replaces that answer's brief read.
func present(text: String) -> void:
	narrate(text)


## The Listen control (L / gamepad X), anywhere in the game: hear what is
## on screen again.
func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("listen"):
		get_viewport().set_input_as_handled()
		replay()


func _speak(text: String) -> void:
	if Settings.sound_muted:
		return
	var voice: String = _voice_for(Localization.current_locale)
	if voice.is_empty():
		return
	DisplayServer.tts_stop()
	var vol: int = int(clampf(Settings.voice_volume * Settings.master_volume, 0.0, 1.0) * 100.0)
	DisplayServer.tts_speak(text, voice, vol)


func stop_narration() -> void:
	if _tts_supported():
		DisplayServer.tts_stop()


## True when this device can read aloud in the current language.
func can_narrate() -> bool:
	return not _voice_for(Localization.current_locale).is_empty()


func _tts_supported() -> bool:
	return ProjectSettings.get_setting("audio/general/text_to_speech", false) and DisplayServer.has_feature(DisplayServer.FEATURE_TEXT_TO_SPEECH)


func _voice_for(locale: String) -> String:
	if not _tts_supported():
		return ""
	var voices: PackedStringArray = DisplayServer.tts_get_voices_for_language(locale)
	return voices[0] if voices.size() > 0 else ""


## A short line someone says out loud (an NPC calling out, a "Well done!")
## that is not written anywhere else: always shown as a subtitle (when
## subtitles are on), and read aloud too when narration is on.
func say(text: String, speaker: String = "") -> void:
	subtitle_requested.emit(text, speaker)
	narrate(text)


## Older call sites: speak a translation key.
func speak(text_key: String) -> void:
	narrate(Localization.t(text_key))
