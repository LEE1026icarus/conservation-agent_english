# conservation-agent_english
이 서비스는 D-ID Agent를 웹에 임베딩하여 사용자가 직접 AI 아바타와 음성으로 대화할 수 있게 해주는 플랫폼입니다. Flask 서버가 안전한 환경에서 정적 페이지를 제공하고, 브라우저에서 에이전트 SDK를 불러와 마이크 권한·오디오 연결을 처리합니다. Render 배포를 통해 별도 서버 설정 없이도 누구나 접근 가능한 실시간 대화형 웹 서비스를 제공합니다.

```markdown
# 🎤 D-ID Agent Web Embed Demo

이 프로젝트는 **D-ID Agent**를 웹에 임베딩하여 사용자가 브라우저에서 직접 AI 아바타와 실시간으로 대화할 수 있는 데모 서비스입니다.  
Flask 서버가 정적 페이지를 안전하게 제공하고, 프론트엔드에서는 D-ID SDK를 불러와 마이크 권한·오디오 연결을 관리합니다. Render 등 PaaS 환경에서 손쉽게 배포할 수 있습니다.

---

## ✨ 기능
- Flask 기반 웹 서버
- 안전한 CSP(Content Security Policy) 및 Rate Limiter 적용
- 정적 HTML/CSS/JS로 D-ID Agent 임베딩
- 브라우저 마이크 권한 요청 및 음성 대화 지원
- Render 배포 및 HTTPS 지원

---

## 📂 프로젝트 구조
```

project/
├─ app.py              # Flask 서버 (CSP, 라우팅, 헬스체크)
├─ requirements.txt    # Python 의존성 패키지
├─ Procfile            # Render/Gunicorn 실행 설정
├─ static/
│   ├─ styles.css
│   ├─ app.js
│   └─ favicon.ico
└─ templates/
└─ index.html

````

---

## ⚙️ 환경 변수
Render 또는 로컬 `.env` 파일에 다음 변수를 설정하세요:

```env
DID_CLIENT_KEY=발급받은_클라이언트키
DID_AGENT_ID=생성한_Agent_ID
REDIS_URL=redis://localhost:6379 (선택)
````

* **DID\_CLIENT\_KEY**: D-ID 대시보드에서 발급받은 Client Key (공개 가능)
* **DID\_AGENT\_ID**: D-ID 대시보드에서 생성한 Agent의 ID
* **REDIS\_URL**: Rate limiting 용 Redis (선택, 기본은 in-memory)

---

## 🚀 실행 방법

### 로컬 실행

```bash
pip install -r requirements.txt
python app.py
```

→ [http://localhost:5000](http://localhost:5000) 접속

### 프로덕션 (Gunicorn)

```bash
gunicorn -w 2 -k gthread -t 60 -b 0.0.0.0:5000 app:app
```

---

## ☁️ Render 배포

1. Render Web Service 생성
2. Python 3.10+ 환경 선택
3. `requirements.txt`, `Procfile` 포함된 레포 업로드
4. Render 대시보드에서 환경 변수 등록
5. 배포 완료 후, D-ID 대시보드에서 **Allowed Origins**에 Render 도메인 추가

---

## 📜 라이선스

이 프로젝트는 [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)에 따라 배포됩니다.

```

---

