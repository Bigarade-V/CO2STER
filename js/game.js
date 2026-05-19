// === CO2STER - Game Entry Point (Enhanced 2D Art)

import { HEX_R, HEX_W, V_SPACING, ROWS, COLS, PERSPECTIVE } from './config.js';
import { gameState, co2Particles, co2AnimParticles, uiState, settlementAnims, industrialResidue, beastState, dialogueAnims, dialogueTimers, beastDialogues, prologueState, triggerPrologue, endingState, triggerEnding, introState } from './state.js';
import { TILE_TYPES } from './tile-types.js';
import { tiles, initTiles, setCanvasSize, getTileCenter, getTileEffectiveStats } from './map.js';
import { updateSettlementAnims, processSettlePhase, addSettlementAnim } from './settle.js';
import { initInput } from './input.js';
import { drawHexTile } from './render/hex.js';
import { drawTileDecorations } from './render/buildings.js';
import { drawResourceUI, drawResourceDetailPanel, drawActionPointUI, drawCO2UI, drawPowerUI, drawSciPointsUI, drawTurnUI, drawCivilizationUI, drawCrisisUI, drawActionPanel, drawTechTreePanel, drawResearchPanel, drawGameOverScreen, drawCO2AbsorbUI, drawCO2TopUI } from './render/ui.js';
import { drawCO2Particles, drawCO2AnimParticles, updateCO2AnimParticles, drawSettlementAnims, updateDialogueAnims, drawDialogueAnims, updateBeastDialogueAnim, drawBeastDialogueAnim, updatePrologue, drawPrologue, updateEndingAnim, getEndingMapTransform, shouldHideBeast, drawEndingOverlay, updateIntro, drawIntro, getShrinkGazeRatio } from './render/effects.js';
import { hexCorners } from './render/hex.js';
import { updateBGM, startBGM } from './bgm.js';
import { BUILDING_DIALOGUES, getDialogueKey, pickDialogue, pickBeastDialogue, BEAST_DIALOGUES } from './dialogues.js';

// 全局暴露 addSettlementAnim 供 input.js 使用
window.__addSettlementAnim = addSettlementAnim;

// Canvas 初始化
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// === 预生成云朵 ===
let clouds = [];

function generateClouds(w, h) {
  clouds = [];
  const count = 6 + Math.floor(Math.random() * 5);
  for (let i = 0; i < count; i++) {
    clouds.push({
      x: Math.random() * w * 1.4 - w * 0.2,
      y: 20 + Math.random() * h * 0.3,
      w: 80 + Math.random() * 160,
      h: 30 + Math.random() * 40,
      speed: 0.15 + Math.random() * 0.3,
      alpha: 0.3 + Math.random() * 0.4,
      blobs: []
    });
    // 每朵云生成3-6个圆形"blob"组合
    const blobCount = 3 + Math.floor(Math.random() * 4);
    for (let j = 0; j < blobCount; j++) {
      clouds[clouds.length - 1].blobs.push({
        ox: (Math.random() - 0.3) * clouds[clouds.length - 1].w * 0.7,
        oy: (Math.random() - 0.5) * clouds[clouds.length - 1].h * 0.5,
        r: 20 + Math.random() * 35
      });
    }
  }
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  setCanvasSize(canvas.width, canvas.height);
  generateClouds(canvas.width, canvas.height);
}

resizeCanvas();
window.addEventListener('resize', () => {
  resizeCanvas();
  draw();
});

// 初始化地图
initTiles();

// 初始化输入
initInput(canvas);

