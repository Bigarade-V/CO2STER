// === CO2STER - Procedural Sound Effects (Web Audio API) ===

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// 工具：创建噪声缓冲
function createNoiseBuffer(ctx, duration, type = 'white') {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  if (type === 'white') {
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  } else if (type === 'brown') {
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (last + 0.02 * white) / 1.02;
      last = data[i];
      data[i] *= 3.5;
    }
  } else if (type === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  }
  return buffer;
}

// === 音效实现 ===

// 砍伐：树枝断裂声（木质撕裂 + 清脆折断）
export function playChopSound() {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;

  // 第一下：木头受力（稍轻）
  playOneChop(ctx, now, 0.8);
  // 第二下：裂纹扩展
  playOneChop(ctx, now + 0.2, 0.9);
  // 第三下：彻底断裂（最重）
  playOneChop(ctx, now + 0.42, 1.2);
}

function playOneChop(ctx, startTime, volume = 1.0) {
  // 木质撕裂噪声（中频棕噪声，模拟纤维被拉断）
  const tear = ctx.createBufferSource();
  tear.buffer = createNoiseBuffer(ctx, 0.2, 'brown');
  const tearFilter = ctx.createBiquadFilter();
  tearFilter.type = 'bandpass';
  tearFilter.frequency.setValueAtTime(600, startTime);
  tearFilter.frequency.exponentialRampToValueAtTime(300, startTime + 0.15);
  tearFilter.Q.value = 1.0;
  const tearGain = ctx.createGain();
  tearGain.gain.setValueAtTime(0.3 * volume, startTime);
  tearGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
  tear.connect(tearFilter).connect(tearGain).connect(ctx.destination);
  tear.start(startTime);
  tear.stop(startTime + 0.2);

  // 纤维断裂的"嗤嗤"声（中高频短暂噪声）
  const fiber = ctx.createBufferSource();
  fiber.buffer = createNoiseBuffer(ctx, 0.1);
  const fiberFilter = ctx.createBiquadFilter();
  fiberFilter.type = 'bandpass';
  fiberFilter.frequency.setValueAtTime(1800, startTime + 0.02);
  fiberFilter.Q.value = 2;
  const fiberGain = ctx.createGain();
  fiberGain.gain.setValueAtTime(0.15 * volume, startTime + 0.02);
  fiberGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);
  fiber.connect(fiberFilter).connect(fiberGain).connect(ctx.destination);
  fiber.start(startTime + 0.02);
  fiber.stop(startTime + 0.12);

  // 清脆的"啪"折断声（三角波快扫，干脆但不刺耳）
  const snap = ctx.createOscillator();
  const snapGain = ctx.createGain();
  snap.type = 'triangle';
  snap.frequency.setValueAtTime(500, startTime + 0.04);
  snap.frequency.exponentialRampToValueAtTime(120, startTime + 0.1);
  snapGain.gain.setValueAtTime(0.3 * volume, startTime + 0.04);
  snapGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);
  snap.connect(snapGain).connect(ctx.destination);
  snap.start(startTime + 0.04);
  snap.stop(startTime + 0.12);

  // 锯子拉锯声（锯齿波快速颤音，模拟锯齿来回拉切）
  const saw = ctx.createOscillator();
  const sawGain = ctx.createGain();
  saw.type = 'sawtooth';
  saw.frequency.setValueAtTime(180, startTime);
  // 模拟来回拉锯的频率波动
  saw.frequency.linearRampToValueAtTime(220, startTime + 0.02);
  saw.frequency.linearRampToValueAtTime(170, startTime + 0.04);
  saw.frequency.linearRampToValueAtTime(210, startTime + 0.06);
  saw.frequency.linearRampToValueAtTime(160, startTime + 0.08);
  const sawFilter = ctx.createBiquadFilter();
  sawFilter.type = 'lowpass';
  sawFilter.frequency.setValueAtTime(1200, startTime);
  sawFilter.Q.value = 1;
  sawGain.gain.setValueAtTime(0.2 * volume, startTime);
  sawGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);
  saw.connect(sawFilter).connect(sawGain).connect(ctx.destination);
  saw.start(startTime);
  saw.stop(startTime + 0.1);

  // 锯切木屑声（中频噪声脉冲）
  const sawdust = ctx.createBufferSource();
  sawdust.buffer = createNoiseBuffer(ctx, 0.1);
  const sawdustFilter = ctx.createBiquadFilter();
  sawdustFilter.type = 'bandpass';
  sawdustFilter.frequency.setValueAtTime(1500, startTime);
  sawdustFilter.Q.value = 1.5;
  const sawdustGain = ctx.createGain();
  sawdustGain.gain.setValueAtTime(0.12 * volume, startTime);
  sawdustGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);
  sawdust.connect(sawdustFilter).connect(sawdustGain).connect(ctx.destination);
  sawdust.start(startTime);
  sawdust.stop(startTime + 0.1);
}

