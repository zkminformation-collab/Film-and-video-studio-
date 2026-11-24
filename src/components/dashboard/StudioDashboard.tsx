import React, { useState } from 'react';
import {
  Activity, BookOpen, Clapperboard, Download, FileText, Film, FolderOpen, Globe,
  Image as ImageIcon, Mic, Mic2, Music, Play, Plus, SlidersHorizontal, Sparkles,
  Trash2, Wand2, Zap,
} from 'lucide-react';
import { FilmProject, StudioModule, StudioTheme } from '../../types';
import { useStudioAi } from '../../context/StudioAiContext';
import { useAuth } from '../../context/AuthContext';
import heroImage from '../../assets/images/studio-hero.webp';
import cartoonImage from '../../assets/images/studio-cartoon.webp';
import manhwaImage from '../../assets/images/studio-manhwa.webp';
import voiceImage from '../../assets/images/studio-voice.webp';
import editorImage from '../../assets/images/studio-editor.webp';
import filmImage from '../../assets/images/studio-film.webp';
import './studio-dashboard.css';

interface StudioDashboardProps {
  activeFilm: FilmProject | null;
  allFilms: FilmProject[];
  onSelectFilm: (film: FilmProject) => void;
  onDeleteFilm: (filmId: string) => void;
  onCreateNewFilm: () => void;
  onRestoreSampleFilms: () => void;
  onNavigate: (module: StudioModule) => void;
  onOpenQueue: () => void;
  theme: StudioTheme;
}

const templates = [
  { module: 'cartoon_creator', title: 'AI Cartoon Creator', description: 'Build scenes, edit the timeline, and review your cartoon before export.', image: cartoonImage },
  { module: 'manhwa_studio', title: 'Manhwa to Motion', description: 'Animate comic panels and add dialogue in five languages.', image: manhwaImage },
  { module: 'ai_voice', title: 'Voice & Dubbing', description: 'Record or generate narration and character dialogue.', image: voiceImage },
  { module: 'editor', title: 'Timeline Studio', description: 'Edit video, dialogue, music and titles across multiple tracks.', image: editorImage },
  { module: 'ai_wizard', title: 'AI Film Maker', description: 'Turn a concept into a screenplay, storyboard and shots.', image: filmImage },
] satisfies { module: StudioModule; title: string; description: string; image: string }[];

const tools = [
  { module: 'cartoon_creator', title: 'Cartoon & Anime', icon: Clapperboard },
  { module: 'ai_video', title: 'AI Video', icon: Film },
  { module: 'ai_image', title: 'AI Image', icon: ImageIcon },
  { module: 'ai_voice', title: 'Text to Speech', icon: Mic2 },
  { module: 'editor', title: 'Timeline Editor', icon: SlidersHorizontal },
  { module: 'export', title: 'Export & Render', icon: Download },
  { module: 'manhwa_studio', title: 'Manhwa Studio', icon: BookOpen },
  { module: 'ai_wizard', title: 'AI Film Maker', icon: Sparkles },
  { module: 'audio', title: 'Music & Sound', icon: Music },
  { module: 'vfx', title: 'VFX & Shaders', icon: Wand2 },
  { module: 'media', title: 'Asset Library', icon: FolderOpen },
  { module: 'script', title: 'Screenplay', icon: FileText },
  { module: 'social_media', title: 'Social Studio', icon: Globe },
] satisfies { module: StudioModule; title: string; icon: React.ElementType }[];

const filters = [
  { id: 'all', label: 'Overview' },
  { id: 'templates', label: 'Workflows' },
  { id: 'apps', label: 'Studio tools' },
  { id: 'projects', label: 'My projects' },
] as const;

type SpeechEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type BrowserRecognition = {
  lang: string;
  onresult: (event: SpeechEvent) => void;
  onerror: () => void;
  onend: () => void;
  start: () => void;
};

