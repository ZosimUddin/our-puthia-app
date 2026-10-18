const fs = require('fs');
const path = require('path');

const srcIconPath = path.join(__dirname, '../src/assets/images/puthia_official_icon_logo_1789492926300.jpg');
const srcFullPath = path.join(__dirname, '../src/assets/images/puthia_official_full_logo_1789492909356.jpg');

if (!fs.existsSync(srcIconPath)) {
  console.error('Source icon path not found:', srcIconPath);
  process.exit(1);
}

const iconBuffer = fs.readFileSync(srcIconPath);
const fullBuffer = fs.existsSync(srcFullPath) ? fs.readFileSync(srcFullPath) : iconBuffer;

// Create SVG embedding the exact high-res base64 image data
const base64Icon = iconBuffer.toString('base64');
const embeddedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="data:image/jpeg;base64,${base64Icon}" width="512" height="512" preserveAspectRatio="xMidYMid slice" />
</svg>`;

fs.writeFileSync(path.join(__dirname, '../public/logo.svg'), embeddedSvg);
console.log('✅ Generated public/logo.svg with 100% exact embedded original image');

const copyTargets = [
  'public/logo.png',
  'public/logo.jpg',
  'public/icon-192.png',
  'public/icon-512.png',
  'public/pwa-192x192.png',
  'public/pwa-512x512.png',
  'public/apple-touch-icon.png',
  'public/badge-72x72.png',
  'public/favicon.ico',
  'public/puthia_official_icon_logo.jpg',
  'src/assets/images/puthia_official_icon_logo.jpg',
];

copyTargets.forEach(target => {
  const fullDest = path.join(__dirname, '..', target);
  const dir = path.dirname(fullDest);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullDest, iconBuffer);
  console.log(`Copied original logo to: ${target}`);
});

const fullTargets = [
  'public/puthia_official_full_logo.jpg',
  'src/assets/images/puthia_official_full_logo.jpg',
];

fullTargets.forEach(target => {
  const fullDest = path.join(__dirname, '..', target);
  const dir = path.dirname(fullDest);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullDest, fullBuffer);
  console.log(`Copied full original logo to: ${target}`);
});

console.log('🎉 ALL ORIGINAL LOGO ASSETS RESTORED TO 100% EXACT ORIGINAL IMAGE 2!');
