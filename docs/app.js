// AI 수학 첫걸음 — 화면 이동, 진도 저장, 퀴즈, 체험 위젯, 앱 설치
// 화면 주소(해시):  #/ 홈 · #/c/코스 · #/c/코스/레슨 · #/words 용어 · #/help 사용법

// ───────── 공통 도구 ─────────
const $ = s => document.querySelector(s);
const view = $('#view');
const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const fmt = (v, d = 2) => {                       // 숫자를 보기 좋게 (−0 방지, 불필요한 0 제거)
  if (!isFinite(v)) return v > 0 ? '∞' : '−∞';
  const s = (+v.toFixed(d)).toString();
  return (s === '-0' ? '0' : s).replace('-', '−');
};
let tt;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => t.hidden = true, 2000); }

// ───────── 진도 저장 ─────────
// 레슨 열쇠 "코스/레슨"(예: basic/sigma)로 저장 → 레슨을 추가·순서 변경해도 기록이 유지된다.
const STORE = 'ai-math-progress-v1';
let prog = {};
try { prog = JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) {}
const saveProg = () => { try { localStorage.setItem(STORE, JSON.stringify(prog)); } catch (e) {} };
const lkey = (c, l) => `${c.id}/${l.id}`;
const isDone = (c, l) => !!prog[lkey(c, l)];
const doneCount = c => c.lessons.filter(l => isDone(c, l)).length;
const totalLessons = COURSES.reduce((a, c) => a + c.lessons.length, 0);
function nextLesson() {                            // 아직 안 끝낸 첫 레슨
  for (const c of COURSES) for (const l of c.lessons) if (!isDone(c, l)) return [c, l];
  return null;
}

// ───────── 화면 이동 ─────────
let cleanup = [];                                  // 화면을 떠날 때 멈춰야 할 애니메이션 등
function route() {
  cleanup.forEach(f => f()); cleanup = [];
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const tab = parts[0] === 'words' ? 'words' : parts[0] === 'help' ? 'help' : 'home';
  document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  const back = $('#back');
  if (parts[0] === 'c') {
    const c = COURSES.find(x => x.id === parts[1]);
    if (!c) return go('#/');
    const l = parts[2] && c.lessons.find(x => x.id === parts[2]);
    back.hidden = false;
    back.onclick = () => go(l ? `#/c/${c.id}` : '#/');
    l ? renderLesson(c, l) : renderCourse(c);
  } else {
    back.hidden = true;
    if (tab === 'words') renderWords(); else if (tab === 'help') renderHelp(); else renderHome();
  }
  window.scrollTo(0, 0);
}
const go = h => { location.hash = h; };
addEventListener('hashchange', route);

// ───────── 홈 ─────────
function renderHome() {
  $('#title').textContent = 'AI 수학 첫걸음';
  const total = COURSES.reduce((a, c) => a + doneCount(c), 0);
  const nx = nextLesson();
  view.innerHTML = `<div class="stack">
    <div class="hero"><h2>AI 수학 첫걸음 ✨</h2>
      <p>수학이 처음이어도 괜찮아요. 그래프를 직접 움직이며 배우고, 퀴즈로 확인해요.</p>
      <div class="bar"><i style="width:${total / totalLessons * 100}%"></i></div>
      <p style="margin-top:6px;font-size:13px">완료 ${total} / ${totalLessons} 레슨</p>
      ${nx ? `<button class="cont" id="cont">${total ? '▶ 이어서 학습하기' : '▶ 첫 레슨 시작하기'}<br><small style="font-weight:600">${nx[0].no}. ${nx[0].title} · ${nx[1].title}</small></button>`
           : '<button class="cont" id="cont">🎉 모든 레슨 완료! 처음부터 복습하기</button>'}
    </div>
    <p class="muted" style="margin:4px 2px 0;font-size:14px">순서대로 공부하면 좋아요. 앞 코스가 다음 코스의 준비 운동이에요.</p>
    ${COURSES.map(c => `<button class="course" data-c="${c.id}">
      <span class="em" style="background:${c.color}22">${c.emoji}</span>
      <span class="ct"><b>${c.no}. ${c.title}</b><span class="d">${c.desc}</span>
        <span class="bar"><i style="width:${doneCount(c) / c.lessons.length * 100}%;background:${c.color}"></i></span>
        <span class="pct">${doneCount(c)} / ${c.lessons.length} 레슨 완료</span></span></button>`).join('')}
  </div>`;
  $('#cont').onclick = () => { const n = nextLesson() || [COURSES[0], COURSES[0].lessons[0]]; go(`#/c/${n[0].id}/${n[1].id}`); };
  view.querySelectorAll('[data-c]').forEach(b => b.onclick = () => go(`#/c/${b.dataset.c}`));
}

// ───────── 코스 ─────────
const REPO = 'https://github.com/sinaboro/ai-math-basics';
function renderCourse(c) {
  $('#title').textContent = `${c.no}. ${c.title}`;
  view.innerHTML = `<div class="stack">
    <div class="chead" style="background:${c.color}"><h2>${c.emoji} ${c.title}</h2><p>${c.desc}</p>
      <div class="bar" style="background:rgba(255,255,255,.3)"><i style="width:${doneCount(c) / c.lessons.length * 100}%;background:#fff"></i></div>
      <p style="font-size:13px">${doneCount(c)} / ${c.lessons.length} 레슨 완료</p></div>
    ${c.lessons.map((l, i) => `<button class="les ${isDone(c, l) ? 'done' : ''}" data-l="${l.id}">
      <span class="n">${isDone(c, l) ? '✓' : i + 1}</span><span class="t">${l.title}<br><span class="s">${isDone(c, l) ? '완료 · 다시 보기' : `퀴즈 ${l.quiz.length}문제`}</span></span><span>›</span></button>`).join('')}
    ${c.pdf ? `<div class="links">
      <a href="${REPO}/blob/main/${encodeURI(c.pdf)}" target="_blank" rel="noopener">📄 교안 PDF 보기</a>
      <a href="${REPO}/tree/main/${encodeURI(c.code)}" target="_blank" rel="noopener">💻 실습 코드 (파이썬)</a>
    </div>
    <p class="muted" style="font-size:12.5px;margin:0">교안·실습 코드는 인터넷이 연결되어 있을 때 GitHub에서 열려요.</p>`
    : '<p class="muted" style="font-size:13px;margin:0">이 코스는 앞의 세 코스를 마친 뒤 딥러닝으로 넘어가기 위한 보충 코스예요.</p>'}
  </div>`;
  view.querySelectorAll('[data-l]').forEach(b => b.onclick = () => go(`#/c/${c.id}/${b.dataset.l}`));
}

// ───────── 레슨 ─────────
function renderLesson(c, l) {
  const i = c.lessons.indexOf(l), prev = c.lessons[i - 1], next = c.lessons[i + 1];
  const ci = COURSES.indexOf(c), nextCourse = COURSES[ci + 1];
  $('#title').textContent = l.title;
  view.innerHTML = `<div class="stack">
    <div class="lhead"><span class="k" style="color:${c.color}">${c.emoji} ${c.title} · ${i + 1} / ${c.lessons.length}</span>
      <h2>${l.title}</h2>
      <div class="dots">${c.lessons.map((x, k) => `<i class="${k === i ? 'on' : isDone(c, x) ? 'ok' : ''}"></i>`).join('')}</div></div>
    <div class="card body">${l.body}</div>
    <div class="sumbox"><h3>✅ 핵심 정리</h3><ul>${l.sum.map(s => `<li>${s}</li>`).join('')}</ul></div>
    <div class="card quiz" id="quiz"></div>
    <div class="nav2">
      ${prev ? `<button data-go="#/c/${c.id}/${prev.id}">‹ 이전</button>` : `<button data-go="#/c/${c.id}">‹ 목록</button>`}
      ${next ? `<button class="pri" data-go="#/c/${c.id}/${next.id}">다음 ›</button>`
             : nextCourse ? `<button class="pri" data-go="#/c/${nextCourse.id}">다음 코스: ${nextCourse.title} ›</button>`
             : `<button class="pri" data-go="#/">🎉 홈으로</button>`}
    </div></div>`;
  view.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
  view.querySelectorAll('.w[data-w]').forEach(el => { const f = WIDGETS[el.dataset.w]; if (f) f(el); });
  renderQuiz(c, l);
}

