/* =========== 路线节点（v3 干净版）===========
 * 设计原则：
 * 1. 每段路所有标志建筑（打卡 + 仅路过）按真实地理顺序在 midBuildings 里排列
 * 2. 每个建筑都会真正从右滚到画面中央再滚出，间隔 4.5 秒
 * 3. checkpoints 数组里的建筑会触发打卡（按 midBuildings 顺序对应）
 * 4. 最后一个建筑滚出画面后再 +4 秒缓冲（看普通街景）才停车选路口
 */
const ROUTE = [
  {
    name: '腾讯北京总部', marker: '🏢',
    obstacle: '🚗 出发！系好安全带~',
    midBuildings: ['tencent'],
    checkpoints: [
      { id: 'tencent', name: '腾讯北京总部', emoji: '💜' }
    ],
    weather: 'sunny',
    question: '准备出发，从西北旺东路往哪走？',
    options: [
      { dir: 'S', label: '南下接五环', correct: true, angle: 180 },
      { dir: 'E', label: '直接东行',   correct: false, angle: 90 },
      { dir: 'N', label: '掉头北上',   correct: false, angle: 0 }
    ]
  },
  {
    name: '上五环路口', marker: '🛣️',
    obstacle: '🚧 前方拥堵 8 分钟',
    midBuildings: ['bsu'],
    checkpoints: [
      { id: 'bsu', name: '北京体育大学', emoji: '⚽' }
    ],
    weather: 'sunny',
    question: '已上五环，下一步？',
    options: [
      { dir: 'E', label: '东行沿北五环', correct: true, angle: 90 },
      { dir: 'S', label: '南下西四环',   correct: false, angle: 180 }
    ]
  },
  {
    name: '北五环·肖家河', marker: '🚦',
    obstacle: '🚦 红灯 30 秒',
    // 先打卡清华，再开过圆明园（仅路过）
    midBuildings: ['qinghua', 'yuanmingyuan'],
    checkpoints: [
      { id: 'qinghua', name: '清华大学', emoji: '🎓' }
    ],
    weather: 'sunny',
    question: '继续沿北五环？',
    options: [
      { dir: 'E', label: '继续东行',    correct: true, angle: 90 },
      { dir: 'S', label: '南下进市区',  correct: false, angle: 180 },
      { dir: 'N', label: '北上上清',    correct: false, angle: 0 }
    ]
  },
  {
    name: '北五环 / S50 路口', marker: '🛤️',
    obstacle: '🚧 修路绕行',
    // 路过清河大桥（S50 上跨清河的关键节点）
    midBuildings: ['qinghe_bridge'],
    checkpoints: [],
    weather: 'cloudy',
    question: '关键路口！怎么转？',
    options: [
      { dir: 'E', label: '继续东沿 S50', correct: true, angle: 90 },
      { dir: 'N', label: '北上 G7',      correct: false, angle: 0 },
      { dir: 'S', label: '南下学清路',   correct: false, angle: 180 }
    ]
  },
  {
    name: 'S50 清河中街', marker: '🌧️',
    obstacle: '🌧️ 小雨打滑减速',
    midBuildings: ['birds_nest', 'water_cube'],
    checkpoints: [
      { id: 'birds_nest', name: '国家体育场鸟巢', emoji: '🏟️' },
      { id: 'water_cube', name: '国家游泳中心水立方', emoji: '💧' }
    ],
    weather: 'rain',
    question: '快到了，下匝道往哪？',
    options: [
      { dir: 'S', label: '南下下匝道',   correct: true, angle: 180 },
      { dir: 'E', label: '继续 S50 东',  correct: false, angle: 90 }
    ]
  },
  {
    name: '🎯 亚洲金融大厦', marker: '🎉',
    obstacle: '🌈 雨过天晴 · 终点在望！',
    // 清河公园 → 国家会议中心 → 亚金大厦（终点停在画面中央）
    midBuildings: ['qinghe_park', 'conv_center', 'asia_finance'],
    checkpoints: [],
    finalLandmark: true,
    rainCleared: true,  // 上一段是雨天，本段开始时雨过天晴 + 彩虹
    weather: 'sunny',
    question: '终点亚金大厦就在前面，最后一脚怎么走？',
    options: [
      { dir: 'E', label: '东行驶入亚金', correct: true, angle: 90 },
      { dir: 'S', label: '南下中关村',   correct: false, angle: 180 },
      { dir: 'W', label: '西行上清路',   correct: false, angle: 270 }
    ]
  },
  {
    name: '亚洲金融大厦', marker: '🎉',
    obstacle: '🎉 抵达终点！',
    midBuildings: [],
    checkpoints: [],
    weather: 'sunny',
    question: null, options: []
  }
];

/* ===== 时序计算 =====
 * 滚动周期 12s（mid 层）。让所有建筑都能完整滚过屏幕：
 * 第 i 个建筑 anim 到达 = 2500 + i * 4500ms（间隔 4.5s 给两建筑充分留白）
 * 建筑 anim=2500 → lmX=653 → 滚出 anim=7.8s
 * 建筑 anim=7000 → lmX=1028 → 但 SVG 总宽 2000，屏幕中心走到 1500 时已滚过去了
 *   → 7000ms 时 SVG 走 583px，但需要先把建筑滚到屏幕中央。
 *   实际：建筑放 lmX=targetX(7000)=1028，滚到中央时 anim=7s，滚出 anim=12.3s（>周期）
 *   会造成第二建筑离开后第一建筑回来。要保证安全：anim 时间不超过 12s。
 *   把第二建筑 lmX 限制不超过 1000：anim 限制在 12*(1000-500+55)/1000 = 6.66s
 * 重新设定：FIRST=2500, SPACING=4000，第二建筑 anim=6500，lmX=991, 滚出 anim≈11.9s ✅
 */
/* ===== 时序计算（与 mid 层 width:300% + scrollMid 周期 12s 配套） =====
 * scrollMid keyframe 0→-66.67%（width:300% 时移动 2000px = 2 屏宽）
 * 屏幕中央 SVG x = 500 + (t/12000) × 2000
 * 建筑要从屏外右滚入：FIRST_ARRIVAL > 3000ms
 * 第二建筑 arrival=7000 时 lmX=1612，滚出 t≈10.3s < 12s 周期 ✓
 */
const PAUSE_PER_CHECKIN = 1700;
const SPACING_MS = 3500;
const FIRST_ARRIVAL_MS = 3500;
const SCROLL_PERIOD_MS_CONST = 12000;
const SCROLL_DELTA_PX = 2000;

function arrivalAnimTimes(node) {
  const list = (node && node.midBuildings) ? node.midBuildings : [];
  return list.map((_, i) => FIRST_ARRIVAL_MS + i * SPACING_MS);
}
function arrivalRealTimes(node) {
  const list = (node && node.midBuildings) ? node.midBuildings : [];
  let pauseAccum = 0;
  return list.map((bid, i) => {
    const animT = FIRST_ARRIVAL_MS + i * SPACING_MS;
    const realT = animT + pauseAccum;
    if (checkpointForBuilding(node, bid)) pauseAccum += PAUSE_PER_CHECKIN;
    return realT;
  });
}
function checkpointForBuilding(node, buildingId) {
  return ((node && node.checkpoints) || []).find(c => c.id === buildingId);
}
// 建筑到达中央 anim t → SVG lmX → 完全滚出屏左 anim t
function exitAnimTime(animArrival) {
  const lmX = 500 + (animArrival / SCROLL_PERIOD_MS_CONST) * SCROLL_DELTA_PX - 55;
  // 建筑 lmX 滚出屏左 = 屏左 (scroll_pos) ≥ lmX + 110(建筑宽)
  // scroll_pos(t) = (t/9000) × 1500
  // (t/9000) × 1500 = lmX + 110
  return ((lmX + 110) * SCROLL_PERIOD_MS_CONST) / SCROLL_DELTA_PX;
}

function stageDuration(node) {
  const list = (node && node.midBuildings) || [];
  if (list.length === 0) return 4500;
  const animArrivals = arrivalAnimTimes(node);
  const lastAnimArrival = animArrivals[animArrivals.length - 1];
  const checkinCount = list.filter(b => checkpointForBuilding(node, b)).length;
  const totalPause = checkinCount * PAUSE_PER_CHECKIN;
  if (node && node.finalLandmark) {
    return lastAnimArrival + totalPause + 800;
  }
  const lastExitAnim = exitAnimTime(lastAnimArrival);
  return lastExitAnim + totalPause + 500;
}

let stageIdx = 0, distance = 0, speed = 0, isDriving = false;
let landmarkTimer = null;

/* =========== 小T 开车（HTML：SVG车身 + IMG头像） =========== */
function svgHeroCar(driving = true) {
  return `
    <div class="hero-car-wrap">
      <svg class="hero-car-svg" viewBox="0 0 220 130">
        <ellipse cx="110" cy="125" rx="90" ry="4" fill="#001858" opacity=".25"/>
        <!-- 车身 -->
        <rect x="20" y="60" width="180" height="45" rx="12" fill="#f582ae" stroke="#001858" stroke-width="3"/>
        <!-- 车顶 -->
        <path d="M 55 60 Q 110 28 165 60 Z" fill="#a78bfa" stroke="#001858" stroke-width="3"/>
        <!-- 车窗（更宽更高，能装下圆头像） -->
        <path d="M 65 60 Q 110 32 155 60 Z" fill="#aac5ff" stroke="#001858" stroke-width="2"/>

        <!-- 方向盘 -->
        <circle cx="135" cy="68" r="6" fill="none" stroke="#001858" stroke-width="2"/>
        <circle cx="135" cy="68" r="2" fill="#001858"/>

        <!-- 大灯 -->
        <ellipse cx="198" cy="78" rx="6" ry="4" fill="#ffd166" stroke="#001858" stroke-width="2"/>
        ${driving ? `<path d="M 200 78 L 218 70 L 218 86 Z" fill="#ffd166" opacity=".5"/>` : ''}
        <ellipse cx="22" cy="78" rx="4" ry="3" fill="#d63d4f" stroke="#001858" stroke-width="1.5"/>
        <line x1="30" y1="85" x2="190" y2="85" stroke="#d63d4f" stroke-width="2"/>

        <!-- 轮子 -->
        <circle cx="55" cy="108" r="15" fill="#1a1a1a" stroke="#001858" stroke-width="3"/>
        <circle cx="55" cy="108" r="6" fill="#888"/>
        <circle cx="165" cy="108" r="15" fill="#1a1a1a" stroke="#001858" stroke-width="3"/>
        <circle cx="165" cy="108" r="6" fill="#888"/>
        ${driving ? `
        <line x1="55" y1="100" x2="55" y2="116" stroke="#666" stroke-width="2">
          <animateTransform attributeName="transform" type="rotate" from="0 55 108" to="360 55 108" dur="0.3s" repeatCount="indefinite"/>
        </line>
        <line x1="165" y1="100" x2="165" y2="116" stroke="#666" stroke-width="2">
          <animateTransform attributeName="transform" type="rotate" from="0 165 108" to="360 165 108" dur="0.3s" repeatCount="indefinite"/>
        </line>
        <circle cx="10" cy="92" r="4" fill="#ccc" opacity=".7">
          <animate attributeName="cx" values="10;-10" dur="1s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values=".7;0" dur="1s" repeatCount="indefinite"/>
        </circle>
        <circle cx="6" cy="90" r="3" fill="#ccc" opacity=".5">
          <animate attributeName="cx" values="6;-15" dur="1.2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values=".5;0" dur="1.2s" repeatCount="indefinite"/>
        </circle>
        ` : ''}
      </svg>
      <!-- 真正的小T头像（圆形裁剪，从车窗探出） -->
      <div class="hero-tina-head">
        <img class="auto-knockout" src="assets/tina-head.jpg" alt="小T">
      </div>
    </div>`;
}

