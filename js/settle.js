// === CO2STER - Settlement (Turn) System ===

import { ROWS, COLS, HEX_R, PERSPECTIVE, SETTLE_PHASE_DURATION, CO2_DEATH_THRESHOLD, CO2_GREENHOUSE_THRESHOLD, HEAT_ISLAND_MIN_BUILDINGS } from './config.js';
import { TILE_TYPES } from './tile-types.js';
import { gameState, industrialResidue, uiState, settlementAnims, settleData, setSettleData, co2AnimParticles, beastState, triggerPrologue, triggerEnding } from './state.js';
import { tiles, getTileCenter, getTileEffectiveStats, getEfficiency, getTurnResourceBalance, countBuildings, checkLevel2Upgrade, checkLevel3Upgrade } from './map.js';
import { playResourceGainSound, playGrowthSound, playLevelUpMusic, playVictoryMusic, playGameOverMusic } from './audio.js';

// === 浮动文字动画 ===
export function addSettlementAnim(x, y, text, color, delay) {
  settlementAnims.push({ x, y, text, color, alpha: 1.0, vy: -1.2, delay });
}

export function updateSettlementAnims() {
  for (let i = settlementAnims.length - 1; i >= 0; i--) {
    const a = settlementAnims[i];
    if (a.delay > 0) { a.delay--; continue; }
    a.y += a.vy;
    a.alpha -= 0.012;
    if (a.alpha <= 0) settlementAnims.splice(i, 1);
  }
}

// === 回合结算 ===
export function endTurn(canvas) {
  if (gameState.gameOver || gameState.gameWon) return;
  uiState.isSettling = true;
  uiState.settlePhase = 0;
  uiState.settleTimer = 0;

  const data = { production: [], consumption: [], co2: [], power: [], sciPoints: [], growing: [], ecoGrowing: [] };
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = TILE_TYPES[tiles[r][c].type];
      const stats = getTileEffectiveStats(r, c);
      const center = getTileCenter(r, c);
      if (stats.resourceChange > 0) {
        data.production.push({ x: center.x, y: center.y - 10, value: stats.resourceChange, r, c });
      }
      if (stats.resourceChange < 0) {
        data.consumption.push({ x: center.x, y: center.y - 10, value: stats.resourceChange, r, c });
      }
      if (stats.co2Change > 0) {
        data.co2.push({ x: center.x, y: center.y - 10, value: stats.co2Change, r, c });
      }
      if (stats.powerChange !== 0) {
        data.power.push({ x: center.x, y: center.y - 10, value: stats.powerChange, r, c });
      }
      if (stats.sciPointsChange !== 0) {
        data.sciPoints.push({ x: center.x, y: center.y - 10, value: stats.sciPointsChange, r, c });
      }
      if (t.growsInto && tiles[r][c].type === 'grassland') {
        const growRemaining = tiles[r][c].growTime !== undefined ? tiles[r][c].growTime : (t.growTime || 1);
        data.growing.push({ r, c, target: t.growsInto, growTime: growRemaining, x: center.x, y: center.y - 10 });
      }
      if (tiles[r][c].type === 'eco_forest_growing') {
        data.ecoGrowing.push({ r, c, growTime: tiles[r][c].ecoGrowTime || 3, x: center.x, y: center.y - 10 });
      }
    }
  }
  setSettleData(data);
}

export function processSettlePhase(canvas) {
  try {
    _processSettlePhaseInner(canvas);
  } catch (e) {
    console.error('[Settle] processSettlePhase error:', e);
    // 安全恢复：确保游戏不会永远卡在结算状态
    uiState.isSettling = false;
    uiState.settlePhase = 0;
    uiState.settleTimer = 0;
    gameState.turn++;
    gameState.actionPoints = gameState.maxActionPoints;
  }
}