// 퀴즈: 문제마다 고르면 바로 정답·해설. 모두 맞히면 레슨 완료.
function renderQuiz(c, l) {
  const box = $('#quiz');
  const picked = l.quiz.map(() => null);
  const draw = () => {
    const answered = picked.every(p => p !== null);
    const allRight = answered && picked.every((p, k) => p === l.quiz[k].a);
    box.innerHTML = `<h3>📝 확인 퀴즈 ${isDone(c, l) ? '<small style="color:var(--ok)">· 완료한 레슨</small>' : ''}</h3>` +
      l.quiz.map((q, k) => `<div class="qq"><p>Q${k + 1}. ${q.q}</p><div class="qo">${q.o.map((o, j) => {
        let cls = '';
        if (picked[k] !== null) { if (j === q.a) cls = 'right'; else if (j === picked[k]) cls = 'wrong'; }
        return `<button data-q="${k}" data-o="${j}" class="${cls}" ${picked[k] !== null ? 'disabled' : ''}>${o}</button>`;
      }).join('')}</div>${picked[k] !== null ? `<div class="qe ${picked[k] === q.a ? 'ok' : 'no'}">${picked[k] === q.a ? '⭕ 정답!' : '❌ 아쉬워요.'} ${q.e}</div>` : ''}</div>`).join('') +
      (answered ? `<div class="qres">${allRight ? '🎉 모두 맞혔어요! 레슨 완료' : `${picked.filter((p, k) => p === l.quiz[k].a).length} / ${l.quiz.length} 정답`}</div>
        ${allRight ? '' : '<div class="btns" style="display:flex;margin-top:8px"><button class="btnw" id="retry" style="flex:1">↺ 틀린 문제 다시 풀기</button></div>'}` : '');
    box.querySelectorAll('[data-q]').forEach(b => b.onclick = () => {
      picked[+b.dataset.q] = +b.dataset.o; draw();
      if (picked.every(p => p !== null) && picked.every((p, k) => p === l.quiz[k].a) && !isDone(c, l)) {
        prog[lkey(c, l)] = Date.now(); saveProg(); toast('🎉 레슨 완료! 진도에 기록했어요');
        const dots = view.querySelectorAll('.dots i'); dots[c.lessons.indexOf(l)].className = 'on';
      }
    });
    const r = box.querySelector('#retry');
    if (r) r.onclick = () => { picked.forEach((p, k) => { if (p !== l.quiz[k].a) picked[k] = null; }); draw(); };
  };
  draw();
}

// ───────── 용어 ─────────
function renderWords() {
  $('#title').textContent = '용어 사전';
  view.innerHTML = `<div class="stack"><input class="search" id="wq" type="search" placeholder="용어 검색 (예: 미분, 학습률)">
    <div class="card" id="wl" style="padding:4px 14px"></div></div>`;
  const draw = () => {
    const q = $('#wq').value.trim().toLowerCase();
    const list = GLOSSARY.filter(([t, d]) => !q || (t + d).toLowerCase().includes(q));
    $('#wl').innerHTML = list.length ? list.map(([t, d]) => `<div class="gl"><b>${t}</b><span>${d}</span></div>`).join('')
      : '<p class="muted">찾는 용어가 없어요.</p>';
  };
  $('#wq').oninput = draw; draw();
}

// ───────── 사용법 ─────────
function renderHelp() {
  $('#title').textContent = '사용법';
  const installed = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const sec = (t, b) => `<div class="card help"><h3>${t}</h3>${b}</div>`;
  view.innerHTML = `<div class="stack">
    ${sec('📚 이렇게 공부해요', `<ol>
      <li><b>학습</b> 탭에서 코스를 고릅니다. <b>기초 수학 → 경사하강법 → 오차역전파 → 딥러닝 준비 수학</b> 순서를 추천해요.</li>
      <li>레슨을 읽으며 <b>🖐 직접 해 보기</b> 상자의 슬라이더·버튼을 움직여 보세요. 눈으로 보면 훨씬 쉬워요.</li>
      <li>맨 아래 <b>📝 확인 퀴즈</b>를 모두 맞히면 레슨이 <b>완료</b>되고 진도에 기록됩니다.</li>
      <li>홈의 <b>▶ 이어서 학습하기</b>를 누르면 아직 안 끝낸 레슨으로 바로 가요.</li></ol>`)}
    ${sec('🧭 화면 보는 법', `<ul>
      <li><span style="background:var(--sun-soft);padding:0 4px">노란 상자</span> 예시 · <span style="background:var(--accent-soft);padding:0 4px">파란 상자</span> 꼭 알아 둘 규칙 · 점선 상자 💡 팁</li>
      <li>🐍 검은 상자는 같은 내용을 파이썬으로 쓴 코드예요. 코드를 몰라도 넘어가도 괜찮아요.</li>
      <li>어려운 말은 <b>용어</b> 탭에서 찾아보세요.</li>
      <li>각 코스 화면 아래에 <b>교안 PDF</b>와 <b>실습 코드</b> 링크가 있어요.</li></ul>`)}
    ${sec('📲 앱으로 설치 · 오프라인', `<ul>
      <li>${installed ? '✅ 지금 <b>앱으로 실행 중</b>이에요.' : 'Chrome: 위쪽 <b>[설치]</b> 안내 또는 <b>⋮ → 앱 설치</b> · 아이폰 Safari: <b>공유 → 홈 화면에 추가</b>'}</li>
      <li>카카오톡에서 링크를 열면 자동으로 Chrome(아이폰은 Safari)으로 넘어가요.</li>
      <li>설치 후 인터넷이 될 때 <b>한 번 열어 두면</b> 비행기 모드에서도 공부할 수 있어요. (교안 PDF 링크는 인터넷 필요)</li>
      <li>새 레슨이 추가되면 인터넷이 될 때 앱을 열면 <b>자동으로 업데이트</b>돼요.</li></ul>`)}
    ${sec('💾 진도 기록', `<ul>
      <li>완료한 레슨은 <b>이 폰의 이 브라우저</b>에만 저장돼요. 업데이트해도 그대로 남아요.</li>
      <li>다른 폰에서는 처음부터 시작해요.</li></ul>
      <div class="btns" style="display:flex;margin-top:10px"><button class="btnw" id="reset" style="flex:1">진도 기록 지우기</button></div>`)}
    <p class="muted c" style="font-size:13px">레슨 ${totalLessons}개 · 퀴즈 ${COURSES.reduce((a, c) => a + c.lessons.reduce((b, l) => b + l.quiz.length, 0), 0)}문제 · <a href="${REPO}" target="_blank" rel="noopener">GitHub</a></p>
  </div>`;
  $('#reset').onclick = () => { if (confirm('완료한 레슨 기록을 모두 지울까요?')) { prog = {}; saveProg(); toast('진도 기록을 지웠어요'); } };
}