/* =========== 地标 SVG（每个独立设计 + 自带名字气泡） =========== */
// 通用名字气泡（融合在建筑顶部）
function nameTag(x, name, w = 70) {
  const tagW = Math.max(w, name.length * 11 + 18);
  return `
    <g transform="translate(${x}, -38)">
      <rect x="${-tagW/2}" y="0" width="${tagW}" height="22" fill="#fff" stroke="#001858" stroke-width="2" rx="11"/>
      <text x="0" y="15" fill="#001858" font-size="11" font-weight="800" text-anchor="middle">📍 ${name}</text>
      <path d="M -5 22 L 0 30 L 5 22 Z" fill="#fff" stroke="#001858" stroke-width="2" stroke-linejoin="round"/>
      <line x1="-3" y1="22.5" x2="3" y2="22.5" stroke="#fff" stroke-width="3"/>
    </g>`;
}

const LANDMARK_SVG = {
  // 腾讯北京总部 - 深蓝玻璃幕墙楼
  tencent: `
    <g>
      ${nameTag(50, '腾讯总部', 92)}
      <!-- 主楼 -->
      <rect x="0" y="0" width="100" height="135" fill="#1e88c4" stroke="#001858" stroke-width="2.5"/>
      <rect x="6" y="6" width="88" height="123" fill="url(#tgrad)"/>
      <defs>
        <linearGradient id="tgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5fb3e8"/>
          <stop offset="100%" stop-color="#2a7ab8"/>
        </linearGradient>
      </defs>
      <!-- 横向窗格条纹 -->
      ${[...Array(11)].map((_,i) => `<line x1="6" y1="${15+i*11}" x2="94" y2="${15+i*11}" stroke="#001858" stroke-width=".8" opacity=".4"/>`).join('')}
      ${[...Array(7)].map((_,i) => `<line x1="${15+i*11}" y1="6" x2="${15+i*11}" y2="129" stroke="#001858" stroke-width=".8" opacity=".4"/>`).join('')}
      <!-- 顶部 logo 牌 -->
      <rect x="20" y="116" width="60" height="14" fill="#001858"/>
      <text x="50" y="127" fill="#fff" font-size="9" font-weight="800" text-anchor="middle">Tencent</text>
    </g>`,

  // 百度大厦 - 红色科技楼
  baidu: `
    <g>
      ${nameTag(35, '百度大厦', 92)}
      <rect x="0" y="20" width="70" height="115" fill="#e63946" stroke="#001858" stroke-width="2.5"/>
      <!-- 玻璃窗格 -->
      ${[0,1,2,3,4,5].map(r => [0,1,2].map(c =>
        `<rect x="${6+c*20}" y="${30+r*15}" width="16" height="11" fill="${(r+c)%2===0?'#fff':'#ffd166'}" opacity=".85" stroke="#001858" stroke-width=".5"/>`
      ).join('')).join('')}
      <!-- 楼顶 -->
      <rect x="10" y="10" width="50" height="12" fill="#001858"/>
      <text x="35" y="20" fill="#fff" font-size="9" font-weight="800" text-anchor="middle">Baidu</text>
      <!-- 旗杆 -->
      <rect x="33" y="0" width="4" height="12" fill="#888"/>
    </g>`,

  // 鸟巢 - 国家体育场（加大版，撑满 viewBox 高度）
  birds_nest: `
    <g>
      ${nameTag(60, '鸟巢', 60)}
      <!-- 主拱形（加大） -->
      <ellipse cx="60" cy="92" rx="60" ry="44" fill="#ccc" stroke="#001858" stroke-width="2.5"/>
      <ellipse cx="60" cy="94" rx="52" ry="38" fill="#888"/>
      <!-- 主结构拱顶（更高） -->
      <path d="M 0 92 Q 60 12 120 92" fill="#a8a8a8" stroke="#001858" stroke-width="2.5"/>
      <!-- 内层钢架（密集交错） -->
      <path d="M 8 85 L 32 25 M 22 80 L 50 20 M 38 75 L 65 18 M 55 73 L 80 18 M 72 75 L 95 22 M 90 80 L 108 35 M 105 87 L 115 55" stroke="#444" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M 12 58 L 42 82 M 30 40 L 62 78 M 55 25 L 82 68 M 75 35 L 100 72 M 95 55 L 112 80" stroke="#666" stroke-width="1.8" stroke-linecap="round"/>
      <!-- 横向编织钢条 -->
      <path d="M 6 80 Q 60 48 114 80" stroke="#555" stroke-width="1.5" fill="none" opacity=".7"/>
      <path d="M 12 65 Q 60 30 108 65" stroke="#555" stroke-width="1.5" fill="none" opacity=".7"/>
      <!-- 底座/看台 -->
      <rect x="-2" y="120" width="124" height="15" fill="#666" stroke="#001858" stroke-width="2"/>
      <rect x="0" y="123" width="120" height="3" fill="#999"/>
      <!-- 入口灯光 -->
      <rect x="50" y="125" width="20" height="10" fill="#ffd166" opacity=".7"/>
    </g>`,

  // 水立方（重新设计 v2：简洁清爽版）
  water_cube: `
    <g>
      ${nameTag(50, '水立方', 70)}
      <!-- 主体方块 -->
      <rect x="0" y="0" width="100" height="135" fill="#7ec8ff" stroke="#001858" stroke-width="2.5"/>
      <!-- 顶部到底部的蓝色玻璃渐变（轻盈） -->
      <rect x="3" y="3" width="94" height="129" fill="url(#wcGrad)"/>
      <defs>
        <linearGradient id="wcGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#c8e8ff"/>
          <stop offset="100%" stop-color="#5fa8e0"/>
        </linearGradient>
      </defs>
      <!-- ETFE 气泡膜：错落几何排布的圆，简洁不杂乱 -->
      <!-- 大气泡层（主视觉） -->
      <circle cx="22" cy="22" r="13" fill="#fff" opacity=".55"/>
      <circle cx="55" cy="20" r="10" fill="#fff" opacity=".4"/>
      <circle cx="80" cy="28" r="11" fill="#fff" opacity=".5"/>
      <circle cx="15" cy="55" r="9" fill="#fff" opacity=".45"/>
      <circle cx="42" cy="50" r="14" fill="#fff" opacity=".55"/>
      <circle cx="73" cy="58" r="10" fill="#fff" opacity=".4"/>
      <circle cx="88" cy="78" r="9" fill="#fff" opacity=".45"/>
      <circle cx="25" cy="80" r="11" fill="#fff" opacity=".5"/>
      <circle cx="55" cy="85" r="13" fill="#fff" opacity=".55"/>
      <circle cx="18" cy="108" r="10" fill="#fff" opacity=".45"/>
      <circle cx="48" cy="115" r="9" fill="#fff" opacity=".4"/>
      <circle cx="78" cy="108" r="11" fill="#fff" opacity=".5"/>
      <!-- 描边气泡（强调几何感） -->
      <circle cx="22" cy="22" r="13" fill="none" stroke="#fff" stroke-width="1.2" opacity=".7"/>
      <circle cx="42" cy="50" r="14" fill="none" stroke="#fff" stroke-width="1.2" opacity=".7"/>
      <circle cx="55" cy="85" r="13" fill="none" stroke="#fff" stroke-width="1.2" opacity=".7"/>
      <circle cx="80" cy="28" r="11" fill="none" stroke="#fff" stroke-width="1" opacity=".6"/>
      <circle cx="73" cy="58" r="10" fill="none" stroke="#fff" stroke-width="1" opacity=".6"/>
      <circle cx="78" cy="108" r="11" fill="none" stroke="#fff" stroke-width="1" opacity=".6"/>
      <!-- 高光小点 -->
      <circle cx="18" cy="18" r="2" fill="#fff" opacity=".95"/>
      <circle cx="38" cy="46" r="2" fill="#fff" opacity=".95"/>
      <circle cx="51" cy="81" r="2" fill="#fff" opacity=".95"/>
      <!-- 底部入口 -->
      <rect x="40" y="120" width="20" height="15" fill="#001858"/>
      <rect x="42" y="123" width="16" height="9" fill="#ffd166" opacity=".9"/>
      <!-- 顶部边线 -->
      <rect x="-2" y="-3" width="104" height="6" fill="#001858"/>
      <!-- 底部 logo -->
      <text x="50" y="131" fill="#001858" font-size="4.5" font-weight="800" text-anchor="middle">国家游泳中心</text>
    </g>`,

  // CCTV 大裤衩
  cctv: `
    <g>
      ${nameTag(45, 'CCTV', 60)}
      <!-- 双塔 -->
      <path d="M 5 130 L 5 60 L 25 30 L 25 65 L 60 65 L 60 30 L 80 60 L 80 130 Z" fill="#7a8595" stroke="#001858" stroke-width="2.5"/>
      <!-- 玻璃幕墙网格 -->
      ${[0,1,2,3,4,5].map(r => [0,1].map(c =>
        `<rect x="${10+c*55}" y="${72+r*9}" width="10" height="6" fill="#ffd166" opacity=".8"/>`
      ).join('')).join('')}
      ${[0,1,2,3,4,5].map(r => [0,1].map(c =>
        `<rect x="${10+c*55}" y="${75+r*9}" width="10" height="2" fill="#aac5ff" opacity=".6"/>`
      ).join('')).join('')}
      <!-- 横梁 -->
      <line x1="25" y1="65" x2="60" y2="65" stroke="#001858" stroke-width="3"/>
      <!-- 顶部 LOGO -->
      <text x="42" y="50" fill="#001858" font-size="8" font-weight="800" text-anchor="middle">CCTV</text>
    </g>`,

  // 亚洲金融大厦 - 终点（金光闪闪）
  asia_finance: `
    <g>
      ${nameTag(50, '🎯 亚洲金融大厦', 130)}
      <rect x="0" y="0" width="100" height="135" fill="#3d4a8a" stroke="#001858" stroke-width="2.5"/>
      <rect x="6" y="6" width="88" height="123" fill="url(#fgrad)"/>
      <defs>
        <linearGradient id="fgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#aac5ff"/>
          <stop offset="50%" stop-color="#7aa3e8"/>
          <stop offset="100%" stop-color="#4a55a6"/>
        </linearGradient>
      </defs>
      <!-- 玻璃幕墙横纹 -->
      ${[...Array(13)].map((_,i) => `<line x1="6" y1="${12+i*9}" x2="94" y2="${12+i*9}" stroke="#fff" stroke-width=".8" opacity=".5"/>`).join('')}
      <!-- 中央竖线 -->
      <line x1="50" y1="6" x2="50" y2="129" stroke="#fff" stroke-width="1.5" opacity=".7"/>
      <!-- 顶部尖顶 -->
      <polygon points="50,-10 40,0 60,0" fill="#ffd166" stroke="#001858" stroke-width="2"/>
      <!-- 楼顶 logo -->
      <rect x="25" y="115" width="50" height="16" fill="#001858"/>
      <text x="50" y="127" fill="#ffd166" font-size="8" font-weight="800" text-anchor="middle">AFC</text>
      <!-- 闪光 -->
      <text x="-15" y="20" font-size="12" fill="#ffd166">✨</text>
      <text x="105" y="40" font-size="10" fill="#ffd166">✦</text>
    </g>`,

  // 国家速滑馆"冰丝带"
  ice_rink: `
    <g>
      ${nameTag(55, '冰丝带', 70)}
      <!-- 主体 -->
      <rect x="0" y="40" width="110" height="95" fill="#c8e6f5" stroke="#001858" stroke-width="2.5"/>
      <!-- 屋顶曲线 -->
      <path d="M 0 40 Q 55 8 110 40 L 110 50 Q 55 18 0 50 Z" fill="#aac5ff" stroke="#001858" stroke-width="2"/>
      <!-- 冰丝带飘带 -->
      <path d="M 5 55 Q 55 45 105 55 L 105 62 Q 55 52 5 62 Z" fill="#5fb3e8" stroke="#001858" stroke-width="1.5"/>
      <path d="M 5 70 Q 55 60 105 70 L 105 77 Q 55 67 5 77 Z" fill="#7ec8ff" stroke="#001858" stroke-width="1.5"/>
      <path d="M 5 85 Q 55 75 105 85 L 105 92 Q 55 82 5 92 Z" fill="#5fb3e8" stroke="#001858" stroke-width="1.5"/>
      <!-- 底部窗 -->
      ${[15,35,55,75,95].map(x => `<rect x="${x}" y="105" width="12" height="20" fill="#ffd166" stroke="#001858" stroke-width="1"/>`).join('')}
    </g>`,

  // 清华大学 - 二校门
  qinghua: `
    <g>
      ${nameTag(55, '清华大学', 88)}
      <!-- 牌坊主体 -->
      <rect x="10" y="50" width="100" height="85" fill="#f5e8d0" stroke="#001858" stroke-width="2.5"/>
      <!-- 屋顶 -->
      <path d="M 0 50 L 60 18 L 120 50 Z" fill="#8b4513" stroke="#001858" stroke-width="2.5"/>
      <path d="M 5 50 L 60 25 L 115 50 L 115 55 L 5 55 Z" fill="#5a3a1a"/>
      <!-- 飞檐两翼 -->
      <path d="M 0 50 L -5 60 L 5 50 Z" fill="#5a3a1a" stroke="#001858" stroke-width="1.5"/>
      <path d="M 120 50 L 125 60 L 115 50 Z" fill="#5a3a1a" stroke="#001858" stroke-width="1.5"/>
      <!-- 中门洞 -->
      <path d="M 50 90 L 50 130 L 70 130 L 70 90 Q 60 80 50 90 Z" fill="#5a3a1a" stroke="#001858" stroke-width="1.5"/>
      <!-- 侧柱 -->
      <rect x="20" y="70" width="8" height="65" fill="#a87850" stroke="#001858" stroke-width="1.5"/>
      <rect x="92" y="70" width="8" height="65" fill="#a87850" stroke="#001858" stroke-width="1.5"/>
      <!-- 牌匾 -->
      <rect x="40" y="62" width="40" height="15" fill="#001858" stroke="#ffd166" stroke-width="1.5"/>
      <text x="60" y="73" fill="#ffd166" font-size="8" font-weight="800" text-anchor="middle">清华園</text>
    </g>`,

  // 圆明园
  yuanmingyuan: `
    <g>
      ${nameTag(44, '圆明园', 70)}
      <!-- 山丘草地 -->
      <path d="M 0 110 Q 30 80 55 110 Q 80 85 110 110 L 110 135 L 0 135 Z" fill="#88c47c" stroke="#001858" stroke-width="2.5"/>
      <!-- 大水法石柱（残柱）- 靠左让 nameTag 能指到 -->
      <rect x="40" y="35" width="8" height="75" fill="#d4cfc8" stroke="#001858" stroke-width="2"/>
      <rect x="36" y="30" width="16" height="8" fill="#a8a8a8" stroke="#001858" stroke-width="1.5"/>
      <rect x="38" y="26" width="12" height="6" fill="#888"/>
      <!-- 第二根残柱 -->
      <rect x="62" y="60" width="6" height="50" fill="#d4cfc8" stroke="#001858" stroke-width="2"/>
      <rect x="58" y="55" width="14" height="7" fill="#a8a8a8" stroke="#001858" stroke-width="1.5"/>
      <!-- 倒下的柱子 -->
      <rect x="78" y="100" width="25" height="6" fill="#d4cfc8" stroke="#001858" stroke-width="1.5" transform="rotate(15 90 103)"/>
      <!-- 小灌木 -->
      <ellipse cx="15" cy="115" rx="8" ry="5" fill="#7cba6a"/>
      <ellipse cx="100" cy="118" rx="7" ry="4" fill="#7cba6a"/>
    </g>`,

  // 小米科技园
  xiaomi: `
    <g>
      ${nameTag(40, '小米', 60)}
      <rect x="0" y="10" width="80" height="125" fill="#ff7a00" stroke="#001858" stroke-width="2.5"/>
      <!-- 横向窗带 -->
      ${[0,1,2,3,4,5,6].map(r => `<rect x="6" y="${20+r*15}" width="68" height="10" fill="#fff" opacity=".9"/>`).join('')}
      ${[0,1,2,3,4,5,6].map(r => [0,1,2,3].map(c =>
        `<rect x="${6+c*17}" y="${20+r*15}" width="14" height="10" fill="#aac5ff" opacity=".8" stroke="#001858" stroke-width=".5"/>`
      ).join('')).join('')}
      <!-- 顶部 MI 标志 -->
      <rect x="20" y="-2" width="40" height="14" fill="#001858" rx="2"/>
      <text x="40" y="9" fill="#ff7a00" font-size="10" font-weight="800" text-anchor="middle">MI</text>
    </g>`,

  // 北京体育大学
  bsu: `
    <g>
      ${nameTag(50, '北体大', 70)}
      <!-- 主楼 -->
      <rect x="5" y="55" width="90" height="80" fill="#8bd3dd" stroke="#001858" stroke-width="2.5"/>
      <!-- 三段窗 -->
      ${[0,1,2].map(c => `
        <rect x="${12+c*27}" y="65" width="22" height="60" fill="#fff" opacity=".9" stroke="#001858" stroke-width="1"/>
        <line x1="${23+c*27}" y1="65" x2="${23+c*27}" y2="125" stroke="#001858" stroke-width="1" opacity=".6"/>
        ${[0,1,2,3].map(r => `<line x1="${12+c*27}" y1="${78+r*12}" x2="${34+c*27}" y2="${78+r*12}" stroke="#001858" stroke-width=".8" opacity=".5"/>`).join('')}
      `).join('')}
      <!-- 屋顶 -->
      <path d="M 0 55 L 50 30 L 100 55 Z" fill="#d63d4f" stroke="#001858" stroke-width="2.5"/>
      <!-- 体育徽章 -->
      <circle cx="50" cy="42" r="9" fill="#ffd166" stroke="#001858" stroke-width="1.8"/>
      <text x="50" y="46" font-size="11" text-anchor="middle">⚽</text>
      <!-- 旗杆 -->
      <rect x="48" y="15" width="4" height="20" fill="#888"/>
      <path d="M 52 15 L 65 18 L 52 22 Z" fill="#d63d4f"/>
    </g>`,

  // 国家会议中心
  conv_center: `
    <g>
      ${nameTag(65, '国家会议中心', 110)}
      <!-- 主楼 -->
      <rect x="0" y="55" width="130" height="80" fill="#bcd4e8" stroke="#001858" stroke-width="2.5"/>
      <!-- 凹形屋顶 -->
      <path d="M 0 55 Q 65 20 130 55 Z" fill="#7aa3c8" stroke="#001858" stroke-width="2.5"/>
      <path d="M 10 50 Q 65 28 120 50" fill="none" stroke="#5a8def" stroke-width="2"/>
      <!-- 玻璃中庭 -->
      <rect x="50" y="75" width="30" height="60" fill="#5fb3e8" opacity=".85" stroke="#001858" stroke-width="1.5"/>
      <line x1="65" y1="75" x2="65" y2="135" stroke="#fff" stroke-width="1" opacity=".7"/>
      <!-- 两侧窗 -->
      ${[10,30,90,110].map(x => [0,1,2,3].map(r =>
        `<rect x="${x}" y="${80+r*13}" width="14" height="9" fill="#aac5ff" opacity=".8" stroke="#001858" stroke-width=".5"/>`
      ).join('')).join('')}
      <!-- 入口 -->
      <rect x="55" y="120" width="20" height="15" fill="#001858"/>
      <text x="65" y="131" fill="#ffd166" font-size="6" font-weight="800" text-anchor="middle">CNCC</text>
    </g>`,

  // 永丰科技园
  tech_park: `
    <g>
      <!-- 主楼+副楼并列，底部 y=135 -->
      <rect x="0" y="30" width="48" height="105" fill="#7aa3e8" stroke="#001858" stroke-width="2"/>
      <rect x="6" y="36" width="36" height="93" fill="#aac5ff"/>
      ${[...Array(8)].map((_,i) => `<line x1="6" y1="${42+i*11}" x2="42" y2="${42+i*11}" stroke="#fff" stroke-width=".5" opacity=".7"/>`).join('')}
      <rect x="52" y="55" width="40" height="80" fill="#88bedd" stroke="#001858" stroke-width="2"/>
      ${[0,1,2,3,4].map(r => [0,1,2].map(c =>
        `<rect x="${56+c*10}" y="${62+r*13}" width="8" height="8" fill="${(r+c)%2===0?'#ffd166':'#aac5ff'}"/>`
      ).join('')).join('')}
      <text x="46" y="125" fill="#001858" font-size="7" font-weight="800" text-anchor="middle">永丰科技园</text>
    </g>`,

  // 清河公园（公园门楼+绿树+草坪，正常建筑样式带 nameTag）
  qinghe_park: `
    <g>
      ${nameTag(60, '清河公园', 80)}
      <!-- 公园主门楼（正方形拱门） -->
      <rect x="20" y="40" width="80" height="95" fill="#9bd4a0" stroke="#001858" stroke-width="2"/>
      <rect x="24" y="44" width="72" height="91" fill="#b5e5b8"/>
      <!-- 拱门 -->
      <path d="M 45 100 Q 45 75 60 75 Q 75 75 75 100 L 75 135 L 45 135 Z" fill="#5a3a1a" stroke="#001858" stroke-width="1.8"/>
      <path d="M 50 95 Q 50 80 60 80 Q 70 80 70 95 L 70 130 L 50 130 Z" fill="#3d2817"/>
      <!-- 屋檐 -->
      <path d="M 14 40 L 60 18 L 106 40 Z" fill="#5a8050" stroke="#001858" stroke-width="2"/>
      <path d="M 18 38 L 60 22 L 102 38 L 102 42 L 18 42 Z" fill="#3d6037"/>
      <!-- 公园招牌 -->
      <rect x="36" y="50" width="48" height="14" fill="#5a3a1a" stroke="#ffd166" stroke-width="1.5"/>
      <text x="60" y="61" fill="#ffd166" font-size="8" font-weight="800" text-anchor="middle">清河公园</text>
      <!-- 两侧装饰柱 -->
      <rect x="22" y="60" width="6" height="75" fill="#5a3a1a" stroke="#001858" stroke-width="1"/>
      <rect x="92" y="60" width="6" height="75" fill="#5a3a1a" stroke="#001858" stroke-width="1"/>
      <!-- 顶部小球（装饰） -->
      <circle cx="25" cy="60" r="3" fill="#ffd166" stroke="#001858" stroke-width="1"/>
      <circle cx="95" cy="60" r="3" fill="#ffd166" stroke="#001858" stroke-width="1"/>
      <!-- 两侧绿树 -->
      <ellipse cx="6" cy="135" rx="12" ry="3" fill="#5a8050" opacity=".4"/>
      <rect x="3" y="105" width="6" height="30" fill="#5a4030" stroke="#001858" stroke-width="1"/>
      <circle cx="6" cy="100" r="14" fill="#7cba6a" stroke="#001858" stroke-width="1.5"/>
      <circle cx="0" cy="96" r="9" fill="#88c47c"/>
      <ellipse cx="115" cy="135" rx="12" ry="3" fill="#5a8050" opacity=".4"/>
      <rect x="112" y="108" width="6" height="27" fill="#5a4030" stroke="#001858" stroke-width="1"/>
      <circle cx="115" cy="103" r="13" fill="#7cba6a" stroke="#001858" stroke-width="1.5"/>
      <circle cx="120" cy="98" r="8" fill="#88c47c"/>
      <!-- 草坪 -->
      <ellipse cx="60" cy="135" rx="50" ry="3" fill="#88c47c"/>
    </g>`,

  // 清河大桥（独占段超大版，800 宽 × 270 高）
  qinghe_bridge: `
    <g>
      <!-- 自定义气泡名（嵌在桥拱顶上方，y > 0 不会跑到 viewBox 外） -->
      <g transform="translate(400, 30)">
        <rect x="-55" y="0" width="110" height="22" fill="#fff" stroke="#001858" stroke-width="2" rx="11"/>
        <text x="0" y="15" fill="#001858" font-size="11" font-weight="800" text-anchor="middle">📍 清河大桥</text>
        <path d="M -5 22 L 0 30 L 5 22 Z" fill="#fff" stroke="#001858" stroke-width="2" stroke-linejoin="round"/>
        <line x1="-3" y1="22.5" x2="3" y2="22.5" stroke="#fff" stroke-width="3"/>
      </g>
      <!-- 桥下水面 -->
      <ellipse cx="400" cy="262" rx="450" ry="6" fill="#7ec8ff" opacity=".5"/>
      <ellipse cx="200" cy="262" rx="80" ry="3" fill="#fff" opacity=".6"/>
      <ellipse cx="560" cy="264" rx="70" ry="3" fill="#fff" opacity=".6"/>
      <!-- 桥拱（高高拱起，跨度大） -->
      <path d="M 0 230 Q 400 75 800 230 L 800 244 Q 400 95 0 244 Z" fill="#a8a8a8" stroke="#001858" stroke-width="3"/>
      <!-- 桥面 -->
      <rect x="0" y="240" width="800" height="16" fill="#666" stroke="#001858" stroke-width="2.5"/>
      <line x1="0" y1="248" x2="800" y2="248" stroke="#fff" stroke-width="1.5" opacity=".7" stroke-dasharray="20 10"/>
      <!-- 主塔（中央巨型） -->
      <rect x="392" y="65" width="16" height="175" fill="#444" stroke="#001858" stroke-width="2"/>
      <rect x="384" y="60" width="32" height="10" fill="#666" stroke="#001858" stroke-width="2"/>
      <circle cx="400" cy="56" r="4" fill="#d63d4f"/>
      <!-- 拉索（左右各 8 根，主塔顶到桥面） -->
      ${[40, 100, 160, 220, 280, 330, 370, 395].map(d => `
        <line x1="400" y1="65" x2="${400 - d}" y2="240" stroke="#444" stroke-width="2"/>
        <line x1="400" y1="65" x2="${400 + d}" y2="240" stroke="#444" stroke-width="2"/>
      `).join('')}
      <!-- 桥下立柱 -->
      <rect x="160" y="256" width="12" height="14" fill="#666"/>
      <rect x="628" y="256" width="12" height="14" fill="#666"/>
      <!-- 桥头堡 -->
      <rect x="0" y="222" width="26" height="36" fill="#666" stroke="#001858" stroke-width="1.5"/>
      <rect x="774" y="222" width="26" height="36" fill="#666" stroke="#001858" stroke-width="1.5"/>
      <!-- 桥下小船 -->
      <path d="M 200 252 L 250 252 L 244 262 L 206 262 Z" fill="#fff" stroke="#001858" stroke-width="1.5"/>
      <rect x="222" y="244" width="6" height="8" fill="#d63d4f"/>
      <path d="M 540 256 L 580 256 L 575 264 L 545 264 Z" fill="#fff" stroke="#001858" stroke-width="1.5"/>
      <rect x="558" y="250" width="5" height="6" fill="#5a8def"/>
    </g>`,

  // 颐和园万寿山（实景版宽 600px）
  yiheyuan_full: `
    <g>
      ${nameTag(300, '颐和园·万寿山', 130)}
      <!-- 昆明湖远景 -->
      <ellipse cx="300" cy="232" rx="320" ry="6" fill="#7ec8ff" opacity=".5"/>
      <!-- 远山 -->
      <path d="M 0 225 Q 100 180 200 215 Q 300 175 400 215 Q 500 180 600 225 L 600 235 L 0 235 Z" fill="#88a888" stroke="#001858" stroke-width="2"/>
      <path d="M 50 215 Q 150 175 250 210" fill="#a8c098" opacity=".7"/>
      <!-- 万寿山主体 -->
      <path d="M 180 230 Q 300 100 420 230 Z" fill="#88a888" stroke="#001858" stroke-width="2"/>
      <path d="M 200 220 Q 300 130 400 220" fill="#a8c098" opacity=".7"/>
      <!-- 佛香阁（主塔） -->
      <rect x="285" y="135" width="30" height="55" fill="#d4756f" stroke="#001858" stroke-width="2"/>
      <path d="M 280 135 L 300 105 L 320 135 Z" fill="#a83248" stroke="#001858" stroke-width="2"/>
      <path d="M 282 110 L 300 100 L 318 110" fill="none" stroke="#5a3a1a" stroke-width="1.5"/>
      <rect x="290" y="148" width="20" height="40" fill="#5a3a1a"/>
      <rect x="294" y="155" width="12" height="20" fill="#ffd166" opacity=".7"/>
      <!-- 飞檐 -->
      <path d="M 280 135 L 270 140 L 280 142 Z" fill="#a83248" stroke="#001858" stroke-width="1.5"/>
      <path d="M 320 135 L 330 140 L 320 142 Z" fill="#a83248" stroke="#001858" stroke-width="1.5"/>
      <!-- 山下亭子 -->
      <rect x="120" y="200" width="18" height="30" fill="#a87850" stroke="#001858" stroke-width="1.5"/>
      <path d="M 115 200 L 129 188 L 143 200 Z" fill="#a83248" stroke="#001858" stroke-width="1.5"/>
      <rect x="450" y="205" width="16" height="25" fill="#a87850" stroke="#001858" stroke-width="1.5"/>
      <path d="M 446 205 L 458 195 L 470 205 Z" fill="#a83248" stroke="#001858" stroke-width="1.5"/>
      <!-- 远景松树 -->
      <ellipse cx="80" cy="218" rx="14" ry="10" fill="#5a8050"/>
      <ellipse cx="520" cy="220" rx="12" ry="8" fill="#5a8050"/>
    </g>`,
};

