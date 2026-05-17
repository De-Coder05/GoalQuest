const fs = require('fs');
const path = require('path');

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

walkSync(path.join(__dirname, 'src/app/dashboard'), (filepath) => {
  let content = fs.readFileSync(filepath, 'utf8');
  let changed = false;

  if (content.includes('useRouter(') && !content.includes('import { useRouter }')) {
    content = 'import { useRouter } from "next/navigation";\n' + content;
    changed = true;
  }
  if (content.includes('<Link') && !content.includes('import Link from')) {
    content = 'import Link from "next/link";\n' + content;
    changed = true;
  }
  if (content.includes('useSession(') && !content.includes('import { useSession }')) {
    content = 'import { useSession } from "next-auth/react";\n' + content;
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filepath, content);
    console.log('Fixed imports in', filepath);
  }
});
