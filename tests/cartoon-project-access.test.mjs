import { strict as assert } from 'node:assert';
import { once } from 'node:events';
import test from 'node:test';
import express from 'express';
import { canAccessCartoonProject, createCartoonProjectAccessRouter } from '../server/cartoonProjectAccess.ts';

const viewers = {
  alice: { userId: 'alice', isAdmin: false },
  bob: { userId: 'bob', isAdmin: false },
  admin: { userId: 'admin', isAdmin: true },
};

test('ownerless projects require an administrator and owned projects follow their account', () => {
  assert.equal(canAccessCartoonProject(viewers.alice, { ownerUserId: 'alice' }), true);
  assert.equal(canAccessCartoonProject(viewers.bob, { ownerUserId: 'alice' }), false);
  assert.equal(canAccessCartoonProject(viewers.alice, {}), false);
  assert.equal(canAccessCartoonProject(viewers.admin, {}), true);
});

test('project routes block cross-account edits, rendering and downloads', async (t) => {
  const app = express();
  const router = createCartoonProjectAccessRouter(
    async (header) => viewers[header?.replace(/^Bearer /, '')] ?? null,
    (id) => id === 'owned' ? { ownerUserId: 'alice' } : null,
  );
  router.get('/', (_req, res) => res.json({ userId: res.locals.studioViewer.userId }));
  router.patch('/:id', (_req, res) => res.sendStatus(204));
  router.post('/:id/render', (_req, res) => res.sendStatus(204));
  router.get('/:id/download-mp4', (_req, res) => res.send('download'));
  app.use('/api/cartoon-projects', router);

  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise(resolve => server.close(resolve)));
  await once(server, 'listening');
  const base = 'http://127.0.0.1:' + server.address().port + '/api/cartoon-projects';
  const request = (suffix, token, method = 'GET') => fetch(base + suffix, {
    method, headers: token ? { Authorization: 'Bearer ' + token } : {},
  });

  assert.equal((await request('')).status, 401);
  assert.equal((await request('/owned/download-mp4')).status, 401);
  assert.equal((await request('/owned', 'bob', 'PATCH')).status, 404);
  assert.equal((await request('/owned/render', 'bob', 'POST')).status, 404);
  assert.equal((await request('/owned/download-mp4', 'bob')).status, 404);
  assert.equal((await request('/does-not-exist/download-mp4', 'admin')).status, 404);
  assert.equal((await request('/owned/render', 'alice', 'POST')).status, 204);
  const download = await request('/owned/download-mp4', 'admin');
  assert.equal(download.headers.get('cache-control'), 'private, no-store');
  assert.equal(await download.text(), 'download');
});
