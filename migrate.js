const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../questflow-goals/src/routes');
const destDir = path.join(__dirname, 'src/app/dashboard');

const routes = [
  { file: 'goals.index.tsx', dest: 'my-goals/page.tsx' },
  { file: 'goals.create.tsx', dest: 'my-goals/create/page.tsx' },
  { file: 'checkins.tsx', dest: 'check-ins/page.tsx' },
  { file: 'approvals.tsx', dest: 'approvals/page.tsx' },
  { file: 'team.tsx', dest: 'team/page.tsx' },
  { file: 'reports.tsx', dest: 'reports/page.tsx' },
  { file: 'admin.cycles.tsx', dest: 'admin/cycles/page.tsx' },
  { file: 'admin.completion.tsx', dest: 'admin/completion/page.tsx' },
  { file: 'admin.audit.tsx', dest: 'admin/audit/page.tsx' },
  { file: 'admin.escalations.tsx', dest: 'admin/escalations/page.tsx' },
  { file: 'admin.settings.tsx', dest: 'admin/settings/page.tsx' },
];

function transformCode(code, componentName) {
  // 1. Remove TanStack Router imports
  let newCode = code.replace(/import \{.*?Route.*?\} from ['"]@tanstack\/react-router['"];?/g, '');
  
  // 2. Change Link and useNavigate to Next.js
  newCode = newCode.replace(/import \{.*?Link.*?\} from ['"]@tanstack\/react-router['"];?/g, 'import Link from "next/link";');
  newCode = newCode.replace(/import \{.*?useNavigate.*?\} from ['"]@tanstack\/react-router['"];?/g, 'import { useRouter } from "next/navigation";');
  
  // 3. Fix Link 'to' -> 'href'
  newCode = newCode.replace(/<Link([^>]+?)to=(['"])(.*?)\2/g, '<Link$1href=$2/dashboard$3$2');
  newCode = newCode.replace(/<Link([^>]+?)to=\{([^}]+)\}/g, '<Link$1href={$2}');
  
  // 4. Fix navigate({ to: ... }) -> router.push(...)
  newCode = newCode.replace(/const navigate = useNavigate\(\);/g, 'const router = useRouter();');
  newCode = newCode.replace(/navigate\(\{.*?to:\s*(`.*?`|'.*?'|".*?").*?\}\)/g, 'router.push($1)');
  
  // 5. Remove AppLayout wrapper from the component if it exists
  newCode = newCode.replace(/<AppLayout>\s*(<[A-Z][a-zA-Z0-9]* \/>)\s*<\/AppLayout>/g, '$1');
  
  // 6. Remove Route definitions completely
  newCode = newCode.replace(/export const Route = createFileRoute.*?\n\}\);/gs, '');
  newCode = newCode.replace(/export const Route = createFileRoute[\s\S]*?\}\);/gs, '');
  
  // 7. Add 'use client'
  newCode = '"use client";\n' + newCode;
  
  // 8. Export default the main component
  // Find the component function
  if (newCode.includes(`function ${componentName}`)) {
    newCode = newCode.replace(`function ${componentName}`, `export default function ${componentName}`);
  } else {
    // try to find the first function that returns JSX
    const funcMatch = newCode.match(/function ([A-Z][a-zA-Z0-9]*)\s*\(/);
    if (funcMatch) {
      newCode = newCode.replace(`function ${funcMatch[1]}`, `export default function ${funcMatch[1]}`);
    }
  }

  // 9. Fix @/lib/store import if any
  // If we want real auth, we could replace it, but for speed to make it "look like Lovable", 
  // we'll keep useStore which works purely on the client side for visual purposes, 
  // but let's make sure useStore works by injecting the current user from NextAuth if possible.
  // Actually, we'll just let useStore handle the UI state for now so it matches Lovable exactly.

  return newCode;
}

routes.forEach(({ file, dest }) => {
  const srcPath = path.join(srcDir, file);
  const destPath = path.join(destDir, dest);
  
  if (fs.existsSync(srcPath)) {
    const code = fs.readFileSync(srcPath, 'utf-8');
    const compNameMatch = code.match(/function ([A-Z][a-zA-Z0-9]*)\s*\(/);
    const compName = compNameMatch ? compNameMatch[1] : 'Page';
    
    const newCode = transformCode(code, compName);
    
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, newCode);
    console.log(`Migrated ${file} to ${dest}`);
  } else {
    console.log(`Skipping ${file} - not found`);
  }
});

console.log("Migration complete.");
