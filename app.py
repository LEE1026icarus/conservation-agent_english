import os
from flask import Flask, render_template
from flask_talisman import Talisman
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__, static_folder="static", template_folder="templates")

# ─────────────────────────────────────────────────────────
# CSP: D-ID 에이전트 임베드 허용 도메인만 열어두기
# (Agent 스크립트/iframe/웹소켓 등이 agent.d-id.com 및 *.d-id.com으로 나갑니다)
# ─────────────────────────────────────────────────────────
# app.py 중 csp 설정만 교체
# app.py
# app.py
csp = {
    "default-src": ["'self'"],

    "script-src": [
        "'self'", "https://agent.d-id.com", "https://*.d-id.com",
        "'unsafe-inline'", "blob:"
    ],
    "script-src-elem": [
        "'self'", "https://agent.d-id.com", "https://*.d-id.com",
        "'unsafe-inline'", "blob:"
    ],

    "style-src": [
        "'self'", "'unsafe-inline'",
        "https://agent.d-id.com", "https://*.d-id.com",
        "https://fonts.googleapis.com"
    ],
    "style-src-elem": [
        "'self'", "'unsafe-inline'",
        "https://agent.d-id.com", "https://*.d-id.com",
        "https://fonts.googleapis.com"
    ],

    "font-src": [
        "'self'", "data:",
        "https://fonts.gstatic.com", "https://*.d-id.com"
    ],

    "img-src": [
        "'self'", "data:", "blob:",
        "https://*.d-id.com", "https://create-images-results.d-id.com"
    ],

    "connect-src": [
        "'self'",
        "https://agent.d-id.com", "https://*.d-id.com", "https://api.d-id.com",
        "wss://agent.d-id.com", "wss://*.d-id.com",
        # 텔레메트리 / STT
        "https://api-js.mixpanel.com", "https://*.mixpanel.com",
        "https://*.datadoghq.com",
        "https://*.ingest.us.sentry.io", "https://*.sentry.io",
        "https://*.speech.microsoft.com", "wss://*.speech.microsoft.com"
    ],

    "frame-src": ["'self'", "https://agent.d-id.com", "https://*.d-id.com"],
    "child-src": ["'self'", "https://agent.d-id.com", "https://*.d-id.com"],
    "media-src": ["'self'", "blob:", "data:", "https://agent.d-id.com", "https://*.d-id.com"],

    # ← 여기에 data: 추가!
    "worker-src": ["'self'", "blob:", "data:"],
}



talisman = Talisman(app, content_security_policy=csp, force_https=False)

# ─────────────────────────────────────────────────────────
# 레이트 리밋 (선택)
# ─────────────────────────────────────────────────────────
storage_uri = os.getenv("REDIS_URL", "memory://")
limiter = Limiter(
    get_remote_address,
    app=app,
    storage_uri=storage_uri,
    default_limits=["2000 per 10 minutes"]  # 전역 기본 제한 완화
)

# ─────────────────────────────────────────────────────────
# 환경변수 (임베드 전용: 서버 비밀키 불필요)
# ─────────────────────────────────────────────────────────
DID_CLIENT_KEY = (os.getenv("DID_CLIENT_KEY") or "").strip()  # 공개 가능(프론트 노출 OK)
DID_AGENT_ID   = (os.getenv("DID_AGENT_ID") or "").strip()    # 대시보드의 Agent ID

@app.route("/")
@limiter.limit("200 per minute")   # 루트 엔드포인트 제한 완화
def index():
    # 템플릿에서 data-* 속성으로 꽂아 넣을 값들
    return render_template(
        "index.html",
        did_client_key=DID_CLIENT_KEY,
        did_agent_id=DID_AGENT_ID
    )

@app.route("/healthz")
def healthz():
    return "ok", 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))   # 로컬에서는 5000, Render에서는 자동 할당
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"  # 프로덕션에서 debug 꺼두기
    print(f"Starting server on port {port} (debug={debug})")
    app.run(host="0.0.0.0", port=port, debug=debug)



