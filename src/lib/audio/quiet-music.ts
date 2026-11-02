/** Original slow instrumental score, authored for Money Quest. No sampled music. */
export const QUIET_MUSIC_SECONDS = 48;
type MusicNote = {start: number; duration: number; midi: number; strength: number; attack: number};
const melody = [64,67,69,67,64,62,60,64,69,67,64,60,62,67,64,60];
const chords = [[48,52,55],[57,60,64],[53,57,60],[55,60,62]];
export const QUIET_MUSIC_NOTES: readonly MusicNote[] = [
  ...melody.map((midi,index) => ({start:index*3,duration:2.85,midi,strength:0.7,attack:0.24})),
  ...chords.flatMap((notes,index) => notes.map(midi => ({start:index*12,duration:11.5,midi,strength:0.17,attack:1.8})))
];

/** Schedule on the audio clock; the JS timer only queues a later whole cycle. */
export function scheduleQuietMusic(context: AudioContext, destination: AudioNode, start: number) {
  for (const note of QUIET_MUSIC_NOTES) {
    const onset = start + note.start;
    const end = onset + note.duration;
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0, onset);
    envelope.gain.linearRampToValueAtTime(note.strength, onset + note.attack);
    envelope.gain.linearRampToValueAtTime(0, end);
    envelope.connect(destination);
    const frequency = 440 * 2 ** ((note.midi - 69) / 12);
    let voices = 2;
    for (const [multiple, strength] of [[1,1],[2,0.08]] as const) {
      const oscillator = context.createOscillator();
      const colour = context.createGain();
      colour.gain.value = strength;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency * multiple;
      oscillator.connect(colour);
      colour.connect(envelope);
      oscillator.onended = () => {oscillator.disconnect(); colour.disconnect(); if (--voices === 0) envelope.disconnect();};
      oscillator.start(onset);
      oscillator.stop(end);
    }
  }
}
