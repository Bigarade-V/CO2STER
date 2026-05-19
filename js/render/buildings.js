// === CO2STER - Render: Building Decorations (Enhanced 2D Art)
// 美术资产：所有建筑类地块装饰绘制函数

import { HEX_R, ROWS, COLS, seededRandom, rgbStr } from '../config.js';
import { gameState } from '../state.js';
import { tiles } from '../map.js';
import { drawBush, drawTree, drawEcoTree, drawQuarryRock, drawSmallStone, drawPickaxe, drawStonePile, drawWoodSupport, drawCampfire, drawCabin, drawBuilding, drawBrickHouse, drawPath, drawTent, drawDeadGrass, drawStump, drawRock, drawGreenGrass, drawSapling, drawMushroom, drawCrate3D, drawExcavator, drawTimberHarvester } from './terrain.js';

// === 林地装饰 ===
export function drawForestDecor(ctx, cx, cy, seed) {
  const rng = seededRandom(seed);
  const decorations = [];
  const treeCount = 3 + Math.floor(rng() * 2);
  for (let t = 0; t < treeCount; t++) {
    const tx = cx + (rng() - 0.5) * HEX_R * 1.0;
    const ty = cy + (rng() - 0.5) * HEX_R * 0.4;
    const ts = 0.7 + rng() * 0.6;
    decorations.push({ y: ty, draw: () => drawTree(ctx, tx, ty, ts, seed * 10 + t) });
  }
  if (rng() > 0.3) {
    const bx = cx + (rng() - 0.5) * HEX_R * 1.2;
    const by = cy + (rng() - 0.5) * HEX_R * 0.35;
    decorations.push({ y: by, draw: () => drawBush(ctx, bx, by, 0.8 + rng() * 0.4, seed * 20) });
  }
  if (rng() > 0.6) {
    const rx = cx + (rng() - 0.5) * HEX_R * 0.8;
    const ry = cy + (rng() - 0.5) * HEX_R * 0.3;
    decorations.push({ y: ry, draw: () => drawRock(ctx, rx, ry, 0.6 + rng() * 0.4, seed * 30) });
  }
  if (rng() > 0.75) {
    const mx = cx + (rng() - 0.5) * HEX_R * 0.9;
    const my = cy + (rng() - 0.5) * HEX_R * 0.3;
    decorations.push({ y: my, draw: () => drawMushroom(ctx, mx, my, 0.6 + rng() * 0.4, seed * 40) });
  }
  decorations.sort((a, b) => a.y - b.y);
  for (const d of decorations) d.draw();
}

// === 采石场装饰 ===
export function drawQuarryDecor(ctx, cx, cy, seed) {
  const rng = seededRandom(seed);
  let qLevel = 1;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tile = tiles[r][c];
      if (tile.seed === seed && tile.type === 'quarry') {
        qLevel = tile.quarryLevel || 1;
      }
    }
  }
  drawPickaxe(ctx, cx + 6, cy - 4, 0.9, rng);
  drawWoodSupport(ctx, cx - 8, cy - 8, 0.85, rng);

  // 堆叠的方形石块（更多更广分布）
  const blockCount = 7 + Math.floor(rng() * 5);
  for (let i = 0; i < blockCount; i++) {
    const bx = cx - 22 + rng() * 36;
    const by = cy - 4 + rng() * 16;
    const bs = 3 + rng() * 4;
    const depth = bs * 0.5;
    // 石块正面
    const blockGrad = ctx.createLinearGradient(bx, by - bs, bx + bs, by);
    blockGrad.addColorStop(0, '#9e9e9e');
    blockGrad.addColorStop(0.5, '#8a8a8a');
    blockGrad.addColorStop(1, '#757575');
    ctx.fillStyle = blockGrad;
    ctx.fillRect(bx, by - bs, bs, bs);
    // 石块顶面
    ctx.beginPath();
    ctx.moveTo(bx, by - bs);
    ctx.lineTo(bx + depth, by - bs - depth);
    ctx.lineTo(bx + bs + depth, by - bs - depth);
    ctx.lineTo(bx + bs, by - bs);
    ctx.closePath();
    ctx.fillStyle = '#b0b0b0';
    ctx.fill();
    // 石块右面
    ctx.beginPath();
    ctx.moveTo(bx + bs, by - bs);
    ctx.lineTo(bx + bs + depth, by - bs - depth);
    ctx.lineTo(bx + bs + depth, by - depth);
    ctx.lineTo(bx + bs, by);
    ctx.closePath();
    ctx.fillStyle = '#686868';
    ctx.fill();
    // 石块边框
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(bx, by - bs, bs, bs);
  }

  // 小碎石
  for (let i = 0; i < 3; i++) {
    const sx = cx + (rng() - 0.5) * HEX_R * 0.9;
    const sy = cy + 6 + rng() * 6;
    drawSmallStone(ctx, sx, sy, 0.3 + rng() * 0.3, rng);
  }

  if (qLevel > 1) {
    drawExcavator(ctx, cx, cy - 6, 0.85, rng);
  }
}

