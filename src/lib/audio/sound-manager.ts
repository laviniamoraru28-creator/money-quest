"use client";

/**
 * Every sound in Money Quest is synthesized here at play-time with the
 * Web Audio API — there are no audio files anywhere in this project.
 * That's a deliberate choice, not a shortcut: it means zero licensing
 * questions about sound assets, a tiny bundle size, and sounds that are
 * trivially easy to redesign (change a few numbers, not re-record or
 * re-source a clip).
 *
 * Every public function here is defensive by construction: browsers
 * without Web Audio support, a blocked AudioContext, or any runtime
 * error inside sound generation is caught and silently ignored. Sound
 * is a nice-to-have layered on top of the app, never a dependency — a
 * child on a browser that can't play these tones gets exactly the same
 * working lessons and games as one who can.
 */

type ToneShape = { frequency: number; startOffsetSeconds: number; durationSeconds: number; peakGain: number };

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!sharedAudioContext) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      sharedAudioContext = new Ctor();
    }
    // Browsers suspend a freshly-created AudioContext until a user
    // gesture resumes it — every call site here is already inside a
    // click/tap handler (answering a question, finishing an activity),
    // so this resume is itself covered by that same gesture.
    if (sharedAudioContext.state === "suspended") {
      void sharedAudioContext.resume().catch(() => {});
    }
    return sharedAudioContext;
  } catch {
    return null;
  }
}

/**
 * Plays a short sequence of tones with a soft attack/decay envelope on
 * each note (never an instant on/off, which is what produces an
 * unpleasant click or buzz) — a sine wave, deliberately, since it's
 * the smoothest, least harsh oscillator shape available, appropriate
 * for a children's product where "not frightening or overwhelming"
 * matters more than a punchy, attention-grabbing tone.
 */
function playTones(tones: ToneShape[]): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    for (const tone of tones) {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = tone.frequency;
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      const start = now + tone.startOffsetSeconds;
      const attackEnd = start + Math.min(0.02, tone.durationSeconds / 4);
      const releaseStart = start + tone.durationSeconds * 0.6;
      const end = start + tone.durationSeconds;

      gainNode.gain.setValueAtTime(0, start);
      gainNode.gain.linearRampToValueAtTime(tone.peakGain, attackEnd);
      gainNode.gain.setValueAtTime(tone.peakGain, releaseStart);
      gainNode.gain.linearRampToValueAtTime(0, end);

      oscillator.start(start);
      oscillator.stop(end + 0.02);
    }
  } catch {
    // A synthesis error (e.g. context closed mid-call) never
    // propagates — see this file's header comment.
  }
}

// Musical note frequencies (Hz), named for readability at each call site.
const NOTE = { C5: 523.25, E5: 659.25, G5: 783.99, A4: 440.0, D4: 293.66 } as const;

/** A bright, brief two-note "ding" — deliberately short (under a
 * third of a second) so it never delays the feedback text it
 * accompanies. */
export function playCorrectSound(): void {
  playTones([
    { frequency: NOTE.C5, startOffsetSeconds: 0, durationSeconds: 0.14, peakGain: 0.12 },
    { frequency: NOTE.E5, startOffsetSeconds: 0.1, durationSeconds: 0.18, peakGain: 0.12 },
  ]);
}

/** A single soft, low tone — quiet and brief on purpose. This is
 * explicitly NOT a buzzer or an alarm: the goal, per the product
 * brief, is a neutral "try again" cue, never a punitive one. */
export function playIncorrectSound(): void {
  playTones([{ frequency: NOTE.D4, startOffsetSeconds: 0, durationSeconds: 0.22, peakGain: 0.08 }]);
}

/** A short three-note ascending arpeggio for finishing a lesson, game,
 * or Simulator scenario — more celebratory than the correct-answer
 * ding, but still under a second total, so it never blocks the child
 * from moving on. */
export function playCompleteSound(): void {
  playTones([
    { frequency: NOTE.C5, startOffsetSeconds: 0, durationSeconds: 0.16, peakGain: 0.11 },
    { frequency: NOTE.E5, startOffsetSeconds: 0.12, durationSeconds: 0.16, peakGain: 0.11 },
    { frequency: NOTE.G5, startOffsetSeconds: 0.24, durationSeconds: 0.28, peakGain: 0.13 },
  ]);
}

/** A brief, quiet confirmation tone — reserved for meaningful
 * milestones only (e.g. reaching a savings goal), not general UI
 * clicks, per the product brief's "don't add sound to every
 * interaction" instruction. */
export function playGoalReachedSound(): void {
  playTones([
    { frequency: NOTE.A4, startOffsetSeconds: 0, durationSeconds: 0.14, peakGain: 0.1 },
    { frequency: NOTE.C5, startOffsetSeconds: 0.1, durationSeconds: 0.14, peakGain: 0.1 },
    { frequency: NOTE.E5, startOffsetSeconds: 0.2, durationSeconds: 0.22, peakGain: 0.12 },
  ]);
}
