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
      
      // Leer el SVG y reemplazar currentColor con negro
      const svgContent = fs.readFileSync(inputSvg, 'utf8');
      const svgWithBlackFill = svgContent.replace(/fill="currentColor"/g, 'fill="#000000"');
      
      // Para iconos "any": usar 90% del tamaño (menos padding)
      // Para iconos maskable: usar 80% del tamaño (más padding seguro)
      // Por ahora generamos con 85% como balance
      const logoSize = Math.floor(size * 0.85);
      const padding = Math.floor((size - logoSize) / 2);
      
      const resizedSvg = await sharp(Buffer.from(svgWithBlackFill))
        .resize(logoSize, logoSize, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .toBuffer();

      // Crear un canvas blanco y superponer el logo redimensionado con padding
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
            top: padding,
            left: padding,
            blend: 'over'
          }
        ])
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .png({ 
          quality: 100,
          compressionLevel: 9,
          adaptiveFiltering: true,
          force: true
        })
        .toFile(outputPath);

      console.log(`✅ Generado: ${name} (${size}x${size})`);
    }
    
    // Generar iconos maskable específicos con más padding (80% para cumplir con el estándar)
    console.log('\n🎨 Generando iconos maskable con padding seguro...\n');
    const maskableSizes = [
      { size: 192, name: 'icon-192x192-maskable.png' },
      { size: 512, name: 'icon-512x512-maskable.png' }
    ];
    
    for (const { size, name } of maskableSizes) {
      const outputPath = path.join(outputDir, name);
      
      const svgContent = fs.readFileSync(inputSvg, 'utf8');
      const svgWithBlackFill = svgContent.replace(/fill="currentColor"/g, 'fill="#000000"');
      
      // Para maskable: usar 80% del tamaño (padding seguro del 20%)
      const logoSize = Math.floor(size * 0.8);
      const padding = Math.floor((size - logoSize) / 2);
      
      const resizedSvg = await sharp(Buffer.from(svgWithBlackFill))
        .resize(logoSize, logoSize, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .toBuffer();

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
            top: padding,
            left: padding,
            blend: 'over'
          }
        ])
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .png({ 
          quality: 100,
          compressionLevel: 9,
          adaptiveFiltering: true,
          force: true
        })
        .toFile(outputPath);

      console.log(`✅ Generado maskable: ${name} (${size}x${size})`);
    }

    console.log('\n✨ ¡Todos los iconos han sido generados exitosamente!');
    console.log(`📁 Ubicación: ${outputDir}`);
  } catch (error) {
    console.error('❌ Error al generar iconos:', error);
    process.exit(1);
  }
}

generateIcons();

