# conservation-agent_english
Flask 기반 데모입니다. app.py는 정적/템플릿 서빙, Talisman CSP, 레이트 리밋, 헬스체크로 D-ID Agent 임베드를 안전하게 노출합니다. index.html은 위젯 타깃 영역과 최소 UI를, styles.css는 기본 스타일을 정의합니다. app.js는 오디오 자동재생 언락, 마이크 권한·테스트, 에이전트 초기화/메시지 전송을 담당합니다. Render 배포는 gunicorn+Redis 설정 포함, 기본은 client key 임베드(토큰 모드 선택).
