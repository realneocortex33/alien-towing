/** Booking Worker — handles job booking submissions from the website */
export default {
    async fetch(request, env) {
        if (request.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'POST only' }), { status: 405 });
        }

        try {
            const data = await request.json();
            const { name, phone, email, vehicle, service, details } = data;

            if (!name || !phone || !vehicle || !service) {
                return new Response(JSON.stringify({ error: 'Name, phone, vehicle, and service required' }), { status: 400 });
            }

            // Notify via Telegram
            const TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN || '';
            const TELEGRAM_CHAT_ID = env.TELEGRAM_CHAT_ID || '';
            const msg = [
                `📋 NEW BOOKING — Alien Towing`,
                ``,
                `Name: ${name}`,
                `Phone: ${phone}`,
                `Email: ${email || 'Not provided'}`,
                `Vehicle: ${vehicle}`,
                `Service: ${service}`,
                `Details: ${details || 'None'}`,
                `Time: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}`
            ].join('\n');

            if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
                await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: msg })
                });
            }

            if (env.BOOKINGS_KV) {
                await env.BOOKINGS_KV.put(`booking_${Date.now()}`, JSON.stringify({ ...data, timestamp: Date.now() }));
            }

            return new Response(JSON.stringify({ success: true }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), { status: 500 });
        }
    }
};