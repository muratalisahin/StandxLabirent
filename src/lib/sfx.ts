let audioCtx: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Audio = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Audio) return null;
    audioCtx = new Audio();
  }
  if (audioCtx.state === 'suspended') void audioCtx.resume();
  return audioCtx;
}

function noiseBuffer(context: AudioContext, seconds: number) {
  const length = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function playTone(
  context: AudioContext,
  {
    type = 'sine',
    freq,
    endFreq,
    start,
    duration,
    gain = 0.08,
    attack = 0.01,
    filterFreq,
  }: {
    type?: OscillatorType;
    freq: number;
    endFreq?: number;
    start: number;
    duration: number;
    gain?: number;
    attack?: number;
    filterFreq?: number;
  },
) {
  const osc = context.createOscillator();
  const amp = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (endFreq !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), start + duration);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  if (filterFreq) {
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    osc.connect(filter);
    filter.connect(amp);
  } else {
    osc.connect(amp);
  }
  amp.connect(context.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function playDoorOpen() {
  const context = ctx();
  if (!context) return;
  const now = context.currentTime;
  const source = context.createBufferSource();
  source.buffer = noiseBuffer(context, 0.55);
  const filter = context.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(420, now);
  filter.frequency.exponentialRampToValueAtTime(140, now + 0.5);
  filter.Q.value = 1.4;
  const amp = context.createGain();
  amp.gain.setValueAtTime(0.0001, now);
  amp.gain.exponentialRampToValueAtTime(0.22, now + 0.04);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
  source.connect(filter);
  filter.connect(amp);
  amp.connect(context.destination);
  source.start(now);
  playTone(context, { type: 'sawtooth', freq: 210, endFreq: 70, start: now, duration: 0.45, gain: 0.05, filterFreq: 500 });
  playTone(context, { type: 'triangle', freq: 90, endFreq: 55, start: now + 0.28, duration: 0.18, gain: 0.08 });
}

export function playCorrect() {
  const context = ctx();
  if (!context) return;
  const now = context.currentTime;
  playTone(context, { type: 'sine', freq: 523, start: now, duration: 0.12, gain: 0.07 });
  playTone(context, { type: 'sine', freq: 659, start: now + 0.1, duration: 0.14, gain: 0.07 });
  playTone(context, { type: 'sine', freq: 784, start: now + 0.2, duration: 0.22, gain: 0.08 });
}

export function playWrong() {
  const context = ctx();
  if (!context) return;
  const now = context.currentTime;
  playTone(context, { type: 'square', freq: 180, endFreq: 90, start: now, duration: 0.28, gain: 0.05, filterFreq: 600 });
  playTone(context, { type: 'sawtooth', freq: 140, endFreq: 70, start: now + 0.05, duration: 0.22, gain: 0.04, filterFreq: 400 });
}

export function playLocked() {
  const context = ctx();
  if (!context) return;
  playTone(context, { type: 'triangle', freq: 110, endFreq: 70, start: context.currentTime, duration: 0.16, gain: 0.07 });
}

export function unlockAudio() {
  ctx();
}
