import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// The Box SVG Logo definition with dark background and vibrant emerald branding
const generateSvg = (size, safePaddingPercent = 0.20) => {
  const boxSize = size * (1 - safePaddingPercent * 2);
  const offset = size * safePaddingPercent;

  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#06090e" />
    </radialGradient>
    <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bgGrad)" />

  <!-- The Box Vector Logo centered in safe area -->
  <g transform="translate(${offset}, ${offset}) scale(${boxSize / 100})">
    <!-- Subtle glow ring -->
    <circle cx="50" cy="50" r="44" stroke="#00E599" stroke-width="3" stroke-opacity="0.3" filter="url(#emeraldGlow)" fill="none" />
    
    <!-- Outer circle -->
    <circle cx="50" cy="50" r="44" stroke="#00E599" stroke-width="6.5" fill="none" />
    
    <!-- Diagonal cross lines -->
    <path d="M 19 19 L 81 81" stroke="#00E599" stroke-width="6.5" stroke-linecap="square" />
    <path d="M 81 19 L 19 81" stroke="#00E599" stroke-width="6.5" stroke-linecap="square" />
    
    <!-- Tactical arrows -->
    <path d="M 32 21 L 50 39 L 68 21" stroke="#00E599" stroke-width="6" fill="none" stroke-linecap="square" stroke-linejoin="miter" />
    <path d="M 32 79 L 50 61 L 68 79" stroke="#00E599" stroke-width="6" fill="none" stroke-linecap="square" stroke-linejoin="miter" />
    <path d="M 21 32 L 39 50 L 21 68" stroke="#00E599" stroke-width="6" fill="none" stroke-linecap="square" stroke-linejoin="miter" />
    <path d="M 79 32 L 61 50 L 79 68" stroke="#00E599" stroke-width="6" fill="none" stroke-linecap="square" stroke-linejoin="miter" />
  </g>
</svg>`;
};

// Maskable version (full bleed background, no rounded corners on rect so OS clips properly)
const generateMaskableSvg = (size) => {
  const safePaddingPercent = 0.22; // Android maskable safe zone is inner 66%
  const boxSize = size * (1 - safePaddingPercent * 2);
  const offset = size * safePaddingPercent;

  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#06090e" />
    </radialGradient>
  </defs>

  <!-- Full bleed Background for OS masking -->
  <rect width="${size}" height="${size}" fill="url(#bgGrad)" />

  <!-- The Box Vector Logo centered in safe area -->
  <g transform="translate(${offset}, ${offset}) scale(${boxSize / 100})">
    <circle cx="50" cy="50" r="44" stroke="#00E599" stroke-width="6.5" fill="none" />
    <path d="M 19 19 L 81 81" stroke="#00E599" stroke-width="6.5" stroke-linecap="square" />
    <path d="M 81 19 L 19 81" stroke="#00E599" stroke-width="6.5" stroke-linecap="square" />
    <path d="M 32 21 L 50 39 L 68 21" stroke="#00E599" stroke-width="6" fill="none" stroke-linecap="square" stroke-linejoin="miter" />
    <path d="M 32 79 L 50 61 L 68 79" stroke="#00E599" stroke-width="6" fill="none" stroke-linecap="square" stroke-linejoin="miter" />
    <path d="M 21 32 L 39 50 L 21 68" stroke="#00E599" stroke-width="6" fill="none" stroke-linecap="square" stroke-linejoin="miter" />
    <path d="M 79 32 L 61 50 L 79 68" stroke="#00E599" stroke-width="6" fill="none" stroke-linecap="square" stroke-linejoin="miter" />
  </g>
</svg>`;
};

async function buildIcons() {
  const publicDir = path.resolve(process.cwd(), 'public');

  console.log('Generating PWA icons with The Box logo...');

  // 1. 512x512 standard
  const svg512 = generateSvg(512);
  await sharp(Buffer.from(svg512))
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Created public/pwa-512x512.png');

  // 2. 192x192 standard
  const svg192 = generateSvg(192);
  await sharp(Buffer.from(svg192))
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Created public/pwa-192x192.png');

  // 3. Apple Touch Icon 180x180
  const svg180 = generateSvg(180, 0.16);
  await sharp(Buffer.from(svg180))
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created public/apple-touch-icon.png');

  // 4. 512x512 maskable for Android PWA
  const svgMaskable = generateMaskableSvg(512);
  await sharp(Buffer.from(svgMaskable))
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Created public/pwa-maskable-512x512.png');

  console.log('All PWA icons generated successfully!');
}

buildIcons().catch(console.error);
