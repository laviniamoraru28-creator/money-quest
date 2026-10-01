extends Node
## AudioManager — architecture hooks for audio, deliberately shipped with
## NO audio assets in this phase (see project brief Phase 11: "the system
## should allow audio assets to be added later," "do not make AI voice
## generation a dependency," "do not require expensive third-party
## services"). Every call here is safe to make even with zero sound files
## present — it just does nothing audible until real assets are dropped
## into an `assets/audio/` folder and wired into the two AudioStreamPlayer
## buses below.

var music_player: AudioStreamPlayer
var sfx_player: AudioStreamPlayer

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
