"use client";

/**
 * 紙の音を合成でつくる。音源ファイルを持たず、Web Audio だけで鳴らす。
 * ざらついたピンクノイズをバンドパスで削ると、紙をめくる音に近くなる。
 */

export type Voice = "turn" | "rustle" | "stroke" | "ink" | "close" | "tick";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let grain: AudioBuffer | null = null;

function makePinkNoise(context: AudioContext, seconds: number) {
  const length = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  // Paul Kellet のピンクノイズ近似
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  return buffer;
}

function ensureContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.85;
    master.connect(ctx.destination);
    grain = makePinkNoise(ctx, 2);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** 最初のタップで AudioContext を起こしておく（自動再生制限のため） */
export function unlockAudio() {
  ensureContext();
}

/* --- 消音の状態。React の外に置き、useSyncExternalStore から読む --- */

const MUTE_KEY = "kokan-nikki.muted";
const muteListeners = new Set<() => void>();
let muteCache: boolean | null = null;

export function subscribeMuted(listener: () => void) {
  muteListeners.add(listener);
  return () => muteListeners.delete(listener);
}

export function getMuted() {
  if (muteCache === null) {
    try {
      muteCache = window.localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      // localStorage が塞がれていても、この場では効く
      muteCache = false;
    }
  }
  return muteCache;
}

/** サーバー側では常に「鳴る」状態として描く */
export function getMutedOnServer() {
  return false;
}

export function setMuted(next: boolean) {
  muteCache = next;
  try {
    window.localStorage.setItem(MUTE_KEY, next ? "1" : "0");
  } catch {
    // 保存できなくても構わない
  }
  muteListeners.forEach((listener) => listener());
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/** ノイズを一掴みぶん切り出して鳴らす */
function burst(
  context: AudioContext,
  opts: {
    duration: number;
    attack: number;
    peak: number;
    type: BiquadFilterType;
    from: number;
    to?: number;
    q?: number;
    rate?: number;
  },
) {
  const src = context.createBufferSource();
  src.buffer = grain;
  src.playbackRate.value = opts.rate ?? 1;

  const filter = context.createBiquadFilter();
  filter.type = opts.type;
  filter.Q.value = opts.q ?? 0.8;

  const gain = context.createGain();
  const t = context.currentTime;

  filter.frequency.setValueAtTime(opts.from, t);
  if (opts.to) filter.frequency.exponentialRampToValueAtTime(opts.to, t + opts.duration);

  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(opts.peak, t + opts.attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + opts.duration);

  src.connect(filter).connect(gain).connect(master!);
  src.start(t, rand(0, 1.2));
  src.stop(t + opts.duration + 0.02);
}

function thud(context: AudioContext, frequency: number, peak: number, duration: number) {
  const osc = context.createOscillator();
  const gain = context.createGain();
  const t = context.currentTime;
  osc.type = "sine";
  osc.frequency.setValueAtTime(frequency, t);
  osc.frequency.exponentialRampToValueAtTime(frequency * 0.6, t + duration);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(master!);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

export function playVoice(voice: Voice) {
  const context = ensureContext();
  if (!context || !grain) return;

  switch (voice) {
    // 頁をめくる。厚みのある擦れと、その後の細かい弾け。
    case "turn":
      burst(context, {
        duration: 0.34, attack: 0.03, peak: 0.16,
        type: "bandpass", from: 1500, to: 620, q: 0.6, rate: rand(0.92, 1.08),
      });
      burst(context, {
        duration: 0.18, attack: 0.05, peak: 0.05,
        type: "highpass", from: 2600, q: 0.5, rate: rand(1.0, 1.3),
      });
      break;

    // 紙を撫でる。ひらく／とじる。
    case "rustle":
      burst(context, {
        duration: 0.22, attack: 0.04, peak: 0.09,
        type: "bandpass", from: 1100, to: 780, q: 0.7, rate: rand(0.9, 1.1),
      });
      break;

    // 筆が紙に触れる。打鍵ごとに鳴るので、耳につかない音量に留める。
    case "stroke":
      burst(context, {
        duration: rand(0.026, 0.05), attack: 0.004, peak: rand(0.018, 0.034),
        type: "bandpass", from: rand(1700, 3400), q: 1.1, rate: rand(0.85, 1.25),
      });
      break;

    // 墨を置く。書き終えたとき。
    case "ink":
      thud(context, 118, 0.14, 0.34);
      burst(context, {
        duration: 0.3, attack: 0.05, peak: 0.06,
        type: "bandpass", from: 900, to: 460, q: 0.7,
      });
      break;

    // ノートを閉じて、次の人に渡す。厚みのある、終わりの音。
    case "close":
      burst(context, {
        duration: 0.46, attack: 0.05, peak: 0.15,
        type: "bandpass", from: 1200, to: 380, q: 0.5, rate: rand(0.86, 0.96),
      });
      thud(context, 84, 0.17, 0.5);
      break;

    // 小さな爪弾き。切り替えの合図。
    case "tick":
      burst(context, {
        duration: 0.05, attack: 0.005, peak: 0.05,
        type: "highpass", from: 3200, q: 0.6, rate: rand(0.95, 1.15),
      });
      break;
  }
}
