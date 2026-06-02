/* =========== 路线节点 + 沿途地标 =========== */
const ROUTE = [
  {
    name: '腾讯北京总部', marker: '🏢',
    obstacle: '🚗 出发！系好安全带~',
    landmarks: ['腾讯北京总部', '中关村软件园', '后厂村路'],
    // 多个打卡点：先打卡腾讯总部，再打卡小米
    checkpoints: [
      { id: 'tencent', name: '腾讯北京总部', emoji: '💜', delay: 1500 },
      { id: 'xiaomi', name: '小米科技园', emoji: '🧡', delay: 3500 }
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
    landmarks: ['百度大厦', 'G7 京新高速', '永丰科技园'],
    checkpoints: [{ id: 'baidu', name: '百度大厦', emoji: '🔍', delay: 2200 }],
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
    landmarks: ['北京体育大学', '肖家河大桥', '清华园方向'],
    checkpoints: [{ id: 'bsu', name: '北京体育大学', emoji: '⚽', delay: 2200 }],
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
    landmarks: ['圆明园遗址', '清华大学', '国家速滑馆'],
    // 这段最长，给两个打卡：清华 + 圆明园
    checkpoints: [
      { id: 'qinghua', name: '清华大学', emoji: '🎓', delay: 1500 },
      { id: 'yuanmingyuan', name: '圆明园遗址', emoji: '🏛️', delay: 3500 }
    ],
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
    landmarks: ['国家会议中心', '清河永泰庄', '小米科技园'],
    checkpoints: [{ id: 'ice_rink', name: '国家速滑馆冰丝带', emoji: '⛸️', delay: 2200 }],
    weather: 'rain',
    question: '快到了，下匝道往哪？',
    options: [
      { dir: 'S', label: '南下下匝道',   correct: true, angle: 180 },
      { dir: 'E', label: '继续 S50 东',  correct: false, angle: 90 }
    ]
  },
  {
    name: '清河 · 双泉堡', marker: '🚓',
    obstacle: '🚓 临时检查站',
    landmarks: ['鸟巢国家体育场', '水立方', '奥森公园'],
    checkpoints: [{ id: 'birds_nest', name: '国家体育场鸟巢', emoji: '🏟️', delay: 2200 }],
    weather: 'sunny',
    question: '清河区域内，往金融大厦？',
    options: [
      { dir: 'E', label: '东行进国家会议', correct: true, angle: 90 },
      { dir: 'S', label: '南下中关村',     correct: false, angle: 180 },
      { dir: 'W', label: '西行上清路',     correct: false, angle: 270 }
    ]
  },
  {
    name: '亚洲金融大厦', marker: '🎉',
    obstacle: '🎉 抵达终点！',
    landmarks: [], weather: 'sunny',
    checkpoints: [],
    question: null, options: []
  }
];

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
        <img src="assets/tina-head.jpg" alt="小T">
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

  // 鸟巢 - 国家体育场
  birds_nest: `
    <g>
      ${nameTag(60, '鸟巢', 60)}
      <!-- 椭圆主体 -->
      <ellipse cx="60" cy="100" rx="58" ry="22" fill="#ccc" stroke="#001858" stroke-width="2.5"/>
      <ellipse cx="60" cy="100" rx="50" ry="18" fill="#888"/>
      <!-- 主结构 -->
      <path d="M 5 100 Q 60 50 115 100" fill="#a8a8a8" stroke="#001858" stroke-width="2.5"/>
      <!-- 钢架交错 -->
      <path d="M 12 95 L 30 60 M 22 92 L 45 55 M 35 88 L 60 53 M 50 86 L 75 55 M 65 87 L 90 60 M 80 92 L 100 65 M 92 96 L 108 75" stroke="#444" stroke-width="2" stroke-linecap="round"/>
      <path d="M 18 70 L 40 85 M 35 60 L 60 78 M 55 53 L 80 73 M 75 60 L 100 80" stroke="#666" stroke-width="1.5" stroke-linecap="round"/>
      <!-- 底座 -->
      <rect x="0" y="115" width="120" height="20" fill="#666" stroke="#001858" stroke-width="2"/>
    </g>`,

  // 水立方
  water_cube: `
    <g>
      ${nameTag(45, '水立方', 70)}
      <rect x="0" y="20" width="90" height="115" fill="#5fb3e8" stroke="#001858" stroke-width="2.5" opacity=".95"/>
      <!-- 气泡纹理 -->
      ${[0,1,2,3,4,5].map(r => [0,1,2,3].map(c => {
        const cx = 12+c*22 + (r%2)*11;
        if (cx > 80) return '';
        return `<circle cx="${cx}" cy="${30+r*17}" r="${5+Math.random()*2}" fill="#aac5ff" opacity=".7" stroke="#fff" stroke-width="1"/>`;
      }).join('')).join('')}
      ${[0,1,2,3].map(r => [0,1,2].map(c => {
        const cx = 22+c*22;
        return `<circle cx="${cx}" cy="${38+r*22}" r="3" fill="#fff" opacity=".5"/>`;
      }).join('')).join('')}
      <!-- 屋顶 -->
      <rect x="0" y="14" width="90" height="6" fill="#001858"/>
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
      ${nameTag(55, '圆明园', 70)}
      <!-- 山丘草地 -->
      <path d="M 0 110 Q 30 80 55 110 Q 80 85 110 110 L 110 135 L 0 135 Z" fill="#88c47c" stroke="#001858" stroke-width="2.5"/>
      <!-- 大水法石柱（残柱） -->
      <rect x="40" y="55" width="8" height="55" fill="#d4cfc8" stroke="#001858" stroke-width="2"/>
      <rect x="36" y="50" width="16" height="8" fill="#a8a8a8" stroke="#001858" stroke-width="1.5"/>
      <rect x="38" y="46" width="12" height="6" fill="#888"/>
      <!-- 第二根残柱 -->
      <rect x="62" y="68" width="6" height="42" fill="#d4cfc8" stroke="#001858" stroke-width="2"/>
      <rect x="58" y="63" width="14" height="7" fill="#a8a8a8" stroke="#001858" stroke-width="1.5"/>
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

function renderMid() {
  const layer = document.getElementById('layer-mid');
  let landmarks = [];
  if (stageIdx <= 1) landmarks = ['tencent', 'baidu', 'xiaomi', 'tencent', 'xiaomi', 'baidu', 'tencent', 'xiaomi'];
  else if (stageIdx === 2) landmarks = ['bsu', 'qinghua', 'baidu', 'bsu', 'qinghua', 'baidu', 'bsu', 'qinghua'];
  else if (stageIdx === 3) landmarks = ['qinghua', 'yuanmingyuan', 'ice_rink', 'qinghua', 'ice_rink', 'yuanmingyuan', 'qinghua', 'ice_rink'];
  else if (stageIdx === 4) landmarks = ['ice_rink', 'water_cube', 'conv_center', 'water_cube', 'ice_rink', 'conv_center', 'ice_rink', 'water_cube'];
  else if (stageIdx === 5) landmarks = ['birds_nest', 'water_cube', 'cctv', 'birds_nest', 'cctv', 'water_cube', 'birds_nest', 'cctv'];
  else landmarks = ['cctv', 'asia_finance', 'cctv', 'asia_finance', 'cctv', 'asia_finance', 'cctv', 'asia_finance'];

  // viewBox 高 240，底部 245 处画一条人行道色带让建筑"落地"
  // 建筑组 translate(x, 100) → 建筑顶在 100，底约 100+135=235，气泡在 100-38=62 处显示
  let html = '<svg viewBox="0 0 2000 245" width="100%" height="100%" preserveAspectRatio="xMidYMax slice">';
  // 人行道底色（建筑根基）
  html += '<rect x="0" y="232" width="2000" height="13" fill="#7a8595" stroke="#001858" stroke-width="2"/>';
  html += '<rect x="0" y="230" width="2000" height="3" fill="#a8b0bc"/>';

  const spacing = 2000 / landmarks.length;
  landmarks.forEach((lm, i) => {
    const x = i * spacing + (spacing - 110) / 2;
    const svg = LANDMARK_SVG[lm] || LANDMARK_SVG.tencent;
    html += `<g transform="translate(${x}, 97)">${svg}</g>`;
  });
  html += '</svg>';
  layer.innerHTML = html;
}

function renderNear() {
  const layer = document.getElementById('layer-near');
  // viewBox 高 130，底部 130 是地面，所有元素贴在 y=130 落地
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
      // 路牌（杆底落地 y=130）
      const labels = ['五环','S50','清河','金融街','北京','亚金'];
      html += `<g transform="translate(${x}, 0)">
        <rect x="-2" y="55" width="4" height="75" fill="#666" stroke="#001858" stroke-width="1"/>
        <rect x="-2" y="125" width="20" height="5" fill="#666" stroke="#001858" stroke-width="1.5" rx="1"/>
        <rect x="-26" y="30" width="52" height="26" fill="#06b894" stroke="#001858" stroke-width="2" rx="2"/>
        <text x="0" y="48" fill="#fff" font-size="12" font-weight="800" text-anchor="middle">→ ${labels[i % 6]}</text>
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
  setRain(weather === 'rain');
  document.getElementById('heroCar').innerHTML = svgHeroCar(true);

  // 在驾驶途中弹出"打卡特写"，支持多个打卡点
  const checkpoints = (ROUTE[stageIdx] && ROUTE[stageIdx].checkpoints) || [];
  checkpoints.forEach(cp => {
    setTimeout(() => {
      if (isDriving) showCheckin(cp);
    }, cp.delay || 2200);
  });
}

