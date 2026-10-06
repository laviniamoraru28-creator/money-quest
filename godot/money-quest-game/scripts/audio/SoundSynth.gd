class_name SoundSynth
extends RefCounted
## SoundSynth — Money Quest World's placeholder sound set, generated in code
## (no downloaded or recorded files, so no licences): soft UI ticks, coin
## chimes, a success arpeggio, a quest fanfare, a portal whoosh, footsteps,
## a gentle music loop and zone ambiences. Everything is short, soft and
## rounded — never harsh, never startling; a "try again" is two gentle
## notes, not a buzzer.
##
## Every sound is an AudioStreamWAV built once and cached. Real recorded
## assets can replace any of them later by key (AudioManager.override_sound)
## without touching gameplay code.

const RATE: int = 22050

static var _cache: Dictionary = {}

## Sound effects, by key: a list of [frequency_start, frequency_end,
## start_time, duration, volume, kind] notes ("tone" | "bell" | "noise").
const SFX: Dictionary = {
	"ui_click": [[1046.5, 1046.5, 0.0, 0.06, 0.35, "tone"]],
	"ui_move": [[784.0, 784.0, 0.0, 0.035, 0.18, "tone"]],
	"ui_back": [[660.0, 440.0, 0.0, 0.1, 0.3, "tone"]],
	"ui_open": [[523.3, 523.3, 0.0, 0.07, 0.3, "tone"], [784.0, 784.0, 0.06, 0.1, 0.3, "tone"]],
	"talk": [[440.0, 520.0, 0.0, 0.09, 0.32, "tone"], [660.0, 700.0, 0.08, 0.12, 0.28, "tone"]],
	"coin": [[987.8, 987.8, 0.0, 0.08, 0.38, "bell"], [1318.5, 1318.5, 0.07, 0.45, 0.42, "bell"]],
	"jar": [[1568.0, 1568.0, 0.0, 0.25, 0.3, "bell"], [1318.5, 1318.5, 0.14, 0.25, 0.3, "bell"], [1174.7, 1174.7, 0.28, 0.25, 0.3, "bell"], [1568.0, 1568.0, 0.42, 0.6, 0.32, "bell"]],
	"success": [[523.3, 523.3, 0.0, 0.14, 0.32, "bell"], [659.3, 659.3, 0.11, 0.14, 0.32, "bell"], [784.0, 784.0, 0.22, 0.5, 0.36, "bell"]],
	"fanfare": [[523.3, 523.3, 0.0, 0.16, 0.3, "bell"], [659.3, 659.3, 0.14, 0.16, 0.3, "bell"], [784.0, 784.0, 0.28, 0.16, 0.3, "bell"], [1046.5, 1046.5, 0.42, 1.1, 0.34, "bell"], [659.3, 659.3, 0.42, 1.1, 0.2, "bell"], [784.0, 784.0, 0.42, 1.1, 0.2, "bell"]],
	"xp": [[880.0, 1320.0, 0.0, 0.14, 0.26, "tone"]],
	"level_up": [[523.3, 523.3, 0.0, 0.1, 0.3, "bell"], [784.0, 784.0, 0.08, 0.1, 0.3, "bell"], [1046.5, 1046.5, 0.16, 0.1, 0.3, "bell"], [1568.0, 1568.0, 0.24, 0.7, 0.32, "bell"]],
	"portal": [[300.0, 900.0, 0.0, 0.7, 0.22, "tone"], [0.0, 0.0, 0.0, 0.7, 0.16, "noise"]],
	"hint": [[1568.0, 1568.0, 0.0, 0.6, 0.22, "bell"], [2093.0, 2093.0, 0.12, 0.6, 0.18, "bell"]],
	"retry": [[523.3, 523.3, 0.0, 0.14, 0.26, "tone"], [440.0, 440.0, 0.13, 0.22, 0.26, "tone"]],
	"respawn": [[300.0, 640.0, 0.0, 0.4, 0.3, "tone"], [1318.5, 1318.5, 0.32, 0.45, 0.2, "bell"]],
	"step_a": [[0.0, 0.0, 0.0, 0.07, 0.2, "noise"], [110.0, 90.0, 0.0, 0.05, 0.12, "tone"]],
	"step_b": [[0.0, 0.0, 0.0, 0.06, 0.18, "noise"], [130.0, 100.0, 0.0, 0.05, 0.12, "tone"]],
}


