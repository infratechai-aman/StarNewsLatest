const fs = require('fs');
const path = require('path');

const filesToFix = [
    'c:/Users/Aman Talukdar/Downloads/PMQ1-main/frontend/app/api/reporter-applications/route.js',
    'c:/Users/Aman Talukdar/Downloads/PMQ1-main/frontend/app/api/admin/enewspaper/[id]/toggle/route.js',
    'c:/Users/Aman Talukdar/Downloads/PMQ1-main/frontend/app/api/admin/classifieds/[id]/route.js',
    'c:/Users/Aman Talukdar/Downloads/PMQ1-main/frontend/app/api/admin/enewspaper/[id]/route.js',
    'c:/Users/Aman Talukdar/Downloads/PMQ1-main/frontend/app/api/admin/businesses/route.js',
    'c:/Users/Aman Talukdar/Downloads/PMQ1-main/frontend/app/api/admin/businesses/[id]/route.js',
    'c:/Users/Aman Talukdar/Downloads/PMQ1-main/frontend/app/api/admin/businesses/[id]/toggle/route.js'
];

for (const filePath of filesToFix) {
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        continue;
    }

    let content = fs.readFileSync(filePath, 'utf-8');
    let changed = false;

    // 1. Fix the helper definition
    // Pattern: async function isSuperAdmin(token) { ... }
    const helperRegex = /async\s+function\s+isSuperAdmin\s*\(token\)\s*\{[\s\S]*?^}/m;
    if (helperRegex.test(content)) {
        content = content.replace(helperRegex, `async function isSuperAdmin(token, db, auth) {
    if (!token || !db || !auth) return false;
    try {
        const decodedUser = await auth.verifyIdToken(token);
        const userDoc = await db.collection('users').doc(decodedUser.uid).get();
        return userDoc.exists && userDoc.data().role === 'super_admin';
    } catch (e) {
        return false;
    }
}`);
        changed = true;
    }

    // 2. Fix the helper calls
    // Pattern: isSuperAdmin(token)
    if (content.includes('isSuperAdmin(token)')) {
        content = content.replace(/isSuperAdmin\(token\)/g, 'isSuperAdmin(token, db, auth)');
        changed = true;
    }

    // 3. Ensure db and auth are initialized in handlers
    // Pattern: export async function (GET|POST|PUT|PATCH|DELETE)(request) {
    const handlerRegex = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(([^)]*)\)\s*\{/g;
    content = content.replace(handlerRegex, (match, method, params) => {
        // Skip if already has init
        if (match.includes('const db = getDb()') || content.substring(content.indexOf(match)).split('}')[0].includes('const db = getDb()')) {
            return match;
        }

        let initLine = '';
        if (content.includes('getDb(')) initLine += '    const db = getDb();\n';
        if (content.includes('getAuth(') || content.includes('auth as adminAuth')) initLine += '    const auth = getAuth();\n'; // Note: mapping auth as adminAuth to getAuth for consistency if needed, but let's check

        // Special case for reporter-applications which has 'auth as adminAuth'
        if (filePath.includes('reporter-applications') && !content.includes('const auth = getAuth()')) {
            // Check if we need to add getAuth to imports
            if (!content.includes('getAuth')) {
                content = content.replace(/import\s*\{\s*getDb\s*,\s*auth\s*as\s*adminAuth\s*\}\s*from\s*['"]@\/lib\/firebaseAdmin['"]/, "import { getDb, getAuth } from '@/lib/firebaseAdmin'");
            }
        }

        return `export async function ${method}(${params}) {\n${initLine}`;
    });

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Fixed: ${filePath}`);
    }
}
