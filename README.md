# 🚗 小T摸鱼大冒险

> 一个关于"小T 开车从腾讯北京总部偷偷溜去亚洲金融大厦找小L"的网页互动小游戏。

## 🎮 在线试玩

**[👉 点这里玩](https://v-me-50.github.io/T-s-fish-adventure/)**

## ✨ 玩法

- 🧭 看右上角**智能罗盘**指针方向
- 📍 在每个路口选择正确的方向（基于真实北京地图：腾讯北京总部 → 五环 → 北五环 → S50 清河 → 奥体 → 亚洲金融大厦）
- 🏢 沿途经过**北京真实地标**：腾讯总部 / 北体大 / 清华大学 / 圆明园 / 清河大桥 / 鸟巢 / 水立方 / 清河公园 / 国家会议中心 / 亚洲金融大厦
- 🌧️ 还会遇上雨天打滑、堵车、修路等突发状况
- 🌈 雨过天晴会出现彩虹，最后一段路终点亚金大厦缓缓滚到画面中央
- 😢 走错路 → 小L 哭哭表情 + 文案"迷路了，找不到我喽"
- 🎉 通关 → 小T + 小L 在亚金大厦前合影留念 📸

## 🎨 技术栈

- 纯静态网页，无需任何后端
- HTML / CSS / 原生 JavaScript
- 6 层视差滚动（云 / 远景 / 中景 / 近景 / 路面 / 前景护栏）
- SVG 卡通建筑 + Canvas floodfill 抠图（knockout.js）把真人头像融进车窗

## 📁 文件结构

```
.
├── index.html              # 游戏主页面（GitHub Pages 入口）
├── game-logic.js           # 游戏逻辑
├── knockout.js             # Canvas 边缘 floodfill 抠图
├── assets/                 # 角色素材
│   ├── tina-head.jpg       # 小T 头像（车窗里使用）
│   ├── tina-full.jpg       # 小T 全身（备用）
│   ├── lily-full.jpg       # 小L 全身
│   ├── lily-crying.jpg     # 小L 哭哭表情
│   └── selfie.jpg          # 通关合影
├── version-final.html      # 与 index.html 同源（备份）
├── version-A-pixel.html    # A 版（像素俯视开车，旧版备选）
├── version-B-cartoon.html  # B 版（早期版本）
└── character-design.html   # 角色形象选稿页
```

## 🎯 致小L
> 这游戏专属于你 💕
