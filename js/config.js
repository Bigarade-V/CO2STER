// === CO2STER - Game Constants & Configuration ===

// 六边形参数
export const HEX_R = 60;
export const HEX_W = Math.sqrt(3) * HEX_R;
export const HEX_H = 2 * HEX_R;
export const V_SPACING = HEX_H * 0.75;
export const ROWS = 7;
export const COLS = 9;
export const PERSPECTIVE = 0.58;
export const TILE_HEIGHT = 18;

// 回合结算
export const SETTLE_PHASE_DURATION = 30; // 每阶段帧数

// 游戏失败/胜利阈值
export const CO2_DEATH_THRESHOLD = 150;
export const CO2_GREENHOUSE_THRESHOLD = 100;
export const HEAT_ISLAND_MIN_BUILDINGS = 5;

// 伪随机数生成器
export function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// 颜色工具
export function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

export function rgbStr(r, g, b, a) {
  r = Math.max(0, Math.min(255, Math.round(r)));
  g = Math.max(0, Math.min(255, Math.round(g)));
  b = Math.max(0, Math.min(255, Math.round(b)));
  if (a !== undefined) return `rgba(${r},${g},${b},${a})`;
  return `rgb(${r},${g},${b})`;
}

function parseColorStr(str) {
  const m = str.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (m) return { r: +m[1], g: +m[2], b: +m[3] };
  const m2 = str.match(/rgba\((\d+),\s*(\d+),\s*(\d+)/);
  if (m2) return { r: +m2[1], g: +m2[2], b: +m2[3] };
  return hexToRgb(str);
}

export function adjustColor(colorStr, factor) {
  const c = parseColorStr(colorStr);
  return rgbStr(c.r * factor, c.g * factor, c.b * factor);
}
