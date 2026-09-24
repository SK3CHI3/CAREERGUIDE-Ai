import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputLogo = join(__dirname, '..', 'public', 'logos', 'CareerGuide_Logo.png');
const outputDir = join(__dirname, '..', 'public', 'logos');

const THEME_COLOR = '#1d4ed8'; // Blue from manifest
const SIZES = [192, 512];

async function generatePWAIcons() {
  console.log('Generating PWA icons...\n');

  for (const size of SIZES) {
    const outputPath = join(outputDir, `icon-${size}x${size}.png`);
    
    // Create a square canvas with theme color background
    const canvas = sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: THEME_COLOR
      }
    });

    // Calculate logo size (70% of canvas to leave padding)
    const logoSize = Math.floor(size * 0.7);
    const padding = Math.floor((size - logoSize) / 2);

    // Resize the logo to fit within the square while maintaining aspect ratio
    const resizedLogo = await sharp(inputLogo)
      .resize(logoSize, logoSize, {
        fit: 'inside',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();

    // Composite the logo onto the canvas
    await canvas
      .composite([{
        input: resizedLogo,
        left: padding,
        top: padding
      }])
      .png()
      .toFile(outputPath);

    console.log(`✓ Generated ${size}x${size} icon: ${outputPath}`);
  }

  console.log('\n✓ PWA icons generated successfully!');
  console.log('\nNext steps:');
  console.log('1. Update manifest.json and vite.config.ts to use the new icon files');
  console.log('2. Commit the new icons');
  console.log('3. Push and test PWA installation');
}

generatePWAIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
