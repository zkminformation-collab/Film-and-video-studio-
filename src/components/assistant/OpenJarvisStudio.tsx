import { useEffect, useRef, useState } from 'react';
import { Bot, Clapperboard, Copy, Send, Smartphone, SquarePen } from 'lucide-react';
import type { StudioModule } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getGuideReply, guideTopics } from './studioGuide';
import type { JarvisLanguage, JarvisMessage } from './types';
import './open-jarvis.css';

const labels = {
  kn: {
    guide: 'Studio ಮಾರ್ಗದರ್ಶಿ',
    model: 'OpenJarvis ಚಾಟ್',
    waiting: 'OpenJarvis ಸಂಪರ್ಕ ಸಿದ್ಧವಾಗಿಲ್ಲ',
    intro: 'ಕಾರ್ಟೂನ್, ಚಿತ್ರಕಥೆ, ಧ್ವನಿ, VFX ಅಥವಾ MP4 ರೆಂಡರ್‌ಗೆ ಸಹಾಯ ಪಡೆಯಿರಿ.',
    mobile: 'ಮೊಬೈಲ್‌ನಲ್ಲಿ ಸ್ಥಾಪಿಸಿ',
    mobileHelp: 'Android Chrome‌ನಲ್ಲಿ ⋮ → Add to Home screen ಅಥವಾ Install app. iPhone Safari‌ನಲ್ಲಿ Share → Add to Home Screen ಆಯ್ಕೆಮಾಡಿ.',
    reset: 'ಹೊಸ ಚಾಟ್',
    placeholder: 'ಉದಾ. ಕಾರ್ಟೂನ್ ಅನ್ನು MP4 ಆಗಿ ಹೇಗೆ ರೆಂಡರ್ ಮಾಡುವುದು?',
    send: 'ಕಳುಹಿಸಿ',
    user: 'ನೀವು',
    copy: 'ನಕಲಿಸಿ',
    copied: 'ನಕಲಿಸಲಾಗಿದೆ',
    copyError: 'ನಕಲಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ',
    open: 'ತೆರೆಯಿರಿ',
    working: 'ಉತ್ತರ ಸಿದ್ಧವಾಗುತ್ತಿದೆ…',
    signIn: 'OpenJarvis ಚಾಟ್ ಬಳಸಲು ಸೈನ್ ಇನ್ ಮಾಡಿ.',
    signInAction: 'ಸೈನ್ ಇನ್',
    error: 'OpenJarvis ಈಗ ಉತ್ತರ ನೀಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಪುನಃ ಪ್ರಯತ್ನಿಸಿ.',
    rateLimit: 'ಹಲವು ಚಾಟ್ ವಿನಂತಿಗಳು ಬಂದಿವೆ. ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಪುನಃ ಪ್ರಯತ್ನಿಸಿ.',
    useIdea: 'Film Maker‌ಗೆ ಕಳುಹಿಸಿ',
  },
  en: {
    guide: 'Studio Guide',
    model: 'OpenJarvis chat',
    waiting: 'OpenJarvis connection pending',
    intro: 'Get help with cartoons, screenplays, voice, VFX and MP4 rendering.',
    mobile: 'Install on mobile',
    mobileHelp: 'In Android Chrome, open ⋮ and choose Add to Home screen or Install app. On iPhone, use Safari’s Share menu and choose Add to Home Screen.',
    reset: 'New chat',
    placeholder: 'How do I render my cartoon as an MP4?',
    send: 'Send',
    user: 'You',
    copy: 'Copy',
    copied: 'Copied',
    copyError: 'Could not copy',
    open: 'Open',
    working: 'Preparing a reply…',
    signIn: 'Sign in to use OpenJarvis chat.',
    signInAction: 'Sign in',
    error: 'OpenJarvis could not reply. Please try again.',
    rateLimit: 'Too many requests. Please try again in a moment.',
    useIdea: 'Send to Film Maker',
  },
};

type ChatLine = JarvisMessage & { action?: { module: StudioModule; label: string } };
type Mode = 'guide' | 'model';

