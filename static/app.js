// ====== 엘리먼트 참조 ======
const modeLabel = document.getElementById('mode-label');
const chip = document.getElementById('chip');
const banner = document.getElementById('banner');

const premodal = document.getElementById('premodal');
const agree = document.getElementById('agree');
const btnTest = document.getElementById('btn-test');
const teststep = document.getElementById('teststep');
const btnSpeaker = document.getElementById('btn-speaker');
const btnMicTest = document.getElementById('btn-mic-test');
const btnPermit = document.getElementById('btn-permit');

const micSel = document.getElementById('micSelect');
const spkSel = document.getElementById('spkSelect');

const btnStart = document.getElementById('btn-start');

const USE_TOKEN = !!window.__DID_USE_TOKEN_MODE__;
const AGENT_ID = window.__DID_AGENT_ID__;
const CLIENT_KEY = window.__DID_CLIENT_KEY__;

// ====== 표시/배너/칩 ======
modeLabel && (modeLabel.textContent = USE_TOKEN ? 'Token Mode (키 미노출)' : 'Demo Mode (키 노출)');
setChip('● 권한 대기');

function setChip(txt){ if (chip) chip.textContent = txt; }

let __bannerOpen = false;
function showBanner(msg, actionLabel, action){
  if (!banner) { alert(msg); return; }
  __bannerOpen = true;
  banner.classList.remove('hidden');
  banner.innerHTML = `${msg} <button id="act">${actionLabel||'확인'}</button>`;
  const act = document.getElementById('act');
  if (act) act.onclick = () => { hideBanner(); action?.(); };
}
function hideBanner(){
  if (!banner) return;
  __bannerOpen = false;
  banner.classList.add('hidden');
  banner.innerHTML = '';
}

// ====== 오디오 자동재생 언락 ======
let __audioCtx;
async function unlockAutoplay() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      if (!__audioCtx) __audioCtx = new AC();
      if (__audioCtx.state !== 'running') await __audioCtx.resume();
    }
    let el = document.getElementById('unlock');
    if (!el) {
      el = document.createElement('audio');
      el.id = 'unlock';
      el.src = '/static/test-tone.mp3';
      el.preload = 'auto';
      el.muted = true;
      el.setAttribute('playsinline', '');
      el.style.display = 'none';
      document.body.appendChild(el);
    }
    el.currentTime = 0;
    await el.play().catch(()=>{});
    setTimeout(() => { try { el.pause(); el.currentTime = 0; } catch{} }, 200);
  } catch (e) { console.debug('unlockAutoplay error:', e); }
}

// ====== 프리-퍼미션 모달 ======
agree?.addEventListener('change', ()=> btnTest && (btnTest.disabled = !agree.checked));
btnTest?.addEventListener('click', ()=>{
  premodal?.classList.remove('open');
  teststep?.classList.remove('hidden');
});

// ====== 스피커 테스트 ======
btnSpeaker?.addEventListener('click', async ()=>{
  try {
    await unlockAutoplay();
    const tone = new Audio('/static/test-tone.mp3');
    tone.loop = false; tone.currentTime = 0;
    await tone.play();
  } catch {
    showBanner('브라우저가 오디오 자동 재생을 차단했습니다.', '다시 시도');
  }
});

// ====== 마이크 테스트 (VU meter) ======
const vu = document.getElementById('vu'); const vuctx = vu?.getContext?.('2d');
btnMicTest?.addEventListener('click', async ()=>{
  try {
    await unlockAutoplay();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audio = new (window.AudioContext||window.webkitAudioContext)();
    const src = audio.createMediaStreamSource(stream);
    const analyser = audio.createAnalyser(); analyser.fftSize = 512;
    src.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    const draw = ()=>{
      analyser.getByteTimeDomainData(data);
      let sum=0; for (let i=0;i<data.length;i++){ const v=(data[i]-128)/128; sum+=v*v; }
      const rms = Math.sqrt(sum/data.length);
      if (vuctx && vu) {
        vuctx.clearRect(0,0,vu.width,vu.height);
        vuctx.fillStyle = '#10b981';
        vuctx.fillRect(0,0,Math.min(vu.width, rms*vu.width*3), vu.height);
      }
      requestAnimationFrame(draw);
    };
    draw();
  } catch {
    showBanner('마이크 접근이 필요합니다.', '권한 다시 요청', ()=> navigator.mediaDevices.getUserMedia({audio:true}));
  }
});

// ====== 디바이스 리스트 ======
async function listDevices(){
  try { await navigator.mediaDevices.getUserMedia({audio:true}); } catch {}
  if (!navigator.mediaDevices?.enumerateDevices) return;
  const devs = await navigator.mediaDevices.enumerateDevices();
  if (micSel) {
    micSel.innerHTML = devs.filter(d=>d.kind==='audioinput')
      .map(d=>`<option value="${d.deviceId}">${d.label||'마이크'}</option>`).join('');
  }
  if (spkSel) {
    spkSel.innerHTML = devs.filter(d=>d.kind==='audiooutput')
      .map(d=>`<option value="${d.deviceId}">${d.label||'스피커'}</option>`).join('');
  }
}
listDevices();