/* =========== 远景彩蛋 SVG（小而精，放在远景层） =========== */
const EXTRA_SVG = {
  // 西山 (远景山脉)
  xishan: `<g><path d="M 0 50 L 30 10 L 55 30 L 80 5 L 110 35 L 140 15 L 160 50 L 0 50 Z" fill="#7a9a7a" stroke="#5a7a5a" stroke-width="1.5"/><path d="M 25 18 L 32 25 L 38 20 Z M 75 12 L 82 18 L 88 14 Z" fill="#fff" opacity=".6"/></g>`,

  // 香山红叶
  xiangshan: `<g><path d="M 0 60 Q 35 5 70 60 Z" fill="#a85048" stroke="#001858" stroke-width="1.5"/><path d="M 5 55 Q 35 15 65 55" fill="#d4754f" opacity=".8"/><circle cx="20" cy="40" r="3" fill="#ff9966"/><circle cx="40" cy="30" r="3" fill="#ffaa66"/><circle cx="55" cy="42" r="3" fill="#ff7755"/><text x="35" y="55" fill="#fff" font-size="6" font-weight="800" text-anchor="middle">香山</text></g>`,

  // 中关村软件园门牌
  softpark_gate: `<g><rect x="0" y="40" width="80" height="20" fill="#3d4a8a" stroke="#001858" stroke-width="1.5"/><text x="40" y="53" fill="#ffd166" font-size="9" font-weight="800" text-anchor="middle">软件园</text><rect x="-2" y="58" width="8" height="6" fill="#666"/><rect x="74" y="58" width="8" height="6" fill="#666"/></g>`,

  // 百度大厦（远景缩影）
  baidu_far: `<g><rect x="0" y="20" width="40" height="60" fill="#e63946" stroke="#001858" stroke-width="1.5"/>${[0,1,2,3].map(r=>[0,1,2].map(c=>`<rect x="${4+c*12}" y="${28+r*13}" width="9" height="6" fill="${(r+c)%2===0?'#fff':'#ffd166'}" opacity=".85"/>`).join('')).join('')}<text x="20" y="76" fill="#fff" font-size="6" font-weight="800" text-anchor="middle">Baidu</text></g>`,

  // 颐和园万寿山
  yiheyuan: `<g><path d="M 0 60 Q 40 15 80 60 Z" fill="#88a888" stroke="#001858" stroke-width="1.5"/><!-- 佛香阁 --><rect x="34" y="30" width="14" height="22" fill="#d4756f" stroke="#001858" stroke-width="1.2"/><path d="M 30 30 L 41 18 L 52 30 Z" fill="#a83248"/><rect x="36" y="36" width="10" height="12" fill="#5a3a1a"/><text x="40" y="56" fill="#fff" font-size="6" font-weight="800" text-anchor="middle">颐和园</text></g>`,

  // 地铁 13 号线列车
  subway13: `<g><!-- 高架轨道 --><rect x="0" y="35" width="120" height="3" fill="#888" stroke="#001858" stroke-width="1"/><rect x="20" y="38" width="6" height="18" fill="#666"/><rect x="94" y="38" width="6" height="18" fill="#666"/><!-- 列车 --><rect x="10" y="20" width="100" height="14" rx="3" fill="#ffd166" stroke="#001858" stroke-width="1.5"/><rect x="14" y="22" width="20" height="6" fill="#aac5ff"/><rect x="38" y="22" width="20" height="6" fill="#aac5ff"/><rect x="62" y="22" width="20" height="6" fill="#aac5ff"/><rect x="86" y="22" width="20" height="6" fill="#aac5ff"/><circle cx="20" cy="34" r="3" fill="#444"/><circle cx="100" cy="34" r="3" fill="#444"/><text x="60" y="32" fill="#001858" font-size="6" font-weight="800" text-anchor="middle">13</text></g>`,

  // 欢乐谷热气球
  hot_balloon: `<g><!-- 气球 --><ellipse cx="20" cy="20" rx="18" ry="22" fill="#f582ae" stroke="#001858" stroke-width="1.5"/><path d="M 5 14 Q 20 8 35 14 Q 35 25 20 28 Q 5 25 5 14 Z" fill="#ffd166" opacity=".7"/><line x1="2" y1="22" x2="20" y2="42" stroke="#001858" stroke-width=".8"/><line x1="38" y1="22" x2="20" y2="42" stroke="#001858" stroke-width=".8"/><!-- 篮子 --><rect x="14" y="42" width="12" height="8" fill="#a87850" stroke="#001858" stroke-width="1.2"/><line x1="14" y1="46" x2="26" y2="46" stroke="#5a3a1a" stroke-width=".5"/></g>`,

  // 朝阳公园摩天轮
  ferris_wheel: `<g><!-- 主圆 --><circle cx="40" cy="35" r="32" fill="none" stroke="#a78bfa" stroke-width="3"/><circle cx="40" cy="35" r="28" fill="none" stroke="#d4b8ff" stroke-width="1"/><!-- 辐条 --><line x1="40" y1="3" x2="40" y2="67" stroke="#a78bfa" stroke-width="1.5"/><line x1="8" y1="35" x2="72" y2="35" stroke="#a78bfa" stroke-width="1.5"/><line x1="17" y1="12" x2="63" y2="58" stroke="#a78bfa" stroke-width="1.5"/><line x1="63" y1="12" x2="17" y2="58" stroke="#a78bfa" stroke-width="1.5"/><!-- 中心 --><circle cx="40" cy="35" r="3" fill="#001858"/><!-- 8个轿厢 --><rect x="38" y="0" width="4" height="6" fill="#f582ae" stroke="#001858" stroke-width=".8"/><rect x="38" y="64" width="4" height="6" fill="#8bd3dd" stroke="#001858" stroke-width=".8"/><rect x="5" y="33" width="6" height="4" fill="#ffd166" stroke="#001858" stroke-width=".8"/><rect x="69" y="33" width="6" height="4" fill="#06d6a0" stroke="#001858" stroke-width=".8"/><rect x="14" y="9" width="5" height="5" fill="#f582ae" stroke="#001858" stroke-width=".8"/><rect x="61" y="9" width="5" height="5" fill="#8bd3dd" stroke="#001858" stroke-width=".8"/><rect x="14" y="56" width="5" height="5" fill="#ffd166" stroke="#001858" stroke-width=".8"/><rect x="61" y="56" width="5" height="5" fill="#06d6a0" stroke="#001858" stroke-width=".8"/><!-- 底座 --><rect x="34" y="67" width="12" height="3" fill="#666"/></g>`,

  // CCTV 大裤衩 (远景)
  cctv_far: `<g><path d="M 4 80 L 4 38 L 18 22 L 18 44 L 36 44 L 36 22 L 50 38 L 50 80 Z" fill="#7a8595" stroke="#001858" stroke-width="1.2" opacity=".85"/>${[0,1,2,3].map(r=>[0,1].map(c=>`<rect x="${8+c*30}" y="${48+r*7}" width="6" height="3" fill="#ffd166" opacity=".8"/>`).join('')).join('')}<text x="27" y="78" fill="#fff" font-size="6" font-weight="800" text-anchor="middle">CCTV</text></g>`,

  // 奥林匹克塔
  olympic_tower: `<g><rect x="22" y="10" width="6" height="60" fill="#999" stroke="#001858" stroke-width="1"/><circle cx="25" cy="14" r="6" fill="#ffd166" stroke="#001858" stroke-width="1.2"/><path d="M 18 20 L 32 20 L 28 26 L 22 26 Z" fill="#888"/><rect x="24" y="-2" width="2" height="12" fill="#666"/><circle cx="25" cy="-2" r="1.5" fill="#d63d4f"/><text x="25" y="80" fill="#fff" font-size="6" font-weight="800" text-anchor="middle">奥塔</text></g>`,

  // 钟鼓楼 (远景)
  drum_tower: `<g><rect x="8" y="40" width="50" height="35" fill="#a85048" stroke="#001858" stroke-width="1.5"/><path d="M 0 40 L 33 18 L 66 40 Z" fill="#5a3a1a" stroke="#001858" stroke-width="1.5"/><path d="M 5 40 L 33 25 L 61 40 L 61 44 L 5 44 Z" fill="#3d2817"/><rect x="28" y="55" width="10" height="20" fill="#5a3a1a"/><text x="33" y="68" fill="#fff" font-size="6" font-weight="800" text-anchor="middle">钟楼</text></g>`,

  // 冰丝带（远景小版）
  ice_rink_far: `<g><rect x="0" y="35" width="80" height="45" fill="#c8e6f5" stroke="#001858" stroke-width="1.5"/><path d="M 0 35 Q 40 18 80 35" fill="#aac5ff" stroke="#001858" stroke-width="1.5"/><line x1="6" y1="46" x2="74" y2="46" stroke="#5fb3e8" stroke-width="2"/><line x1="6" y1="56" x2="74" y2="56" stroke="#7ec8ff" stroke-width="2"/><line x1="6" y1="66" x2="74" y2="66" stroke="#5fb3e8" stroke-width="2"/><text x="40" y="78" fill="#001858" font-size="6" font-weight="800" text-anchor="middle">冰丝带</text></g>`,

  // 国贸三期 (远景)
  guomao_far: `<g><rect x="10" y="5" width="14" height="75" fill="#5a3a8a" stroke="#001858" stroke-width="1.2"/><rect x="11" y="6" width="12" height="73" fill="url(#guomao)"/><defs><linearGradient id="guomao" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#aac5ff"/><stop offset="100%" stop-color="#5a3a8a"/></linearGradient></defs>${[...Array(10)].map((_,i)=>`<line x1="11" y1="${10+i*7}" x2="23" y2="${10+i*7}" stroke="#fff" stroke-width=".4" opacity=".5"/>`).join('')}<polygon points="17,-2 13,5 21,5" fill="#ffd166"/><text x="17" y="78" fill="#fff" font-size="5" font-weight="800" text-anchor="middle">国贸</text></g>`,

  // 飞机 (划过天空)
  plane: `<g><path d="M 0 5 L 20 0 L 60 0 L 80 5 L 60 10 L 20 10 Z" fill="#fff" stroke="#001858" stroke-width="1.2"/><circle cx="20" cy="5" r="2" fill="#aac5ff"/><circle cx="30" cy="5" r="2" fill="#aac5ff"/><circle cx="40" cy="5" r="2" fill="#aac5ff"/><circle cx="50" cy="5" r="2" fill="#aac5ff"/><path d="M 35 -2 L 45 -8 L 50 -2 Z" fill="#d63d4f" stroke="#001858" stroke-width="1"/><path d="M 65 0 L 75 -4 L 78 1 Z" fill="#fff" stroke="#001858" stroke-width="1"/><!-- 尾烟 --><line x1="-5" y1="5" x2="-25" y2="5" stroke="#fff" stroke-width="3" opacity=".5" stroke-dasharray="4 3"/></g>`,

  // 鸟群
  birds: `<g><path d="M 0 5 Q 4 0 8 5 Q 12 0 16 5" stroke="#001858" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M 22 8 Q 26 3 30 8 Q 34 3 38 8" stroke="#001858" stroke-width="1.2" fill="none" stroke-linecap="round"/><path d="M 44 4 Q 48 -1 52 4 Q 56 -1 60 4" stroke="#001858" stroke-width="1" fill="none" stroke-linecap="round"/></g>`,

  // 彩虹
  rainbow: `<g><path d="M 0 50 A 60 50 0 0 1 120 50" fill="none" stroke="#d63d4f" stroke-width="3"/><path d="M 4 50 A 56 46 0 0 1 116 50" fill="none" stroke="#ff9966" stroke-width="3"/><path d="M 8 50 A 52 42 0 0 1 112 50" fill="none" stroke="#ffd166" stroke-width="3"/><path d="M 12 50 A 48 38 0 0 1 108 50" fill="none" stroke="#06d6a0" stroke-width="3"/><path d="M 16 50 A 44 34 0 0 1 104 50" fill="none" stroke="#5a8def" stroke-width="3"/><path d="M 20 50 A 40 30 0 0 1 100 50" fill="none" stroke="#a78bfa" stroke-width="3"/></g>`,
};

