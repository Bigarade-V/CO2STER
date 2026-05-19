// === CO2STER - Render: UI Panels & HUD (Enhanced 2D Art)

import { HEX_R, HEX_W, V_SPACING, PERSPECTIVE, ROWS, COLS, seededRandom, rgbStr } from '../config.js';
import { TILE_TYPES } from '../tile-types.js';
import { gameState, uiState, industrialResidue, endingState } from '../state.js';
import { countBuildings, countSettlements, getTurnResourceBalance, getEfficiency, getTileEffectiveStats, tiles } from '../map.js';
import { drawCrate3D } from './terrain.js';

// === 毛玻璃面板工具 ===
function drawGlassPanel(ctx, x, y, w, h, radius, borderColor, glowColor) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = 'rgba(12,22,45,0.88)';
  ctx.fillRect(x, y, w, h);
  const sheen = ctx.createLinearGradient(x, y, x, y + h);
  sheen.addColorStop(0, 'rgba(255,255,255,0.04)');
  sheen.addColorStop(0.3, 'rgba(255,255,255,0.01)');
  sheen.addColorStop(0.7, 'rgba(0,0,0,0.02)');
  sheen.addColorStop(1, 'rgba(0,0,0,0.05)');
  ctx.fillStyle = sheen;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.strokeStyle = borderColor || 'rgba(80,130,200,0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (glowColor) {
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.strokeStyle = 'rgba(0,0,0,0)';
    ctx.stroke();
    ctx.restore();
  }
}

// 计算地图左右两侧UI位置
function getMapSidePositions(canvas) {
  const mapLeft = (canvas.width - COLS * HEX_W) / 2;
  const mapRight = mapLeft + COLS * HEX_W;
  return {
    leftX: mapLeft - 180,
    rightX: mapRight + 20,
    centerY: canvas.height / 2
  };
}

// === 资源UI（地图左侧）===
export function drawResourceUI(ctx, canvas) {
  const { leftX, centerY } = getMapSidePositions(canvas);
  const panelX = Math.max(10, leftX);
  const panelY = centerY - 70;

  drawGlassPanel(ctx, panelX, panelY, 150, 140, 8, 'rgba(80,130,200,0.4)', 'rgba(80,130,200,0.1)');

  const numX = panelX + 48;  // 数字统一x位置（对齐）
  const row1 = panelY + 24;
  const row2 = panelY + 58;
  const row3 = panelY + 92;

  // 第1行：资源图标 + 资源数字 + 净生产力(右侧)
  drawCrate3D(ctx, panelX + 14, panelY + 12, 1.4);
  ctx.save();
  ctx.shadowColor = 'rgba(241,196,15,0.3)';
  ctx.shadowBlur = 6;
  ctx.fillStyle = '#f1c40f';
  ctx.font = 'bold 22px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(gameState.resources, numX, row1);
  ctx.restore();
  // 净生产力数字放在资源右侧
  const balance = getTurnResourceBalance();
  ctx.fillStyle = balance.net >= 0 ? '#4caf50' : '#e57373';
  ctx.font = 'bold 12px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textBaseline = 'middle';
  const resWidth = ctx.measureText(String(gameState.resources)).width;
  ctx.fillText((balance.net >= 0 ? '+' : '') + balance.net, numX + resWidth + 12, row1);

  // 第2行：电力图标 + 电力数字 + 净发电量(右侧)
  drawLightning(ctx, panelX + 22, row2, gameState.power > 0);
  ctx.fillStyle = gameState.power > 0 ? '#ffeb3b' : '#999';
  ctx.font = 'bold 22px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(gameState.power, numX, row2);
  // 净发电量
  const powerBalance = getTurnResourceBalance();
  const netPower = powerBalance.power;
  ctx.fillStyle = netPower >= 0 ? '#4caf50' : '#e57373';
  ctx.font = 'bold 12px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textBaseline = 'middle';
  const powerWidth = ctx.measureText(String(gameState.power)).width;
  ctx.fillText((netPower >= 0 ? '+' : '') + netPower, numX + powerWidth + 12, row2);

  // 第3行：科技点图标 + 科技点数字 + 净科技点产出
  drawGear(ctx, panelX + 20, row3, 12);
  ctx.fillStyle = '#ce93d8';
  ctx.font = 'bold 22px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(gameState.sciPoints, numX, row3);
  // 净科技点产出
  const netSci = powerBalance.sciPoints;
  ctx.fillStyle = netSci >= 0 ? '#4caf50' : '#e57373';
  ctx.font = 'bold 12px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textBaseline = 'middle';
  const sciWidth = ctx.measureText(String(gameState.sciPoints)).width;
  ctx.fillText((netSci >= 0 ? '+' : '') + netSci, numX + sciWidth + 12, row3);

  window._drawResourceUI_rect = { x: panelX, y: panelY, w: 150, h: 140 };
}

