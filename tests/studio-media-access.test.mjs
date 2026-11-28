import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import express from 'express';
import { clearStudioMediaSession, createStudioMediaAccess, issueStudioMediaSession, studioMediaViewer } from '../server/studioMediaAccess.ts';

const alice = { userId: 'alice', isAdmin: false };
const bob = { userId: 'bob', isAdmin: false };
const project = {
  id: 'owned-project',
  ownerUserId: 'alice',
  thumbnailUrl: '/assets/demo.png',
  referenceImages: [{ url: '/api/cartoon-assets/scene-private.png' }],
  scenes: [{ dialogueAudioUrl: '/api/cartoon-assets/voice-private.wav', originalVideoUrl: '/api/cartoon-assets/video-source.mp4' }],
};
const video = { ownerUserId: 'alice', url: '/api/library-uploads/private-video.mp4' };

test('scene files, project metadata and private renders are restricted to their owners', () => {
  const access = (viewer) => createStudioMediaAccess(viewer, [project], [video]);
  for (const viewer of [undefined, bob]) {
    assert.equal(access(viewer).allowsUrl('/api/cartoon-assets/scene-private.png'), false);
    assert.equal(access(viewer).allowsUrl('/api/cartoon-assets/video-source.mp4'), false);
    assert.equal(access(viewer).allowsUrl('/api/cartoon-assets/voice-private.wav'), false);
    assert.equal(access(viewer).allowsUrl(video.url), false);
    assert.equal(access(viewer).allowsRecord({ project_id: project.id }), false);
    assert.equal(access(viewer).allowsRecord({ linked_projects: [project.id] }), false);
    assert.equal(access(viewer).allowsRecord({ preview_url: video.url }), false);
  }
  assert.equal(access(alice).allowsUrl('/api/cartoon-assets/voice-private.wav'), true);
  assert.equal(access(alice).allowsUrl('/api/cartoon-assets/video-source.mp4'), true);
  assert.equal(access(alice).allowsRecord(video), true);
  assert.equal(access(alice).isPrivateRecord(video), true);
  assert.equal(access(undefined).allowsUrl('/assets/demo.png'), true);
  assert.equal(access(undefined).allowsUrl('/api/library-uploads/ordinary-upload.png'), true);
});

test('a shared file reference cannot grant an unrelated project access', () => {
  const repeated = { ...project, id: 'other-project', ownerUserId: 'bob' };
  const access = createStudioMediaAccess(bob, [repeated, project], []);
  assert.equal(access.allowsUrl('/api/cartoon-assets/scene-private.png'), false);
});

test('the media session cookie grants same-browser reads only while its session exists', async (t) => {
  const app = express();
  app.post('/api/session', (req, res) => {
    issueStudioMediaSession(req, res, alice);
    res.sendStatus(204);
  });
  app.delete('/api/session', (req, res) => {
    clearStudioMediaSession(req, res);
    res.sendStatus(204);
  });
  app.get('/api/media', (req, res) => {
    const access = createStudioMediaAccess(studioMediaViewer(req), [project], []);
    res.sendStatus(access.allowsUrl('/api/cartoon-assets/scene-private.png') ? 200 : 404);
  });
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise(resolve => server.close(resolve)));
  await once(server, 'listening');
  const base = 'http://127.0.0.1:' + server.address().port;
  const response = await fetch(base + '/api/session', { method: 'POST' });
  const setCookie = response.headers.get('set-cookie');
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Strict/i);
  const headers = { cookie: setCookie.split(';')[0] };
  assert.equal((await fetch(base + '/api/media')).status, 404);
  assert.equal((await fetch(base + '/api/media', { headers })).status, 200);
  assert.equal((await fetch(base + '/api/session', { method: 'DELETE', headers })).status, 204);
  assert.equal((await fetch(base + '/api/media', { headers })).status, 404);
});
