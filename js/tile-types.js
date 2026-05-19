// === CO2STER - Tile Type Definitions (Data Only) ===
// 美术资产和数值配置集中在此文件，方便后续更新

export const TILE_TYPES = {
  grassland: {
    name: '幼林',
    topColor: '#7aad42', sideColor1: '#5e9435', sideColor2: '#4d7f2a',
    isArtificial: false,
    transitions: [
      { target: 'empty', cost: 0, reward: 5, label: '砍伐' },
      { target: 'lumber_mill', cost: 10, reward: 0, label: '修建伐木场', reqLevel: 1 }
    ],
    co2Change: 0,
    resourceChange: 0,
    powerChange: 0,
    sciPointsChange: 0,
    growsInto: 'forest',
    growTime: 2
  },
  forest: {
    name: '林地',
    topColor: '#43a047', sideColor1: '#338a38', sideColor2: '#1e7025',
    isArtificial: false,
    transitions: [
      { target: 'empty', cost: 0, reward: 10, label: '砍伐' },
      { target: 'lumber_mill', cost: 10, reward: 0, label: '修建伐木场', reqLevel: 1 },
      { target: 'eco_forest', cost: 20, reward: 0, label: '生态加固', reqResearch: 'eco_forest', ecoGrowTime: 3 }
    ],
    co2Change: -1,
    resourceChange: 0,
    powerChange: 0,
    sciPointsChange: 0
  },
  rock_field: {
    name: '石场',
    topColor: '#a8a89e', sideColor1: '#929288', sideColor2: '#7c7c72',
    isArtificial: false,
    transitions: [{ target: 'quarry', cost: 20, reward: 0, label: '修建采石场', reqLevel: 1 }],
    co2Change: 0,
    resourceChange: 0,
    powerChange: 0,
    sciPointsChange: 0
  },
  quarry: {
    name: '采石场',
    topColor: '#95856a', sideColor1: '#827558', sideColor2: '#706548',
    isArtificial: true,
    transitions: [
      { target: 'rock_field', cost: 0, reward: 0, label: '拆除', isIndustrial: true },
      { target: 'quarry', cost: 20, reward: 0, label: '升级采石场', reqPower: 8 }
    ],
    co2Change: 2,
    resourceChange: 10,
    powerChange: 0,
    sciPointsChange: 0
  },
  lumber_mill: {
    name: '伐木场',
    topColor: '#6d4c3f', sideColor1: '#5a3d30', sideColor2: '#482e25',
    isArtificial: true,
    transitions: [
      { target: 'empty', cost: 0, reward: 0, label: '拆除', isIndustrial: true },
      { target: 'lumber_mill', cost: 15, reward: 0, label: '升级伐木场', reqPower: 6 }
    ],
    co2Change: 0,
    resourceChange: 5,
    powerChange: 0,
    sciPointsChange: 0
  },
  empty: {
    name: '空地',
    topColor: '#9a7e45', sideColor1: '#856d38', sideColor2: '#6b582a',
    isArtificial: true,
    transitions: [
      { target: 'grassland', cost: 0, reward: 0, label: '植树' },
      { target: 'settlement', cost: 20, reward: 0, label: '建造聚落' },
      { target: 'power_plant', cost: 50, reward: 0, label: '修建火电厂', reqLevel: 1 },
      { target: 'research_lab', cost: 60, reward: 0, label: '建造研究所', reqLevel: 2 },
      { target: 'wind_turbine', cost: 20, reward: 0, label: '建造风力发电机', reqResearch: 'wind_power', reqSciPoints: 1 },
      { target: 'solar_panel', cost: 30, reward: 0, label: '建造太阳能板', reqResearch: 'solar_power', reqSciPoints: 2 }
    ],
    co2Change: 0,
    resourceChange: 0,
    powerChange: 0,
    sciPointsChange: 0
  },
  settlement: {
    name: '聚落',
    topColor: '#607d8b', sideColor1: '#4e6a78', sideColor2: '#3e5a68',
    isArtificial: true,
    transitions: [],
    co2Change: 3,
    resourceChange: -5,
    powerChange: 0,
    sciPointsChange: 0
  },
  power_plant: {
    name: '火电厂',
    topColor: '#555568', sideColor1: '#444458', sideColor2: '#333348',
    isArtificial: true,
    transitions: [{ target: 'empty', cost: 0, reward: 0, label: '拆除', isIndustrial: true }],
    co2Change: 12,
    resourceChange: -15,
    powerChange: 8,
    sciPointsChange: 0
  },
  research_lab: {
    name: '研究所',
    topColor: '#4565a0', sideColor1: '#355590', sideColor2: '#254580',
    isArtificial: true,
    transitions: [
      { target: 'research_lab', cost: 0, reward: 0, label: '研发风力发电', reqSciPoints: 4, unlockResearch: 'wind_power' },
      { target: 'research_lab', cost: 0, reward: 0, label: '研发太阳能发电', reqSciPoints: 12, unlockResearch: 'solar_power' },
      { target: 'research_lab', cost: 0, reward: 0, label: '研发生态林地', reqSciPoints: 8, unlockResearch: 'eco_forest' }
    ],
    co2Change: 0,
    resourceChange: 0,
    powerChange: -8,
    sciPointsChange: 3
  },
  wind_turbine: {
    name: '风力发电机',
    topColor: '#dce6f0', sideColor1: '#bcc8d5', sideColor2: '#9caab8',
    isArtificial: true,
    transitions: [{ target: 'empty', cost: 0, reward: 0, label: '拆除', isIndustrial: true }],
    co2Change: 0,
    resourceChange: 0,
    powerChange: 4,
    sciPointsChange: 0,
    edgeOnly: true
  },
  solar_panel: {
    name: '太阳能板',
    topColor: '#2530a0', sideColor1: '#1c2580', sideColor2: '#121a60',
    isArtificial: true,
    transitions: [{ target: 'empty', cost: 0, reward: 0, label: '拆除', isIndustrial: true }],
    co2Change: 0,
    resourceChange: 0,
    powerChange: 8,
    sciPointsChange: 0
  },
  eco_forest: {
    name: '生态林地',
    topColor: '#0d5a18', sideColor1: '#084812', sideColor2: '#04360c',
    isArtificial: false,
    transitions: [],
    co2Change: -2,
    resourceChange: 0,
    powerChange: 0,
    sciPointsChange: 0,
    ecoDefense: true
  },
  eco_forest_growing: {
    name: '生态林地(建设中)',
    topColor: '#1a7a28', sideColor1: '#0d5a18', sideColor2: '#084812',
    isArtificial: false,
    transitions: [],
    co2Change: -1,
    resourceChange: 0,
    powerChange: 0,
    sciPointsChange: 0
  }
};

