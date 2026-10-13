export default {
  async fetch(request) {
    if (request.method !== 'POST') return new Response('POST only', { status: 405 });
    try {
      const data = await request.json();
      const msg = `🚨 NEW LEAD — Alien Towing\n\nName: ${data.name || '—'}\nPhone: ${data.phone || '—'}\nLocation: ${data.location || '—'}\nService: ${data.service || '—'}\nSource: ${data.source || 'web'}`;
      
      // Replace these
      const token = '8861182350:AAEjo69clBvM-Ycta-Aa9GxDJqGVuFAMOok';
      const chat_id = '8102384229';
      
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id, text: msg })
      });
      
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }
};