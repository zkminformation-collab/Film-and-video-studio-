import React, { useEffect, useRef, useState } from 'react';
import {
  Music,
  Volume2,
  Sparkles,
  Play,
  Pause,
  Download,
  Layers,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Wand2,
} from 'lucide-react';
import { useStudioAi } from '../../context/StudioAiContext';
import { soundFx } from '../../utils/audioSynth';

interface StudioAudioAssetRecord {
  assetId: string;
  jobId: string;
  projectId?: string;
  projectName?: string;
  assetType: 'music' | 'sfx';
  title: string;
  prompt: string;
  provider: string;
  genreOrCategory: string;
  moodOrIntensity: string;
  instrument?: string;
  tempo?: string;
  loop?: boolean;
  fileName: string;
  filePath: string;
  format: 'mp3' | 'wav';
  durationSec: number;
  sizeBytes: number;
  timelineTrack: 'A2' | 'A3' | 'A4';
  addedToTimeline: boolean;
  libraryAssetId: string;
  license: string;
  generationStatus: string;
  createdAt: string;
}

const MUSIC_PROMPT_EXAMPLES = [
  'Cinematic background music for an animated adventure.',
  'Emotional piano music for a sad scene.',
  'Suspenseful orchestral music for a mysterious scene.',
  'Happy cartoon background music.',
  'Peaceful nature music with flute and soft strings.',
];

const SFX_PROMPT_EXAMPLES = [
  { scene: 'Walking', category: 'Cartoon', prompt: 'Footsteps on a wooden floor' },
  { scene: 'Rain', category: 'Weather', prompt: 'Heavy rain with distant thunder' },
  { scene: 'Fighting', category: 'Action', prompt: 'Cartoon punch impact and whoosh' },
  { scene: 'Flying', category: 'Cartoon', prompt: 'Fast magical flying sound' },
  { scene: 'Door', category: 'Environment', prompt: 'Old wooden door creaking open' },
  { scene: 'Forest', category: 'Nature', prompt: 'Birds, wind and rustling leaves' },
  { scene: 'Explosion', category: 'Action', prompt: 'Cinematic explosion with a deep impact' },
  { scene: 'Magic', category: 'Cartoon', prompt: 'Sparkling magical energy sound' },
];

