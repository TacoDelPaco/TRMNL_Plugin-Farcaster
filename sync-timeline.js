require('dotenv').config();

const { createNeynarClient, sendData } = require('./utils');
const { FeedType } = require("@neynar/nodejs-sdk/build/api");

async function getFarcasterTimeline() {
    try {
        const client = createNeynarClient();
        const fid = parseInt(process.env.FARCASTER_FID);

        if (!fid) {
            console.error('Error: FARCASTER_FID environment variable must be set.');
            process.exit(1);
        }

        const feed = await client.fetchFeed(FeedType.Following, {
            fid: fid,
            limit: 15,
        });

        const timeline = feed.casts.map((cast) => ({
            authorName: cast.author.displayName,
            authorHandle: cast.author.username,
            text: cast.text,
            likeCount: cast.reactions.likes.length,
            repostCount: cast.reactions.recasts.length,
            commentCount: cast.replies.count,
        }));

        return { timeline };
    } catch (error) {
        console.error('Error fetching Farcaster timeline:', error);
        return { timeline: [] };
    }
}

async function main() {
    try {
        if (!process.env.TRMNL_CUSTOM_PLUGIN_TIMELINE_WEBHOOK_URL) {
            console.log('TRMNL_CUSTOM_PLUGIN_TIMELINE_WEBHOOK_URL environment variable is not defined. Exiting gracefully.');
            return;
        }

        const timelineResponse = await getFarcasterTimeline();
        console.log('\nFarcaster Timeline:');
        console.log(JSON.stringify(timelineResponse, null, 2));

        if (timelineResponse && timelineResponse.timeline) {
            const webhookResponse = await sendData({
                timeline: timelineResponse.timeline
            }, 'timeline', process.env.TRMNL_CUSTOM_PLUGIN_TIMELINE_WEBHOOK_URL);
            console.log('\nWebhook response:');
            console.log(`Status Code: ${webhookResponse.statusCode}`);
            console.log('Body:', JSON.stringify(webhookResponse.body, null, 2));
        } else {
            console.error('Failed to retrieve Farcaster timeline.');
        }
    } catch (error) {
        console.error('An error occurred in main execution:', error.message);
    }
}

main();
