# Alien Towing Website

## Stack
- Pure HTML/CSS/JS — zero frameworks, zero build step
- Cloudflare Pages (free hosting, unlimited bandwidth)
- Cloudflare Workers (free, 100k req/day) for lead capture → SMS

## Files
| File | Purpose |
|---|---|
| `index.html` | Full site — hero, services, vehicles, parts, booking, reviews |
| `functions/lead.js` | Cloudflare Worker for lead capture form |
| `functions/booking.js` | Cloudflare Worker for booking form |
| `wrangler.toml` | Cloudflare Pages config |

## Deploy

### Option 1: Cloudflare Pages (recommended)
```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler pages deploy .
```

### Option 2: Surge (quick preview)
```bash
npm install -g surge
surge .
```

### Option 3: Local preview
```bash
python3 -m http.server 8000
# Open http://localhost:8000
```

## Lead Capture Flow
1. User enters name + phone on site
2. Cloudflare Worker receives form data
3. Sends SMS to Chris via Telegram notification
4. Chris calls back immediately

## Customization
- Update phone number in `index.html` (search for "704) 555-1234")
- Update vehicle inventory in `const VEHICLES` array
- Update parts inventory in `const PARTS` array
- Update service areas in `const AREAS` array