// === 资源详情面板 ===
export function drawResourceDetailPanel(ctx) {
  // 已整合进左侧资源面板，不再单独弹出
}

// === 大脑图标 ===
function drawBrain(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  const s = size / 20;

  // 大脑轮廓
  ctx.beginPath();
  // 左半球
  ctx.moveTo(0, -8 * s);
  ctx.bezierCurveTo(-10 * s, -10 * s, -14 * s, -4 * s, -12 * s, 2 * s);
  ctx.bezierCurveTo(-14 * s, 6 * s, -10 * s, 10 * s, -4 * s, 8 * s);
  ctx.lineTo(0, 10 * s);
  // 右半球
  ctx.bezierCurveTo(4 * s, 10 * s, 10 * s, 10 * s, 12 * s, 2 * s);
  ctx.bezierCurveTo(14 * s, -4 * s, 10 * s, -10 * s, 0, -8 * s);
  ctx.closePath();

  const grad = ctx.createRadialGradient(-2 * s, -2 * s, 0, 0, 0, 12 * s);
  grad.addColorStop(0, '#f8bbd0');
  grad.addColorStop(1, '#e48aa7');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 中线
  ctx.beginPath();
  ctx.moveTo(0, -8 * s);
  ctx.lineTo(0, 10 * s);
  ctx.strokeStyle = 'rgba(200,100,130,0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 左脑沟回
  ctx.beginPath();
  ctx.moveTo(-6 * s, -4 * s);
  ctx.bezierCurveTo(-8 * s, 0, -6 * s, 4 * s, -4 * s, 2 * s);
  ctx.strokeStyle = 'rgba(200,100,130,0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 右脑沟回
  ctx.beginPath();
  ctx.moveTo(6 * s, -2 * s);
  ctx.bezierCurveTo(8 * s, 2 * s, 5 * s, 6 * s, 3 * s, 4 * s);
  ctx.stroke();

  ctx.restore();
}

// === 灯泡图标 ===
function drawBulb(ctx, x, y, size) {
  const s = size / 24;
  ctx.save();
  ctx.translate(x, y);

  // 灯泡玻璃部分
  ctx.beginPath();
  ctx.moveTo(-5 * s, 4 * s);
  ctx.bezierCurveTo(-8 * s, 2 * s, -9 * s, -3 * s, -7 * s, -7 * s);
  ctx.bezierCurveTo(-5 * s, -11 * s, 5 * s, -11 * s, 7 * s, -7 * s);
  ctx.bezierCurveTo(9 * s, -3 * s, 8 * s, 2 * s, 5 * s, 4 * s);
  ctx.closePath();

  const bulbGrad = ctx.createRadialGradient(-1 * s, -4 * s, 0, 0, -2 * s, 10 * s);
  bulbGrad.addColorStop(0, '#fff9c4');
  bulbGrad.addColorStop(0.6, '#ffe082');
  bulbGrad.addColorStop(1, '#ffb300');
  ctx.fillStyle = bulbGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,200,50,0.6)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // 灯泡底座
  ctx.beginPath();
  ctx.moveTo(-5 * s, 4 * s);
  ctx.lineTo(-4 * s, 8 * s);
  ctx.lineTo(4 * s, 8 * s);
  ctx.lineTo(5 * s, 4 * s);
  ctx.closePath();
  ctx.fillStyle = '#bbb';
  ctx.fill();
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // 底座横线
  for (let i = 0; i < 2; i++) {
    const ly = 5.5 * s + i * 1.8 * s;
    ctx.beginPath();
    ctx.moveTo(-4.2 * s, ly);
    ctx.lineTo(4.2 * s, ly);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }

  // 灯丝光芒
  const pulse = Math.sin(Date.now() / 600) * 0.15 + 0.85;
  ctx.beginPath();
  ctx.arc(0, -3 * s, 11 * s, 0, Math.PI * 2);
  const glow = ctx.createRadialGradient(0, -3 * s, 0, 0, -3 * s, 11 * s);
  glow.addColorStop(0, `rgba(255,235,59,${0.15 * pulse})`);
  glow.addColorStop(1, 'rgba(255,235,59,0)');
  ctx.fillStyle = glow;
  ctx.fill();

  ctx.restore();
}