export function OpenJarvisStudio({
  onNavigate,
  onUseFilmIdea,
}: {
  onNavigate: (module: StudioModule) => void;
  onUseFilmIdea: (idea: string) => void;
}) {
  const { firebaseUser, openAuthModal } = useAuth();
  const [language, setLanguage] = useState<JarvisLanguage>('kn');
  const [connected, setConnected] = useState(false);
  const [mode, setMode] = useState<Mode>('guide');
  const [chats, setChats] = useState<Record<Mode, ChatLine[]>>({ guide: [], model: [] });
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const requestRef = useRef<AbortController | null>(null);
  const chatEnd = useRef<HTMLDivElement>(null);
  const conversation = chats[mode];
  const t = labels[language];

  useEffect(() => {
    const request = new AbortController();
    fetch('/api/openjarvis/status', { signal: request.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((status) => setConnected(status?.connected === true))
      .catch(() => {});
    return () => {
      request.abort();
      requestRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (conversation.length) chatEnd.current?.scrollIntoView({ block: 'nearest' });
  }, [conversation.length, busy]);

  function resetConversation() {
    requestRef.current?.abort();
    requestRef.current = null;
    setBusy(false);
    setError('');
    setNotice('');
    setChats((current) => ({ ...current, [mode]: [] }));
  }

  async function submit(text: string) {
    const content = text.trim();
    if (!content || requestRef.current) return;
    setError('');
    setNotice('');
    const next = [...conversation, { role: 'user' as const, content }];
    if (mode === 'guide') {
      const reply = getGuideReply(content, language);
      setChats((current) => ({ ...current, guide: [...next, { role: 'assistant', ...reply }] }));
      setPrompt('');
      return;
    }
    if (!firebaseUser) {
      openAuthModal();
      return;
    }

    const request = new AbortController();
    requestRef.current = request;
    setBusy(true);
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/openjarvis/chat', {
        method: 'POST',
        signal: request.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          messages: next.slice(-9).map(({ role, content }) => ({ role, content })),
          language,
        }),
      });
      if (request.signal.aborted) return;
      if (!response.ok) {
        if (response.status === 401) setError(t.signIn);
        else if (response.status === 429) setError(t.rateLimit);
        else setError(t.error);
        return;
      }
      const data = await response.json() as { content: string };
      if (!request.signal.aborted) {
        setChats((current) => ({ ...current, model: [...next, { role: 'assistant', content: data.content }] }));
        setPrompt('');
      }
    } catch {
      if (!request.signal.aborted) setError(t.error);
    } finally {
      if (requestRef.current === request) {
        setBusy(false);
        requestRef.current = null;
      }
    }
  }

  async function copy(content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setNotice(t.copied);
    } catch {
      setNotice(t.copyError);
    }
  }

  return (
    <section className="jarvis-view" lang={language}>
      <header className="jarvis-title">
        <div className="jarvis-heading">
          <span className="jarvis-mark"><Bot size={25} /></span>
          <div><h1>OpenJarvis</h1><p>{t.intro}</p></div>
        </div>
        <select value={language} aria-label="Reply language" onChange={(event) => setLanguage(event.target.value as JarvisLanguage)}>
          <option value="kn">ಕನ್ನಡ</option><option value="en">English</option>
        </select>
      </header>
      <div className="jarvis-options">
        <div aria-label="Chat mode" className="jarvis-modes">
          <button type="button" aria-pressed={mode === 'guide'} disabled={busy} onClick={() => { setMode('guide'); setError(''); setNotice(''); }}>{t.guide}</button>
          <button type="button" aria-pressed={mode === 'model'} disabled={!connected || busy} title={connected ? undefined : t.waiting} onClick={() => { setMode('model'); setError(''); setNotice(''); }}>{t.model}</button>
        </div>
        {connected ? null : <a href="https://github.com/open-jarvis/OpenJarvis" target="_blank" rel="noreferrer">{t.waiting}</a>}
        {conversation.length > 0 || busy ? <button type="button" onClick={resetConversation}><SquarePen size={16} /> {t.reset}</button> : null}
      </div>
      <div className="jarvis-chat" aria-label={t.model}>
        {mode === 'model' && !firebaseUser && (
          <div className="jarvis-sign-in"><p>{t.signIn}</p><button type="button" onClick={openAuthModal}>{t.signInAction}</button></div>
        )}
        {conversation.length === 0 && mode === 'guide' && (
          <div className="jarvis-topics">
            {guideTopics.map(({ module, label }) => <button type="button" key={module} onClick={() => void submit(label[language])}>{label[language]}</button>)}
          </div>
        )}
        <div role="log" aria-live="polite">
          {conversation.map(({ content, role, action }, index) => (
            <article className="jarvis-message" data-role={role} key={index}>
              <strong>{role === 'user' ? t.user : mode === 'guide' ? t.guide : 'OpenJarvis'}</strong>
              <p>{content}</p>
              {role === 'assistant' && (
                <div className="jarvis-message-actions">
                  {action && <button type="button" onClick={() => onNavigate(action.module)}>{action.label} {t.open}</button>}
                  {mode === 'model' && <button type="button" onClick={() => onUseFilmIdea(content)}><Clapperboard size={16} /> {t.useIdea}</button>}
                  <button type="button" onClick={() => void copy(content)}><Copy size={15} /> {t.copy}</button>
                </div>
              )}
            </article>
          ))}
        </div>
        {busy && <p role="status">{t.working}</p>}
        {error && <p role="alert">{error}</p>}
        <div ref={chatEnd} />
      </div>
      <form className="jarvis-composer" onSubmit={(event) => { event.preventDefault(); void submit(prompt); }}>
        <textarea rows={2} maxLength={2000} placeholder={t.placeholder} aria-label={t.placeholder} value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          disabled={busy}
        />
        <button type="submit" disabled={busy || !prompt.trim()}><Send size={17} /> {t.send}</button>
      </form>
      {notice && <div role="status">{notice}</div>}
      <details className="jarvis-install"><summary><Smartphone size={16} /> {t.mobile}</summary><p>{t.mobileHelp}</p></details>
    </section>
  );
}
