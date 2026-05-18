// === CO2STER - Render: Visual Effects (Particles, Animations) ===

import { gameState, co2Particles, co2AnimParticles, settlementAnims, dialogueAnims, beastState, beastDialogues, prologueState, endingState, introState } from '../state.js';

// === CO2 粒子绘制（旧版） ===
export function drawCO2Particles(ctx) {
  for (const p of co2Particles) {
    const a = p.alpha * (1 - p.progress);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (1 - p.progress * 0.5), 0, Math.PI * 2);
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
    g.addColorStop(0, `rgba(200,120,50,${a})`);
    g.addColorStop(1, `rgba(100,50,20,${a * 0.3})`);
    ctx.fillStyle = g;
    ctx.fill();
  }
}

// === CO2 气态粒子更新 ===
export function updateCO2AnimParticles() {
  // 碳兽进食时，嘴部位置作为吸引点（使用 game.js 每帧更新的屏幕坐标）
  const feedAttract = beastState.feeding && gameState.displayCo2 >= 20;
  const beastMouthX = beastState.mouthScreenX || window.innerWidth * 0.5;
  const beastMouthY = beastState.mouthScreenY || window.innerHeight * 0.3;

  for (let i = co2AnimParticles.length - 1; i >= 0; i--) {
    const p = co2AnimParticles[i];
    p.progress += p.speed;
    p.x += p.vx + Math.sin(p.wobble) * 0.3;
    p.y += p.vy;
    p.wobble += 0.08;
    p.alpha = Math.max(0, 1 - p.progress);

    // 碳兽进食时，emit粒子被吸向嘴部
    if (feedAttract && p.type === 'emit') {
      const dx = beastMouthX - p.x;
      const dy = beastMouthY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 8) {
        // 吸引力随距离增大而增强（远处也有明显拉拽感）
        const attractForce = beastState.feedIntensity * 1.2;
        const distFactor = Math.max(0.3, 1 - dist / 800); // 远处也有30%的力
        p.vx += (dx / dist) * attractForce * distFactor;
        p.vy += (dy / dist) * attractForce * distFactor;
      }
      // 越近嘴部，阻尼越大（被吞入的感觉）
      const dampFactor = dist < 200 ? 0.92 : 0.97;
      p.vx *= dampFactor;
      p.vy *= dampFactor;
      // 接近嘴部时加速缩小并消失
      if (dist < 80) {
        p.alpha *= 0.88;
        p.progress += 0.04;
        p.size *= 0.97; // 粒子被吸入时缩小
      }
      // 被吸引时停止向上飘，改为朝嘴部运动
      if (p.progress < 0.5) {
        p.vy = p.vy * 0.8 + (dy > 0 ? 0.3 : -0.1); // 微调方向
      }
    }

    if (p.progress >= 1 || p.alpha <= 0.01) {
      co2AnimParticles.splice(i, 1);
    }
  }
}

// === CO2 气态粒子绘制 ===
export function drawCO2AnimParticles(ctx) {
  for (const p of co2AnimParticles) {
    if (p.alpha <= 0) continue;
    ctx.save();
    ctx.globalAlpha = p.alpha * 0.7;
    const r = p.size * (1 + p.progress * 0.3);

    // 气态云雾效果
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    if (p.type === 'emit') {
      // 产出CO2：棕橙色
      g.addColorStop(0, 'rgba(210,130,50,0.8)');
      g.addColorStop(0.5, 'rgba(180,100,30,0.4)');
      g.addColorStop(1, 'rgba(150,80,20,0)');
    } else {
      // 吸收CO2：闪烁绿色光点
      g.addColorStop(0, 'rgba(100,255,120,0.9)');
      g.addColorStop(0.4, 'rgba(60,220,80,0.5)');
      g.addColorStop(1, 'rgba(30,180,50,0)');
    }
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();

    // 内部亮核
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 0.3, 0, Math.PI * 2);
    if (p.type === 'emit') {
      ctx.fillStyle = `rgba(255,180,80,${p.alpha * 0.5})`;
    } else {
      ctx.fillStyle = `rgba(180,255,200,${p.alpha * 0.7})`;
    }
    ctx.fill();

    ctx.restore();
  }
}