// 种植：翻土的沙沙声
export function playPlantSound() {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;

  // 翻土声 - 棕噪声 + 低通滤波
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, 0.5, 'brown');
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(400, now);
  filter.frequency.linearRampToValueAtTime(800, now + 0.1);
  filter.frequency.linearRampToValueAtTime(300, now + 0.4);
  filter.Q.value = 2;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.35, now + 0.05);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  noise.connect(filter).connect(gain).connect(ctx.destination);
  noise.start(now);
  noise.stop(now + 0.5);

  // 铲子入土的轻微金属声
  const dig = ctx.createOscillator();
  const digGain = ctx.createGain();
  dig.type = 'triangle';
  dig.frequency.setValueAtTime(600, now + 0.02);
  dig.frequency.exponentialRampToValueAtTime(150, now + 0.12);
  digGain.gain.setValueAtTime(0.1, now + 0.02);
  digGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  dig.connect(digGain).connect(ctx.destination);
  dig.start(now + 0.02);
  dig.stop(now + 0.12);
}

// 建造建筑：沉闷的锤打声（原砍伐风格）
export function playBuildSound() {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;

  // 第一下锤击
  playOneBuildHit(ctx, now, 0.6);
  // 第二下锤击（稍延迟，稍轻）
  playOneBuildHit(ctx, now + 0.22, 0.45);
  // 第三下（最重，完工）
  playOneBuildHit(ctx, now + 0.48, 0.65);
}

function playOneBuildHit(ctx, startTime, volume = 1.0) {
  // 低频冲击（锤头击中）
  const impact = ctx.createOscillator();
  const impactGain = ctx.createGain();
  impact.type = 'sine';
  impact.frequency.setValueAtTime(80, startTime);
  impact.frequency.exponentialRampToValueAtTime(30, startTime + 0.25);
  impactGain.gain.setValueAtTime(0.55 * volume, startTime);
  impactGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
  impact.connect(impactGain).connect(ctx.destination);
  impact.start(startTime);
  impact.stop(startTime + 0.35);

  // 次低频共鸣（材料振动）
  const resonate = ctx.createOscillator();
  const resonateGain = ctx.createGain();
  resonate.type = 'triangle';
  resonate.frequency.setValueAtTime(120, startTime);
  resonate.frequency.exponentialRampToValueAtTime(50, startTime + 0.3);
  resonateGain.gain.setValueAtTime(0.25 * volume, startTime);
  resonateGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
  resonate.connect(resonateGain).connect(ctx.destination);
  resonate.start(startTime);
  resonate.stop(startTime + 0.35);

  // 碎裂噪声
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, 0.2);
  const noiseGain = ctx.createGain();
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(1200, startTime);
  noiseFilter.Q.value = 0.8;
  noiseGain.gain.setValueAtTime(0.2 * volume, startTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
  noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
  noise.start(startTime);
  noise.stop(startTime + 0.2);

  // 低沉锤击声
  const crack = ctx.createOscillator();
  const crackGain = ctx.createGain();
  crack.type = 'square';
  crack.frequency.setValueAtTime(400, startTime);
  crack.frequency.exponentialRampToValueAtTime(80, startTime + 0.08);
  crackGain.gain.setValueAtTime(0.15 * volume, startTime);
  crackGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);
  crack.connect(crackGain).connect(ctx.destination);
  crack.start(startTime);
  crack.stop(startTime + 0.1);

  // 极低频余震
  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(40, startTime + 0.02);
  sub.frequency.exponentialRampToValueAtTime(20, startTime + 0.4);
  subGain.gain.setValueAtTime(0.2 * volume, startTime + 0.02);
  subGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
  sub.connect(subGain).connect(ctx.destination);
  sub.start(startTime + 0.02);
  sub.stop(startTime + 0.4);
}

