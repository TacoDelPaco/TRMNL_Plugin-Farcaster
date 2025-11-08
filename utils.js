const https = require('https');
const url = require('url');
const { NeynarAPIClient } = require('@neynar/nodejs-sdk');

function createNeynarClient() {
    const apiKey = process.env.NEYNAR_API_KEY;

    if (!apiKey) {
        console.error('Error: NEYNAR_API_KEY environment variable must be set.');
        process.exit(1);
    }

    return new NeynarAPIClient(apiKey);
}

async function sendData(data, type = 'timeline', webhookUrl) {
    if (!webhookUrl) {
        console.error('Error: Webhook URL must be provided.');
        process.exit(1);
    }

    if (!data) {
        return Promise.reject(new Error('Data is required to send to webhook.'));
    }

    const parsedUrl = url.parse(webhookUrl);

    const merge_variables = {};
    if (type === 'timeline') {
        merge_variables.timeline = (data.timeline || []).slice(0, 5);
    } else if (type === 'trends') {
        merge_variables.trends = data.trends || [];
    }

    const postData = JSON.stringify({
        merge_variables
    });

    const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + (parsedUrl.search || ''),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
        },
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let rawData = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                rawData += chunk;
            });
            res.on('end', () => {
                try {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        let responseData = rawData;
                        try {
                            responseData = JSON.parse(rawData);
                        } catch (e) {
                            console.log('Webhook response was not JSON, or empty. Status:', res.statusCode);
                        }
                        resolve({ statusCode: res.statusCode, body: responseData });
                    } else {
                        let errorMsg = `Webhook HTTP error! status: ${res.statusCode}`;
                        try {
                            const errorDetails = JSON.parse(rawData);
                            errorMsg += ` - ${errorDetails.error || ''}: ${errorDetails.message || rawData}`;
                        } catch (e) {
                            errorMsg += ` - Unable to parse error response: ${rawData}`;
                        }
                        reject(new Error(errorMsg));
                    }
                } catch (e) {
                    reject(new Error(`Failed to process webhook response: ${e.message}. Raw data: ${rawData}`));
                }
            });
        });

        req.on('error', (e) => {
            reject(new Error(`Problem with webhook request: ${e.message}`));
        });

        req.write(postData);
        req.end();
    });
}

module.exports = {
    createNeynarClient,
    sendData
};