// === 浮动文字绘制 ===
export function drawSettlementAnims(ctx) {
  for (const a of settlementAnims) {
    if (a.delay > 0) continue;
    ctx.save();
    ctx.globalAlpha = Math.max(0, a.alpha);
    ctx.fillStyle = a.color;
    ctx.font = 'bold 18px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 3;
    ctx.strokeText(a.text, a.x, a.y);
    ctx.fillText(a.text, a.x, a.y);
    ctx.restore();
  }
}

// === 建筑台词飘出动画更新 ===
export function updateDialogueAnims() {
  for (let i = dialogueAnims.length - 1; i >= 0; i--) {
    const d = dialogueAnims[i];
    d.life -= 1;
    d.y += d.vy;
    // 前30%淡入，后30%淡出
    const progress = 1 - d.life / d.maxLife;
    if (progress < 0.15) {
      d.alpha = progress / 0.15;
    } else if (progress > 0.7) {
      d.alpha = (1 - progress) / 0.3;
    } else {
      d.alpha = 1;
    }
    if (d.life <= 0) {
      dialogueAnims.splice(i, 1);
    }
  }
}

// === 建筑台词绘制 ===
export function drawDialogueAnims(ctx) {
  for (const d of dialogueAnims) {
    if (d.alpha <= 0) continue;
    ctx.save();
    ctx.globalAlpha = Math.max(0, d.alpha) * 0.85;

    // 测量文本宽度，绘制半透明背景
    ctx.font = '11px "Microsoft YaHei", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const metrics = ctx.measureText(d.text);
    const tw = metrics.width + 12;
    const th = 18;

    // 圆角背景
    const bx = d.x - tw / 2;
    const by = d.y - th / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.roundRect(bx, by, tw, th, 4);
    ctx.fill();

    // 黑色文字
    ctx.fillStyle = '#1a1a1a';
    ctx.fillText(d.text, d.x, d.y);

    ctx.restore();
  }
}

// === 碳兽台词：浮现淡入淡出动画更新 ===
const BEAST_DIALOGUE_FADEIN_FRAMES = 40;     // 淡入帧数 (~0.67秒)
const BEAST_DIALOGUE_HOLD_FRAMES = 180;      // 停留帧数 (~3秒@60fps)
const BEAST_DIALOGUE_FADEOUT_FRAMES = 50;     // 淡出帧数 (~0.83秒)

export function updateBeastDialogueAnim() {
  for (let i = beastDialogues.length - 1; i >= 0; i--) {
    const d = beastDialogues[i];

    if (d.phase === 'fadein') {
      d.alpha = Math.min(d.alpha + 1 / BEAST_DIALOGUE_FADEIN_FRAMES, 1);
      if (d.alpha >= 1) {
        d.phase = 'hold';
        d.holdTimer = BEAST_DIALOGUE_HOLD_FRAMES;
      }
    } else if (d.phase === 'hold') {
      d.alpha = 1;
      d.holdTimer--;
      if (d.holdTimer <= 0) {
        d.phase = 'fadeout';
      }
    } else if (d.phase === 'fadeout') {
      d.alpha = Math.max(d.alpha - 1 / BEAST_DIALOGUE_FADEOUT_FRAMES, 0);
      if (d.alpha <= 0) {
        d.phase = 'done';
      }
    }
  }
  // 清理已完成的台词
  for (let i = beastDialogues.length - 1; i >= 0; i--) {
    if (beastDialogues[i].phase === 'done') {
      beastDialogues.splice(i, 1);
    }
  }
}

// === 碳兽台词绘制（无边框，随机旋转角度浮现）===
export function drawBeastDialogueAnim(ctx) {
  for (const d of beastDialogues) {
    if (d.alpha <= 0) continue;
    ctx.save();
    ctx.globalAlpha = Math.max(0, d.alpha) * 0.9;

    ctx.font = d.fontSize + 'px "Microsoft YaHei", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 在随机位置以随机旋转角度绘制文字，无边框
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rotation);
    ctx.fillStyle = d.color;
    ctx.fillText(d.text, 0, 0);

    ctx.restore();
  }
}

// === 文明等级提示 ===
const LEVEL_PROLOGUE = {
  1: "人类向自然索取生存，而自然尚未回应。",
  2: "黑烟与钢铁孕育繁荣，也唤醒沉睡的阴影。",
  3: "当祂吞噬天空，人类必须为自己的文明负责。",
};

const LEVEL_COLORS = {
  1: '#e8d5c0',
  2: '#ffeb3b',
  3: '#64b5f6',
};

