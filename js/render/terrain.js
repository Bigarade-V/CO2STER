// === CO2STER - Render: Terrain Decorations (Enhanced 2D Art)
// 美术资产：所有地块装饰物绘制函数集中在此，方便后续替换/升级美术

import { HEX_R, seededRandom, rgbStr } from '../config.js';
import { gameState } from '../state.js';

// === 阴影工具 ===
function drawShadow(ctx, x, y, rx, ry, alpha) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(0,0,0,${alpha || 0.1})`;
  ctx.fill();
}

// === 基础装饰元素 ===

export function drawTree(ctx, x, y, scale, seed) {
  const rng = seededRandom(seed);
  const s = scale;
  const trunkW = 5 * s, trunkH = 14 * s;

  // 地面投影
  drawShadow(ctx, x + 3 * s, y + 2 * s, 10 * s, 4 * s, 0.1);

  // 树干（带渐变）
  const tGrad = ctx.createLinearGradient(x - trunkW / 2, y, x + trunkW / 2, y);
  tGrad.addColorStop(0, rgbStr(60 + rng() * 15, 40 + rng() * 10, 20));
  tGrad.addColorStop(0.5, rgbStr(85 + rng() * 20, 60 + rng() * 15, 30));
  tGrad.addColorStop(1, rgbStr(55 + rng() * 15, 35 + rng() * 10, 18));
  ctx.fillStyle = tGrad;
  ctx.fillRect(x - trunkW / 2, y - trunkH, trunkW, trunkH);

  const layers = [
    { w: 22 * s, h: 18 * s, yOff: -trunkH + 2 * s, color: [34, 120, 50] },
    { w: 18 * s, h: 15 * s, yOff: -trunkH - 8 * s, color: [45, 150, 60] },
    { w: 12 * s, h: 12 * s, yOff: -trunkH - 16 * s, color: [60, 175, 75] },
  ];

  for (let li = 0; li < layers.length; li++) {
    const layer = layers[li];
    const lx = x + (rng() - 0.5) * 4 * s;
    const ly = y + layer.yOff;
    const hw = layer.w / 2;
    const variation = rng() * 15;
    const baseColor = rgbStr(layer.color[0] + variation, layer.color[1] + variation, layer.color[2] + variation * 0.5);

    // 圆弧形树冠
    ctx.beginPath();
    ctx.moveTo(lx - hw, ly + 2 * s);
    ctx.quadraticCurveTo(lx - hw * 0.9, ly - layer.h * 0.6, lx, ly - layer.h);
    ctx.quadraticCurveTo(lx + hw * 0.9, ly - layer.h * 0.6, lx + hw, ly + 2 * s);
    ctx.closePath();

    // 树冠渐变
    const cGrad = ctx.createLinearGradient(lx - hw, ly - layer.h, lx + hw * 0.5, ly + 2 * s);
    cGrad.addColorStop(0, adjustColor2(baseColor, 1.18));
    cGrad.addColorStop(0.5, baseColor);
    cGrad.addColorStop(1, adjustColor2(baseColor, 0.78));
    ctx.fillStyle = cGrad;
    ctx.fill();

    // 树冠高光
    ctx.beginPath();
    ctx.moveTo(lx - hw * 0.6, ly - layer.h * 0.15);
    ctx.quadraticCurveTo(lx - hw * 0.5, ly - layer.h * 0.7, lx - hw * 0.1, ly - layer.h * 0.85);
    ctx.quadraticCurveTo(lx, ly - layer.h * 0.5, lx - hw * 0.2, ly - layer.h * 0.1);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fill();

    // 暗面
    ctx.beginPath();
    ctx.moveTo(lx + hw * 0.3, ly - layer.h * 0.8);
    ctx.quadraticCurveTo(lx + hw * 0.85, ly - layer.h * 0.4, lx + hw, ly + 2 * s);
    ctx.quadraticCurveTo(lx + hw * 0.5, ly + 1 * s, lx + hw * 0.2, ly - layer.h * 0.5);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fill();
  }
}

// 辅助：对rgbStr颜色做亮度调整
function adjustColor2(colorStr, factor) {
  const m = colorStr.match(/(\d+)/g);
  if (!m || m.length < 3) return colorStr;
  return rgbStr(+m[0] * factor, +m[1] * factor, +m[2] * factor);
}

export function drawBush(ctx, x, y, scale, seed) {
  const rng = seededRandom(seed);
  const s = scale;
  const g = 100 + rng() * 60;

  drawShadow(ctx, x, y + 2 * s, 6 * s, 2.5 * s, 0.08);

  // 主体
  ctx.beginPath();
  ctx.arc(x, y, 5 * s, 0, Math.PI * 2);
  const bGrad = ctx.createRadialGradient(x - 1.5 * s, y - 1.5 * s, 0, x, y, 5 * s);
  bGrad.addColorStop(0, rgbStr(65 + rng() * 20, g + 20, 55 + rng() * 15));
  bGrad.addColorStop(1, rgbStr(45 + rng() * 15, g - 15, 35 + rng() * 15));
  ctx.fillStyle = bGrad;
  ctx.fill();

  // 侧面小叶
  ctx.beginPath();
  ctx.arc(x - 3 * s, y + 1 * s, 3.5 * s, 0, Math.PI * 2);
  ctx.fillStyle = rgbStr(40 + rng() * 15, g - 10, 30 + rng() * 10);
  ctx.fill();

  // 高光
  ctx.beginPath();
  ctx.arc(x - 1 * s, y - 2 * s, 2 * s, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fill();
}

export function drawRock(ctx, x, y, scale, seed) {
  const rng = seededRandom(seed);
  const s = scale;

  drawShadow(ctx, x + 2 * s, y + 2 * s, 7 * s, 3 * s, 0.1);

  ctx.beginPath();
  ctx.moveTo(x - 6 * s, y + 2 * s);
  ctx.lineTo(x - 4 * s, y - 5 * s);
  ctx.lineTo(x + 1 * s, y - 7 * s);
  ctx.lineTo(x + 6 * s, y - 3 * s);
  ctx.lineTo(x + 5 * s, y + 2 * s);
  ctx.closePath();

  const v = 110 + rng() * 40;
  // 岩石主体渐变
  const rGrad = ctx.createLinearGradient(x - 6 * s, y - 7 * s, x + 6 * s, y + 2 * s);
  rGrad.addColorStop(0, rgbStr(v + 15, v + 10, v + 5));
  rGrad.addColorStop(0.5, rgbStr(v, v - 5, v - 10));
  rGrad.addColorStop(1, rgbStr(v - 20, v - 25, v - 30));
  ctx.fillStyle = rGrad;
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // 暗面
  ctx.beginPath();
  ctx.moveTo(x + 1 * s, y - 7 * s);
  ctx.lineTo(x + 6 * s, y - 3 * s);
  ctx.lineTo(x + 5 * s, y + 2 * s);
  ctx.lineTo(x + 1 * s, y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fill();

  // 高光
  ctx.beginPath();
  ctx.moveTo(x - 4 * s, y - 5 * s);
  ctx.lineTo(x + 1 * s, y - 7 * s);
  ctx.lineTo(x - 1 * s, y - 4 * s);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fill();
}

export function drawMushroom(ctx, x, y, scale, seed) {
  const rng = seededRandom(seed);
  const s = scale;

  drawShadow(ctx, x, y + 1 * s, 4 * s, 1.5 * s, 0.06);

  // 茎
  const stemGrad = ctx.createLinearGradient(x - 1.2 * s, y, x + 1.2 * s, y);
  stemGrad.addColorStop(0, rgbStr(200, 190, 170));
  stemGrad.addColorStop(0.5, rgbStr(230, 220, 200));
  stemGrad.addColorStop(1, rgbStr(180, 170, 155));
  ctx.fillStyle = stemGrad;
  ctx.fillRect(x - 1.2 * s, y - 5 * s, 2.4 * s, 5 * s);

  // 伞盖
  ctx.beginPath();
  ctx.arc(x, y - 5 * s, 4 * s, Math.PI, 0);
  const capGrad = ctx.createRadialGradient(x - 1 * s, y - 6 * s, 0, x, y - 5 * s, 4 * s);
  capGrad.addColorStop(0, rgbStr(200 + rng() * 40, 80 + rng() * 30, 60));
  capGrad.addColorStop(1, rgbStr(160 + rng() * 30, 40 + rng() * 20, 35));
  ctx.fillStyle = capGrad;
  ctx.fill();

  // 伞盖高光
  ctx.beginPath();
  ctx.arc(x - 1 * s, y - 6.5 * s, 1.8 * s, Math.PI, Math.PI * 1.8);
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fill();

  // 白点
  ctx.beginPath();
  ctx.arc(x - 1.5 * s, y - 6.5 * s, 1 * s, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 1 * s, y - 5.8 * s, 0.7 * s, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fill();
}

export function drawDeadGrass(ctx, x, y, s, rng) {
  for (let i = -1; i <= 1; i++) {
    const tipX = x + i * 2 * s + (rng() - 0.5) * 3;
    const tipY = y - 6 * s;
    const cpX = x + i * 3 * s + (rng() - 0.5) * 2;
    const cpY = y - 3 * s;
    ctx.beginPath();
    ctx.moveTo(x + i * 3 * s, y);
    ctx.quadraticCurveTo(cpX, cpY, tipX, tipY);
    ctx.strokeStyle = rgbStr(140 + rng() * 30, 120 + rng() * 20, 60);
    ctx.lineWidth = 1.2 * s;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}

export function drawStump(ctx, x, y, s) {
  drawShadow(ctx, x + 2 * s, y + 3 * s, 10 * s, 4 * s, 0.1);

  ctx.beginPath();
  ctx.ellipse(x, y - 4.5 * s, 9 * s, 4.5 * s, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#8d6e3a';
  ctx.fill();

  // 年轮
  ctx.beginPath();
  ctx.ellipse(x, y - 4.5 * s, 6 * s, 3 * s, 0, 0, Math.PI * 2);
  ctx.strokeStyle = '#a08050';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, y - 4.5 * s, 3 * s, 1.5 * s, 0, 0, Math.PI * 2);
  ctx.strokeStyle = '#907040';
  ctx.lineWidth = 0.6;
  ctx.stroke();

  // 侧面
  const sideGrad = ctx.createLinearGradient(x - 9 * s, y - 4.5 * s, x + 9 * s, y + 3 * s);
  sideGrad.addColorStop(0, '#7d5e2a');
  sideGrad.addColorStop(1, '#5a4525');
  ctx.fillStyle = sideGrad;
  ctx.fillRect(x - 9 * s, y - 4.5 * s, 18 * s, 7.5 * s);

  ctx.beginPath();
  ctx.ellipse(x, y + 3 * s, 9 * s, 3 * s, 0, 0, Math.PI);
  ctx.fillStyle = '#5a4525';
  ctx.fill();
}

export function drawGreenGrass(ctx, x, y, s, rng) {
  const t = Date.now() / 2000;
  for (let i = -1; i <= 1; i++) {
    const sway = Math.sin(t + x * 0.1 + i) * 2 * s;
    ctx.beginPath();
    ctx.moveTo(x + i * 3 * s, y);
    ctx.quadraticCurveTo(x + i * 2 * s + (rng() - 0.5) * 2 + sway * 0.5, y - 4 * s, x + i * s + sway, y - 7 * s);
    ctx.strokeStyle = rgbStr(80 + rng() * 40, 140 + rng() * 40, 40 + rng() * 20);
    ctx.lineWidth = 1.5 * s;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}

export function drawSapling(ctx, x, y, s, rng) {
  drawShadow(ctx, x, y + 1 * s, 4 * s, 1.5 * s, 0.06);

  // 茎
  const stemGrad = ctx.createLinearGradient(x - 1 * s, y, x + 1 * s, y);
  stemGrad.addColorStop(0, rgbStr(80 + rng() * 15, 55 + rng() * 10, 30));
  stemGrad.addColorStop(1, rgbStr(100 + rng() * 20, 70 + rng() * 15, 35));
  ctx.strokeStyle = stemGrad;
  ctx.lineWidth = 2 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 8 * s);
  ctx.stroke();

  // 主体叶球
  ctx.beginPath();
  ctx.arc(x, y - 10 * s, 5 * s, 0, Math.PI * 2);
  const sapGrad = ctx.createRadialGradient(x - 1 * s, y - 11 * s, 0, x, y - 10 * s, 5 * s);
  sapGrad.addColorStop(0, rgbStr(80 + rng() * 30, 180 + rng() * 30, 70 + rng() * 20));
  sapGrad.addColorStop(1, rgbStr(50 + rng() * 20, 130 + rng() * 30, 40 + rng() * 15));
  ctx.fillStyle = sapGrad;
  ctx.fill();

  // 小叶球
  ctx.beginPath();
  ctx.arc(x - 2 * s, y - 12 * s, 3 * s, 0, Math.PI * 2);
  ctx.fillStyle = rgbStr(70 + rng() * 30, 170 + rng() * 30, 60 + rng() * 20);
  ctx.fill();
}

// 采石场大岩石
export function drawQuarryRock(ctx, x, y, scale, rng) {
  const s = scale;

  drawShadow(ctx, x + 3 * s, y + 3 * s, 10 * s, 4 * s, 0.12);

  ctx.beginPath();
  ctx.moveTo(x - 8 * s, y + 3 * s);
  ctx.lineTo(x - 6 * s, y - 8 * s);
  ctx.lineTo(x - 1 * s, y - 12 * s);
  ctx.lineTo(x + 5 * s, y - 9 * s);
  ctx.lineTo(x + 8 * s, y - 2 * s);
  ctx.lineTo(x + 6 * s, y + 3 * s);
  ctx.closePath();

  const base = 130 + rng() * 30;
  const qrGrad = ctx.createLinearGradient(x - 8 * s, y - 12 * s, x + 8 * s, y + 3 * s);
  qrGrad.addColorStop(0, rgbStr(base + 20, base + 15, base + 5));
  qrGrad.addColorStop(0.5, rgbStr(base, base - 3, base - 8));
  qrGrad.addColorStop(1, rgbStr(base - 25, base - 28, base - 35));
  ctx.fillStyle = qrGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // 暗面
  ctx.beginPath();
  ctx.moveTo(x + 2 * s, y - 10 * s);
  ctx.lineTo(x + 8 * s, y - 2 * s);
  ctx.lineTo(x + 6 * s, y + 3 * s);
  ctx.lineTo(x + 2 * s, y - 1 * s);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fill();

  // 高光
  ctx.beginPath();
  ctx.moveTo(x - 6 * s, y - 8 * s);
  ctx.lineTo(x - 1 * s, y - 12 * s);
  ctx.lineTo(x - 2 * s, y - 7 * s);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fill();

  // 裂纹
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(x - 4 * s, y - 5 * s);
  ctx.lineTo(x + 4 * s, y - 4 * s);
  ctx.moveTo(x - 2 * s, y - 2 * s);
  ctx.lineTo(x + 5 * s, y);
  ctx.stroke();
}

export function drawPickaxe(ctx, x, y, s, rng) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.4 + rng() * 0.2);

  // 木柄
  const handleGrad = ctx.createLinearGradient(-1.2 * s, 0, 1.2 * s, 0);
  handleGrad.addColorStop(0, '#5a3a20');
  handleGrad.addColorStop(0.5, '#7d5535');
  handleGrad.addColorStop(1, '#5a3a20');
  ctx.strokeStyle = handleGrad;
  ctx.lineWidth = 2.5 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 8 * s);
  ctx.lineTo(0, -8 * s);
  ctx.stroke();

  // 金属头
  const metalGrad = ctx.createLinearGradient(-6 * s, -10 * s, 6 * s, -5 * s);
  metalGrad.addColorStop(0, '#90a4ae');
  metalGrad.addColorStop(0.5, '#b0bec5');
  metalGrad.addColorStop(1, '#78909c');
  ctx.fillStyle = metalGrad;
  ctx.beginPath();
  ctx.moveTo(-6 * s, -7 * s);
  ctx.lineTo(0, -10 * s);
  ctx.lineTo(6 * s, -7 * s);
  ctx.lineTo(4 * s, -5 * s);
  ctx.lineTo(-4 * s, -5 * s);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 0.6;
  ctx.stroke();

  ctx.restore();
}

export function drawStonePile(ctx, x, y, s, rng) {
  drawShadow(ctx, x + 2 * s, y + 3 * s, 8 * s, 3 * s, 0.08);

  const stones = [
    { dx: 0, dy: 0, rx: 5, ry: 3.5 },
    { dx: -5, dy: -1, rx: 4, ry: 2.5 },
    { dx: 5, dy: -1, rx: 4, ry: 2.8 },
    { dx: -2, dy: -4, rx: 3.5, ry: 2 },
    { dx: 3, dy: -3.5, rx: 3, ry: 2 },
  ];
  for (const st of stones) {
    ctx.beginPath();
    ctx.ellipse(x + st.dx * s, y + st.dy * s, st.rx * s, st.ry * s, rng() * 0.3, 0, Math.PI * 2);
    const v = 140 + rng() * 30;
    const spGrad = ctx.createRadialGradient(x + (st.dx - 1) * s, y + (st.dy - 1) * s, 0, x + st.dx * s, y + st.dy * s, st.rx * s);
    spGrad.addColorStop(0, rgbStr(v + 10, v + 5, v - 2));
    spGrad.addColorStop(1, rgbStr(v - 10, v - 15, v - 22));
    ctx.fillStyle = spGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
}

export function drawWoodSupport(ctx, x, y, s, rng) {
  // 左柱
  const lpGrad = ctx.createLinearGradient(x - 1.2 * s, 0, x + 1.2 * s, 0);
  lpGrad.addColorStop(0, '#4a2a10');
  lpGrad.addColorStop(0.5, '#6d4c30');
  lpGrad.addColorStop(1, '#4a2a10');
  ctx.strokeStyle = lpGrad;
  ctx.lineWidth = 2.5 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y + 10 * s);
  ctx.lineTo(x - 2 * s, y - 6 * s);
  ctx.stroke();

  // 右柱
  const rpGrad = ctx.createLinearGradient(x + 8.8 * s, 0, x + 11.2 * s, 0);
  rpGrad.addColorStop(0, '#4a2a10');
  rpGrad.addColorStop(0.5, '#6d4c30');
  rpGrad.addColorStop(1, '#4a2a10');
  ctx.strokeStyle = rpGrad;
  ctx.beginPath();
  ctx.moveTo(x + 10 * s, y + 10 * s);
  ctx.lineTo(x + 12 * s, y - 6 * s);
  ctx.stroke();

  // 横梁
  ctx.strokeStyle = '#5d3a1a';
  ctx.lineWidth = 2 * s;
  ctx.beginPath();
  ctx.moveTo(x - 3 * s, y - 5 * s);
  ctx.lineTo(x + 13 * s, y - 5 * s);
  ctx.stroke();
}

export function drawSmallStone(ctx, x, y, scale, rng) {
  const s = scale;
  ctx.beginPath();
  ctx.ellipse(x, y, 3 * s, 2 * s, rng() * 0.5, 0, Math.PI * 2);
  const v = 120 + rng() * 30;
  const ssGrad = ctx.createRadialGradient(x - 1 * s, y - 0.5 * s, 0, x, y, 3 * s);
  ssGrad.addColorStop(0, rgbStr(v + 8, v + 5, v - 2));
  ssGrad.addColorStop(1, rgbStr(v - 5, v - 8, v - 14));
  ctx.fillStyle = ssGrad;
  ctx.fill();
}

// === 帐篷 & 篝火（0级聚落） ===

export function drawTent(ctx, x, y, s, rng) {
  const w = 16 * s, h = 12 * s;

  drawShadow(ctx, x + w / 2, y + 2 * s, 10 * s, 3 * s, 0.08);

  // 帐篷主体
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w / 2, y - h);
  ctx.lineTo(x + w, y);
  ctx.closePath();
  const tentGrad = ctx.createLinearGradient(x, y, x + w, y - h);
  tentGrad.addColorStop(0, rgbStr(170 + rng() * 25, 130 + rng() * 15, 75));
  tentGrad.addColorStop(1, rgbStr(145 + rng() * 20, 105 + rng() * 15, 60));
  ctx.fillStyle = tentGrad;
  ctx.fill();

  // 暗面
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y - h);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w * 0.55, y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fill();

  // 入口
  ctx.beginPath();
  ctx.moveTo(x + w * 0.35, y);
  ctx.lineTo(x + w * 0.5, y - h * 0.4);
  ctx.lineTo(x + w * 0.65, y);
  ctx.closePath();
  ctx.fillStyle = '#3a2a1a';
  ctx.fill();
}

export function drawCampfire(ctx, x, y, s) {
  // 地面光晕
  ctx.beginPath();
  ctx.arc(x, y + 1 * s, 8 * s, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,150,30,0.06)';
  ctx.fill();

  // 木柴
  const woodGrad = ctx.createLinearGradient(-4 * s, 0, 4 * s, 0);
  woodGrad.addColorStop(0, '#4a2a10');
  woodGrad.addColorStop(0.5, '#6d4520');
  woodGrad.addColorStop(1, '#4a2a10');
  ctx.strokeStyle = woodGrad;
  ctx.lineWidth = 2 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 4 * s, y + 2 * s);
  ctx.lineTo(x + 4 * s, y - 1 * s);
  ctx.moveTo(x + 4 * s, y + 2 * s);
  ctx.lineTo(x - 4 * s, y - 1 * s);
  ctx.stroke();

  // 外焰
  const t = Date.now() / 300;
  const flicker = Math.sin(t) * 0.3 + 0.7;
  ctx.beginPath();
  ctx.moveTo(x - 3 * s, y);
  ctx.quadraticCurveTo(x - 1 * s, y - 8 * s * flicker, x, y - 6 * s);
  ctx.quadraticCurveTo(x + 1 * s, y - 10 * s * flicker, x + 2 * s, y - 4 * s);
  ctx.quadraticCurveTo(x + 4 * s, y - 2 * s, x + 3 * s, y);
  ctx.closePath();
  const fireGrad = ctx.createRadialGradient(x, y - 3 * s, 0, x, y - 4 * s, 6 * s);
  fireGrad.addColorStop(0, '#ff6600');
  fireGrad.addColorStop(1, '#cc3300');
  ctx.fillStyle = fireGrad;
  ctx.fill();

  // 内焰
  ctx.beginPath();
  ctx.moveTo(x - 1.5 * s, y);
  ctx.quadraticCurveTo(x, y - 5 * s * flicker, x + 1.5 * s, y);
  ctx.closePath();
  ctx.fillStyle = '#ffcc00';
  ctx.fill();

  // 光晕
  ctx.beginPath();
  ctx.arc(x, y - 2 * s, 7 * s, 0, Math.PI * 2);
  const glowGrad = ctx.createRadialGradient(x, y - 2 * s, 0, x, y - 2 * s, 7 * s);
  glowGrad.addColorStop(0, 'rgba(255,180,50,0.12)');
  glowGrad.addColorStop(1, 'rgba(255,150,30,0)');
  ctx.fillStyle = glowGrad;
  ctx.fill();
}

// === 木屋（1级聚落） ===

export function drawCabin(ctx, x, y, s, rng) {
  const w = 16 * s, h = 14 * s;

  drawShadow(ctx, x + w / 2, y + 2 * s, 12 * s, 4 * s, 0.1);

  // 墙体
  const wallGrad = ctx.createLinearGradient(x, y - h, x + w, y);
  wallGrad.addColorStop(0, rgbStr(140 + rng() * 20, 100 + rng() * 15, 55));
  wallGrad.addColorStop(1, rgbStr(115 + rng() * 15, 78 + rng() * 10, 40));
  ctx.fillStyle = wallGrad;
  ctx.fillRect(x, y - h, w, h);

  // 木纹
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 4; i++) {
    const ly = y - h + (i + 1) * h / 4;
    ctx.beginPath();
    ctx.moveTo(x, ly);
    ctx.lineTo(x + w, ly);
    ctx.stroke();
  }

  // 右侧暗面
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fillRect(x + w * 0.55, y - h, w * 0.45, h);

  // 屋顶
  ctx.beginPath();
  ctx.moveTo(x - 2, y - h);
  ctx.lineTo(x + w / 2, y - h - 8 * s);
  ctx.lineTo(x + w + 2, y - h);
  ctx.closePath();
  const roofGrad = ctx.createLinearGradient(x, y - h - 8 * s, x + w, y - h);
  roofGrad.addColorStop(0, '#7d4030');
  roofGrad.addColorStop(1, '#5d2a1a');
  ctx.fillStyle = roofGrad;
  ctx.fill();

  // 屋顶暗面
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y - h - 8 * s);
  ctx.lineTo(x + w + 2, y - h);
  ctx.lineTo(x + w * 0.5, y - h);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fill();

  // 门
  ctx.fillStyle = '#3a2010';
  ctx.fillRect(x + w * 0.35, y - h * 0.5, w * 0.3, h * 0.5);

  // 窗户（带光晕）
  ctx.fillStyle = 'rgba(255,220,120,0.6)';
  ctx.fillRect(x + 3 * s, y - h + 3 * s, 4 * s, 3.5 * s);
  ctx.strokeStyle = '#5a3a1a';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(x + 3 * s, y - h + 3 * s, 4 * s, 3.5 * s);
  // 窗户十字
  ctx.beginPath();
  ctx.moveTo(x + 5 * s, y - h + 3 * s);
  ctx.lineTo(x + 5 * s, y - h + 6.5 * s);
  ctx.moveTo(x + 3 * s, y - h + 4.75 * s);
  ctx.lineTo(x + 7 * s, y - h + 4.75 * s);
  ctx.stroke();
}

// === 建筑（2级+聚落） ===

export function drawBuilding(ctx, x, y, s, rng) {
  const w = 16 * s, h = 20 * s;

  drawShadow(ctx, x + w / 2, y + 2 * s, 14 * s, 5 * s, 0.12);

  // 墙体
  const bGrad = ctx.createLinearGradient(x, y - h, x + w, y);
  bGrad.addColorStop(0, '#8899a8');
  bGrad.addColorStop(0.5, '#78909c');
  bGrad.addColorStop(1, '#607d8b');
  ctx.fillStyle = bGrad;
  ctx.fillRect(x, y - h, w, h);

  // 右侧暗面
  ctx.fillStyle = '#546e7a';
  ctx.fillRect(x + w, y - h + 2, 3 * s, h);

  // 屋顶
  ctx.beginPath();
  ctx.moveTo(x - 2, y - h);
  ctx.lineTo(x + w / 2, y - h - 8 * s);
  ctx.lineTo(x + w + 2, y - h);
  ctx.closePath();
  const roofGrad = ctx.createLinearGradient(x, y - h - 8 * s, x + w, y - h);
  roofGrad.addColorStop(0, '#546e7a');
  roofGrad.addColorStop(1, '#3a4f5a');
  ctx.fillStyle = roofGrad;
  ctx.fill();

  // 窗户（暖光）
  ctx.fillStyle = 'rgba(255,235,150,0.7)';
  for (let wy = 0; wy < 2; wy++) {
    for (let wx = 0; wx < 2; wx++) {
      const winX = x + 3 * s + wx * 6 * s;
      const winY = y - h + 5 * s + wy * 7 * s;
      ctx.fillRect(winX, winY, 3 * s, 3 * s);
      // 窗框
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(winX, winY, 3 * s, 3 * s);
    }
  }
}

// === 砖瓦房屋（2级文明）===
export function drawBrickHouse(ctx, x, y, s, rng) {
  const w = 14 * s, h = 18 * s;

  drawShadow(ctx, x + w / 2, y + 2 * s, 12 * s, 4 * s, 0.12);

  // 砖墙
  const bGrad = ctx.createLinearGradient(x, y - h, x + w, y);
  bGrad.addColorStop(0, '#c4785a');
  bGrad.addColorStop(0.5, '#b5624a');
  bGrad.addColorStop(1, '#a04838');
  ctx.fillStyle = bGrad;
  ctx.fillRect(x, y - h, w, h);

  // 砖纹
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 0.4;
  for (let row = 0; row < 5; row++) {
    const ly = y - h + (row + 1) * h / 5;
    ctx.beginPath();
    ctx.moveTo(x, ly);
    ctx.lineTo(x + w, ly);
    ctx.stroke();
    const offset = (row % 2) * w / 4;
    for (let col = 0; col < 3; col++) {
      const lx = x + offset + col * w / 2;
      if (lx > x && lx < x + w) {
        ctx.beginPath();
        ctx.moveTo(lx, ly - h / 5);
        ctx.lineTo(lx, ly);
        ctx.stroke();
      }
    }
  }

  // 右侧暗面
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fillRect(x + w * 0.55, y - h, w * 0.45, h);

  // 瓦片屋顶
  ctx.beginPath();
  ctx.moveTo(x - 2, y - h);
  ctx.lineTo(x + w / 2, y - h - 8 * s);
  ctx.lineTo(x + w + 2, y - h);
  ctx.closePath();
  const roofGrad = ctx.createLinearGradient(x, y - h - 8 * s, x + w, y - h);
  roofGrad.addColorStop(0, '#8d4e3a');
  roofGrad.addColorStop(1, '#6d3a28');
  ctx.fillStyle = roofGrad;
  ctx.fill();
  // 瓦片纹理
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 0.4;
  for (let i = 1; i <= 3; i++) {
    const ty = y - h - 8 * s + i * 2 * s;
    ctx.beginPath();
    ctx.moveTo(x - 1, y - h + i * 2 * s);
    ctx.lineTo(x + w / 2, y - h - 8 * s + i * 2 * s);
    ctx.stroke();
  }

  // 窗户（暖光）
  ctx.fillStyle = 'rgba(255,235,150,0.7)';
  for (let wy = 0; wy < 2; wy++) {
    for (let wx = 0; wx < 2; wx++) {
      const winX = x + 2 * s + wx * 5 * s;
      const winY = y - h + 4 * s + wy * 6 * s;
      ctx.fillRect(winX, winY, 3 * s, 2.5 * s);
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(winX, winY, 3 * s, 2.5 * s);
    }
  }

  // 门
  ctx.fillStyle = '#5d3420';
  ctx.fillRect(x + w / 2 - 1.5 * s, y - 5 * s, 3 * s, 5 * s);
}

export function drawPath(ctx, x1, y1, x2, y2, w) {
  // 路径（带渐变质感）
  ctx.strokeStyle = '#7a6e5a';
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  // 边线
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = w + 1;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// === 生态大树 ===

export function drawEcoTree(ctx, x, y, scale, rng) {
  const s = scale;
  const trunkW = 6 * s, trunkH = 16 * s;

  drawShadow(ctx, x + 3 * s, y + 3 * s, 14 * s, 5 * s, 0.12);

  // 树干
  const tGrad = ctx.createLinearGradient(x - trunkW / 2, y, x + trunkW / 2, y);
  tGrad.addColorStop(0, rgbStr(45 + rng() * 10, 30 + rng() * 8, 15));
  tGrad.addColorStop(0.5, rgbStr(65 + rng() * 15, 45 + rng() * 10, 22));
  tGrad.addColorStop(1, rgbStr(40 + rng() * 10, 28 + rng() * 8, 12));
  ctx.fillStyle = tGrad;
  ctx.fillRect(x - trunkW / 2, y - trunkH, trunkW, trunkH);

  const layers = [
    { w: 28 * s, h: 20 * s, yOff: -trunkH + 2 * s, color: [15, 90, 30] },
    { w: 22 * s, h: 18 * s, yOff: -trunkH - 10 * s, color: [20, 110, 40] },
    { w: 16 * s, h: 14 * s, yOff: -trunkH - 20 * s, color: [30, 130, 50] },
  ];

  for (const layer of layers) {
    const lx = x + (rng() - 0.5) * 3 * s;
    const ly = y + layer.yOff;
    const hw = layer.w / 2;
    const variation = rng() * 10;
    const baseColor = rgbStr(layer.color[0] + variation, layer.color[1] + variation, layer.color[2] + variation * 0.5);

    // 圆弧形生态树冠
    ctx.beginPath();
    ctx.moveTo(lx - hw, ly + 2 * s);
    ctx.quadraticCurveTo(lx - hw * 0.9, ly - layer.h * 0.65, lx, ly - layer.h);
    ctx.quadraticCurveTo(lx + hw * 0.9, ly - layer.h * 0.65, lx + hw, ly + 2 * s);
    ctx.closePath();

    const cGrad = ctx.createLinearGradient(lx - hw, ly - layer.h, lx + hw * 0.5, ly + 2 * s);
    cGrad.addColorStop(0, adjustColor2(baseColor, 1.2));
    cGrad.addColorStop(0.5, baseColor);
    cGrad.addColorStop(1, adjustColor2(baseColor, 0.75));
    ctx.fillStyle = cGrad;
    ctx.fill();

    // 暗面
    ctx.beginPath();
    ctx.moveTo(lx + hw * 0.3, ly - layer.h * 0.8);
    ctx.quadraticCurveTo(lx + hw * 0.85, ly - layer.h * 0.35, lx + hw, ly + 2 * s);
    ctx.quadraticCurveTo(lx + hw * 0.5, ly + 1 * s, lx + hw * 0.2, ly - layer.h * 0.5);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fill();
  }
}

// === 挖掘机 ===
export function drawExcavator(ctx, x, y, s, rng) {
  // 地面投影
  drawShadow(ctx, x + 4 * s, y + 3 * s, 14 * s, 5 * s, 0.12);

  // 履带
  ctx.fillStyle = '#2a2a2a';
  ctx.beginPath();
  ctx.roundRect(x - 14 * s, y + 4 * s, 28 * s, 8 * s, 4 * s);
  ctx.fill();
  // 履带纹路
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1 * s;
  for (let i = 0; i < 6; i++) {
    const lx = x - 11 * s + i * 5 * s;
    ctx.beginPath();
    ctx.moveTo(lx, y + 5 * s);
    ctx.lineTo(lx, y + 11 * s);
    ctx.stroke();
  }
  // 履带高光
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(x - 12 * s, y + 5 * s, 24 * s, 3 * s);

  // 车身
  const bodyGrad = ctx.createLinearGradient(x - 10 * s, y - 6 * s, x + 8 * s, y + 4 * s);
  bodyGrad.addColorStop(0, '#e8a830');
  bodyGrad.addColorStop(0.6, '#d49520');
  bodyGrad.addColorStop(1, '#b07818');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.roundRect(x - 10 * s, y - 6 * s, 18 * s, 10 * s, 2 * s);
  ctx.fill();
  // 车身暗面
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fillRect(x + 2 * s, y - 6 * s, 6 * s, 10 * s);
  // 车身高光
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(x - 9 * s, y - 5 * s, 10 * s, 3 * s);

  // 驾驶室
  const cabGrad = ctx.createLinearGradient(x - 6 * s, y - 16 * s, x + 6 * s, y - 6 * s);
  cabGrad.addColorStop(0, '#556680');
  cabGrad.addColorStop(1, '#3a4a5a');
  ctx.fillStyle = cabGrad;
  ctx.beginPath();
  ctx.roundRect(x - 6 * s, y - 16 * s, 12 * s, 10 * s, 2 * s);
  ctx.fill();
  // 窗户
  ctx.fillStyle = 'rgba(140,200,255,0.55)';
  ctx.fillRect(x - 4 * s, y - 14 * s, 8 * s, 5 * s);
  // 窗框
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 0.8 * s;
  ctx.strokeRect(x - 4 * s, y - 14 * s, 8 * s, 5 * s);
  // 窗户反光
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(x - 3 * s, y - 13.5 * s, 3 * s, 3.5 * s);

  // 机械臂
  ctx.save();
  ctx.translate(x + 5 * s, y - 8 * s);
  ctx.rotate(-0.7);
  // 上臂
  const armGrad = ctx.createLinearGradient(0, 0, 0, -18 * s);
  armGrad.addColorStop(0, '#e8a830');
  armGrad.addColorStop(1, '#d49520');
  ctx.fillStyle = armGrad;
  ctx.fillRect(-2 * s, -18 * s, 4 * s, 18 * s);
  // 关节
  ctx.beginPath();
  ctx.arc(0, 0, 3 * s, 0, Math.PI * 2);
  ctx.fillStyle = '#888';
  ctx.fill();
  // 铲斗
  ctx.translate(0, -18 * s);
  ctx.rotate(0.5);
  ctx.beginPath();
  ctx.moveTo(-5 * s, 0);
  ctx.lineTo(-6 * s, 6 * s);
  ctx.lineTo(4 * s, 6 * s);
  ctx.lineTo(5 * s, 0);
  ctx.closePath();
  const bucketGrad = ctx.createLinearGradient(-6 * s, 0, 5 * s, 6 * s);
  bucketGrad.addColorStop(0, '#aaa');
  bucketGrad.addColorStop(1, '#777');
  ctx.fillStyle = bucketGrad;
  ctx.fill();
  // 铲齿
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1.2 * s;
  for (let i = 0; i < 4; i++) {
    const tx = -4 * s + i * 2.5 * s;
    ctx.beginPath();
    ctx.moveTo(tx, 6 * s);
    ctx.lineTo(tx, 8 * s);
    ctx.stroke();
  }
  ctx.restore();
}

// === 伐木机 ===
export function drawTimberHarvester(ctx, x, y, s, rng) {
  // 地面投影
  drawShadow(ctx, x + 4 * s, y + 3 * s, 14 * s, 5 * s, 0.12);

  // 轮子
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(x - 8 * s, y + 5 * s, 4 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 8 * s, y + 5 * s, 4 * s, 0, Math.PI * 2);
  ctx.fill();
  // 轮毂
  ctx.fillStyle = '#555';
  ctx.beginPath();
  ctx.arc(x - 8 * s, y + 5 * s, 1.5 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 8 * s, y + 5 * s, 1.5 * s, 0, Math.PI * 2);
  ctx.fill();

  // 车身
  const bodyGrad = ctx.createLinearGradient(x - 10 * s, y - 5 * s, x + 10 * s, y + 4 * s);
  bodyGrad.addColorStop(0, '#4a8a3a');
  bodyGrad.addColorStop(0.6, '#3a7530');
  bodyGrad.addColorStop(1, '#2a5a22');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.roundRect(x - 10 * s, y - 5 * s, 20 * s, 9 * s, 2 * s);
  ctx.fill();
  // 车身暗面
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fillRect(x + 2 * s, y - 5 * s, 8 * s, 9 * s);
  // 车身高光
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(x - 9 * s, y - 4 * s, 10 * s, 3 * s);

  // 驾驶室
  const cabGrad = ctx.createLinearGradient(x - 5 * s, y - 14 * s, x + 5 * s, y - 5 * s);
  cabGrad.addColorStop(0, '#556680');
  cabGrad.addColorStop(1, '#3a4a5a');
  ctx.fillStyle = cabGrad;
  ctx.beginPath();
  ctx.roundRect(x - 5 * s, y - 14 * s, 10 * s, 9 * s, 2 * s);
  ctx.fill();
  // 窗户
  ctx.fillStyle = 'rgba(140,200,255,0.5)';
  ctx.fillRect(x - 3 * s, y - 12 * s, 6 * s, 5 * s);
  // 窗户反光
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(x - 2 * s, y - 11.5 * s, 2 * s, 3 * s);

  // 机械臂（带锯片）
  ctx.save();
  ctx.translate(x + 7 * s, y - 8 * s);
  ctx.rotate(-0.5);
  // 上臂
  const armGrad = ctx.createLinearGradient(0, 0, 0, -14 * s);
  armGrad.addColorStop(0, '#4a8a3a');
  armGrad.addColorStop(1, '#3a7530');
  ctx.fillStyle = armGrad;
  ctx.fillRect(-2 * s, -14 * s, 4 * s, 14 * s);
  // 关节
  ctx.beginPath();
  ctx.arc(0, 0, 2.5 * s, 0, Math.PI * 2);
  ctx.fillStyle = '#888';
  ctx.fill();
  // 锯片
  ctx.translate(0, -14 * s);
  const sawR = 5 * s;
  const t = Date.now() / 200;
  const sawRot = t * 2;
  ctx.save();
  ctx.rotate(sawRot);
  // 锯片主体
  ctx.beginPath();
  ctx.arc(0, 0, sawR, 0, Math.PI * 2);
  const sawGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sawR);
  sawGrad.addColorStop(0, '#bbb');
  sawGrad.addColorStop(0.5, '#999');
  sawGrad.addColorStop(1, '#666');
  ctx.fillStyle = sawGrad;
  ctx.fill();
  // 锯齿
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1 * s;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * sawR, Math.sin(a) * sawR);
    ctx.lineTo(Math.cos(a) * (sawR + 2 * s), Math.sin(a) * (sawR + 2 * s));
    ctx.stroke();
  }
  // 中心孔
  ctx.beginPath();
  ctx.arc(0, 0, 1.5 * s, 0, Math.PI * 2);
  ctx.fillStyle = '#444';
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

// === 3D箱子 ===

export function drawCrate3D(ctx, x, y, s) {
  const w = 12 * s, h = 10 * s, d = 3 * s;

  drawShadow(ctx, x + w / 2 + d / 2, y + h + 2 * s, 8 * s, 3 * s, 0.1);

  // 顶面
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + d, y - d);
  ctx.lineTo(x + w + d, y - d);
  ctx.lineTo(x + w, y);
  ctx.closePath();
  const topGrad = ctx.createLinearGradient(x, y - d, x + w + d, y);
  topGrad.addColorStop(0, '#d8b890');
  topGrad.addColorStop(1, '#c49a6c');
  ctx.fillStyle = topGrad;
  ctx.fill();

  // 正面
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  const fGrad = ctx.createLinearGradient(x, y, x + w, y + h);
  fGrad.addColorStop(0, '#c49a6c');
  fGrad.addColorStop(1, '#9a6e3a');
  ctx.fillStyle = fGrad;
  ctx.fill();

  // 右面
  ctx.beginPath();
  ctx.moveTo(x + w, y);
  ctx.lineTo(x + w + d, y - d);
  ctx.lineTo(x + w + d, y + h - d);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fillStyle = '#7d5530';
  ctx.fill();

  // 正面木条
  ctx.fillStyle = '#d4aa78';
  ctx.fillRect(x, y + 3.5 * s, w, 1.8 * s);
  ctx.fillRect(x, y + 7 * s, w, 1.5 * s);
  ctx.fillRect(x + 4.5 * s, y, 1.8 * s, h);

  // 顶面木条
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + d, y - d);
  ctx.lineTo(x + w + d, y - d);
  ctx.lineTo(x + w, y);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = '#d8b48c';
  ctx.fillRect(x, y - 0.8 * s, w + d, 1.2 * s);
  ctx.fillRect(x, y - 2.5 * s, w + d, 1.2 * s);
  ctx.restore();

  // 正面高光
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(x, y, w * 0.5, h);
}
