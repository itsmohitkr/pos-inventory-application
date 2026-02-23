const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/products/summary',
    method: 'GET',
};

const req = http.request(options, (res) => {
    // ...existing code...
    res.setEncoding('utf8');
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        // ...existing code...
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
