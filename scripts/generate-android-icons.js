import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const svgBuffer = fs.readFileSync(path.join(process.cwd(), 'public/logo.svg'));

const resDir = path.join(process.cwd(), 'android/app/src/main/res');

const iconSizes = [
  { dir: 'mipmap-mdpi', launcher: 48, foreground: 108 },
  { dir: 'mipmap-hdpi', launcher: 72, foreground: 162 },
  { dir: 'mipmap-xhdpi', launcher: 96, foreground: 216 },
  { dir: 'mipmap-xxhdpi', launcher: 144, foreground: 324 },
  { dir: 'mipmap-xxxhdpi', launcher: 192, foreground: 432 },
];

const splashSizes = [
  { dir: 'drawable', width: 512, height: 512 },
  { dir: 'drawable-port-mdpi', width: 320, height: 480 },
  { dir: 'drawable-port-hdpi', width: 480, height: 800 },
  { dir: 'drawable-port-xhdpi', width: 720, height: 1280 },
  { dir: 'drawable-port-xxhdpi', width: 960, height: 1600 },
  { dir: 'drawable-port-xxxhdpi', width: 1280, height: 1920 },
];

async function generateIcons() {
  console.log('Generating Android Icons from public/logo.svg...');

  for (const size of iconSizes) {
    const targetDir = path.join(resDir, size.dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 1. Standard ic_launcher.png
    await sharp(svgBuffer)
      .resize(size.launcher, size.launcher)
      .png()
      .toFile(path.join(targetDir, 'ic_launcher.png'));

    // 2. Round ic_launcher_round.png
    await sharp(svgBuffer)
      .resize(size.launcher, size.launcher)
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_round.png'));

    // 3. Foreground ic_launcher_foreground.png
    // The foreground should fit in the safe zone (middle 66% of 108dp)
    const fgInnerSize = Math.round(size.foreground * 0.65);
    const padding = Math.round((size.foreground - fgInnerSize) / 2);

    const resizedLogo = await sharp(svgBuffer)
      .resize(fgInnerSize, fgInnerSize)
      .toBuffer();

    await sharp({
      create: {
        width: size.foreground,
        height: size.foreground,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{ input: resizedLogo, top: padding, left: padding }])
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));

    console.log(`Generated ${size.dir} icons.`);
  }

  // Generate splash images
  for (const splash of splashSizes) {
    const targetDir = path.join(resDir, splash.dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const logoSize = Math.min(splash.width, splash.height) * 0.45;
    const logoResized = await sharp(svgBuffer)
      .resize(Math.round(logoSize), Math.round(logoSize))
      .toBuffer();

    const top = Math.round((splash.height - logoSize) / 2);
    const left = Math.round((splash.width - logoSize) / 2);

    await sharp({
      create: {
        width: splash.width,
        height: splash.height,
        channels: 4,
        background: { r: 4, g: 120, b: 87, alpha: 1 } // #047857 Emerald Green
      }
    })
      .composite([{ input: logoResized, top, left }])
      .png()
      .toFile(path.join(targetDir, 'splash.png'));

    console.log(`Generated ${splash.dir}/splash.png.`);
  }

  console.log('All Android icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
