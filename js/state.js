// === CO2STER - Game State Management ===

export const gameState = {
  resources: 0,
  co2: 0,
  displayCo2: 0,  // 用于平滑动画的显示值，逐帧逼近co2
  power: 0,
  sciPoints: 0,
  turn: 1,
  actionPoints: 5,
  maxActionPoints: 5,
  civilizationLevel: 0,
  greenhouseEffect: false,
  gameOver: false,
  gameWon: false,
  victoryReady: false,  // 胜利条件已满足，等待玩家点击按钮
  unlockedResearches: []  // 已解锁的研究项目ID列表
};

export const industrialResidue = []; // { r, c, co2, turnsLeft }

// CO2粒子
export const co2Particles = [];

// CO2气态动画粒子（产出/吸收）
export const co2AnimParticles = [];

// UI 状态
export const uiState = {
  selectedTile: null,     // { row, col }
  actionPanel: null,      // { x, y, actions: [...] }
  showResourceDetail: false,
  showTechTree: false,
  isSettling: false,
  settlePhase: 0,
  settleTimer: 0,
  mouseX: 0,
  mouseY: 0
};

// 回合结算数据
export let settleData = {
  production: [],
  consumption: [],
  co2: [],
  power: [],
  sciPoints: [],
  growing: [],
  ecoGrowing: []
};

export function setSettleData(data) {
  settleData = data;
}

// 回合结算动画
export const settlementAnims = []; // { x, y, text, color, alpha, vy, delay }

// 建筑台词飘出动画
export const dialogueAnims = []; // { x, y, text, alpha, vy, life, maxLife }

// 台词调度计时器（每个tile独立计时）
export const dialogueTimers = {}; // key: "r_c" => { nextTime: timestamp }

// 碳兽进食动画状态
export const beastState = {
  feeding: false,        // 是否正在进食
  feedIntensity: 0,     // 进食强度 0~1（CO2产出量映射）
  feedTimer: 0,         // 进食动画计时器
  feedDuration: 2.0,    // 进食动画持续秒数
  mouthOpenness: 0,     // 嘴巴张开程度 0~1（平滑过渡用）
  eyeExcitement: 0,     // 眼睛兴奋度 0~1
  bodySwelling: 0,      // 身体膨胀度 0~1
  // 嘴部屏幕坐标（由 game.js 每帧更新，供 effects.js 粒子吸引使用）
  mouthScreenX: 0,
  mouthScreenY: 0,
};

// 碳兽台词动画（屏幕上方随机位置浮现，无边框，随机旋转角度）
// 最多3条台词同时存在
// 每条: { text, alpha, x, y, rotation, phase: 'fadein'|'hold'|'fadeout', holdTimer, fontSize, color }
export const beastDialogues = [];

// 游戏序言/文明等级提示状态
export const prologueState = {
  active: false,         // 是否正在播放
  level: 0,             // 当前显示的文明等级
  alpha: 0,             // 当前透明度
  phase: 'fadein',      // fadein → hold → fadeout → done
  timer: 0,             // 帧计数器
  fadeFrames: 40,       // 淡入/淡出帧数 (~0.67秒)
  holdFrames: 150,      // 停留帧数 (~2.5秒)
};

export function triggerPrologue(level) {
  prologueState.active = true;
  prologueState.level = level;
  prologueState.alpha = 0;
  prologueState.phase = 'fadein';
  prologueState.timer = 0;
}

// 开场指引状态
export const introState = {
  active: true,         // 游戏开始时激活
  phase: 'fadein',      // fadein → hold → fadeout → done
  timer: 0,
  fadeFrames: 60,       // 淡入帧数 (~1秒)
  holdFrames: 240,      // 停留帧数 (~4秒)
  fadeOutFrames: 60,    // 淡出帧数 (~1秒)
  alpha: 0,
};

// 结局动画状态
export const endingState = {
  active: false,
  type: '',              // 'bad' | 'good'
  phase: '',             // bad: 'feeding' → 'spiral' → 'title' | good: 'explode' → 'scatter' → 'title'
  timer: 0,
  alpha: 0,
  // 坏结局：地图螺旋缩放参数
  mapScale: 1,
  mapRotation: 0,
  mapOffsetX: 0,
  mapOffsetY: 0,
  // 好结局：碳兽爆炸粒子
  explodeParticles: [],  // { x, y, vx, vy, size, alpha, color, life }
  // 结局文案
  textAlpha: 0,
  currentTextLine: 0,
  textTimer: 0,
};

export function triggerEnding(type) {
  const s = endingState;
  s.active = true;
  s.type = type;
  s.phase = type === 'bad' ? 'feeding' : 'shrink';
  s.timer = 0;
  s.alpha = 0;
  s.mapScale = 1;
  s.mapRotation = 0;
  s.mapOffsetX = 0;
  s.mapOffsetY = 0;
  s.explodeParticles = [];
  s.textAlpha = 0;
  s.currentTextLine = 0;
  s.textTimer = 0;
  // 好结局：碳兽缩小到中等CO2形象的参数
  s.shrinkTimer = 0;
  s.shrinkDuration = 90; // 约1.5秒
  s.shrinkCo2 = 60; // 缩小目标：中等CO2值
  s.shrinkDone = false;
}