static func get_sfx(key: String) -> AudioStreamWAV:
	if _cache.has(key):
		return _cache[key]
	if not SFX.has(key):
		return null
	var notes: Array = SFX[key]
	var length: float = 0.0
	for n in notes:
		length = maxf(length, n[2] + n[3])
	var buf := PackedFloat32Array()
	buf.resize(int((length + 0.02) * RATE))
	var rng := RandomNumberGenerator.new()
	rng.seed = key.hash()
	for n in notes:
		_note(buf, n[0], n[1], n[2], n[3], n[4], n[5], rng)
	var s := _to_wav(buf, false)
	_cache[key] = s
	return s


static func _note(buf: PackedFloat32Array, f0: float, f1: float, start: float, dur: float, vol: float, kind: String, rng: RandomNumberGenerator) -> void:
	var i0: int = int(start * RATE)
	var n: int = int(dur * RATE)
	var phase: float = 0.0
	var lp: float = 0.0
	for i in n:
		var idx: int = i0 + i
		if idx >= buf.size():
			break
		var t: float = float(i) / RATE
		var u: float = float(i) / n
		var f: float = lerpf(f0, f1, u)
		phase += TAU * f / RATE
		# Soft attack (no clicks), then a smooth decay.
		var env: float = minf(1.0, t / 0.006)
		var v: float
		match kind:
			"bell":
				env *= exp(-t * 5.5)
				v = sin(phase) + 0.25 * sin(phase * 2.0) + 0.08 * sin(phase * 3.0)
			"noise":
				env *= exp(-t * 30.0)
				lp += (rng.randf_range(-1.0, 1.0) - lp) * 0.18   # low-passed: a soft "thud", not hiss
				v = lp * 2.2
			_:
				env *= 1.0 - smoothstep(0.55, 1.0, u)
				v = sin(phase) + 0.12 * sin(phase * 2.0)
		buf[idx] += v * env * vol




# --- loops (music and ambience) ------------------------------------------------
# Loops are seconds long, so they are built a slice at a time on the main
# thread (AudioManager steps a Build each frame until it is done) — never
# on a worker thread, and never as one long hitch.

## A gentle 4-bar music loop (C – Am – F – G at 90 bpm): a soft pad and a
## marimba-like pentatonic melody. Seamless when looped.
static func music_build() -> Build:
	var beat: float = 60.0 / 90.0
	var b := Build.new(beat * 16.0)
	var chords: Array = [[261.6, 329.6, 392.0], [220.0, 261.6, 329.6], [174.6, 220.0, 261.6], [196.0, 246.9, 293.7]]
	for bar in 4:
		for f in chords[bar]:
			b.jobs.append(["pad", f * 0.5, bar * 4.0 * beat, 4.0 * beat, 0.05])
		b.jobs.append(["pad", chords[bar][0] * 0.25, bar * 4.0 * beat, 4.0 * beat, 0.06])
	var notes: Array = [523.3, 587.3, 659.3, 784.0, 880.0, 1046.5]
	var rng := RandomNumberGenerator.new()
	rng.seed = 7
	var step: int = 2
	for i in 32:
		if rng.randf() < 0.28:
			continue   # rests make it breathe
		step = clampi(step + rng.randi_range(-2, 2), 0, notes.size() - 1)
		b.jobs.append(["pluck", notes[step], i * beat * 0.5, 0.9, 0.11])
	return b


## A seamless ambience loop: "vault" (a warm, low hum with a faint
## shimmer) or "outdoor" (a soft airy bed with occasional birds).
static func ambience_build(kind: String) -> Build:
	var b := Build.new(8.0)
	match kind:
		"vault":
			# Integer cycles per 8 s, so the loop point is seamless.
			for f in [55.0, 82.5, 110.0, 165.0]:
				b.jobs.append(["hum", f, 0.0, 8.0, 0.035])
			for k in 4:
				b.jobs.append(["pluck", 2093.0 + k * 196.0, 0.9 + k * 2.0, 1.4, 0.025])
		_:
			for f in [196.0, 293.7]:
				b.jobs.append(["hum", f, 0.0, 8.0, 0.012])
			var rng := RandomNumberGenerator.new()
			rng.seed = 11
			for k in 5:
				var t0: float = 0.6 + k * 1.5 + rng.randf() * 0.5
				for c in 2:
					b.jobs.append(["chirp", 2600.0 + rng.randf() * 900.0, t0 + c * 0.13, 0.09, 0.05])
	return b