// === 凝视之眼绘制 ===
function drawGazeEye(ctx, x, y, eyeRadius, gazeRatio, t, isSubEye = false) {
  const pupilRadius = eyeRadius * 0.45;
  const irisRadius = eyeRadius * 0.7;

  // 眼眶暗影 - 微妙的深色区域让眼睛从背景中浮现
  const socketGrad = ctx.createRadialGradient(x, y, irisRadius * 0.8, x, y, eyeRadius * 2.5);
  socketGrad.addColorStop(0, 'rgba(0,0,0,0.5)');
  socketGrad.addColorStop(0.5, 'rgba(10,5,0,0.2)');
  socketGrad.addColorStop(1, 'rgba(20,10,5,0)');
  ctx.fillStyle = socketGrad;
  ctx.beginPath();
  ctx.ellipse(x, y, eyeRadius * 2.5, eyeRadius * 1.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // 虹膜 - 深邃的暗红/暗橙色
  const irisGrad = ctx.createRadialGradient(x, y, pupilRadius, x, y, irisRadius);
  irisGrad.addColorStop(0, 'rgba(120,30,10,0.9)');
  irisGrad.addColorStop(0.3, 'rgba(100,25,8,0.8)');
  irisGrad.addColorStop(0.6, 'rgba(80,20,5,0.6)');
  irisGrad.addColorStop(1, 'rgba(40,10,0,0.3)');
  ctx.fillStyle = irisGrad;
  ctx.beginPath();
  ctx.arc(x, y, irisRadius, 0, Math.PI * 2);
  ctx.fill();

  if (!isSubEye) {
    // 虹膜纹理环 - 仅主眼绘制
    ctx.strokeStyle = 'rgba(140,40,10,0.3)';
    ctx.lineWidth = 0.5;
    for (let ring = 0; ring < 4; ring++) {
      const rr = pupilRadius + (irisRadius - pupilRadius) * (ring / 4);
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // 瞳孔 - 深渊般的纯黑
  const pupilGrad = ctx.createRadialGradient(x, y, 0, x, y, pupilRadius);
  pupilGrad.addColorStop(0, 'rgba(0,0,0,1)');
  pupilGrad.addColorStop(0.7, 'rgba(0,0,0,0.95)');
  pupilGrad.addColorStop(1, 'rgba(5,0,0,0.8)');
  ctx.fillStyle = pupilGrad;
  ctx.beginPath();
  ctx.arc(x, y, pupilRadius, 0, Math.PI * 2);
  ctx.fill();

  // 瞳孔中的微光 - 似有生命
  const glintPhase = Math.sin(t * 0.5) * 0.3 + 0.7;
  const glintGrad = ctx.createRadialGradient(x - pupilRadius * 0.3, y - pupilRadius * 0.3, 0, x, y, pupilRadius * 0.5);
  glintGrad.addColorStop(0, `rgba(180,60,20,${glintPhase * 0.4})`);
  glintGrad.addColorStop(1, 'rgba(100,20,5,0)');
  ctx.fillStyle = glintGrad;
  ctx.beginPath();
  ctx.arc(x, y, pupilRadius * 0.5, 0, Math.PI * 2);
  ctx.fill();

  // 不祥红光晕
  const glowPulse = Math.sin(t * 0.8) * 0.15 + 0.85;
  const glowGrad = ctx.createRadialGradient(x, y, eyeRadius * 0.5, x, y, eyeRadius * 3);
  glowGrad.addColorStop(0, `rgba(150,40,10,${0.15 * glowPulse})`);
  glowGrad.addColorStop(0.5, `rgba(100,20,5,${0.06 * glowPulse})`);
  glowGrad.addColorStop(1, 'rgba(60,10,0,0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(x, y, eyeRadius * 3, 0, Math.PI * 2);
  ctx.fill();
}

// === 碳兽 - 完整怪物渲染（压迫感增强版 + 进食动画）===
function drawCarbonBeast(ctx, cx, cy, baseSize, gazeRatio, t) {
  const feed = beastState.mouthOpenness;   // 0~1 嘴巴张开程度
  const excite = beastState.eyeExcitement;  // 0~1 眼睛兴奋度
  const swell = beastState.bodySwelling;    // 0~1 身体膨胀度

  // 呼吸动画：缓慢的膨胀收缩 + 上下浮动 + 进食膨胀
  const breathPhase = Math.sin(t * 0.4) * 0.05;
  const floatPhase = Math.sin(t * 0.25) * baseSize * 0.025;
  const size = baseSize * (1 + breathPhase + swell * 0.12);
  const by = cy - baseSize * 0.15 + floatPhase - swell * baseSize * 0.02;

  ctx.save();
  ctx.translate(cx, by);

  // ====== 0. 最底层：巨大的暗影投射（脚下/身下暗影）======
  const shadowGrad = ctx.createRadialGradient(0, size * 0.7, 0, 0, size * 0.7, size * 1.8);
  shadowGrad.addColorStop(0, `rgba(0,0,0,${0.18 * gazeRatio})`);
  shadowGrad.addColorStop(0.4, `rgba(5,2,0,${0.08 * gazeRatio})`);
  shadowGrad.addColorStop(1, 'rgba(10,5,0,0)');
  ctx.beginPath();
  ctx.ellipse(0, size * 0.7, size * 1.8, size * 0.6, 0, 0, Math.PI * 2);
  ctx.fillStyle = shadowGrad;
  ctx.fill();

  // ====== 1. 怪物主体（浓烟/煤灰构成的不定形体 — 无清晰轮廓）======
  // 使用多个大范围、低透明度的烟雾层叠加，中心略实、边缘完全弥散
  const smokeLayers = [
    // 最外层弥散烟雾 — 极低alpha，消除硬边界
    { ox: 0, oy: size * 0.05, rx: size * 1.4, ry: size * 1.55, alpha: 0.12 },
    // 核心躯干
    { ox: 0, oy: size * 0.05, rx: size * 1.0, ry: size * 1.2, alpha: 0.35 },
    // 宽肩
    { ox: -size * 0.28, oy: -size * 0.25, rx: size * 0.55, ry: size * 0.48, alpha: 0.25 },
    { ox: size * 0.26, oy: -size * 0.27, rx: size * 0.5, ry: size * 0.45, alpha: 0.25 },
    // 侧翼延伸
    { ox: -size * 0.55, oy: size * 0.08, rx: size * 0.55, ry: size * 0.75, alpha: 0.22 },
    { ox: size * 0.52, oy: size * 0.05, rx: size * 0.5, ry: size * 0.7, alpha: 0.22 },
    // 头顶
    { ox: 0, oy: -size * 0.5, rx: size * 0.65, ry: size * 0.35, alpha: 0.2 },
    // 底部弥漫
    { ox: -size * 0.12, oy: size * 0.45, rx: size * 0.75, ry: size * 0.4, alpha: 0.2 },
    { ox: size * 0.1, oy: size * 0.42, rx: size * 0.6, ry: size * 0.35, alpha: 0.18 },
    // 外层极淡烟雾
    { ox: -size * 0.75, oy: -size * 0.03, rx: size * 0.4, ry: size * 0.5, alpha: 0.1 },
    { ox: size * 0.72, oy: -size * 0.06, rx: size * 0.38, ry: size * 0.45, alpha: 0.1 },
    { ox: 0, oy: -size * 0.65, rx: size * 0.42, ry: size * 0.25, alpha: 0.08 },
    { ox: -size * 0.08, oy: size * 0.65, rx: size * 0.85, ry: size * 0.25, alpha: 0.08 },
  ];

  for (const b of smokeLayers) {
    const wobbleX = 1 + Math.sin(t * 0.3 + b.ox * 0.01) * 0.05;
    const wobbleY = 1 + Math.sin(t * 0.25 + b.oy * 0.01) * 0.04;
    const rx = b.rx * wobbleX;
    const ry = b.ry * wobbleY;
    const r = Math.max(rx, ry);
    // 每个烟雾层用径向渐变，中心有颜色、边缘完全透明，无硬边
    const sGrad = ctx.createRadialGradient(b.ox, b.oy, 0, b.ox, b.oy, r);
    const a = b.alpha * gazeRatio;
    // 高CO2时颜色大幅加深，确保碳兽在最高浓度烟雾下仍可见
    const depth = Math.min(gazeRatio * 0.8, 0.45);
    sGrad.addColorStop(0, `rgba(${45 - depth * 80},${36 - depth * 60},${30 - depth * 40},${a * 1.3})`);
    sGrad.addColorStop(0.35, `rgba(${38 - depth * 65},${30 - depth * 48},${24 - depth * 32},${a * 0.8})`);
    sGrad.addColorStop(0.65, `rgba(${28 - depth * 45},${21 - depth * 35},${16 - depth * 22},${a * 0.4})`);
    sGrad.addColorStop(1, 'rgba(18,12,8,0)');
    ctx.beginPath();
    ctx.ellipse(b.ox, b.oy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = sGrad;
    ctx.fill();
  }

  // ====== 1.5 身体内部裂纹/纹理（岩浆般的暗红裂纹 — 柔和版）======
  const crackCount = 6 + Math.floor(gazeRatio * 4);
  for (let ci = 0; ci < crackCount; ci++) {
    const seed = ci * 23 + 11;
    const startX = size * (((seed % 80) / 80 - 0.5) * 1.0);
    const startY = size * ((((seed * 3) % 80) / 80 - 0.3) * 0.6);
    const crackLen = size * (0.06 + ((seed * 7) % 15) / 100);

    const crackAng = ((seed * 13) % 360) * Math.PI / 180;

    const crackPulse = Math.sin(t * 0.6 + ci * 1.1) * 0.3 + 0.7;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    let px = startX, py = startY;
    const segs = 2 + (ci % 2);
    for (let s = 0; s < segs; s++) {
      const segAng = crackAng + (s * 0.8 - 0.4) + Math.sin(t * 0.2 + ci + s) * 0.3;
      const segLen = crackLen / segs;
      px += Math.cos(segAng) * segLen;
      py += Math.sin(segAng) * segLen;
      ctx.lineTo(px, py);
    }
    // 裂纹发光（宽且模糊，替代锐利线条）— 高CO2时更亮更刺眼
    const crackBright = 0.08 + gazeRatio * 0.18;
    ctx.strokeStyle = `rgba(255,90,20,${crackBright * gazeRatio * crackPulse})`;
    ctx.lineWidth = size * (0.025 + gazeRatio * 0.015);
    ctx.stroke();
  }

  // ====== 2. 边缘气泡 — 气态感的圆形突起，替代尖刺 ======
  // 外圈气泡
  const bubbleEdgeCount = 10;
  for (let i = 0; i < bubbleEdgeCount; i++) {
    const angle = -Math.PI * 0.85 + (Math.PI * 1.7 * i / bubbleEdgeCount);
    if (Math.abs(angle) > Math.PI * 0.65 && angle > -Math.PI * 0.65) continue;
    const dist = size * (0.7 + ((i * 17 + 3) % 11) / 70);
    const bx = Math.cos(angle) * dist;
    const by = Math.sin(angle) * dist * 0.7 - size * 0.15;
    const br = size * (0.03 + ((i * 13 + 7) % 15) / 200);
    const wobble = 1 + Math.sin(t * 0.4 + i * 1.2) * 0.15;

    const bGrad = ctx.createRadialGradient(bx, by, 0, bx, by, br * wobble);
    bGrad.addColorStop(0, `rgba(35,26,20,${0.45 * gazeRatio})`);
    bGrad.addColorStop(0.4, `rgba(28,20,15,${0.28 * gazeRatio})`);
    bGrad.addColorStop(1, 'rgba(15,10,6,0)');
    ctx.beginPath();
    ctx.arc(bx, by, br * wobble, 0, Math.PI * 2);
    ctx.fillStyle = bGrad;
    ctx.fill();
  }

  // 头顶气泡群
  const topBubbles = [
    { dx: -size * 0.22, dy: -size * 0.48, r: size * 0.06 },
    { dx: -size * 0.08, dy: -size * 0.55, r: size * 0.08 },
    { dx: size * 0.04, dy: -size * 0.58, r: size * 0.09 },
    { dx: size * 0.14, dy: -size * 0.5, r: size * 0.065 },
    // 两侧气泡
    { dx: -size * 0.65, dy: -size * 0.12, r: size * 0.05 },
    { dx: size * 0.62, dy: -size * 0.15, r: size * 0.045 },
  ];
  for (const bb of topBubbles) {
    const bw = 1 + Math.sin(t * 0.5 + bb.dx * 0.01) * 0.12;
    const bGrad = ctx.createRadialGradient(bb.dx, bb.dy, 0, bb.dx, bb.dy, bb.r * bw);
    bGrad.addColorStop(0, `rgba(32,24,18,${0.5 * gazeRatio})`);
    bGrad.addColorStop(0.45, `rgba(24,17,12,${0.3 * gazeRatio})`);
    bGrad.addColorStop(1, 'rgba(12,8,4,0)');
    ctx.beginPath();
    ctx.arc(bb.dx, bb.dy, bb.r * bw, 0, Math.PI * 2);
    ctx.fillStyle = bGrad;
    ctx.fill();
  }

  // ====== 3. 眼睛区域 — 进食时发光增强但不变大 ======
  const eyeY = -size * 0.12;
  const eyeSpacing = size * 0.28;

  for (let ei = 0; ei < 2; ei++) {
    const ex = (ei === 0 ? -eyeSpacing : eyeSpacing);
    // 深眼窝
    const socketGrad = ctx.createRadialGradient(ex, eyeY, size * 0.02, ex, eyeY, size * 0.2);
    socketGrad.addColorStop(0, 'rgba(2,1,0,0.98)');
    socketGrad.addColorStop(0.4, 'rgba(8,3,2,0.85)');
    socketGrad.addColorStop(0.7, 'rgba(18,10,5,0.5)');
    socketGrad.addColorStop(1, 'rgba(30,18,12,0)');
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, size * 0.2, size * 0.15, 0, 0, Math.PI * 2);
    ctx.fillStyle = socketGrad;
    ctx.fill();

    // 眼睛发光核心 — 大小固定，进食时只增强发光
    const eyeGlowPulse = Math.sin(t * 1.2 + ei * 0.5) * 0.15 + 0.85;
    const eyeSize = size * (0.075 + gazeRatio * 0.03); // 固定大小，不受 excite 影响

    // 超大外发光 — 压迫感核心，进食时发光增强但面积不膨胀
    const outerGlow = ctx.createRadialGradient(ex, eyeY, 0, ex, eyeY, eyeSize * 6);
    const feedGlowMul = 1 + excite * 1.5; // 进食时发光增强
    outerGlow.addColorStop(0, `rgba(255,${130 + excite * 70},${40 + excite * 30},${Math.min(0.6 * gazeRatio * eyeGlowPulse * feedGlowMul, 1)})`);
    outerGlow.addColorStop(0.1, `rgba(255,${100 + excite * 60},20,${Math.min(0.4 * gazeRatio * eyeGlowPulse * feedGlowMul, 0.95)})`);
    outerGlow.addColorStop(0.25, `rgba(255,70,10,${Math.min(0.2 * gazeRatio * eyeGlowPulse * feedGlowMul, 0.7)})`);
    outerGlow.addColorStop(0.5, `rgba(200,45,5,${0.08 * gazeRatio * feedGlowMul})`);
    outerGlow.addColorStop(1, 'rgba(150,30,0,0)');
    ctx.beginPath();
    ctx.arc(ex, eyeY, eyeSize * 6, 0, Math.PI * 2);
    ctx.fillStyle = outerGlow;
    ctx.fill();

    // 中层发光环
    const midGlow = ctx.createRadialGradient(ex, eyeY, eyeSize * 0.5, ex, eyeY, eyeSize * 2.5);
    midGlow.addColorStop(0, `rgba(255,160,60,${0.35 * gazeRatio * eyeGlowPulse * feedGlowMul})`);
    midGlow.addColorStop(0.5, `rgba(255,80,15,${0.15 * gazeRatio * eyeGlowPulse * feedGlowMul})`);
    midGlow.addColorStop(1, 'rgba(200,40,5,0)');
    ctx.beginPath();
    ctx.arc(ex, eyeY, eyeSize * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = midGlow;
    ctx.fill();

    // 虹膜 - 橙红渐变，进食时偏亮黄
    const irisGrad = ctx.createRadialGradient(ex, eyeY, 0, ex, eyeY, eyeSize);
    irisGrad.addColorStop(0, excite > 0.3 ? '#ffee77' : '#ffdd55');
    irisGrad.addColorStop(0.2, excite > 0.3 ? '#ffcc44' : '#ffaa22');
    irisGrad.addColorStop(0.4, '#ff7711');
    irisGrad.addColorStop(0.65, '#dd4408');
    irisGrad.addColorStop(0.85, '#aa2200');
    irisGrad.addColorStop(1, '#661100');
    ctx.beginPath();
    ctx.arc(ex, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fillStyle = irisGrad;
    ctx.fill();

    // 虹膜纹理 — 放射线，进食时更亮
    for (let ri = 0; ri < 12; ri++) {
      const ra = (ri / 12) * Math.PI * 2 + t * 0.1;
      ctx.beginPath();
      ctx.moveTo(ex + Math.cos(ra) * eyeSize * 0.35, eyeY + Math.sin(ra) * eyeSize * 0.35);
      ctx.lineTo(ex + Math.cos(ra) * eyeSize * 0.9, eyeY + Math.sin(ra) * eyeSize * 0.9);
      ctx.strokeStyle = `rgba(200,60,10,${(0.25 + excite * 0.3) * gazeRatio * eyeGlowPulse})`;
      ctx.lineWidth = 1 + excite * 0.5;
      ctx.stroke();
    }

    // 瞳孔 - 深色核心（竖瞳）进食时瞳孔微缩（聚光感）
    const pupilShrink = 1 - excite * 0.15; // 进食时瞳孔微缩，而非扩张
    const pupilW = eyeSize * 0.18 * pupilShrink;
    const pupilH = eyeSize * 0.45 * pupilShrink;
    const pupilGrad = ctx.createRadialGradient(ex, eyeY, 0, ex, eyeY, pupilH);
    pupilGrad.addColorStop(0, '#050100');
    pupilGrad.addColorStop(0.6, '#0a0300');
    pupilGrad.addColorStop(1, '#1a0800');
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, pupilW, pupilH, 0, 0, Math.PI * 2);
    ctx.fillStyle = pupilGrad;
    ctx.fill();

    // 高光点
    ctx.fillStyle = `rgba(255,235,190,${eyeGlowPulse * 0.95})`;
    ctx.beginPath();
    ctx.arc(ex - eyeSize * 0.22, eyeY - eyeSize * 0.3, eyeSize * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255,245,210,${eyeGlowPulse * 0.5})`;
    ctx.beginPath();
    ctx.arc(ex + eyeSize * 0.12, eyeY + eyeSize * 0.2, eyeSize * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }

  // 眉骨/眼眶上缘暗影 — 增加凶狠感
  for (let ei = 0; ei < 2; ei++) {
    const ex = (ei === 0 ? -eyeSpacing : eyeSpacing);
    ctx.beginPath();
    ctx.ellipse(ex, eyeY - size * 0.06, size * 0.17, size * 0.05, ei === 0 ? 0.15 : -0.15, Math.PI, Math.PI * 2);
    ctx.fillStyle = `rgba(15,8,5,${0.7 * gazeRatio})`;
    ctx.fill();
  }

  // ====== 4. 嘴部/獠牙区域 — 进食时大幅张嘴 ======
  const mouthY = size * 0.1;
  const mouthW = size * 0.42;
  // 进食时嘴巴大幅张开：宽度×1.5, 高度×3.5
  const mouthOpenMul = 1 + feed * 0.5;
  const mouthHeightMul = 1 + feed * 2.5;

  // 上下颚张开距离
  const jawGap = feed * size * 0.12;
  const upperLipY = mouthY - jawGap;
  const lowerLipY = mouthY + jawGap;

  // 嘴巴内部黑暗深渊 — 随上下颚张开而拉高
  const mouthCenterY = (upperLipY + lowerLipY) / 2;
  const mouthGrad = ctx.createRadialGradient(0, mouthCenterY + size * 0.02, 0, 0, mouthCenterY, mouthW * 0.55 * mouthOpenMul);
  mouthGrad.addColorStop(0, `rgba(3,1,0,${0.95 * gazeRatio})`);
  mouthGrad.addColorStop(0.4, `rgba(10,5,2,${0.85 * gazeRatio})`);
  mouthGrad.addColorStop(0.7, `rgba(25,12,6,${0.5 * gazeRatio})`);
  mouthGrad.addColorStop(1, 'rgba(40,20,12,0)');
  ctx.beginPath();
  ctx.ellipse(0, mouthCenterY, mouthW * 0.55 * mouthOpenMul, (lowerLipY - upperLipY) / 2 + mouthW * 0.12, 0, 0, Math.PI * 2);
  ctx.fillStyle = mouthGrad;
  ctx.fill();

  // 嘴内部橙红光芒 — 进食时光芒暴增，视觉重心
  const innerGlow = ctx.createRadialGradient(0, mouthCenterY + size * 0.01, 0, 0, mouthCenterY, mouthW * 0.45 * mouthOpenMul);
  const mGlowPulse = Math.sin(t * 0.9) * 0.25 + 0.75;
  const feedGlow = 1 + feed * 3.5;
  innerGlow.addColorStop(0, `rgba(255,${120 + feed * 80},30,${Math.min(0.5 * gazeRatio * mGlowPulse * feedGlow, 1)})`);
  innerGlow.addColorStop(0.3, `rgba(255,${80 + feed * 60},15,${Math.min(0.3 * gazeRatio * mGlowPulse * feedGlow, 0.9)})`);
  innerGlow.addColorStop(0.6, `rgba(200,50,8,${0.12 * gazeRatio * feedGlow})`);
  innerGlow.addColorStop(1, 'rgba(150,30,5,0)');
  ctx.beginPath();
  ctx.ellipse(0, mouthCenterY, mouthW * 0.45 * mouthOpenMul, (lowerLipY - upperLipY) / 2 * 0.7 + mouthW * 0.08, 0, 0, Math.PI * 2);
  ctx.fillStyle = innerGlow;
  ctx.fill();

  // ====== 进食特效：嘴部微弱光晕（CO2粒子飘向嘴部由 effects.js 处理）======
  if (feed > 0.05) {
    // 嘴部内发光增强，提示正在吸食
    const feedGlow = ctx.createRadialGradient(0, mouthCenterY, 0, 0, mouthCenterY, size * 0.15 * feed);
    feedGlow.addColorStop(0, `rgba(255,160,50,${0.15 * feed})`);
    feedGlow.addColorStop(0.5, `rgba(200,80,20,${0.06 * feed})`);
    feedGlow.addColorStop(1, 'rgba(150,40,5,0)');
    ctx.beginPath();
    ctx.arc(0, mouthCenterY, size * 0.15 * feed, 0, Math.PI * 2);
    ctx.fillStyle = feedGlow;
    ctx.fill();
  }

  // 上排獠牙 — 进食时随上唇上移、外翻
  const fangCount = 9;
  for (let fi = 0; fi < fangCount; fi++) {
    const fx = -mouthW * 0.42 * mouthOpenMul + (mouthW * 0.84 * mouthOpenMul * fi / (fangCount - 1));
    const fLen = size * (0.07 + (fi % 3) * 0.025) * (1 - Math.abs(fi - (fangCount - 1) / 2) / (fangCount / 2) * 0.35);
    // 进食时獠牙向外翻转（角度随 feed 增大）
    const fangSpread = feed * size * 0.025;
    const fw = size * 0.02;

    const fg = ctx.createLinearGradient(fx, upperLipY, fx, upperLipY - fLen - fangSpread);
    fg.addColorStop(0, `rgba(220,210,195,${0.95 * gazeRatio})`);
    fg.addColorStop(0.2, `rgba(200,190,170,${0.85 * gazeRatio})`);
    fg.addColorStop(0.5, `rgba(160,148,128,${0.65 * gazeRatio})`);
    fg.addColorStop(0.8, `rgba(120,108,88,${0.35 * gazeRatio})`);
    fg.addColorStop(1, `rgba(80,70,55,${0.1 * gazeRatio})`);

    ctx.beginPath();
    ctx.moveTo(fx - fw - fangSpread, upperLipY + size * 0.01);
    ctx.lineTo(fx - fw * 0.3, upperLipY - fLen - fangSpread);
    ctx.lineTo(fx + fw * 0.3, upperLipY - fLen - fangSpread);
    ctx.lineTo(fx + fw + fangSpread, upperLipY + size * 0.01);
    ctx.closePath();
    ctx.fillStyle = fg;
    ctx.fill();
  }

  // 下排獠牙 — 进食时随下唇下移、外翻
  for (let fi = 0; fi < 7; fi++) {
    const fx = -mouthW * 0.35 * mouthOpenMul + (mouthW * 0.7 * mouthOpenMul * fi / 6);
    const fLen = size * (0.055 + (fi % 2) * 0.02);
    const fw = size * 0.016;
    const fangSpreadDown = feed * size * 0.02;

    const fg = ctx.createLinearGradient(fx, lowerLipY - size * 0.01, fx, lowerLipY - size * 0.01 + fLen + fangSpreadDown);
    fg.addColorStop(0, `rgba(210,198,178,${0.85 * gazeRatio})`);
    fg.addColorStop(0.5, `rgba(150,138,118,${0.5 * gazeRatio})`);
    fg.addColorStop(1, `rgba(100,90,72,${0.1 * gazeRatio})`);

    ctx.beginPath();
    ctx.moveTo(fx - fw - fangSpreadDown, lowerLipY - size * 0.01);
    ctx.lineTo(fx - fw * 0.3, lowerLipY - size * 0.01 + fLen + fangSpreadDown);
    ctx.lineTo(fx + fw * 0.3, lowerLipY - size * 0.01 + fLen + fangSpreadDown);
    ctx.lineTo(fx + fw + fangSpreadDown, lowerLipY - size * 0.01);
    ctx.closePath();
    ctx.fillStyle = fg;
    ctx.fill();
  }

  // ====== 5. 爪臂（从两侧伸出的巨大暗影利爪）======
  for (let side = -1; side <= 1; side += 2) {
    const clawBaseX = side * size * 0.75;
    const clawBaseY = size * 0.05;
    const clawLen = size * 0.45;
    const clawAng = side * 0.6;

    // 臂部
    const armGrad = ctx.createLinearGradient(
      clawBaseX, clawBaseY,
      clawBaseX + Math.cos(clawAng) * clawLen, clawBaseY + Math.sin(clawAng) * clawLen
    );
    armGrad.addColorStop(0, `rgba(50,40,33,${0.6 * gazeRatio})`);
    armGrad.addColorStop(0.5, `rgba(40,30,22,${0.35 * gazeRatio})`);
    armGrad.addColorStop(1, 'rgba(25,18,12,0)');

    ctx.beginPath();
    ctx.moveTo(clawBaseX, clawBaseY - size * 0.06);
    ctx.quadraticCurveTo(
      clawBaseX + Math.cos(clawAng) * clawLen * 0.5, clawBaseY - size * 0.15,
      clawBaseX + Math.cos(clawAng) * clawLen, clawBaseY + Math.sin(clawAng) * clawLen - size * 0.1
    );
    ctx.lineTo(clawBaseX + Math.cos(clawAng) * clawLen, clawBaseY + Math.sin(clawAng) * clawLen + size * 0.1);
    ctx.quadraticCurveTo(
      clawBaseX + Math.cos(clawAng) * clawLen * 0.5, clawBaseY + size * 0.2,
      clawBaseX, clawBaseY + size * 0.06
    );
    ctx.closePath();
    ctx.fillStyle = armGrad;
    ctx.fill();

    // 利爪尖 — 圆形气泡替代锥形
    for (let ci = 0; ci < 3; ci++) {
      const cAng = clawAng + (ci - 1) * 0.25;
      const cLen = size * (0.1 + ci * 0.01);
      const tipX = clawBaseX + Math.cos(clawAng) * clawLen * 0.85 + Math.cos(cAng) * cLen;
      const tipY = clawBaseY + Math.sin(clawAng) * clawLen * 0.85 + Math.sin(cAng) * cLen;
      const cr = size * 0.015;

      const cg = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, cr);
      cg.addColorStop(0, `rgba(180,170,150,${0.45 * gazeRatio})`);
      cg.addColorStop(0.5, `rgba(130,115,95,${0.25 * gazeRatio})`);
      cg.addColorStop(1, 'rgba(80,70,55,0)');
      ctx.beginPath();
      ctx.arc(tipX, tipY, cr, 0, Math.PI * 2);
      ctx.fillStyle = cg;
      ctx.fill();
    }
  }

  // ====== 6. 身体上的气泡/焦油珠 — 气态感 ======
  const bubbleCount = 14 + Math.floor(gazeRatio * 10);
  for (let di = 0; di < bubbleCount; di++) {
    const dx = size * (((di * 37 + 13) % 100) / 100 - 0.5) * 1.5;
    const dy = size * 0.05 + size * 0.5 * ((di * 23) % 100) / 100;
    const br = size * (0.012 + ((di * 17) % 10) / 250) * (1 + Math.sin(t * 0.5 + di) * 0.2);

    const bGrad = ctx.createRadialGradient(dx, dy, 0, dx, dy, br);
    bGrad.addColorStop(0, `rgba(35,26,18,${0.6 * gazeRatio})`);
    bGrad.addColorStop(0.5, `rgba(24,16,10,${0.32 * gazeRatio})`);
    bGrad.addColorStop(1, 'rgba(12,7,3,0)');
    ctx.beginPath();
    ctx.arc(dx, dy, br, 0, Math.PI * 2);
    ctx.fillStyle = bGrad;
    ctx.fill();

    // 焦油珠高光
    if (di % 3 === 0) {
      const hlR = br * 0.4;
      ctx.beginPath();
      ctx.arc(dx - br * 0.2, dy - br * 0.2, hlR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(70,58,45,${0.3 * gazeRatio})`;
      ctx.fill();
    }
  }

  // ====== 7. 整体氛围光晕 — 更强更暗红 ======
  const ambientGlow = ctx.createRadialGradient(0, size * 0.05, 0, 0, size * 0.05, size * 1.5);
  const ambPulse = Math.sin(t * 0.35) * 0.12 + 0.88;
  ambientGlow.addColorStop(0, `rgba(220,100,40,${0.2 * gazeRatio * ambPulse})`);
  ambientGlow.addColorStop(0.2, `rgba(200,80,30,${0.14 * gazeRatio * ambPulse})`);
  ambientGlow.addColorStop(0.5, `rgba(160,55,18,${0.08 * gazeRatio * ambPulse})`);
  ambientGlow.addColorStop(0.8, `rgba(100,35,10,${0.04 * gazeRatio})`);
  ambientGlow.addColorStop(1, 'rgba(40,10,3,0)');
  ctx.beginPath();
  ctx.arc(0, size * 0.05, size * 1.5, 0, Math.PI * 2);
  ctx.fillStyle = ambientGlow;
  ctx.fill();

  // ====== 8. 烟雾粒子 — 更多更大更密 ======
  const particleCount = Math.floor(12 + gazeRatio * 25);
  for (let pi = 0; pi < particleCount; pi++) {
    const seed = pi * 19 + 7;
    const drift = Math.sin(t * 0.2 + seed * 0.3) * size * 0.08;
    const px = size * (((seed % 100) / 100 - 0.5) * 2.5) + drift;
    const pyBase = size * (((seed * 3) % 100) / 100 - 0.3) * 1.4;
    const py = pyBase + Math.sin(t * 0.25 + seed) * size * 0.06;
    const pSize = size * (0.02 + ((seed % 12) / 80)) * (1 + Math.sin(t * 0.4 + seed * 0.3) * 0.35);
    const pAlpha = (0.25 + ((seed % 7) / 20)) * gazeRatio;

    const pg = ctx.createRadialGradient(px, py, 0, px, py, pSize);
    pg.addColorStop(0, `rgba(55,40,28,${pAlpha})`);
    pg.addColorStop(0.5, `rgba(38,26,16,${pAlpha * 0.5})`);
    pg.addColorStop(1, 'rgba(20,14,8,0)');
    ctx.beginPath();
    ctx.arc(px, py, pSize, 0, Math.PI * 2);
    ctx.fillStyle = pg;
    ctx.fill();
  }

  // ====== 9. 环绕暗影触须（从身体底部蔓延出的暗影）======
  const tendrilCount = 5 + Math.floor(gazeRatio * 4);
  for (let ti = 0; ti < tendrilCount; ti++) {
    const seed = ti * 29 + 5;
    const startAng = ((seed % 120) - 60) * Math.PI / 180;
    const tLen = size * (0.3 + ((seed * 3) % 30) / 50);
    const tStartX = Math.cos(startAng) * size * 0.5;
    const tStartY = size * 0.3 + Math.abs(Math.sin(startAng)) * size * 0.2;

    ctx.beginPath();
    ctx.moveTo(tStartX, tStartY);
    let tpx = tStartX, tpy = tStartY;
    for (let ts = 0; ts < 4; ts++) {
      const segAng = startAng + Math.sin(t * 0.15 + ti + ts * 0.5) * 0.4;
      const segLen = tLen / 4;
      const cpx = tpx + Math.cos(segAng) * segLen * 0.5 + Math.sin(t * 0.3 + ti + ts) * size * 0.03;
      const cpy = tpy + Math.sin(segAng) * segLen * 0.3 + size * 0.04;
      tpx += Math.cos(segAng) * segLen;
      tpy += Math.abs(Math.sin(segAng)) * segLen * 0.3 + size * 0.05;
      ctx.quadraticCurveTo(cpx, cpy, tpx, tpy);
    }
    ctx.strokeStyle = `rgba(30,20,14,${0.3 * gazeRatio * (0.6 + Math.sin(t * 0.3 + ti) * 0.4)})`;
    ctx.lineWidth = size * (0.015 + ((seed % 5) / 80));
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  ctx.restore();
}

// === 背景渲染 ===
function drawBackground(ctx, canvas) {
  const w = canvas.width, h = canvas.height;

  // 蓝天渐变（随CO2向棕黄偏移）
  const co2Ratio = Math.min(gameState.displayCo2 / 120, 1);
  function lerpColor(a, b, t) {
    const pa = [parseInt(a.slice(1,3),16), parseInt(a.slice(3,5),16), parseInt(a.slice(5,7),16)];
    const pb = [parseInt(b.slice(1,3),16), parseInt(b.slice(3,5),16), parseInt(b.slice(5,7),16)];
    const r = Math.round(pa[0] + (pb[0]-pa[0])*t);
    const g = Math.round(pa[1] + (pb[1]-pa[1])*t);
    const bl = Math.round(pa[2] + (pb[2]-pa[2])*t);
    return '#' + [r,g,bl].map(v => Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')).join('');
  }
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, lerpColor('#4a90d9', '#8a7040', co2Ratio));
  skyGrad.addColorStop(0.3, lerpColor('#6aabeb', '#9a8a55', co2Ratio));
  skyGrad.addColorStop(0.6, lerpColor('#8dc4f0', '#b0a068', co2Ratio));
  skyGrad.addColorStop(1, lerpColor('#b8dff5', '#c8b878', co2Ratio));
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // 太阳
  const sunX = w * 0.85, sunY = h * 0.12;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 120);
  sunGlow.addColorStop(0, 'rgba(255,250,200,0.9)');
  sunGlow.addColorStop(0.15, 'rgba(255,240,150,0.5)');
  sunGlow.addColorStop(0.4, 'rgba(255,230,100,0.15)');
  sunGlow.addColorStop(1, 'rgba(255,230,100,0)');
  ctx.fillStyle = sunGlow;
  ctx.fillRect(sunX - 120, sunY - 120, 240, 240);
  ctx.beginPath();
  ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
  const sunCore = ctx.createRadialGradient(sunX - 5, sunY - 5, 0, sunX, sunY, 28);
  sunCore.addColorStop(0, '#fffde7');
  sunCore.addColorStop(1, '#ffe082');
  ctx.fillStyle = sunCore;
  ctx.fill();

  // 云朵
  for (const cloud of clouds) {
    cloud.x += cloud.speed * 0.3;
    if (cloud.x > w + cloud.w) cloud.x = -cloud.w - 20;

    ctx.save();
    ctx.globalAlpha = cloud.alpha;
    for (const blob of cloud.blobs) {
      const bx = cloud.x + blob.ox;
      const by = cloud.y + blob.oy;
      const br = blob.r;
      const g = ctx.createRadialGradient(bx, by - br * 0.2, br * 0.1, bx, by, br);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.6, 'rgba(255,255,255,0.7)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 碳兽 - CO2≥20时从背景中浮现的巨型怪物
  // 目标：CO2=20时碳兽初现，形象相当于原CO2=60的大小（gazeRatio≈0.31）
  if (gameState.displayCo2 >= 20 && !shouldHideBeast()) {
    // gazeRatio 映射：CO2=20→0.31，CO2=150→1.0
    // 好结局shrink阶段：插值缩小到中等CO2形象
    const shrinkGaze = getShrinkGazeRatio();
    const gazeRatio = shrinkGaze !== null ? shrinkGaze : Math.min(0.31 + (gameState.displayCo2 - 20) / (150 - 20) * 0.69, 1);
    const t = Date.now() / 1000;

    // 整体透明度：CO2低时碳兽如幽灵般半透明，随CO2升高逐渐凝实
    // 20→0.15(几乎透明), 40→0.35, 60→0.55, 80→0.7, 100→0.85, 150→1.0
    let beastAlpha;
    if (gameState.displayCo2 <= 40) {
      beastAlpha = 0.15 + ((gameState.displayCo2 - 20) / 20) * 0.20;
    } else if (gameState.displayCo2 <= 80) {
      beastAlpha = 0.35 + ((gameState.displayCo2 - 40) / 40) * 0.35;
    } else {
      beastAlpha = 0.7 + ((gameState.displayCo2 - 80) / 70) * 0.3;
    }
    beastAlpha = Math.min(beastAlpha, 1);

    ctx.save();
    ctx.globalAlpha = beastAlpha;

    // 碳兽主体 - 随CO2增大而变大，位置动态调整确保嘴巴始终露出地图上方
    const beastBaseSize = Math.max(w, h) * (0.18 + gazeRatio * 0.22);
    // 嘴巴在碳兽坐标系中约 Y=size*0.1，经 translate 偏移后屏幕 Y = cy - size*0.15 + size*0.1 = cy - size*0.05
    // 地图顶部边缘约 h*0.20，嘴巴需在其上方留出空间（獠牙+光效）
    const mapTopEdge = h * 0.20;
    const defaultBeastY = h * 0.62;
    const mouthScreenY = defaultBeastY - beastBaseSize * 0.05;
    // 如果嘴巴会被地图遮挡，将碳兽整体上移
    let beastCy = defaultBeastY;
    if (mouthScreenY > mapTopEdge) {
      beastCy = mapTopEdge + beastBaseSize * 0.05;
    }
    drawCarbonBeast(ctx, w * 0.5, beastCy, beastBaseSize, gazeRatio, t);

    // 更新碳兽嘴部屏幕坐标供粒子吸引使用
    // 嘴巴在碳兽坐标系中 Y = size*0.1，经 translate 偏移 by = cy - size*0.15 + floatPhase
    // 屏幕 Y ≈ beastCy - beastBaseSize*0.15 + beastBaseSize*0.1 = beastCy - beastBaseSize*0.05
    beastState.mouthScreenX = w * 0.5;
    beastState.mouthScreenY = beastCy - beastBaseSize * 0.05;

    ctx.restore();
  }

  // CO2污染滤镜：从CO2=20开始极轻微，50后明显加剧
  const pollutionStart = 20;
  if (gameState.displayCo2 >= pollutionStart) {
    // 20-50区间用曲线抑制，50后线性增长
    let pollRatio;
    if (gameState.displayCo2 <= 50) {
      // 0~0.15的极轻微范围，让20-50几乎不可察觉
      pollRatio = ((gameState.displayCo2 - pollutionStart) / (50 - pollutionStart)) * 0.15;
    } else {
      // 50-120从0.15线性增长到1.0
      pollRatio = 0.15 + ((gameState.displayCo2 - 50) / (120 - 50)) * 0.85;
    }
    pollRatio = Math.min(pollRatio, 1);
    const t = Date.now() / 1000;

    // 1) 整体灰褐色遮罩 — 降低最大不透明度，确保UI可读
    const hazeAlpha = pollRatio * 0.45;
    ctx.fillStyle = `rgba(90,75,55,${hazeAlpha})`;
    ctx.fillRect(0, 0, w, h);

    // 2) 飘动的烟尘颗粒 — 降低密度和透明度确保UI可读
    const smokeCount = Math.floor(pollRatio * 50) + 4;
    for (let i = 0; i < smokeCount; i++) {
      const px = w * (0.05 + 0.9 * ((Math.sin(t * 0.3 + i * 0.7) + 1) / 2));
      const py = h * (0.05 + 0.9 * ((Math.cos(t * 0.2 + i * 0.5) + 1) / 2));
      const radius = 70 + pollRatio * 153 + Math.sin(t * 0.5 + i) * 35;
      const smokeAlpha = pollRatio * 0.12;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      const smokeGrad = ctx.createRadialGradient(px, py, 0, px, py, radius);
      smokeGrad.addColorStop(0, `rgba(120,95,60,${smokeAlpha})`);
      smokeGrad.addColorStop(0.4, `rgba(95,75,48,${smokeAlpha * 0.65})`);
      smokeGrad.addColorStop(0.7, `rgba(70,52,32,${smokeAlpha * 0.3})`);
      smokeGrad.addColorStop(1, 'rgba(50,35,20,0)');
      ctx.fillStyle = smokeGrad;
      ctx.fill();
    }

    // 3) 边缘暗角（vignette） — 降低不透明度确保UI可读
    const vigAlpha = pollRatio * 0.40;
    const vigGrad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.65);
    vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vigGrad.addColorStop(1, `rgba(30,20,10,${vigAlpha})`);
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, w, h);

    // 4) 从CO2=50开始出现浓烟 — 更浓更大
    if (gameState.displayCo2 >= 50) {
      const heavyRatio = Math.min((gameState.displayCo2 - 50) / (120 - 50), 1);
      const heavyCount = Math.floor(heavyRatio * 43) + 4;
      for (let i = 0; i < heavyCount; i++) {
        const hx = w * (0.05 + 0.9 * ((Math.sin(t * 0.15 + i * 1.3) + 1) / 2));
        const hy = h * (0.1 + 0.8 * ((Math.cos(t * 0.1 + i * 0.9) + 1) / 2));
        const hRadius = 100 + heavyRatio * 187 + Math.sin(t * 0.3 + i * 0.7) * 40;
        const hAlpha = heavyRatio * 0.24;
        ctx.beginPath();
        ctx.arc(hx, hy, hRadius, 0, Math.PI * 2);
        const hGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, hRadius);
        hGrad.addColorStop(0, `rgba(85,65,38,${hAlpha})`);
        hGrad.addColorStop(0.4, `rgba(65,48,28,${hAlpha * 0.65})`);
        hGrad.addColorStop(0.7, `rgba(45,32,18,${hAlpha * 0.3})`);
        hGrad.addColorStop(1, 'rgba(30,20,10,0)');
        ctx.fillStyle = hGrad;
        ctx.fill();
      }

      // 5) CO2≥100 温室效应额外深红浓雾
      if (gameState.greenhouseEffect && !gameState.gameOver && !gameState.gameWon) {
        const redAlpha = 0.12 + Math.sin(Date.now() / 2000) * 0.03;
        ctx.fillStyle = `rgba(140,60,30,${redAlpha})`;
        ctx.fillRect(0, 0, w, h);
        const extraCount = 25;
        for (let i = 0; i < extraCount; i++) {
          const ex = w * (0.05 + 0.9 * ((Math.sin(t * 0.2 + i * 1.1) + 1) / 2));
          const ey = h * (0.05 + 0.9 * ((Math.cos(t * 0.15 + i * 0.8) + 1) / 2));
          const eRadius = 60 + Math.sin(t * 0.4 + i * 0.5) * 25;
          ctx.beginPath();
          ctx.arc(ex, ey, eRadius, 0, Math.PI * 2);
          const eGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, eRadius);
          eGrad.addColorStop(0, `rgba(160,80,30,${redAlpha * 0.7})`);
          eGrad.addColorStop(1, 'rgba(120,50,20,0)');
          ctx.fillStyle = eGrad;
          ctx.fill();
        }
      }
    }
  }
}

// === 地块间环境光 ===
function drawAmbientLight(ctx) {
  // 在聚落/火电厂等建筑附近添加环境光
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const { x: cx, y: cy } = getTileCenter(r, c);
      const tile = tiles[r][c];

      if (tile.type === 'settlement' || tile.type === 'power_plant') {
        // 暖色环境光
        const t = Date.now() / 1500;
        const pulse = Math.sin(t + r + c) * 0.02 + 0.06;
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, HEX_R * 1.2);
        glow.addColorStop(0, `rgba(255,200,100,${pulse})`);
        glow.addColorStop(0.5, `rgba(255,180,80,${pulse * 0.4})`);
        glow.addColorStop(1, 'rgba(255,180,80,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(cx - HEX_R * 1.2, cy - HEX_R * 1.2, HEX_R * 2.4, HEX_R * 2.4);
      }

      if (tile.type === 'research_lab') {
        // 冷色环境光
        const t = Date.now() / 2000;
        const pulse = Math.sin(t + r + c) * 0.02 + 0.05;
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, HEX_R * 1.0);
        glow.addColorStop(0, `rgba(100,180,255,${pulse})`);
        glow.addColorStop(0.5, `rgba(80,150,220,${pulse * 0.4})`);
        glow.addColorStop(1, 'rgba(80,150,220,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(cx - HEX_R, cy - HEX_R, HEX_R * 2, HEX_R * 2);
      }

      if (tile.type === 'eco_forest') {
        // 绿色环境光
        const t = Date.now() / 1800;
        const pulse = Math.sin(t + r + c) * 0.02 + 0.06;
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, HEX_R * 1.0);
        glow.addColorStop(0, `rgba(0,200,100,${pulse})`);
        glow.addColorStop(0.5, `rgba(0,180,80,${pulse * 0.4})`);
        glow.addColorStop(1, 'rgba(0,180,80,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(cx - HEX_R, cy - HEX_R, HEX_R * 2, HEX_R * 2);
      }
    }
  }
}

