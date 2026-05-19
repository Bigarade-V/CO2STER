// === CO2STER - Celtic BGM: 暮色荒原 (Web Audio API) ===
// A小调凯尔特Aires，CO2值动态影响音乐氛围（越低沉）

import { gameState } from './state.js';

let audioCtx = null;
let masterGain = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.35;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// === 混响生成 ===
function createReverb(ctx, duration, decay) {
  const len = ctx.sampleRate * duration;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  const conv = ctx.createConvolver();
  conv.buffer = buf;
  return conv;
}

// === A小调凯尔特音阶 (A B C D E F G) ===
const S = {
  A3: 220.00, B3: 246.94, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00,
  A4: 440.00, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99,
  A5: 880.00,
};

// === 调度一段8小节旋律，返回持续时间(秒) ===
function schedulePhrase(ctx, dest) {
  const bpm = 72;
  const beat = 60 / bpm;
  const bar = beat * 4;
  const now = ctx.currentTime + 0.05;

  // 混响（本段专用，避免共享convolver问题）
  const reverb = createReverb(ctx, 3.0, 2.5);
  const dryGain = ctx.createGain();
  dryGain.gain.value = 0.8;
  const wetGain = ctx.createGain();
  wetGain.gain.value = 0.2;
  dryGain.connect(dest);
  reverb.connect(wetGain);
  wetGain.connect(dest);

  function noteOut(node) {
    node.connect(dryGain);
    node.connect(reverb);
  }

  // --- 音符 ---
  function note(freq, startTime, duration, vol, type) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq * 0.99, startTime);
    osc.frequency.linearRampToValueAtTime(freq, startTime + 0.03);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.01);
    gain.gain.setValueAtTime(vol * 0.85, startTime + duration * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    noteOut(gain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
  }

  function pad(freqs, startTime, duration, vol) {
    for (const freq of freqs) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(vol, startTime + 0.3);
      gain.gain.setValueAtTime(vol * 0.8, startTime + duration * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      noteOut(gain);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.2);
    }
  }

  function bass(freq, startTime, duration, vol) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.02);
    gain.gain.setValueAtTime(vol * 0.7, startTime + duration * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    noteOut(gain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
  }

  // 主旋律
  const melody = [
    { t: 0, n: S.A4, d: beat * 1.5, v: 0.11 },
    { t: beat * 1.5, n: S.G4, d: beat * 0.5, v: 0.09 },
    { t: beat * 2, n: S.E4, d: beat * 1.5, v: 0.1 },
    { t: beat * 3.5, n: S.F4, d: beat * 0.5, v: 0.09 },
    { t: bar, n: S.D4, d: beat * 2, v: 0.1 },
    { t: bar + beat * 2, n: S.E4, d: beat, v: 0.09 },
    { t: bar + beat * 3, n: S.F4, d: beat, v: 0.09 },
    { t: bar * 2, n: S.E4, d: beat, v: 0.1 },
    { t: bar * 2 + beat, n: S.A4, d: beat * 1.5, v: 0.12 },
    { t: bar * 2 + beat * 2.5, n: S.G4, d: beat * 0.5, v: 0.09 },
    { t: bar * 2 + beat * 3, n: S.F4, d: beat, v: 0.09 },
    { t: bar * 3, n: S.E4, d: beat * 2, v: 0.1 },
    { t: bar * 3 + beat * 2, n: S.D4, d: beat, v: 0.09 },
    { t: bar * 3 + beat * 3, n: S.C4, d: beat, v: 0.09 },
    { t: bar * 4, n: S.A4, d: beat, v: 0.13 },
    { t: bar * 4 + beat, n: S.C5, d: beat * 1.5, v: 0.14 },
    { t: bar * 4 + beat * 2.5, n: S.B4, d: beat * 0.5, v: 0.1 },
    { t: bar * 4 + beat * 3, n: S.A4, d: beat, v: 0.12 },
    { t: bar * 5, n: S.G4, d: beat, v: 0.1 },
    { t: bar * 5 + beat, n: S.A4, d: beat * 1.5, v: 0.12 },
    { t: bar * 5 + beat * 2.5, n: S.E4, d: beat * 0.5, v: 0.09 },
    { t: bar * 5 + beat * 3, n: S.F4, d: beat, v: 0.09 },
    { t: bar * 6, n: S.E4, d: beat * 2, v: 0.1 },
    { t: bar * 6 + beat * 2, n: S.D4, d: beat, v: 0.09 },
    { t: bar * 6 + beat * 3, n: S.C4, d: beat, v: 0.08 },
    { t: bar * 7, n: S.D4, d: beat, v: 0.09 },
    { t: bar * 7 + beat, n: S.E4, d: beat * 0.5, v: 0.08 },
    { t: bar * 7 + beat * 1.5, n: S.A3, d: beat * 2.5, v: 0.11 },
  ];

  for (const m of melody) {
    note(m.n, now + m.t, m.d, m.v, 'sine');
    note(m.n * 2, now + m.t, m.d * 0.4, m.v * 0.08, 'triangle');
  }

  // 和弦
  const chords = [
    { t: 0, f: [S.A3, S.C4, S.E4], d: bar * 2, v: 0.03 },
    { t: bar * 2, f: [S.F4, S.A4, S.C5], d: bar * 2, v: 0.03 },
    { t: bar * 4, f: [S.A3, S.C4, S.E4], d: bar, v: 0.03 },
    { t: bar * 5, f: [S.D4, S.F4, S.A4], d: bar, v: 0.03 },
    { t: bar * 6, f: [S.E4, S.G4, S.B4], d: bar, v: 0.03 },
    { t: bar * 7, f: [S.A3, S.C4, S.E4], d: bar, v: 0.03 },
  ];
  for (const c of chords) {
    pad(c.f, now + c.t, c.d, c.v);
  }

  // 低音
  const bassLine = [
    { t: 0, f: S.A3 * 0.5, d: bar },
    { t: bar, f: S.A3 * 0.5, d: bar },
    { t: bar * 2, f: S.F4 * 0.5, d: bar },
    { t: bar * 3, f: S.F4 * 0.5, d: bar },
    { t: bar * 4, f: S.A3 * 0.5, d: bar },
    { t: bar * 5, f: S.D4 * 0.5, d: bar },
    { t: bar * 6, f: S.E4 * 0.5, d: bar },
    { t: bar * 7, f: S.A3 * 0.5, d: bar },
  ];
  for (const b of bassLine) {
    bass(b.f, now + b.t, b.d, 0.06);
  }

  // 返回这段的精确时长
  return bar * 8;
}