/* =========== 打卡特写：直接用图片 =========== */
function svgTGirlStanding() {
  return `<img src="assets/tina-full.jpg" alt="小T" style="width:100%;height:100%;object-fit:cover;object-position:center top;display:block;">`;
}

/* =========== 小L 哭哭：直接用图片 =========== */
function svgGirlLCrying() {
  return `<img src="assets/lily-crying.jpg" alt="小L 哭哭" style="width:200px;height:auto;border-radius:14px;border:3px solid #001858;display:block;margin:0 auto;">`;
}

function showCheckin(checkpoint) {
  const el = document.getElementById('checkin');
  const lmEl = document.getElementById('checkinLandmark');
  const tgEl = document.getElementById('checkinTgirl');
  const titleEl = document.getElementById('checkinTitle');

  // 把对应地标 SVG 放进打卡相框（不带气泡，单独画大点）
  const lmSvg = LANDMARK_SVG[checkpoint.id] || LANDMARK_SVG.tencent;
  // 套一层独立的 svg 容器，去掉自带的 nameTag（用裁剪 viewBox）
  lmEl.innerHTML = `
    <svg viewBox="-20 -10 160 160" width="200" height="200">
      ${lmSvg.replace(/<g transform="translate\(\d+, -38\)">[\s\S]*?<\/g>/, '')}
    </svg>`;
  tgEl.innerHTML = svgTGirlStanding();
  titleEl.innerHTML = `<span class="stamp">📸 打卡</span>${checkpoint.emoji} ${checkpoint.name}`;

  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 1700);
}

