// === CO2STER - Render: Hex Tile Rendering (Enhanced 2D Art)

import { HEX_R, PERSPECTIVE, TILE_HEIGHT, seededRandom, adjustColor } from '../config.js';

export function hexCorners(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 180 * (60 * i - 30);
    pts.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) * PERSPECTIVE });
  }
  return pts;
}

export function drawHexTile(ctx, cx, cy, topColor, sideColor1, sideColor2, highlight) {
  const top = hexCorners(cx, cy, HEX_R - 1);
  const sides = [
    { from: 0, to: 1, color: sideColor1 },
    { from: 1, to: 2, color: sideColor2 },
    { from: 2, to: 3, color: sideColor1 },
  ];

  // === 侧面（3D厚度）===
  for (const side of sides) {
    const p1 = top[side.from];
    const p2 = top[side.to];
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p2.x, p2.y + TILE_HEIGHT);
    ctx.lineTo(p1.x, p1.y + TILE_HEIGHT);
    ctx.closePath();

    // 侧面渐变：上亮下暗
    const sideGrad = ctx.createLinearGradient(p1.x, p1.y, p1.x, p1.y + TILE_HEIGHT);
    sideGrad.addColorStop(0, side.color);
    sideGrad.addColorStop(1, adjustColor(side.color, 0.7));
    ctx.fillStyle = sideGrad;
    ctx.fill();

    // 侧面柔边
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // === 顶面 ===
  ctx.beginPath();
  ctx.moveTo(top[0].x, top[0].y);
  for (let i = 1; i < 6; i++) ctx.lineTo(top[i].x, top[i].y);
  ctx.closePath();

  // 顶面主渐变（斜向对角，模拟光照从左上来）
  const grad = ctx.createLinearGradient(cx - HEX_R * 1.1, cy - HEX_R * PERSPECTIVE * 1.1, cx + HEX_R * 0.8, cy + HEX_R * PERSPECTIVE * 0.8);
  grad.addColorStop(0, adjustColor(topColor, 1.22));
  grad.addColorStop(0.35, adjustColor(topColor, 1.08));
  grad.addColorStop(0.65, topColor);
  grad.addColorStop(1, adjustColor(topColor, 0.82));
  ctx.fillStyle = grad;
  ctx.fill();

  // 柔和边缘
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // === 顶面高光层（环境光模拟）===
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(top[0].x, top[0].y);
  for (let i = 1; i < 6; i++) ctx.lineTo(top[i].x, top[i].y);
  ctx.closePath();
  ctx.clip();

  // 左上柔光
  const hl = ctx.createLinearGradient(cx - HEX_R * 0.6, cy - HEX_R * PERSPECTIVE * 0.9, cx + HEX_R * 0.4, cy + HEX_R * PERSPECTIVE * 0.5);
  hl.addColorStop(0, 'rgba(255,255,255,0.14)');
  hl.addColorStop(0.4, 'rgba(255,255,255,0.04)');
  hl.addColorStop(1, 'rgba(0,0,0,0.06)');
  ctx.fillStyle = hl;
  ctx.fill();

  // 内边缘环境光遮蔽 (AO)
  const aoGrad = ctx.createRadialGradient(cx, cy, HEX_R * 0.25, cx, cy, HEX_R * 0.92);
  aoGrad.addColorStop(0, 'rgba(0,0,0,0)');
  aoGrad.addColorStop(0.7, 'rgba(0,0,0,0)');
  aoGrad.addColorStop(1, 'rgba(0,0,0,0.10)');
  ctx.fillStyle = aoGrad;
  ctx.fill();

  ctx.restore();

  // === 边缘柔光（rim light，从右下模拟反弹光）===
  ctx.beginPath();
  ctx.moveTo(top[3].x, top[3].y);
  ctx.lineTo(top[4].x, top[4].y);
  ctx.lineTo(top[5].x, top[5].y);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 上边缘柔光
  ctx.beginPath();
  ctx.moveTo(top[0].x, top[0].y);
  ctx.lineTo(top[5].x, top[5].y);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // === 选中高亮（脉冲动效）===
  if (highlight) {
    const t = Date.now() / 800;
    const pulse = Math.sin(t) * 0.08 + 0.18;
    const glowPulse = Math.sin(t) * 2 + 4;

    // 外发光
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(top[0].x, top[0].y);
    for (let i = 1; i < 6; i++) ctx.lineTo(top[i].x, top[i].y);
    ctx.closePath();
    ctx.shadowColor = 'rgba(255,255,150,0.5)';
    ctx.shadowBlur = glowPulse + 6;
    ctx.strokeStyle = `rgba(255,255,150,${0.5 + pulse})`;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // 内填充
    ctx.beginPath();
    ctx.moveTo(top[0].x, top[0].y);
    for (let i = 1; i < 6; i++) ctx.lineTo(top[i].x, top[i].y);
    ctx.closePath();
    ctx.fillStyle = `rgba(255,255,200,${pulse})`;
    ctx.fill();
  }
}
