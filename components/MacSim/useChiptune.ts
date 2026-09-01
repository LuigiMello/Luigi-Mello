'use client';
import { useEffect, useRef } from 'react';

type Genre = {
  id: string;
  label: string;
  emoji: string;
  bpm: number;
  waveform: OscillatorType;
  kick: number[];
  snare: number[];
  hat: number[];
  openHat?: number[];
  bass: Record<number, number>;
  melody?: Record<number, number>;
  noteDur: number;
};

// 5 tiny procedural "genres" — no audio files, just a step sequencer driving
// oscillators + filtered noise. Different tempo/waveform/drum pattern per
// genre is what actually makes tracks sound distinct, not just different notes.
const GENRES: Genre[] = [
  {
    id: 'funk', label: 'Funk', emoji: '🕺', bpm: 104, waveform: 'square',
    kick: [0, 3, 6, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14],
    bass: { 0: 0, 2: 0, 3: 7, 6: 0, 8: 0, 9: 10, 12: 0, 14: 5 },
    noteDur: 0.12,
  },
  {
    id: 'pop', label: 'Pop', emoji: '✨', bpm: 120, waveform: 'triangle',
    kick: [0, 4, 8, 12], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14],
    bass: { 0: 0, 4: 0, 8: 0, 12: 0 },
    melody: { 2: 12, 6: 7, 10: 4, 14: 7 },
    noteDur: 0.22,
  },
  {
    id: 'rock', label: 'Rock', emoji: '🎸', bpm: 138, waveform: 'sawtooth',
    kick: [0, 4, 6, 8, 12, 14], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14],
    bass: { 0: 0, 4: 0, 6: 7, 8: 0, 12: 0, 14: 7 },
    noteDur: 0.16,
  },
  {
    id: 'lofi', label: 'Lo-fi', emoji: '☕', bpm: 80, waveform: 'sine',
    kick: [0, 10], snare: [4, 12], hat: [0, 4, 7, 8, 12],
    bass: { 0: 0, 10: 5 },
    melody: { 4: 10, 12: 7 },
    noteDur: 0.4,
  },
  {
    id: 'eletro', label: 'Eletrônica', emoji: '🤖', bpm: 126, waveform: 'square',
    kick: [0, 4, 8, 12], snare: [4, 12], hat: [2, 6, 10, 14], openHat: [2, 6, 10, 14],
    bass: { 0: 0, 2: 0, 4: 12, 6: 12, 8: 0, 10: 0, 12: 7, 14: 7 },
    melody: { 1: 12, 3: 15, 5: 19, 7: 12, 9: 15, 11: 19, 13: 12, 15: 15 },
    noteDur: 0.09,
  },
];

const ROOTS = [220, 233.08, 246.94, 261.63, 277.18, 293.66, 329.63, 349.23, 174.61, 196, 207.65, 261.63];

export function getGenre(seed: number): Genre {
  return GENRES[Math.abs(seed) % GENRES.length];
}

function playKick(ctx: AudioContext, time: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
  gain.gain.setValueAtTime(0.85, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
  osc.connect(gain).connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.2);
}

function playSnare(ctx: AudioContext, noiseBuffer: AudioBuffer, time: number) {
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1800;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.45, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
  noise.connect(bp).connect(gain).connect(ctx.destination);
  noise.start(time);
  noise.stop(time + 0.15);
}

function playHat(ctx: AudioContext, noiseBuffer: AudioBuffer, time: number, open?: boolean) {
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 7000;
  const gain = ctx.createGain();
  const dur = open ? 0.14 : 0.045;
  gain.gain.setValueAtTime(0.2, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
  noise.connect(hp).connect(gain).connect(ctx.destination);
  noise.start(time);
  noise.stop(time + dur + 0.02);
}

function playTone(ctx: AudioContext, freq: number, time: number, dur: number, waveform: OscillatorType, vol: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = waveform;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(time);
  osc.stop(time + dur + 0.02);
}

export function useChiptune(seed: number, playing: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const noiseBufRef = useRef<AudioBuffer | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!playing) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    const AudioCtxClass = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!ctxRef.current) ctxRef.current = new AudioCtxClass();
    const ctx = ctxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    if (!noiseBufRef.current) {
      const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      noiseBufRef.current = buf;
    }
    const noiseBuf = noiseBufRef.current;

    const genre = getGenre(seed);
    const root = ROOTS[Math.abs(seed) % ROOTS.length];
    const stepDur = 60 / genre.bpm / 4;
    let step = 0;
    let cancelled = false;

    const scheduleStep = () => {
      if (cancelled) return;
      const t = ctx.currentTime + 0.02;
      const s = step % 16;

      if (genre.kick.includes(s)) playKick(ctx, t);
      if (genre.snare.includes(s)) playSnare(ctx, noiseBuf, t);
      if (genre.hat.includes(s)) playHat(ctx, noiseBuf, t, genre.openHat?.includes(s));

      const bassSemi = genre.bass[s];
      if (bassSemi !== undefined) {
        const freq = (root / 2) * Math.pow(2, bassSemi / 12);
        playTone(ctx, freq, t, genre.noteDur, genre.waveform, 0.15);
      }

      const melSemi = genre.melody?.[s];
      if (melSemi !== undefined) {
        const freq = root * Math.pow(2, melSemi / 12);
        const leadWave: OscillatorType = genre.waveform === 'square' ? 'triangle' : 'square';
        playTone(ctx, freq, t, genre.noteDur * 0.8, leadWave, 0.09);
      }

      step++;
      timeoutRef.current = setTimeout(scheduleStep, stepDur * 1000);
    };

    scheduleStep();

    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [seed, playing]);

  useEffect(() => {
    return () => {
      ctxRef.current?.close().catch(() => {});
    };
  }, []);
}