// 研发：开锁声
export function playResearchSound() {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;

  // 金属碰撞 - 锁的咔嗒
  const click1 = ctx.createOscillator();
  const click1Gain = ctx.createGain();
  click1.type = 'square';
  click1.frequency.setValueAtTime(2500, now);
  click1.frequency.exponentialRampToValueAtTime(1200, now + 0.03);
  click1Gain.gain.setValueAtTime(0.15, now);
  click1Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
  click1.connect(click1Gain).connect(ctx.destination);
  click1.start(now);
  click1.stop(now + 0.04);

  // 弹簧声 - 上升的频率扫描
  const spring = ctx.createOscillator();
  const springGain = ctx.createGain();
  spring.type = 'sine';
  spring.frequency.setValueAtTime(400, now + 0.08);
  spring.frequency.exponentialRampToValueAtTime(2000, now + 0.3);
  springGain.gain.setValueAtTime(0, now + 0.08);
  springGain.gain.linearRampToValueAtTime(0.12, now + 0.12);
  springGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  spring.connect(springGain).connect(ctx.destination);
  spring.start(now + 0.08);
  spring.stop(now + 0.35);

  // 开锁的"咔哒"确认声
  const unlock = ctx.createOscillator();
  const unlockGain = ctx.createGain();
  unlock.type = 'triangle';
  unlock.frequency.setValueAtTime(1800, now + 0.35);
  unlock.frequency.exponentialRampToValueAtTime(900, now + 0.4);
  unlockGain.gain.setValueAtTime(0.2, now + 0.35);
  unlockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
  unlock.connect(unlockGain).connect(ctx.destination);
  unlock.start(now + 0.35);
  unlock.stop(now + 0.45);

  // 光芒闪烁 - 高频泛音
  const shimmer = ctx.createOscillator();
  const shimmerGain = ctx.createGain();
  shimmer.type = 'sine';
  shimmer.frequency.setValueAtTime(3000, now + 0.4);
  shimmer.frequency.exponentialRampToValueAtTime(5000, now + 0.7);
  shimmerGain.gain.setValueAtTime(0.06, now + 0.4);
  shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
  shimmer.connect(shimmerGain).connect(ctx.destination);
  shimmer.start(now + 0.4);
  shimmer.stop(now + 0.7);
}

// 操作失败：警告声
export function playErrorSound() {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;

  // 低沉的"嗡"警告
  const buzz = ctx.createOscillator();
  const buzzGain = ctx.createGain();
  buzz.type = 'sawtooth';
  buzz.frequency.setValueAtTime(180, now);
  buzzGain.gain.setValueAtTime(0.15, now);
  buzzGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  buzz.connect(buzzGain).connect(ctx.destination);
  buzz.start(now);
  buzz.stop(now + 0.3);

  // 双音警告
  const warn1 = ctx.createOscillator();
  const warn1Gain = ctx.createGain();
  warn1.type = 'square';
  warn1.frequency.setValueAtTime(300, now + 0.05);
  warn1Gain.gain.setValueAtTime(0.08, now + 0.05);
  warn1Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  warn1.connect(warn1Gain).connect(ctx.destination);
  warn1.start(now + 0.05);
  warn1.stop(now + 0.15);

  const warn2 = ctx.createOscillator();
  const warn2Gain = ctx.createGain();
  warn2.type = 'square';
  warn2.frequency.setValueAtTime(220, now + 0.18);
  warn2Gain.gain.setValueAtTime(0.08, now + 0.18);
  warn2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
  warn2.connect(warn2Gain).connect(ctx.destination);
  warn2.start(now + 0.18);
  warn2.stop(now + 0.28);
}

