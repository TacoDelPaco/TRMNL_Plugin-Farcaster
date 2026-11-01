/**
 * Cloudflare Worker Proxy for TRMNL + Farcaster
 * 
 * Sits between TRMNL and Neynar:
 * 1. Hides your Neynar API key (stored securely in Cloudflare environment secrets)
 * 2. Formats timestamps into compact relative times ("5m", "2h") for 1-bit e-ink screens
 * 3. Caches responses to prevent exceeding Neynar API rate limits
 */

function formatTimeAgo(timestamp) {
  if (!timestamp) return '';
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return `${Math.max(1, seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const fid = url.searchParams.get('fid') || env.DEFAULT_FARCASTER_FID;
    const apiKey = env.NEYNAR_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'NEYNAR_API_KEY is not configured.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!fid) {
      return new Response(JSON.stringify({ error: 'Missing fid query parameter.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const neynarRes = await fetch(`https://api.neynar.com/v2/farcaster/notifications?fid=${fid}&limit=5`, {
        headers: {
          'accept': 'application/json',
          'x-api-key': apiKey,
        },
      });

      if (!neynarRes.ok) {
        return new Response(JSON.stringify({ error: `Neynar API error: ${neynarRes.status}` }), {
          status: neynarRes.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const data = await neynarRes.json();
      const rawNotifications = data.notifications || [];

      const notifications = rawNotifications.map((item) => {
        let actorHandle = '';
        let actorName = '';
        let text = '';

        if (item.cast) {
          actorHandle = item.cast.author?.username || '';
          actorName = item.cast.author?.display_name || item.cast.author?.displayName || '';
          text = item.cast.text || '';
        } else if (item.user) {
          actorHandle = item.user.username || '';
          actorName = item.user.display_name || item.user.displayName || '';
        } else if (item.reactions && item.reactions[0]) {
          actorHandle = item.reactions[0].user?.username || '';
          actorName = item.reactions[0].user?.display_name || '';
        }

        return {
          type: item.type,
          actorHandle,
          actorName,
          text,
          timeAgo: formatTimeAgo(item.most_recent_timestamp),
          timestamp: item.most_recent_timestamp,
        };
      });

      return new Response(JSON.stringify({ notifications }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=600', // Cache 10 minutes
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
