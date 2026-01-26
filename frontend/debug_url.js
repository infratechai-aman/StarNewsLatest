const fetch = require('node-fetch'); // Might need this if node version < 18, but newer node has fetch.
// Actually, let's use http module to be safe or just try fetch.
// Node 18+ has global fetch.
fetch('http://localhost:3000/api/enewspaper')
    .then(res => res.json())
    .then(data => console.log(JSON.stringify(data, null, 2)))
    .catch(err => console.error(err));