/* =========== 视差层渲染 =========== */
function renderClouds() {
  const layer = document.getElementById('layer-clouds');
  let html = '<svg viewBox="0 0 2000 130" width="100%" height="100%" preserveAspectRatio="xMidYMin slice">';
  for (let i = 0; i < 16; i++) {
    const x = i * 130 + (i % 2 === 0 ? 0 : 60);
    const y = 30 + (i % 3) * 22;
    html += `<g transform="translate(${x},${y})"><ellipse cx="0" cy="0" rx="35" ry="14" fill="#fff" opacity=".9"/><ellipse cx="20" cy="-5" rx="25" ry="12" fill="#fff" opacity=".9"/><ellipse cx="-15" cy="-3" rx="20" ry="10" fill="#fff" opacity=".9"/></g>`;
  }
  html += '</svg>';
  layer.innerHTML = html;
}

function renderFar() {
  const layer = document.getElementById('layer-far');
  // 大桥段：清空远景建筑，只露天空（让大桥独占画面）
  const node = ROUTE[stageIdx];
  if (node && node.midBuildings && node.midBuildings.includes('qinghe_bridge') && node.midBuildings.length === 1) {
    layer.innerHTML = '';
    return;
  }
  // 远处天际线 - 简化扁平剪影
  const cityGroup = (offset) => {
    const buildings = [
      { x: 0, w: 60, h: 100, c: '#a8c5e0' }, { x: 70, w: 50, h: 130, c: '#9bb8d6' },
      { x: 130, w: 40, h: 90, c: '#bcd4e8' }, { x: 180, w: 70, h: 150, c: '#a8c5e0' },
      { x: 260, w: 45, h: 110, c: '#9bb8d6' }, { x: 315, w: 55, h: 125, c: '#bcd4e8' },
      { x: 380, w: 50, h: 105, c: '#a8c5e0' }, { x: 440, w: 70, h: 160, c: '#9bb8d6' },
      { x: 520, w: 40, h: 95, c: '#bcd4e8' }, { x: 570, w: 60, h: 130, c: '#a8c5e0' },
      { x: 640, w: 45, h: 105, c: '#9bb8d6' }, { x: 695, w: 55, h: 145, c: '#bcd4e8' },
      { x: 760, w: 50, h: 115, c: '#a8c5e0' }, { x: 820, w: 65, h: 135, c: '#9bb8d6' },
      { x: 895, w: 50, h: 100, c: '#bcd4e8' }, { x: 955, w: 45, h: 125, c: '#a8c5e0' },
    ];
    // 让远景建筑底部贴到 y=200（viewBox 底）
    return buildings.map(b =>
      `<rect x="${offset + b.x}" y="${200 - b.h}" width="${b.w}" height="${b.h}" fill="${b.c}" stroke="#001858" stroke-width="1.5"/>` +
      `<rect x="${offset + b.x + 5}" y="${205 - b.h}" width="6" height="6" fill="#ffd166" opacity=".7"/>` +
      `<rect x="${offset + b.x + b.w - 11}" y="${205 - b.h}" width="6" height="6" fill="#ffd166" opacity=".7"/>`
    ).join('');
  };
  layer.innerHTML = `<svg viewBox="0 0 2000 200" width="100%" height="100%" preserveAspectRatio="xMidYMax slice">${cityGroup(0)}${cityGroup(1000)}</svg>`;
}