// ====== 권한 요청 + 시작 준비 ======
btnPermit?.addEventListener('click', async ()=>{
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    setChip('● 준비 완료');
  } catch {
    return showBanner('마이크 권한이 거부되었습니다.', '다시 요청', ()=> navigator.mediaDevices.getUserMedia({audio:true}));
  }
  btnStart?.focus();
});

// ====== D-ID Agent 로드 감지 (이벤트 + 폴링 혼합, 타임아웃 30초) ======
function waitForAgent(timeoutMs = 30000) {
  return new Promise(resolve => {
    // 1) 이미 준비됨
    if (window.didAgent) return resolve(window.didAgent);

    // 2) 이벤트 기반
    const onReady = (e) => {
      cleanup();
      resolve(window.didAgent || e.detail?.agent || null);
    };
    const onError = (e) => {
      // SDK 내부 에러 이벤트가 올라오면 참고 로그만 남기고 대기 유지(늦게라도 준비될 수 있으므로)
      console.warn('[did-agent-error]', e?.detail || e);
    };
    window.addEventListener('did-agent-ready', onReady);
    window.addEventListener('did-agent-error', onError);

    // 3) 폴링(보수적)
    const start = Date.now();
    const it = setInterval(() => {
      if (window.didAgent) { cleanup(); resolve(window.didAgent); }
      else if (Date.now() - start > timeoutMs) { cleanup(); resolve(null); }
    }, 120);

    function cleanup(){
      clearInterval(it);
      window.removeEventListener('did-agent-ready', onReady);
      window.removeEventListener('did-agent-error', onError);
    }
  });
}

// ====== Token 모드: (현재 false이므로 미사용, 참고용) ======
async function initTokenMode() {
  try {
    const resp = await fetch('/token', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ agent_id: AGENT_ID })
    });
    const data = await resp.json();
    if (!resp.ok) return showBanner('토큰 발급 실패', '다시 시도', ()=> initTokenMode());

    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://agent.d-id.com/v2/index.js';
    script.setAttribute('data-mode', 'full');
    script.setAttribute('data-name', 'did-agent');
    script.setAttribute('data-monitor', 'false'); // 텔레메트리 비활성화(불필요 오류소음 감소)
    script.setAttribute('data-target-id', 'did-container');
    if (data.token) script.setAttribute('data-auth-token', data.token);
    if (data.session_id) script.setAttribute('data-session-id', data.session_id);
    if (AGENT_ID) script.setAttribute('data-agent-id', AGENT_ID);
    document.body.appendChild(script);
  } catch (e) {
    console.error('[initTokenMode]', e);
    showBanner('토큰 초기화 중 오류가 발생했습니다.', '다시 시도', ()=> initTokenMode());
  }
}

// ====== Start 버튼: 세션 시작 + 인삿말 ======
// ====== Start 버튼: 세션 시작 + 인삿말 ======
let __starting = false;
btnStart?.addEventListener('click', async (e) => {
  e.preventDefault();
  if (__starting) return;
  __starting = true;

  hideBanner();

  // 1) 오디오 언락 + 마이크 권한
  await unlockAutoplay();
  try { await navigator.mediaDevices.getUserMedia({ audio: true }); }
  catch (err) {
    console.error('[perm] mic denied:', err);
    __starting = false;
    return showBanner('마이크 권한이 필요합니다.', '다시 요청', ()=> navigator.mediaDevices.getUserMedia({audio:true}));
  }

  setChip('● 연결 중…');

  // 2) (토큰 모드면) SDK 동적 주입
  if (USE_TOKEN) {
    await initTokenMode();
  } else {
    if (!CLIENT_KEY || !AGENT_ID) {
      __starting = false;
      return showBanner('임베드 설정 누락: Client Key 또는 Agent ID가 없습니다.', '새로고침', ()=> location.reload());
    }
  }

  // 3) 에이전트 준비 (기본 30초 대기)
  // const agent = await waitForAgent(30000);
  // if (!agent) {
  //   __starting = false;
  //   console.error('[Agent] 로드 실패: window.didAgent=', window.didAgent);
  //   return showBanner('에이전트 로드 실패 (콘솔 확인)', '새로고침', ()=> location.reload());
  // }

  hideBanner();
  setChip('● 준비 완료');

  // 4) 세션 시작 (마이크는 UI에서 제어)
  try {
    if (typeof agent.start === 'function') {
      await agent.start(); // 세션만 열기
    }
  } catch (err) {
    __starting = false;
    console.error('[Agent.start] 실패:', err);
    // 오류 칩/배너 제거
    return;
  }

  // 5) 초기 메시지
  try {
    await agent.send({ role: 'system', content: 'You are an English-speaking AI avatar. Always respond in English only.' });
    await agent.send({ role: 'user', content: 'Hello! Let’s talk in English from now on.' });
    setChip('● 연결됨');
  } catch (e2) {
    console.error('[Agent.send] error:', e2);
    // 오류 칩/배너 제거
  } finally {
    __starting = false;
  }
});

// ====== 전역 에러 로깅 ======
window.addEventListener('error', (e) => console.error('[window error]', e));
window.addEventListener('unhandledrejection', (e) => console.error('[promise rejection]', e?.reason));