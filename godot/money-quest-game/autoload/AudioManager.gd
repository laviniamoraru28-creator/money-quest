extends Node
## AudioManager — architecture hooks for audio, deliberately shipped with
## NO audio assets in this phase (see project brief Phase 11: "the system
## should allow audio assets to be added later," "do not make AI voice
## generation a dependency," "do not require expensive third-party
## services"). Every call here is safe to make even with zero sound files
## present — it just does nothing audible until real assets are dropped
## into an `assets/audio/` folder and wired into the four AudioStreamPlayer
## buses below.
##
## The 4 buses (Music/SFX/Voice/Ambient, see default_bus_layout.tres) each
## have an independent volume controlled from SettingsMenu.tscn via
## Settings.gd's 4 volume fields — this script is the one place that
## actually calls AudioServer, same "one script touches the real system"
## discipline SaveManager follows for disk I/O.

var music_player: AudioStreamPlayer
var sfx_player: AudioStreamPlayer
var voice_player: AudioStreamPlayer
var ambient_player: AudioStreamPlayer

## Named sound-effect slots a lesson/mini-game can request by key, without
## needing to know a file path — the same "content refers to an id, not a
## path" discipline the rest of this project uses. Empty until real audio
## is authored; play_sfx() on a missing key is a silent no-op, not an
## error, so content can be built before audio exists.
var sfx_library: Dictionary = {
	# "button_tap": preload("res://assets/audio/sfx/button_tap.ogg"),
	# "correct_choice": preload("res://assets/audio/sfx/correct_choice.ogg"),
	# "incorrect_choice": preload("res://assets/audio/sfx/incorrect_choice.ogg"),
	# "lesson_complete": preload("res://assets/audio/sfx/lesson_complete.ogg"),
	# "coin_reward": preload("res://assets/audio/sfx/coin_reward.ogg"),
}


func _ready() -> void:
	music_player = AudioStreamPlayer.new()
	music_player.bus = "Music"
	add_child(music_player)

	sfx_player = AudioStreamPlayer.new()
	sfx_player.bus = "SFX"
	add_child(sfx_player)

	voice_player = AudioStreamPlayer.new()
	voice_player.bus = "Voice"
	add_child(voice_player)

	ambient_player = AudioStreamPlayer.new()
	ambient_player.bus = "Ambient"
	add_child(ambient_player)

	_apply_bus_volume("Music", Settings.music_volume)
	_apply_bus_volume("SFX", Settings.sfx_volume)
	_apply_bus_volume("Voice", Settings.voice_volume)
	_apply_bus_volume("Ambient", Settings.ambient_volume)
	Settings.music_volume_changed.connect(func(v): _apply_bus_volume("Music", v))
	Settings.sfx_volume_changed.connect(func(v): _apply_bus_volume("SFX", v))
	Settings.voice_volume_changed.connect(func(v): _apply_bus_volume("Voice", v))
	Settings.ambient_volume_changed.connect(func(v): _apply_bus_volume("Ambient", v))


## value is linear 0.0–1.0 (what SettingsMenu.tscn's HSliders present) —
## converted to dB for AudioServer, with an explicit mute at 0 rather than
## relying on linear_to_db(0) (which is -inf, not a clean mute).
func _apply_bus_volume(bus_name: String, value: float) -> void:
	var bus_index: int = AudioServer.get_bus_index(bus_name)
	if bus_index == -1:
		return  # bus layout not loaded yet (e.g. in an isolated test run)
	AudioServer.set_bus_mute(bus_index, value <= 0.0)
	if value > 0.0:
		AudioServer.set_bus_volume_db(bus_index, linear_to_db(value))


func play_music(_track_key: String) -> void:
	if music_player.stream == null:
		return  # no music assets yet — silent no-op by design
	music_player.play()


func stop_music() -> void:
	music_player.stop()


func play_sfx(sound_key: String) -> void:
	if not sfx_library.has(sound_key):
		return  # unknown or not-yet-authored sound — silent no-op, never a crash
	sfx_player.stream = sfx_library[sound_key]
	sfx_player.play()


func play_ambient(_track_key: String) -> void:
	if ambient_player.stream == null:
		return  # no ambient assets yet — silent no-op by design
	ambient_player.play()


func stop_ambient() -> void:
	ambient_player.stop()


## Architecture hook only — there is no text-to-speech engine wired into
## this project (project brief: "do not make AI voice generation a
## dependency," "do not require expensive third-party services"), so this
## is a documented no-op, not a real read-aloud feature. Deliberately NOT
## exposed as a Settings toggle: unlike the 4 volume sliders (which
## genuinely move a real AudioServer bus, just inaudibly until assets
## exist), there is nothing real behind this call yet, and this project's
## own discipline (see the Library's honestly-empty shelves) is to never
## offer a control for something that doesn't actually do anything.
func speak(_text_key: String) -> void:
	pass
