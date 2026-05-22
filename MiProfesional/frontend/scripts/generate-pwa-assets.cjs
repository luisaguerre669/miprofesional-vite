const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');
const SPLASH_DIR = path.join(PUBLIC_DIR, 'splash');

const BRAND_COLOR = '#0f7a5a';
const SPLASH_BG = '#0f172a';

const ICON_SIZES = [
  { size: 180, name: 'apple-icon-180.png', purpose: 'iOS touch icon' },
  { size: 192, name: 'icon-192.png', purpose: 'PWA manifest' },
  { size: 512, name: 'icon-512.png', purpose: 'PWA manifest' },
];

const SPLASH_SIZES = [
  { width: 640, height: 1136, name: 'apple-splash-640-1136.png', device: 'iPhone 5/SE' },
  { width: 750, height: 1334, name: 'apple-splash-750-1334.png', device: 'iPhone 6/7/8' },
  { width: 828, height: 1792, name: 'apple-splash-828-1792.png', device: 'iPhone XR/11' },
  { width: 1125, height: 2436, name: 'apple-splash-1125-2436.png', device: 'iPhone X/XS/11 Pro' },
  { width: 1242, height: 2688, name: 'apple-splash-1242-2688.png', device: 'iPhone XS Max/11 Pro Max' },
];

function readFavicon() {
  const svgPath = path.join(PUBLIC_DIR, 'favicon.svg');
  if (!fs.existsSync(svgPath)) {
    console.error('Favicon not found at', svgPath);
    process.exit(1);
  }
  return fs.readFileSync(svgPath, 'utf-8');
}

function generateSvgIcon(width, height, sourceSvg) {
  const scale = width / 32;
  const rx = Math.round(6 * scale);
  const fontSize = Math.round(18 * scale);
  const y = Math.round(24 * scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" rx="${rx}" fill="${BRAND_COLOR}"/>
  <text x="${width / 2}" y="${y}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="bold" font-size="${fontSize}" fill="white">MP</text>
</svg>`;
}

function generateSplashSvg(width, height) {
  const logoSize = Math.min(width, height) * 0.25;
  const logoRx = Math.round(logoSize * 0.18);
  const fontSize = Math.round(logoSize * 0.48);
  const textY = Math.round(height / 2 + fontSize * 0.35);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${SPLASH_BG}"/>
  <g transform="translate(${(width - logoSize) / 2}, ${(height - logoSize) / 2})">
    <rect width="${logoSize}" height="${logoSize}" rx="${logoRx}" fill="${BRAND_COLOR}"/>
    <text x="${logoSize / 2}" y="${logoSize * 0.65}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="bold" font-size="${Math.round(logoSize * 0.44)}" fill="white">MP</text>
  </g>
</svg>`;
}

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created ${dir}`);
  }
}

async function generateIcon(size, name, sourceSvg) {
  const svgContent = generateSvgIcon(size, size, sourceSvg);
  const outputPath = path.join(ICONS_DIR, name);
  try {
    await sharp(Buffer.from(svgContent)).png().toFile(outputPath);
    const stat = fs.statSync(outputPath);
    console.log(`  ${name.padEnd(30)} ${size}x${size}  ${(stat.size / 1024).toFixed(1)} KB`);
    return true;
  } catch (err) {
    console.error(`  FAIL ${name}: ${err.message}`);
    return false;
  }
}

async function generateSplash({ width, height, name }) {
  const svgContent = generateSplashSvg(width, height);
  const outputPath = path.join(SPLASH_DIR, name);
  try {
    await sharp(Buffer.from(svgContent)).png().toFile(outputPath);
    const stat = fs.statSync(outputPath);
    console.log(`  ${name.padEnd(30)} ${width}x${height}  ${(stat.size / 1024).toFixed(1)} KB`);
    return true;
  } catch (err) {
    console.error(`  FAIL ${name}: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('\n=== MiProfesional PWA Asset Generator ===\n');

  const sourceSvg = readFavicon();
  console.log(`Source: favicon.svg (${sourceSvg.length} bytes)`);
  console.log(`Brand: ${BRAND_COLOR}, Splash bg: ${SPLASH_BG}\n`);

  await ensureDir(ICONS_DIR);
  await ensureDir(SPLASH_DIR);

  console.log('Generating icons...');
  let iconOk = 0;
  for (const { size, name } of ICON_SIZES) {
    if (await generateIcon(size, name, sourceSvg)) iconOk++;
  }
  console.log(`Icons: ${iconOk}/${ICON_SIZES.length} OK\n`);

  console.log('Generating iOS splash screens...');
  let splashOk = 0;
  for (const s of SPLASH_SIZES) {
    if (await generateSplash(s)) splashOk++;
  }
  console.log(`Splash: ${splashOk}/${SPLASH_SIZES.length} OK\n`);

  console.log('Done.\n');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