function _processSettlePhaseInner(canvas) {
  uiState.settleTimer++;

  if (uiState.settleTimer === 1) {
    const sd = uiState.settlePhase;

    if (sd === 0) {
      // 产出资源
      const eff = getEfficiency();
      let totalProd = 0;
      for (const item of settleData.production) {
        const actual = Math.floor(item.value * eff);
        addSettlementAnim(item.x, item.y, '+' + actual + ' 资源', '#4caf50', 0);
        totalProd += actual;
      }
      gameState.resources += totalProd;
      if (totalProd > 0) playResourceGainSound();

    } else if (sd === 1) {
      // 消耗资源
      let totalCons = 0;
      for (const item of settleData.consumption) {
        addSettlementAnim(item.x, item.y, item.value + ' 资源', '#e57373', 0);
        totalCons += item.value;
      }
      gameState.resources += totalCons;
      gameState.resources = Math.max(0, gameState.resources);

    } else if (sd === 2) {
      // 产出/消耗电力
      let totalPower = 0;
      for (const item of settleData.power) {
        addSettlementAnim(item.x, item.y, (item.value >= 0 ? '+' : '') + item.value + ' 电力', item.value >= 0 ? '#ffeb3b' : '#e57373', 0);
        totalPower += item.value;
      }
      gameState.power += totalPower;
      gameState.power = Math.max(0, gameState.power);

    } else if (sd === 3) {
      // 产出科技点（研究所自动消耗电力产出科技点）
      let totalSci = 0;
      // 检查电力是否足够支撑研究所运作
      const netPower = gameState.power + settleData.power.reduce((s, item) => s + item.value, 0);
      if (netPower >= 0) {
        for (const item of settleData.sciPoints) {
          addSettlementAnim(item.x, item.y, '+' + item.value + ' 科技点', '#ce93d8', 0);
          totalSci += item.value;
        }
        gameState.sciPoints += totalSci;
      } else if (settleData.sciPoints.length > 0) {
        addSettlementAnim(canvas.width / 2, canvas.height / 2, '电力不足，研究所停工', '#e57373', 5);
      }

    } else if (sd === 4) {
      // CO2排放
      let totalEmit = 0;
      for (const item of settleData.co2) {
        addSettlementAnim(item.x, item.y, '+' + item.value + ' CO2', '#ff9800', 0);
        totalEmit += item.value;
        // 产出CO2气态粒子：从地块飘向地图上方
        const particleCount = Math.min(item.value * 3, 15);
        for (let i = 0; i < particleCount; i++) {
          co2AnimParticles.push({
            x: item.x + (Math.random() - 0.5) * 30,
            y: item.y + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 0.5,
            vy: -(1.5 + Math.random() * 2),
            size: 6 + Math.random() * 8,
            alpha: 0.8 + Math.random() * 0.2,
            progress: 0,
            speed: 0.005 + Math.random() * 0.008,
            wobble: Math.random() * Math.PI * 2,
            type: 'emit'
          });
        }
      }
      gameState.co2 += totalEmit;

      // 触发碳兽进食动画
      if (totalEmit > 0 && gameState.co2 >= 20) {
        beastState.feeding = true;
        beastState.feedIntensity = Math.min(totalEmit / 10, 1);
        beastState.feedTimer = beastState.feedDuration;
      }

      // 热岛效应
      const buildingCount = countBuildings();
      if (buildingCount >= HEAT_ISLAND_MIN_BUILDINGS) {
        const heatCO2 = Math.floor(buildingCount / 3);
        gameState.co2 += heatCO2;
      }

      // 工业残留
      if (industrialResidue.length > 0) {
        let totalResidue = 0;
        for (let i = industrialResidue.length - 1; i >= 0; i--) {
          const res = industrialResidue[i];
          totalResidue += res.co2;
          res.turnsLeft--;
          if (res.turnsLeft <= 0) industrialResidue.splice(i, 1);
        }
        if (totalResidue > 0) {
          gameState.co2 += totalResidue;
        }
      }

    } else if (sd === 5) {
      // CO2吸收
      let totalAbsorb = 0;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const stats = getTileEffectiveStats(r, c);
          if (stats.co2Change < 0) totalAbsorb += stats.co2Change;
        }
      }

      if (totalAbsorb < 0) {
        const actualAbsorb = Math.min(gameState.co2, Math.abs(totalAbsorb));
        gameState.co2 = Math.max(0, gameState.co2 - actualAbsorb);
        addSettlementAnim(canvas.width / 2, canvas.height / 2 - 40, '-' + actualAbsorb + ' CO2', '#4caf50', 0);

        // 吸收CO2：在林类地块处生成绿色闪烁特效
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            const stats = getTileEffectiveStats(r, c);
            if (stats.co2Change < 0) {
              const center = getTileCenter(r, c);
              const absorbValue = Math.abs(stats.co2Change);
              // 绿色闪烁粒子：从地块中心向四周扩散
              const particleCount = absorbValue * 4;
              for (let i = 0; i < particleCount; i++) {
                co2AnimParticles.push({
                  x: center.x + (Math.random() - 0.5) * 20,
                  y: center.y + (Math.random() - 0.5) * 10,
                  vx: (Math.random() - 0.5) * 1.2,
                  vy: (Math.random() - 0.5) * 0.8 - 0.3,
                  size: 4 + Math.random() * 5,
                  alpha: 0.9 + Math.random() * 0.1,
                  progress: 0,
                  speed: 0.008 + Math.random() * 0.008,
                  wobble: Math.random() * Math.PI * 2,
                  type: 'absorb'
                });
              }
            }
          }
        }
      }

      // 温室效应
      if (!gameState.greenhouseEffect && gameState.co2 >= CO2_GREENHOUSE_THRESHOLD) {
        gameState.greenhouseEffect = true;
        addSettlementAnim(canvas.width / 2, canvas.height / 2, '🔥 温室效应降临！效率降低至80%', '#ff6e40', 12);
      } else if (gameState.greenhouseEffect && gameState.co2 < CO2_GREENHOUSE_THRESHOLD) {
        gameState.greenhouseEffect = false;
        addSettlementAnim(canvas.width / 2, canvas.height / 2, '🌿 温室效应消退！效率恢复正常', '#66bb6a', 12);
      }

      // CO2死亡
      if (gameState.co2 >= CO2_DEATH_THRESHOLD && !gameState.gameOver) {
        gameState.gameOver = true;
        triggerEnding('bad');
        addSettlementAnim(canvas.width / 2, canvas.height / 2, '💀 CO2浓度过高，文明毁灭！', '#ff1744', 15);
        playGameOverMusic();
      }

    } else if (sd === 6) {
      // 幼林成长 + 生态林地成长
      let growCount = 0;
      let anyGrown = false;
      for (const item of settleData.growing) {
        const tile = tiles[item.r][item.c];
        if (tile.growTime === undefined) tile.growTime = item.growTime;
        if (tile.growTime <= 1) {
          tile.type = item.target;
          delete tile.growTime;
          addSettlementAnim(item.x, item.y, '成长为林地', '#66bb6a', 0);
          if (window.__updateTile3D) window.__updateTile3D(item.r, item.c);
          growCount++;
          anyGrown = true;
        } else {
          tile.growTime--;
          addSettlementAnim(item.x, item.y, '成长中 ' + tile.growTime + '回合', '#8bc34a', 0);
        }
      }

      let ecoGrown = 0;
      for (const item of settleData.ecoGrowing) {
        const tile = tiles[item.r][item.c];
        if (tile.type !== 'eco_forest_growing') continue;
        if (tile.ecoGrowTime === undefined || tile.ecoGrowTime <= 1) {
          tile.type = 'eco_forest';
          delete tile.ecoGrowTime;
          addSettlementAnim(item.x, item.y, '生态林地长成！', '#1b5e20', 0);
          if (window.__updateTile3D) window.__updateTile3D(item.r, item.c);
          ecoGrown++;
          anyGrown = true;
        } else {
          tile.ecoGrowTime--;
          addSettlementAnim(item.x, item.y, '生态建设 ' + tile.ecoGrowTime + '回合', '#4caf50', 0);
        }
      }
      if (anyGrown) playGrowthSound();
    }
  }

  if (uiState.settleTimer >= SETTLE_PHASE_DURATION) {
    uiState.settleTimer = 0;
    uiState.settlePhase++;
    if (uiState.settlePhase > 6) {
      // 胜利条件：净生产力≥50 + 净发电力≥15 + CO2=0
      if (!gameState.gameOver && gameState.civilizationLevel >= 3 && gameState.co2 === 0) {
        const balance = getTurnResourceBalance();
        if (balance.net >= 50 && balance.power >= 15 && countSettlements() >= 7) {
          gameState.gameWon = true;
          triggerEnding('good');
          playVictoryMusic();
        }
      }
      uiState.isSettling = false;
      gameState.turn++;
      gameState.actionPoints = gameState.maxActionPoints;
      uiState.selectedTile = null;
      uiState.actionPanel = null;

      if (checkLevel2Upgrade()) {
        gameState.civilizationLevel = 2;
        triggerPrologue(2);
        addSettlementAnim(canvas.width / 2, canvas.height / 2, '⬆ 文明等级提升至 Lv.2', '#ffeb3b', 8);
        playLevelUpMusic();
      }
      if (checkLevel3Upgrade()) {
        gameState.civilizationLevel = 3;
        triggerPrologue(3);
        addSettlementAnim(canvas.width / 2, canvas.height / 2, '⬆ 文明等级提升至 Lv.3', '#64b5f6', 8);
        playLevelUpMusic();
      }
    }
  }
}