// === 建筑台词调度 ===
const DIALOGUE_MIN_INTERVAL = 5000;  // 最小间隔5秒
const DIALOGUE_MAX_INTERVAL = 12000; // 最大间隔12秒
const DIALOGUE_MAX_ACTIVE = 5;       // 同时最多5条台词

function updateDialogueSchedule() {
  const now = Date.now();

  // 清理已不存在的tile的计时器
  for (const key of Object.keys(dialogueTimers)) {
    const [r, c] = key.split('_').map(Number);
    const tile = tiles[r] && tiles[r][c];
    if (!tile || !tile.type || !BUILDING_DIALOGUES[getDialogueKey(tile)]) {
      delete dialogueTimers[key];
    }
  }

  // 遍历所有人工建筑
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tile = tiles[r][c];
      if (!tile || !tile.type) continue;
      const typeDef = TILE_TYPES[tile.type];
      if (!typeDef) continue;
      if (tile.type === 'empty') continue; // 空地不飘台词

      // 只对有人工台词的建筑飘台词
      const dialogueKey = getDialogueKey(tile);
      if (!BUILDING_DIALOGUES[dialogueKey]) continue;

      const key = r + '_' + c;

      // 初始化计时器
      if (!dialogueTimers[key]) {
        dialogueTimers[key] = {
          nextTime: now + DIALOGUE_MIN_INTERVAL + Math.random() * (DIALOGUE_MAX_INTERVAL - DIALOGUE_MIN_INTERVAL)
        };
      }

      // 检查是否到了飘出台词的时间
      if (now >= dialogueTimers[key].nextTime) {
        // 同屏最多N条台词
        if (dialogueAnims.length < DIALOGUE_MAX_ACTIVE) {
          const dialogueKey = getDialogueKey(tile);
          const text = pickDialogue(dialogueKey);
          if (text) {
            const { x, y } = getTileCenter(r, c);
            dialogueAnims.push({
              x: x + (Math.random() - 0.5) * 10,
              y: y - HEX_R * 0.3,
              text,
              alpha: 0,
              vy: -0.3,
              life: 200,  // ~3.3秒@60fps
              maxLife: 200,
            });
          }
        }
        // 设置下次触发时间
        dialogueTimers[key].nextTime = now + DIALOGUE_MIN_INTERVAL + Math.random() * (DIALOGUE_MAX_INTERVAL - DIALOGUE_MIN_INTERVAL);
      }
    }
  }
}