// =====================================================
// BGM 状态与控制器
// =====================================================

let bgmState = {
  playing: false,
  intervalId: null,
  lowPassFilter: null,
  // CO2 低沉效果节点
  subOsc: null,
  subGain: null,
  droneOsc: null,
  droneGain: null,
  droneFilter: null,
  noiseSource: null,
  noiseGain: null,
  noiseFilter: null,
};

// === 根据CO2值计算音乐参数（只往低沉方向）===
function getCo2MusicParams() {
  const co2 = gameState.displayCo2 || 0;

  if (co2 < 60) {
    return {
      filterFreq: 8000,
      filterQ: 0.5,
      subLevel: 0,
      droneLevel: 0,
      noiseLevel: 0,
      masterVol: 0.35,
    };
  } else if (co2 < 100) {
    const t = (co2 - 60) / 40;
    return {
      filterFreq: 8000 - t * 5000,
      filterQ: 0.5 + t * 1.5,
      subLevel: t * 0.12,
      droneLevel: t * 0.04,
      noiseLevel: t * 0.008,
      masterVol: 0.35 - t * 0.03,
    };
  } else {
    const t = Math.min((co2 - 100) / 50, 1);
    return {
      filterFreq: 3000 - t * 2000,
      filterQ: 1.5 + t * 2,
      subLevel: 0.12 + t * 0.18,
      droneLevel: 0.04 + t * 0.08,
      noiseLevel: 0.008 + t * 0.02,
      masterVol: 0.32 - t * 0.07,
    };
  }
}

