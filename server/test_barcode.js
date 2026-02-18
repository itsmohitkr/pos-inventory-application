const axios = require('axios');

async function testBarcode(barcode) {
    try {
        console.log(`Testing barcode: ${barcode}`);
        const response = await axios.get(`http://localhost:5001/api/products/${encodeURIComponent(barcode)}`);
        console.log('Response status:', response.status);
        console.log('Response data:', response.data);
    } catch (error) {
        if (error.response) {
            console.log('Error status:', error.response.status);
            console.log('Error data:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    }
}

async function run() {
    await testBarcode('TEST-BARCODE-123'); // Should return 404
}

run();