// === 行动力UI（资源面板上方，灯泡图标+数字）===
export function drawActionPointUI(ctx, canvas) {
  const { leftX, centerY } = getMapSidePositions(canvas);
  const panelX = Math.max(10, leftX);
  const resourcePanelY = centerY - 70;
  const bulbY = resourcePanelY - 54;

  drawGlassPanel(ctx, panelX, bulbY, 160, 44, 8, 'rgba(80,130,200,0.4)', 'rgba(80,130,200,0.1)');

  // 灯泡图标
  drawBulb(ctx, panelX + 26, bulbY + 22, 22);

  // 数字
  const color = gameState.actionPoints > 0 ? '#ffe082' : '#e57373';
  ctx.fillStyle = color;
  ctx.font = 'bold 24px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('x ' + gameState.actionPoints, panelX + 52, bulbY + 22);
}

// === 行动力UI（无canvas参数兼容旧接口）===
export function drawActionPointUICompat(ctx) {
  // 空操作，drawActionPointUI需要canvas参数由game.js传入
}

// === 烟雾图标 ===
function drawSmoke(ctx, x, y, intensity) {
  const alpha = 0.3 + intensity * 0.5;
  const rng = seededRandom(77);
  for (let i = 0; i < 3; i++) {
    const ox = (rng() - 0.5) * 8;
    const oy = -i * 8 - 4;
    const r = 6 + i * 2.5;
    ctx.beginPath();
    ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
    g.addColorStop(0, `rgba(120,120,120,${alpha})`);
    g.addColorStop(1, `rgba(80,80,80,${alpha * 0.3})`);
    ctx.fillStyle = g;
    ctx.fill();
  }
}

// === CO2 UI（已整合进左侧资源面板）===
export function drawCO2UI(ctx) {
  // 已移入drawResourceUI
}

// === 闪电图标 ===
function drawLightning(ctx, x, y, on) {
  const s = 1.0;
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(2 * s, -10 * s);
  ctx.lineTo(-3 * s, -1 * s);
  ctx.lineTo(1 * s, -1 * s);
  ctx.lineTo(-2 * s, 10 * s);
  ctx.lineTo(3 * s, 1 * s);
  ctx.lineTo(-1 * s, 1 * s);
  ctx.closePath();
  if (on) {
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 12 * s);
    glow.addColorStop(0, 'rgba(255,235,59,0.15)');
    glow.addColorStop(1, 'rgba(255,235,59,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-12 * s, -12 * s, 24 * s, 24 * s);
    ctx.fillStyle = '#ffeb3b';
    ctx.fill();
  } else {
    ctx.fillStyle = '#7a7a8a';
    ctx.fill();
  }
  ctx.restore();
}

// === 电力UI（已整合进左侧资源面板）===
export function drawPowerUI(ctx) {
  // 已移入drawResourceUI
}

// === 齿轮图标 ===
function drawGear(ctx, x, y, size) {
  const s = size / 16;
  const teeth = 8;
  const innerR = 6 * s;
  const outerR = 9 * s;
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const a1 = (i / teeth) * Math.PI * 2;
    const a2 = ((i + 0.3) / teeth) * Math.PI * 2;
    const a3 = ((i + 0.5) / teeth) * Math.PI * 2;
    const a4 = ((i + 0.8) / teeth) * Math.PI * 2;
    if (i === 0) ctx.moveTo(Math.cos(a1) * innerR, Math.sin(a1) * innerR);
    ctx.lineTo(Math.cos(a2) * innerR, Math.sin(a2) * innerR);
    ctx.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR);
    ctx.lineTo(Math.cos(a3) * outerR, Math.sin(a3) * outerR);
    ctx.lineTo(Math.cos(a3) * innerR, Math.sin(a3) * innerR);
    ctx.lineTo(Math.cos(a4) * innerR, Math.sin(a4) * innerR);
  }
  ctx.closePath();
  const gearGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, outerR);
  gearGrad.addColorStop(0, '#e1bee7');
  gearGrad.addColorStop(1, '#ba68c8');
  ctx.fillStyle = gearGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  // 中心孔
  ctx.beginPath();
  ctx.arc(0, 0, 3 * s, 0, Math.PI * 2);
  ctx.fillStyle = '#4a2060';
  ctx.fill();
  ctx.restore();
}

