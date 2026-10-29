import assert from "node:assert/strict";
import {QuietAudio} from "../src/lib/audio/quiet-audio";
import {quietCopy} from "../src/content/quiet-corner";
import {quietVideoCopy} from "../src/content/quiet-videos";
import {LOCALES} from "../src/i18n/config";
import {QUIET_MUSIC_NOTES, QUIET_MUSIC_SECONDS} from "../src/lib/audio/quiet-music";

async function main() {
  for (const locale of LOCALES) {
    assert.deepEqual(Object.keys(quietCopy[locale]).sort(), Object.keys(quietCopy.en).sort());
    assert(Object.values(quietCopy[locale]).every(text => typeof text === "string" && text.trim().length > 0));
    assert.deepEqual(Object.keys(quietVideoCopy[locale]).sort(),Object.keys(quietVideoCopy.en).sort());
    assert(Object.values(quietVideoCopy[locale]).every(text => text.trim().length>0));
  }
  function fake(resume: () => Promise<void> = async () => {}) {
    const changes: number[] = [];
    const notes: {frequency:number;start:number;end?:number}[] = [];
    const voices: {onended:(()=>void)|null}[] = [];
    const context = {
      state: "running", currentTime: 0, sampleRate: 100, destination: {}, closed: 0, started: 0, disconnectedGains:0,
      resume,
      close: async () => {context.closed++;},
      createGain: () => ({gain: {value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, setTargetAtTime: (value: number) => changes.push(value)}, connect() {}, disconnect() {context.disconnectedGains++;}}),
      createBuffer: () => ({getChannelData: () => new Float32Array(400)}),
      createBufferSource: () => ({connect() {}, start() {context.started++;}}),
      createBiquadFilter: () => ({frequency: {value: 0}, connect() {}}),
      createOscillator: () => {
        let record: {frequency:number;start:number;end?:number};
        const oscillator={frequency:{value:0},onended:null as (()=>void)|null,connect(){},disconnect(){},start(start=0){context.started++;record={frequency:oscillator.frequency.value,start};notes.push(record);},stop(end:number){record.end=end;}};
        voices.push(oscillator);
        return oscillator;
      }
    };
    return {context, changes, notes, voices, audioContext: context as unknown as AudioContext};
  }
  for(const sound of ["waves","forest"] as const) {
    const breeze=fake();const controller=new QuietAudio(()=>breeze.audioContext);
    assert.equal(await controller.start(sound,20),true);
    assert.equal(breeze.context.started,2,"One noise source plus one slow envelope oscillator");
    assert(breeze.notes[0]!.frequency>0&&breeze.notes[0]!.frequency<0.2);
    controller.stop();assert.equal(breeze.context.closed,1);
  }
  const first = fake(); const audio = new QuietAudio(() => first.audioContext);
  assert.equal(first.context.started, 0, "Construction must stay silent");
  assert.equal(await audio.start("rain", 20), true);
  assert.equal(first.context.started, 1);
  audio.setVolume(1000); assert.equal(first.changes.at(-1), 0.08);
  audio.setVolume(-10); assert.equal(first.changes.at(-1), 0);
  audio.stop(); audio.stop(); assert.equal(first.context.closed, 1, "Stop is idempotent");
  let release!: () => void;
  const slow = fake(() => new Promise<void>(resolve => {release = resolve;}));
  const next = fake(); let calls = 0;
  const racing = new QuietAudio(() => ++calls === 1 ? slow.audioContext : next.audioContext);
  const pending = racing.start("rain", 20);
  racing.stop();
  assert.equal(await racing.start("notes", 20), true);
  release(); assert.equal(await pending, false);
  assert.equal(slow.context.started, 0, "A cancelled pending start must not later play");
  assert.equal(slow.context.closed, 1); assert(next.context.started>3);
  assert(new Set(next.notes.map(note=>note.frequency)).size>3,"The melody must change pitch");
  assert(next.notes.every(note=>note.start>=0 && note.end!>note.start));
  next.voices[0]!.onended!();assert.equal(next.context.disconnectedGains,1);
  next.voices[1]!.onended!();assert.equal(next.context.disconnectedGains,3,"A finished note must release its colour gains and shared envelope");
  assert.equal(next.context.closed, 0, "An old start must not close newer audio");
  racing.stop(); assert.equal(next.context.closed, 1);
  let resumeVolume!: () => void;
  const waitingVolume = fake(() => new Promise<void>(resolve => {resumeVolume = resolve;}));
  const adjustable = new QuietAudio(() => waitingVolume.audioContext);
  const startingVolume = adjustable.start("notes", 20);
  adjustable.setVolume(0);
  resumeVolume(); assert.equal(await startingVolume, true);
  assert.equal(waitingVolume.changes.at(-1), 0, "Mute selected during startup must take effect before sound begins");
  adjustable.stop();
  let tick!: () => void; let cancelled = 0;
  const cycling = fake();
  const looping = new QuietAudio(()=>cycling.audioContext,callback=>{tick=callback;return()=>{cancelled++;};});
  assert.equal(await looping.start("notes",20),true);
  const firstCycleNotes = cycling.notes.length;
  tick(); assert.equal(cycling.notes.length,firstCycleNotes,"Do not queue duplicate cycles on every timer tick");
  cycling.context.currentTime = QUIET_MUSIC_SECONDS;
  tick(); assert.equal(cycling.notes.length,firstCycleNotes*2);
  cycling.context.currentTime = QUIET_MUSIC_SECONDS*10;
  tick(); assert(cycling.notes.slice(firstCycleNotes*2).every(note=>note.start>=cycling.context.currentTime),"Delayed ticks must not burst missed notes");
  looping.stop(); assert.equal(cancelled,1);
  const stoppedNotes=cycling.notes.length;tick();assert.equal(cycling.notes.length,stoppedNotes,"A queued timer cannot restart stopped music");
  assert.equal(await looping.start("rain",20),true);assert.equal(cancelled,1);looping.stop();
  assert(QUIET_MUSIC_NOTES.every(note=>note.start>=0&&note.start+note.duration<QUIET_MUSIC_SECONDS&&note.attack>0&&note.attack<note.duration&&note.strength>0&&note.strength<1));
  const blocked = fake(async () => {throw new Error("blocked");});
  assert.equal(await new QuietAudio(() => blocked.audioContext).start("rain", 20), false);
  assert.equal(blocked.context.closed, 1);
  const unsupported = new QuietAudio(() => {throw new Error("unsupported");});
  assert.equal(await unsupported.start("notes", 20), false);
  console.log("PASS: nine-language quiet corner copy; silent construction, bounded volume, cleanup, cancelled starts, sound replacement and unsupported audio.");
}
main().catch(error => {console.error(error); process.exitCode = 1;});