function stopDriving() {
  isDriving = false;
  document.getElementById('scene').classList.remove('driving');
  speed = 0;
  document.getElementById('speed').textContent = 0;
  if (landmarkTimer) clearTimeout(landmarkTimer);
  document.getElementById('heroCar').innerHTML = svgHeroCar(false);
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

  showObstacle(nextNode.obstacle);

  setTimeout(() => {
    stageIdx++;
    distance += [2.0, 2.4, 1.8, 2.6, 2.5, 2.4, 2.3][stageIdx - 1] || 2.0;
    document.getElementById('distance').textContent = distance.toFixed(1);
    renderProgress();
    renderMid();
    startDriving(ROUTE[stageIdx].weather);
  }, 1000);

  // 行驶时长根据打卡点数量动态调整
  const cps = (ROUTE[stageIdx + 1] && ROUTE[stageIdx + 1].checkpoints) || [];
  const drivingDuration = cps.length >= 2 ? 6500 : 5500;
  const totalDuration = drivingDuration + 1700;

  setTimeout(() => {
    stopDriving();
    showNodeCard(ROUTE[stageIdx]);
    setRain(false);
  }, drivingDuration);

  setTimeout(() => {
    if (stageIdx >= ROUTE.length - 1) {
      showWinModal();
    } else {
      showChoice();
    }
  }, totalDuration);
}