// === 科技点UI（已删除）===
export function drawSciPointsUI(ctx) {
  // 科技树系统已删除
}

// === 回合UI（已整合进左侧资源面板）===
export function drawTurnUI(ctx) {
  // 已移入drawResourceUI
}

// === 文明等级UI ===
export function drawCivilizationUI(ctx, canvas) {
  const mapLeft = (canvas.width - COLS * HEX_W) / 2;
  const mapCenterX = mapLeft + COLS * HEX_W / 2;
  const mapBottom = (canvas.height - (ROWS - 1) * V_SPACING * PERSPECTIVE) / 2 - 20 + ROWS * V_SPACING * PERSPECTIVE + HEX_R * PERSPECTIVE;
  const x = mapCenterX;
  const y = mapBottom + 18;
  const level = gameState.civilizationLevel;

  // 问号科技树按钮（文明等级左侧）
  const btnX = x - 80;
  const btnY = y + 2;
  const btnR = 13;
  ctx.save();
  ctx.beginPath();
  ctx.arc(btnX, btnY + 10, btnR, 0, Math.PI * 2);
  ctx.fillStyle = uiState.showTechTree ? 'rgba(100,160,255,0.6)' : 'rgba(60,100,180,0.4)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(150,190,255,0.7)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#e0e8ff';
  ctx.font = 'bold 16px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', btnX, btnY + 10);
  ctx.restore();
  window._techTreeBtn = { x: btnX, y: btnY + 10, r: btnR };

  ctx.fillStyle = '#dde4f0';
  ctx.font = '22px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText('文明 Lv.' + level, x, y + 12);
  ctx.textAlign = 'left';

  // 文明升级任务提示
  const lvl = gameState.civilizationLevel;
  let missionText = '';
  let missionColor = '#8ab4f8';
  if (lvl === 0) {
    missionText = '↓ 建造1个聚落升级至Lv.1';
  } else if (lvl === 1) {
    const needSettle = 3 - countSettlements();
    let ppCount = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (tiles[r][c].type === 'power_plant') ppCount++;
    const needPP = 1 - ppCount;
    const balance = getTurnResourceBalance();
    const needProd = 30 - balance.net;
    const settleOk = needSettle <= 0;
    const ppOk = needPP <= 0;
    const prodOk = needProd <= 0;
    const metCount = (settleOk ? 1 : 0) + (ppOk ? 1 : 0) + (prodOk ? 1 : 0);
    const totalReqs = 3;
    if (metCount === totalReqs) {
      missionText = '↓ 条件已满足，下回合升级至Lv.2';
      missionColor = '#4caf50';
    } else {
      const parts = [];
      if (!settleOk) parts.push('聚落+' + needSettle);
      if (!ppOk) parts.push('火电厂+' + needPP);
      if (!prodOk) parts.push('净生产力+' + needProd);
      missionText = '↓ ' + parts.join(' ') + ' 升级Lv.2';
    }
  } else if (lvl === 2) {
    const needSettle = 5 - countSettlements();
    let ppCount = 0, labCount = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (tiles[r][c].type === 'power_plant') ppCount++;
      if (tiles[r][c].type === 'research_lab') labCount++;
    }
    const needPP = 2 - ppCount;
    const needLab = 1 - labCount;
    const balance = getTurnResourceBalance();
    const needProd = 40 - balance.net;
    const settleOk = needSettle <= 0;
    const ppOk = needPP <= 0;
    const labOk = needLab <= 0;
    const prodOk = needProd <= 0;
    const metCount = (settleOk ? 1 : 0) + (ppOk ? 1 : 0) + (labOk ? 1 : 0) + (prodOk ? 1 : 0);
    const totalReqs = 4;
    if (metCount === totalReqs) {
      missionText = '↓ 条件已满足，下回合升级至Lv.3';
      missionColor = '#4caf50';
    } else {
      const parts = [];
      if (!settleOk) parts.push('聚落+' + needSettle);
      if (!ppOk) parts.push('火电厂+' + needPP);
      if (!labOk) parts.push('研究所+' + needLab);
      if (!prodOk) parts.push('净生产力+' + needProd);
      missionText = '↓ ' + parts.join(' ') + ' 升级Lv.3';
    }
  } else if (lvl === 3) {
    const balance = getTurnResourceBalance();
    const needProd = 50 - balance.net;
    const needPower = 15 - balance.power;
    const needCO2 = gameState.co2;
    const needSettle = 7 - countSettlements();
    const prodOk = needProd <= 0;
    const powerOk = needPower <= 0;
    const co2Ok = needCO2 <= 0;
    const settleOk = needSettle <= 0;
    const metCount = (prodOk ? 1 : 0) + (powerOk ? 1 : 0) + (co2Ok ? 1 : 0) + (settleOk ? 1 : 0);
    if (metCount === 4) {
      missionText = '↓ 胜利条件已满足！';
      missionColor = '#4caf50';
    } else {
      const parts = [];
      if (!prodOk) parts.push('净生产力+' + needProd);
      if (!powerOk) parts.push('净发电力+' + needPower);
      if (!co2Ok) parts.push('CO2-' + needCO2);
      if (!settleOk) parts.push('聚落+' + needSettle);
      missionText = '↓ ' + parts.join(' ') + ' 胜利';
    }
  }

  if (missionText) {
    ctx.save();
    ctx.font = '13px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.strokeText(missionText, x, y + 34);
    ctx.fillStyle = '#222';
    ctx.fillText(missionText, x, y + 34);
    ctx.restore();
    ctx.textAlign = 'left';
  }
}

