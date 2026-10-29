/** Original browser-generated ambience. No recordings, trackers or remote requests. */
import {QUIET_MUSIC_SECONDS, scheduleQuietMusic} from "./quiet-music";
export type QuietSound = "rain" | "notes";
type RepeatScheduler = (tick: () => void) => () => void;
const repeatEverySecond: RepeatScheduler = tick => {
  const timer = setInterval(tick, 1000);
  return () => clearInterval(timer);
};
export class QuietAudio {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private generation = 0;
  private volume = 20;
  private cancelRepeat: (() => void) | null = null;
  constructor(private createContext: () => AudioContext = () => new AudioContext(), private repeat: RepeatScheduler = repeatEverySecond) {}
  stop() {
    ++this.generation;
    this.cancelRepeat?.();
    this.cancelRepeat = null;
    const context = this.context;
    this.context = null;
    this.gain = null;
    if (context) { try { void context.close().catch(() => {}); } catch {} }
  }
  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(100, value));
    if (!this.context || !this.gain) return;
    this.gain.gain.setTargetAtTime(this.volume / 100 * 0.08, this.context.currentTime, 0.12);
  }
  async start(sound: QuietSound, volume: number): Promise<boolean> {
    this.stop();
    this.setVolume(volume);
    const generation = this.generation;
    try {
      const context = this.createContext();
      this.context = context;
      await context.resume();
      if (generation !== this.generation) return false;
      if (context.state !== "running") { this.stop(); return false; }
      const gain = context.createGain();
      gain.gain.value = 0;
      gain.connect(context.destination);
      this.gain = gain;
      if (sound === "rain") {
        const buffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
        const source = context.createBufferSource();
        const filter = context.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 1200;
        source.buffer = buffer;
        source.loop = true;
        source.connect(filter);
        filter.connect(gain);
        source.start();
      } else {
        let nextCycle = context.currentTime + 0.1;
        scheduleQuietMusic(context, gain, nextCycle);
        nextCycle += QUIET_MUSIC_SECONDS;
        this.cancelRepeat = this.repeat(() => {
          if (generation !== this.generation || context.state !== "running" || nextCycle > context.currentTime + 1.5) return;
          try {
            // After a delayed timer, skip the gap instead of playing missed notes in a burst.
            nextCycle = Math.max(nextCycle, context.currentTime + 0.1);
            scheduleQuietMusic(context, gain, nextCycle);
            nextCycle += QUIET_MUSIC_SECONDS;
          } catch {this.stop();}
        });
      }
      this.setVolume(this.volume);
      return true;
    } catch {
      if (generation === this.generation) this.stop();
      return false;
    }
  }
}
