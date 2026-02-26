const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'frontend', 'app', 'api');

// Recursively find all route.js files
function findRouteFiles(dir) {
    const results = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            results.push(...findRouteFiles(fullPath));
        } else if (item.name === 'route.js') {
            results.push(fullPath);
        }
    }
    return results;
}

const files = findRouteFiles(apiDir);
let fixedCount = 0;

for (const filePath of files) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let changed = false;

    // Check if file still uses old direct imports
    const hasOldDbAuth = /import\s*\{\s*(db\s*,\s*auth|auth\s*,\s*db)\s*\}\s*from\s*['"]@\/lib\/firebaseAdmin['"]/.test(content);
    const hasOldDbOnly = /import\s*\{\s*db\s*\}\s*from\s*['"]@\/lib\/firebaseAdmin['"]/.test(content);

    // Skip files already fixed (using getDb/getAuth)
    if (content.includes('getDb') || content.includes('getAuth')) {
        continue;
    }

    if (!hasOldDbAuth && !hasOldDbOnly) {
        continue;
    }

    if (hasOldDbAuth) {
        // Replace import { db, auth } or { auth, db } with { getDb, getAuth }
        content = content.replace(
            /import\s*\{\s*(db\s*,\s*auth|auth\s*,\s*db)\s*\}\s*from\s*['"]@\/lib\/firebaseAdmin['"][;]?/,
            "import { getDb, getAuth } from '@/lib/firebaseAdmin';"
        );

        // Add lazy init at the start of each handler function
        // Match: export async function XXXX(request
        content = content.replace(
            /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(([^)]*)\)\s*\{/g,
            (match, method, params) => {
                return `export async function ${method}(${params}) {\n    const db = getDb();\n    const auth = getAuth();\n`;
            }
        );
        changed = true;
    } else if (hasOldDbOnly) {
        // Replace import { db } with { getDb }
        content = content.replace(
            /import\s*\{\s*db\s*\}\s*from\s*['"]@\/lib\/firebaseAdmin['"][;]?/,
            "import { getDb } from '@/lib/firebaseAdmin';"
        );

        // Add lazy init at the start of each handler function
        content = content.replace(
            /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(([^)]*)\)\s*\{/g,
            (match, method, params) => {
                return `export async function ${method}(${params}) {\n    const db = getDb();\n`;
            }
        );
        changed = true;
    }

    // Also fix any standalone helper functions that use db/auth directly
    // (like isSuperAdmin functions) - they should work because db/auth are now local vars

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf-8');
        fixedCount++;
        const rel = path.relative(path.join(__dirname, 'frontend'), filePath);
        console.log(`Fixed: ${rel}`);
    }
}

console.log(`\nTotal files fixed: ${fixedCount}`);
