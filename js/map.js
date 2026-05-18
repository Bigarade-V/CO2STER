// === CO2STER - Map Logic (Coordinates, Neighbors, Hit Detection) ===

import { HEX_R, HEX_W, V_SPACING, ROWS, COLS, PERSPECTIVE, seededRandom } from './config.js';
import { TILE_TYPES } from './tile-types.js';
import { gameState, industrialResidue } from './state.js';

// === 地块数据 ===
export const tiles = [];

export function initTiles() {
  for (let r = 0; r < ROWS; r++) {
    tiles[r] = [];
    for (let c = 0; c < COLS; c++) {
      tiles[r][c] = { type: 'forest', seed: r * 100 + c + 42 };
    }
  }
  // 初始空地
  tiles[5][2] = { type: 'empty', seed: 502 + 42 };
  // 石场
  tiles[0][2] = { type: 'rock_field', seed: 2 + 42 };
  tiles[0][3] = { type: 'rock_field', seed: 3 + 42 };
  tiles[1][2] = { type: 'rock_field', seed: 102 + 42 };
  tiles[1][3] = { type: 'rock_field', seed: 103 + 42 };
  tiles[2][2] = { type: 'rock_field', seed: 202 + 42 };
  tiles[3][1] = { type: 'rock_field', seed: 301 + 42 };
  tiles[4][1] = { type: 'rock_field', seed: 401 + 42 };
  tiles[5][1] = { type: 'rock_field', seed: 501 + 42 };
}

// === 坐标计算 ===
let canvasWidth = 0;
let canvasHeight = 0;

export function setCanvasSize(w, h) {
  canvasWidth = w;
  canvasHeight = h;
}

export function getTileCenter(r, c) {
  const offsetX = (canvasWidth - COLS * HEX_W) / 2;
  const offsetY = (canvasHeight - (ROWS - 1) * V_SPACING * PERSPECTIVE) / 2 - 20;
  return {
    x: offsetX + c * HEX_W + (r % 2 === 1 ? HEX_W / 2 : 0) + HEX_W / 2,
    y: offsetY + r * V_SPACING * PERSPECTIVE + HEX_R * PERSPECTIVE
  };
}

// === 六边形顶点 ===
export function hexCorners(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 180 * (60 * i - 30);
    pts.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) * PERSPECTIVE });
  }
  return pts;
}

// === 点击检测 ===
export function pointInHex(px, py, corners) {
  let inside = false;
  for (let i = 0, j = corners.length - 1; i < corners.length; j = i++) {
    const xi = corners[i].x, yi = corners[i].y;
    const xj = corners[j].x, yj = corners[j].y;
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

export function hitTestTile(mx, my) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const { x, y } = getTileCenter(r, c);
      const corners = hexCorners(x, y, HEX_R);
      if (pointInHex(mx, my, corners)) return { row: r, col: c };
    }
  }
  return null;
}

// === 邻居格子 ===
export function getNeighbors(r, c) {
  const dirs = [
    [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]],
    [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]]
  ];
  const parity = r & 1;
  const result = [];
  for (const [dr, dc] of dirs[parity]) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) result.push({ row: nr, col: nc });
  }
  return result;
}

export function hasAdjacentArtificial(r, c) {
  return getNeighbors(r, c).some(n => TILE_TYPES[tiles[n.row][n.col].type].isArtificial);
}

export function hasAdjacentType(r, c, type) {
  return getNeighbors(r, c).some(n => tiles[n.row][n.col].type === type);
}

export function hasAdjacentSettlementOrQuarry(r, c) {
  return getNeighbors(r, c).some(n => {
    const t = tiles[n.row][n.col].type;
    return t === 'settlement' || t === 'quarry' || t === 'lumber_mill';
  });
}

export function countBuildings() {
  let count = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = tiles[r][c].type;
      if (TILE_TYPES[t].isArtificial && t !== 'empty') count++;
    }
  }
  return count;
}

export function countSettlements() {
  let count = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (tiles[r][c].type === 'settlement') count++;
    }
  }
  return count;
}

// === 地块有效属性（考虑升级等级） ===
export function getTileEffectiveStats(r, c) {
  const tile = tiles[r][c];
  const tt = TILE_TYPES[tile.type];
  let resourceChange = tt.resourceChange;
  let co2Change = tt.co2Change;
  let powerChange = tt.powerChange || 0;
  let sciPointsChange = tt.sciPointsChange || 0;

  if (tile.type === 'quarry' && tile.quarryLevel) {
    const level = tile.quarryLevel;
    resourceChange = 10 + (level - 1) * 8;
    co2Change = 2;
  }
  if (tile.type === 'lumber_mill' && tile.lumberLevel) {
    const level = tile.lumberLevel;
    resourceChange = 5 + (level - 1) * 5;
  }
  if (tile.type === 'settlement') {
    const lvl = gameState.civilizationLevel;
    resourceChange = -5 - (lvl - 1) * 1;
    if (lvl >= 3) powerChange = -1;
  }

  return { resourceChange, co2Change, powerChange, sciPointsChange };
}

// === 效率计算 ===
export function getEfficiency() {
  let eff = 1.0;
  if (gameState.greenhouseEffect) eff *= 0.8;
  return eff;
}

export function getTurnResourceBalance() {
  const eff = getEfficiency();
  let production = 0, consumption = 0, power = 0, sciPoints = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const stats = getTileEffectiveStats(r, c);
      if (stats.resourceChange > 0) production += Math.floor(stats.resourceChange * eff);
      else if (stats.resourceChange < 0) consumption += stats.resourceChange;
      power += stats.powerChange;
      sciPoints += stats.sciPointsChange;
    }
  }
  return { production, consumption, power, sciPoints, net: production + consumption };
}

// === 文明升级条件 ===
export function countType(type) {
  let count = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (tiles[r][c].type === type) count++;
    }
  }
  return count;
}

export function checkLevel2Upgrade() {
  if (gameState.civilizationLevel < 1 || gameState.civilizationLevel >= 2) return false;
  if (countSettlements() < 3) return false;
  if (countType('power_plant') < 1) return false;
  // 净生产力达到30
  const balance = getTurnResourceBalance();
  return balance.net >= 30;
}

export function checkLevel3Upgrade() {
  if (gameState.civilizationLevel < 2 || gameState.civilizationLevel >= 3) return false;
  if (countSettlements() < 5) return false;
  if (countType('power_plant') < 2) return false;
  if (countType('research_lab') < 1) return false;
  // 净生产力达到40
  const balance = getTurnResourceBalance();
  return balance.net >= 40;
}
