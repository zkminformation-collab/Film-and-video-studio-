import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

const openRouterEndpoint = 'https://openrouter.ai/api/v1/chat/completions';
const freeScreenplayModel = 'openrouter/free';

export class ScreenplayProviderError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function generateFreeScreenplay(prompt: string, apiKey: string, authorization: string): Promise<string> {
  const token = /^Bearer\s+(\S+)$/i.exec(authorization)?.[1];
  if (!token) {
    throw new ScreenplayProviderError(401, 'Sign in with a verified Studio account to use OpenRouter.');
  }
  if (prompt.length > 12_000) {
    throw new ScreenplayProviderError(400, 'Shorten the scene prompt and try again.');
  }

  const identity = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (identity.status === 400 || identity.status === 401) {
    throw new ScreenplayProviderError(401, 'Your Studio session has expired. Sign in again.');
  }
  if (!identity.ok) {
    throw new ScreenplayProviderError(503, 'Studio sign-in validation is temporarily unavailable.');
  }
  const account = await identity.json() as { users?: Array<{ emailVerified?: boolean; disabled?: boolean }> };
  const user = account.users?.[0];
  if (!user?.emailVerified || user.disabled) {
    throw new ScreenplayProviderError(403, 'Verify your Studio account email to use OpenRouter.');
  }

  const response = await fetch(openRouterEndpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: freeScreenplayModel,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2_000,
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (response.status === 429) {
    throw new ScreenplayProviderError(429, 'OpenRouter’s free request limit was reached. Try again later.');
  }
  if (!response.ok) {
    throw new ScreenplayProviderError(502, 'OpenRouter could not generate a scene. Try again later.');
  }
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const screenplay = data.choices?.[0]?.message?.content;
  if (typeof screenplay !== 'string' || !screenplay.trim()) {
    throw new ScreenplayProviderError(502, 'OpenRouter returned an empty scene. Try again.');
  }
  return screenplay.trim();
}
