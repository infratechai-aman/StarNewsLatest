const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'frontend', 'app', 'api');

function findRouteFiles(dir) {
    const results = [];
    try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) results.push(...findRouteFiles(fullPath));
            else if (item.name === 'route.js') results.push(fullPath);
        }
    } catch (e) { }
    return results;
}

const files = findRouteFiles(apiDir);
let fixedCount = 0;

for (const filePath of files) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let changed = false;
    const rel = path.relative(path.join(__dirname, 'frontend'), filePath);

    // Fix 1: Replace old isSuperAdmin helper that references bare db/auth
    // Pattern: async function isSuperAdmin(token) { if (!token || !db || !auth) return false; ...
    if (content.includes('async function isSuperAdmin') && content.includes('!db || !auth')) {
        // Replace the entire isSuperAdmin function with a version that takes db, auth as params
        content = content.replace(
            /async function isSuperAdmin\(token\)\s*\{[\s\S]*?^}/m,
            `async function isSuperAdmin(token, db, auth) {
    if (!token || !db || !auth) return false;
    try {
        const decodedUser = await auth.verifyIdToken(token);
        const userDoc = await db.collection('users').doc(decodedUser.uid).get();
        return userDoc.exists && userDoc.data().role === 'super_admin';
    } catch (e) {
        return false;
    }
}`
        );

        // Update all calls to isSuperAdmin(token) -> isSuperAdmin(token, db, auth)
        content = content.replace(
            /isSuperAdmin\(token\)/g,
            'isSuperAdmin(token, db, auth)'
        );
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf-8');
        fixedCount++;
        console.log(`Fixed isSuperAdmin: ${rel}`);
    }
}

console.log(`\nTotal files fixed: ${fixedCount}`);
