// 서비스 워커: 앱 파일을 폰에 저장해 두고 인터넷 없이도 실행되게 한다.
// 앱 내용(레슨 등)을 고치면 VERSION 숫자를 올려야 폰에서 새 버전을 받는다.
const VERSION = 'ai-math-v3';
const FILES = ['./', 'index.html', 'app.js', 'lessons.js', 'manifest.json', 'install-helper.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

// 설치할 때 파일을 모두 캐시에 담는다 (브라우저 임시 저장본은 건너뛰고 새로 받음)
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

// 옛 버전 캐시는 지운다
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// 화면과 레슨 파일은 인터넷을 먼저 시도해 최신으로, 안 되면 저장본. 아이콘 등은 저장본 먼저.
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const fresh = req.mode === 'navigate' || /\.(js|html)$/.test(url.pathname);
  if (fresh) {
    e.respondWith(fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req.mode === 'navigate' ? './' : req, copy));
        return res;
      })
      .catch(() => caches.match(req.mode === 'navigate' ? './' : req)));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