// ───────── 그래프 그리기 도구 ─────────
// el 안에 캔버스를 만들고, 수학 좌표(x, y)를 화면 좌표로 바꿔 주는 함수들을 돌려준다.
function plot(el, height, r) {
  const cv = document.createElement('canvas');
  el.appendChild(cv);
  const W = Math.max(260, el.clientWidth - 2), H = height, dpr = window.devicePixelRatio || 1;
  cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
  const P = 26;
  const X = x => P + (x - r.x0) / (r.x1 - r.x0) * (W - P - 8);
  const Y = y => H - P + 6 - (y - r.y0) / (r.y1 - r.y0) * (H - P - 4);
  const p = {
    ctx, W, H, X, Y,
    clear() {                                           // 배경, 눈금, 축
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = css('--surface'); ctx.fillRect(0, 0, W, H);
      ctx.lineWidth = 1; ctx.font = '11px sans-serif'; ctx.fillStyle = css('--muted');
      const sx = r.sx || 1, sy = r.sy || 1;
      for (let x = Math.ceil(r.x0 / sx) * sx; x <= r.x1; x += sx) {
        ctx.strokeStyle = css('--grid'); ctx.beginPath(); ctx.moveTo(X(x), Y(r.y0)); ctx.lineTo(X(x), Y(r.y1)); ctx.stroke();
        ctx.textAlign = 'center'; ctx.fillText(+x.toFixed(2), X(x), H - 8);
      }
      for (let y = Math.ceil(r.y0 / sy) * sy; y <= r.y1; y += sy) {
        ctx.strokeStyle = css('--grid'); ctx.beginPath(); ctx.moveTo(X(r.x0), Y(y)); ctx.lineTo(X(r.x1), Y(y)); ctx.stroke();
        ctx.textAlign = 'right'; ctx.fillText(+y.toFixed(2), P - 4, Y(y) + 4);
      }
      ctx.strokeStyle = css('--axis'); ctx.lineWidth = 1.4;
      if (r.y0 <= 0 && r.y1 >= 0) { ctx.beginPath(); ctx.moveTo(X(r.x0), Y(0)); ctx.lineTo(X(r.x1), Y(0)); ctx.stroke(); }
      if (r.x0 <= 0 && r.x1 >= 0) { ctx.beginPath(); ctx.moveTo(X(0), Y(r.y0)); ctx.lineTo(X(0), Y(r.y1)); ctx.stroke(); }
      if (r.xl) { ctx.fillStyle = css('--muted'); ctx.textAlign = 'right'; ctx.fillText(r.xl, W - 6, Y(r.y0) - 6); }
      if (r.yl) { ctx.textAlign = 'left'; ctx.fillText(r.yl, P + 4, 12); }
    },
    fn(f, color, width = 2.4, dash) {                  // 함수 그래프
      ctx.save(); ctx.beginPath(); ctx.rect(P, 0, W - P, H - P + 6); ctx.clip();
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash || []); ctx.beginPath();
      for (let i = 0; i <= 200; i++) { const x = r.x0 + (r.x1 - r.x0) * i / 200, y = f(x); i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)); }
      ctx.stroke(); ctx.restore();
    },
    dot(x, y, color, rad = 5, label) {
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(X(x), Y(y), rad, 0, 7); ctx.fill();
      if (label) { ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(label, X(x) + 8, Y(y) - 8); }
    },
    inside: (x, y) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1,
  };
  return p;
}
// 슬라이더 한 줄
function slider(el, label, min, max, step, val, onInput) {
  const d = document.createElement('div'); d.className = 'ctl';
  d.innerHTML = `<label>${label}</label><input type="range" min="${min}" max="${max}" step="${step}" value="${val}"><output>${fmt(val)}</output>`;
  el.appendChild(d);
  const inp = d.querySelector('input'), out = d.querySelector('output');
  inp.oninput = () => { out.textContent = fmt(+inp.value); onInput(+inp.value); };
  return inp;
}
const div = (el, cls, html = '') => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; el.appendChild(d); return d; };
const lineStr = (w, b, v = 'x') => {                  // "ŷ = 2x + 1" 처럼 보기 좋게
  const ws = w === 0 ? '' : w === 1 ? v : w === -1 ? `−${v}` : `${fmt(w)}${v}`;
  const bs = b === 0 ? '' : (ws ? (b > 0 ? ` + ${fmt(b)}` : ` − ${fmt(-b)}`) : fmt(b));
  return ws + bs || '0';
};