export function updatePrologue() {
  if (!prologueState.active) return;
  const s = prologueState;
  s.timer++;

  if (s.phase === 'fadein') {
    s.alpha = Math.min(s.timer / s.fadeFrames, 1);
    if (s.timer >= s.fadeFrames) {
      s.phase = 'hold';
      s.timer = 0;
    }
  } else if (s.phase === 'hold') {
    s.alpha = 1;
    if (s.timer >= s.holdFrames) {
      s.phase = 'fadeout';
      s.timer = 0;
    }
  } else if (s.phase === 'fadeout') {
    s.alpha = Math.max(1 - s.timer / s.fadeFrames, 0);
    if (s.timer >= s.fadeFrames) {
      s.active = false;
    }
  }
}

export function drawPrologue(ctx, w, h) {
  if (!prologueState.active) return;
  const s = prologueState;
  if (s.alpha <= 0) return;

  ctx.save();
  ctx.globalAlpha = s.alpha;

  // 半透明黑底
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const color = LEVEL_COLORS[s.level] || '#e8d5c0';

  // 文明等级标题
  ctx.fillStyle = color;
  ctx.font = 'bold 48px "Microsoft YaHei", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  ctx.fillText('文明等级  Lv.' + s.level, cx, cy - 25);

  // 对应序言文字
  const subtitle = LEVEL_PROLOGUE[s.level] || '';
  ctx.font = '20px "Microsoft YaHei", "Segoe UI", serif';
  ctx.fillStyle = 'rgba(232,213,192,0.9)';
  ctx.fillText(subtitle, cx, cy + 25);

  ctx.restore();
}

// === 结局动画 ===

const BAD_ENDING_TEXT = [
  "当最后一片森林沉入黑色尘埃，",
  "人类终于失去了与自然对话的资格。",
  "",
  "城市仍闪烁着灯火，机器仍昼夜轰鸣，",
  "可大地已经不再回应文明的呼唤。",
  "",
  "碳兽自浓烟与欲望中诞生，",
  "又在失衡的世界里无限蔓延。",
  "",
  "人类曾以为自己征服了自然，",
  "最终却只是亲手点燃了吞没文明的火焰。",
  "",
  "很久以后，风依旧吹过废墟。",
  "只是这一次，再也没有人类抬头仰望天空。",
];

const GOOD_ENDING_TEXT = [
  "人类曾让钢铁覆盖原野，",
  "也曾让浓烟遮蔽天空。",
  "",
  "可在文明濒临崩塌之时，",
  "人类终于学会了与自然重新同行。",
  "",
  "森林再次生长，河流恢复清澈，",
  "沉寂已久的大地重新焕发生机。",
  "",
  "碳兽，CO₂STER并非真正的怪物，",
  "它只是失衡与贪婪留下的倒影。",
  "",
  "而如今，人类终于明白：",
  "文明真正的力量，从不是征服自然，",
  "而是学会与世界共存。",
];