// 资源产出：经典的获取资源音效（上升的叮咚声）
export function playResourceGainSound() {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;

  // 上升音阶：叮-叮-咚
  const notes = [
    { time: 0, freq: 523.25, vol: 0.12, dur: 0.12 },   // C5
    { time: 0.08, freq: 659.25, vol: 0.12, dur: 0.12 }, // E5
    { time: 0.16, freq: 783.99, vol: 0.15, dur: 0.2 },  // G5
  ];

  for (const note of notes) {
    const t = now + note.time;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(note.freq, t);
    gain.gain.setValueAtTime(note.vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + note.dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + note.dur);

    // 泛音（更亮的音色）
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(note.freq * 2, t);
    gain2.gain.setValueAtTime(note.vol * 0.3, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + note.dur * 0.6);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(t);
    osc2.stop(t + note.dur * 0.6);
  }
}

// 树木长成/生态林长成：树叶沙沙声
export function playGrowthSound() {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;

  // 树叶沙沙 - 粉噪声 + 带通滤波
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, 0.8, 'pink');
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1500, now);
  filter.frequency.linearRampToValueAtTime(3000, now + 0.2);
  filter.frequency.linearRampToValueAtTime(2000, now + 0.6);
  filter.Q.value = 3;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
  gain.gain.setValueAtTime(0.2, now + 0.1);
  gain.gain.linearRampToValueAtTime(0.15, now + 0.3);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
  noise.connect(filter).connect(gain).connect(ctx.destination);
  noise.start(now);
  noise.stop(now + 0.8);

  // 轻微的"噗"声（树叶展开）
  const poof = ctx.createOscillator();
  const poofGain = ctx.createGain();
  poof.type = 'sine';
  poof.frequency.setValueAtTime(200, now + 0.15);
  poof.frequency.exponentialRampToValueAtTime(400, now + 0.3);
  poofGain.gain.setValueAtTime(0.08, now + 0.15);
  poofGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  poof.connect(poofGain).connect(ctx.destination);
  poof.start(now + 0.15);
  poof.stop(now + 0.4);

  // 风声轻拂
  const wind = ctx.createBufferSource();
  wind.buffer = createNoiseBuffer(ctx, 0.6, 'brown');
  const windFilter = ctx.createBiquadFilter();
  windFilter.type = 'lowpass';
  windFilter.frequency.setValueAtTime(600, now + 0.2);
  windFilter.frequency.linearRampToValueAtTime(1200, now + 0.35);
  windFilter.frequency.linearRampToValueAtTime(400, now + 0.6);
  const windGain = ctx.createGain();
  windGain.gain.setValueAtTime(0, now + 0.2);
  windGain.gain.linearRampToValueAtTime(0.1, now + 0.3);
  windGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  wind.connect(windFilter).connect(windGain).connect(ctx.destination);
  wind.start(now + 0.2);
  wind.stop(now + 0.6);
}

