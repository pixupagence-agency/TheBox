const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imgGreen = 'C:/Users/denis/.gemini/antigravity-ide/brain/079223df-879e-4cad-bca3-b9c9e600d293/.user_uploaded/media_1793051457604.jpg';
const imgRed = 'C:/Users/denis/.gemini/antigravity-ide/brain/079223df-879e-4cad-bca3-b9c9e600d293/.user_uploaded/media_1793051457674.jpg';
const outputDir = path.join(__dirname, '../public/images/avatars');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function processFile(inputPath, outputFile) {
  const { data, info } = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true });
  const width = info.width, height = info.height, total = width * height, channels = info.channels;
  const rgba = Buffer.alloc(total * 4);

  for (let i = 0; i < total; i++) {
    rgba[i * 4] = data[i * channels];
    rgba[i * 4 + 1] = data[i * channels + 1];
    rgba[i * 4 + 2] = data[i * channels + 2];
    rgba[i * 4 + 3] = 255;
  }

  const isBackgroundPixel = (r, g, b) => {
    // Neutral grey checkerboard or white:
    const diffRG = Math.abs(r - g);
    const diffGB = Math.abs(g - b);
    const diffRB = Math.abs(r - b);
    const maxDiff = Math.max(diffRG, diffGB, diffRB);
    if (maxDiff <= 12 && r >= 105) {
      return true;
    }
    return false;
  };

  const queue = [];
  const visited = new Uint8Array(total);

  // Top edge
  for (let x = 0; x < width; x++) queue.push(x, 0);
  // Left and right edges
  for (let y = 1; y < height; y++) {
    queue.push(0, y);
    queue.push(width - 1, y);
  }

  let head = 0;
  while (head < queue.length) {
    const x = queue[head++];
    const y = queue[head++];
    const pIdx = y * width + x;
    if (visited[pIdx]) continue;
    visited[pIdx] = 1;

    const r = rgba[pIdx * 4];
    const g = rgba[pIdx * 4 + 1];
    const b = rgba[pIdx * 4 + 2];

    if (isBackgroundPixel(r, g, b)) {
      rgba[pIdx * 4 + 3] = 0;
      if (x > 0 && !visited[pIdx - 1]) queue.push(x - 1, y);
      if (x < width - 1 && !visited[pIdx + 1]) queue.push(x + 1, y);
      if (y > 0 && !visited[pIdx - width]) queue.push(x, y - 1);
      if (y < height - 1 && !visited[pIdx + width]) queue.push(x, y + 1);
    }
  }

  // Edge de-fringing passes to remove antialiased grey border halos
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (rgba[idx * 4 + 3] > 0) {
          const tA = rgba[((y - 1) * width + x) * 4 + 3];
          const bA = rgba[((y + 1) * width + x) * 4 + 3];
          const lA = rgba[(y * width + x - 1) * 4 + 3];
          const rA = rgba[(y * width + x + 1) * 4 + 3];

          if (tA === 0 || bA === 0 || lA === 0 || rA === 0) {
            const r = rgba[idx * 4];
            const g = rgba[idx * 4 + 1];
            const b = rgba[idx * 4 + 2];
            const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
            if (maxDiff <= 14 && (r - b) < 14 && r >= 105) {
              rgba[idx * 4 + 3] = 0;
            }
          }
        }
      }
    }
  }

  // Connected component analysis to isolate the player and eliminate any floating specks
  const compVisited = new Uint8Array(total);
  const compQueue = [];
  const startX = Math.floor(width / 2);
  const startY = Math.floor(height * 0.6);
  compQueue.push(startX, startY);
  compVisited[startY * width + startX] = 1;

  let cHead = 0;
  while (cHead < compQueue.length) {
    const x = compQueue[cHead++];
    const y = compQueue[cHead++];
    const neighbors = [
      [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]
    ];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;
        if (!compVisited[nIdx] && rgba[nIdx * 4 + 3] > 0) {
          compVisited[nIdx] = 1;
          compQueue.push(nx, ny);
        }
      }
    }
  }

  for (let i = 0; i < total; i++) {
    if (!compVisited[i]) {
      rgba[i * 4 + 3] = 0;
    }
  }

  const destPath = path.join(outputDir, outputFile);
  const rawPng = await sharp(Buffer.from(rgba), { raw: { width, height, channels: 4 } })
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const finalBuf = rawPng.data;
  for (let i = 0; i < 256 * 256; i++) {
    if (finalBuf[i * 4 + 3] < 20) {
      finalBuf[i * 4 + 3] = 0;
    }
  }

  await sharp(finalBuf, { raw: { width: 256, height: 256, channels: 4 } })
    .png()
    .toFile(destPath);

  console.log('Processed & saved cleanly:', destPath);
}

async function run() {
  await processFile(imgGreen, 'rugby_player_green.png');
  await processFile(imgRed, 'rugby_opponent_red.png');
}

run().catch(console.error);