// === 碳兽台词调度 ===
const BEAST_DIALOGUE_INTERVAL = 4000;  // 4秒间隔（加快出现速度）
const BEAST_DIALOGUE_MAX = 3;          // 最多3条台词同时存在
let beastDialogueNextTime = 0;

function updateBeastDialogueSchedule() {
  // 仅CO2>60时才触发碳兽台词
  if (gameState.displayCo2 <= 60) {
    beastDialogueNextTime = 0;
    return;
  }

  const now = Date.now();
  if (beastDialogueNextTime === 0) {
    // 首次出现，设置初始计时
    beastDialogueNextTime = now + BEAST_DIALOGUE_INTERVAL * 0.3 + Math.random() * BEAST_DIALOGUE_INTERVAL * 0.5;
    return;
  }
  if (now < beastDialogueNextTime) return;

  // 清理已完成淡出的台词
  for (let i = beastDialogues.length - 1; i >= 0; i--) {
    if (beastDialogues[i].phase === 'done') {
      beastDialogues.splice(i, 1);
    }
  }

  // 同屏最多3条
  if (beastDialogues.length >= BEAST_DIALOGUE_MAX) {
    // 还没到时间，等下次
    return;
  }

  // 选取一句台词
  const text = pickBeastDialogue(gameState.displayCo2);
  if (!text) return;

  const w = canvas.width;
  const h = canvas.height;
  const fontSize = 18;

  // 随机位置：屏幕上方区域
  const x = w * (0.15 + Math.random() * 0.7);
  const y = h * (0.05 + Math.random() * 0.18);

  // 随机旋转角度：-15° ~ +15°
  const rotation = (Math.random() - 0.5) * Math.PI / 6;

  // 碳兽色系：暗红棕色，随CO2等级加深
  let color;
  if (gameState.displayCo2 >= 100) {
    color = '#ff4422';  // 大型：更亮的暗红
  } else if (gameState.displayCo2 >= 60) {
    color = '#cc5533';  // 中型：暗橙红
  } else {
    color = '#aa6644';  // 小型：暗棕
  }

  beastDialogues.push({
    text,
    alpha: 0,
    x,
    y,
    rotation,
    phase: 'fadein',
    holdTimer: 0,
    fontSize,
    color,
  });

  // 设置下次触发时间（加快速度，3~6秒）
  beastDialogueNextTime = now + BEAST_DIALOGUE_INTERVAL * 0.5 + Math.random() * BEAST_DIALOGUE_INTERVAL * 0.5;
}