function renderMid(opts = {}) {
  const layer = document.getElementById('layer-mid');
  const node = ROUTE[stageIdx];
  const list = (node && node.midBuildings) ? node.midBuildings : ['tencent'];
  const passed = opts.passed === true;

  /* ===== 时序数学 =====
   * layer-mid width:300% (3000px)，scrollMid 0→-66.67% (2000px), 周期 12s
   * 屏幕中央 SVG x = 500 + (t/12000) × 2000
   */
  const SCROLL_PERIOD_MS = 12000;
  const SCROLL_DELTA = 2000;
  const targetX = (delayMs) => Math.round(500 + (delayMs / SCROLL_PERIOD_MS) * SCROLL_DELTA) - 55;

  // viewBox 3000 高 280（增加高度容纳放大后的大桥）
  let html = '<svg viewBox="0 0 3000 280" width="100%" height="100%" preserveAspectRatio="xMidYMax slice">';
  html += '<rect x="0" y="267" width="3000" height="13" fill="#7a8595" stroke="#001858" stroke-width="2"/>';
  html += '<rect x="0" y="265" width="3000" height="3" fill="#a8b0bc"/>';

  const filler = (x, h, color) => `<rect x="${x}" y="${267 - h}" width="60" height="${h}" fill="${color}" stroke="#001858" stroke-width="1.5"/>` +
    `<rect x="${x + 6}" y="${273 - h}" width="6" height="6" fill="#ffd166"/>` +
    `<rect x="${x + 20}" y="${273 - h}" width="6" height="6" fill="#aac5ff"/>` +
    `<rect x="${x + 34}" y="${273 - h}" width="6" height="6" fill="#ffd166"/>` +
    `<rect x="${x + 48}" y="${273 - h}" width="6" height="6" fill="#aac5ff"/>`;

  const colors = ['#9bb8d6', '#a8c5e0', '#bcd4e8', '#b8a8d6', '#a8b8c5'];

  const isBridgeOnly = list.length === 1 && list[0] === 'qinghe_bridge';

  const animArrivals = arrivalAnimTimes(node);
  const landmarkPositions = list.map((lm, i) => {
    if (passed) return { lm, x: -300 - i * 200, hidden: true };
    const t = animArrivals[i] != null ? animArrivals[i] : (SPACING_MS + i * SPACING_MS);
    return { lm, x: targetX(t) };
  });

  // 普通楼填满 SVG（大桥独占段不放普通楼）
  if (!isBridgeOnly) {
    for (let x = 0; x < 3000; x += 110) {
      const inLandmark = landmarkPositions.some(p => !p.hidden && Math.abs(x - p.x) < 200);
      if (inLandmark) continue;
      const h = 70 + ((x / 110) * 17) % 80;
      const c = colors[Math.floor(x / 110) % colors.length];
      html += filler(x + 20, h, c);
    }
  }

  // 放地标
  // 各地标的缩放系数（鸟巢/水立方单独再放大）+ 中心 x（用于缩放居中校正）
  const LM_SCALE = { birds_nest: 1.45, water_cube: 1.45 };
  const LM_CENTER = { birds_nest: 60, water_cube: 50 };
  landmarkPositions.forEach(({ lm, x, hidden }) => {
    if (hidden) return;
    const svg = LANDMARK_SVG[lm];
    if (!svg) return;
    if (isBridgeOnly && lm === 'qinghe_bridge') {
      // 大桥本身已 800x270 巨大，桥底 svg y=270 → ty = 267-270 = -3
      // 桥中心 svg x=400，让中心对齐目标 (x+55) → tx = (x+55) - 400 = x - 345
      html += `<g transform="translate(${x - 345}, -3)">${svg}</g>`;
    } else {
      // 普通地标缩放：以底部 (y=267) 为锚点，整体从原 y=135 锚点上拉
      // 缩放后中心右移 = center * (scale - 1)，整体 x 减去该值保持中心对齐
      const s = LM_SCALE[lm] || 1.15;
      const cx = LM_CENTER[lm] || 50;
      const offsetX = Math.round(cx * (s - 1));
      html += `<g transform="translate(${x - offsetX}, 267) scale(${s}) translate(0, -135)">${svg}</g>`;
    }
  });

  html += '</svg>';
  layer.innerHTML = html;
}

