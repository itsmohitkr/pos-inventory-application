import http = require('http');

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/products/summary',
  method: 'GET',
};

const req = http.request(options, (res) => {
  res.setEncoding('utf8');
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    // The body was previously accumulated and then discarded, so a successful
    // run printed nothing and a 500 looked identical to a 200.
    console.log(`status: ${res.statusCode}`);
    console.log(data);
    process.exitCode = res.statusCode === 200 ? 0 : 1;
  });
});

req.on('error', (e: Error) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