// 文明等级提升：激昂欢快的进行曲（~2.5秒）
export function playLevelUpMusic() {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;

  // 第一乐句：号角式上行（0~1.2s）
  const melody1 = [
    { time: 0,    freq: 523.25, dur: 0.15, vol: 0.15 },  // C5
    { time: 0.12, freq: 587.33, dur: 0.15, vol: 0.15 },  // D5
    { time: 0.24, freq: 659.25, dur: 0.15, vol: 0.15 },  // E5
    { time: 0.36, freq: 783.99, dur: 0.25, vol: 0.18 },  // G5
    { time: 0.55, freq: 880.00, dur: 0.2,  vol: 0.16 },  // A5
    { time: 0.72, freq: 1046.50, dur: 0.45, vol: 0.2 },  // C6
  ];

  // 第二乐句：下行后再上行（1.2~2.5s）
  const melody2 = [
    { time: 1.2,  freq: 880.00, dur: 0.15, vol: 0.14 },  // A5
    { time: 1.32, freq: 783.99, dur: 0.15, vol: 0.14 },  // G5
    { time: 1.44, freq: 659.25, dur: 0.15, vol: 0.15 },  // E5
    { time: 1.56, freq: 783.99, dur: 0.2,  vol: 0.16 },  // G5
    { time: 1.72, freq: 880.00, dur: 0.2,  vol: 0.17 },  // A5
    { time: 1.88, freq: 1046.50, dur: 0.6, vol: 0.22 },  // C6 (收尾长音)
  ];

  const allMelody = [...melody1, ...melody2];

  // 和弦伴奏
  const chords = [
    { time: 0,    freqs: [261.63, 329.63, 392.00], dur: 0.4, vol: 0.06 },  // C
    { time: 0.36, freqs: [293.66, 369.99, 440.00], dur: 0.3, vol: 0.06 },  // D
    { time: 0.72, freqs: [261.63, 329.63, 523.25], dur: 0.5, vol: 0.07 },  // C oct
    { time: 1.2,  freqs: [220.00, 277.18, 329.63], dur: 0.35, vol: 0.06 }, // Am
    { time: 1.56, freqs: [293.66, 369.99, 440.00], dur: 0.3, vol: 0.06 }, // D
    { time: 1.88, freqs: [261.63, 329.63, 392.00, 523.25], dur: 0.7, vol: 0.08 }, // C maj7
  ];

  // 播放主旋律
  for (const note of allMelody) {
    const t = now + note.time;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(note.freq, t);
    gain.gain.setValueAtTime(note.vol, t);
    gain.gain.setValueAtTime(note.vol, t + note.dur * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, t + note.dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + note.dur);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(note.freq * 2, t);
    gain2.gain.setValueAtTime(note.vol * 0.25, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + note.dur * 0.5);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(t);
    osc2.stop(t + note.dur * 0.5);
  }

  // 播放和弦
  for (const chord of chords) {
    for (const freq of chord.freqs) {
      const t = now + chord.time;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(chord.vol, t);
      gain.gain.setValueAtTime(chord.vol, t + chord.dur * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, t + chord.dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + chord.dur);
    }
  }

  // 鼓点
  const drumHits = [0, 0.36, 0.72, 1.2, 1.56, 1.88];
  for (const dt of drumHits) {
    const t = now + dt;
    const kick = ctx.createOscillator();
    const kickGain = ctx.createGain();
    kick.type = 'sine';
    kick.frequency.setValueAtTime(150, t);
    kick.frequency.exponentialRampToValueAtTime(50, t + 0.1);
    kickGain.gain.setValueAtTime(0.13, t);
    kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    kick.connect(kickGain).connect(ctx.destination);
    kick.start(t);
    kick.stop(t + 0.12);
  }

  // 结尾铙钹
  const cymbal = ctx.createBufferSource();
  cymbal.buffer = createNoiseBuffer(ctx, 0.8, 'white');
  const cymFilter = ctx.createBiquadFilter();
  cymFilter.type = 'highpass';
  cymFilter.frequency.value = 6000;
  const cymGain = ctx.createGain();
  cymGain.gain.setValueAtTime(0, now + 1.88);
  cymGain.gain.linearRampToValueAtTime(0.06, now + 1.9);
  cymGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
  cymbal.connect(cymFilter).connect(cymGain).connect(ctx.destination);
  cymbal.start(now + 1.88);
  cymbal.stop(now + 2.5);
}