export function StudioDashboard({
  activeFilm, allFilms, onSelectFilm, onDeleteFilm, onCreateNewFilm, onRestoreSampleFilms,
  onNavigate, onOpenQueue, theme,
}: StudioDashboardProps) {
  const { wallet, history, queue } = useStudioAi();
  const { account, usageLogs } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [filter, setFilter] = useState<(typeof filters)[number]['id']>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dictationNotice, setDictationNotice] = useState('');
  const [dictationLanguage, setDictationLanguage] = useState('kn-IN');
  const [listening, setListening] = useState(false);
  const activeRenders = queue.filter(({ status }) => status === 'Queued' || status === 'Synthesizing').length;
  const failedRenders = queue.filter(({ status }) => status === 'Failed').length;
  const credits = account?.creditsRemaining.toLocaleString() ??
    (wallet.plan === 'Unlimited' ? 'Unlimited' : wallet.balance.toLocaleString());
  const progress = activeFilm?.scenesCount
    ? Math.max(0, Math.min(100, Math.round((activeFilm.completedScenes / activeFilm.scenesCount) * 100)))
    : 0;
  const activity = usageLogs.length
    ? usageLogs.slice(0, 6).map((entry) => ({
        id: entry.id, tool: entry.tool, detail: entry.summary, value: `−${entry.creditsUsed} cr`,
      }))
    : history.slice(0, 6).map((entry) => ({
        id: entry.id, tool: entry.tool, detail: `${entry.type} · ${entry.timestamp}`,
        value: `${entry.amount.toLocaleString()} cr`,
      }));

  function startFilmFlow(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeFilm) onCreateNewFilm();
    try {
      if (prompt.trim()) localStorage.setItem('fvs_active_flow_prompt', prompt.trim());
      else localStorage.removeItem('fvs_active_flow_prompt');
    } catch {
      // The film workspace can open when storage is unavailable.
    }
    onNavigate('ai_wizard');
  }

  function startDictation() {
    const browser = window as Window & {
      SpeechRecognition?: new () => BrowserRecognition;
      webkitSpeechRecognition?: new () => BrowserRecognition;
    };
    const Recognition = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!Recognition) {
      setDictationNotice('Voice input is unavailable in this browser. Type your idea to continue.');
      return;
    }
    try {
      const recognition = new Recognition();
      recognition.lang = dictationLanguage;
      recognition.onresult = ({ results }) => {
        const transcript = results[0]?.[0]?.transcript;
        if (transcript) setPrompt((value) => [value, transcript].filter(Boolean).join(' '));
      };
      recognition.onerror = () => {
        setListening(false);
        setDictationNotice('Voice input could not start. Check your microphone access or type your idea.');
      };
      recognition.onend = () => setListening(false);
      recognition.start();
      setDictationNotice('');
      setListening(true);
    } catch {
      setDictationNotice('Voice input could not start. Type your idea to continue.');
    }
  }

  function openTimeline(film: FilmProject) {
    onSelectFilm(film);
    onNavigate('editor');
  }

  return (
    <div className="studio-home" data-light={theme === 'elevenlabs'}>
      <div className="studio-home-content">
        <div className="studio-home-top">
          <h1>Production workspace</h1>
          <button type="button" className="studio-secondary" onClick={() => {
            onCreateNewFilm();
            onNavigate('films');
          }}>
            <Plus size={17} /> New project
          </button>
        </div>

        <section className="studio-hero" aria-labelledby="studio-hero-heading">
          <img className="studio-hero-image" src={heroImage} alt="" fetchPriority="high" />
          <div className="studio-hero-copy">
            <div className="studio-hero-label"><Clapperboard size={16} /> AI FILM MAKER</div>
            <h2 id="studio-hero-heading">Create your next film</h2>
            <p>Start with an idea in Kannada or English. Build the screenplay, storyboard and shots in the Film Maker.</p>
            <form className="studio-composer" onSubmit={startFilmFlow}>
              <textarea
                aria-label="Film idea"
                placeholder="A young astronomer discovers a hidden clock beneath an ancient observatory…"
                value={prompt}
                rows={2}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <div className="studio-composer-actions">
                <div className="studio-dictation">
                  <button type="button" className="studio-mic" onClick={startDictation} disabled={listening} aria-label="Dictate film idea" title="Dictate film idea">
                    <Mic size={17} />
                  </button>
                  <select aria-label="Dictation language" value={dictationLanguage} onChange={(event) => setDictationLanguage(event.target.value)}>
                    <option value="kn-IN">ಕನ್ನಡ</option>
                    <option value="en-IN">English</option>
                  </select>
                </div>
                <button type="submit" className="studio-primary"><Sparkles size={16} /> Open Film Maker</button>
              </div>
              {(listening || dictationNotice) && <p className="studio-dictation-status" role="status">{listening ? 'Listening…' : dictationNotice}</p>}
            </form>
          </div>
        </section>

        <section className="studio-overview" aria-label="Production status">
          <button type="button" className="studio-stat" onClick={() => setFilter('projects')}>
            <span className="studio-stat-icon"><Clapperboard size={19} /></span>
            <span className="studio-stat-body">
              <span>Active project</span>
              <strong title={activeFilm?.title}>{activeFilm?.title || 'No active project'}</strong>
              {activeFilm && <span className="studio-stat-progress">
                <progress aria-label="Scene completion" value={progress} max={100} />
                <span>{activeFilm.completedScenes}/{activeFilm.scenesCount} scenes</span>
              </span>}
            </span>
          </button>
          <button type="button" className="studio-stat" onClick={onOpenQueue}>
            <span className="studio-stat-icon"><Activity size={19} /></span>
            <span className="studio-stat-body">
              <span>Render queue</span>
              <strong>{activeRenders ? `${activeRenders} in progress` : 'No active renders'}</strong>
              <span>{failedRenders ? `${failedRenders} need attention` : 'View render activity'}</span>
            </span>
          </button>
          <button type="button" className="studio-stat" onClick={() => onNavigate('credit_wallet')}>
            <span className="studio-stat-icon"><Zap size={19} /></span>
            <span className="studio-stat-body">
              <span>Credits &amp; plans</span>
              <strong>{credits} credits</strong>
              <span>{account?.plan ?? wallet.plan} plan</span>
            </span>
          </button>
        </section>

        <nav aria-label="Dashboard sections" className="studio-filters">
          {filters.map(({ id, label }) => (
            <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>
          ))}
        </nav>

        {(filter === 'all' || filter === 'templates') && (
          <section className="studio-section">
            <div className="studio-section-title">
              <h2>Featured workflows</h2>
              {filter === 'all' && <button type="button" onClick={() => setFilter('templates')}>View all workflows</button>}
            </div>
            <div className="studio-workflows">
              {(filter === 'all' ? templates.slice(0, 4) : templates).map(({ module, title, description, image }) => (
                <button key={module} type="button" className="studio-workflow" onClick={() => onNavigate(module)}>
                  <div className="studio-workflow-image"><img src={image} alt="" loading="lazy" width={640} height={360} /></div>
                  <div className="studio-workflow-copy"><h3>{title}</h3><p>{description}</p></div>
                </button>
              ))}
            </div>
          </section>
        )}

        {(filter === 'all' || filter === 'apps') && (
          <section className="studio-section">
            <div className="studio-section-title">
              <h2>Studio tools</h2>
              {filter === 'all' && <button type="button" onClick={() => setFilter('apps')}>View all tools</button>}
            </div>
            <div className="studio-tools">
              {(filter === 'all' ? tools.slice(0, 6) : tools).map(({ module, title, icon: Icon }) => (
                <button key={module} type="button" onClick={() => onNavigate(module)}><Icon size={19} /> {title}</button>
              ))}
            </div>
          </section>
        )}

        {(filter === 'all' || filter === 'projects') && (
          <div className="studio-projects">
            <section className="studio-panel" aria-labelledby="studio-project-heading">
              <div className="studio-section-title">
                <h2 id="studio-project-heading">My projects <small>{allFilms.length}</small></h2>
                {filter === 'all' && <button type="button" onClick={() => setFilter('projects')}>View all projects</button>}
              </div>
              {allFilms.length === 0 ? (
                <div className="studio-empty">
                  <p>No film projects yet.</p>
                  <button type="button" onClick={onRestoreSampleFilms}>Restore starter films</button>
                </div>
              ) : (
                (filter === 'all' ? allFilms.slice(0, 3) : allFilms).map((film) => (
                  <div className="studio-project-row" key={film.id}>
                    <button type="button" className="studio-project-select" onClick={() => onSelectFilm(film)} aria-pressed={film.id === activeFilm?.id}>
                      <img src={film.coverImage} alt="" loading="lazy" />
                      <span><strong>{film.title}</strong><small>{film.status} · {film.resolution}</small></span>
                    </button>
                    <div className="studio-project-actions">
                      {deleteId === film.id ? (
                        <>
                          <button type="button" className="studio-delete" onClick={() => { onDeleteFilm(film.id); setDeleteId(null); }}>Delete</button>
                          <button type="button" onClick={() => setDeleteId(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => openTimeline(film)} aria-label={`Edit ${film.title} in Timeline`} title="Open in Timeline"><Play size={16} /></button>
                          <button type="button" onClick={() => setDeleteId(film.id)} aria-label={`Delete ${film.title}`} title="Delete project"><Trash2 size={16} /></button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </section>
            <section className="studio-panel" aria-labelledby="studio-activity-heading">
              <div className="studio-section-title"><h2 id="studio-activity-heading">Recent credit activity</h2></div>
              {activity.length === 0 && <p className="studio-empty">No credit activity yet.</p>}
              {activity.map(({ id, tool, detail, value }) => (
                <div key={id} className="studio-activity-row">
                  <div><strong>{tool}</strong><small>{detail}</small></div><span>{value}</span>
                </div>
              ))}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
