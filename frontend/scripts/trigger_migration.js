const http = require('http');

function runChunk() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/admin/migrate-translations?limit=3',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                } catch (e) {
                    reject(new Error("Failed to parse JSON: " + data));
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.end();
    });
}

async function start() {
    console.log("Starting chunked migration (3 per chunk) to respect Translate rate limits...");
    let needsMore = true;
    while (needsMore) {
        try {
            console.log("Triggering 3 items...");
            const res = await runChunk();
            console.log(`Processed: ${res.processed}, Left to translate: ${res.needsTranslation}, Success: ${res.success}`);
            if (res.processed === 0 || res.needsTranslation === 0) {
                console.log("Done! All items migrated.");
                needsMore = false;
            } else {
                console.log("Waiting 3 seconds before next chunk...");
                await new Promise(r => setTimeout(r, 3000));
            }
        } catch (e) {
            console.error("Chunk failed automatically retrying in 5 seconds:", e.message);
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

start();