// 游戏胜利：欢庆凯旋进行曲（~3.5秒）
export function playVictoryMusic() {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;

  // 第一乐句：凯旋号角（0~1.5s）
  const melody1 = [
    { time: 0,    freq: 523.25, dur: 0.18, vol: 0.15 },  // C5
    { time: 0.15, freq: 659.25, dur: 0.18, vol: 0.15 },  // E5
    { time: 0.3,  freq: 783.99, dur: 0.18, vol: 0.17 },  // G5
    { time: 0.48, freq: 880.00, dur: 0.18, vol: 0.15 },  // A5
    { time: 0.65, freq: 1046.50, dur: 0.4,  vol: 0.2 },  // C6
    { time: 1.05, freq: 880.00, dur: 0.2,  vol: 0.14 },  // A5
    { time: 1.2,  freq: 1046.50, dur: 0.3,  vol: 0.16 }, // C6
  ];

  // 第二乐句：发展（1.5~3.2s）
  const melody2 = [
    { time: 1.5,  freq: 1174.66, dur: 0.2,  vol: 0.18 },  // D6
    { time: 1.68, freq: 1318.51, dur: 0.15, vol: 0.17 },  // E6
    { time: 1.8,  freq: 1174.66, dur: 0.15, vol: 0.16 },  // D6
    { time: 1.92, freq: 1046.50, dur: 0.2,  vol: 0.15 },  // C6
    { time: 2.1,  freq: 880.00, dur: 0.2,  vol: 0.14 },  // A5
    { time: 2.28, freq: 1046.50, dur: 0.3,  vol: 0.17 },  // C6
    { time: 2.55, freq: 1174.66, dur: 0.8,  vol: 0.22 },  // D6 (收尾长音)
  ];

  const allMelody = [...melody1, ...melody2];

  // 和弦进行
  const chords = [
    { time: 0,    freqs: [261.63, 329.63, 392.00], dur: 0.4, vol: 0.06 },  // C
    { time: 0.48, freqs: [220.00, 277.18, 329.63], dur: 0.3, vol: 0.06 },  // Am
    { time: 0.65, freqs: [261.63, 329.63, 523.25], dur: 0.4, vol: 0.07 },  // C oct
    { time: 1.5,  freqs: [293.66, 369.99, 440.00], dur: 0.3, vol: 0.06 },  // Dm
    { time: 1.92, freqs: [220.00, 277.18, 329.63], dur: 0.3, vol: 0.06 },  // Am
    { time: 2.28, freqs: [261.63, 329.63, 392.00, 523.25], dur: 0.9, vol: 0.08 }, // C maj7
  ];

  // 播放主旋律
  for (const note of allMelody) {
    const t = now + note.time;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(note.freq, t);
    gain.gain.setValueAtTime(note.vol, t);
    gain.gain.setValueAtTime(note.vol, t + note.dur * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, t + note.dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + note.dur);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(note.freq * 2, t);
    gain2.gain.setValueAtTime(note.vol * 0.2, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + note.dur * 0.4);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(t);
    osc2.stop(t + note.dur * 0.4);
  }

  // 播放和弦
  for (const chord of chords) {
    for (const freq of chord.freqs) {
      const t = now + chord.time;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(chord.vol, t);
      gain.gain.setValueAtTime(chord.vol, t + chord.dur * 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, t + chord.dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + chord.dur);
    }
  }

  // 鼓点
  const drumTimes = [0, 0.3, 0.65, 1.5, 1.92, 2.28];
  for (const dt of drumTimes) {
    const t = now + dt;
    const kick = ctx.createOscillator();
    const kickGain = ctx.createGain();
    kick.type = 'sine';
    kick.frequency.setValueAtTime(150, t);
    kick.frequency.exponentialRampToValueAtTime(50, t + 0.08);
    kickGain.gain.setValueAtTime(0.1, t);
    kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    kick.connect(kickGain).connect(ctx.destination);
    kick.start(t);
    kick.stop(t + 0.1);
  }

  // 结尾铙钹
  const cymbal = ctx.createBufferSource();
  cymbal.buffer = createNoiseBuffer(ctx, 1.0, 'white');
  const cymFilter = ctx.createBiquadFilter();
  cymFilter.type = 'highpass';
  cymFilter.frequency.value = 5000;
  const cymGain = ctx.createGain();
  cymGain.gain.setValueAtTime(0, now + 2.55);
  cymGain.gain.linearRampToValueAtTime(0.08, now + 2.58);
  cymGain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);
  cymbal.connect(cymFilter).connect(cymGain).connect(ctx.destination);
  cymbal.start(now + 2.55);
  cymbal.stop(now + 3.5);
}

