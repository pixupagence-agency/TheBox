const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imgRed = 'C:/Users/denis/.gemini/antigravity-ide/brain/23e430df-6a3b-41bd-a41b-57ec02906b9f/.user_uploaded/media_1792784292797.png';
const imgGreen = 'C:/Users/denis/.gemini/antigravity-ide/brain/23e430df-6a3b-41bd-a41b-57ec02906b9f/.user_uploaded/media_1792784293023.png';
const outputDir = path.join(__dirname, '../public/images/avatars');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function extractAvatar(inputPath, outputFile) {
  const { data, info } = await sharp(inputPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const total = width * height;
  const channels = info.channels;

  const rgba = Buffer.alloc(total * 4);
  const visited = new Uint8Array(total);

  for (let i = 0; i < total; i++) {
    rgba[i * 4] = data[i * channels];
    rgba[i * 4 + 1] = data[i * channels + 1];
    rgba[i * 4 + 2] = data[i * channels + 2];
    rgba[i * 4 + 3] = 255;
  }

  // Exact checkerboard: grey is neutral (R, G, B within 8 of each other)
  // Skin always has R > B by at least 15
  const isCheckerboard = (r, g, b) => {
    const diffRG = Math.abs(r - g);
    const diffGB = Math.abs(g - b);
    const diffRB = Math.abs(r - b);
    const maxDiff = Math.max(diffRG, diffGB, diffRB);
    if (maxDiff <= 8 && r >= 115 && r <= 245) {
      return true;
    }
    return false;
  };

  const queue = [];
  // Seed from top edge
  for (let x = 0; x < width; x++) {
    queue.push(x, 0);
  }
  // Left and right edges
  for (let y = 1; y < height; y++) {
    queue.push(0, y);
    queue.push(width - 1, y);
  }
  // Bottom edges (away from jersey)
  for (let x = 0; x < width * 0.20; x++) {
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

  // Single edge de-fringing pass strictly protecting skin and hair
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
          // Only remove if strictly neutral grey (never skin where r - b > 12)
          if (maxDiff <= 11 && (r - b) < 12 && r >= 115 && r <= 240) {
            rgba[idx * 4 + 3] = 0;
          }
        }
      }
    }
  }

  const destPath = path.join(outputDir, outputFile);
  await sharp(Buffer.from(rgba), { raw: { width, height, channels: 4 } })
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(destPath);

  console.log(`Successfully generated ${outputFile} at ${destPath}`);
}

async function run() {
  await extractAvatar(imgGreen, 'basket_player_green.png');
  await extractAvatar(imgRed, 'basket_opponent_red.png');
}

run().catch(console.error);
