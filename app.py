# app.py (수정본)
import os
from flask import Flask, render_template
from flask_talisman import Talisman
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__, static_folder="static", template_folder="templates")

# ── CSP (생략없이 그대로) ─────────────────────────────────────────
csp = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "https://agent.d-id.com", "https://*.d-id.com", "'unsafe-inline'", "blob:"],
    "script-src-elem": ["'self'", "https://agent.d-id.com", "https://*.d-id.com", "'unsafe-inline'", "blob:"],
    "style-src": ["'self'", "'unsafe-inline'", "https://agent.d-id.com", "https://*.d-id.com", "https://fonts.googleapis.com"],
    "style-src-elem": ["'self'", "'unsafe-inline'", "https://agent.d-id.com", "https://*.d-id.com", "https://fonts.googleapis.com"],
    "font-src": ["'self'", "data:", "https://fonts.gstatic.com", "https://*.d-id.com"],
    "img-src": ["'self'", "data:", "blob:", "https://*.d-id.com", "https://create-images-results.d-id.com"],
    "connect-src": [
        "'self'",
        "https://agent.d-id.com", "https://*.d-id.com", "https://api.d-id.com",
        "wss://agent.d-id.com", "wss://*.d-id.com",
        "https://api-js.mixpanel.com", "https://*.mixpanel.com",
        "https://*.datadoghq.com",
        "https://*.ingest.us.sentry.io", "https://*.sentry.io",
        "https://*.speech.microsoft.com", "wss://*.speech.microsoft.com"
    ],
    "frame-src": ["'self'", "https://agent.d-id.com", "https://*.d-id.com"],
    "child-src": ["'self'", "https://agent.d-id.com", "https://*.d-id.com"],
    "media-src": ["'self'", "blob:", "data:", "https://agent.d-id.com", "https://*.d-id.com"],
    "worker-src": ["'self'", "blob:", "data:"],
}
talisman = Talisman(app, content_security_policy=csp, force_https=False)

# ── Rate Limit ─────────────────────────────────────────
storage_uri = os.getenv("REDIS_URL", "memory://")
limiter = Limiter(get_remote_address, app=app, storage_uri=storage_uri, default_limits=["2000 per 10 minutes"])

# ── 환경변수 ─────────────────────────────────────────
DID_CLIENT_KEY = (os.getenv("DID_CLIENT_KEY") or "").strip()
DID_AGENT_ID   = (os.getenv("DID_AGENT_ID") or "").strip()

# ✅ 엔드포인트 이름을 명시하여 충돌 방지 (endpoint="index")
@app.route("/", endpoint="index")
@limiter.limit("200 per minute")
def index():
    return render_template("index.html", did_client_key=DID_CLIENT_KEY, did_agent_id=DID_AGENT_ID)

# ✅ 헬스체크도 명시 (endpoint="healthz")
@app.route("/healthz", endpoint="healthz")
def healthz():
    return "ok", 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    print(f"Starting server on port {port} (debug={debug})")
    app.run(host="0.0.0.0", port=port, debug=debug)
