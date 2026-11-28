import type { User } from 'firebase/auth';

export async function requestCartoonProject(user: User, path: string, init?: RequestInit): Promise<Response> {
  const url = new URL(path, window.location.origin);
  if (url.origin !== window.location.origin || !/^\/api\/cartoon-projects(?:\/|$)/.test(url.pathname)) {
    throw new Error('Invalid cartoon project request.');
  }
  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${await user.getIdToken()}`);
  return fetch(url, { ...init, headers });
}

export async function downloadCartoonProjectMp4(user: User, path: string, filename?: string) {
  const response = await requestCartoonProject(user, path);
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || 'The verified project download is unavailable.');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    const name = filename?.trim() || 'cartoon_film.mp4';
    link.download = /\.mp4$/i.test(name) ? name : name + '.mp4';
    link.click();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
