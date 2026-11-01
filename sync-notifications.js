require('dotenv').config();

const { createNeynarClient, sendData } = require('./utils');

async function getFarcasterNotifications() {
    try {
        const client = createNeynarClient();
        const fid = parseInt(process.env.FARCASTER_FID, 10);

        if (!fid) {
            console.error('Error: FARCASTER_FID environment variable must be set.');
            process.exit(1);
        }

        const response = await client.fetchAllNotifications({
            fid: fid,
            limit: 10,
        });

        const notifications = (response.notifications || []).map((item) => {
            let actorHandle = '';
            let actorName = '';
            let text = '';
            const type = item.type;

            if (type === 'likes' || type === 'recasts') {
                const reactor = item.reactions?.[0]?.user || item.users?.[0];
                actorHandle = reactor?.username || item.reactions?.[0]?.fname || '';
                actorName = reactor?.display_name || reactor?.displayName || '';
                text = item.cast?.text || '';
            } else if (type === 'follows') {
                const follower = item.user || item.follows?.[0]?.user || item.users?.[0];
                actorHandle = follower?.username || '';
                actorName = follower?.display_name || follower?.displayName || '';
            } else {
                // Replies, mentions, quotes: cast author is the actor
                actorHandle = item.cast?.author?.username || '';
                actorName = item.cast?.author?.displayName || '';
                text = item.cast?.text || '';
            }

            return {
                type: item.type,
                actorHandle,
                actorName,
                text,
                timestamp: item.most_recent_timestamp,
            };
        });

        return { notifications };
    } catch (error) {
        console.error('Error fetching Farcaster notifications:', error);
        return { notifications: [] };
    }
}

async function main() {
    try {
        if (!process.env.TRMNL_CUSTOM_PLUGIN_NOTIFICATIONS_WEBHOOK_URL) {
            console.log('TRMNL_CUSTOM_PLUGIN_NOTIFICATIONS_WEBHOOK_URL environment variable is not defined. Exiting gracefully.');
            return;
        }

        const notificationsResponse = await getFarcasterNotifications();
        console.log('\nFarcaster Notifications:');
        console.log(JSON.stringify(notificationsResponse, null, 2));

        if (notificationsResponse && notificationsResponse.notifications) {
            const webhookResponse = await sendData(
                { notifications: notificationsResponse.notifications },
                'notifications',
                process.env.TRMNL_CUSTOM_PLUGIN_NOTIFICATIONS_WEBHOOK_URL
            );
            console.log('\nWebhook response:');
            console.log(`Status Code: ${webhookResponse.statusCode}`);
            console.log('Body:', JSON.stringify(webhookResponse.body, null, 2));
        } else {
            console.error('Failed to retrieve Farcaster notifications.');
        }
    } catch (error) {
        console.error('An error occurred in main execution:', error.message);
    }
}

main();