// === 胜利按钮 ===
export function drawVictoryButton(ctx, canvas) {
  if (!gameState.victoryReady || gameState.gameWon || gameState.gameOver) return;
  if (endingState.active) return;

  const btnW = 240, btnH = 48;
  const cx = canvas.width / 2;
  const btnX = cx - btnW / 2;
  const btnY = canvas.height - 70;

  // 绿色渐变按钮
  const grad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
  grad.addColorStop(0, 'rgba(56,142,60,0.9)');
  grad.addColorStop(1, 'rgba(27,94,32,0.85)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(129,199,132,0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 白色文字
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px "Microsoft YaHei", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('绿水青山，科学发展', cx, btnY + btnH / 2);
  ctx.textAlign = 'left';

  // 记录按钮位置供点击检测
  window._victoryButton = { x: btnX, y: btnY, w: btnW, h: btnH };
}

// === 危机指示器 ===
export function drawCrisisUI(ctx, canvas) {
  if (gameState.gameOver || gameState.gameWon) return;

  if (gameState.greenhouseEffect) {
    const flash = Math.sin(Date.now() / 400) * 0.3 + 0.7;
    const y = 10;
    ctx.fillStyle = `rgba(180,100,20,${flash * 0.85})`;
    ctx.beginPath();
    ctx.roundRect(canvas.width / 2 - 120, y, 240, 36, 6);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,160,40,${flash})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#ffcc80';
    ctx.font = 'bold 13px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText('🔥 温室效应 效率×0.8', canvas.width / 2, y + 18);
    ctx.textAlign = 'left';
  }
}