// 游戏失败：低沉悲凉的音乐（~4.5秒）
export function playGameOverMusic() {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;

  // 第一乐句：下行悲凉旋律（0~2s）
  const melody1 = [
    { time: 0,    freq: 392.00, dur: 0.4,  vol: 0.15 },  // G4
    { time: 0.35, freq: 349.23, dur: 0.4,  vol: 0.14 },  // F4
    { time: 0.7,  freq: 329.63, dur: 0.35, vol: 0.13 },  // E4
    { time: 1.0,  freq: 293.66, dur: 0.45, vol: 0.13 },  // D4
    { time: 1.4,  freq: 261.63, dur: 0.6,  vol: 0.14 },  // C4
  ];

  // 第二乐句：更深的下行（2~4.5s）
  const melody2 = [
    { time: 2.2,  freq: 293.66, dur: 0.35, vol: 0.13 },  // D4
    { time: 2.5,  freq: 261.63, dur: 0.35, vol: 0.12 },  // C4
    { time: 2.8,  freq: 220.00, dur: 0.4,  vol: 0.12 },  // A3
    { time: 3.15, freq: 196.00, dur: 0.4,  vol: 0.13 },  // G3
    { time: 3.5,  freq: 146.83, dur: 0.9,  vol: 0.14 },  // D3 (低沉收尾)
  ];

  const allMelody = [...melody1, ...melody2];

  // 不协和和弦
  const chords = [
    { time: 0,    freqs: [196.00, 233.08, 293.66], dur: 0.4,  vol: 0.05 },  // G dim
    { time: 0.35, freqs: [174.61, 220.00, 261.63], dur: 0.4,  vol: 0.05 },  // Fm
    { time: 0.7,  freqs: [164.81, 196.00, 246.94], dur: 0.35, vol: 0.05 }, // E dim
    { time: 1.0,  freqs: [146.83, 185.00, 220.00], dur: 0.45, vol: 0.05 }, // D dim
    { time: 1.4,  freqs: [130.81, 164.81, 196.00], dur: 0.6,  vol: 0.06 }, // Cm
    { time: 2.2,  freqs: [146.83, 174.61, 220.00], dur: 0.35, vol: 0.05 }, // Dm
    { time: 2.5,  freqs: [130.81, 164.81, 196.00], dur: 0.35, vol: 0.05 }, // Cm
    { time: 2.8,  freqs: [110.00, 138.59, 164.81], dur: 0.4,  vol: 0.05 }, // Am
    { time: 3.15, freqs: [98.00, 130.81, 164.81],  dur: 0.4,  vol: 0.06 },  // Gm
    { time: 3.5,  freqs: [73.42, 116.54, 146.83],  dur: 0.9,  vol: 0.07 },  // D dim deep
  ];

  // 播放主旋律
  for (const note of allMelody) {
    const t = now + note.time;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(note.freq, t);
    gain.gain.setValueAtTime(note.vol, t);
    gain.gain.setValueAtTime(note.vol * 0.9, t + note.dur * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, t + note.dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + note.dur);
  }

  // 播放和弦
  for (const chord of chords) {
    for (const freq of chord.freqs) {
      const t = now + chord.time;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(chord.vol, t);
      gain.gain.setValueAtTime(chord.vol, t + chord.dur * 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, t + chord.dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + chord.dur);
    }
  }

  // 低频隆隆声（末日感）
  const rumble = ctx.createOscillator();
  const rumbleGain = ctx.createGain();
  rumble.type = 'sine';
  rumble.frequency.setValueAtTime(40, now);
  rumble.frequency.linearRampToValueAtTime(30, now + 2.0);
  rumble.frequency.exponentialRampToValueAtTime(20, now + 4.5);
  rumbleGain.gain.setValueAtTime(0, now);
  rumbleGain.gain.linearRampToValueAtTime(0.1, now + 0.5);
  rumbleGain.gain.setValueAtTime(0.1, now + 3.0);
  rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 4.5);
  rumble.connect(rumbleGain).connect(ctx.destination);
  rumble.start(now);
  rumble.stop(now + 4.5);

  // 风声（凄凉感）
  const wind = ctx.createBufferSource();
  wind.buffer = createNoiseBuffer(ctx, 4.5, 'brown');
  const windFilter = ctx.createBiquadFilter();
  windFilter.type = 'lowpass';
  windFilter.frequency.setValueAtTime(300, now);
  windFilter.frequency.linearRampToValueAtTime(600, now + 1.0);
  windFilter.frequency.linearRampToValueAtTime(800, now + 2.5);
  windFilter.frequency.linearRampToValueAtTime(200, now + 4.0);
  const windGain = ctx.createGain();
  windGain.gain.setValueAtTime(0, now);
  windGain.gain.linearRampToValueAtTime(0.06, now + 0.8);
  windGain.gain.setValueAtTime(0.06, now + 2.0);
  windGain.gain.exponentialRampToValueAtTime(0.001, now + 4.0);
  wind.connect(windFilter).connect(windGain).connect(ctx.destination);
  wind.start(now);
  wind.stop(now + 4.5);
}