// 坏结局：碳兽进食 → 地图螺旋飞入 → 标题+文案
export function updateEndingAnim(w, h, mapCX, mapCY) {
  if (!endingState.active) return;
  const s = endingState;
  s.timer++;

  if (s.type === 'bad') {
    if (s.phase === 'feeding') {
      s.alpha = Math.min(s.timer / 60, 0.85);
      if (s.timer >= 120) {
        s.phase = 'spiral';
        s.timer = 0;
      }
    } else if (s.phase === 'spiral') {
      const progress = Math.min(s.timer / 240, 1);
      const ease = progress * progress;

      s.mapScale = 1 - ease * 0.9;
      s.mapRotation = ease * Math.PI * 6;
      s.alpha = 0.85;

      const targetX = beastState.mouthScreenX || w / 2;
      const targetY = beastState.mouthScreenY || h / 2;
      s.mapOffsetX = (targetX - mapCX) * ease;
      s.mapOffsetY = (targetY - mapCY) * ease;

      if (progress > 0.8) {
        const fadeOut = (progress - 0.8) / 0.2;
        s.mapScale *= (1 - fadeOut);
        s.alpha = 0.85 * (1 - fadeOut);
      }

      if (s.timer >= 240) {
        s.phase = 'blackout';
        s.timer = 0;
        s.alpha = 0;
      }
    } else if (s.phase === 'blackout') {
      s.alpha = Math.min(s.timer / 30, 1);
      if (s.timer >= 60) {
        s.phase = 'title';
        s.timer = 0;
        s.textAlpha = 0;
        s.currentTextLine = 0;
        s.textTimer = 0;
      }
    } else if (s.phase === 'title') {
      s.textTimer++;
      if (s.textTimer % 30 === 0 && s.currentTextLine < BAD_ENDING_TEXT.length - 1) {
        s.currentTextLine++;
      }
      s.textAlpha = Math.min(s.textAlpha + 0.02, 1);
    }
  } else if (s.type === 'good') {
    if (s.phase === 'shrink') {
      // 碳兽缩小到中等CO2形象
      s.shrinkTimer++;
      s.alpha = Math.min(s.timer / 30, 1);
      if (s.shrinkTimer >= s.shrinkDuration) {
        s.phase = 'explode';
        s.timer = 0;
        s.shrinkDone = true;
      }
    } else if (s.phase === 'explode') {
      s.alpha = Math.min(s.timer / 30, 1);
      if (s.timer === 1) {
        const cx = beastState.mouthScreenX || w / 2;
        const cy = beastState.mouthScreenY || h / 2;
        // 大量爆炸粒子 —— 远超之前
        for (let i = 0; i < 200; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1 + Math.random() * 8;
          const isDark = Math.random() < 0.5;
          const isSpark = Math.random() < 0.3; // 30%火花粒子
          const isRing = !isSpark && Math.random() < 0.15; // 10%环形冲击波碎片
          s.explodeParticles.push({
            x: cx + (Math.random() - 0.5) * 100,
            y: cy + (Math.random() - 0.5) * 100,
            vx: Math.cos(angle) * speed * (isRing ? 1.5 : 1),
            vy: Math.sin(angle) * speed * (isRing ? 1.5 : 1) - (isSpark ? 2 : 0),
            size: isSpark ? 2 + Math.random() * 4 : (isRing ? 6 + Math.random() * 12 : 4 + Math.random() * 12),
            alpha: 0.9 + Math.random() * 0.1,
            color: isSpark
              ? `rgba(${220 + Math.random() * 35},${200 + Math.random() * 55},${80 + Math.random() * 80},1)`
              : isDark
                ? `rgba(${80 + Math.random() * 80},${30 + Math.random() * 40},${10 + Math.random() * 20},1)`
                : `rgba(${50 + Math.random() * 60},${180 + Math.random() * 75},${50 + Math.random() * 60},1)`,
            life: 150 + Math.random() * 120,
            spark: isSpark,
            ring: isRing,
            gravity: isSpark ? 0.05 : 0.008,
          });
        }
      }
      for (let i = s.explodeParticles.length - 1; i >= 0; i--) {
        const p = s.explodeParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity || 0;
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.life--;
        p.alpha = Math.max(0, p.life / 200);
        p.size *= (p.spark ? 0.99 : 0.997);
        if (p.life <= 0) s.explodeParticles.splice(i, 1);
      }
      if (s.timer >= 30) {
        s.alpha = Math.max(1 - (s.timer - 30) / 90, 0);
      }
      if (s.timer >= 150) {
        s.phase = 'scatter';
        s.timer = 0;
      }
    } else if (s.phase === 'scatter') {
      for (let i = s.explodeParticles.length - 1; i >= 0; i--) {
        const p = s.explodeParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity || 0;
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.life--;
        p.alpha = Math.max(0, p.alpha - 0.008);
        if (p.life <= 0 || p.alpha <= 0) s.explodeParticles.splice(i, 1);
      }
      s.alpha = Math.min(s.timer / 30, 1);
      if (s.timer >= 90) {
        s.phase = 'title';
        s.timer = 0;
        s.textAlpha = 0;
        s.currentTextLine = 0;
        s.textTimer = 0;
      }
    } else if (s.phase === 'title') {
      s.textTimer++;
      if (s.textTimer % 30 === 0 && s.currentTextLine < GOOD_ENDING_TEXT.length - 1) {
        s.currentTextLine++;
      }
      s.textAlpha = Math.min(s.textAlpha + 0.02, 1);
    }
  }
}

// 获取结局动画对地图的变换参数
export function getEndingMapTransform() {
  if (!endingState.active || endingState.type !== 'bad') return null;
  const s = endingState;
  if (s.phase !== 'spiral') return null;
  return {
    scale: s.mapScale,
    rotation: s.mapRotation,
    offsetX: s.mapOffsetX,
    offsetY: s.mapOffsetY,
    alpha: s.alpha,
  };
}

