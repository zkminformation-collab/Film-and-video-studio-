import assert from 'node:assert/strict';
import test from 'node:test';
import { generateFreeScreenplay } from '../server/openRouterScreenplay.ts';

test('verified screenplay requests use the free OpenRouter model', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url.startsWith('https://identitytoolkit.googleapis.com/')) {
      assert.deepEqual(JSON.parse(options.body), { idToken: 'studio-token' });
      return Response.json({ users: [{ emailVerified: true }] });
    }
    assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
    assert.equal(options.headers.Authorization, 'Bearer provider-key');
    const payload = JSON.parse(options.body);
    assert.equal(payload.model, 'openrouter/free');
    assert.deepEqual(payload.messages, [{ role: 'user', content: 'Write a scene in Kannada.' }]);
    return Response.json({ choices: [{ message: { content: '  ಒಂದು ಹೊಸ ದೃಶ್ಯ  ' } }] });
  });

  const result = await generateFreeScreenplay('Write a scene in Kannada.', 'provider-key', 'Bearer studio-token');
  assert.equal(result, 'ಒಂದು ಹೊಸ ದೃಶ್ಯ');
  assert.equal(fetch.mock.callCount(), 2);
});

test('unverified accounts cannot consume the free request quota', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json({ users: [{ emailVerified: false }] }));

  await assert.rejects(generateFreeScreenplay('Write a scene.', 'provider-key', 'Bearer studio-token'), { status: 403 });
  assert.equal(fetch.mock.callCount(), 1);
});

test('rate-limited requests return 429 without retrying another model', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async (url) =>
    url.startsWith('https://identitytoolkit.googleapis.com/')
      ? Response.json({ users: [{ emailVerified: true }] })
      : new Response(null, { status: 429 }),
  );

  await assert.rejects(generateFreeScreenplay('Write a scene.', 'provider-key', 'Bearer studio-token'), { status: 429 });
  assert.equal(fetch.mock.callCount(), 2);
});
