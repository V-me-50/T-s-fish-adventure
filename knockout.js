/**
 * 边缘 floodfill 抠图 - 从四角向内扩散，只把"和边缘相连的指定背景色"变透明
 * 头发/眼睛/帽子等图像内部的同色完全保留
 *
 * mode: 'black' (深色背景, RGB 都低于阈值)
 *       'white' (浅色背景, RGB 都高于阈值)
 *       'auto'  (自动通过左上角像素判断)
 */
function knockoutEdgeBlack(imgUrl, callback, opts = {}) {
  const { mode = 'auto', darkThreshold = 60, lightThreshold = 235 } = opts;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const W = canvas.width, H = canvas.height;
    const data = ctx.getImageData(0, 0, W, H);
    const px = data.data;

    // 自动判断背景色：取左上角第一个像素
    let bgMode = mode;
    if (bgMode === 'auto') {
      const r = px[0], g = px[1], b = px[2];
      const avg = (r + g + b) / 3;
      bgMode = avg > 200 ? 'white' : 'black';
    }

    // 判断是否为"接近背景色"的像素
    let isBg;
    if (bgMode === 'white') {
      isBg = (i) => px[i] > lightThreshold && px[i+1] > lightThreshold && px[i+2] > lightThreshold;
    } else {
      isBg = (i) => px[i] < darkThreshold && px[i+1] < darkThreshold && px[i+2] < darkThreshold;
    }

    // BFS 从四边开始扩散
    const visited = new Uint8Array(W * H);
    const stack = [];
    for (let x = 0; x < W; x++) { stack.push(x, 0); stack.push(x, H - 1); }
    for (let y = 0; y < H; y++) { stack.push(0, y); stack.push(W - 1, y); }

    while (stack.length) {
      const y = stack.pop();
      const x = stack.pop();
      if (x < 0 || x >= W || y < 0 || y >= H) continue;
      const idx = y * W + x;
      if (visited[idx]) continue;
      const i = idx * 4;
      if (!isBg(i)) continue;
      visited[idx] = 1;
      px[i + 3] = 0; // 透明
      stack.push(x + 1, y);
      stack.push(x - 1, y);
      stack.push(x, y + 1);
      stack.push(x, y - 1);
    }

    ctx.putImageData(data, 0, 0);
    callback(canvas.toDataURL('image/png'));
  };
  img.onerror = () => callback(imgUrl);
  img.src = imgUrl;
}

const _knockoutCache = {};
function applyKnockout(imgEl) {
  const src = imgEl.dataset.src || imgEl.src;
  if (_knockoutCache[src]) {
    imgEl.src = _knockoutCache[src];
    return;
  }
  imgEl.dataset.src = src;
  knockoutEdgeBlack(src, (dataUrl) => {
    _knockoutCache[src] = dataUrl;
    imgEl.src = dataUrl;
  });
}

function scanAndKnockout(root) {
  (root || document).querySelectorAll('img.auto-knockout').forEach(applyKnockout);
}

function preloadKnockout() {
  ['assets/tina-full.jpg', 'assets/lily-full.jpg', 'assets/tina-head.jpg', 'assets/lily-crying.jpg', 'assets/selfie.jpg'].forEach(src => {
    knockoutEdgeBlack(src, (dataUrl) => {
      _knockoutCache[src] = dataUrl;
    });
  });
}

window._knockoutCache = _knockoutCache;
window.applyKnockout = applyKnockout;
window.scanAndKnockout = scanAndKnockout;
window.preloadKnockout = preloadKnockout;
