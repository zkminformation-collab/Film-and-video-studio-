import express from 'express';
import firebaseConfig from '../firebase-applet-config.json';
import type { JarvisMessage, JarvisLanguage } from '../src/components/assistant/types';

function endpoint() {
  const base = process.env.OPENJARVIS_BASE_URL;
  const model = process.env.OPENJARVIS_MODEL?.trim();
  const key = process.env.OPENJARVIS_API_KEY?.trim();
  if (!base || !model) return null;
  try {
    const url = new URL(base);
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) ||
        (!loopback && !key) || url.username || url.password || url.search || url.hash) return null;
    url.pathname = url.pathname.replace(/\/+$/, '') + '/chat/completions';
    return { url, model, key };
  } catch {
    return null;
  }
}

function parseConversation(value: unknown): JarvisMessage[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 9) return null;
  const messages: JarvisMessage[] = [];
  for (const [index, item] of value.entries()) {
    const role = index % 2 === 0 ? 'user' : 'assistant';
    const limit = role === 'user' ? 2000 : 5000;
    if (item?.role !== role || typeof item.content !== 'string' || item.content.length > limit || !item.content.trim()) {
      return null;
    }
    messages.push({ role, content: item.content.trim() });
  }
  return messages.at(-1)?.role === 'user' ? messages : null;
}

async function lookupUser(token: string) {
  const url = new URL('https://identitytoolkit.googleapis.com/v1/accounts:lookup');
  url.searchParams.set('key', firebaseConfig.apiKey);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: token }),
    signal: AbortSignal.timeout(8000),
    redirect: 'error',
  });
  if (!response.ok) return null;
  const { users } = await response.json() as { users?: { localId?: string }[] };
  return users?.[0]?.localId || null;
}

function systemPrompt(language: JarvisLanguage) {
  return [
    'You are the film and video production assistant inside ZKMAP Studio.',
    'Help with ideas, screenplays, cartoon and anime production, shot lists, editing, dubbing, VFX, subtitles and export.',
    'You can draft text and provide instructions. Never claim to have accessed user files or performed studio actions.',
    language === 'kn' ? 'Respond in Kannada unless the user explicitly requests another language.' : 'Respond in English unless the user explicitly requests another language.',
  ].join(' ');
}

export function openJarvisRouter() {
  const router = express.Router();
  const recentRequests = new Map<string, { count: number; expires: number }>();
  let inFlight = 0;

  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  router.get('/status', (_req, res) => {
    res.json({ connected: Boolean(endpoint()) });
  });

  router.post('/chat', express.json({ limit: '128kb' }), async (req, res) => {
    const config = endpoint();
    if (!config) {
      res.status(503).json({ error: 'openjarvis_unconfigured' });
      return;
    }
    const token = /^Bearer ([A-Za-z0-9._-]{1,8192})$/.exec(req.get('Authorization') || '')?.[1];
    if (!token) {
      res.status(401).json({ error: 'sign_in_required' });
      return;
    }
    const messages = parseConversation(req.body?.messages);
    const language = req.body?.language;
    if (!messages || (language !== 'kn' && language !== 'en')) {
      res.status(400).json({ error: 'invalid_conversation' });
      return;
    }
    if (inFlight >= 8) {
      res.status(429).json({ error: 'assistant_busy' });
      return;
    }

    inFlight++;
    const cancellation = new AbortController();
    const cancel = () => cancellation.abort();
    res.on('close', cancel);
    try {
      const uid = await lookupUser(token);
      if (cancellation.signal.aborted) return;
      if (!uid) {
        res.status(401).json({ error: 'sign_in_required' });
        return;
      }
      const now = Date.now();
      for (const [id, value] of recentRequests) {
        if (value.expires <= now) recentRequests.delete(id);
      }
      const recent = recentRequests.get(uid) ?? { count: 0, expires: now + 60_000 };
      if (recent.count >= 6) {
        res.status(429).json({ error: 'assistant_busy' });
        return;
      }
      recent.count++;
      recentRequests.set(uid, recent);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (config.key) headers.Authorization = `Bearer ${config.key}`;
      const upstream = await fetch(config.url, {
        method: 'POST',
        headers,
        signal: AbortSignal.any([cancellation.signal, AbortSignal.timeout(45_000)]),
        redirect: 'error',
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'system', content: systemPrompt(language) }, ...messages],
          stream: false,
          max_tokens: 850,
        }),
      });
      if (!upstream.ok) throw new Error('Upstream request failed');
      const data = await upstream.json() as { choices?: { message?: { content?: unknown } }[] };
      const content = data.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || !content.trim()) throw new Error('Missing reply');
      res.json({ content: content.trim().slice(0, 5000) });
    } catch {
      if (!cancellation.signal.aborted) res.status(502).json({ error: 'openjarvis_unavailable' });
    } finally {
      inFlight--;
      res.off('close', cancel);
    }
  });
  return router;
}
