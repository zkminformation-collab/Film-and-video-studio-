self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate' || event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).catch(() => new Response(
    '<!doctype html><html lang="kn"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>ZKMAP Studio</title><body style="font:1rem system-ui;background:#171b1c;color:white;padding:2rem"><h1>ZKMAP Studio</h1><p>ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕ ಸಿಕ್ಕಾಗ ಪುಟವನ್ನು ಮತ್ತೆ ತೆರೆಯಿರಿ.</p><p lang="en">Reconnect to the internet and reload this page.</p></body></html>',
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
  )));
});
