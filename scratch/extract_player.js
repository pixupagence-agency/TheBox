const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const inputPath = 'C:/Users/denis/.gemini/antigravity-ide/brain/23e430df-6a3b-41bd-a41b-57ec02906b9f/.user_uploaded/media_1792751448298.jpg';
const outputDir = path.join(__dirname, '../public/images/avatars');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function processAvatar() {
  const { data, info } = await sharp(inputPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const total = width * height;

  const rgba = Buffer.alloc(total * 4);
  const visited = new Uint8Array(total);

  for (let i = 0; i < total; i++) {
    rgba[i * 4] = data[i * 3];
    rgba[i * 4 + 1] = data[i * 3 + 1];
    rgba[i * 4 + 2] = data[i * 3 + 2];
    rgba[i * 4 + 3] = 255;
  }

  const isCheckerboard = (r, g, b) => {
    const diffRG = Math.abs(r - g);
    const diffGB = Math.abs(g - b);
    const diffRB = Math.abs(r - b);
    const maxDiff = Math.max(diffRG, diffGB, diffRB);
    if (maxDiff <= 14 && r >= 115 && r <= 240) {
      return true;
    }
    if (maxDiff <= 20 && r >= 130 && r <= 225) {
      return true;
    }
    return false;
  };

  const queue = [];
  for (let x = 0; x < width; x++) {
    queue.push(x, 0);
  }
  for (let y = 1; y < height; y++) {
    queue.push(0, y);
    queue.push(width - 1, y);
  }
  for (let x = 0; x < width * 0.25; x++) {
    queue.push(Math.floor(x), height - 1);
    queue.push(width - 1 - Math.floor(x), height - 1);
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

    if (isCheckerboard(r, g, b)) {
      rgba[pIdx * 4 + 3] = 0;

      if (x > 0 && !visited[pIdx - 1]) queue.push(x - 1, y);
      if (x < width - 1 && !visited[pIdx + 1]) queue.push(x + 1, y);
      if (y > 0 && !visited[pIdx - width]) queue.push(px = x, py = y - 1);
      if (y < height - 1 && !visited[pIdx + width]) queue.push(px = x, py = y + 1);
    }
  }

  // Lissage & suppression du liseré résiduel
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
          if (maxDiff <= 25 && r >= 120 && r <= 235) {
            rgba[idx * 4 + 3] = 0;
          }
        }
      }
    }
  }

  // 1. JOUEUR PRINCIPAL (Maillot Vert)
  await sharp(Buffer.from(rgba), { raw: { width, height, channels: 4 } })
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(outputDir, 'player_green.png'));
  console.log('player_green.png generated');

  // 2. GARDIEN DE BUT (Maillot Jaune éclatant #facc15 / #eab308)
  // Limiter STRICTEMENT la recoloration au maillot (y >= 540) pour ne JAMAIS toucher les cheveux ni le visage
  const gkRgba = Buffer.from(rgba);
  for (let y = 540; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (gkRgba[i * 4 + 3] > 0) {
        const r = gkRgba[i * 4];
        const g = gkRgba[i * 4 + 1];
        const b = gkRgba[i * 4 + 2];

        // Vert du maillot : G > R ou tons verts/teals
        const isJerseyGreen = (g > r + 8 && g > b - 10) || (g > 65 && b > 55 && g > r && r < 100);
        const isNeonTrim = (g > 140 && b > 120 && r < 110);

        if (isJerseyGreen || isNeonTrim) {
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          // Jaune éclatant avec col et bandes vives
          if (isNeonTrim) {
            gkRgba[i * 4] = 255;
            gkRgba[i * 4 + 1] = 245;
            gkRgba[i * 4 + 2] = 120;
          } else {
            gkRgba[i * 4] = Math.min(255, Math.round(250 * Math.pow(lum, 0.72)));
            gkRgba[i * 4 + 1] = Math.min(255, Math.round(205 * Math.pow(lum, 0.75)));
            gkRgba[i * 4 + 2] = Math.min(255, Math.round(18 * Math.pow(lum, 1.3)));
          }
        }
      }
    }
  }

  await sharp(gkRgba, { raw: { width, height, channels: 4 } })
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(outputDir, 'goalkeeper_yellow.png'));
  console.log('goalkeeper_yellow.png generated');

  // 3. ADVERSAIRE (Maillot Rouge)
  const oppRgba = Buffer.from(rgba);
  for (let y = 540; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (oppRgba[i * 4 + 3] > 0) {
        const r = oppRgba[i * 4];
        const g = oppRgba[i * 4 + 1];
        const b = oppRgba[i * 4 + 2];
        const isJerseyGreen = (g > r + 8 && g > b - 10) || (g > 65 && b > 55 && g > r && r < 100);
        const isNeonTrim = (g > 140 && b > 120 && r < 110);

        if (isJerseyGreen || isNeonTrim) {
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          if (isNeonTrim) {
            oppRgba[i * 4] = 255;
            oppRgba[i * 4 + 1] = 120;
            oppRgba[i * 4 + 2] = 150;
          } else {
            oppRgba[i * 4] = Math.min(255, Math.round(225 * Math.pow(lum, 0.8)));
            oppRgba[i * 4 + 1] = Math.min(255, Math.round(25 * Math.pow(lum, 1.2)));
            oppRgba[i * 4 + 2] = Math.min(255, Math.round(65 * Math.pow(lum, 1.1)));
          }
        }
      }
    }
  }

  await sharp(oppRgba, { raw: { width, height, channels: 4 } })
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(outputDir, 'opponent_red.png'));
  console.log('opponent_red.png generated');
}

processAvatar().catch(console.error);