class Build:
	var buf := PackedFloat32Array()
	var jobs: Array = []      # [kind, frequency, start, duration, volume]
	var stream: AudioStreamWAV
	var _job: int = 0
	var _pos: int = 0
	var _bytes := PackedByteArray()
	var _gain: float = 1.0
	var _encoded: int = -1    # -1 = still rendering notes

	func _init(seconds: float) -> void:
		buf.resize(int(seconds * SoundSynth.RATE))

	## Does about `budget` samples of work; returns true once `stream` is ready.
	func step(budget: int) -> bool:
		while budget > 0 and _job < jobs.size():
			var j: Array = jobs[_job]
			var n: int = int(float(j[3]) * SoundSynth.RATE)
			var count: int = mini(budget, n - _pos)
			SoundSynth._render(buf, j, _pos, _pos + count)
			_pos += count
			budget -= count
			if _pos >= n:
				_job += 1
				_pos = 0
		if _job < jobs.size():
			return false
		if _encoded == -1:
			var peak: float = 0.0
			for v in buf:
				peak = maxf(peak, absf(v))
			_gain = 0.9 / peak if peak > 0.9 else 1.0
			_bytes.resize(buf.size() * 2)
			_encoded = 0
			return false
		var end: int = mini(_encoded + budget * 4, buf.size())
		for i in range(_encoded, end):
			_bytes.encode_s16(i * 2, int(clampf(buf[i] * _gain, -1.0, 1.0) * 32767.0))
		_encoded = end
		if _encoded < buf.size():
			return false
		stream = SoundSynth._wav_from_bytes(_bytes, buf.size(), true)
		return true


## Renders samples [from, to) of one loop job into `buf` (positions wrap,
## so a note crossing the loop point continues at the start).
static func _render(buf: PackedFloat32Array, j: Array, from: int, to: int) -> void:
	var kind: String = j[0]
	var f: float = j[1]
	var i0: int = int(float(j[2]) * RATE)
	var n: int = int(float(j[3]) * RATE)
	var vol: float = j[4]
	var size: int = buf.size()
	for i in range(from, to):
		var t: float = float(i) / RATE
		var u: float = float(i) / n
		var v: float
		match kind:
			"pad":
				var env: float = smoothstep(0.0, 0.15, u) * (1.0 - smoothstep(0.8, 1.0, u))
				v = (sin(TAU * f * t) + 0.3 * sin(TAU * f * 2.0 * t)) * env
			"pluck":
				var env2: float = minf(1.0, t / 0.004) * exp(-t * 6.0)
				v = (sin(TAU * f * t) + 0.35 * sin(TAU * f * 4.0 * t) * exp(-t * 18.0)) * env2
			"hum":
				var tt: float = float(i0 + i) / RATE
				v = sin(TAU * f * tt) * (0.75 + 0.25 * sin(TAU * 0.25 * tt + f))
			_:   # chirp: a short rising bird note
				var ff: float = lerpf(f, f * 1.25, u)
				v = sin(TAU * ff * t) * minf(1.0, t / 0.006) * (1.0 - smoothstep(0.55, 1.0, u))
		buf[(i0 + i) % size] += v * vol


static func _to_wav(buf: PackedFloat32Array, loop: bool) -> AudioStreamWAV:
	var peak: float = 0.0
	for v in buf:
		peak = maxf(peak, absf(v))
	var gain: float = 0.9 / peak if peak > 0.9 else 1.0
	var bytes := PackedByteArray()
	bytes.resize(buf.size() * 2)
	for i in buf.size():
		bytes.encode_s16(i * 2, int(clampf(buf[i] * gain, -1.0, 1.0) * 32767.0))
	return _wav_from_bytes(bytes, buf.size(), loop)


static func _wav_from_bytes(bytes: PackedByteArray, frames: int, loop: bool) -> AudioStreamWAV:
	var s := AudioStreamWAV.new()
	s.format = AudioStreamWAV.FORMAT_16_BITS
	s.mix_rate = RATE
	s.stereo = false
	s.data = bytes
	if loop:
		s.loop_mode = AudioStreamWAV.LOOP_FORWARD
		s.loop_begin = 0
		s.loop_end = frames
	return s
