const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const inputPath = 'C:/Users/denis/.gemini/antigravity-ide/brain/23e430df-6a3b-41bd-a41b-57ec02906b9f/.user_uploaded/media_1792755970720.jpg';
const outputDir = path.join(__dirname, '../public/images/avatars');

async function processOpponentAvatar() {
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

  // Damier JPEG neutre : maxDiff <= 9, tout en protégeant la peau
  const isCheckerboard = (r, g, b) => {
    const diffRG = Math.abs(r - g);
    const diffGB = Math.abs(g - b);
    const diffRB = Math.abs(r - b);
    const maxDiff = Math.max(diffRG, diffGB, diffRB);
    if (maxDiff <= 9 && r >= 115 && r <= 245) {
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
      if (y > 0 && !visited[pIdx - width]) queue.push(x, y - 1);
      if (y < height - 1 && !visited[pIdx + width]) queue.push(x, y + 1);
    }
  }

  // Lissage & élimination des pixels résiduels isolés
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
          if (maxDiff <= 11 && r >= 115 && r <= 245) {
            rgba[idx * 4 + 3] = 0;
          }
        }
      }
    }
  }

  // 1. JOUEUR ADVERSE (Maillot Rouge bordeaux d'origine, fond 100% transparent)
  await sharp(Buffer.from(rgba), { raw: { width, height, channels: 4 } })
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(outputDir, 'opponent_red.png'));
  console.log('opponent_red.png updated');

  // 2. GARDIEN ADVERSE (Maillot Bleu Cyan / Roi pour contraster, visage et cou 100% intacts)
  const oppGkRgba = Buffer.from(rgba);
  for (let y = 600; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Courbe du col en V (775 au centre, 615 aux épaules)
      const collarY = 775 - 0.0053 * Math.pow(x - 512, 2);
      if (y < collarY) continue;

      const i = y * width + x;
      if (oppGkRgba[i * 4 + 3] > 0) {
        const r = oppGkRgba[i * 4];
        const g = oppGkRgba[i * 4 + 1];
        const b = oppGkRgba[i * 4 + 2];

        // Liseré or (bordures et logo) vs tissu
        const isGoldTrim = (r > 150 && g > 110 && b < 100);
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        if (isGoldTrim) {
          oppGkRgba[i * 4] = 120;
          oppGkRgba[i * 4 + 1] = 235;
          oppGkRgba[i * 4 + 2] = 255;
        } else {
          // Teinte Bleu Roi / Cyan intense
          oppGkRgba[i * 4] = Math.min(255, Math.round(15 * Math.pow(lum, 1.2)));
          oppGkRgba[i * 4 + 1] = Math.min(255, Math.round(135 * Math.pow(lum, 0.85)));
          oppGkRgba[i * 4 + 2] = Math.min(255, Math.round(245 * Math.pow(lum, 0.75)));
        }
      }
    }
  }

  await sharp(oppGkRgba, { raw: { width, height, channels: 4 } })
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(outputDir, 'opponent_goalkeeper.png'));
  console.log('opponent_goalkeeper.png updated');
}

processOpponentAvatar().catch(console.error);
