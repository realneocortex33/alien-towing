/**
 * Lead Capture Worker — handles form submissions from Alien Towing website
 * Sends lead notifications to Telegram and stores in KV
 */
export default {
    async fetch(request, env) {
        if (request.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'POST only' }), { status: 405 });
        }

        try {
            const data = await request.json();
            const { name, phone, location } = data;

            // Validate
            if (!name || !phone) {
                return new Response(JSON.stringify({ error: 'Name and phone required' }), { status: 400 });
            }

            // Send to Telegram (via bot API)
            const TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN || '';
            const TELEGRAM_CHAT_ID = env.TELEGRAM_CHAT_ID || '';
            const message = `🚨 NEW LEAD — Alien Towing\n\nName: ${name}\nPhone: ${phone}\nLocation: ${location || 'Not provided'}\nTime: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}`;

            if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
                await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: TELEGRAM_CHAT_ID,
                        text: message,
                        parse_mode: 'HTML'
                    })
                });
            }

            // Store in KV if available
            if (env.LEADS_KV) {
                const key = `lead_${Date.now()}`;
                await env.LEADS_KV.put(key, JSON.stringify({ ...data, timestamp: Date.now() }));
            }

            return new Response(JSON.stringify({ success: true }), {
                headers: { 'Content-Type': 'application/json' }
            });

        } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), { status: 500 });
        }
    }
};