// ───────── 체험 위젯 ─────────
const WIDGETS = {
  // Σ를 반복문처럼 한 단계씩
  sigma(el) {
    const x = [2, 4, 6, 8, 10];
    let i = 0, total = 0;
    const cells = div(el, 'cells'), out = div(el, 'out'), btns = div(el, 'btns',
      '<button class="pri" data-a="step">한 단계 ▶</button><button data-a="all">끝까지</button><button data-a="reset">처음부터</button>');
    const draw = (msg) => {
      cells.innerHTML = x.map((v, k) => `<span class="${k === i - 1 ? 'on' : k < i - 1 ? 'used' : ''}"><small>x<sub>${k + 1}</sub></small>${v}</span>`).join('');
      out.innerHTML = msg || `total = 0 에서 시작해요. <b>[한 단계]</b>를 눌러 보세요.`;
    };
    btns.onclick = e => {
      const a = e.target.dataset.a; if (!a) return;
      if (a === 'reset') { i = 0; total = 0; return draw(); }
      const stepOnce = () => { const before = total; total += x[i]; i++; return `i = ${i} : total = ${before} + x<sub>${i}</sub>(${x[i - 1]}) = <b>${total}</b>`; };
      if (i >= x.length) return draw(`끝! Σx<sub>i</sub> = <b>${total}</b> (n = 5개를 모두 더함)`);
      let msg = stepOnce();
      if (a === 'all') while (i < x.length) msg = stepOnce();
      draw(i >= x.length ? `${msg}<br>✅ 끝! Σx<sub>i</sub> = 2 + 4 + 6 + 8 + 10 = <b>${total}</b>` : msg);
    };
    draw();
  },

  // y = wx + b 직선
  line(el) {
    let w = 2, b = 1;
    const p = plot(el, 240, { x0: -5, x1: 5, y0: -8, y1: 8, sx: 1, sy: 2 });
    const out = div(el, 'out');
    const draw = () => {
      p.clear();
      p.fn(x => w * x + b, css('--accent'), 3);
      p.dot(0, b, css('--sun'), 6, `b = ${fmt(b)}`);
      if (p.inside(1, w + b)) p.dot(1, w * 1 + b, css('--accent'), 4);
      out.innerHTML = `<span class="m">ŷ = ${lineStr(w, b)}</span> &nbsp; x가 1 늘면 y는 <b>${fmt(w)}</b> 변해요. x = 0 일 때 y = <b>${fmt(b)}</b>`;
    };
    slider(el, 'w 기울기', -3, 3, 0.5, w, v => { w = v; draw(); });
    slider(el, 'b 절편', -4, 4, 0.5, b, v => { b = v; draw(); });
    draw();
  },

  // y = (x − p)² + q 그릇 모양
  parabola(el) {
    let pp = 0, q = 0;
    const p = plot(el, 240, { x0: -5, x1: 5, y0: -3, y1: 12, sx: 1, sy: 3 });
    const out = div(el, 'out');
    const draw = () => {
      p.clear();
      p.fn(x => (x - pp) ** 2 + q, css('--accent'), 3);
      p.dot(pp, q, css('--err'), 6, '가장 낮은 점');
      const inner = pp === 0 ? 'x' : pp > 0 ? `(x − ${fmt(pp)})` : `(x + ${fmt(-pp)})`;
      out.innerHTML = `<span class="m">y = ${inner}²${q ? (q > 0 ? ` + ${fmt(q)}` : ` − ${fmt(-q)}`) : ''}</span><br>x = <b>${fmt(pp)}</b> 에서 가장 낮은 값 <b>${fmt(q)}</b>`;
    };
    slider(el, 'p 좌우', -3, 3, 0.5, pp, v => { pp = v; draw(); });
    slider(el, 'q 위아래', -2, 4, 0.5, q, v => { q = v; draw(); });
    draw();
  },

  // 미분: 두 점 기울기(할선)가 접선에 가까워지는 모습
  tangent(el) {
    let x0 = 1, hi = 0;
    const HS = [2, 1, 0.5, 0.2, 0.1, 0.01, 0.001];
    const f = x => x * x;
    const p = plot(el, 250, { x0: -3, x1: 3, y0: -1, y1: 9, sx: 1, sy: 2 });
    const out = div(el, 'out');
    const draw = () => {
      const h = HS[hi], s = (f(x0 + h) - f(x0)) / h, t = 2 * x0;
      p.clear();
      p.fn(f, css('--axis'), 2.4);
      p.fn(x => f(x0) + t * (x - x0), css('--accent'), 2.4);                 // 접선
      p.fn(x => f(x0) + s * (x - x0), css('--err'), 2, [6, 5]);              // 두 점을 잇는 선
      p.dot(x0 + h, f(x0 + h), css('--err'), 4);
      p.dot(x0, f(x0), css('--accent'), 6);
      out.innerHTML = `<span style="color:var(--err)">- - 두 점 기울기</span> = ${FR(`f(${fmt(x0)} + ${h}) − f(${fmt(x0)})`, h)} = <b>${fmt(s, 3)}</b><br>
        <span style="color:var(--accent)">── 접선 기울기(미분값)</span> 2x = 2 × ${fmt(x0)} = <b>${fmt(t)}</b>
        ${h <= 0.01 ? '<br>✅ h가 아주 작아지니 두 값이 거의 같아졌어요!' : '<br>h를 줄여 보세요 →'}`;
    };
    slider(el, 'x 위치', -2, 2, 0.1, x0, v => { x0 = v; draw(); });
    const hs = slider(el, 'h 간격', 0, HS.length - 1, 1, 0, v => { hi = v; hs.nextElementSibling.textContent = HS[v]; draw(); });
    hs.nextElementSibling.textContent = HS[0];
    draw();
  },

  // 편미분: 하나만 조금 움직여 보기
  partial(el) {
    let a = 1, b = 2;
    const y = (a, b) => 2 * a * a + 3 * b + 6;
    const out = div(el, 'out');
    const show = msg => { out.innerHTML = `<span class="m">y = 2a² + 3b + 6</span> → a = ${fmt(a)}, b = ${fmt(b)} 이면 y = <b>${fmt(y(a, b), 3)}</b>${msg ? '<br>' + msg : ''}`; };
    slider(el, 'a', -3, 3, 0.5, a, v => { a = v; show(); });
    slider(el, 'b', -3, 3, 0.5, b, v => { b = v; show(); });
    const btns = div(el, 'btns', '<button class="pri" data-d="a">a만 0.001 늘리기</button><button class="pri" data-d="b">b만 0.001 늘리기</button>');
    btns.onclick = e => {
      const d = e.target.dataset.d; if (!d) return;
      const h = 0.001, y0 = y(a, b), y1 = d === 'a' ? y(a + h, b) : y(a, b + h), r = (y1 - y0) / h;
      show(d === 'a'
        ? `a만 ${h} 늘렸더니 y가 <b>${fmt(y1 - y0, 4)}</b> 변함 → 비율 ≈ <b>${fmt(r, 2)}</b> = 4a = 4 × ${fmt(a)} = ${fmt(4 * a)} ✅`
        : `b만 ${h} 늘렸더니 y가 <b>${fmt(y1 - y0, 4)}</b> 변함 → 비율 = <b>${fmt(r, 2)}</b> = 3 (a와 상관없이 항상 3) ✅`);
    };
    show();
  },

  // 연쇄법칙 톱니바퀴: x → ×2 → u → ×3 → y
  chain(el) {
    let x = 1, last = null;
    const box = div(el, 'chain'), out = div(el, 'out');
    const btns = div(el, 'btns', '<button class="pri" data-a="up">x를 1 늘리기</button><button data-a="reset">처음으로</button>');
    const draw = () => {
      const u = 2 * x, y = 3 * u;
      const d = last ? { x: 1, u: 2, y: 6 } : null;
      box.innerHTML = `<span class="bx"><small>x</small>${x}${d ? `<span class="d">+${d.x}</span>` : ''}</span><span class="op">×2 →</span>
        <span class="bx"><small>u = 2x</small>${u}${d ? `<span class="d">+${d.u}</span>` : ''}</span><span class="op">×3 →</span>
        <span class="bx"><small>y = 3u</small>${y}${d ? `<span class="d">+${d.y}</span>` : ''}</span>`;
      out.innerHTML = d ? `x가 <b>1</b> 늘면 u는 <b>2</b>, y는 <b>6</b> 늘었어요 → <span class="m">dy/dx = 3 × 2 = 6</span> (배율을 곱함)` : '버튼을 눌러 x를 1씩 늘려 보세요.';
    };
    btns.onclick = e => { const a = e.target.dataset.a; if (a === 'up') { x++; last = 1; } else if (a === 'reset') { x = 1; last = null; } draw(); };
    draw();
  },

  // 오차 → SSE·MSE·MAE
  lossparts(el) {
    const y = [3, 5, 7, 9], yh = [4, 4, 8, 8];
    const t = document.createElement('table'); t.className = 'lt'; el.appendChild(t);
    const draw = () => {
      const e = yh.map((v, i) => v - y[i]);
      const sse = e.reduce((a, v) => a + v * v, 0), sum = e.reduce((a, v) => a + v, 0);
      t.innerHTML = `<thead><tr><th>y</th><th>ŷ (바꿔 보기)</th><th>오차</th><th>제곱</th><th>|오차|</th></tr></thead><tbody>` +
        y.map((v, i) => `<tr><td>${v}</td><td><span class="pm"><button data-i="${i}" data-d="-0.5">−</button><b>${fmt(yh[i])}</b><button data-i="${i}" data-d="0.5">+</button></span></td>
          <td>${fmt(e[i])}</td><td>${fmt(e[i] ** 2)}</td><td>${fmt(Math.abs(e[i]))}</td></tr>`).join('') +
        `</tbody><tfoot><tr><td colspan="5" style="text-align:left;line-height:1.9">
          그냥 더하기 = <b>${fmt(sum)}</b> ${sum === 0 && sse > 0 ? '<span style="color:var(--err)">← 틀렸는데 0!</span>' : ''}<br>
          SSE = <b>${fmt(sse)}</b> · MSE = <b>${fmt(sse / 4, 3)}</b> · MAE = <b>${fmt(e.reduce((a, v) => a + Math.abs(v), 0) / 4, 3)}</b>
          ${sse === 0 ? '<br>🎉 모두 맞혔어요! MSE = 0' : ''}</td></tr></tfoot>`;
    };
    t.onclick = e => { const b = e.target.closest('[data-i]'); if (!b) return; yh[+b.dataset.i] += +b.dataset.d; draw(); };
    draw();
  },

  // w에 따른 손실 그래프 (데이터 y = 2x + 1, b = 1 고정)
  losscurve(el) {
    const X = [1, 2, 3, 4, 5], Y = X.map(x => 2 * x + 1);
    const mse = w => X.reduce((a, x, i) => a + (w * x + 1 - Y[i]) ** 2, 0) / X.length;
    let w = 0.5;
    div(el, 'muted', '<small>① 데이터와 모델 직선</small>');
    const p1 = plot(el, 190, { x0: 0, x1: 6, y0: 0, y1: 14, sx: 1, sy: 2 });
    div(el, 'muted', '<small>② w에 따른 MSE (손실 그래프)</small>');
    const p2 = plot(el, 190, { x0: 0, x1: 4, y0: 0, y1: 45, sx: 0.5, sy: 10, xl: 'w', yl: 'MSE' });
    const out = div(el, 'out');
    const draw = () => {
      p1.clear(); X.forEach((x, i) => p1.dot(x, Y[i], css('--fg'), 4));
      p1.fn(x => w * x + 1, css('--accent'), 2.6);
      p2.clear(); p2.fn(mse, css('--axis'), 2.4);
      p2.dot(w, mse(w), css('--err'), 7);
      out.innerHTML = `ŷ = ${lineStr(w, 1)} → MSE = <b>${fmt(mse(w), 2)}</b> ${Math.abs(w - 2) < 1e-9 ? '🎉 가장 낮은 점! 직선이 모든 점을 지나요' : ''}`;
    };
    slider(el, 'w', 0, 4, 0.1, w, v => { w = v; draw(); });
    draw();
  },

  // 경사하강법 한 걸음씩 (MSE = 11(w − 2)², 기울기 22(w − 2))
  gdstep(el) {
    const L = w => 11 * (w - 2) ** 2, G = w => 22 * (w - 2);
    const LRS = [0.01, 0.03, 0.05, 0.08, 0.1];
    let lr = +(el.dataset.lr || 0.05), w = 0, path = [0], log = [];
    const seg = div(el, 'seg', '학습률 lr: ' + LRS.map(v => `<button data-lr="${v}">${v}</button>`).join(''));
    const p = plot(el, 230, { x0: -2, x1: 6, y0: 0, y1: 180, sx: 1, sy: 40, xl: 'w', yl: 'MSE' });
    const out = div(el, 'out');
    const btns = div(el, 'btns', '<button class="pri" data-a="1">한 걸음 ▶</button><button data-a="10">10걸음</button><button data-a="r">처음으로</button>');
    const draw = () => {
      seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.lr === lr));
      p.clear(); p.fn(L, css('--axis'), 2.4);
      const ctx = p.ctx; ctx.strokeStyle = css('--err'); ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.beginPath();
      path.forEach((v, i) => { const yy = Math.min(L(v), 180); i ? ctx.lineTo(p.X(v), p.Y(yy)) : ctx.moveTo(p.X(v), p.Y(yy)); }); ctx.stroke(); ctx.setLineDash([]);
      path.slice(0, -1).forEach(v => { if (p.inside(v, L(v))) p.dot(v, L(v), css('--err'), 3); });
      const out_ = !p.inside(w, L(w));
      if (!out_) p.dot(w, L(w), css('--accent'), 8);
      const diverged = Math.abs(w - 2) > 4;
      out.innerHTML = `걸음 <b>${path.length - 1}</b> · w = <b>${fmt(w, 3)}</b> · MSE = <b>${fmt(L(w), 2)}</b>` +
        (log.length ? `<br><small>${log.slice(-3).join('<br>')}</small>` : '<br><small>w = 0 에서 출발. 정답(바닥)은 w = 2</small>') +
        (diverged ? '<br>💥 <b>발산!</b> 학습률이 너무 커서 바닥에서 점점 멀어져요.' : Math.abs(w - 2) < 0.005 ? '<br>✅ 바닥(w = 2)에 도착했어요!' : '');
    };
    const step = () => {
      const g = G(w), nw = w - lr * g;
      log.push(`기울기 22(w−2) = ${fmt(g, 2)} → w = ${fmt(w, 3)} − ${lr} × (${fmt(g, 2)}) = ${fmt(nw, 3)}`);
      w = nw; path.push(w);
    };
    seg.onclick = e => { const b = e.target.closest('[data-lr]'); if (!b) return; lr = +b.dataset.lr; w = 0; path = [0]; log = []; draw(); };
    btns.onclick = e => {
      const a = e.target.dataset.a; if (!a) return;
      if (a === 'r') { w = 0; path = [0]; log = []; }
      else for (let k = 0; k < +a && Math.abs(w) < 1e6; k++) step();
      draw();
    };
    draw();
  },

  // 30개 데이터로 전체 학습 (정답 규칙 y = 3x + 2 + 잡음)
  gdfit(el) {
    // 늘 같은 데이터가 나오도록 씨앗(seed)이 있는 난수
    let s = 42; const rnd = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const X = [], Y = [];
    for (let i = 0; i < 30; i++) { const x = rnd() * 5, n = Math.sqrt(-2 * Math.log(rnd() || 1e-9)) * Math.cos(2 * Math.PI * rnd()); X.push(x); Y.push(3 * x + 2 + 0.5 * n); }
    const n = X.length, mx = X.reduce((a, v) => a + v, 0) / n, my = Y.reduce((a, v) => a + v, 0) / n;
    const wls = X.reduce((a, x, i) => a + (x - mx) * (Y[i] - my), 0) / X.reduce((a, x) => a + (x - mx) ** 2, 0), bls = my - wls * mx;   // 최소제곱법
    const mseOf = (w, b) => X.reduce((a, x, i) => a + (w * x + b - Y[i]) ** 2, 0) / n;
    const LRS = [0.005, 0.02, 0.05, 0.2];
    let lr = 0.05, w = 0, b = 0, ep = 0, hist = [mseOf(0, 0)], timer = null;
    const seg = div(el, 'seg', '학습률 lr: ' + LRS.map(v => `<button data-lr="${v}">${v}</button>`).join(''));
    const p = plot(el, 220, { x0: 0, x1: 5, y0: 0, y1: 20, sx: 1, sy: 5 });
    div(el, 'muted', '<small>MSE 변화 (세로 눈금 −1·0·1·2·3 = MSE 0.1·1·10·100·1000)</small>');
    const ph = plot(el, 110, { x0: 0, x1: 500, y0: -1, y1: 3, sx: 100, sy: 1 });
    const out = div(el, 'out');
    const btns = div(el, 'btns', '<button class="pri" data-a="go">▶ 학습 시작</button><button data-a="r">↺ 처음부터</button>');
    const draw = () => {
      seg.querySelectorAll('button').forEach(x => x.classList.toggle('on', +x.dataset.lr === lr));
      p.clear(); X.forEach((x, i) => p.dot(x, Y[i], css('--muted'), 3.5));
      p.fn(x => w * x + b, css('--accent'), 2.8);
      ph.clear(); const c = ph.ctx; c.strokeStyle = css('--err'); c.lineWidth = 2; c.beginPath();
      hist.forEach((m, i) => { const yy = Math.max(-1, Math.min(3, Math.log10(Math.max(m, 1e-3)))); i ? c.lineTo(ph.X(i), ph.Y(yy)) : c.moveTo(ph.X(i), ph.Y(yy)); }); c.stroke();
      const m = hist[hist.length - 1], bad = !isFinite(m) || m > 1e6;
      out.innerHTML = `에포크 <b>${ep}</b> · w = <b>${fmt(w, 3)}</b> · b = <b>${fmt(b, 3)}</b> · MSE = <b>${bad ? '💥' : fmt(m, 4)}</b>
        <br><small>최소제곱법 정답: w = ${fmt(wls, 3)}, b = ${fmt(bls, 3)} (MSE ${fmt(mseOf(wls, bls), 4)})</small>
        ${bad ? '<br>💥 <b>발산!</b> 학습률을 줄이고 처음부터 해 보세요.' : ep >= 500 ? '<br>✅ 500 에포크 완료! 정답 규칙 y = 3x + 2 와 거의 같아졌나요?' : ''}`;
      btns.querySelector('[data-a="go"]').textContent = timer ? '⏸ 멈추기' : ep ? '▶ 이어서' : '▶ 학습 시작';
    };
    const epoch = () => {
      let dw = 0, db = 0;
      for (let i = 0; i < n; i++) { const e = w * X[i] + b - Y[i]; dw += e * X[i]; db += e; }
      w -= lr * 2 * dw / n; b -= lr * 2 * db / n; ep++; hist.push(mseOf(w, b));
    };
    // requestAnimationFrame은 화면이 가려지면 멈추므로 setTimeout으로 돌린다
    const stop = () => { if (timer) clearTimeout(timer); timer = null; };
    const loop = () => {
      for (let k = 0; k < 3 && ep < 500; k++) epoch();
      const m = hist[hist.length - 1];
      if (ep >= 500 || !isFinite(m) || m > 1e6) { stop(); draw(); return; }
      draw(); timer = setTimeout(loop, 16);
    };
    const reset = () => { stop(); w = 0; b = 0; ep = 0; hist = [mseOf(0, 0)]; draw(); };
    seg.onclick = e => { const x = e.target.closest('[data-lr]'); if (!x) return; lr = +x.dataset.lr; reset(); };
    btns.onclick = e => {
      const a = e.target.dataset.a; if (!a) return;
      if (a === 'r') return reset();
      if (timer) { stop(); draw(); return; }
      if (ep >= 500 || hist[hist.length - 1] > 1e6) reset();
      timer = setTimeout(loop, 16); draw();
    };
    cleanup.push(stop);
    draw();
  },

  // 계산 그래프 f = (x + y) × z : 순전파(초록) → 역전파(빨강)
  graph(el) {
    let v = { x: -2, y: 5, z: -4 }, st = 0;
    const MAX = +(el.dataset.stop || 5);
    const ins = div(el, 'ins');
    const svgBox = div(el, '');
    const out = div(el, 'out');
    const btns = div(el, 'btns', '<button data-a="prev">◀ 이전</button><button class="pri" data-a="next">다음 ▶</button><button data-a="r">처음</button>');
    const T = (x, y, s, cls = '', size = 16, anchor = 'middle') => `<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" class="${cls}">${s}</text>`;
    const draw = () => {
      const q = v.x + v.y, f = q * v.z, dq = v.z, dz = q;
      ins.innerHTML = ['x', 'y', 'z'].map(k => `<span><b>${k}</b><button data-k="${k}" data-d="-1">−</button><b style="min-width:26px;text-align:center">${fmt(v[k])}</b><button data-k="${k}" data-d="1">+</button></span>`).join('');
      const F = s => st >= s, B = s => st >= s;
      svgBox.innerHTML = `<svg class="gsvg" viewBox="0 0 340 215">
        <path class="ed" d="M40 38 L134 68"/><path class="ed" d="M40 108 L134 82"/><path class="ed" d="M168 80 L234 122"/>
        <path class="ed" d="M40 182 L234 140"/><path class="ed" d="M270 131 L312 131"/>
        <circle class="nd" cx="151" cy="75" r="18"/>${T(151, 81, '+', '', 20)}
        <circle class="nd" cx="252" cy="131" r="18"/>${T(252, 137, '×', '', 18)}
        ${T(14, 43, 'x', '', 16)}${T(14, 113, 'y', '', 16)}${T(14, 187, 'z', '', 16)}${T(326, 136, 'f', '', 16)}
        ${T(80, 40, fmt(v.x), 'fw')}${T(80, 88, fmt(v.y), 'fw')}${T(130, 172, fmt(v.z), 'fw')}
        ${F(1) ? T(200, 92, 'q = ' + fmt(q), 'fw') : ''}
        ${F(2) ? T(292, 122, fmt(f), 'fw') : ''}
        ${B(3) ? T(292, 152, '1', 'bw') : ''}
        ${B(4) ? T(214, 126, fmt(dq), 'bw') + T(150, 196, fmt(dz), 'bw') : ''}
        ${B(5) ? T(92, 62, fmt(dq), 'bw') + T(92, 116, fmt(dq), 'bw') : ''}
        ${T(170, 212, '초록 = 순전파 값 · 빨강 = 기울기 ∂f/∂(·)', '', 12)}
      </svg>`;
      const msgs = [
        `입력 x = ${fmt(v.x)}, y = ${fmt(v.y)}, z = ${fmt(v.z)}. <b>[다음 ▶]</b>을 눌러 계산을 따라가 보세요.`,
        `① 순전파 덧셈 노드: q = x + y = ${fmt(v.x)} + ${fmt(v.y)} = <b>${fmt(q)}</b>`,
        `② 순전파 곱셈 노드: f = q × z = ${fmt(q)} × ${fmt(v.z)} = <b>${fmt(f)}</b>${MAX === 2 ? '<br>✅ 순전파 끝! 출력 f가 나왔어요.' : ''}`,
        `③ 역전파 시작: ∂f/∂f = <b>1</b>`,
        `④ 곱셈 노드(교환기): ∂f/∂q = 1 × z = <b>${fmt(dq)}</b>, &nbsp;∂f/∂z = 1 × q = <b>${fmt(dz)}</b>`,
        `⑤ 덧셈 노드(분배기): ∂f/∂x = ∂f/∂y = ${fmt(dq)} × 1 = <b>${fmt(dq)}</b><br>✅ 끝! x를 1 늘리면 f는 약 ${fmt(Math.abs(dq))} ${dq < 0 ? '줄어요' : dq > 0 ? '늘어요' : '그대로예요'}.`,
      ];
      out.innerHTML = msgs[st];
    };
    btns.onclick = e => {
      const a = e.target.dataset.a; if (!a) return;
      st = a === 'r' ? 0 : a === 'next' ? Math.min(MAX, st + 1) : Math.max(0, st - 1); draw();
    };
    ins.onclick = e => { const b = e.target.closest('[data-k]'); if (!b) return; v[b.dataset.k] = Math.max(-9, Math.min(9, v[b.dataset.k] + +b.dataset.d)); draw(); };
    draw();
  },

  // 뉴런 하나: L = (w·x + b − y)², 순전파 → 역전파 → 경사하강법
  neuron(el) {
    const x = 3, y = 10, lr = 0.01;
    let w = 2, b = 1, st = 0, hist = [];
    const t = document.createElement('table'); t.className = 'lt nt'; el.appendChild(t);
    const out = div(el, 'out');
    const btns = div(el, 'btns', '<button data-a="prev">◀</button><button class="pri" data-a="next">다음 ▶</button><button data-a="all">모두 보기</button>');
    const btn2 = div(el, 'btns', '<button class="pri" data-a="gd">⛰️ 경사하강법 한 걸음 (lr = 0.01)</button>');
    const calc = () => {
      const p = w * x, yh = p + b, e = yh - y, L = e * e, de = 2 * e;
      return { p, yh, e, L, dL: 1, de, dyh: de, db: de, dp: de, dw: de * x };
    };
    const draw = () => {
      const c = calc(), S = k => st >= k;
      // 순전파 1~4 단계, 역전파 5~9 단계
      const rows = [
        ['p = w × x', `${fmt(w, 3)} × ${x}`, c.p, 1, '∂L/∂p = ∂L/∂ŷ × 1', c.dp, 8],
        ['ŷ = p + b', `${fmt(c.p, 3)} + ${fmt(b, 3)}`, c.yh, 2, '∂L/∂ŷ = ∂L/∂e × 1', c.dyh, 7],
        ['e = ŷ − y', `${fmt(c.yh, 3)} − ${y}`, c.e, 3, '∂L/∂e = 2e', c.de, 6],
        ['L = e²', `(${fmt(c.e, 3)})²`, c.L, 4, '∂L/∂L', c.dL, 5],
      ];
      const hl = k => (st === k ? 'hl' : '');
      t.innerHTML = `<thead><tr><th>단계</th><th>순전파 →</th><th>← 역전파</th></tr></thead><tbody>` +
        rows.map(r => `<tr class="${hl(r[3])} ${hl(r[6])}"><td>${r[0]}</td><td>${S(r[3]) ? `<span class="fwv">${fmt(r[2], 3)}</span>` : '·'}</td><td>${S(r[6]) ? `<span class="bwv">${r[4]}<br>= ${fmt(r[5], 3)}</span>` : '·'}</td></tr>`).join('') +
        `<tr class="${hl(8)}"><td>b (편향)</td><td>${fmt(b, 3)}</td><td>${S(8) ? `<span class="bwv">∂L/∂b = ∂L/∂ŷ × 1<br>= ${fmt(c.db, 3)}</span>` : '·'}</td></tr>
         <tr class="${hl(9)}"><td>w (가중치)</td><td>${fmt(w, 3)}</td><td>${S(9) ? `<span class="bwv">∂L/∂w = ∂L/∂p × x<br>= ${fmt(c.dw, 3)}</span>` : '·'}</td></tr></tbody>`;
      const msg = [
        `x = ${x}, 정답 y = ${y}, 지금 w = ${fmt(w, 3)}, b = ${fmt(b, 3)}. <b>[다음 ▶]</b>으로 순전파부터!`,
        '순전파 ① 곱셈: p = w × x', '순전파 ② 덧셈: ŷ = p + b', '순전파 ③ 빼기: e = ŷ − y (오차)', `순전파 ④ 제곱: 손실 L = e² = <b>${fmt(c.L, 3)}</b>`,
        '역전파 시작: ∂L/∂L = 1', `제곱 노드: ∂L/∂e = 2e = <b>${fmt(c.de, 3)}</b>`, '빼기 노드: 그대로 전달 (분배기처럼)',
        '덧셈 노드(분배기): b 와 p 에 그대로 나눠 줌', `곱셈 노드(교환기): ∂L/∂w = ∂L/∂p × x = <b>${fmt(c.dw, 3)}</b> ✅ 기울기 완성!`,
      ][st];
      out.innerHTML = msg + (hist.length ? `<br><small>손실 기록: ${hist.map(v => fmt(v, 3)).join(' → ')} → <b>${fmt(c.L, 3)}</b></small>` : '');
    };
    btns.onclick = e => { const a = e.target.dataset.a; if (!a) return; st = a === 'all' ? 9 : a === 'next' ? Math.min(9, st + 1) : Math.max(0, st - 1); draw(); };
    btn2.onclick = e => {
      if (!e.target.dataset.a) return;
      const c = calc(); hist.push(c.L);
      const nw = w - lr * c.dw, nb = b - lr * c.db;
      toast(`w: ${fmt(w, 3)} → ${fmt(nw, 3)},  b: ${fmt(b, 3)} → ${fmt(nb, 3)}`);
      w = nw; b = nb; st = 9; draw();
    };
    draw();
  },

  // eˣ 와 ln x 를 함께 (y = x 를 기준으로 거울 모양)
  explog(el) {
    let x = 1;
    const p = plot(el, 250, { x0: -2, x1: 4, y0: -3, y1: 8, sx: 1, sy: 2 });
    const out = div(el, 'out');
    const draw = () => {
      p.clear();
      p.fn(t => t, css('--axis'), 1.5, [5, 5]);
      p.fn(Math.exp, css('--accent'), 3);
      p.fn(t => t > 0 ? Math.log(t) : NaN, css('--bw'), 3);
      if (p.inside(x, Math.exp(x))) p.dot(x, Math.exp(x), css('--accent'), 6, 'eˣ');
      if (x > 0 && p.inside(x, Math.log(x))) p.dot(x, Math.log(x), css('--bw'), 6, 'ln x');
      out.innerHTML = `<span style="color:var(--accent)">── eˣ</span> : e<sup>${fmt(x)}</sup> = <b>${fmt(Math.exp(x), 3)}</b> (항상 양수)<br>
        <span style="color:var(--bw)">── ln x</span> : ${x > 0 ? `ln ${fmt(x)} = <b>${fmt(Math.log(x), 3)}</b>${Math.abs(x - 1) < 1e-9 ? ' ← ln 1 = 0' : ''}` : 'x ≤ 0 에서는 정의되지 않아요'}`;
    };
    slider(el, 'x', -2, 3, 0.1, x, v => { x = v; draw(); });
    draw();
  },

  // 크로스 엔트로피 벌점 −ln p
  logloss(el) {
    let pr = 0.9;
    const p = plot(el, 200, { x0: 0, x1: 1, y0: 0, y1: 5, sx: 0.2, sy: 1, xl: '정답 확률 p', yl: '벌점 −ln p' });
    const out = div(el, 'out');
    const draw = () => {
      p.clear();
      p.fn(t => t > 0 ? -Math.log(t) : NaN, css('--bw'), 3);
      p.dot(pr, -Math.log(pr), css('--accent'), 7);
      const v = -Math.log(pr);
      out.innerHTML = `모델이 정답일 확률을 <b>${fmt(pr)}</b>로 예측 → 벌점 −ln ${fmt(pr)} = <b>${fmt(v, 3)}</b> ${pr >= 0.9 ? '😊 확신하고 맞힘' : pr <= 0.2 ? '😱 크게 틀림' : ''}`;
    };
    slider(el, 'p', 0.01, 1, 0.01, pr, v => { pr = v; draw(); });
    draw();
  },

  // 내적: 같은 자리끼리 곱해 모두 더하기
  dot(el) {
    const x = [3, 1, 2], w = [2, -1, 0.5]; let b = 1;
    const t = document.createElement('table'); t.className = 'lt'; el.appendChild(t);
    const out = div(el, 'out');
    const pm = (k, i, v) => `<span class="pm"><button data-k="${k}" data-i="${i}" data-d="-">−</button><b>${fmt(v)}</b><button data-k="${k}" data-i="${i}" data-d="+">+</button></span>`;
    const draw = () => {
      const pr = x.map((v, i) => v * w[i]), s = pr.reduce((a, v) => a + v, 0);
      t.innerHTML = `<thead><tr><th></th><th>x₁</th><th>x₂</th><th>x₃</th></tr></thead><tbody>
        <tr><td><b>입력 x</b></td>${x.map((v, i) => `<td>${pm('x', i, v)}</td>`).join('')}</tr>
        <tr><td><b>가중치 w</b></td>${w.map((v, i) => `<td>${pm('w', i, v)}</td>`).join('')}</tr>
        <tr><td><b>곱 wᵢxᵢ</b></td>${pr.map(v => `<td><b style="color:var(--accent)">${fmt(v)}</b></td>`).join('')}</tr></tbody>`;
      out.innerHTML = `w·x = ${pr.map(v => fmt(v)).join(' + ').replace(/\+ −/g, '− ')} = <b>${fmt(s)}</b><br>ŷ = w·x + b = ${fmt(s)} + ${fmt(b)} = <b>${fmt(s + b)}</b>`;
    };
    t.onclick = e => {
      const btn = e.target.closest('[data-k]'); if (!btn) return;
      const arr = btn.dataset.k === 'x' ? x : w, step = btn.dataset.k === 'x' ? 1 : 0.5, i = +btn.dataset.i;
      arr[i] = Math.max(-9, Math.min(9, arr[i] + (btn.dataset.d === '+' ? step : -step))); draw();
    };
    draw();
  },

  // 행렬 × 벡터: 각 행과 내적
  matvec(el) {
    const W = [[1, 2], [3, 4]], x = [5, 6];
    let r = 0;
    const box = div(el, 'chain'), out = div(el, 'out');
    const btns = div(el, 'btns', '<button class="pri" data-a="next">다음 행 ▶</button><button data-a="r">처음부터</button>');
    const draw = () => {
      const res = W.map(row => row[0] * x[0] + row[1] * x[1]);
      box.innerHTML = `<span class="bx" style="text-align:left">${W.map((row, i) => `<div style="${i === r - 1 ? 'background:var(--accent-soft);border-radius:6px;font-weight:700' : ''}">[ ${row.join(', ')} ]</div>`).join('')}</span>
        <span class="op">×</span><span class="bx">${x.map(v => `<div>${v}</div>`).join('')}</span><span class="op">=</span>
        <span class="bx">${res.map((v, i) => `<div>${i < r ? `<b>${v}</b>` : '?'}</div>`).join('')}</span>`;
      out.innerHTML = r === 0 ? '<b>[다음 행 ▶]</b>을 눌러 행마다 내적해 보세요.'
        : `${r}번째 행: ${W[r - 1][0]}×${x[0]} + ${W[r - 1][1]}×${x[1]} = <b>${res[r - 1]}</b>` + (r === W.length ? `<br>✅ W·x = [${res.join(', ')}] — 뉴런 2개의 출력이 한 번에 나왔어요` : '');
    };
    btns.onclick = e => { const a = e.target.dataset.a; if (a === 'next') r = Math.min(W.length, r + 1); else if (a === 'r') r = 0; draw(); };
    draw();
  },

  // 활성화 함수: 시그모이드 / ReLU 와 그 미분
  activation(el) {
    let kind = 'sig', x = 0;
    const sg = t => 1 / (1 + Math.exp(-t));
    const K = {
      sig: { f: sg, d: t => sg(t) * (1 - sg(t)), r: { x0: -6, x1: 6, y0: -0.2, y1: 1.2, sx: 2, sy: 0.25 }, name: 'σ(x)', dname: 'σ′(x) = σ(1−σ)' },
      relu: { f: t => Math.max(0, t), d: t => t > 0 ? 1 : 0, r: { x0: -3, x1: 3, y0: -0.5, y1: 3, sx: 1, sy: 0.5 }, name: 'ReLU(x)', dname: '미분 (0 또는 1)' },
    };
    const seg = div(el, 'seg', '<button data-k="sig">시그모이드</button><button data-k="relu">ReLU</button>');
    const holder = div(el, '');
    const out = div(el, 'out');
    let p, sl;
    const build = () => {
      holder.innerHTML = ''; p = plot(holder, 220, K[kind].r);
      if (sl) sl.parentElement.remove();
      const r = K[kind].r; x = Math.max(r.x0, Math.min(r.x1, x));
      sl = slider(el, 'x', r.x0, r.x1, 0.1, x, v => { x = v; draw(); });
      el.appendChild(out);
    };
    const draw = () => {
      const k = K[kind];
      seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.k === kind));
      p.clear(); p.fn(k.d, css('--bw'), 2, [6, 5]); p.fn(k.f, css('--accent'), 3);
      p.dot(x, k.f(x), css('--accent'), 6);
      const fv = k.f(x), dv = k.d(x);
      out.innerHTML = `<span style="color:var(--accent)">── ${k.name}</span> = <b>${fmt(fv, 3)}</b> &nbsp; <span style="color:var(--bw)">- - ${k.dname}</span> = <b>${fmt(dv, 3)}</b><br>` +
        (kind === 'sig'
          ? (Math.abs(x) >= 4 ? '⚠️ 양 끝에서는 기울기가 거의 0 → 역전파로 전달할 기울기가 사라져요 (기울기 소실)' : Math.abs(x) < 0.05 ? 'x = 0 에서 기울기가 가장 커요 (0.25)' : '값은 항상 0 ~ 1 사이예요')
          : (x < 0 ? '음수 → 출력 0, 기울기 0 (역전파를 막음)' : x > 0 ? '양수 → 그대로 통과, 기울기 1' : 'x = 0 은 꺾이는 점이에요'));
    };
    seg.onclick = e => { const b = e.target.closest('[data-k]'); if (!b) return; kind = b.dataset.k; build(); draw(); };
    build(); draw();
  },

  // 등고선 지도 위 그래디언트 하강 (L = (w − 2)² + 4(b − 1)²)
  contour(el) {
    const L = (w, b) => (w - 2) ** 2 + 4 * (b - 1) ** 2;
    const G = (w, b) => [2 * (w - 2), 8 * (b - 1)];
    const LRS = [0.05, 0.1, 0.2, 0.26];
    let lr = 0.1, start = [-0.5, 2.6], pt = start.slice(), path = [start.slice()];
    const seg = div(el, 'seg', '학습률 lr: ' + LRS.map(v => `<button data-lr="${v}">${v}</button>`).join(''));
    const p = plot(el, 260, { x0: -1, x1: 5, y0: -1, y1: 3, sx: 1, sy: 1, xl: 'w', yl: 'b' });
    const cv = el.querySelector('canvas');
    const out = div(el, 'out');
    const btns = div(el, 'btns', '<button class="pri" data-a="1">한 걸음 ▶</button><button data-a="10">10걸음</button><button data-a="r">처음으로</button>');
    const draw = () => {
      seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.lr === lr));
      p.clear();
      const c = p.ctx, pxW = p.X(1) - p.X(0), pxB = p.Y(0) - p.Y(1);
      c.save(); c.beginPath(); c.rect(26, 0, p.W - 26, p.H - 20); c.clip();
      [0.25, 1, 2, 4, 8, 16, 32].forEach((lv, i) => {                  // 등고선: 같은 손실끼리
        c.strokeStyle = css('--accent'); c.globalAlpha = 0.25 + i * 0.08; c.lineWidth = 1.3;
        c.beginPath(); c.ellipse(p.X(2), p.Y(1), Math.sqrt(lv) * pxW, Math.sqrt(lv) / 2 * pxB, 0, 0, 7); c.stroke();
      });
      c.globalAlpha = 1;
      c.strokeStyle = css('--fg'); c.lineWidth = 1.6; c.beginPath();       // 지나온 길
      path.forEach(([w, b], i) => i ? c.lineTo(p.X(w), p.Y(b)) : c.moveTo(p.X(w), p.Y(b))); c.stroke();
      path.forEach(([w, b]) => p.dot(w, b, css('--muted'), 2.5));
      p.dot(2, 1, css('--ok'), 5, '바닥');
      const [gw, gb] = G(...pt), n = Math.hypot(gw, gb);
      if (n > 1e-6 && p.inside(...pt)) {                                 // −∇L 화살표
        const len = 0.8, ex = pt[0] - gw / n * len, ey = pt[1] - gb / n * len;
        c.strokeStyle = css('--err'); c.fillStyle = css('--err'); c.lineWidth = 2.6;
        c.beginPath(); c.moveTo(p.X(pt[0]), p.Y(pt[1])); c.lineTo(p.X(ex), p.Y(ey)); c.stroke();
        const ang = Math.atan2(p.Y(ey) - p.Y(pt[1]), p.X(ex) - p.X(pt[0]));
        c.beginPath(); c.moveTo(p.X(ex), p.Y(ey));
        c.lineTo(p.X(ex) - 9 * Math.cos(ang - 0.4), p.Y(ey) - 9 * Math.sin(ang - 0.4));
        c.lineTo(p.X(ex) - 9 * Math.cos(ang + 0.4), p.Y(ey) - 9 * Math.sin(ang + 0.4)); c.fill();
      }
      if (p.inside(...pt)) p.dot(pt[0], pt[1], css('--accent'), 6);
      c.restore();
      const far = Math.hypot(pt[0] - 2, pt[1] - 1) > 6;
      out.innerHTML = `걸음 <b>${path.length - 1}</b> · (w, b) = (<b>${fmt(pt[0], 3)}</b>, <b>${fmt(pt[1], 3)}</b>) · L = <b>${fmt(L(...pt), 3)}</b>
        <br>∇L = (2(w−2), 8(b−1)) = (${fmt(gw, 2)}, ${fmt(gb, 2)}) → <span style="color:var(--err)">빨간 화살표 = −∇L</span>
        ${far ? '<br>💥 <b>발산!</b> b 방향으로 너무 크게 튀어요. 학습률을 줄여 보세요.' : n < 0.01 ? '<br>✅ 바닥 (2, 1) 도착! ∇L ≈ (0, 0)' : path.length === 1 ? '<br><small>지도를 눌러 출발점을 바꿀 수 있어요</small>' : ''}`;
    };
    const reset = () => { pt = start.slice(); path = [start.slice()]; draw(); };
    cv.addEventListener('click', e => {                                    // 누른 곳을 출발점으로
      const rc = cv.getBoundingClientRect(), sx = (e.clientX - rc.left), sy = (e.clientY - rc.top);
      const w = -1 + (sx - 26) / (p.W - 34) * 6, b = -1 + (p.H - 20 - sy) / (p.H - 30) * 4;
      if (w < -1 || w > 5 || b < -1 || b > 3) return;
      start = [+w.toFixed(2), +b.toFixed(2)]; reset();
    });
    seg.onclick = e => { const b = e.target.closest('[data-lr]'); if (!b) return; lr = +b.dataset.lr; reset(); };
    btns.onclick = e => {
      const a = e.target.dataset.a; if (!a) return;
      if (a === 'r') return reset();
      for (let k = 0; k < +a && Math.hypot(pt[0], pt[1]) < 1e6; k++) { const [gw, gb] = G(...pt); pt = [pt[0] - lr * gw, pt[1] - lr * gb]; path.push(pt.slice()); }
      draw();
    };
    draw();
  },
};