/* =========== 远景彩蛋层（已废弃，保留空函数避免报错） =========== */
function renderExtras() {
  const layer = document.getElementById('layer-extras');
  if (!layer) return;
  const node = ROUTE[stageIdx];
  const extras = (node && node.extras) ? node.extras : [];
  if (extras.length === 0) {
    layer.innerHTML = '';
    return;
  }

  // viewBox 高 220 = 与远景层一致。地平线在 y=200 附近（远景天际线根部）
  let html = '<svg viewBox="0 0 2000 220" width="100%" height="100%" preserveAspectRatio="xMidYMax slice">';

  const spacing = 2000 / (extras.length + 1);
  extras.forEach((ex, i) => {
    const cx = (i + 1) * spacing - 40;
    const svg = EXTRA_SVG[ex];
    if (!svg) return;

    // 飞过型：高空 y=20-50
    const flyOver = ['plane', 'birds', 'hot_balloon', 'rainbow'];
    let y;
    if (flyOver.includes(ex)) {
      y = 30;
    } else {
      // 地面型：底部贴 y=200（远景天际线根）
      const heights = {
        xishan: 50, xiangshan: 60, yiheyuan: 60,
        baidu_far: 80, cctv_far: 80, guomao_far: 80,
        olympic_tower: 80, drum_tower: 60, ferris_wheel: 70,
        softpark_gate: 24, ice_rink_far: 80
      };
      const h = heights[ex] || 60;
      y = 200 - h;
    }
    html += `<g transform="translate(${cx}, ${y})" opacity=".75">${svg}</g>`;
  });
  html += '</svg>';
  layer.innerHTML = html;
}

function renderNear() {
  const layer = document.getElementById('layer-near');
  // 根据当前段决定路牌指向（始终指向下一个目的地）
  const stageSignages = [
    ['五环', '南向', 'G7'],            // 段0: 出发→五环
    ['北五环', '东向', '肖家河'],       // 段1: 上五环→肖家河
    ['S50', '机场北线', '东向'],        // 段2: 肖家河→S50
    ['清河', '下匝道', '南向'],         // 段3: S50→清河
    ['鸟巢/水立方', '东向', '奥森'],     // 段4: 清河中街→奥体
    ['亚金大厦', '终点 200m', '东向'],   // 段5: 雨过天晴→亚金
    ['亚金大厦', '终点', '到达']        // 段6: 终点
  ];
  const signs = stageSignages[stageIdx] || stageSignages[0];

  let html = '<svg viewBox="0 0 2000 130" width="100%" height="100%" preserveAspectRatio="xMidYMax slice">';
  for (let i = 0; i < 22; i++) {
    const x = i * 95;
    if (i % 3 === 0) {
      // 树（树根落地 y=130）
      html += `<g transform="translate(${x}, 0)">
        <rect x="-4" y="95" width="8" height="35" fill="#5a4030" stroke="#001858" stroke-width="1.5"/>
        <circle cx="0" cy="80" r="24" fill="#7cba6a" stroke="#001858" stroke-width="1.8"/>
        <circle cx="-10" cy="72" r="14" fill="#88c47c"/>
        <circle cx="10" cy="74" r="12" fill="#88c47c"/>
        <circle cx="0" cy="63" r="10" fill="#a0d090"/>
      </g>`;
    } else if (i % 3 === 1) {
      // 路灯（杆底落地 y=130）
      html += `<g transform="translate(${x}, 0)">
        <rect x="-3" y="120" width="6" height="10" fill="#444" stroke="#001858" stroke-width="1.5"/>
        <rect x="-2" y="40" width="4" height="80" fill="#444"/>
        <path d="M -2 40 Q 0 32 8 38" stroke="#444" stroke-width="3" fill="none"/>
        <circle cx="10" cy="40" r="7" fill="#ffd166" stroke="#001858" stroke-width="1.5"/>
        <circle cx="10" cy="40" r="3" fill="#fff"/>
      </g>`;
    } else {
      // 路牌（用当前段对应的标签）
      const label = signs[Math.floor(i / 3) % signs.length];
      html += `<g transform="translate(${x}, 0)">
        <rect x="-2" y="55" width="4" height="75" fill="#666" stroke="#001858" stroke-width="1"/>
        <rect x="-2" y="125" width="20" height="5" fill="#666" stroke="#001858" stroke-width="1.5" rx="1"/>
        <rect x="-30" y="30" width="60" height="26" fill="#06b894" stroke="#001858" stroke-width="2" rx="2"/>
        <text x="0" y="48" fill="#fff" font-size="11" font-weight="800" text-anchor="middle">→ ${label}</text>
      </g>`;
    }
  }
  html += '</svg>';
  layer.innerHTML = html;
}

function renderRoad() {
  const layer = document.getElementById('layer-road');
  let html = `<svg viewBox="0 0 2000 90" width="100%" height="100%" preserveAspectRatio="none"><rect x="0" y="0" width="2000" height="90" fill="#3d3d4e"/>`;
  for (let i = 0; i < 25; i++) html += `<rect x="${i * 80 + 10}" y="40" width="50" height="7" fill="#fff"/>`;
  html += `<rect x="0" y="6" width="2000" height="3" fill="#fff" opacity=".7"/><rect x="0" y="80" width="2000" height="3" fill="#fff" opacity=".7"/></svg>`;
  layer.innerHTML = html;
}

