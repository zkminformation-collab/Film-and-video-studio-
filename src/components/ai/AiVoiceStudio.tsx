import { requestCartoonProject } from '../../utils/cartoonProjectApi';
import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Download,
  Layers,
  Radio,
  Sparkles,
  CheckCircle2,
  BookmarkPlus,
} from 'lucide-react';
import { AiVoicePreset, FilmProject } from '../../types';
import { INITIAL_VOICES } from '../../data/initialData';
import { useStudioAi } from '../../context/StudioAiContext';
import { useAuth } from '../../context/AuthContext';
import { soundFx } from '../../utils/audioSynth';

interface AiVoiceStudioProps {
  activeFilm: FilmProject;
}

export const AiVoiceStudio: React.FC<AiVoiceStudioProps> = ({ activeFilm }) => {
  const { addAudioClip, audioClips } = useStudioAi();
  const { firebaseUser, saveLibraryAsset, consumeCreditsAndLog } = useAuth();
  const [voices] = useState<AiVoicePreset[]>(INITIAL_VOICES);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(INITIAL_VOICES[0].id);
  const [language, setLanguage] = useState<'Kannada' | 'English' | 'Hindi' | 'Tamil' | 'Telugu'>('Kannada');
  const [scriptText, setScriptText] = useState(
    'ನಕ್ಷತ್ರಗಳ ನಡುವೆ ಒಂದು ಹೊಸ ಲೋಕ ನಮ್ಮನ್ನು ಕರೆಯುತ್ತಿದೆ. ಕಾಲದ ದ್ವಾರವನ್ನು ತೆರೆಯಿರಿ!'
  );
  const [emotion, setEmotion] = useState<'Dramatic' | 'Whisper' | 'Urgent' | 'Calm'>('Dramatic');
  const [engineMode, setEngineMode] = useState<'auto' | 'elevenlabs' | 'browser'>('auto');
  const [elevenLabsReady, setElevenLabsReady] = useState<boolean>(false);
  const [elevenLabsVoices, setElevenLabsVoices] = useState<Array<{ id: string; name: string; gender: string; accent: string; tone: string }>>([]);
  const [selectedElevenVoiceId, setSelectedElevenVoiceId] = useState<string>('21m00Tcm4TlvDq8ikWAM');
  const [pitch, setPitch] = useState<number>(1.0);
  const [speed, setSpeed] = useState<number>(1.0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastAudioUrl, setLastAudioUrl] = useState<string | null>(null);
  const [lastExtension, setLastExtension] = useState<'mp3' | 'wav'>('wav');
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [characterName, setCharacterName] = useState<string>('Hero');
  const [ttsJobs, setTtsJobs] = useState<
    Array<{
      id: string;
      characterName: string;
      dialogueText: string;
      languageCode: string;
      provider: string;
      status: string;
      format?: string;
      libraryAssetId?: string;
      error?: string;
      explanation?: string;
      suggestedFix?: string;
    }>
  >([]);
  const [lastErrorDetail, setLastErrorDetail] = useState<{
    error: string;
    explanation: string;
    suggestedFix: string;
  } | null>(null);

  const audioElemRef = useRef<HTMLAudioElement | null>(null);

  const refreshTtsJobs = () => {
    fetch('/api/tts/jobs')
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && Array.isArray(d.jobs)) setTtsJobs(d.jobs.slice(0, 8));
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetch('/api/tts/voices')
      .then((r) => r.json())
      .then((d) => {
        setElevenLabsReady(Boolean(d?.elevenLabsConfigured));
        if (Array.isArray(d?.elevenLabsVoices)) {
          setElevenLabsVoices(d.elevenLabsVoices);
        }
      })
      .catch(() => {});



    refreshTtsJobs();
  }, []);

  useEffect(() => {
    setProjects([]);
    setSelectedProjectId('');
    if (!firebaseUser?.emailVerified) return;
    const controller = new AbortController();
    requestCartoonProject(firebaseUser, '/api/cartoon-projects', { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.projects) && d.projects.length > 0) {
          setProjects(d.projects.map((p: any) => ({ id: p.id, name: p.name })));
          setSelectedProjectId(d.projects[0].id);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [firebaseUser]);

  useEffect(() => {
    return () => {
      if (lastAudioUrl) URL.revokeObjectURL(lastAudioUrl);
    };
  }, [lastAudioUrl]);

  const selectedVoice = voices.find((v) => v.id === selectedVoiceId) || voices[0];

  const langToCode = (l: string) => {
    if (l === 'Kannada') return 'kn-IN';
    if (l === 'Hindi') return 'hi-IN';
    if (l === 'Tamil') return 'ta-IN';
    if (l === 'Telugu') return 'te-IN';
    return 'en-US';
  };

  const notify = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice((c) => (c === msg ? null : c)), 3800);
  };

  const handleSpeak = async () => {
    if (!scriptText.trim()) return;
    soundFx.unlock();

    if (engineMode === 'browser') {
      setIsSpeaking(true);
      soundFx.speakDialogue(
        scriptText,
        langToCode(language),
        pitch,
        emotion === 'Urgent' ? Math.min(2.0, speed * 1.2) : speed,
        () => setIsSpeaking(false)
      );
      return;
    }

    setIsGenerating(true);
    setLastErrorDetail(null);
    const activeProj = projects.find((p) => p.id === selectedProjectId);
    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: scriptText,
          languageCode: langToCode(language),
          gender: selectedVoice.gender === 'Female' ? 'Female' : 'Male',
          voiceName: selectedVoice.name,
          elevenLabsVoiceId: selectedElevenVoiceId,
          emotion,
          provider: engineMode,
          pitch,
          speakingRate: emotion === 'Urgent' ? Math.min(2.0, speed * 1.15) : speed,
          projectId: activeProj?.id,
          projectName: activeProj?.name,
          characterName: characterName.trim() || selectedVoice.name.split('(')[0].trim(),
        }),
      });
      const data = await res.json();
      refreshTtsJobs();
      if (data?.audioBase64) {
        const binary = atob(data.audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: data.mimeType || 'audio/wav' });
        const nextUrl = URL.createObjectURL(blob);
        if (lastAudioUrl) URL.revokeObjectURL(lastAudioUrl);
        setLastAudioUrl(nextUrl);
        setLastExtension(data.extension === 'mp3' ? 'mp3' : 'wav');

        if (audioElemRef.current) {
          audioElemRef.current.src = nextUrl;
          await audioElemRef.current.play();
          setIsSpeaking(true);
        }
        notify(
          `Synthesized via ${data.provider || 'Studio Engine'} & auto-saved to Unified Media Library (Voices).`
        );
        if (firebaseUser) {
          void consumeCreditsAndLog(
            'AI Voice Studio',
            data.provider || 'Studio Voice Engine',
            Math.max(10, Math.min(250, Math.round(scriptText.length * 0.5))),
            `${selectedVoice.name} · ${language} dialogue synthesis`
          );
        }
        return;
      } else if (data?.error) {
        setLastErrorDetail({
          error: data.error,
          explanation: data.explanation || 'Cloud TTS provider could not complete this job.',
          suggestedFix:
            data.suggestedFix || 'Configure ELEVENLABS_API_KEY on backend or retry.',
        });
      }
    } catch {
      setLastErrorDetail({
        error: 'Network or TTS synthesis interruption.',
        explanation: 'Could not reach the backend TTS endpoint.',
        suggestedFix: 'Check connection and click Retry.',
      });
    } finally {
      setIsGenerating(false);
    }

    setIsSpeaking(true);
    soundFx.speakDialogue(
      scriptText,
      langToCode(language),
      pitch,
      emotion === 'Urgent' ? Math.min(2.0, speed * 1.2) : speed,
      () => setIsSpeaking(false)
    );
  };

  const handlePreviewSample = async () => {
    soundFx.unlock();
    setIsGenerating(true);
    try {
      const res = await fetch('/api/tts/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: scriptText.slice(0, 120),
          languageCode: langToCode(language),
          gender: selectedVoice.gender === 'Female' ? 'Female' : 'Male',
          voiceName: selectedVoice.name,
          elevenLabsVoiceId: selectedElevenVoiceId,
          emotion,
          provider: engineMode,
          pitch,
          speakingRate: speed,
        }),
      });
      const data = await res.json();
      if (data?.audioBase64 && audioElemRef.current) {
        const binary = atob(data.audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: data.mimeType || 'audio/mpeg' });
        const previewUrl = URL.createObjectURL(blob);
        audioElemRef.current.src = previewUrl;
        await audioElemRef.current.play();
        setIsSpeaking(true);
        notify(`Playing voice preview (${data.provider}).`);
        return;
      }
    } catch {
      // Fallback to browser preview
    } finally {
      setIsGenerating(false);
    }
    soundFx.speakDialogue(scriptText.slice(0, 120), langToCode(language), pitch, speed, () =>
      setIsSpeaking(false)
    );
  };

  const handleStop = () => {
    if (audioElemRef.current) {
      audioElemRef.current.pause();
      audioElemRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const handleSendToAudioTrack = () => {
    soundFx.playCinematicImpact();
    const voiceClips = audioClips.filter((c) => c.trackRole === 'voice');
    const nextStart = voiceClips.reduce(
      (max, c) => Math.max(max, c.startSec + c.durationSec + 0.5),
      0
    );
    const code = langToCode(language);
    addAudioClip({
      id: `aclip-aivoice-${Date.now()}`,
      trackRole: 'voice',
      name: `${selectedVoice.name.split('(')[0].trim()} (${language})`,
      startSec: Math.min(38, nextStart),
      durationSec: Math.min(9, Math.max(3, Math.round(scriptText.split(/\s+/).length * 0.45 * 10) / 10)),
      color: selectedVoice.gender === 'Female' ? '#ec4899' : '#06b6d4',
      dialogueText: scriptText,
      voiceProfileId: selectedVoice.id,
      voiceProfileName: selectedVoice.name,
      language: code,
      pitch,
      rate: speed,
    });
    notify(`Inserted "${selectedVoice.name}" (${language}) onto Audio Studio Track A1.`);
  };

  const handleSaveTakeToLibrary = async () => {
    if (!firebaseUser) {
      notify('Sign in from the header Account button to save voice takes into Cloud My Library.');
      return;
    }
    const savedId = await saveLibraryAsset({
      name: `${selectedVoice.name.split('(')[0].trim()} - ${language} ADR`,
      category: 'audio',
      format: lastExtension.toUpperCase(),
      duration: '00:08',
      size: '1.8 MB',
      provider: engineMode === 'elevenlabs' && elevenLabsReady ? 'ElevenLabs Multilingual v2' : 'Studio Voice Engine',
      thumbnail: '/assets/images/feature_voice_dubbing_1794901010817.jpg',
    });
    if (savedId) {
      soundFx.playShutterSound();
      notify('Saved voice take metadata to your Cloud My Library.');
    }
  };

  const handleDownloadAudio = () => {
    soundFx.unlock();
    if (lastAudioUrl) {
      const a = document.createElement('a');
      a.href = lastAudioUrl;
      a.download = `${selectedVoice.id}_${language}.${lastExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      soundFx.playShutterSound();
      notify(`Downloaded ${language} ${lastExtension.toUpperCase()} voice track.`);
      return;
    }

    notify('Click Synthesize & Play first to generate a real neural voice recording before downloading.');
  };

  const handleGenerateNarration = async (mode: 'dialogue' | 'narration') => {
    setIsSyncing(true);
    soundFx.playScannerBeep();
    try {
      const res = await fetch('/api/ai/dialogue-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: activeFilm.title,
          language,
          mode,
          screenplay: activeFilm.tagline,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.cues) && data.cues.length > 0) {
        setScriptText(data.cues.map((c: any) => `${c.speaker}: ${c.text}`).join('\n\n'));
        notify(`Loaded ${data.cues.length} ${language} ${mode} lines from screenplay.`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-950 text-slate-100">
      <audio
        ref={audioElemRef}
        onEnded={() => setIsSpeaking(false)}
        onPause={() => setIsSpeaking(false)}
        className="hidden"
      />

      {/* Voice Models List (Left) */}
      <div className="w-full lg:w-80 border-r border-slate-800 bg-slate-900/90 p-4 overflow-y-auto space-y-4 shrink-0">
        <div className="border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-cyan-400 font-mono-cinema font-bold text-xs uppercase tracking-wider">
            <Radio className="w-4 h-4" />
            <span>Multilingual Voice Studio</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Kannada, English, Hindi, Tamil & Telugu character voices
          </p>
        </div>

        {/* Engine Switcher */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span>Synthesis Engine</span>
            <span className={elevenLabsReady ? 'text-emerald-400' : 'text-amber-300'}>
              {elevenLabsReady ? 'ElevenLabs Active' : 'Studio Fallback Ready'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: 'auto', label: 'Auto Server' },
              { id: 'elevenlabs', label: 'ElevenLabs' },
              { id: 'browser', label: 'Live Browser' },
            ].map((eng) => (
              <button
                key={eng.id}
                type="button"
                onClick={() => setEngineMode(eng.id as 'auto' | 'elevenlabs' | 'browser')}
                className={`py-1 rounded text-[10px] font-mono transition-colors ${
                  engineMode === eng.id
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {eng.label}
              </button>
            ))}
          </div>
          {elevenLabsVoices.length > 0 && engineMode !== 'browser' && (
            <div className="pt-1">
              <select
                value={selectedElevenVoiceId}
                onChange={(e) => setSelectedElevenVoiceId(e.target.value)}
                aria-label="ElevenLabs Voice Model"
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] font-mono text-cyan-300 outline-none"
              >
                {elevenLabsVoices.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} · {ev.gender}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {voices.map((v) => {
            const isSelected = v.id === selectedVoiceId;
            return (
              <div
                key={v.id}
                onClick={() => {
                  soundFx.playScannerBeep();
                  setSelectedVoiceId(v.id);
                  setScriptText(v.sampleText);
                  if (v.accent.includes('kn-IN')) setLanguage('Kannada');
                  else setLanguage('English');
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-500/50 ring-1 ring-cyan-500/30'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white font-mono truncate">{v.name}</span>
                  <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded font-mono shrink-0">
                    {v.gender}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {v.accent} · {v.tone}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main TTS Stage (Right) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="max-w-3xl mx-auto space-y-5">
          {statusNotice && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusNotice}</span>
            </div>
          )}

          {/* Header banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono-cinema">
                Active Voice Persona · {language}
              </span>
              <h2 className="text-lg font-bold text-white font-cinzel">{selectedVoice.name}</h2>
              <p className="text-xs text-cyan-400 font-mono">{selectedVoice.tone}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isGenerating}
                onClick={isSpeaking ? handleStop : () => void handleSpeak()}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg ${
                  isSpeaking
                    ? 'bg-rose-600 text-white shadow-rose-600/30'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25'
                }`}
              >
                {isSpeaking ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                <span>{isGenerating ? 'Synthesizing...' : isSpeaking ? 'Stop Voice' : 'Generate & Play Voice'}</span>
              </button>
            </div>
          </div>

          {/* Language Selector + Screenplay Extraction */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['Kannada', 'English', 'Hindi', 'Tamil', 'Telugu'] as const).map((langOpt) => (
                <button
                  key={langOpt}
                  type="button"
                  onClick={() => setLanguage(langOpt)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono border transition-colors ${
                    language === langOpt
                      ? 'bg-purple-600 text-white border-purple-500 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {langOpt}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSyncing}
                onClick={() => handleGenerateNarration('dialogue')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-300 border border-slate-700 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Script Dialogue</span>
              </button>
              <button
                type="button"
                disabled={isSyncing}
                onClick={() => handleGenerateNarration('narration')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-purple-300 border border-slate-700 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Story Narration</span>
              </button>
            </div>
          </div>

          {/* Script Text Input */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono-cinema block">
              Dialogue Lines for Synthesis
            </span>
            <textarea
              rows={4}
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 font-screenplay outline-none focus:border-cyan-500 leading-relaxed resize-none"
            />
          </div>

          {/* Emotional Modulation & Tuning */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono-cinema block">
              Vocal Inflection & Emotional Delivery
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Dramatic', 'Whisper', 'Urgent', 'Calm'] as const).map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmotion(em)}
                  className={`py-2 rounded-lg font-mono text-xs font-bold border transition-colors ${
                    emotion === em
                      ? 'bg-cyan-500 text-slate-950 border-cyan-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-400 font-mono">
                  <span>PITCH TUNING</span>
                  <span>{pitch.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-400 font-mono">
                  <span>SPEAKING RATE</span>
                  <span>{speed.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>

            {/* Project & Character Assignment Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-xs">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">
                  ASSIGN TO PROJECT (AUTO-SAVES TO UNIFIED LIBRARY)
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-cyan-300 outline-none"
                >
                  <option value="">Global Studio Library</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} · {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">
                  CHARACTER ASSIGNMENT
                </label>
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="e.g. Maya, Hero, Narrator"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Error -> Explanation -> Fix Suggestion -> Retry */}
            {lastErrorDetail && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs space-y-1">
                <div className="font-bold text-rose-300">Error: {lastErrorDetail.error}</div>
                <div className="text-slate-300 text-[11px]">
                  Explanation: {lastErrorDetail.explanation}
                </div>
                <div className="text-amber-300 text-[11px]">
                  Suggested Fix: {lastErrorDetail.suggestedFix}
                </div>
                <button
                  type="button"
                  onClick={() => void handleSpeak()}
                  className="mt-1 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px]"
                >
                  Retry & Recheck
                </button>
              </div>
            )}

            {/* Direct insert to timeline + Preview + My Library + Audio download */}
            <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => void handlePreviewSample()}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-mono"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Preview Sample</span>
              </button>

              <button
                type="button"
                onClick={() => void handleSaveTakeToLibrary()}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-950 hover:bg-slate-800 text-emerald-300 border border-slate-800 rounded-lg text-xs font-mono"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Save to My Library</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadAudio}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg text-xs font-mono"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Download {lastExtension.toUpperCase()}</span>
              </button>

              <button
                type="button"
                onClick={handleSendToAudioTrack}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold shadow"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Send to Audio Track A1</span>
              </button>
            </div>

            {/* Persistent TTS Generation Jobs Monitor */}
            {ttsJobs.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Recent Voice Generation Jobs (Auto-Saved to Media Library)
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {ttsJobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 text-[11px]"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">
                          {job.characterName} · {job.dialogueText.slice(0, 48)}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {job.languageCode} · {job.provider} · {job.status.toUpperCase()}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                            job.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : job.status === 'failed'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {job.status}
                        </span>
                        {job.status === 'completed' && (
                          <a
                            href={`/api/tts/jobs/${encodeURIComponent(job.id)}/download`}
                            download
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-mono"
                          >
                            Download
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
