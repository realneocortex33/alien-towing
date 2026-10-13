#!/usr/bin/env python3
"""
Alien Towing — Lead Relay Server (port 8001)
Receives form submissions from the site (localhost:8000), logs them, and
forwards each lead to the English business line (704-605-1318) via the
configured delivery channel. Stdlib only — no installs.

Run:  python3 lead_server.py
"""
import json, os, sys
from datetime import datetime
from http.server import BaseHTTPRequestHandler, HTTPServer

LOG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "leads.log")

# ---- DELIVERY CONFIG (set after Chris picks a channel) ----
# Mode: "whatsapp" (CallMeBot, free, one-time activation) | "sms" (Twilio, ~$0.01/msg + $1.15/mo) | "log" (file only)
DELIVERY_MODE = os.environ.get("LEAD_MODE", "log")
TARGET_NUMBER = os.environ.get("LEAD_NUMBER", "+17046051318")   # EN line
CALLMEBOT_APIKEY = os.environ.get("CALLMEBOT_APIKEY", "")       # placeholder
TWILIO_SID = os.environ.get("TWILIO_SID", "")
TWILIO_TOKEN = os.environ.get("TWILIO_TOKEN", "")
TWILIO_FROM = os.environ.get("TWILIO_FROM", "")

def deliver(payload):
    """Forward the lead to the phone. Returns (ok, note)."""
    fmt = payload.get("form", "web")
    name = payload.get("name", "—")
    phone = payload.get("phone", "—")
    location = payload.get("location", "")
    service = payload.get("service", "")
    # Format message with the number front and center — WhatsApp auto-links it
    lines = [
        f"🔔 ALIEN TOWING — New Lead ({fmt})",
        "",
        f"Name:  {name}",
        f"📞 {phone}  ← tap to call",
    ]
    if location:
        lines.append(f"📍 {location}")
    if service and service != "other":
        lines.append(f"🚛 {service}")
    lines.append(f"")
    text = "\n".join(lines).strip()
    if DELIVERY_MODE == "whatsapp":
        import urllib.request, urllib.parse
        q = urllib.parse.urlencode({"phone": TARGET_NUMBER, "text": text, "apikey": CALLMEBOT_APIKEY})
        try:
            with urllib.request.urlopen(f"https://api.callmebot.com/whatsapp.php?{q}", timeout=20) as r:
                return r.status == 200, "callmebot"
        except Exception as e:
            return False, f"whatsapp error: {e}"
    if DELIVERY_MODE == "sms":
        import base64, urllib.request
        req = urllib.request.Request(
            f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_SID}/Messages.json",
            data=urllib.parse.urlencode({"To": TARGET_NUMBER, "From": TWILIO_FROM, "Body": text}).encode(),
            headers={"Authorization": "Basic " + base64.b64encode(f"{TWILIO_SID}:{TWILIO_TOKEN}".encode()).decode()},
        )
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                return r.status == 201, "twilio"
        except Exception as e:
            return False, f"sms error: {e}"
    return True, "logged-only"

class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(200); self._cors(); self.end_headers()

    def do_POST(self):
        if self.path != "/lead":
            self.send_response(404); self.end_headers(); return
        try:
            body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0)) or 0) or b"{}")
        except Exception:
            body = {}
        body.setdefault("ts", datetime.now().isoformat())
        # Always log locally first — nothing gets lost
        with open(LOG_FILE, "a") as f:
            f.write(json.dumps(body) + "\n")
        ok, note = deliver(body)
        resp = json.dumps({"ok": ok, "delivery": note, "logged": True}).encode()
        self.send_response(200 if ok else 502)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(resp)))
        self.end_headers()
        self.wfile.write(resp)
        print(f"[{datetime.now().isoformat()}] lead -> {note} | {body.get('name')} {body.get('phone')}")

    def log_message(self, *a):  # silence default logging
        pass

if __name__ == "__main__":
    print(f"Lead relay on :8001 | mode={DELIVERY_MODE} | target={TARGET_NUMBER} | log={LOG_FILE}")
    HTTPServer(("127.0.0.1", 8001), Handler).serve_forever()