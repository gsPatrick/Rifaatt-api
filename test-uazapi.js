const https = require('https');

const apiUrl = 'https://testepatrick123.uazapi.com';
const token = '69b86d7c-e4b5-429d-8ffc-24a2716af379';
const phone = '5571983141335';

function request(method, path, body = null, query = '') {
    return new Promise((resolve) => {
        const postData = body ? JSON.stringify(body) : '';
        const options = {
            method: method,
            headers: {
                'token': token,
                'Content-Type': 'application/json'
            }
        };
        if (body) {
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        const targetUrl = `${apiUrl}${path}${query ? '?' + query : ''}`;
        const req = https.request(targetUrl, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, data: data });
            });
        });

        req.on('error', (e) => resolve({ error: e.message }));
        if (body) req.write(postData);
        req.end();
    });
}

async function run() {
    console.log('--- RESETTING INSTANCE ---');
    await request('POST', '/instance/disconnect');
    await new Promise(r => setTimeout(r, 2000));

    // Test A: phone
    console.log('\n--- Test A: phone in body ---');
    const resA = await request('POST', '/instance/connect', { phone });
    console.log('Status:', resA.status);
    console.log('Response:', resA.data);
    
    console.log('\nWaiting 5 seconds...');
    await new Promise(r => setTimeout(r, 5000));
    const statusA = await request('GET', '/instance/status');
    console.log('Status after 5s:', statusA.data);

    console.log('\n--- RESETTING FOR TEST B ---');
    await request('POST', '/instance/disconnect');
    await new Promise(r => setTimeout(r, 2000));

    // Test B: phoneNumber
    console.log('\n--- Test B: phoneNumber in body ---');
    const resB = await request('POST', '/instance/connect', { phoneNumber: phone });
    console.log('Status:', resB.status);
    console.log('Response:', resB.data);

    console.log('\nWaiting 5 seconds...');
    await new Promise(r => setTimeout(r, 5000));
    const statusB = await request('GET', '/instance/status');
    console.log('Status after 5s:', statusB.data);
}

run();