// 是否应该隐藏碳兽（好结局爆炸时）
export function shouldHideBeast() {
  if (!endingState.active) return false;
  if (endingState.type === 'good' && (endingState.phase === 'explode' || endingState.phase === 'scatter' || endingState.phase === 'title')) {
    return true;
  }
  return false;
}

// 好结局shrink阶段：碳兽应使用中等CO2值的gazeRatio
export function getShrinkGazeRatio() {
  if (!endingState.active || endingState.type !== 'good' || endingState.phase !== 'shrink') return null;
  // 从当前CO2值线性插值到中等CO2值(gazeRatio≈0.52)
  const s = endingState;
  const progress = Math.min(s.shrinkTimer / s.shrinkDuration, 1);
  const ease = 1 - Math.pow(1 - progress, 2); // ease-out
  const currentCo2 = gameState.displayCo2;
  const targetCo2 = s.shrinkCo2;
  // gazeRatio映射：CO2=20→0.31，CO2=150→1.0
  const currentGaze = Math.min(0.31 + (currentCo2 - 20) / (150 - 20) * 0.69, 1);
  const targetGaze = Math.min(0.31 + (targetCo2 - 20) / (150 - 20) * 0.69, 1);
  return currentGaze + (targetGaze - currentGaze) * ease;
}

