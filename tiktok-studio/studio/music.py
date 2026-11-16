"""Original background music, generated procedurally.

Every track is synthesised from scratch with numpy (no samples, no loops
from third parties), so the result is an original work owned by whoever
runs this code: no licence, attribution or commercial-use question arises.
The seed (topic id) gives each video a slightly different key, tempo and
arpeggio pattern while keeping a consistent, calm, friendly brand sound.
"""
from __future__ import annotations

import hashlib
import wave
from pathlib import Path

import numpy as np

SR = 44100

# Gentle, positive progressions (semitone offsets of chord roots from the key).
PROGRESSIONS = [
    [0, 7, 9, 5],   # I  V  vi IV
    [0, 5, 9, 7],   # I  IV vi V
    [0, 9, 5, 7],   # I  vi IV V
]
MAJOR = [0, 4, 7]
MINOR = [0, 3, 7]
KEYS = [60, 62, 65, 67]  # C, D, F, G (MIDI)


def _midi_hz(n: float) -> float:
    return 440.0 * 2 ** ((n - 69) / 12)


def _env(n: int, attack: float, release: float) -> np.ndarray:
    a = max(1, min(n // 2, int(attack * SR)))
    r = max(1, min(n - a, int(release * SR)))
    e = np.ones(n)
    e[:a] = np.linspace(0, 1, a)
    e[-r:] *= np.linspace(1, 0, r)
    return e


def _tone(freq: float, n: int, harmonics=(1.0, 0.35, 0.12), detune=0.0) -> np.ndarray:
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k, amp in enumerate(harmonics, start=1):
        out += amp * np.sin(2 * np.pi * freq * k * (1 + detune) * t)
    return out


def generate(seconds: float, seed: str, path: Path, gain: float = 1.0) -> Path:
    h = int(hashlib.sha256(seed.encode()).hexdigest(), 16)
    rng = np.random.default_rng(h % (2**32))
    key = KEYS[h % len(KEYS)]
    prog = PROGRESSIONS[(h >> 4) % len(PROGRESSIONS)]
    bpm = 96 + (h >> 8) % 13  # 96-108
    beat = 60.0 / bpm
    bar = beat * 4
    total = int(seconds * SR)
    left = np.zeros(total)
    right = np.zeros(total)

    arp_patterns = [[0, 1, 2, 1], [0, 2, 1, 2], [0, 1, 2, 3]]
    arp = arp_patterns[(h >> 12) % len(arp_patterns)]

    n_bars = int(np.ceil(seconds / bar))
    for b in range(n_bars):
        root_off = prog[b % len(prog)]
        quality = MINOR if root_off == 9 else MAJOR
        root = key + root_off
        start = int(b * bar * SR)
        if start >= total:
            break
        length = min(int(bar * SR), total - start)

        # Warm pad: chord tones, slow attack, slight stereo detune.
        for iv in quality:
            f = _midi_hz(root + iv - 12)
            env = _env(length, 0.35, 0.4)
            left[start:start + length] += 0.06 * env * _tone(f, length, detune=-0.0015)
            right[start:start + length] += 0.06 * env * _tone(f, length, detune=0.0015)

        # Soft bass on beats 1 and 3.
        for bt in (0, 2):
            s = start + int(bt * beat * SR)
            n = min(int(beat * 1.6 * SR), total - s)
            if n <= 0:
                continue
            f = _midi_hz(root - 24)
            env = np.exp(-np.arange(n) / (SR * 0.35)) * _env(n, 0.01, 0.05)
            sig = 0.16 * env * _tone(f, n, harmonics=(1.0, 0.2))
            left[s:s + n] += sig
            right[s:s + n] += sig

        # Plucked arpeggio in eighth notes.
        notes = quality + [12]
        for step in range(8):
            s = start + int(step * beat / 2 * SR)
            n = min(int(beat * 0.9 * SR), total - s)
            if n <= 0:
                continue
            idx = arp[step % len(arp)]
            f = _midi_hz(root + notes[idx] + 12)
            env = np.exp(-np.arange(n) / (SR * 0.18)) * _env(n, 0.004, 0.05)
            sig = 0.07 * env * _tone(f, n, harmonics=(1.0, 0.25, 0.05))
            pan = 0.35 if step % 2 else -0.35
            left[s:s + n] += sig * (1 - pan) / 1.4
            right[s:s + n] += sig * (1 + pan) / 1.4

        # Very light shaker on off-beats (filtered noise).
        for step in range(4):
            s = start + int((step + 0.5) * beat * SR)
            n = min(int(0.06 * SR), total - s)
            if n <= 0:
                continue
            noise = rng.standard_normal(n)
            noise = noise - np.convolve(noise, np.ones(6) / 6, mode="same")  # crude high-pass
            env = np.exp(-np.arange(n) / (SR * 0.02))
            left[s:s + n] += 0.012 * env * noise
            right[s:s + n] += 0.012 * env * noise

    # Gentle fade in/out.
    fade_in = int(0.25 * SR)
    fade_out = int(1.4 * SR)
    for ch in (left, right):
        ch[:fade_in] *= np.linspace(0, 1, fade_in)
        ch[-fade_out:] *= np.linspace(1, 0, fade_out)

    stereo = np.stack([left, right], axis=1)
    peak = np.max(np.abs(stereo)) or 1.0
    stereo = stereo / peak * 0.45 * gain  # leaves headroom; sits under optional narration
    pcm = (stereo * 32767).astype(np.int16)
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    return path
