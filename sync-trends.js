require('dotenv').config();

const { createNeynarClient, sendData } = require('./utils');
const { FilterType } = require("@neynar/nodejs-sdk/build/api");

async function getFarcasterTrends() {
    try {
        const client = createNeynarClient();
        const { casts } = await client.fetchFeed(FilterType.Likes, {
            limit: 10,
        });

        const trends = casts.map((cast) => ({
            displayName: cast.text.substring(0, 30),
            postCount: cast.reactions.recasts.length,
        }));

        return { trends };
    } catch (error) {
        console.error('Error fetching Farcaster trends:', error);
        return { trends: [] };
    }
}

async function main() {
    try {
        if (!process.env.TRMNL_CUSTOM_PLUGIN_TRENDS_WEBHOOK_URL) {
            console.log('TRMNL_CUSTOM_PLUGIN_TRENDS_WEBHOOK_URL environment variable is not defined. Exiting gracefully.');
            return;
        }

        const trendsResponse = await getFarcasterTrends();
        console.log('\nFarcaster Trends:');
        console.log(JSON.stringify(trendsResponse, null, 2));

        if (trendsResponse && trendsResponse.trends) {
            const webhookResponse = await sendData({
                trends: trendsResponse.trends
            }, 'trends', process.env.TRMNL_CUSTOM_PLUGIN_TRENDS_WEBHOOK_URL);
            console.log('\nWebhook response:');
            console.log(`Status Code: ${webhookResponse.statusCode}`);
            console.log('Body:', JSON.stringify(webhookResponse.body, null, 2));
        } else {
            console.error('Failed to retrieve Farcaster trends.');
        }
    } catch (error) {
        console.error('An error occurred in main execution:', error.message);
    }
}

main();
