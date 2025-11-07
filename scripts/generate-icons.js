const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [
  { size: 57, name: 'icon-57x57.png' },
  { size: 60, name: 'icon-60x60.png' },
  { size: 72, name: 'icon-72x72.png' },
  { size: 76, name: 'icon-76x76.png' },
  { size: 114, name: 'icon-114x114.png' },
  { size: 120, name: 'icon-120x120.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 180, name: 'icon-180x180.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' },
];

const inputSvg = path.join(__dirname, '../public/logo2.svg');
const outputDir = path.join(__dirname, '../public/icons');

// Crear directorio de iconos si no existe
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  console.log('🎨 Generando iconos PNG desde logo2.svg...\n');

  try {
    for (const { size, name } of sizes) {
      const outputPath = path.join(outputDir, name);
      
      // Primero redimensionar el SVG con color negro explícito, luego crear canvas blanco y superponer
      // Leer el SVG y reemplazar currentColor con negro
      const svgContent = fs.readFileSync(inputSvg, 'utf8');
      const svgWithBlackFill = svgContent.replace(/fill="currentColor"/g, 'fill="#000000"');
      
      const resizedSvg = await sharp(Buffer.from(svgWithBlackFill))
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .toBuffer();

      // Crear un canvas blanco y superponer el logo redimensionado
      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      })
        .composite([
          {
            input: resizedSvg,
            top: 0,
            left: 0,
            blend: 'over'
          }
        ])
        .flatten({ background: { r: 255, g: 255, b: 255 } }) // Asegurar fondo blanco sólido
        .png({ 
          quality: 100,
          compressionLevel: 9,
          adaptiveFiltering: true,
          force: true
        })
        .toFile(outputPath);

      console.log(`✅ Generado: ${name} (${size}x${size})`);
    }

    console.log('\n✨ ¡Todos los iconos han sido generados exitosamente!');
    console.log(`📁 Ubicación: ${outputDir}`);
  } catch (error) {
    console.error('❌ Error al generar iconos:', error);
    process.exit(1);
  }
}

generateIcons();

