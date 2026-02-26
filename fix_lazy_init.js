const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'frontend', 'app', 'api');

function findRouteFiles(dir) {
    const results = [];
    try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                results.push(...findRouteFiles(fullPath));
            } else if (item.name === 'route.js') {
                results.push(fullPath);
            }
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

    const hasGetDb = content.includes('getDb');
    const hasGetAuth = content.includes('getAuth');
    const hasLazyDb = content.includes('const db = getDb()');
    const hasLazyAuth = content.includes('const auth = getAuth()');

    // Skip files already fully fixed
    if (hasGetDb && hasLazyDb && (!hasGetAuth || hasLazyAuth)) {
        continue;
    }

    // Skip files that don't use getDb/getAuth at all
    if (!hasGetDb && !hasGetAuth) {
        continue;
    }

    // Need to inject lazy init into handler functions
    if (hasGetDb && !hasLazyDb) {
        const needsAuth = hasGetAuth && !hasLazyAuth;
        const initLine = needsAuth
            ? '    const db = getDb();\n    const auth = getAuth();\n'
            : '    const db = getDb();\n';

        content = content.replace(
            /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(([^)]*)\)\s*\{(\s*\n)/g,
            (match, method, params, ws) => {
                return `export async function ${method}(${params}) {\n${initLine}`;
            }
        );
        changed = true;
    } else if (hasGetAuth && !hasLazyAuth) {
        content = content.replace(
            /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(([^)]*)\)\s*\{(\s*\n)/g,
            (match, method, params, ws) => {
                return `export async function ${method}(${params}) {\n    const auth = getAuth();\n`;
            }
        );
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf-8');
        fixedCount++;
        console.log(`Fixed: ${rel}`);
    } else {
        // Check if it still needs fixing (handler pattern might not match)
        if ((hasGetDb && !hasLazyDb) || (hasGetAuth && !hasLazyAuth)) {
            console.log(`NEEDS MANUAL FIX: ${rel}`);
        }
    }
}

console.log(`\nTotal files fixed: ${fixedCount}`);
