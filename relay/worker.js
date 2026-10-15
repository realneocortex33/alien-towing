export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return new Response('POST only', { status: 405 });
    try {
      const data = await request.json();
      const msg = `🚨 NEW LEAD — Alien Towing\n\nName: ${data.name || '—'}\nPhone: ${data.phone || '—'}\nLocation: ${data.location || '—'}\nService: ${data.service || '—'}\nSource: ${data.source || 'web'}`;

      // Read from env vars — set via Cloudflare Dashboard or wrangler secret
      const token = env.TELEGRAM_BOT_TOKEN || '';
      const chat_id = env.TELEGRAM_CHAT_ID || '';

      if (!token || !chat_id) {
        return new Response(JSON.stringify({ ok: false, error: 'TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'https://alientowingservices.com' }
        });
      }

      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id, text: msg })
      });

      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'https://alientowingservices.com' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': 'https://alientowingservices.com' } });
    }
  }
};