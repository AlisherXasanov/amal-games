/* Local speech-to-text via Whisper (no Google Speech API). */
import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2";

env.allowLocalModels = false;
env.useBrowserCache = true;

const LANG_MAP = {
  ru: "russian",
  en: "english",
  kk: "russian",
  es: "spanish",
  tr: "turkish",
};

const JUNK = /^(?:\[.*\]|\(.*\)|музыка|тишина|silence|music|blank|thanks for watching\.?|молодец|ура|хорошо|спасибо)$/i;

let transcriber = null;
let loadingPromise = null;

async function ensureReady(onProgress) {
  if (transcriber) return transcriber;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    try {
      transcriber = await pipeline("automatic-speech-recognition", "Xenova/whisper-base", {
        quantized: true,
        progress_callback: onProgress,
      });
    } catch (_) {
      transcriber = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny", {
        quantized: true,
        progress_callback: onProgress,
      });
    }
    return transcriber;
  })();
  try {
    return await loadingPromise;
  } catch (err) {
    loadingPromise = null;
    throw err;
  }
}

function cleanText(text) {
  let t = String(text || "").replace(/\s+/g, " ").trim();
  t = t.replace(/^["'«»]+|["'«»]+$/g, "").trim();
  if (!t || JUNK.test(t)) return "";
  if (t.length < 2) return "";
  return t;
}

function normalize(float32) {
  let peak = 0;
  for (let i = 0; i < float32.length; i++) {
    const a = Math.abs(float32[i]);
    if (a > peak) peak = a;
  }
  if (peak < 0.0004) return { audio: float32, peak };
  const gain = Math.min(0.95 / peak, 14);
  if (gain < 1.05) return { audio: float32, peak };
  const out = new Float32Array(float32.length);
  for (let i = 0; i < float32.length; i++) out[i] = float32[i] * gain;
  return { audio: out, peak };
}

function resampleTo16k(float32, fromRate) {
  if (!float32 || !fromRate || fromRate === 16000) return float32;
  const newLen = Math.max(1, Math.round(float32.length * (16000 / fromRate)));
  const out = new Float32Array(newLen);
  const ratio = float32.length / newLen;
  for (let i = 0; i < newLen; i++) {
    const x = i * ratio;
    const i0 = Math.floor(x);
    const i1 = Math.min(float32.length - 1, i0 + 1);
    const t = x - i0;
    out[i] = float32[i0] * (1 - t) + float32[i1] * t;
  }
  return out;
}

async function blobToPcm16k(blob) {
  const buf = await blob.arrayBuffer();
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  let decoded;
  try {
    decoded = await ctx.decodeAudioData(buf.slice(0));
  } finally {
    try {
      await ctx.close();
    } catch (_) {}
  }
  let data = decoded.getChannelData(0);
  // mono mix if needed
  if (decoded.numberOfChannels > 1) {
    const ch2 = decoded.getChannelData(1);
    const mixed = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) mixed[i] = (data[i] + ch2[i]) * 0.5;
    data = mixed;
  }
  return {
    audio: resampleTo16k(data, decoded.sampleRate),
    sampleRate: 16000,
    duration: decoded.duration,
  };
}

function trimSilence(float32, thresh = 0.012) {
  if (!float32 || !float32.length) return float32;
  let start = 0;
  let end = float32.length - 1;
  while (start < end && Math.abs(float32[start]) < thresh) start++;
  while (end > start && Math.abs(float32[end]) < thresh) end--;
  // keep a little padding
  start = Math.max(0, start - 1600);
  end = Math.min(float32.length - 1, end + 1600);
  return float32.slice(start, end + 1);
}

async function runWhisper(audio, langCode) {
  const language = LANG_MAP[langCode] || "russian";
  let clipped = trimSilence(audio);
  if (!clipped || clipped.length < 4000) return { text: "", peak: 0, note: "too-short" };
  const { audio: norm, peak } = normalize(clipped);
  if (peak < 0.0008) return { text: "", peak, note: "too-quiet" };

  // Kids speak Russian — force russian first (other langs hallucinate more)
  const preferred = language === "russian" || langCode === "ru" || langCode === "kk";
  const order = preferred
    ? [
        { sampling_rate: 16000, language: "russian", task: "transcribe" },
        { sampling_rate: 16000, task: "transcribe" },
      ]
    : [
        { sampling_rate: 16000, language, task: "transcribe" },
        { sampling_rate: 16000, language: "russian", task: "transcribe" },
        { sampling_rate: 16000, task: "transcribe" },
      ];

  for (const opts of order) {
    const out = await transcriber(norm, opts);
    const text = cleanText(out && out.text);
    if (text) return { text, peak };
  }
  return { text: "", peak };
}

window.SkazhiWhisper = {
  ready: false,
  async warm(onProgress) {
    await ensureReady(onProgress);
    this.ready = true;
  },
  async transcribeBlob(blob, langCode, onProgress) {
    await ensureReady(onProgress);
    if (!blob || blob.size < 500) return "";
    const { audio, duration } = await blobToPcm16k(blob);
    if (!audio || audio.length < 4800 || duration < 0.25) return "";
    const { text } = await runWhisper(audio, langCode);
    return text;
  },
  async transcribePcm(float32, langCode, onProgress, sampleRate) {
    await ensureReady(onProgress);
    let audio = resampleTo16k(float32, sampleRate || 16000);
    if (!audio || audio.length < 8000) return "";
    const { text } = await runWhisper(audio, langCode);
    return text;
  },
  async selfTest() {
    await ensureReady();
    const url = "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/jfk.wav";
    const buf = await (await fetch(url)).arrayBuffer();
    const ctx = new AudioContext();
    const decoded = await ctx.decodeAudioData(buf.slice(0));
    await ctx.close();
    const slice = decoded.getChannelData(0).slice(0, decoded.sampleRate * 2.5);
    const audio = resampleTo16k(slice, decoded.sampleRate);
    const { text } = await runWhisper(audio, "en");
    return text;
  },
};

window.SkazhiWhisper.warm(() => {}).catch((err) => {
  console.warn("Whisper preload failed", err);
  window.__whisperPreloadError = String(err && err.message ? err.message : err);
});