// 绘制结局动画叠加层
export function drawEndingOverlay(ctx, w, h) {
  if (!endingState.active) return;
  const s = endingState;

  if (s.type === 'bad') {
    if (s.phase === 'feeding') {
      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = 'rgba(20,0,0,0.4)';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    } else if (s.phase === 'blackout') {
      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = 'rgba(5,0,0,1)';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    } else if (s.phase === 'title') {
      ctx.fillStyle = 'rgba(10,0,0,1)';
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.globalAlpha = s.textAlpha;

      const cx = w / 2;
      const cy = h * 0.15;

      ctx.fillStyle = '#cc3322';
      ctx.font = 'bold 56px "Microsoft YaHei", "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(200,40,20,0.5)';
      ctx.shadowBlur = 20;
      ctx.fillText('黯蚀纪', cx, cy);
      ctx.shadowBlur = 0;

      ctx.font = '18px "Microsoft YaHei", "Segoe UI", serif';
      ctx.fillStyle = '#c8b0a0';
      ctx.textAlign = 'center';
      const lineH = 30;
      const startY = cy + 60;
      for (let i = 0; i <= s.currentTextLine && i < BAD_ENDING_TEXT.length; i++) {
        const lineAlpha = i === s.currentTextLine ? Math.min((s.textTimer % 30) / 15, 1) : 1;
        ctx.globalAlpha = s.textAlpha * lineAlpha;
        ctx.fillText(BAD_ENDING_TEXT[i], cx, startY + i * lineH);
      }

      // 所有文字播完后：显示作者信息和重新开始按钮
      if (s.currentTextLine >= BAD_ENDING_TEXT.length - 1 && s.textTimer > BAD_ENDING_TEXT.length * 30 + 60) {
        // 作者信息
        ctx.globalAlpha = s.textAlpha;
        ctx.font = '14px "Microsoft YaHei", "Segoe UI", sans-serif';
        ctx.fillStyle = 'rgba(180,160,140,0.6)';
        ctx.fillText('作者：酸橙味的风 & CodeBubby', cx, h - 100);

        // 重新开始按钮
        const btnW = 180, btnH = 48;
        const btnX = cx - btnW / 2, btnY = h - 68;
        const grad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
        grad.addColorStop(0, 'rgba(160,40,30,0.85)');
        grad.addColorStop(1, 'rgba(120,20,15,0.75)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnW, btnH, 8);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 17px "Microsoft YaHei", "Segoe UI", sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText('重新开始', cx, btnY + btnH / 2);
        window._endingScreen_restartBtn = { x: btnX, y: btnY, w: btnW, h: btnH };
      }

      ctx.restore();
    }
  } else if (s.type === 'good') {
    if (s.phase === 'shrink') {
      // shrink阶段：碳兽缩小到中等形象，屏幕轻微闪烁提示即将爆炸
      const progress = Math.min(s.shrinkTimer / s.shrinkDuration, 1);
      if (progress > 0.7) {
        const flashAlpha = Math.sin(s.timer * 0.3) * 0.1 + 0.05;
        ctx.fillStyle = `rgba(255,200,100,${flashAlpha})`;
        ctx.fillRect(0, 0, w, h);
      }
    }
    if (s.phase === 'explode' || s.phase === 'scatter') {
      for (const p of s.explodeParticles) {
        if (p.alpha <= 0) continue;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        g.addColorStop(0, p.color);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    if (s.phase === 'title') {
      ctx.fillStyle = 'rgba(0,10,0,1)';
      ctx.fillRect(0, 0, w, h);

      for (const p of s.explodeParticles) {
        if (p.alpha <= 0) continue;
        ctx.save();
        ctx.globalAlpha = p.alpha * 0.5;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      ctx.globalAlpha = s.textAlpha;

      const cx = w / 2;
      const cy = h * 0.15;

      ctx.fillStyle = '#4caf50';
      ctx.font = 'bold 56px "Microsoft YaHei", "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(50,200,80,0.5)';
      ctx.shadowBlur = 20;
      ctx.fillText('新生纪', cx, cy);
      ctx.shadowBlur = 0;

      ctx.font = '18px "Microsoft YaHei", "Segoe UI", serif';
      ctx.fillStyle = '#b0d8b0';
      ctx.textAlign = 'center';
      const lineH = 30;
      const startY = cy + 60;
      for (let i = 0; i <= s.currentTextLine && i < GOOD_ENDING_TEXT.length; i++) {
        const lineAlpha = i === s.currentTextLine ? Math.min((s.textTimer % 30) / 15, 1) : 1;
        ctx.globalAlpha = s.textAlpha * lineAlpha;
        ctx.fillText(GOOD_ENDING_TEXT[i], cx, startY + i * lineH);
      }

      // 所有文字播完后：显示作者信息和重新开始按钮
      if (s.currentTextLine >= GOOD_ENDING_TEXT.length - 1 && s.textTimer > GOOD_ENDING_TEXT.length * 30 + 60) {
        // 作者信息
        ctx.globalAlpha = s.textAlpha;
        ctx.font = '14px "Microsoft YaHei", "Segoe UI", sans-serif';
        ctx.fillStyle = 'rgba(160,200,160,0.6)';
        ctx.fillText('作者：酸橙味的风 & CodeBubby', cx, h - 100);

        // 重新开始按钮
        const btnW = 180, btnH = 48;
        const btnX = cx - btnW / 2, btnY = h - 68;
        const grad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
        grad.addColorStop(0, 'rgba(50,140,70,0.85)');
        grad.addColorStop(1, 'rgba(30,100,50,0.75)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnW, btnH, 8);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 17px "Microsoft YaHei", "Segoe UI", sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText('重新开始', cx, btnY + btnH / 2);
        window._endingScreen_restartBtn = { x: btnX, y: btnY, w: btnW, h: btnH };
      }

      ctx.restore();
    }
  }
}

// === 开场指引 ===
export function updateIntro() {
  if (!introState.active) return;
  const s = introState;
  s.timer++;

  if (s.phase === 'fadein') {
    s.alpha = Math.min(s.timer / s.fadeFrames, 1);
    if (s.timer >= s.fadeFrames) {
      s.phase = 'hold';
      s.timer = 0;
    }
  } else if (s.phase === 'hold') {
    s.alpha = 1;
    if (s.timer >= s.holdFrames) {
      s.phase = 'fadeout';
      s.timer = 0;
    }
  } else if (s.phase === 'fadeout') {
    s.alpha = Math.max(1 - s.timer / s.fadeOutFrames, 0);
    if (s.timer >= s.fadeOutFrames) {
      s.active = false;
    }
  }
}

export function drawIntro(ctx, w, h) {
  if (!introState.active) return;
  if (introState.alpha <= 0) return;

  ctx.save();
  ctx.globalAlpha = introState.alpha;

  // 半透明暗色遮罩
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;

  // 大字标题：拓荒 · 生产 · 进化
  ctx.fillStyle = '#e0e8f0';
  ctx.font = 'bold 52px "Microsoft YaHei", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(200,220,255,0.3)';
  ctx.shadowBlur = 15;
  ctx.fillText('拓荒  ·  生产  ·  进化', cx, cy - 20);
  ctx.shadowBlur = 0;

  // 小字提示
  ctx.fillStyle = 'rgba(200,210,225,0.75)';
  ctx.font = '16px "Microsoft YaHei", "Segoe UI", sans-serif';
  ctx.fillText('*左键地块以进行操作', cx, cy + 35);

  ctx.restore();
}