// === 主绘制 ===

function draw() {
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // 背景
  drawBackground(ctx, canvas);

  // === 地图变换（坏结局螺旋） ===
  const endingTransform = getEndingMapTransform();
  if (endingTransform) {
    const mapLeft = (w - COLS * HEX_W) / 2;
    const mapRight = mapLeft + COLS * HEX_W;
    const mapTop = (h - (ROWS - 1) * V_SPACING * PERSPECTIVE) / 2 - 20;
    const mapBottom = mapTop + ROWS * V_SPACING * PERSPECTIVE + HEX_R * PERSPECTIVE;
    const mcx = (mapLeft + mapRight) / 2;
    const mcy = (mapTop + mapBottom) / 2;
    ctx.save();
    ctx.globalAlpha = endingTransform.alpha;
    ctx.translate(mcx + endingTransform.offsetX, mcy + endingTransform.offsetY);
    ctx.rotate(endingTransform.rotation);
    ctx.scale(endingTransform.scale, endingTransform.scale);
    ctx.translate(-mcx, -mcy);
  }

  // === 绘制地块（灭亡动画结束后不再渲染） ===
  const shouldDrawTiles = !(endingState.active && endingState.type === 'bad' &&
    (endingState.phase === 'blackout' || endingState.phase === 'title'));
  if (shouldDrawTiles) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      try {
        const { x: cx, y: cy } = getTileCenter(r, c);
        const tile = tiles[r][c];
        if (!tile || !tile.type) { console.error('[draw] Missing tile at', r, c); continue; }
        const typeDef = TILE_TYPES[tile.type];
        if (!typeDef) { console.error('[draw] Unknown tile type:', tile.type, 'at', r, c); continue; }
        const isSel = uiState.selectedTile && uiState.selectedTile.row === r && uiState.selectedTile.col === c;
        drawHexTile(ctx, cx, cy, typeDef.topColor, typeDef.sideColor1, typeDef.sideColor2, isSel);
        drawTileDecorations(ctx, tile.type, cx, cy, tile.seed);
      } catch (e) {
        console.error('[draw] Error rendering tile at', r, c, ':', e);
      }
    }
  }
  } // end shouldDrawTiles

  // === 环境光 ===
  if (shouldDrawTiles) drawAmbientLight(ctx);

  // === UI叠加（倒计时、残留标记等） ===
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const { x: cx, y: cy } = getTileCenter(r, c);
      const tile = tiles[r][c];

      // 幼林成长倒计时
      if (tile.type === 'grassland' && tile.growTime !== undefined && tile.growTime > 0) {
        ctx.fillStyle = 'rgba(139,195,74,0.85)';
        ctx.font = 'bold 10px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tile.growTime + '回合', cx, cy + HEX_R * PERSPECTIVE - 6);
        ctx.textAlign = 'left';
      }
      // 生态林地建设倒计时
      if (tile.type === 'eco_forest_growing' && tile.ecoGrowTime !== undefined) {
        ctx.fillStyle = 'rgba(76,175,80,0.9)';
        ctx.font = 'bold 10px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('建设' + tile.ecoGrowTime + '回合', cx, cy + HEX_R * PERSPECTIVE - 6);
        ctx.textAlign = 'left';
      }

      // 工业残留标记
      const hasResidue = industrialResidue.some(res => res.r === r && res.c === c);
      if (hasResidue) {
        const resFlash = Math.sin(Date.now() / 400) * 0.15 + 0.2;
        const top = hexCorners(cx, cy, HEX_R - 1);
        ctx.beginPath();
        ctx.moveTo(top[0].x, top[0].y);
        for (let i = 1; i < 6; i++) ctx.lineTo(top[i].x, top[i].y);
        ctx.closePath();
        ctx.fillStyle = `rgba(255,110,64,${resFlash})`;
        ctx.fill();
        ctx.fillStyle = '#ff6e40';
        ctx.font = '9px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const residue = industrialResidue.find(res => res.r === r && res.c === c);
        ctx.fillText('残留' + residue.co2 + 'CO2 x' + residue.turnsLeft, cx, cy + HEX_R * PERSPECTIVE - 4);
        ctx.textAlign = 'left';
      }
    }
  }

  // 恢复地图变换
  if (endingTransform) {
    ctx.restore();
  }

  // === 环境特效 — 烟雾（最上层，遮蔽地图和碳兽） ===
  if (gameState.displayCo2 >= 20) {
    const smogT = Date.now() / 1000;
    let smogRatio;
    if (gameState.displayCo2 <= 50) {
      smogRatio = ((gameState.displayCo2 - 20) / 30) * 0.4;
    } else {
      smogRatio = 0.4 + ((gameState.displayCo2 - 50) / 70) * 0.6;
    }
    smogRatio = Math.min(smogRatio, 1);

    // 地图地块的实际屏幕范围
    const mapLeft = (w - COLS * HEX_W) / 2;
    const mapRight = mapLeft + COLS * HEX_W;
    const mapTop = (h - (ROWS - 1) * V_SPACING * PERSPECTIVE) / 2 - 20;
    const mapBottom = mapTop + ROWS * V_SPACING * PERSPECTIVE + HEX_R * PERSPECTIVE;
    const mapCX = (mapLeft + mapRight) / 2;
    const mapCY = (mapTop + mapBottom) / 2;
    const mapW = mapRight - mapLeft;
    const mapH = mapBottom - mapTop;
    // 扩展一点范围让烟雾能飘到地块边缘外
    const pad = 30;
    const mapArea = { left: mapLeft - pad, right: mapRight + pad, top: mapTop - pad, bottom: mapBottom + pad };

    // 1) 大面积弥散烟雾层 — 降低透明度确保UI可读
    const baseFogCount = Math.floor(smogRatio * 12) + 2;
    for (let bi = 0; bi < baseFogCount; bi++) {
      const seed = bi * 59 + 3;
      const bx = mapArea.left + (mapArea.right - mapArea.left) * ((Math.sin(smogT * 0.03 + seed * 0.29) + 1) / 2);
      const by = mapArea.top + (mapArea.bottom - mapArea.top) * ((Math.cos(smogT * 0.02 + seed * 0.19) + 1) / 2);
      const bRadius = 80 + smogRatio * 136 + Math.sin(smogT * 0.15 + bi) * 25;
      const bAlpha = smogRatio * (0.08 + ((seed % 5) / 35));
      const bg = ctx.createRadialGradient(bx, by, 0, bx, by, bRadius);
      bg.addColorStop(0, `rgba(130,110,75,${bAlpha})`);
      bg.addColorStop(0.3, `rgba(110,90,60,${bAlpha * 0.7})`);
      bg.addColorStop(0.6, `rgba(85,68,45,${bAlpha * 0.4})`);
      bg.addColorStop(1, 'rgba(60,48,30,0)');
      ctx.beginPath();
      ctx.ellipse(bx, by, bRadius, bRadius * 0.55 + Math.sin(smogT * 0.12 + bi) * 10, smogT * 0.015 + bi * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = bg;
      ctx.fill();
    }

    // 2) 围绕地块的飘动烟团 — 降低密度确保UI可读
    const tileSmokeCount = Math.floor(smogRatio * ROWS * COLS * 0.8) + 2;
    for (let fi = 0; fi < tileSmokeCount; fi++) {
      // 基于真实地块位置偏移
      const tr = fi % ROWS;
      const tc = Math.floor(fi / ROWS) % COLS;
      const { x: tileX, y: tileY } = getTileCenter(tr, tc);
      const seed = fi * 41 + 7;
      // 烟团在地块附近飘动
      const fx = tileX + Math.sin(smogT * 0.08 + seed * 0.37) * HEX_R * 0.8;
      const fy = tileY + Math.cos(smogT * 0.06 + seed * 0.23) * HEX_R * 0.5;
      const fRadius = 25 + smogRatio * 70 + Math.sin(smogT * 0.25 + fi * 0.9) * 12;
      const fAlpha = smogRatio * (0.06 + ((seed % 7) / 35));
      const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, fRadius);
      fg.addColorStop(0, `rgba(135,115,80,${fAlpha})`);
      fg.addColorStop(0.25, `rgba(115,95,65,${fAlpha * 0.75})`);
      fg.addColorStop(0.55, `rgba(90,72,48,${fAlpha * 0.4})`);
      fg.addColorStop(1, 'rgba(65,50,32,0)');
      ctx.beginPath();
      ctx.ellipse(fx, fy, fRadius, fRadius * 0.45 + Math.sin(smogT * 0.18 + fi) * 6, smogT * 0.025 + fi * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = fg;
      ctx.fill();
    }

    // 3) 贴地浓雾层 — CO2≥30时出现，沿地块底部蔓延
    if (gameState.displayCo2 >= 30) {
      const groundRatio = Math.min((gameState.displayCo2 - 30) / 50, 1);
      const groundFogCount = Math.floor(groundRatio * 17) + 3;
      for (let gi = 0; gi < groundFogCount; gi++) {
        const seed = gi * 53 + 19;
        const gx = mapArea.left + (mapArea.right - mapArea.left) * ((Math.sin(smogT * 0.05 + seed * 0.31) + 1) / 2);
        const gy = mapBottom - 10 - mapH * 0.2 * ((Math.cos(smogT * 0.04 + seed * 0.17) + 1) / 2);
        const gRadius = 50 + groundRatio * 102 + Math.sin(smogT * 0.15 + gi) * 20;
        const gAlpha = groundRatio * (0.136 + ((seed % 5) / 28));
        const gg = ctx.createRadialGradient(gx, gy, 0, gx, gy, gRadius);
        gg.addColorStop(0, `rgba(115,95,60,${gAlpha})`);
        gg.addColorStop(0.35, `rgba(90,72,45,${gAlpha * 0.7})`);
        gg.addColorStop(0.7, `rgba(65,50,32,${gAlpha * 0.3})`);
        gg.addColorStop(1, 'rgba(45,35,20,0)');
        ctx.beginPath();
        ctx.ellipse(gx, gy, gRadius, gRadius * 0.35, Math.sin(smogT * 0.04 + gi) * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = gg;
        ctx.fill();
      }
    }

    // 4) 丝缕状飘烟 — CO2≥40时在地块间飘动的烟丝
    if (gameState.displayCo2 >= 40) {
      const wispRatio = Math.min((gameState.displayCo2 - 40) / 50, 1);
      const wispCount = Math.floor(wispRatio * 12) + 3;
      for (let wi = 0; wi < wispCount; wi++) {
        const seed = wi * 67 + 11;
        const wr = wi % ROWS;
        const wc = Math.floor(wi / ROWS) % COLS;
        const { x: wTileX, y: wTileY } = getTileCenter(wr, wc);
        const wx = wTileX + Math.sin(smogT * 0.05 + seed * 0.19) * HEX_R;
        const wy = wTileY + Math.cos(smogT * 0.04 + seed * 0.14) * HEX_R * 0.6;
        const wLen = 40 + wispRatio * 100;
        const wAlpha = wispRatio * 0.187;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.quadraticCurveTo(
          wx + wLen * 0.3 + Math.sin(smogT * 0.12 + wi * 1.3) * 20,
          wy - 10 + Math.cos(smogT * 0.09 + wi) * 8,
          wx + wLen * 0.6 + Math.sin(smogT * 0.08 + wi * 0.7) * 30,
          wy - 5 + Math.sin(smogT * 0.1 + wi) * 12
        );
        ctx.quadraticCurveTo(
          wx + wLen * 0.8 + Math.sin(smogT * 0.06 + wi * 0.5) * 15,
          wy - 20 + Math.cos(smogT * 0.12 + wi * 0.9) * 10,
          wx + wLen + Math.sin(smogT * 0.05 + wi * 0.3) * 25,
          wy - 25 + Math.sin(smogT * 0.08 + wi * 0.6) * 15
        );
        // 外层极淡宽烟
        ctx.strokeStyle = `rgba(100,82,55,${wAlpha * 0.35})`;
        ctx.lineWidth = 22 + wispRatio * 20;
        ctx.lineCap = 'round';
        ctx.stroke();
        // 内层较浓细烟
        ctx.strokeStyle = `rgba(120,100,68,${wAlpha})`;
        ctx.lineWidth = 10 + wispRatio * 8;
        ctx.stroke();
      }
    }

    // 5) 地块上升烟雾 — CO2≥50时从排放地块升起的烟
    if (gameState.displayCo2 >= 50) {
      const riseRatio = Math.min((gameState.displayCo2 - 50) / 50, 1);
      // 找到所有CO2排放地块
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const stats = getTileEffectiveStats(r, c);
          if (stats.co2Change > 0) {
            const { x: emX, y: emY } = getTileCenter(r, c);
            // 每个排放地块上方1~3个升腾烟雾
            const emCount = Math.floor(riseRatio * Math.min(stats.co2Change, 3)) + 1;
            for (let ei = 0; ei < emCount; ei++) {
              const seed = (r * COLS + c) * 31 + ei * 17;
              const eOffX = Math.sin(smogT * 0.15 + seed * 0.3) * 12;
              const eOffY = Math.sin(smogT * 0.2 + seed * 0.5) * 8 - riseRatio * 30;
              const eRadius = 20 + riseRatio * 35 + Math.sin(smogT * 0.3 + ei) * 8;
              const eAlpha = riseRatio * 0.153;
              const eg = ctx.createRadialGradient(emX + eOffX, emY + eOffY, 0, emX + eOffX, emY + eOffY, eRadius);
              eg.addColorStop(0, `rgba(110,90,55,${eAlpha})`);
              eg.addColorStop(0.4, `rgba(85,68,40,${eAlpha * 0.6})`);
              eg.addColorStop(1, 'rgba(55,42,25,0)');
              ctx.beginPath();
              ctx.ellipse(emX + eOffX, emY + eOffY, eRadius, eRadius * 0.6, smogT * 0.05 + ei, 0, Math.PI * 2);
              ctx.fillStyle = eg;
              ctx.fill();
            }
          }
        }
      }
    }

    // 6) 翻滚烟雾柱 — CO2≥70时从地图中央升起
    if (gameState.displayCo2 >= 70) {
      const pillarRatio = Math.min((gameState.displayCo2 - 70) / 50, 1);
      const pillarCount = Math.floor(pillarRatio * 5) + 2;
      for (let pi = 0; pi < pillarCount; pi++) {
        const seed = pi * 83 + 29;
        const px = mapLeft + mapW * ((Math.sin(smogT * 0.025 + seed * 0.23) + 1) / 2);
        const py = mapBottom - mapH * 0.3 * ((Math.cos(smogT * 0.02 + seed * 0.11) + 1) / 2);
        const pHeight = 60 + pillarRatio * 150;
        const pAlpha = pillarRatio * 0.136;
        for (let layer = 0; layer < 4; layer++) {
          const ly = py - pHeight * (layer / 4);
          const lScale = 1 - layer * 0.18;
          const lAlpha = pAlpha * (1 - layer * 0.2);
          const lRadius = (30 + pillarRatio * 50) * lScale;
          const pg = ctx.createRadialGradient(px + Math.sin(smogT * 0.1 + pi + layer) * 8, ly, 0, px, ly, lRadius);
          pg.addColorStop(0, `rgba(105,88,55,${lAlpha})`);
          pg.addColorStop(0.4, `rgba(85,68,42,${lAlpha * 0.6})`);
          pg.addColorStop(1, 'rgba(55,42,25,0)');
          ctx.beginPath();
          ctx.ellipse(px + Math.sin(smogT * 0.1 + pi + layer) * 8, ly, lRadius, lRadius * 0.55, Math.sin(smogT * 0.03 + pi) * 0.15, 0, Math.PI * 2);
          ctx.fillStyle = pg;
          ctx.fill();
        }
      }
    }

    // 7) CO2≥80 全屏浓雾脉冲
    if (gameState.displayCo2 >= 80) {
      const pulseRatio = Math.min((gameState.displayCo2 - 80) / 40, 1);
      const pulsePhase = Math.sin(smogT * 0.4) * 0.5 + 0.5;
      const pulseAlpha = pulseRatio * 0.153 * pulsePhase;
      const pg = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.6);
      pg.addColorStop(0, `rgba(100,80,50,${pulseAlpha})`);
      pg.addColorStop(0.5, `rgba(75,58,35,${pulseAlpha * 0.7})`);
      pg.addColorStop(1, `rgba(50,38,22,${pulseAlpha * 0.3})`);
      ctx.fillStyle = pg;
      ctx.fillRect(0, 0, w, h);
    }
  }

  // UI
  drawResourceUI(ctx, canvas);
  drawActionPointUI(ctx, canvas);
  drawCivilizationUI(ctx, canvas);
  drawCrisisUI(ctx, canvas);
  drawCO2AbsorbUI(ctx, canvas);
  drawCO2TopUI(ctx, canvas);
  drawActionPanel(ctx, canvas);
  drawResourceDetailPanel(ctx);
  drawSettlementAnims(ctx);
  drawDialogueAnims(ctx);
  drawBeastDialogueAnim(ctx);
  drawCO2Particles(ctx);
  drawCO2AnimParticles(ctx);
  drawTechTreePanel(ctx, canvas);
  // 旧版结局界面由结局动画替代
  if (!endingState.active) {
    drawGameOverScreen(ctx, canvas);
  }
  drawPrologue(ctx, w, h);
  drawIntro(ctx, w, h);
  drawEndingOverlay(ctx, w, h);
}