// ───────── 앱 설치 · 오프라인 ─────────
// 1) 카카오톡 안에서 열면 바깥 브라우저(Chrome·Safari)로 넘긴다 (카톡 브라우저는 설치 불가)
// 2) Chrome·삼성 인터넷: 설치 가능해지면 위쪽 [설치] 버튼 한 번으로 설치
// 3) 아이폰 Safari: 공유 → 홈 화면에 추가 안내
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
(() => {
  const bar = $('#inst'), msg = $('#instMsg'), btn = $('#instGo');
  const ua = navigator.userAgent;
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const kakao = /KAKAOTALK/i.test(ua), android = /Android/i.test(ua);
  const ios = /iP(hone|ad|od)/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const inApp = kakao || /NAVER|Instagram|FBAN|FBAV|Line\//i.test(ua);
  const DISMISS = 'ai-math-install-dismissed';
  const show = (text, label, onGo) => { msg.innerHTML = text; btn.hidden = !label; btn.textContent = label || ''; btn.onclick = onGo || null; bar.hidden = false; };
  const dismissed = () => { try { return localStorage.getItem(DISMISS) === '1'; } catch (e) { return false; } };
  $('#instX').onclick = () => { bar.hidden = true; try { localStorage.setItem(DISMISS, '1'); } catch (e) {} };
  if (standalone) return;
  const openOutside = () => {
    const url = location.href.split('#')[0];
    if (kakao) location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url);
    else if (android) location.href = `intent://${location.host}${location.pathname}#Intent;scheme=https;package=com.android.chrome;end`;
  };
  if (inApp) {
    show(ios ? '📲 앱으로 설치하려면 <b>Safari</b>에서 열어야 해요.' : '📲 앱으로 설치하려면 <b>Chrome</b>에서 열어야 해요.', ios ? 'Safari로 열기' : 'Chrome으로 열기', openOutside);
    let jumped = false;
    try { jumped = sessionStorage.getItem('kakaoJump') === '1'; sessionStorage.setItem('kakaoJump', '1'); } catch (e) {}
    if (kakao && !jumped) setTimeout(openOutside, 300);
    return;
  }
  let deferred = null;
  addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferred = e;
    if (dismissed()) return;
    show('📲 홈 화면에 <b>앱으로 설치</b>하면 인터넷 없이도 공부할 수 있어요.', '설치', async () => {
      deferred.prompt();
      const r = await deferred.userChoice.catch(() => ({}));
      deferred = null; bar.hidden = true;
      if (r.outcome === 'accepted') toast('설치했어요. 홈 화면의 AI수학 아이콘으로 여세요.');
    });
  });
  addEventListener('appinstalled', () => { bar.hidden = true; });
  if (ios && !dismissed()) show('📲 아래 <b>공유 버튼</b> → <b>홈 화면에 추가</b>를 누르면 앱처럼 쓸 수 있어요.');
})();

route();
