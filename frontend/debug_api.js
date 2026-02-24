const fs = require('fs');

fetch('http://localhost:3000/api/news?limit=100')
    .then(res => res.json())
    .then(data => {
        const target = data.articles.find(a => JSON.stringify(a).includes('Sanskar Apne Apne'));
        const result = {
            found: !!target,
            article: target
        };
        fs.writeFileSync('debug_api.json', JSON.stringify(result, null, 2));
        console.log('Done');
    })
    .catch(err => console.error(err));
