const fs = require('fs');
const path = require('path');

const files = [
  'js/game.js','js/state.js','js/config.js','js/map.js','js/settle.js',
  'js/tile-types.js','js/input.js','js/render/ui.js','js/render/effects.js',
  'js/render/buildings.js','js/render/hex.js','js/render/terrain.js'
];

for (const f of files) {
  try {
    const c = fs.readFileSync(f, 'utf8');
    // Find all named imports
    const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
    let m;
    while ((m = importRegex.exec(c)) !== null) {
      const names = m[1].split(',').map(s => s.trim()).filter(s => s);
      const mod = m[2];
      const dir = path.dirname(f);
      let modFile;
      if (mod.startsWith('./') || mod.startsWith('../')) {
        modFile = path.normalize(path.join(dir, mod));
        // Don't add .js if it already ends with .js
        if (!modFile.endsWith('.js')) modFile += '.js';
      } else {
        continue;
      }
      try {
        const modContent = fs.readFileSync(modFile, 'utf8');
        // Find all export names
        const exportNames = [...modContent.matchAll(/export\s+(?:const|let|var|function|class)\s+(\w+)/g)].map(m2 => m2[1]);
        // Also find export { x, y } patterns
        const reExports = [...modContent.matchAll(/export\s+\{([^}]+)\}/g)];
        for (const re of reExports) {
          re[1].split(',').map(s => {
            const parts = s.trim().split(/\s+as\s+/);
            return parts[0].trim();
          }).forEach(n => { if (n) exportNames.push(n); });
        }
        for (const name of names) {
          if (!exportNames.includes(name)) {
            console.log('MISSING: "' + name + '" not exported from ' + modFile + ' (imported in ' + f + ')');
          }
        }
      } catch (e) {
        console.log('FILE NOT FOUND: ' + modFile + ' (imported in ' + f + ')');
      }
    }
  } catch (e) {
    console.log('CANT READ: ' + f + ' ' + e.message);
  }
}
console.log('Check done.');