// === 操作面板（简化版，不显示未解锁功能和成长时间）===
export function drawActionPanel(ctx, canvas) {
  if (!uiState.actionPanel) return;
  const { x: origX, y: origY, actions } = uiState.actionPanel;

  // 只显示已解锁的操作（研发项目始终显示，即使科技点不足也灰掉展示）
  const visibleActions = actions.filter(act => !act.disabledReason || act.cost > 0 || act.unlockResearch);
  if (visibleActions.length === 0) { uiState.actionPanel = null; return; }

  // 先清除所有action的_rect，避免残留旧位置导致点击穿透
  for (const act of actions) {
    act._rect = null;
  }

  const pw = 180, ph = visibleActions.length * 40 + 16;

  // 面板位置边界约束：确保面板在可视区域内
  let panelX = origX;
  let panelY = origY;
  if (canvas) {
    // 右边界
    if (panelX + pw > canvas.width - 10) panelX = canvas.width - pw - 10;
    // 左边界
    if (panelX < 10) panelX = 10;
    // 下边界
    if (panelY + ph > canvas.height - 10) panelY = canvas.height - ph - 10;
    // 上边界
    if (panelY < 10) panelY = 10;
  }

  // 更新面板位置供input.js使用
  uiState.actionPanel.x = panelX;
  uiState.actionPanel.y = panelY;

  drawGlassPanel(ctx, panelX, panelY, pw, ph, 8, 'rgba(80,130,200,0.4)', 'rgba(80,130,200,0.1)');

  visibleActions.forEach((act, i) => {
    const bx = panelX + 8, by = panelY + 8 + i * 40, bw = pw - 16, bh = 32;
    const hovered = act._hovered;
    const canAfford = gameState.resources >= act.cost;
    const netCost = act.cost - (act.reward || 0);
    const isHarvest = act.reward > 0 && act.cost === 0;
    const netBalance = getTurnResourceBalance();
    const consumptionNeeded = isHarvest ? 0 : Math.max(0, -netBalance.net);
    const canSustain = isHarvest || (gameState.resources - netCost >= consumptionNeeded);
    const levelOk = !act.reqLevel || gameState.civilizationLevel >= act.reqLevel;
    const powerOk = !act.reqPower || gameState.power >= act.reqPower;
    const canAct = canAfford && canSustain && levelOk && powerOk && !act.disabledReason;

    // 按钮背景
    const btnGrad = ctx.createLinearGradient(bx, by, bx, by + bh);
    if (hovered && canAct) {
      btnGrad.addColorStop(0, 'rgba(70,110,200,0.65)');
      btnGrad.addColorStop(1, 'rgba(50,90,170,0.55)');
    } else if (canAct) {
      btnGrad.addColorStop(0, 'rgba(45,65,110,0.5)');
      btnGrad.addColorStop(1, 'rgba(35,55,95,0.45)');
    } else {
      btnGrad.addColorStop(0, 'rgba(45,45,55,0.5)');
      btnGrad.addColorStop(1, 'rgba(35,35,45,0.45)');
    }
    ctx.fillStyle = btnGrad;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 6);
    ctx.fill();

    // 色块
    const tt = TILE_TYPES[act.target];
    ctx.fillStyle = canAct ? tt.topColor : '#444';
    ctx.beginPath();
    ctx.roundRect(bx + 4, by + 6, 18, 18, 3);
    ctx.fill();

    if (act.isUpgrade) {
      ctx.fillStyle = '#f1c40f';
      ctx.font = 'bold 10px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('↑', bx + 13, by + 15);
      ctx.textAlign = 'left';
    }

    // 标签
    ctx.fillStyle = canAct ? '#e0e8f0' : '#666';
    ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(act.label, bx + 28, by + bh / 2 - 5);

    // 费用（简化：显示资源和电力和科技点）
    const costParts = [];
    if (act.reward > 0) costParts.push('+' + act.reward + '资源');
    if (act.cost > 0) costParts.push('-' + act.cost + '资源');
    if (act.reqPower) costParts.push('-' + act.reqPower + '电力');
    if (act.reqSciPoints) costParts.push('-' + act.reqSciPoints + '科技点');
    if (act.sciReward) costParts.push('+' + act.sciReward + '科技点');
    if (costParts.length > 0) {
      ctx.font = '11px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = canAct ? '#f1c40f' : '#665530';
      ctx.fillText(costParts.join('  '), bx + 28, by + bh / 2 + 8);
    }

    act._rect = { x: bx, y: by, w: bw, h: bh };
  });
}

