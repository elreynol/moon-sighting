const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
    port: process.env.PORT || 3000,
    host: 'localhost',
    endpoints: [
        '/',
        '/api/moon/visibility',
        '/api/notifications/public-key'
    ],
    files: [
        '/index.html',
        '/css/styles.css',
        '/js/app.js',
        '/js/config.js',
        '/js/locationManager.js',
        '/js/notificationManager.js',
        '/service-worker.js',
        '/manifest.json'
    ]
};

// Test results
const results = {
    server: false,
    endpoints: {},
    files: {},
    errors: []
};

// Test server
function testServer() {
    return new Promise((resolve) => {
        const req = http.get(`http://${config.host}:${config.port}`, (res) => {
            results.server = res.statusCode === 200;
            resolve();
        });

        req.on('error', (error) => {
            results.server = false;
            results.errors.push(`Server error: ${error.message}`);
            resolve();
        });
    });
}

// Test endpoint
function testEndpoint(endpoint) {
    return new Promise((resolve) => {
        const req = http.get(`http://${config.host}:${config.port}${endpoint}`, (res) => {
            results.endpoints[endpoint] = res.statusCode === 200;
            resolve();
        });

        req.on('error', (error) => {
            results.endpoints[endpoint] = false;
            results.errors.push(`Endpoint ${endpoint} error: ${error.message}`);
            resolve();
        });
    });
}

// Test file
function testFile(file) {
    return new Promise((resolve) => {
        const filePath = path.join(__dirname, 'public', file);
        fs.access(filePath, fs.constants.F_OK, (error) => {
            results.files[file] = !error;
            if (error) {
                results.errors.push(`File ${file} error: ${error.message}`);
            }
            resolve();
        });
    });
}

// Run tests
async function runTests() {
    console.log('Starting deployment tests...\n');

    // Test server
    console.log('Testing server...');
    await testServer();
    console.log(`Server status: ${results.server ? 'OK' : 'FAILED'}\n`);

    // Test endpoints
    console.log('Testing endpoints...');
    for (const endpoint of config.endpoints) {
        await testEndpoint(endpoint);
        console.log(`${endpoint}: ${results.endpoints[endpoint] ? 'OK' : 'FAILED'}`);
    }
    console.log('');

    // Test files
    console.log('Testing files...');
    for (const file of config.files) {
        await testFile(file);
        console.log(`${file}: ${results.files[file] ? 'OK' : 'FAILED'}`);
    }
    console.log('');

    // Print summary
    console.log('Test Summary:');
    console.log('-------------');
    console.log(`Server: ${results.server ? 'OK' : 'FAILED'}`);
    console.log(`Endpoints: ${Object.values(results.endpoints).every(v => v) ? 'OK' : 'FAILED'}`);
    console.log(`Files: ${Object.values(results.files).every(v => v) ? 'OK' : 'FAILED'}`);

    if (results.errors.length > 0) {
        console.log('\nErrors:');
        results.errors.forEach(error => console.log(`- ${error}`));
    }

    // Exit with appropriate code
    process.exit(
        results.server &&
        Object.values(results.endpoints).every(v => v) &&
        Object.values(results.files).every(v => v)
            ? 0
            : 1
    );
}

// Run the tests
runTests(); 