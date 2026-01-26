const fetch = require('node-fetch');

async function checkApi() {
    try {
        const res = await fetch('http://localhost:3000/api/news?limit=5');
        const data = await res.json();
        console.log('Total articles:', data.total);
        if (data.articles && data.articles.length > 0) {
            console.log('First article:', JSON.stringify(data.articles[0], null, 2));
            console.log('Categories found:', data.articles.map(a => `ID: ${a.categoryId}, Name: ${a.category}`).join('\n'));
        } else {
            console.log('No articles found in API response');
        }
    } catch (error) {
        console.error('Error fetching API:', error);
    }
}

checkApi();