function renderFront() {
  const layer = document.getElementById('layer-front');
  // viewBox 高 40，底部 40 是地面
  let html = '<svg viewBox="0 0 2000 40" width="100%" height="100%" preserveAspectRatio="xMidYMax slice">';
  for (let i = 0; i < 30; i++) {
    const x = i * 70;
    if (i % 4 === 0) {
      // 锥桶（底贴 y=40）
      html += `<g transform="translate(${x}, 0)">
        <rect x="-10" y="37" width="20" height="3" fill="#001858"/>
        <polygon points="0,8 -8,37 8,37" fill="#ff7a00" stroke="#001858" stroke-width="1.5"/>
        <rect x="-9" y="22" width="18" height="3" fill="#fff"/>
      </g>`;
    } else if (i % 4 === 2) {
      // 灌木丛（底贴 y=40）
      html += `<g transform="translate(${x}, 0)">
        <ellipse cx="0" cy="35" rx="20" ry="8" fill="#7cba6a" stroke="#001858" stroke-width="1.5"/>
        <ellipse cx="-12" cy="28" rx="9" ry="7" fill="#88c47c"/>
        <ellipse cx="10" cy="30" rx="8" ry="6" fill="#88c47c"/>
        <ellipse cx="0" cy="22" rx="7" ry="5" fill="#a0d090"/>
      </g>`;
    }
  }
  html += '</svg>';
  layer.innerHTML = html;
}

/* =========== 雨天 =========== */
function setRain(on) {
  const overlay = document.getElementById('rainOverlay');
  if (on) {
    overlay.classList.add('show');
    let html = '';
    for (let i = 0; i < 80; i++) {
      const left = Math.random() * 100;
      const delay = Math.random() * 0.6;
      const dur = 0.4 + Math.random() * 0.4;
      html += `<div class="raindrop" style="left:${left}%; animation-delay:-${delay}s; animation-duration:${dur}s;"></div>`;
    }
    overlay.innerHTML = html;
  } else {
    overlay.classList.remove('show');
    overlay.innerHTML = '';
  }
}

/* =========== 彩虹（雨过天晴） =========== */
function showRainbow() {
  const scene = document.getElementById('scene');
  let rainbow = document.getElementById('rainbow');
  if (!rainbow) {
    rainbow = document.createElement('div');
    rainbow.id = 'rainbow';
    rainbow.className = 'rainbow';
    rainbow.innerHTML = `
      <svg viewBox="0 0 400 200" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <path d="M 20 200 A 180 180 0 0 1 380 200" fill="none" stroke="#d63d4f" stroke-width="8"/>
        <path d="M 28 200 A 172 172 0 0 1 372 200" fill="none" stroke="#ff9966" stroke-width="8"/>
        <path d="M 36 200 A 164 164 0 0 1 364 200" fill="none" stroke="#ffd166" stroke-width="8"/>
        <path d="M 44 200 A 156 156 0 0 1 356 200" fill="none" stroke="#06d6a0" stroke-width="8"/>
        <path d="M 52 200 A 148 148 0 0 1 348 200" fill="none" stroke="#5a8def" stroke-width="8"/>
        <path d="M 60 200 A 140 140 0 0 1 340 200" fill="none" stroke="#a78bfa" stroke-width="8"/>
      </svg>`;
    scene.appendChild(rainbow);
  }
  // 触发淡入动画
  rainbow.classList.remove('show');
  void rainbow.offsetWidth;
  rainbow.classList.add('show');
}

/* =========== 罗盘 =========== */
function updateCompass(angle) {
  document.getElementById('needle').style.transform = `rotate(${angle}deg)`;
}
function compassFlash(red = false) {
  const c = document.getElementById('compass');
  c.classList.add('shake');
  if (red) c.classList.add('red');
  setTimeout(() => c.classList.remove('shake', 'red'), 600);
}

/* =========== UI =========== */
function renderProgress() {
  const wrap = document.getElementById('progress');
  wrap.innerHTML = '';
  for (let i = 0; i < ROUTE.length - 1; i++) {
    const d = document.createElement('div');
    d.className = 'pnode' + (i < stageIdx ? ' done' : i === stageIdx ? ' active' : '');
    wrap.appendChild(d);
  }
  document.getElementById('progressText').textContent = `当前：${ROUTE[stageIdx].name}`;
  const stageEl = document.getElementById('stage');
  if (stageEl) stageEl.textContent = `${Math.min(stageIdx + 1, ROUTE.length)}/${ROUTE.length}`;
}

function showObstacle(text) {
  const el = document.getElementById('obstacle');
  el.textContent = text;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 1500);
}
function showLandmarkHint(landmark) {
  const el = document.getElementById('landmarkHint');
  el.innerHTML = `<span class="emoji">📍</span>路过：${landmark}`;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 1800);
}
function showNodeCard(node) {
  const el = document.getElementById('nodeCard');
  el.innerHTML = `<div class="marker">${node.marker}</div><div class="name">${node.name}</div><div class="label">已到达节点</div>`;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 1500);
}

function startDriving(weather) {
  isDriving = true;
  document.getElementById('scene').classList.add('driving');
  speed = 60 + Math.floor(Math.random() * 25);
  document.getElementById('speed').textContent = speed;

  const node = ROUTE[stageIdx];
  // rainCleared 段：雨已经在 handleChoice 选完路口时停了，这里不再下雨
  if (node && node.rainCleared) {
    setRain(false);
  } else {
    setRain(weather === 'rain');
  }
  document.getElementById('heroCar').innerHTML = svgHeroCar(true);
  if (typeof scanAndKnockout === 'function') scanAndKnockout(document.getElementById('heroCar'));

  // 按真实时间触发打卡（含暂停累计）
  const list = (node && node.midBuildings) || [];
  const realArrivals = arrivalRealTimes(node);
  list.forEach((bid, i) => {
    const cp = checkpointForBuilding(node, bid);
    if (!cp) return;
    setTimeout(() => {
      if (isDriving) showCheckin(cp);
    }, realArrivals[i]);
  });
}

/* =========== 打卡特写：直接用图片 =========== */
function svgTGirlStanding() {
  return `<img class="auto-knockout" src="assets/tina-full.jpg" alt="小T" style="width:100%;height:100%;object-fit:contain;object-position:center bottom;display:block;">`;
}

/* =========== 小L 哭哭：直接用图片 =========== */
function svgGirlLCrying() {
  return `<img class="auto-knockout" src="assets/lily-crying.jpg" alt="小L 哭哭" style="width:200px;height:auto;display:block;margin:0 auto;">`;
}

function showCheckin(checkpoint) {
  const el = document.getElementById('checkin');
  const lmEl = document.getElementById('checkinLandmark');
  const tgEl = document.getElementById('checkinTgirl');
  const titleEl = document.getElementById('checkinTitle');
  const scene = document.getElementById('scene');

  // 把对应地标 SVG 放进打卡相框（不带气泡，单独画大点）
  const lmSvg = LANDMARK_SVG[checkpoint.id] || LANDMARK_SVG.tencent;
  // 套一层独立的 svg 容器，去掉自带的 nameTag（用裁剪 viewBox）
  lmEl.innerHTML = `
    <svg viewBox="-20 -10 160 160" width="200" height="200">
      ${lmSvg.replace(/<g transform="translate\(\d+, -38\)">[\s\S]*?<\/g>/, '')}
    </svg>`;
  tgEl.innerHTML = svgTGirlStanding();
  titleEl.innerHTML = `<span class="stamp">📸 打卡</span>${checkpoint.emoji} ${checkpoint.name}`;

  // 打卡期间：暂停整个场景动画（车 + 所有视差层）
  scene.classList.add('paused');
  el.classList.add('show');
  if (typeof scanAndKnockout === 'function') scanAndKnockout(el);
  setTimeout(() => {
    el.classList.remove('show');
    scene.classList.remove('paused');
  }, 1700);
}

function stopDriving() {
  isDriving = false;
  const scene = document.getElementById('scene');
  const isFinal = ROUTE[stageIdx] && ROUTE[stageIdx].finalLandmark;
  if (isFinal) {
    // 终点段：保留 .driving 类但加 .paused，让画面冻结在亚金到达瞬间
    scene.classList.add('paused');
  } else {
    scene.classList.remove('driving');
  }
  speed = 0;
  document.getElementById('speed').textContent = 0;
  if (landmarkTimer) clearTimeout(landmarkTimer);
  document.getElementById('heroCar').innerHTML = svgHeroCar(false);
  if (typeof scanAndKnockout === 'function') scanAndKnockout(document.getElementById('heroCar'));
  if (!isFinal) {
    renderMid({ passed: true });
  }
}

function showChoice() {
  const node = ROUTE[stageIdx];
  if (!node.question) return;
  document.getElementById('choiceQ').innerHTML = `<span class="where">📍 ${node.name}</span><br>${node.question}`;
  const btns = document.getElementById('choiceBtns');
  btns.innerHTML = '';
  const correctOpt = node.options.find(o => o.correct);
  if (correctOpt) updateCompass(correctOpt.angle);

  node.options.forEach(opt => {
    const b = document.createElement('button');
    b.className = 'choice-btn';
    const arrows = { N: '⬆️', S: '⬇️', E: '➡️', W: '⬅️' };
    b.innerHTML = `<span class="arrow">${arrows[opt.dir] || '🔄'}</span><span class="info"><span class="label-text">${opt.label}</span></span>`;
    b.onclick = () => handleChoice(opt);
    btns.appendChild(b);
  });
}

/* =========== 选择处理 =========== */
function handleChoice(opt) {
  if (!opt.correct) {
    compassFlash(true);
    setTimeout(showLostModal, 300);
    return;
  }
  document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
  const nextNode = ROUTE[stageIdx + 1];
  if (!nextNode) return;

  // rainCleared 段：选完路口立即停雨 + 弹"雨过天晴"标签 + 出彩虹
  if (nextNode.rainCleared) {
    setRain(false);
    showRainbow();
    showObstacle(nextNode.obstacle);
  } else {
    showObstacle(nextNode.obstacle);
  }

  setTimeout(() => {
    stageIdx++;
    distance += [2.0, 2.4, 1.8, 2.6, 2.5, 2.4, 2.3][stageIdx - 1] || 2.0;
    document.getElementById('distance').textContent = distance.toFixed(1);
    renderProgress();
    renderMid();
    startDriving(ROUTE[stageIdx].weather);
  }, 1000);

  // 行驶时长：让所有标志建筑都完整滚过画面，再 +缓冲
  const drivingDuration = stageDuration(ROUTE[stageIdx + 1]);
  const totalDuration = drivingDuration + 1700;

  setTimeout(() => {
    stopDriving();
    showNodeCard(ROUTE[stageIdx]);
    // 不立刻停雨：让雨保留到下一段开始（如果下一段 rainCleared 会处理）
    // 只在下一段是 sunny 且非 rainCleared 时停雨
    const next = ROUTE[stageIdx + 1];
    if (!next || (next.weather !== 'rain' && !next.rainCleared)) {
      setRain(false);
    }
  }, drivingDuration);

  setTimeout(() => {
    // finalLandmark 段直接通关（亚金已在画面中央）
    if (ROUTE[stageIdx] && ROUTE[stageIdx].finalLandmark) {
      showWinModal();
    } else if (stageIdx >= ROUTE.length - 1) {
      showWinModal();
    } else {
      showChoice();
    }
  }, totalDuration);
}