// === 科技树面板（已删除）===
export function drawTechTreePanel(ctx, canvas) {
  if (!uiState.showTechTree) return;

  const w = canvas.width, h = canvas.height;
  const pw = 480, ph = 580;
  const px = (w - pw) / 2, py = (h - ph) / 2;

  // 遮罩
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, w, h);

  // 面板背景
  drawGlassPanel(ctx, px, py, pw, ph, 12, 'rgba(30,50,80,0.92)', 'rgba(20,40,70,0.85)');

  // 标题
  ctx.fillStyle = '#e0e8ff';
  ctx.font = 'bold 20px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('科技树 - 建筑一览', px + pw / 2, py + 22);

  // 关闭按钮
  const closeX = px + pw - 28, closeY = py + 8;
  ctx.fillStyle = '#ff6e6e';
  ctx.font = 'bold 18px "Segoe UI", sans-serif';
  ctx.fillText('×', closeX + 8, closeY + 10);
  window._techTreeCloseBtn = { x: closeX, y: closeY, w: 24, h: 24 };

  // 建筑列表
  const buildings = [
    { name: '聚落', icon: '🏠', cost: '20资源', output: '决定建筑上限', co2: '+3 CO2', level: 0, res: '-5资源/回合' },
    { name: '伐木场', icon: '🪓', cost: '10资源', output: '+5资源/回合', co2: '0', level: 1, res: '可升级→+10资源/回合' },
    { name: '采石场', icon: '⛏', cost: '20资源', output: '+10资源/回合', co2: '+2 CO2', level: 1, res: '可升级→+18资源/回合' },
    { name: '火电厂', icon: '🏭', cost: '50资源', output: '+8电力/回合', co2: '+12 CO2', level: 1, res: '-15资源/回合' },
    { name: '研究所', icon: '🔬', cost: '60资源', output: '+2科技点/回合', co2: '0', level: 2, res: '-8电力/回合' },
    { name: '风力发电机', icon: '🌬', cost: '20资源+1科技点', output: '+5电力/回合', co2: '0', level: '研究', res: '需研发风力发电' },
    { name: '太阳能板', icon: '☀', cost: '30资源+2科技点', output: '+8电力/回合', co2: '0', level: '研究', res: '需研发太阳能发电' },
    { name: '生态林地', icon: '🌿', cost: '20资源', output: '-2 CO2/回合', co2: '-2 CO2', level: '研究', res: '需研发生态林地' },
  ];

  const startY = py + 48;
  const rowH = 46;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < buildings.length; i++) {
    const b = buildings[i];
    const by = startY + i * rowH;

    // 行背景
    const isUnlocked = typeof b.level === 'number' ? gameState.civilizationLevel >= b.level : (gameState.unlockedResearches || []).includes(b.level === '研究' ? '' : '');
    ctx.fillStyle = i % 2 === 0 ? 'rgba(40,60,100,0.3)' : 'rgba(50,70,110,0.3)';
    ctx.fillRect(px + 12, by, pw - 24, rowH - 4);

    // 图标+名称
    ctx.fillStyle = '#e0e8ff';
    ctx.font = '15px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText(b.icon + ' ' + b.name, px + 20, by + 14);

    // 解锁等级
    const lvlText = typeof b.level === 'number' ? 'Lv.' + b.level : '🔬研究';
    const lvlColor = typeof b.level === 'number'
      ? (gameState.civilizationLevel >= b.level ? '#4caf50' : '#ff9800')
      : '#ce93d8';
    ctx.fillStyle = lvlColor;
    ctx.font = 'bold 12px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText(lvlText, px + 160, by + 14);

    // 消耗
    ctx.fillStyle = '#ffab40';
    ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText('消耗: ' + b.cost, px + 220, by + 14);

    // 产出
    ctx.fillStyle = '#81c784';
    ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText('产出: ' + b.output, px + 20, by + 34);

    // CO2
    ctx.fillStyle = b.co2.startsWith('-') ? '#4caf50' : (b.co2 === '0' ? '#999' : '#ff6e6e');
    ctx.fillText('CO2: ' + b.co2, px + 200, by + 34);

    // 额外说明
    if (b.res) {
      ctx.fillStyle = '#90a4ae';
      ctx.font = '11px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText(b.res, px + 300, by + 34);
    }
  }

  // 底部研究项目
  const researchY = startY + buildings.length * rowH + 8;
  ctx.fillStyle = '#ce93d8';
  ctx.font = 'bold 13px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('研究项目（在研究所中研发）:', px + 20, researchY);

  const researches = [
    { name: '风力发电', cost: '4科技点', desc: '解锁风力发电机' },
    { name: '太阳能发电', cost: '12科技点', desc: '解锁太阳能板' },
    { name: '生态林地建设', cost: '8科技点', desc: '解锁生态林地' },
  ];

  for (let i = 0; i < researches.length; i++) {
    const r = researches[i];
    const ry = researchY + 22 + i * 20;
    const unlocked = (gameState.unlockedResearches || []).includes(['wind_power', 'solar_power', 'eco_forest'][i]);
    ctx.fillStyle = unlocked ? '#4caf50' : '#bbb';
    ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText((unlocked ? '✓ ' : '○ ') + r.name + ' - ' + r.cost + ' - ' + r.desc, px + 28, ry);
  }

  ctx.textAlign = 'left';
  window._techTreePanel = { x: px, y: py, w: pw, h: ph };
}

// === CO2吸收量显示（已改为回合结算时弹出）===
export function drawCO2AbsorbUI(ctx, canvas) {
  // CO2吸收量现在在回合结算时以浮动文字显示，不再常驻显示
}