// === 游戏循环 ===
function gameLoop() {
  try {
    if (uiState.isSettling) {
      processSettlePhase(canvas);
    }
    // 平滑过渡 displayCo2 → co2（加速跟随，确保拖动时实时预览烟雾效果）
    const diff = gameState.co2 - gameState.displayCo2;
    if (Math.abs(diff) < 0.1) {
      gameState.displayCo2 = gameState.co2;
    } else {
      gameState.displayCo2 += diff * 0.18; // 0.08→0.18：约2倍速跟随
    }
    updateSettlementAnims();
    updateCO2AnimParticles();
    updateDialogueAnims();
    updateDialogueSchedule();
    updateBeastDialogueAnim();
    updateBeastDialogueSchedule();
    updatePrologue();
    updateIntro();
    // 结局动画更新
    if (endingState.active) {
      const mapLeft = (canvas.width - COLS * HEX_W) / 2;
      const mapRight = mapLeft + COLS * HEX_W;
      const mapTop = (canvas.height - (ROWS - 1) * V_SPACING * PERSPECTIVE) / 2 - 20;
      const mapBottom = mapTop + ROWS * V_SPACING * PERSPECTIVE + HEX_R * PERSPECTIVE;
      const mapCX = (mapLeft + mapRight) / 2;
      const mapCY = (mapTop + mapBottom) / 2;
      updateEndingAnim(canvas.width, canvas.height, mapCX, mapCY);
    }
    // 更新碳兽进食动画状态
    if (beastState.feeding) {
      beastState.feedTimer -= 1 / 60;
      if (beastState.feedTimer <= 0) {
        beastState.feedTimer = 0;
        beastState.feeding = false;
      }
    }
    // 平滑过渡嘴巴/眼睛/膨胀（嘴巴响应更快，眼睛温和）
    // 灭亡动画期间碳兽嘴巴保持张开
    const isBadEnding = endingState.active && endingState.type === 'bad';
    const mouthTarget = beastState.feeding ? beastState.feedIntensity : (isBadEnding ? 0.8 : 0);
    const eyeTarget = beastState.feeding ? beastState.feedIntensity * 0.5 : (isBadEnding ? 0.4 : 0);
    const swellTarget = beastState.feeding ? beastState.feedIntensity * 0.4 : (isBadEnding ? 0.3 : 0);
    beastState.mouthOpenness += (mouthTarget - beastState.mouthOpenness) * 0.12;
    beastState.eyeExcitement += (eyeTarget - beastState.eyeExcitement) * 0.06;
    beastState.bodySwelling += (swellTarget - beastState.bodySwelling) * 0.05;
    draw();
    updateBGM();
  } catch (e) {
    console.error('[gameLoop] Error:', e);
  }
  requestAnimationFrame(gameLoop);
}

gameLoop();

// 用户首次交互时启动BGM（浏览器策略要求用户交互后才能播放音频）
let bgmStarted = false;
function tryStartBGM() {
  if (bgmStarted) return;
  bgmStarted = true;
  startBGM();
}
document.addEventListener('click', tryStartBGM, { once: true });
document.addEventListener('keydown', tryStartBGM, { once: true });
document.addEventListener('touchstart', tryStartBGM, { once: true });