// === 确保/创建CO2低沉效果节点 ===
function ensureCo2EffectNodes(ctx) {
  if (!bgmState.subOsc) {
    bgmState.subOsc = ctx.createOscillator();
    bgmState.subGain = ctx.createGain();
    bgmState.subOsc.type = 'sine';
    bgmState.subOsc.frequency.value = 55;
    bgmState.subGain.gain.value = 0;
    bgmState.subOsc.connect(bgmState.subGain);
    bgmState.subGain.connect(masterGain);
    bgmState.subOsc.start();
  }

  if (!bgmState.droneOsc) {
    bgmState.droneOsc = ctx.createOscillator();
    bgmState.droneGain = ctx.createGain();
    bgmState.droneFilter = ctx.createBiquadFilter();
    bgmState.droneOsc.type = 'triangle';
    bgmState.droneOsc.frequency.value = 110;
    bgmState.droneGain.gain.value = 0;
    bgmState.droneFilter.type = 'lowpass';
    bgmState.droneFilter.frequency.value = 200;
    bgmState.droneOsc.connect(bgmState.droneFilter);
    bgmState.droneFilter.connect(bgmState.droneGain);
    bgmState.droneGain.connect(masterGain);
    bgmState.droneOsc.start();
  }

  if (!bgmState.noiseSource) {
    const bufLen = 4 * ctx.sampleRate;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufLen; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (last + 0.02 * white) / 1.02;
      last = data[i];
      data[i] *= 3.5;
    }
    bgmState.noiseSource = ctx.createBufferSource();
    bgmState.noiseSource.buffer = buf;
    bgmState.noiseSource.loop = true;
    bgmState.noiseFilter = ctx.createBiquadFilter();
    bgmState.noiseFilter.type = 'lowpass';
    bgmState.noiseFilter.frequency.value = 300;
    bgmState.noiseFilter.Q.value = 0.5;
    bgmState.noiseGain = ctx.createGain();
    bgmState.noiseGain.gain.value = 0;
    bgmState.noiseSource.connect(bgmState.noiseFilter);
    bgmState.noiseFilter.connect(bgmState.noiseGain);
    bgmState.noiseGain.connect(masterGain);
    bgmState.noiseSource.start();
  }
}

// === 更新CO2驱动的音乐效果（每帧调用）===
export function updateBGM() {
  if (!bgmState.playing) return;

  const ctx = getAudioCtx();
  const params = getCo2MusicParams();
  const now = ctx.currentTime;
  const ramp = 0.8;

  // 低通滤波器
  if (bgmState.lowPassFilter) {
    bgmState.lowPassFilter.frequency.linearRampToValueAtTime(params.filterFreq, now + ramp);
    bgmState.lowPassFilter.Q.linearRampToValueAtTime(params.filterQ, now + ramp);
  }

  ensureCo2EffectNodes(ctx);

  bgmState.subGain.gain.linearRampToValueAtTime(params.subLevel, now + ramp);
  bgmState.subOsc.frequency.linearRampToValueAtTime(55 - (params.subLevel > 0 ? 15 : 0), now + ramp);

  bgmState.droneGain.gain.linearRampToValueAtTime(params.droneLevel, now + ramp);
  bgmState.droneOsc.frequency.linearRampToValueAtTime(110 - params.droneLevel * 200, now + ramp);
  bgmState.droneFilter.frequency.linearRampToValueAtTime(200 + params.droneLevel * 300, now + ramp);

  bgmState.noiseGain.gain.linearRampToValueAtTime(params.noiseLevel, now + ramp);
  bgmState.noiseFilter.frequency.linearRampToValueAtTime(300 + params.noiseLevel * 1500, now + ramp);

  masterGain.gain.linearRampToValueAtTime(params.masterVol, now + ramp);
}

// === 开始播放BGM ===
export function startBGM() {
  const ctx = getAudioCtx();

  if (bgmState.playing) return;

  // 创建效果链：所有音符 → lowPass → masterGain → destination
  const lowPass = ctx.createBiquadFilter();
  lowPass.type = 'lowpass';
  lowPass.frequency.value = 8000;
  lowPass.Q.value = 0.5;
  lowPass.connect(masterGain);

  bgmState.lowPassFilter = lowPass;
  bgmState.playing = true;

  // 调度第一段
  const dur = schedulePhrase(ctx, lowPass);

  // 用 setInterval 实现循环 —— 在当前段结束前1秒调度下一段
  bgmState.intervalId = setInterval(() => {
    if (!bgmState.playing) return;
    schedulePhrase(ctx, lowPass);
  }, (dur - 1) * 1000);

  // 立即应用CO2效果
  const params = getCo2MusicParams();
  masterGain.gain.value = params.masterVol;
}

// === 停止BGM ===
export function stopBGM() {
  bgmState.playing = false;

  if (bgmState.intervalId) {
    clearInterval(bgmState.intervalId);
    bgmState.intervalId = null;
  }

  const stopOsc = (osc) => { if (osc) try { osc.stop(); } catch (e) {} };

  stopOsc(bgmState.subOsc);
  stopOsc(bgmState.droneOsc);
  stopOsc(bgmState.noiseSource);

  bgmState.subOsc = null;
  bgmState.subGain = null;
  bgmState.droneOsc = null;
  bgmState.droneGain = null;
  bgmState.droneFilter = null;
  bgmState.noiseSource = null;
  bgmState.noiseGain = null;
  bgmState.noiseFilter = null;
  bgmState.lowPassFilter = null;
}