// === CO2值显示（地图上方）===
export function drawCO2TopUI(ctx, canvas) {
  const mapLeft = (canvas.width - COLS * HEX_W) / 2;
  const mapCenterX = mapLeft + COLS * HEX_W / 2;
  const mapTop = (canvas.height - (ROWS - 1) * V_SPACING * PERSPECTIVE) / 2 - 20;
  const x = mapCenterX;
  const y = mapTop - 40;

  const co2Display = gameState.displayCo2;
  const co2Color = co2Display >= 50 ? '#ff8a80' : co2Display >= 30 ? '#ffab40' : '#bbb';
  ctx.save();
  ctx.fillStyle = co2Color;
  ctx.font = 'bold 20px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 4;
  ctx.fillText('CO2: ' + Math.round(co2Display), x, y);
  ctx.restore();
  ctx.textAlign = 'left';
}

// === 研究面板（已删除）===
export function drawResearchPanel(ctx, canvas) {
  // 研究面板已删除
}

// === 游戏失败界面 ===
export function drawGameOverScreen(ctx, canvas) {
  if (gameState.gameWon) { drawGameWonScreen(ctx, canvas); return; }
  if (!gameState.gameOver) return;

  ctx.fillStyle = 'rgba(10,0,0,0.8)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const pulse = Math.sin(Date.now() / 500) * 0.15 + 0.85;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  let gameOverTitle, gameOverSub;
  if (gameState.co2 >= 100) {
    gameOverTitle = '温室效应失控';
    gameOverSub = 'CO2浓度过高，生态系统彻底崩溃';
  } else {
    gameOverTitle = '文明覆灭';
    gameOverSub = '资源枯竭，聚落陷入长久危机';
  }

  ctx.save();
  ctx.shadowColor = 'rgba(255,50,50,0.3)';
  ctx.shadowBlur = 20;
  ctx.fillStyle = `rgba(255,50,50,${pulse})`;
  ctx.font = 'bold 48px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(gameOverTitle, cx, cy - 60);
  ctx.restore();

  ctx.fillStyle = '#ff8a80';
  ctx.font = '18px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(gameOverSub, cx, cy - 15);

  ctx.fillStyle = '#aaa';
  ctx.font = '14px "Segoe UI", "Microsoft YaHei", sans-serif';
  let stats = '存活回合: ' + (gameState.turn - 1) + '  |  文明等级: Lv.' + gameState.civilizationLevel;
  ctx.fillText(stats, cx, cy + 25);

  const btnW = 160, btnH = 44;
  const btnX = cx - btnW / 2, btnY = cy + 60;
  const restartGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
  restartGrad.addColorStop(0, 'rgba(200,50,50,0.75)');
  restartGrad.addColorStop(1, 'rgba(160,30,30,0.65)');
  ctx.fillStyle = restartGrad;
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,100,100,0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('重新开始', cx, btnY + btnH / 2);
  ctx.textAlign = 'left';

  window._drawGameOverScreen_restartBtn = { x: btnX, y: btnY, w: btnW, h: btnH };
}

// === 游戏胜利界面 ===
function drawGameWonScreen(ctx, canvas) {
  if (!gameState.gameWon) return;

  ctx.fillStyle = 'rgba(0,10,0,0.8)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const pulse = Math.sin(Date.now() / 500) * 0.15 + 0.85;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.save();
  ctx.shadowColor = 'rgba(50,255,100,0.3)';
  ctx.shadowBlur = 20;
  ctx.fillStyle = `rgba(50,255,100,${pulse})`;
  ctx.font = 'bold 52px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🌍 文明新生', cx, cy - 70);
  ctx.restore();

  ctx.fillStyle = '#a5d6a7';
  ctx.font = '20px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CO2归零，文明与自然达成和谐', cx, cy - 20);

  ctx.fillStyle = '#ccc';
  ctx.font = '14px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.fillText('用时 ' + (gameState.turn - 1) + ' 回合  |  文明等级: Lv.' + gameState.civilizationLevel, cx, cy + 25);
  ctx.fillText('资源: ' + gameState.resources + '  |  电力: ' + gameState.power, cx, cy + 50);

  const btnW = 160, btnH = 44;
  const btnX = cx - btnW / 2, btnY = cy + 90;
  const restartGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
  restartGrad.addColorStop(0, 'rgba(50,140,70,0.8)');
  restartGrad.addColorStop(1, 'rgba(35,110,55,0.7)');
  ctx.fillStyle = restartGrad;
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(100,255,130,0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('再来一局', cx, btnY + btnH / 2);
  ctx.textAlign = 'left';

  window._drawGameWonScreen_restartBtn = { x: btnX, y: btnY, w: btnW, h: btnH };
}
