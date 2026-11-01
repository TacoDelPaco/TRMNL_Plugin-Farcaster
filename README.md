# TRMNL Farcaster Plugins

Unofficial Farcaster integration for [TRMNL](https://usetrmnl.com) e-ink displays. Display your Farcaster notifications, timeline, or trending casts on your 1-bit e-ink screen.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

![Preview](assets/preview.png)

---

## Three Ways to Run This Integration

Choose the method that fits your needs:

| Method | Hosting Needed | Setup Time | Notes |
| :--- | :--- | :--- | :--- |
| **1. Direct Polling (Recommended)** | **None (0 servers)** | 2 minutes | TRMNL polls Neynar directly. Free & zero maintenance. |
| **2. Cloudflare Worker Proxy** | Serverless Edge (Free) | 5 minutes | Caches data and formats relative timestamps (`5m`, `2h`). |
| **3. Webhook Sync Scripts** | Local / GitHub Actions | 10 minutes | Node.js scripts pushing to TRMNL Webhooks. |

---

## Method 1: Direct Polling (Recommended — Zero Servers)

TRMNL custom plugins support **Polling** with custom headers and Liquid templates. This requires **no servers, no Heroku, and no cron jobs**.

### 1. Requirements
* A Farcaster account and your numerical **FID** (Farcaster ID)
* A [Neynar API Key](https://neynar.com/) (free tier available)
* A TRMNL account and device

### 2. TRMNL Setup
1. Log into your [TRMNL Dashboard](https://usetrmnl.com/).
2. Go to **Plugins** > **Private Plugin** and click **Add New**.
3. Choose **Polling** as the strategy.
4. Set the **Polling URL**:
   ```text
   https://api.neynar.com/v2/farcaster/notifications?fid=YOUR_FARCASTER_FID&limit=10
   ```
5. Set the **Polling Headers**:
   ```json
   {
     "accept": "application/json",
     "x-api-key": "YOUR_NEYNAR_API_KEY"
   }
   ```
6. Set your desired **Refresh Interval** (e.g., every 15, 30, or 60 minutes).
7. Copy the contents of [`templates/notifications.liquid`](templates/notifications.liquid) and paste it into the **Markup** section.
8. Save and add the plugin to your screen playlist!

---

## Method 2: Cloudflare Worker Proxy (Edge Formatting & Caching)

If you want compact relative timestamps (e.g. `2m`, `1h`) and response caching to conserve your Neynar API rate limits, use the included Cloudflare Worker.

1. Navigate to `cloudflare-worker/`:
   ```bash
   cd cloudflare-worker
   ```
2. Install Wrangler and deploy:
   ```bash
   npx wrangler secret put NEYNAR_API_KEY
   npx wrangler deploy
   ```
3. In TRMNL, configure a **Polling** plugin pointing to your worker URL:
   ```text
   https://trmnl-farcaster-proxy.YOUR_SUBDOMAIN.workers.dev/?fid=YOUR_FARCASTER_FID
   ```
4. Paste [`templates/notifications.liquid`](templates/notifications.liquid) into TRMNL's markup section.

---

## Method 3: Node.js Webhook Sync Scripts

If you prefer to run sync scripts that push data to TRMNL Webhooks:

### 1. Available Sync Scripts
* `sync-notifications.js`: Pushes recent replies, mentions, likes, recasts, and follows.
* `sync-timeline.js`: Pushes your home timeline (casts from people you follow).
* `sync-trends.js`: Pushes trending topics and casts.

### 2. Environment Variables
Copy `.env.sample` to `.env` and fill in your values:
```bash
cp .env.sample .env
```

```ini
NEYNAR_API_KEY='your_neynar_api_key'
FARCASTER_FID='your_farcaster_fid'

TRMNL_CUSTOM_PLUGIN_NOTIFICATIONS_WEBHOOK_URL='https://usetrmnl.com/api/custom_plugins/<uuid>'
TRMNL_CUSTOM_PLUGIN_TIMELINE_WEBHOOK_URL='https://usetrmnl.com/api/custom_plugins/<uuid>'
TRMNL_CUSTOM_PLUGIN_TRENDS_WEBHOOK_URL='https://usetrmnl.com/api/custom_plugins/<uuid>'
```

### 3. Installation & Run
```bash
npm install
node sync-notifications.js
```

### 4. Free Automation via GitHub Actions
Instead of paying for Heroku, use the included GitHub Actions workflow template ([`examples/sync-workflow.yml`](examples/sync-workflow.yml)) to run your sync script on a recurring schedule for free:
1. In your GitHub repository, go to **Settings** > **Secrets and variables** > **Actions**.
2. Add your repository secrets: `NEYNAR_API_KEY`, `FARCASTER_FID`, and your TRMNL webhook URLs.
3. Copy `examples/sync-workflow.yml` to `.github/workflows/sync.yml`. The workflow will run every 30 minutes automatically.

---

## Available Templates

* [`templates/notifications.liquid`](templates/notifications.liquid): 1-bit monochrome layout for user notifications with action badges (`[LIKE]`, `[RECAST]`, `[REPLY]`, `[MENTION]`, `[FOLLOW]`), actor handles, and clamped cast snippets.
* [`templates/timeline.liquid`](templates/timeline.liquid): Shows your home feed of following casts with engagement counters.
* [`templates/trends.liquid`](templates/trends.liquid): Shows trending casts and recast counts.
* [`templates/profile.liquid`](templates/profile.liquid): Displays your Farcaster profile, bio, follower count, and stats.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Disclaimer

This is an unofficial community plugin and is not affiliated with, endorsed by, or associated with Farcaster, Neynar, or TRMNL. All trademarks belong to their respective owners.
