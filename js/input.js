// === CO2STER - Input Handling ===

import { ROWS, COLS } from './config.js';
import { TILE_TYPES } from './tile-types.js';
import { gameState, uiState, industrialResidue, triggerPrologue, triggerEnding, endingState } from './state.js';
import { tiles, hitTestTile, getTileCenter, hasAdjacentArtificial, hasAdjacentSettlementOrQuarry, countBuildings, countSettlements, getTurnResourceBalance, initTiles } from './map.js';
import { endTurn } from './settle.js';
import { playChopSound, playPlantSound, playBuildSound, playResearchSound, playErrorSound, playVictoryMusic } from './audio.js';

let canvas = null;

export function initInput(canvasEl) {
  canvas = canvasEl;
  canvasEl.addEventListener('click', handleClick);
  canvasEl.addEventListener('mousemove', handleMouseMove);
  canvasEl.addEventListener('contextmenu', function(e) { e.preventDefault(); });
}

function handleClick(e) {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  // 游戏结束时只处理重新开始按钮
  if (gameState.gameOver || gameState.gameWon) {
    // 结局动画中的重新开始按钮
    const eb = window._endingScreen_restartBtn;
    if (eb && mx >= eb.x && mx <= eb.x + eb.w && my >= eb.y && my <= eb.y + eb.h) {
      resetGame();
      return;
    }
    // 旧版界面的重新开始按钮
    const rb = window._drawGameOverScreen_restartBtn || window._drawGameWonScreen_restartBtn;
    if (rb && mx >= rb.x && mx <= rb.x + rb.w && my >= rb.y && my <= rb.y + rb.h) {
      resetGame();
    }
    return;
  }

  if (uiState.isSettling) return;
  if (gameState.gameOver || gameState.gameWon) return;

  // 胜利按钮点击
  if (gameState.victoryReady && !endingState.active) {
    const vb = window._victoryButton;
    if (vb && mx >= vb.x && mx <= vb.x + vb.w && my >= vb.y && my <= vb.y + vb.h) {
      gameState.victoryReady = false;
      gameState.gameWon = true;
      triggerEnding('good');
      playVictoryMusic();
      return;
    }
  }

  // 科技树面板关闭按钮
  if (uiState.showTechTree) {
    const cb = window._techTreeCloseBtn;
    if (cb && mx >= cb.x && mx <= cb.x + cb.w && my >= cb.y && my <= cb.y + cb.h) {
      uiState.showTechTree = false;
      return;
    }
    // 点击面板外关闭
    const panel = window._techTreePanel;
    if (panel && (mx < panel.x || mx > panel.x + panel.w || my < panel.y || my > panel.y + panel.h)) {
      uiState.showTechTree = false;
      return;
    }
    return; // 面板打开时不处理其他点击
  }

  // 科技树问号按钮
  const tb = window._techTreeBtn;
  if (tb) {
    const dx = mx - tb.x, dy = my - tb.y;
    if (dx * dx + dy * dy <= tb.r * tb.r) {
      uiState.showTechTree = true;
      return;
    }
  }

  // 操作面板按钮
  if (uiState.actionPanel) {
    let hitAction = false;
    for (const act of uiState.actionPanel.actions) {
      if (act._rect && mx >= act._rect.x && mx <= act._rect.x + act._rect.w &&
          my >= act._rect.y && my <= act._rect.y + act._rect.h) {
        hitAction = true;
        if (gameState.resources < act.cost && act.label !== '植树' && act.label !== '拆除') { playErrorSound(); return; }
        if (act.disabledReason) { playErrorSound(); return; }
        if (act.reqSciPoints && gameState.sciPoints < act.reqSciPoints) { playErrorSound(); return; }
        {
          const netCost = act.cost - (act.reward || 0);
          const isHarvest = act.reward > 0 && act.cost === 0;
          const isFreeAction = act.label === '植树' || act.label === '拆除';
          const netBalance = getTurnResourceBalance();
          const consumptionNeeded = (isHarvest || isFreeAction) ? 0 : Math.max(0, -netBalance.net);
          if (!isHarvest && !isFreeAction && gameState.resources - netCost < consumptionNeeded) { playErrorSound(); return; }
        }
        if (act.reqPower && gameState.power < act.reqPower) { playErrorSound(); return; }

        const tile = tiles[uiState.selectedTile.row][uiState.selectedTile.col];
        const prevType = tile.type;
        const prevTypeDef = TILE_TYPES[prevType];

        // 工业残留
        if (act.label === '拆除') {
          const transDef = prevTypeDef.transitions.find(t => t.label === '拆除');
          if (transDef && transDef.isIndustrial) {
            const residueCO2 = Math.ceil(Math.abs(prevTypeDef.co2Change || 0) * 0.5);
            if (residueCO2 > 0) {
              industrialResidue.push({ r: uiState.selectedTile.row, c: uiState.selectedTile.col, co2: residueCO2, turnsLeft: 2 });
              const { addSettlementAnim } = require_settlementAnim();
              addSettlementAnim(
                getTileCenter(uiState.selectedTile.row, uiState.selectedTile.col).x,
                getTileCenter(uiState.selectedTile.row, uiState.selectedTile.col).y - 10,
                '工业残留 ' + residueCO2 + ' CO2 x2回合', '#ff6e40', 5
              );
            }
          }
        }

        tile.type = act.target;
        gameState.resources -= act.cost;
        gameState.resources += act.reward;
        gameState.actionPoints--;

        if (act.reqPower) gameState.power -= act.reqPower;

        // === 音效播放 ===
        if (act.unlockResearch) {
          playResearchSound();
        } else if (act.label === '砍伐') {
          playChopSound();
        } else if (act.label === '植树') {
          playPlantSound();
        } else if (act.label === '拆除') {
          playBuildSound(); // 拆除也用锤打声，较轻
        } else if (act.target === 'eco_forest') {
          playPlantSound();
        } else if (act.isUpgrade || act.target === 'settlement' || act.target === 'quarry' ||
                   act.target === 'lumber_mill' || act.target === 'power_plant' ||
                   act.target === 'research_lab' || act.target === 'wind_turbine' ||
                   act.target === 'solar_panel') {
          playBuildSound();
        }

        // 研发操作：消耗科技点解锁研究项目
        if (act.unlockResearch) {
          gameState.sciPoints -= (act.reqSciPoints || 0);
          if (!gameState.unlockedResearches.includes(act.unlockResearch)) {
            gameState.unlockedResearches.push(act.unlockResearch);
          }
          const { addSettlementAnim } = require_settlementAnim();
          const researchName = act.label.replace('研发', '');
          addSettlementAnim(
            getTileCenter(uiState.selectedTile.row, uiState.selectedTile.col).x,
            getTileCenter(uiState.selectedTile.row, uiState.selectedTile.col).y - 10,
            '🔓 解锁: ' + researchName, '#ce93d8', 5
          );
        }

        // 采石场升级
        if (act.isUpgrade && prevType === 'quarry') {
          tile.quarryLevel = (tile.quarryLevel || 1) + 1;
          const { addSettlementAnim } = require_settlementAnim();
          addSettlementAnim(
            getTileCenter(uiState.selectedTile.row, uiState.selectedTile.col).x,
            getTileCenter(uiState.selectedTile.row, uiState.selectedTile.col).y - 10,
            '⬆ 采石场升级至Lv.' + tile.quarryLevel, '#f1c40f', 5
          );
        }
        // 伐木场升级
        if (act.isUpgrade && prevType === 'lumber_mill') {
          tile.lumberLevel = (tile.lumberLevel || 1) + 1;
          const { addSettlementAnim } = require_settlementAnim();
          addSettlementAnim(
            getTileCenter(uiState.selectedTile.row, uiState.selectedTile.col).x,
            getTileCenter(uiState.selectedTile.row, uiState.selectedTile.col).y - 10,
            '⬆ 伐木场升级至Lv.' + tile.lumberLevel, '#f1c40f', 5
          );
        }

        // 植树
        if (act.target === 'grassland') {
          tile.growTime = TILE_TYPES.grassland.growTime || 1;
        }

        // 生态加固：直接设为建设中状态，跳过eco_forest中间态
        if (act.target === 'eco_forest') {
          tile.type = 'eco_forest_growing';
          tile.ecoGrowTime = 3;
        }

        // 建立第一个聚落
        if (act.target === 'settlement' && prevType !== 'settlement' && gameState.civilizationLevel === 0) {
          gameState.civilizationLevel = 1;
          triggerPrologue(1);
        }

        uiState.actionPanel = null;
        uiState.selectedTile = null;
        if (gameState.actionPoints <= 0) endTurn(canvas);
        return;
      }
    }
    // 只有点击面板外部时才关闭面板（点击面板空白区域不关闭）
    if (!hitAction) {
      // 判断是否在面板区域内
      const ap = uiState.actionPanel;
      const visibleActions = ap.actions.filter(a => a._rect);
      if (visibleActions.length > 0) {
        // 计算面板边界
        const panelLeft = ap.x;
        const panelTop = ap.y;
        const panelRight = ap.x + 180; // pw = 180
        const panelBottom = ap.y + visibleActions.length * 40 + 16;
        if (mx < panelLeft || mx > panelRight || my < panelTop || my > panelBottom) {
          uiState.actionPanel = null;
          uiState.selectedTile = null;
        }
      }
    }
    return;
  }

  // 地块点击
  const hit = hitTestTile(mx, my);
  if (hit) {
    uiState.selectedTile = hit;
    const tile = tiles[hit.row][hit.col];
    const typeDef = TILE_TYPES[tile.type];
    const adjArt = hasAdjacentArtificial(hit.row, hit.col);
    const actions = typeDef.transitions
      .filter(t => {
        if (t.label === '拆除' && tile.type === 'settlement') return false;
        if (t.label === '升级采石场' && (tile.quarryLevel || 1) >= 2) return false;
        if (t.label === '升级伐木场' && (tile.lumberLevel || 1) >= 2) return false;
        // 隐藏未解锁的操作
        if (t.reqLevel && gameState.civilizationLevel < t.reqLevel) return false;
        // 建造需研究的设施：检查是否已解锁
        if (t.reqResearch && !gameState.unlockedResearches.includes(t.reqResearch)) return false;
        return true;
      })
      .map(t => {
        let label = t.label;
        if (t.label === '升级采石场') {
          const qLevel = tile.quarryLevel || 1;
          const nextLevel = qLevel + 1;
          label = '升级采石场 Lv.' + qLevel + '→' + nextLevel;
        }
        if (t.label === '升级伐木场') {
          const lLevel = tile.lumberLevel || 1;
          const nextLevel = lLevel + 1;
          label = '升级伐木场 Lv.' + lLevel + '→' + nextLevel;
        }

        let disabledReason = '';
        // 研发项目：需要足够科技点，且尚未解锁
        if (t.unlockResearch) {
          if (gameState.unlockedResearches.includes(t.unlockResearch)) {
            disabledReason = '已解锁';
          } else if (gameState.sciPoints < (t.reqSciPoints || 0)) {
            disabledReason = '科技点不足';
          }
        }
        if (t.label === '砍伐' && !adjArt) disabledReason = '需相邻聚落或建筑';
        if (t.target === 'lumber_mill' && !adjArt) disabledReason = '需相邻聚落或建筑';
        if (t.label === '升级采石场' && gameState.civilizationLevel < 2) disabledReason = '需文明Lv.2';
        if (t.label === '升级伐木场' && gameState.civilizationLevel < 2) disabledReason = '需文明Lv.2';
        if (t.target === 'wind_turbine' && hit.row !== 0 && hit.row !== ROWS - 1 && hit.col !== 0 && hit.col !== COLS - 1) {
          disabledReason = '仅在地图边缘';
        }
        if (t.label === '研发' && gameState.power < (t.reqPower || 0)) disabledReason = '电力不足';
        if (t.target !== 'settlement' && t.target !== 'empty' && TILE_TYPES[t.target] && TILE_TYPES[t.target].isArtificial && !adjArt) {
          disabledReason = '需相邻聚落或建筑';
        }
        if (t.target === 'settlement' && countSettlements() > 0 && !adjArt) {
          disabledReason = '需相邻聚落或建筑';
        }
        if (t.target === 'quarry' && !hasAdjacentSettlementOrQuarry(hit.row, hit.col)) {
          disabledReason = '需相邻聚落或采石场';
        }
        if (TILE_TYPES[t.target] && TILE_TYPES[t.target].isArtificial && t.target !== 'empty' && t.target !== tile.type) {
          const maxBuildings = countSettlements() * 4 + 1;
          const remaining = maxBuildings - countBuildings();
          if (t.target === 'settlement') {
            if (remaining <= 0) disabledReason = '建筑数已达上限，需更多聚落';
          } else {
            if (remaining <= 1) disabledReason = '建筑数已达上限，需更多聚落';
          }
        }

        return {
          target: t.target, cost: t.cost, reward: t.reward, label,
          reqLevel: t.reqLevel || 0,
          reqPower: t.reqPower || 0,
          sciReward: t.sciReward || 0,
          reqSciPoints: t.reqSciPoints || 0,
          unlockResearch: t.unlockResearch || null,
          isUpgrade: t.label === '升级采石场' || t.label === '升级伐木场',
          disabledReason,
          _hovered: false, _rect: null
        };
      });

    const center = getTileCenter(hit.row, hit.col);
    uiState.actionPanel = {
      x: center.x + 30,
      y: center.y - actions.length * 20,
      actions
    };
  }
}

function handleMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  uiState.mouseX = e.clientX - rect.left;
  uiState.mouseY = e.clientY - rect.top;

  if (uiState.actionPanel) {
    for (const act of uiState.actionPanel.actions) {
      if (act._rect) {
        act._hovered = uiState.mouseX >= act._rect.x && uiState.mouseX <= act._rect.x + act._rect.w &&
                       uiState.mouseY >= act._rect.y && uiState.mouseY <= act._rect.y + act._rect.h;
      }
    }
  }
}

// === 重置游戏 ===
function resetGame() {
  gameState.resources = 0;
  gameState.co2 = 0;
  gameState.displayCo2 = 0;
  gameState.power = 0;
  gameState.sciPoints = 0;
  gameState.turn = 1;
  gameState.actionPoints = 5;
  gameState.maxActionPoints = 5;
  gameState.civilizationLevel = 0;
  gameState.greenhouseEffect = false;
  gameState.gameOver = false;
  gameState.gameWon = false;
  gameState.victoryReady = false;
  gameState.unlockedResearches = [];
  uiState.selectedTile = null;
  uiState.actionPanel = null;
  uiState.isSettling = false;
  uiState.settlePhase = 0;
  uiState.settleTimer = 0;

  TILE_TYPES.grassland.growTime = 2;
  industrialResidue.length = 0;

  // 重置结局动画
  endingState.active = false;
  endingState.type = '';
  endingState.phase = '';
  endingState.timer = 0;
  endingState.explodeParticles.length = 0;
  endingState.shrinkTimer = 0;
  endingState.shrinkDone = false;
  window._endingScreen_restartBtn = null;

  initTiles();
}

// 延迟引用解决循环依赖
function require_settlementAnim() {
  return { addSettlementAnim: window.__addSettlementAnim };
}
