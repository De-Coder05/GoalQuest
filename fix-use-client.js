const fs = require('fs');
const path = require('path');

function processFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  let changed = false;

  // Remove existing "use client" anywhere in the file to avoid duplicates
  content = content.replace(/["']use client["'];?\n?/g, '');
  
  // If the file uses React hooks, NextAuth, Next router, or createContext, it needs use client
  if (
    content.includes('useState') || 
    content.includes('useEffect') || 
    content.includes('useRef') || 
    content.includes('useContext') || 
    content.includes('useMemo') || 
    content.includes('useRouter') || 
    content.includes('usePathname') ||
    content.includes('useSession') ||
    content.includes('createContext') ||
    content.includes('onClick')
  ) {
    content = '"use client";\n' + content;
    changed = true;
  }

  // Also fix NextAuth SessionProvider if it's missing in providers
  if (changed) {
    fs.writeFileSync(filepath, content);
  }
}

function walkSync(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    let filepath = path.join(dir, file);
    let stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      walkSync(filepath, callback);
    } else if (stats.isFile() && filepath.endsWith('.tsx')) {
      callback(filepath);
    }
  });
}

walkSync(path.join(__dirname, 'src/app/dashboard'), processFile);
walkSync(path.join(__dirname, 'src/components'), processFile);
walkSync(path.join(__dirname, 'src/lib'), processFile);
console.log('Fixed use client directives');