// === 科技树数据 ===
export const TECH_TREE = [
  {
    level: 0,
    name: '原始时代',
    unlocks: [
      { action: '砍伐', from: '林地', to: '空地', cost: 0, reward: 10 },
      { action: '建造聚落', from: '空地', to: '聚落', cost: 30, reward: 0 }
    ]
  },
  {
    level: 1,
    name: '农耕时代',
    unlocks: [
      { action: '植树', from: '空地', to: '幼林', cost: 0, reward: 0 },
      { action: '修建采石场', from: '石场', to: '采石场', cost: 20, reward: 0 },
      { action: '修建伐木场', from: '林地', to: '伐木场', cost: 20, reward: 0 },
      { action: '修建火电厂', from: '空地', to: '火电厂', cost: 50, reward: 0 }
    ]
  },
  {
    level: 2,
    name: '工业时代',
    requires: { settlements: 3 },
    unlocks: [
      { action: '升级采石场', from: '采石场', to: '采石场(升级)', cost: 30, reward: 0, note: '消耗8电力+30资源' },
      { action: '升级伐木场', from: '伐木场', to: '伐木场(升级)', cost: 25, reward: 0, note: '消耗8电力+25资源' },
      { action: '建造研究所', from: '空地', to: '研究所', cost: 60, reward: 0, note: '8电力→3科技点' }
    ]
  },
  {
    level: 3,
    name: '科技时代',
    requires: { settlements: 5 },
    unlocks: []
  }
];

// === 研究项目 ===
export const RESEARCH_PROJECTS = [
  { id: 'wind_power', name: '风力发电', cost: 5, desc: '在地图边缘建造风力发电机', detail: '不消耗资源，少量发电', icon: '🌬' },
  { id: 'solar_power', name: '太阳能发电', cost: 12, desc: '建造高效太阳能板', detail: '不消耗资源，大量发电', icon: '☀' },
  { id: 'eco_forest', name: '生态林地建设', cost: 8, desc: '在林地上建设生态林地', detail: 'CO2吸收+2，不可砍伐，需3回合长成', icon: '🌿' }
];