// === 伐木场装饰 ===
export function drawLumberMillDecor(ctx, cx, cy, seed) {
  const rng = seededRandom(seed);
  let lLevel = 1;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tile = tiles[r][c];
      if (tile.seed === seed && tile.type === 'lumber_mill') {
        lLevel = tile.lumberLevel || 1;
      }
    }
  }

  // 倒下的木头（更多更广分布，带截面）
  const fallenLogCount = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < fallenLogCount; i++) {
    const lx = cx - 22 + rng() * 28;
    const ly = cy - 4 + i * 8 + rng() * 4;
    const logLen = 14 + rng() * 10;
    const logR = 3 + rng() * 2;
    const angle = (rng() - 0.5) * 0.4;

    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(angle);

    // 木头主体
    const logGrad = ctx.createLinearGradient(0, -logR, 0, logR);
    logGrad.addColorStop(0, '#8d6e63');
    logGrad.addColorStop(0.3, '#6d4c41');
    logGrad.addColorStop(0.7, '#5d4037');
    logGrad.addColorStop(1, '#4e342e');
    ctx.fillStyle = logGrad;
    ctx.beginPath();
    ctx.roundRect(-logLen / 2, -logR, logLen, logR * 2, logR);
    ctx.fill();
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // 木纹
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 0.4;
    for (let li = 0; li < 3; li++) {
      const lyy = -logR + (li + 1) * logR * 0.5;
      ctx.beginPath();
      ctx.moveTo(-logLen / 2 + 2, lyy);
      ctx.lineTo(logLen / 2 - 2, lyy);
      ctx.stroke();
    }

    // 右端截面（年轮）
    ctx.beginPath();
    ctx.ellipse(logLen / 2, 0, logR * 0.8, logR * 0.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#a1887f';
    ctx.fill();
    ctx.strokeStyle = '#6d4c41';
    ctx.lineWidth = 0.6;
    ctx.stroke();
    // 年轮线
    ctx.beginPath();
    ctx.ellipse(logLen / 2, 0, logR * 0.4, logR * 0.4, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#8d6e63';
    ctx.lineWidth = 0.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(logLen / 2, 0, 1, 0, Math.PI * 2);
    ctx.fillStyle = '#5d4037';
    ctx.fill();

    // 左端截面
    ctx.beginPath();
    ctx.ellipse(-logLen / 2, 0, logR * 0.8, logR * 0.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#a1887f';
    ctx.fill();
    ctx.strokeStyle = '#6d4c41';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    ctx.restore();
  }

  // 斧头
  ctx.save();
  ctx.translate(cx + 12, cy - 8);
  ctx.rotate(-0.5);
  ctx.fillStyle = '#795548';
  ctx.fillRect(-1, 0, 2, 12);
  ctx.fillStyle = '#9e9e9e';
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.lineTo(4, 0);
  ctx.lineTo(2, -5);
  ctx.lineTo(-2, -5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  if (lLevel > 1) {
    drawTimberHarvester(ctx, cx, cy - 6, 0.85, rng);
  }
}

// === 石场装饰 ===
export function drawRockFieldDecor(ctx, cx, cy, seed) {
  const rng = seededRandom(seed);
  for (let i = 0; i < 4; i++) {
    const rx = cx + (rng() - 0.5) * HEX_R * 1.1;
    const ry = cy + (rng() - 0.5) * HEX_R * 0.4;
    drawQuarryRock(ctx, rx, ry, 0.7 + rng() * 0.7, rng);
  }
  for (let i = 0; i < 5; i++) {
    const sx = cx + (rng() - 0.5) * HEX_R * 1.2;
    const sy = cy + (rng() - 0.5) * HEX_R * 0.45;
    drawSmallStone(ctx, sx, sy, 0.3 + rng() * 0.3, rng);
  }
}

// === 幼林装饰 ===
export function drawGrasslandDecor(ctx, cx, cy, seed) {
  const rng = seededRandom(seed);
  for (let i = 0; i < 8; i++) {
    const gx = cx + (rng() - 0.5) * HEX_R * 1.1;
    const gy = cy + (rng() - 0.5) * HEX_R * 0.4;
    drawGreenGrass(ctx, gx, gy, 0.5 + rng() * 0.5, rng);
  }
  const sapCount = 1 + Math.floor(rng() * 2);
  for (let i = 0; i < sapCount; i++) {
    const sx = cx + (rng() - 0.5) * HEX_R * 0.8;
    const sy = cy + (rng() - 0.5) * HEX_R * 0.3;
    drawSapling(ctx, sx, sy, 0.7 + rng() * 0.3, rng);
  }
}

// === 空地装饰 ===
export function drawEmptyDecor(ctx, cx, cy, seed) {
  const rng = seededRandom(seed);
  for (let i = 0; i < 6; i++) {
    const gx = cx + (rng() - 0.5) * HEX_R * 1.1;
    const gy = cy + (rng() - 0.5) * HEX_R * 0.4;
    drawDeadGrass(ctx, gx, gy, 0.5 + rng() * 0.5, rng);
  }
  if (rng() > 0.4) {
    const sx = cx + (rng() - 0.5) * HEX_R * 0.5;
    const sy = cy + (rng() - 0.5) * HEX_R * 0.2;
    drawStump(ctx, sx, sy, 0.8 + rng() * 0.4);
  }
  if (rng() > 0.5) {
    const rx = cx + (rng() - 0.5) * HEX_R * 0.7;
    const ry = cy + (rng() - 0.5) * HEX_R * 0.25;
    drawRock(ctx, rx, ry, 0.4 + rng() * 0.3, seed * 30);
  }
}

// === 聚落装饰 ===
export function drawSettlementDecor(ctx, cx, cy, seed) {
  const rng = seededRandom(seed);
  const level = gameState.civilizationLevel;
  if (level === 1) {
    // 1级文明：小木屋+篝火
    drawCabin(ctx, cx - 8, cy - 4, 1.0, rng);
    drawCabin(ctx, cx + 8, cy + 2, 0.85, rng);
    drawCabin(ctx, cx - 2, cy + 6, 0.7, rng);
    drawCampfire(ctx, cx + 2, cy + 12, 0.6);
    drawPath(ctx, cx - 4, cy + 12, cx + 8, cy + 12, 2);
  } else if (level === 2) {
    // 2级文明：砖瓦房屋
    drawBrickHouse(ctx, cx - 8, cy - 4, 1.0, rng);
    drawBrickHouse(ctx, cx + 8, cy + 2, 0.85, rng);
    drawBrickHouse(ctx, cx - 4, cy + 6, 0.7, rng);
    drawBrickHouse(ctx, cx + 2, cy - 6, 0.6, rng);
    drawPath(ctx, cx - 6, cy + 12, cx + 8, cy + 12, 3);
  } else if (level >= 3) {
    // 3级文明：现代建筑
    drawBuilding(ctx, cx - 8, cy - 4, 1.2, rng);
    drawBuilding(ctx, cx + 8, cy + 2, 0.9, rng);
    drawBuilding(ctx, cx - 12, cy + 6, 0.7, rng);
    drawBuilding(ctx, cx + 2, cy - 8, 0.6, rng);
    drawBuilding(ctx, cx - 2, cy - 2, 0.5, rng);
    drawPath(ctx, cx - 6, cy + 12, cx + 8, cy + 12, 3);
  }
}

// === 火电厂装饰（突出巨大锥形烟囱）===
export function drawPowerPlantDecor(ctx, cx, cy, seed) {
  const rng = seededRandom(seed);
  const baseY = cy + 12;

  // 烟囱参数：3个巨大的锥形烟囱
  const chimneys = [
    { x: cx - 10, topW: 4, botW: 9, h: 36 },
    { x: cx + 2, topW: 5, botW: 10, h: 42 },
    { x: cx + 12, topW: 3.5, botW: 8, h: 30 }
  ];

  for (const ch of chimneys) {
    const topY = baseY - ch.h;
    // 锥形烟囱主体
    const chGrad = ctx.createLinearGradient(ch.x - ch.botW / 2, topY, ch.x + ch.botW / 2, baseY);
    chGrad.addColorStop(0, '#6a6a7e');
    chGrad.addColorStop(0.3, '#555568');
    chGrad.addColorStop(0.7, '#4a4a5e');
    chGrad.addColorStop(1, '#3a3a4e');
    ctx.fillStyle = chGrad;
    ctx.beginPath();
    ctx.moveTo(ch.x - ch.topW / 2, topY);
    ctx.lineTo(ch.x + ch.topW / 2, topY);
    ctx.lineTo(ch.x + ch.botW / 2, baseY);
    ctx.lineTo(ch.x - ch.botW / 2, baseY);
    ctx.closePath();
    ctx.fill();

    // 烟囱环箍
    const bands = 2 + Math.floor(rng() * 2);
    for (let b = 0; b < bands; b++) {
      const ratio = 0.2 + b * 0.25;
      const by2 = topY + ch.h * ratio;
      const bw = ch.topW + (ch.botW - ch.topW) * ratio;
      ctx.fillStyle = '#555568';
      ctx.fillRect(ch.x - bw / 2 - 1, by2 - 1.5, bw + 2, 3);
    }

    // 烟囱顶部加宽
    ctx.fillStyle = '#606075';
    ctx.fillRect(ch.x - ch.topW / 2 - 2, topY - 3, ch.topW + 4, 5);

    // 烟囱右侧高光
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.moveTo(ch.x, topY);
    ctx.lineTo(ch.x + ch.topW / 2, topY);
    ctx.lineTo(ch.x + ch.botW / 2, baseY);
    ctx.lineTo(ch.x, baseY);
    ctx.closePath();
    ctx.fill();
  }

  // 底部基座（矮平台）
  ctx.fillStyle = '#3a3a4e';
  ctx.fillRect(cx - 16, baseY - 4, 32, 6);
  ctx.fillStyle = '#4a4a5e';
  ctx.fillRect(cx - 18, baseY, 36, 3);

  // 烟雾动画（从最高烟囱冒出）
  const t = Date.now() / 500;
  const mainCh = chimneys[1]; // 中间最高的烟囱
  for (let i = 0; i < 5; i++) {
    const sx = mainCh.x + Math.sin(t + i * 0.8) * (4 + i * 2);
    const sy = baseY - mainCh.h - 8 - i * 9;
    const sr = 5 + i * 3;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    const smokeGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    smokeGrad.addColorStop(0, `rgba(140,140,150,${0.3 - i * 0.05})`);
    smokeGrad.addColorStop(1, `rgba(100,100,110,${0.1 - i * 0.015})`);
    ctx.fillStyle = smokeGrad;
    ctx.fill();
  }
  // 左侧烟囱烟雾
  const leftCh = chimneys[0];
  for (let i = 0; i < 3; i++) {
    const sx = leftCh.x + Math.sin(t + i * 1.2 + 2) * (3 + i * 1.5);
    const sy = baseY - leftCh.h - 6 - i * 8;
    const sr = 4 + i * 2;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    const smokeGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    smokeGrad.addColorStop(0, `rgba(130,130,140,${0.22 - i * 0.05})`);
    smokeGrad.addColorStop(1, `rgba(90,90,100,${0.08 - i * 0.02})`);
    ctx.fillStyle = smokeGrad;
    ctx.fill();
  }

  // 闪电符号
  ctx.fillStyle = '#ffeb3b';
  ctx.font = 'bold 11px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚡', cx, baseY + 10);
  ctx.textAlign = 'left';
}

// === 研究所装饰 ===
export function drawResearchLabDecor(ctx, cx, cy, seed) {
  const rng = seededRandom(seed);
  const bx = cx - 12, by = cy + 10;
  const bw = 24, bh = 22;

  // 主体
  const bGrad = ctx.createLinearGradient(bx, by - bh, bx + bw, by);
  bGrad.addColorStop(0, '#4a6a9a');
  bGrad.addColorStop(0.5, '#3a5a8a');
  bGrad.addColorStop(1, '#2a4a7a');
  ctx.fillStyle = bGrad;
  ctx.fillRect(bx, by - bh, bw, bh);

  // 右侧暗面
  ctx.fillStyle = '#1a3a6a';
  ctx.fillRect(bx + bw * 0.6, by - bh, bw * 0.4, bh);

  // 穹顶
  ctx.beginPath();
  ctx.arc(cx, by - bh, bw / 2, Math.PI, 0);
  const domeGrad = ctx.createRadialGradient(cx - 3, by - bh - 3, 0, cx, by - bh, bw / 2);
  domeGrad.addColorStop(0, '#6a8aba');
  domeGrad.addColorStop(1, '#4a6a9a');
  ctx.fillStyle = domeGrad;
  ctx.fill();

  // 穹顶高光弧
  ctx.beginPath();
  ctx.arc(cx, by - bh, bw / 2, Math.PI, Math.PI * 1.3);
  ctx.strokeStyle = 'rgba(150,200,255,0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 天线
  ctx.strokeStyle = '#6a8aba';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, by - bh - bw / 2);
  ctx.lineTo(cx, by - bh - bw / 2 - 12);
  ctx.stroke();

  // 天线灯
  const blink = Math.sin(Date.now() / 300) > 0 ? 1 : 0.3;
  ctx.beginPath();
  ctx.arc(cx, by - bh - bw / 2 - 12, 2.5, 0, Math.PI * 2);
  const antGlow = ctx.createRadialGradient(cx, by - bh - bw / 2 - 12, 0, cx, by - bh - bw / 2 - 12, 6);
  antGlow.addColorStop(0, `rgba(100,200,255,${blink})`);
  antGlow.addColorStop(1, `rgba(100,200,255,0)`);
  ctx.fillStyle = antGlow;
  ctx.fillRect(cx - 6, by - bh - bw / 2 - 18, 12, 12);
  ctx.beginPath();
  ctx.arc(cx, by - bh - bw / 2 - 12, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(100,200,255,${blink})`;
  ctx.fill();

  // 冷光窗户
  ctx.fillStyle = 'rgba(100,180,255,0.7)';
  ctx.fillRect(bx + 3, by - bh + 4, 5, 4);
  ctx.fillRect(bx + 11, by - bh + 4, 5, 4);
  ctx.fillRect(bx + 3, by - bh + 12, 5, 4);
  ctx.fillRect(bx + 11, by - bh + 12, 5, 4);

  // 信号环
  ctx.strokeStyle = 'rgba(100,200,255,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, by - bh - bw / 2 - 5, 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx, by - bh - bw / 2 - 5, 7, 3, 0.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx, by - bh - bw / 2 - 5, 7, 3, -0.5, 0, Math.PI * 2);
  ctx.stroke();
}

// === 风力发电机装饰 ===
export function drawWindTurbineDecor(ctx, cx, cy, seed) {
  const t = Date.now() / 1000;

  // 底座
  const baseGrad = ctx.createLinearGradient(cx - 8, cy + 19, cx + 8, cy + 19);
  baseGrad.addColorStop(0, '#b0b8c0');
  baseGrad.addColorStop(0.5, '#d0d8e0');
  baseGrad.addColorStop(1, '#a0a8b0');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(cx - 8, cy + 15, 16, 4);

  // 塔身（渐变）
  const towerGrad = ctx.createLinearGradient(cx - 3, cy - 5, cx + 3, cy + 15);
  towerGrad.addColorStop(0, '#e0e8f0');
  towerGrad.addColorStop(0.5, '#d0d8e0');
  towerGrad.addColorStop(1, '#b0b8c0');
  ctx.fillStyle = towerGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy - 5);
  ctx.lineTo(cx - 4, cy + 15);
  ctx.lineTo(cx + 4, cy + 15);
  ctx.lineTo(cx + 3, cy - 5);
  ctx.closePath();
  ctx.fill();

  // 叶片旋转
  const bladeAngle = t * 2;
  ctx.save();
  ctx.translate(cx, cy - 8);
  for (let i = 0; i < 3; i++) {
    const a = bladeAngle + (i * Math.PI * 2 / 3);
    ctx.save();
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-2, -20);
    ctx.lineTo(0, -22);
    ctx.lineTo(2, -20);
    ctx.closePath();
    const bladeGrad = ctx.createLinearGradient(0, 0, 0, -22);
    bladeGrad.addColorStop(0, '#e8eef5');
    bladeGrad.addColorStop(1, '#c0c8d0');
    ctx.fillStyle = bladeGrad;
    ctx.fill();
    // 叶片高光
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(0, -18);
    ctx.lineTo(0.5, -17);
    ctx.lineTo(0.3, -3);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fill();
    ctx.restore();
  }

  // 轮毂
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  const hubGrad = ctx.createRadialGradient(-1, -1, 0, 0, 0, 3);
  hubGrad.addColorStop(0, '#a0aab5');
  hubGrad.addColorStop(1, '#7888a0');
  ctx.fillStyle = hubGrad;
  ctx.fill();
  ctx.restore();

  // 风线
  const windX = Math.sin(t * 3) * 3;
  ctx.strokeStyle = 'rgba(200,220,255,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx + 12 + windX, cy - 15);
  ctx.lineTo(cx + 25 + windX, cy - 18);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 14 + windX, cy - 8);
  ctx.lineTo(cx + 28 + windX, cy - 10);
  ctx.stroke();
}

// === 太阳能板装饰 ===
export function drawSolarPanelDecor(ctx, cx, cy, seed) {
  const rng = seededRandom(seed);

  // 支架
  const poleGrad = ctx.createLinearGradient(cx - 2, cy + 2, cx + 2, cy + 14);
  poleGrad.addColorStop(0, '#78909c');
  poleGrad.addColorStop(1, '#607d8b');
  ctx.fillStyle = poleGrad;
  ctx.fillRect(cx - 2, cy + 2, 4, 12);

  // 底座
  ctx.fillStyle = '#546e7a';
  ctx.fillRect(cx - 16, cy + 14, 32, 3);

  // 面板
  ctx.save();
  ctx.translate(cx, cy - 2);
  ctx.rotate(-0.15);
  const panelGrad = ctx.createLinearGradient(-18, -8, 18, 8);
  panelGrad.addColorStop(0, '#1a237e');
  panelGrad.addColorStop(0.3, '#283593');
  panelGrad.addColorStop(0.7, '#1a237e');
  panelGrad.addColorStop(1, '#0d1440');
  ctx.fillStyle = panelGrad;
  ctx.fillRect(-18, -10, 36, 18);

  // 面板边框
  ctx.strokeStyle = 'rgba(100,130,200,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(-18, -10, 36, 18);

  // 格线
  ctx.strokeStyle = 'rgba(100,130,200,0.3)';
  ctx.lineWidth = 0.5;
  for (let gx = -15; gx <= 15; gx += 6) {
    ctx.beginPath();
    ctx.moveTo(gx, -10);
    ctx.lineTo(gx, 8);
    ctx.stroke();
  }
  for (let gy = -7; gy <= 5; gy += 6) {
    ctx.beginPath();
    ctx.moveTo(-18, gy);
    ctx.lineTo(18, gy);
    ctx.stroke();
  }

  // 面板反光
  ctx.fillStyle = 'rgba(100,150,255,0.1)';
  ctx.fillRect(-18, -10, 18, 9);
  ctx.restore();

  // 太阳光晕
  const t = Date.now() / 800;
  const sunGlow = Math.sin(t) * 0.1 + 0.15;
  ctx.beginPath();
  ctx.arc(cx + 20, cy - 18, 12, 0, Math.PI * 2);
  const sunGrad = ctx.createRadialGradient(cx + 20, cy - 18, 2, cx + 20, cy - 18, 12);
  sunGrad.addColorStop(0, `rgba(255,235,59,${sunGlow * 1.5})`);
  sunGrad.addColorStop(1, `rgba(255,235,59,0)`);
  ctx.fillStyle = sunGrad;
  ctx.fill();

  // 光线
  ctx.strokeStyle = `rgba(255,235,59,${sunGlow * 0.8})`;
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const angle = -0.6 + i * 0.3;
    ctx.beginPath();
    ctx.moveTo(cx + 20 + Math.cos(angle) * 10, cy - 18 + Math.sin(angle) * 10);
    ctx.lineTo(cx + 20 + Math.cos(angle) * 18, cy - 18 + Math.sin(angle) * 18);
    ctx.stroke();
  }
}

// === 生态林地装饰 ===
export function drawEcoForestDecor(ctx, cx, cy, seed) {
  const rng = seededRandom(seed);
  const treeCount = 4 + Math.floor(rng() * 2);
  const decorations = [];
  for (let t = 0; t < treeCount; t++) {
    const tx = cx + (rng() - 0.5) * HEX_R * 0.9;
    const ty = cy + (rng() - 0.5) * HEX_R * 0.35;
    const ts = 0.8 + rng() * 0.5;
    decorations.push({ y: ty, draw: () => drawEcoTree(ctx, tx, ty, ts, rng) });
  }
  for (let i = 0; i < 3; i++) {
    const bx = cx + (rng() - 0.5) * HEX_R * 1.0;
    const by = cy + (rng() - 0.5) * HEX_R * 0.3;
    decorations.push({ y: by, draw: () => drawBush(ctx, bx, by, 1.0 + rng() * 0.3, seed * 20 + i) });
  }
  decorations.sort((a, b) => a.y - b.y);
  for (const d of decorations) d.draw();

  // 生态光晕
  const t = Date.now() / 1200;
  const glowAlpha = Math.sin(t) * 0.08 + 0.12;
  ctx.beginPath();
  ctx.arc(cx, cy, HEX_R * 0.7, 0, Math.PI * 2);
  const ecoGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, HEX_R * 0.7);
  ecoGlow.addColorStop(0, `rgba(0,200,100,${glowAlpha})`);
  ecoGlow.addColorStop(0.6, `rgba(0,180,80,${glowAlpha * 0.4})`);
  ecoGlow.addColorStop(1, 'rgba(0,200,100,0)');
  ctx.fillStyle = ecoGlow;
  ctx.fill();
}

// === 生态林地(建设中)装饰 ===
export function drawEcoForestGrowingDecor(ctx, cx, cy, seed) {
  const rng = seededRandom(seed);
  const treeCount = 3 + Math.floor(rng() * 2);
  const decorations = [];
  for (let t = 0; t < treeCount; t++) {
    const tx = cx + (rng() - 0.5) * HEX_R * 0.8;
    const ty = cy + (rng() - 0.5) * HEX_R * 0.3;
    const ts = 0.7 + rng() * 0.4;
    decorations.push({ y: ty, draw: () => drawTree(ctx, tx, ty, ts, seed * 10 + t) });
  }
  decorations.sort((a, b) => a.y - b.y);
  for (const d of decorations) d.draw();

  // 建设进度光晕
  const t = Date.now() / 600;
  const alpha = Math.sin(t) * 0.15 + 0.25;
  ctx.beginPath();
  ctx.arc(cx, cy + HEX_R * 0.2, HEX_R * 0.3, 0, Math.PI * 2);
  const buildGlow = ctx.createRadialGradient(cx, cy + HEX_R * 0.2, 0, cx, cy + HEX_R * 0.2, HEX_R * 0.3);
  buildGlow.addColorStop(0, `rgba(76,175,80,${alpha})`);
  buildGlow.addColorStop(0.6, `rgba(76,175,80,${alpha * 0.4})`);
  buildGlow.addColorStop(1, 'rgba(76,175,80,0)');
  ctx.fillStyle = buildGlow;
  ctx.fill();
}

// === 地块装饰分发器 ===
const decorMap = {
  forest: drawForestDecor,
  rock_field: drawRockFieldDecor,
  quarry: drawQuarryDecor,
  lumber_mill: drawLumberMillDecor,
  grassland: drawGrasslandDecor,
  empty: drawEmptyDecor,
  settlement: drawSettlementDecor,
  power_plant: drawPowerPlantDecor,
  research_lab: drawResearchLabDecor,
  wind_turbine: drawWindTurbineDecor,
  solar_panel: drawSolarPanelDecor,
  eco_forest: drawEcoForestDecor,
  eco_forest_growing: drawEcoForestGrowingDecor
};

export function drawTileDecorations(ctx, type, cx, cy, seed) {
  if (decorMap[type]) decorMap[type](ctx, cx, cy, seed);
}
