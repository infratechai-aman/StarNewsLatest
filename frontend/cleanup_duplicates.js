const fs = require('fs');
const path = require('path');

const apiDir = 'c:/Users/Aman Talukdar/Downloads/PMQ1-main/frontend/app/api';

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

const fixFile = (filePath) => {
    if (!filePath.endsWith('.js')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Pattern 1: Consecutive duplicated lines of db/auth
    // Looking for exactly:
    // const db = getDb();
    // const auth = getAuth();
    // (blank optional)
    // const db = getDb();
    // const auth = getAuth();

    // Pattern 1: db and auth together twice
    const pattern1 = /(const db = getDb\(\);\s+const auth = getAuth\(\);)\s+(const db = getDb\(\);\s+const auth = getAuth\(\);)/g;
    content = content.replace(pattern1, '$1');

    // Pattern 2: Single db twice
    const pattern2 = /(const db = getDb\(\);)\s+(const db = getDb\(\);)/g;
    content = content.replace(pattern2, '$1');

    // Pattern 3: Single auth twice
    const pattern3 = /(const auth = getAuth\(\);)\s+(const auth = getAuth\(\);)/g;
    content = content.replace(pattern3, '$1');

    // Pattern 4: db/auth with maybe a line or two of space/comments in between
    const pattern4 = /(const db = getDb\(\);\s+const auth = getAuth\(\);)([\s\S]{1,50})(const db = getDb\(\);\s+const auth = getAuth\(\);)/g;
    content = content.replace(pattern4, (match, p1, middle, p3) => {
        // Only replace if the middle is just whitespace or non-declarative noise
        if (!middle.includes('const ') && !middle.includes('let ') && !middle.includes('var ')) {
            return p1 + middle;
        }
        return match;
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`FIXED: ${filePath}`);
    }
};

console.log('--- CLEANING UP DUPLICATE DECLARATIONS ---');
walk(apiDir, fixFile);
console.log('--- DONE ---');