/* =========== 弹窗 =========== */
function svgSelfie() {
  return `
    <div style="position:relative; width:380px; height:300px; border-radius:14px; overflow:hidden; border:3px solid #001858; box-shadow: 4px 4px 0 #001858; margin:0 auto;">
      <!-- 渐变天空（夕阳） -->
      <div style="position:absolute; inset:0; background: linear-gradient(180deg, #ffb88c 0%, #ffd6a5 25%, #ffe8c5 50%, #d4e8c5 78%, #88c47c 100%);"></div>

      <!-- 太阳光晕 -->
      <div style="position:absolute; right:30px; top:40px; width:60px; height:60px; border-radius:50%; background: radial-gradient(circle, #fff5cc 0%, #ffd166 50%, transparent 80%); box-shadow: 0 0 40px rgba(255,209,102,.7);"></div>

      <!-- 飘云 -->
      <svg style="position:absolute; left:0; top:10px;" viewBox="0 0 380 60" width="380" height="60" preserveAspectRatio="none">
        <ellipse cx="60" cy="35" rx="28" ry="8" fill="#fff" opacity=".8"/>
        <ellipse cx="80" cy="30" rx="22" ry="7" fill="#fff" opacity=".8"/>
        <ellipse cx="200" cy="25" rx="32" ry="9" fill="#fff" opacity=".75"/>
        <ellipse cx="220" cy="20" rx="22" ry="7" fill="#fff" opacity=".75"/>
        <ellipse cx="300" cy="40" rx="22" ry="6" fill="#fff" opacity=".7"/>
      </svg>

      <!-- 远景天际线（剪影） -->
      <svg style="position:absolute; left:0; bottom:60px;" viewBox="0 0 380 60" width="380" height="60" preserveAspectRatio="none">
        <rect x="0" y="20" width="32" height="40" fill="#9badc8" opacity=".7"/>
        <rect x="38" y="10" width="26" height="50" fill="#a8b8d0" opacity=".7"/>
        <rect x="70" y="30" width="22" height="30" fill="#b8c4d8" opacity=".7"/>
        <rect x="338" y="18" width="28" height="42" fill="#9badc8" opacity=".7"/>
        <rect x="320" y="28" width="18" height="32" fill="#b8c4d8" opacity=".7"/>
      </svg>

      <!-- 中景：左侧亚金大厦（精致） -->
      <svg style="position:absolute; left:14px; bottom:50px;" viewBox="0 0 70 200" width="70" height="200">
        <defs>
          <linearGradient id="afcGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#c5d8ff"/>
            <stop offset="50%" stop-color="#7aa3e8"/>
            <stop offset="100%" stop-color="#3d4a8a"/>
          </linearGradient>
        </defs>
        <!-- 主楼 -->
        <rect x="6" y="0" width="58" height="200" fill="#3d4a8a" stroke="#001858" stroke-width="2"/>
        <rect x="10" y="4" width="50" height="196" fill="url(#afcGrad)"/>
        <!-- 横向窗格 -->
        ${[...Array(20)].map((_,i) => `<line x1="10" y1="${10+i*10}" x2="60" y2="${10+i*10}" stroke="#fff" stroke-width=".6" opacity=".5"/>`).join('')}
        <!-- 中央竖线 -->
        <line x1="35" y1="4" x2="35" y2="200" stroke="#fff" stroke-width="1" opacity=".6"/>
        <!-- 顶部尖顶 -->
        <polygon points="35,-15 25,0 45,0" fill="#ffd166" stroke="#001858" stroke-width="2"/>
        <circle cx="35" cy="-12" r="2" fill="#d63d4f"/>
        <!-- 楼名牌 -->
        <rect x="14" y="180" width="42" height="14" fill="#001858"/>
        <text x="35" y="190" fill="#ffd166" font-size="8" font-weight="800" text-anchor="middle">AFC</text>
      </svg>

      <!-- 中景：右侧高楼 -->
      <svg style="position:absolute; right:18px; bottom:50px;" viewBox="0 0 60 170" width="60" height="170">
        <defs>
          <linearGradient id="bld2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#e8d4a8"/>
            <stop offset="100%" stop-color="#8b6f4a"/>
          </linearGradient>
        </defs>
        <rect x="4" y="0" width="52" height="170" fill="#5a3a1a" stroke="#001858" stroke-width="2"/>
        <rect x="8" y="4" width="44" height="166" fill="url(#bld2)"/>
        ${[...Array(16)].map((_,i) => [0,1,2].map(c => {
          const lit = (i+c) % 3 === 0;
          return `<rect x="${10+c*15}" y="${10+i*10}" width="11" height="6" fill="${lit?'#fff5cc':'#aac5ff'}" opacity=".85"/>`;
        }).join('')).join('')}
        <!-- 顶部天线 -->
        <rect x="28" y="-12" width="4" height="14" fill="#666"/>
        <circle cx="30" cy="-14" r="2" fill="#d63d4f"/>
      </svg>

      <!-- 旁边小楼 -->
      <div style="position:absolute; left:90px; bottom:50px; width:24px; height:90px; background: linear-gradient(180deg,#aac5ff,#5a8def); border:1.5px solid #001858;"></div>
      <div style="position:absolute; right:88px; bottom:50px; width:28px; height:110px; background: linear-gradient(180deg,#c4a8d8,#7a5a9c); border:1.5px solid #001858;"></div>

      <!-- 草地 + 小花装饰 -->
      <div style="position:absolute; left:0; bottom:0; width:100%; height:50px; background: linear-gradient(180deg, #88c47c 0%, #5fa050 100%); border-top: 2px solid #001858;"></div>
      ${[15, 50, 95, 280, 320, 350].map(x => `<div style="position:absolute; left:${x}px; bottom:30px; width:8px; height:8px; border-radius:50%; background:#f582ae; box-shadow: 0 4px 0 -2px #ffd166, 4px 2px 0 -2px #fff;"></div>`).join('')}
      ${[40, 100, 200, 300].map(x => `<div style="position:absolute; left:${x}px; bottom:5px; font-size:14px;">🌷</div>`).join('')}

      <!-- 路灯 -->
      <svg style="position:absolute; left:108px; bottom:50px;" viewBox="0 0 16 80" width="16" height="80">
        <rect x="6" y="20" width="4" height="60" fill="#444"/>
        <circle cx="8" cy="20" r="6" fill="#ffd166" stroke="#001858" stroke-width="1.5"/>
        <circle cx="8" cy="20" r="3" fill="#fff"/>
      </svg>
      <svg style="position:absolute; right:108px; bottom:50px;" viewBox="0 0 16 80" width="16" height="80">
        <rect x="6" y="20" width="4" height="60" fill="#444"/>
        <circle cx="8" cy="20" r="6" fill="#ffd166" stroke="#001858" stroke-width="1.5"/>
        <circle cx="8" cy="20" r="3" fill="#fff"/>
      </svg>

      <!-- 装饰彩带（顶部洒落） -->
      ${[...Array(10)].map((_,i) => {
        const x = 90 + i*22;
        const y = 4 + (i%3)*7;
        const cs = ['#f582ae','#8bd3dd','#ffd166','#06d6a0','#a78bfa'];
        return `<div style="position:absolute; left:${x}px; top:${y}px; width:8px; height:14px; background:${cs[i%5]}; transform: rotate(${i*30}deg); border:1px solid #001858;"></div>`;
      }).join('')}

      <!-- 主角合影：抠图后的相机自拍图 -->
      <div style="position:absolute; left:50%; bottom:30px; transform:translateX(-50%); width:240px; height:230px; overflow:hidden;">
        <img class="auto-knockout" src="assets/selfie.jpg" style="width:100%; height:100%; object-fit:contain; object-position:center bottom; display:block; filter: drop-shadow(2px 4px 0 rgba(0,24,88,.3));">
      </div>

      <!-- 闪光特效徽章 -->
      <div style="position:absolute; top:8px; left:50%; transform:translateX(-50%); font-size:14px; font-weight:800; color:#d63d4f; background:#fff; padding:4px 16px; border-radius:14px; border:2px solid #001858; white-space:nowrap; box-shadow: 2px 2px 0 #001858; z-index:5;">📸 ✨ 完美合影 ✨</div>
      <div style="position:absolute; top:34px; right:10px; font-size:24px; z-index:5;">🎉</div>
      <div style="position:absolute; bottom:55px; left:8px; font-size:24px; z-index:5;">🎊</div>
    </div>`;
}

function showLostModal() {
  document.getElementById('modalCard').innerHTML = `
    <div style="margin-bottom:14px;">${svgGirlLCrying()}</div>
    <div class="modal-title">😢 小L 哭哭了</div>
    <div class="modal-text">"小T~ 你走错路啦…<br>迷路了，找不到我喽……<br>快看看罗盘重新选！"</div>
    <button class="modal-btn" onclick="closeModal()">重新选择 →</button>
  `;
  document.getElementById('modal').classList.add('show');
  if (typeof scanAndKnockout === 'function') scanAndKnockout(document.getElementById('modal'));
}
function closeModal() {
  document.getElementById('modal').classList.remove('show');
  document.querySelectorAll('.choice-btn').forEach(b => b.disabled = false);
}
function showWinModal() {
  document.getElementById('modalCard').innerHTML = `
    <div style="margin-bottom:14px;">${svgSelfie()}</div>
    <div class="modal-title">🎉 通关！合影留念</div>
    <div class="modal-text">小T 一路开过北京众多地标<br>终于到了亚洲金融大厦和小L 合影 📸<br>
    总里程 <b>${distance.toFixed(1)} km</b> · 完美抵达！</div>
    <button class="modal-btn" onclick="restart()">再玩一次 🔁</button>
  `;
  document.getElementById('modal').classList.add('show');
  if (typeof scanAndKnockout === 'function') scanAndKnockout(document.getElementById('modal'));
}
function restart() {
  stageIdx = 0; distance = 0;
  document.getElementById('distance').textContent = '0.0';
  document.getElementById('modal').classList.remove('show');
  const scene = document.getElementById('scene');
  scene.classList.remove('paused');
  scene.classList.remove('driving');
  const rainbow = document.getElementById('rainbow');
  if (rainbow) rainbow.classList.remove('show');
  setRain(false);
  renderProgress();
  renderMid();
  document.getElementById('heroCar').innerHTML = svgHeroCar(false);
  setTimeout(showChoice, 400);
}

/* =========== 启动 =========== */
function init() {
  // 预处理所有素材的边缘抠图（异步）
  if (typeof preloadKnockout === 'function') preloadKnockout();

  renderClouds();
  renderFar();
  renderMid();
  renderNear();
  renderRoad();
  renderFront();
  document.getElementById('heroCar').innerHTML = svgHeroCar(false);
  if (typeof scanAndKnockout === 'function') scanAndKnockout();
  renderProgress();
  setTimeout(showChoice, 600);
}
init();