/* =========== 弹窗 =========== */
function svgSelfie() {
  return `
    <div style="position:relative; width:380px; height:240px; border-radius:12px; overflow:hidden; border:3px solid #001858; box-shadow: 4px 4px 0 #001858; margin:0 auto;">
      <!-- 背景 -->
      <div style="position:absolute; inset:0; background: linear-gradient(180deg, #ffd166 0%, #fef6e4 60%, #88c47c 100%);"></div>

      <!-- 亚金大厦剪影（最左） -->
      <svg style="position:absolute; left:6px; top:30px;" viewBox="0 0 60 200" width="60" height="200">
        <rect x="0" y="0" width="60" height="200" fill="#3d4a8a" stroke="#001858" stroke-width="2"/>
        <rect x="5" y="5" width="50" height="190" fill="url(#gfin3)"/>
        <defs><linearGradient id="gfin3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#aac5ff"/><stop offset="100%" stop-color="#5a8def"/></linearGradient></defs>
        ${[20,35,50,65,80,95,110,125,140,155,170,185].map(y => `<line x1="5" y1="${y}" x2="55" y2="${y}" stroke="#fff" stroke-width=".6" opacity=".6"/>`).join('')}
        <line x1="30" y1="5" x2="30" y2="195" stroke="#fff" stroke-width="1" opacity=".7"/>
        <polygon points="30,-12 22,0 38,0" fill="#ffd166" stroke="#001858" stroke-width="2"/>
        <text x="30" y="195" fill="#ffd166" font-size="9" font-weight="800" text-anchor="middle">亚金</text>
      </svg>

      <!-- 远处楼（最右） -->
      <div style="position:absolute; right:8px; top:50px; width:36px; height:170px; background:#9bb8d6; border:1.5px solid #001858;"></div>

      <!-- 装饰彩带 -->
      ${[...Array(10)].map((_,i) => {
        const x = 100 + i*18;
        const y = 4 + (i%3)*8;
        const cs = ['#f582ae','#8bd3dd','#ffd166','#06d6a0','#a78bfa'];
        return `<div style="position:absolute; left:${x}px; top:${y}px; width:8px; height:14px; background:${cs[i%5]}; transform: rotate(${i*30}deg);"></div>`;
      }).join('')}

      <!-- 小T 真人图（左中） -->
      <div style="position:absolute; left:80px; bottom:0; width:115px; height:185px; overflow:hidden; border-radius:6px 6px 0 0; border:2px solid #001858; border-bottom:none; background:#fff;">
        <img src="assets/tina-full.jpg" style="width:135%; height:100%; object-fit:cover; object-position:center top; margin-left:-15%;">
      </div>

      <!-- 小L 真人图（右中，与小T 间隔 10px） -->
      <div style="position:absolute; left:205px; bottom:0; width:115px; height:185px; overflow:hidden; border-radius:6px 6px 0 0; border:2px solid #001858; border-bottom:none; background:#fff;">
        <img src="assets/lily-full.jpg" style="width:135%; height:100%; object-fit:cover; object-position:center top; margin-left:-15%;">
      </div>

      <!-- 闪光特效 -->
      <div style="position:absolute; top:8px; left:50%; transform:translateX(-50%); font-size:14px; font-weight:800; color:#d63d4f; background:#fff; padding:3px 14px; border-radius:14px; border:2px solid #001858; white-space:nowrap; box-shadow: 2px 2px 0 #001858;">📸 ✨ 合影 ✨</div>
      <div style="position:absolute; top:30px; right:10px; font-size:22px;">🎉</div>
      <div style="position:absolute; bottom:6px; left:6px; font-size:22px;">🎊</div>
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
}
function restart() {
  stageIdx = 0; distance = 0;
  document.getElementById('distance').textContent = '0.0';
  document.getElementById('modal').classList.remove('show');
  renderProgress();
  renderMid();
  document.getElementById('heroCar').innerHTML = svgHeroCar(false);
  setTimeout(showChoice, 400);
}

/* =========== 启动 =========== */
function init() {
  renderClouds();
  renderFar();
  renderMid();
  renderNear();
  renderRoad();
  renderFront();
  document.getElementById('heroCar').innerHTML = svgHeroCar(false);
  renderProgress();
  setTimeout(showChoice, 600);
}
init();
