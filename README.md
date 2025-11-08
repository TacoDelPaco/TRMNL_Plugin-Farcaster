# TRMNL Farcaster Plugins

Unofficial Farcaster plugins for TRMNL e-ink displays. Display your Farcaster timeline and trending topics on your TRMNL device.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

![Preview](assets/preview.png)

## Overview

This repository contains Node.js scripts and Liquid templates for integrating Farcaster social media data with TRMNL displays. The plugins fetch data from Farcaster's API via Neynar and display it on your TRMNL device using webhook-based custom plugins.

### Available Plugins

- **Timeline Plugin**: Displays your Farcaster timeline with post content and engagement metrics
- **Trends Plugin**: Shows trending topics on Farcaster with post counts

## Requirements

- Node.js 22.x
- A TRMNL device
- A Farcaster account and a Neynar API key
- A hosting solution for running the sync scripts periodically (e.g., Heroku, cron server, or local machine)

## Setup

### 1. Farcaster & Neynar Configuration

1.  **Get a Neynar API Key**:
    *   Sign up for a free account at [neynar.com](https://neynar.com/).
    *   Subscribe to a plan to get your API key from the [Neynar Developer Portal](https://dev.neynar.com/).
2.  **Get your Farcaster FID (Farcaster ID)**:
    *   You can use a tool like [Warpcast's API](https://warpcast.com/~/developers/v2) or other Farcaster user lookup tools to find your numerical FID.

### 2. TRMNL Plugin Configuration

1. Log into your TRMNL dashboard
2. Navigate to Plugins > Private Plugin
3. Create a new private plugin:
   - Select "Webhook" as the strategy
   - Copy the webhook URL provided
   - Paste the appropriate template from the `templates/` directory into the markup section
   - Save the plugin

### 3. Environment Variables

Create a `.env` file in the project root based on the provided [`.env.sample`](.env.sample) file. Copy `.env.sample` to `.env` and update it with your actual credentials and webhook URLs.

### 4. Installation

```bash
npm install
```

## Usage

### Manual Execution

Run the sync scripts manually:

```bash
# Sync timeline data
node sync-timeline.js

# Sync trends data
node sync-trends.js
```

### Automated Execution with Cron

Set up cron jobs to run the scripts periodically:

```bash
# Run timeline sync every 30 minutes
*/30 * * * * cd /path/to/trmnl-farcaster && node sync-timeline.js

# Run trends sync every hour
0 * * * * cd /path/to/trmnl-farcaster && node sync-trends.js
```

### Running on Heroku with Heroku Scheduler

1. Create a new Heroku app and deploy this repository
2. Set the environment variables in Heroku:
   ```bash
   heroku config:set NEYNAR_API_KEY=your-neynar-api-key
   heroku config:set FARCASTER_FID=your-farcaster-fid
   heroku config:set TRMNL_CUSTOM_PLUGIN_TIMELINE_WEBHOOK_URL=your-webhook-url
   heroku config:set TRMNL_CUSTOM_PLUGIN_TRENDS_WEBHOOK_URL=your-webhook-url
   ```
3. Add Heroku Scheduler add-on:
   ```bash
   heroku addons:create scheduler:standard
   ```
4. Configure scheduled jobs in Heroku Scheduler dashboard:
   - Add job: `node sync-timeline.js` (run every 30 minutes)
   - Add job: `node sync-trends.js` (run every hour)

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Disclaimer

This is an unofficial plugin and is not affiliated with, endorsed by, or associated with Farcaster, Neynar, or TRMNL. All trademarks belong to their respective owners.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Related Links

- [TRMNL Documentation](https://help.usetrmnl.com/)
- [TRMNL Private Plugins Guide](https://help.usetrmnl.com/en/articles/9510536-private-plugins)
- [Neynar API Documentation](https://docs.neynar.com/)
- [Farcaster Protocol Documentation](https://docs.farcaster.xyz/)
