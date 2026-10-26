const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imgRed = 'C:/Users/denis/.gemini/antigravity-ide/brain/079223df-879e-4cad-bca3-b9c9e600d293/.user_uploaded/media_1793050933221.png';
const imgGreen = 'C:/Users/denis/.gemini/antigravity-ide/brain/079223df-879e-4cad-bca3-b9c9e600d293/.user_uploaded/media_1793050933284.png';
const outputDir = path.join(__dirname, '../public/images/avatars');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function processFile(inputPath, outputFile, isRedPlayer) {
  const { data, info } = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true });
  const width = info.width, height = info.height, total = width * height, channels = info.channels;
  const rgba = Buffer.alloc(total * 4);

  for (let i = 0; i < total; i++) {
    rgba[i * 4] = data[i * channels];
    rgba[i * 4 + 1] = data[i * channels + 1];
    rgba[i * 4 + 2] = data[i * channels + 2];
    rgba[i * 4 + 3] = 255;
  }

  // If red player: inpaint selection marquee through hair at y=44
  if (isRedPlayer) {
    const y = 44;
    for (let x = 0; x < width; x++) {
      const idxAbove = ((y - 1) * width + x) * 4;
      const idxBelow = ((y + 1) * width + x) * 4;
      const rA = rgba[idxAbove], gA = rgba[idxAbove + 1], bA = rgba[idxAbove + 2];
      const rB = rgba[idxBelow], gB = rgba[idxBelow + 1], bB = rgba[idxBelow + 2];
      if (rA > 110 && (rA - bA) > 25 && rB > 110 && (rB - bB) > 25) {
        const curIdx = (y * width + x) * 4;
        rgba[curIdx] = Math.round((rA + rB) / 2);
        rgba[curIdx + 1] = Math.round((gA + gB) / 2);
        rgba[curIdx + 2] = Math.round((bA + bB) / 2);
      }
    }
  }

  const isBackgroundPixel = (r, g, b) => {
    if (b > 150 && (b - r) > 30) return true;
    if (b > 180 && (b - g) > 20) return true;
    const diffRG = Math.abs(r - g);
    const diffGB = Math.abs(g - b);
    const diffRB = Math.abs(r - b);
    const maxDiff = Math.max(diffRG, diffGB, diffRB);
    if (maxDiff <= 11 && r >= 110) {
      return true;
    }
    return false;
  };

  const queue = [];
  const visited = new Uint8Array(total);

  for (let x = 0; x < width; x++) queue.push(x, 0);
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

  // Edge de-fringing
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
            if ((maxDiff <= 14 && (r - b) < 14 && r >= 105) || (b > 150 && (b - r) > 25)) {
              rgba[idx * 4 + 3] = 0;
            }
          }
        }
      }
    }
  }

  // Connected component analysis
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

async function createGoalkeeperVariants() {
  // 1. Team A Goalkeeper: yellow jersey
  const greenImg = await sharp(path.join(outputDir, 'handball_player_green.png')).raw().toBuffer({ resolveWithObject: true });
  const w = greenImg.info.width, h = greenImg.info.height;
  const dataA = Buffer.from(greenImg.data);

  for (let y = 168; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (dataA[idx + 3] === 0) continue;
      const r = dataA[idx], g = dataA[idx + 1], b = dataA[idx + 2];
      const isSkin = (r > g + 20 && r > b + 15);
      if (!isSkin && (g > r - 8 || (g > 30 && b > 30))) {
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        dataA[idx] = Math.min(255, Math.round(255 * Math.pow(lum, 0.75)));
        dataA[idx + 1] = Math.min(255, Math.round(210 * Math.pow(lum, 0.8)));
        dataA[idx + 2] = Math.min(255, Math.round(25 * Math.pow(lum, 1.3)));
      }
    }
  }

  await sharp(dataA, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toFile(path.join(outputDir, 'handball_goalkeeper_yellow.png'));
  console.log('Generated handball_goalkeeper_yellow.png');

  // 2. Team B Goalkeeper: blue jersey
  const redImg = await sharp(path.join(outputDir, 'handball_opponent_red.png')).raw().toBuffer({ resolveWithObject: true });
  const dataB = Buffer.from(redImg.data);

  for (let y = 172; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (dataB[idx + 3] === 0) continue;
      const r = dataB[idx], g = dataB[idx + 1], b = dataB[idx + 2];
      const isRedJersey = (r > 100 && r > g + 40 && r > b + 40);
      const isYellowTrim = (r > 180 && g > 120 && b < 70);
      if (isRedJersey || isYellowTrim) {
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (isYellowTrim) {
          dataB[idx] = Math.min(255, Math.round(70 * Math.pow(lum, 0.8)));
          dataB[idx + 1] = Math.min(255, Math.round(220 * Math.pow(lum, 0.8)));
          dataB[idx + 2] = 255;
        } else {
          dataB[idx] = Math.min(255, Math.round(20 * Math.pow(lum, 1.2)));
          dataB[idx + 1] = Math.min(255, Math.round(110 * Math.pow(lum, 0.9)));
          dataB[idx + 2] = Math.min(255, Math.round(235 * Math.pow(lum, 0.75)));
        }
      }
    }
  }

  await sharp(dataB, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toFile(path.join(outputDir, 'handball_opponent_goalkeeper.png'));
  console.log('Generated handball_opponent_goalkeeper.png');
}

async function run() {
  await processFile(imgRed, 'handball_opponent_red.png', true);
  await processFile(imgGreen, 'handball_player_green.png', false);
  fs.copyFileSync(path.join(outputDir, 'handball_opponent_red.png'), path.join(outputDir, 'hand_opponent_red.png'));
  fs.copyFileSync(path.join(outputDir, 'handball_player_green.png'), path.join(outputDir, 'hand_player_green.png'));
  await createGoalkeeperVariants();
}

run().catch(console.error);
