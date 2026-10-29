import assert from "node:assert/strict";
import {QuietAudio} from "../src/lib/audio/quiet-audio";
import {quietCopy} from "../src/content/quiet-corner";
import {quietVideoCopy} from "../src/content/quiet-videos";
import {LOCALES} from "../src/i18n/config";

async function main() {
  for (const locale of LOCALES) {
    assert.deepEqual(Object.keys(quietCopy[locale]).sort(), Object.keys(quietCopy.en).sort());
    assert(Object.values(quietCopy[locale]).every(text => typeof text === "string" && text.trim().length > 0));
    assert.deepEqual(Object.keys(quietVideoCopy[locale]).sort(),Object.keys(quietVideoCopy.en).sort());
    assert(Object.values(quietVideoCopy[locale]).every(text => text.trim().length>0));
  }
  function fake(resume: () => Promise<void> = async () => {}) {
    const changes: number[] = [];
    const context = {
      state: "running", currentTime: 0, sampleRate: 100, destination: {}, closed: 0, started: 0,
      resume,
      close: async () => {context.closed++;},
      createGain: () => ({gain: {value: 0, setTargetAtTime: (value: number) => changes.push(value)}, connect() {}}),
      createBuffer: () => ({getChannelData: () => new Float32Array(400)}),
      createBufferSource: () => ({connect() {}, start() {context.started++;}}),
      createBiquadFilter: () => ({frequency: {value: 0}, connect() {}}),
      createOscillator: () => ({frequency: {value: 0}, connect() {}, start() {context.started++;}})
    };
    return {context, changes, audioContext: context as unknown as AudioContext};
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
  assert.equal(slow.context.closed, 1); assert.equal(next.context.started, 3);
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
  const blocked = fake(async () => {throw new Error("blocked");});
  assert.equal(await new QuietAudio(() => blocked.audioContext).start("rain", 20), false);
  assert.equal(blocked.context.closed, 1);
  const unsupported = new QuietAudio(() => {throw new Error("unsupported");});
  assert.equal(await unsupported.start("notes", 20), false);
  console.log("PASS: nine-language quiet corner copy; silent construction, bounded volume, cleanup, cancelled starts, sound replacement and unsupported audio.");
}
main().catch(error => {console.error(error); process.exitCode = 1;});
