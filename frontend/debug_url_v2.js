const fs = require('fs');
const http = require('http');
const file = fs.createWriteStream('debug_output.txt');
http.get('http://localhost:3000/api/enewspaper', (res) => {
    res.pipe(file);
});