export const MusicSfxStudioPanel: React.FC = () => {
  const { addAudioClip, audioClips } = useStudioAi();
  const [activeMode, setActiveMode] = useState<'music' | 'sfx' | 'suggestions'>('music');
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [stableAudioConfigured, setStableAudioConfigured] = useState<boolean>(false);

  // Music Studio state
  const [musicPrompt, setMusicPrompt] = useState(MUSIC_PROMPT_EXAMPLES[0]);
  const [genre, setGenre] = useState('Cinematic');
  const [mood, setMood] = useState('Happy');
  const [instrument, setInstrument] = useState('Piano');
  const [tempo, setTempo] = useState('Medium');
  const [musicDuration, setMusicDuration] = useState(15);
  const [loopMusic, setLoopMusic] = useState(true);

  // SFX Studio state
  const [sfxCategory, setSfxCategory] = useState('Action');
  const [sfxPrompt, setSfxPrompt] = useState('Cartoon punch impact and whoosh');
  const [sfxDuration, setSfxDuration] = useState(4);
  const [sfxIntensity, setSfxIntensity] = useState('Powerful');

  // Scene Suggestions state
  const [sceneText, setSceneText] = useState('Character enters a misty forest at dawn');
  const [suggestions, setSuggestions] = useState<
    Array<{ id: string; assetType: string; track: string; label: string; prompt: string; category: string }>
  >([]);

  // Library & Playback state
  const [savedAssets, setSavedAssets] = useState<StudioAudioAssetRecord[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [playingAssetId, setPlayingAssetId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const notify = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice((c) => (c === msg ? null : c)), 4000);
  };

  const loadAudioLibrary = async () => {
    try {
      const r = await fetch('/api/audio/library');
      const d = await r.json();
      if (d?.success) {
        setSavedAssets(Array.isArray(d.assets) ? d.assets : []);
        setStableAudioConfigured(Boolean(d.stableAudioConfigured));
      }
    } catch {
      // Ignore transient error
    }
  };

  useEffect(() => {
    void loadAudioLibrary();
    fetch('/api/cartoon-projects')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.projects) && d.projects.length > 0) {
          setProjects(d.projects.map((p: any) => ({ id: p.id, name: p.name })));
          setSelectedProjectId(d.projects[0].id);
        }
      })
      .catch(() => {});

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const handleGenerateMusic = async () => {
    if (!musicPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/music/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: musicPrompt,
          title: `${genre} ${mood} — ${instrument}`,
          genre,
          mood,
          instrument,
          tempo,
          durationSec: musicDuration,
          loop: loopMusic,
          projectId: selectedProject?.id,
          projectName: selectedProject?.name,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Music generation failed.');
      setSavedAssets((prev) => [data.asset, ...prev]);
      notify(`Generated "${data.asset.title}" and saved to Unified Media Library (Music).`);
    } catch (err: any) {
      notify(err?.message || 'Music generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSfx = async (overridePrompt?: string, overrideCat?: string) => {
    const targetPrompt = (overridePrompt || sfxPrompt).trim();
    const targetCat = overrideCat || sfxCategory;
    if (!targetPrompt) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/sfx/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: targetPrompt,
          title: `${targetCat}: ${targetPrompt.slice(0, 32)}`,
          category: targetCat,
          intensity: sfxIntensity,
          durationSec: sfxDuration,
          projectId: selectedProject?.id,
          projectName: selectedProject?.name,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'SFX generation failed.');
      setSavedAssets((prev) => [data.asset, ...prev]);
      notify(`Generated SFX "${data.asset.title}" and saved to Unified Media Library (SFX).`);
    } catch (err: any) {
      notify(err?.message || 'SFX generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFetchSuggestions = async () => {
    try {
      const res = await fetch('/api/audio/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneDescription: sceneText }),
      });
      const data = await res.json();
      if (data?.success && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
      }
    } catch {
      notify('Could not load scene audio suggestions.');
    }
  };

  const handlePlayToggle = (asset: StudioAudioAssetRecord) => {
    if (playingAssetId === asset.assetId) {
      audioRef.current?.pause();
      setPlayingAssetId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const player = new Audio(asset.filePath);
    audioRef.current = player;
    setPlayingAssetId(asset.assetId);
    player.onended = () => setPlayingAssetId(null);
    player.onerror = () => setPlayingAssetId(null);
    player.play().catch(() => setPlayingAssetId(null));
  };

  const handleAddToTimeline = async (asset: StudioAudioAssetRecord) => {
    soundFx.playCinematicImpact();
    const role = asset.assetType === 'music' ? 'music' : 'sfx';
    const existingOnRole = audioClips.filter((c) => c.trackRole === role);
    const nextStart = existingOnRole.reduce((m, c) => Math.max(m, c.startSec + c.durationSec + 0.5), 0);

    addAudioClip({
      id: `aclip-${asset.assetId}-${Date.now()}`,
      trackRole: role,
      name: asset.title,
      startSec: Math.min(40, nextStart),
      durationSec: Math.min(18, Math.max(3, asset.durationSec)),
      color: asset.assetType === 'music' ? '#8b5cf6' : '#f59e0b',
    });

    await fetch(`/api/audio/${encodeURIComponent(asset.assetId)}/timeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track: asset.assetType === 'music' ? 'A2' : 'A3' }),
    }).catch(() => {});

    setSavedAssets((prev) =>
      prev.map((a) => (a.assetId === asset.assetId ? { ...a, addedToTimeline: true } : a))
    );
    notify(
      `Placed "${asset.title}" on Timeline Track ${asset.assetType === 'music' ? 'A2 (Background Music)' : 'A3 (Sound Effects)'}!`
    );
  };

  const handleDeleteAsset = async (assetId: string) => {
    await fetch(`/api/audio/${encodeURIComponent(assetId)}`, { method: 'DELETE' }).catch(() => {});
    setSavedAssets((prev) => prev.filter((a) => a.assetId !== assetId));
    notify('Deleted audio asset from studio library.');
  };

  return (
    <div className="rounded-2xl border border-purple-500/30 bg-[#0b0e17] p-4 space-y-4 text-xs text-slate-100">
      {/* Header & Provider Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">
              Music Studio & Sound Effects (SFX) Studio · Stable Audio Pipeline
            </h3>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                stableAudioConfigured
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
              }`}
            >
              {stableAudioConfigured ? 'Stable Audio API Live' : 'Studio WAV Fallback (Add STABILITY_API_KEY)'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Track Routing: A1 Dialogue (ElevenLabs) · A2 Music (Stable Audio) · A3 SFX (Stable Audio) · A4 Ambience · A5 Narration
          </p>
        </div>

        <div className="flex items-center gap-2">
          {projects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  Project: {p.name}
                </option>
              ))}
            </select>
          )}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl">
            {[
              { id: 'music', label: 'Music Studio' },
              { id: 'sfx', label: 'SFX Studio' },
              { id: 'suggestions', label: 'Scene AI Suggestions' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveMode(t.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  activeMode === t.id ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {notice && (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 flex items-center gap-2 font-mono text-[11px]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* TAB 1: MUSIC STUDIO */}
      {activeMode === 'music' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Text-to-Music Prompt</label>
              <textarea
                rows={2}
                value={musicPrompt}
                onChange={(e) => setMusicPrompt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-purple-500"
              />
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {MUSIC_PROMPT_EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setMusicPrompt(ex)}
                    className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300"
                  >
                    {ex.slice(0, 38)}…
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">Genre</label>
                <select value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white">
                  {['Cinematic', 'Orchestral', 'Electronic', 'Jazz', 'Ambient'].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">Mood</label>
                <select value={mood} onChange={(e) => setMood(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white">
                  {['Happy', 'Sad', 'Scary', 'Romantic', 'Suspense'].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">Instrument</label>
                <select value={instrument} onChange={(e) => setInstrument(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white">
                  {['Piano', 'Violin', 'Guitar', 'Drums', 'Flute', 'Orchestral'].map((inst) => (
                    <option key={inst} value={inst}>{inst}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">Tempo</label>
                <select value={tempo} onChange={(e) => setTempo(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white">
                  {['Slow', 'Medium', 'Fast'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">Duration ({musicDuration}s)</label>
                <input
                  type="range"
                  min={5}
                  max={30}
                  value={musicDuration}
                  onChange={(e) => setMusicDuration(Number(e.target.value))}
                  className="w-full accent-purple-500 mt-1"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={loopMusic}
                onChange={(e) => setLoopMusic(e.target.checked)}
                className="accent-purple-500"
              />
              <span>Seamless Background Loop</span>
            </label>
            <button
              onClick={handleGenerateMusic}
              disabled={isGenerating}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{isGenerating ? 'Generating Music...' : 'Generate Music & Save to Library'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: SOUND EFFECTS (SFX) STUDIO */}
      {activeMode === 'sfx' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">Category</label>
                <select value={sfxCategory} onChange={(e) => setSfxCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white">
                  {['Nature', 'Action', 'Cartoon', 'Vehicle', 'Weather', 'Environment'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">Intensity</label>
                <select value={sfxIntensity} onChange={(e) => setSfxIntensity(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white">
                  {['Soft', 'Medium', 'Powerful'].map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">Duration ({sfxDuration}s)</label>
                <input
                  type="range"
                  min={2}
                  max={12}
                  value={sfxDuration}
                  onChange={(e) => setSfxDuration(Number(e.target.value))}
                  className="w-full accent-amber-500 mt-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Sound Effect Prompt</label>
              <input
                type="text"
                value={sfxPrompt}
                onChange={(e) => setSfxPrompt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white outline-none focus:border-amber-500"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {SFX_PROMPT_EXAMPLES.map((ex) => (
                  <button
                    key={ex.scene}
                    onClick={() => {
                      setSfxCategory(ex.category);
                      setSfxPrompt(ex.prompt);
                    }}
                    className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-amber-200"
                  >
                    {ex.scene}: {ex.prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <p className="text-[11px] text-slate-400">
              Generate variations freely—each SFX receives a unique Asset ID and never overwrites previous takes.
            </p>
            <button
              onClick={() => handleGenerateSfx()}
              disabled={isGenerating}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
              <span>{isGenerating ? 'Generating SFX...' : 'Generate SFX & Save to Library'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: SCENE-BASED AI AUDIO SUGGESTIONS */}
      {activeMode === 'suggestions' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={sceneText}
              onChange={(e) => setSceneText(e.target.value)}
              placeholder="Describe the scene (e.g. Character enters a forest / Hero battle clash)..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleFetchSuggestions}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold flex items-center gap-1.5"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Suggest Scene Audio</span>
            </button>
          </div>
          {suggestions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {suggestions.map((sug) => (
                <div key={sug.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{sug.label}</span>
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px]">
                        Track {sug.track}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{sug.prompt}</p>
                  </div>
                  {sug.assetType !== 'voice' && (
                    <button
                      disabled={isGenerating}
                      onClick={() =>
                        sug.assetType === 'music'
                          ? (setMusicPrompt(sug.prompt), setActiveMode('music'))
                          : handleGenerateSfx(sug.prompt, sug.category)
                      }
                      className="w-full py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px]"
                    >
                      Approve & Generate
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Saved Music & SFX Assets (Auto-synced to Unified Media Library) */}
      {savedAssets.length > 0 && (
        <div className="border-t border-slate-800 pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-300 font-bold">
              Generated Music & SFX Assets ({savedAssets.length} · Saved in Unified Media Library)
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {savedAssets.map((asset) => (
              <div
                key={asset.assetId}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                        asset.assetType === 'music'
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {asset.assetType} · {asset.timelineTrack}
                    </span>
                    <span className="font-bold text-white truncate">{asset.title}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                    {asset.durationSec}s · {asset.format.toUpperCase()} · {asset.projectId || 'Global'} · {asset.provider}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handlePlayToggle(asset)}
                    className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300"
                    title="Preview Audio"
                  >
                    {playingAssetId === asset.assetId ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleAddToTimeline(asset)}
                    className="px-2 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] flex items-center gap-1"
                    title="Add to Timeline"
                  >
                    <Layers className="w-3 h-3" />
                    <span>{asset.addedToTimeline ? 'Added' : 'Timeline'}</span>
                  </button>
                  <a
                    href={asset.filePath}
                    download={asset.fileName}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                    title="Download Audio"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => handleDeleteAsset(asset.assetId)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-600/80 text-rose-300 hover:text-white"
                    title="Delete Asset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
