const http = require('http');

async function checkServer() {
    console.log('Checking Server Health...');

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/news',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log('Server is UP. API /api/news returned:', res.statusCode);
            try {
                const json = JSON.parse(data);
                if (json.articles) {
                    console.log(`Found ${json.articles.length} articles.`);
                } else {
                    console.log('Response structure:', Object.keys(json));
                }
            } catch (e) {
                // console.log('Response body (not JSON):', data.substring(0, 500));
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
    });

    req.end();
}

checkServer();
