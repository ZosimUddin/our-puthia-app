const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const svgPath = path.join(__dirname, '../public/logo.svg');
const svgBuffer = fs.readFileSync(svgPath);

function renderPng(width, outputPath) {
  const resvg = new Resvg(svgBuffer, {
    fitTo: {
      mode: 'width',
      value: width,
    },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  fs.writeFileSync(outputPath, pngBuffer);
  console.log(`Generated: ${outputPath} (${width}x${width})`);
}

const targets = [
  { width: 512, path: 'public/logo.png' },
  { width: 192, path: 'public/icon-192.png' },
  { width: 512, path: 'public/icon-512.png' },
  { width: 192, path: 'public/pwa-192x192.png' },
  { width: 512, path: 'public/pwa-512x512.png' },
  { width: 180, path: 'public/apple-touch-icon.png' },
  { width: 72,  path: 'public/badge-72x72.png' },
  { width: 64,  path: 'public/favicon.ico' },
  { width: 512, path: 'public/puthia_official_icon_logo.jpg' },
  { width: 512, path: 'public/puthia_official_full_logo.jpg' },
  { width: 512, path: 'src/assets/images/puthia_official_icon_logo.jpg' },
  { width: 512, path: 'src/assets/images/puthia_official_full_logo.jpg' },
];

targets.forEach(t => {
  const dir = path.dirname(t.path);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  renderPng(t.width, t.path);
});

console.log('✅ All logo PNG assets generated successfully from official logo.svg!');
