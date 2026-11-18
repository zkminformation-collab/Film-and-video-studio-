import React, { useState, useEffect } from 'react';
import {
  Play,
  Square,
  Star,
  Sparkles,
  Layers,
  Film,
  Download,
  UserCheck,
  Languages,
  Plus,
  Trash2,
  Save,
  Volume2,
} from 'lucide-react';
import {
  AudioTimelineClip,
  SavedVoiceProfile,
  SupportedVoiceLanguage,
  VoiceAgeOption,
  VoiceEmotionOption,
  VoiceGenderOption,
  VoiceLanguageCode,
  VoicePitchLevel,
  VoiceStyleOption,
} from './audioTypes';
import { soundFx } from '../../utils/audioSynth';

export interface CharacterVoiceConfig {
  characterName: string;
  language: SupportedVoiceLanguage;
  gender: 'Male' | 'Female';
  style: VoiceStyleOption;
  age: VoiceAgeOption;
  emotion: VoiceEmotionOption;
  speed: number;
  pitchLevel: VoicePitchLevel;
  dialogueLine: string;
  cloudVoiceName?: string;
  deviceVoiceUri?: string;
}

interface CloudTtsVoice {
  language: string;
  code: string;
  name: string;
  label: string;
  gender: string;
}

const STORAGE_KEY = 'film_studio_voice_assignments_v1';

const LANG_TO_CODE: Record<SupportedVoiceLanguage, VoiceLanguageCode> = {
  Kannada: 'kn-IN',
  English: 'en-US',
  Hindi: 'hi-IN',
  Tamil: 'ta-IN',
  Telugu: 'te-IN',
};

const SAMPLE_LINES: Record<SupportedVoiceLanguage, Record<'Hero' | 'Heroine' | 'Default', string>> = {
  Kannada: {
    Hero: 'ನಾವು ಹಿಂದೆ ಸರಿಯುವುದಿಲ್ಲ! ಕಾಲದ ದ್ವಾರವನ್ನು ಇಂದೇ ತೆರೆಯುತ್ತೇವೆ.',
    Heroine: 'ಈ ನಕ್ಷತ್ರಗಳ ಬೆಳಕಿನಲ್ಲಿ ನಮ್ಮ ಕನಸುಗಳು ಜೀವಂತವಾಗಿವೆ.',
    Default: 'ಪ್ರೊಮೆಥಿಯಸ್ ಸ್ಟೇಷನ್, ಆಕಾಶಕಾಯದ ಸಂಕೇತ ದೃಢಪಟ್ಟಿದೆ.',
  },
  English: {
    Hero: 'We hold the line together. Open the Chronos gate now!',
    Heroine: 'Look at the horizon... every memory is still alive inside the light.',
    Default: 'Prometheus Station, telemetry resonance confirmed at Sector Four.',
  },
  Hindi: {
    Hero: 'हम पीछे नहीं हटेंगे! समय का द्वार आज ही खुलेगा।',
    Heroine: 'इन सितारों की रोशनी में हमारी उम्मीदें अभी भी जिंदा हैं।',
    Default: 'प्रोमेथियस स्टेशन, हमें मुख्य संकेत मिल गया है।',
  },
  Tamil: {
    Hero: 'நாம் பின்வாங்க மாட்டோம்! காலத்தின் கதவு இன்று திறக்கும்.',
    Heroine: 'இந்த நட்சத்திர ஒளியில் நம் நினைவுகள் உயிரோடு இருக்கின்றன.',
    Default: 'புரோமிதியஸ் நிலையம், சமிக்ஞை உறுதி செய்யப்பட்டது.',
  },
  Telugu: {
    Hero: 'మనం వెనక్కి తగ్గం! కాల ద్వారం ఈరోజే తెరుచుకుంటుంది.',
    Heroine: 'ఈ నక్షత్రాల వెలుగులో మన ఆశలు ఇంకా సజీవంగా ఉన్నాయి.',
    Default: 'ప్రొమెथియస్ స్టేషన్, సంకేతం నిర్ధారించబడింది.',
  },
};

const INITIAL_CHARACTER_CONFIGS: Record<string, CharacterVoiceConfig> = {
  Hero: {
    characterName: 'Hero',
    language: 'Kannada',
    gender: 'Male',
    style: 'Cinematic',
    age: 'Adult',
    emotion: 'Brave',
    speed: 1.0,
    pitchLevel: 'Normal',
    dialogueLine: SAMPLE_LINES.Kannada.Hero,
    cloudVoiceName: 'kn-IN-Wavenet-B',
  },
  Heroine: {
    characterName: 'Heroine',
    language: 'Kannada',
    gender: 'Female',
    style: 'Natural',
    age: 'Young',
    emotion: 'Romantic',
    speed: 1.0,
    pitchLevel: 'Normal',
    dialogueLine: SAMPLE_LINES.Kannada.Heroine,
    cloudVoiceName: 'kn-IN-Wavenet-A',
  },
  'Commander Valerie Chen': {
    characterName: 'Commander Valerie Chen',
    language: 'English',
    gender: 'Female',
    style: 'Cinematic',
    age: 'Adult',
    emotion: 'Brave',
    speed: 1.0,
    pitchLevel: 'Normal',
    dialogueLine: SAMPLE_LINES.English.Default,
    cloudVoiceName: 'en-US-Neural2-F',
  },
  'Dr. Huxley Vance': {
    characterName: 'Dr. Huxley Vance',
    language: 'English',
    gender: 'Male',
    style: 'Narrator',
    age: 'Elder',
    emotion: 'Fear',
    speed: 0.95,
    pitchLevel: 'Low',
    dialogueLine: 'Abort the breach sequence! The anomaly is drawing power from our core.',
    cloudVoiceName: 'en-US-Neural2-D',
  },
  'Story Narrator': {
    characterName: 'Story Narrator',
    language: 'Kannada',
    gender: 'Male',
    style: 'Narrator',
    age: 'Adult',
    emotion: 'Happy',
    speed: 0.95,
    pitchLevel: 'Low',
    dialogueLine: 'ಪ್ರಾಚೀನ ನಕ್ಷತ್ರಗಳ ನಡುವೆ ಹೊಸ ಅಧ್ಯಾಯ ಪ್ರಾರಂಭವಾಯಿತು.',
    cloudVoiceName: 'kn-IN-Standard-B',
  },
};

interface VoiceSelectionPanelProps {
  onGenerateDialogueClip: (params: {
    characterName: string;
    language: VoiceLanguageCode;
    languageLabel: SupportedVoiceLanguage;
    gender: VoiceGenderOption;
    style: VoiceStyleOption;
    age: VoiceAgeOption;
    emotion: VoiceEmotionOption;
    pitch: number;
    rate: number;
    text: string;
  }) => void;
  onSaveFavouriteVoice: (profile: SavedVoiceProfile) => void;
  onApplyVoiceToAllScenes: (config: CharacterVoiceConfig, numericPitch: number) => void;
  onSynchronizeVoiceWithVideo: () => void;
  selectedClip: AudioTimelineClip | null;
}

export const VoiceSelectionPanel: React.FC<VoiceSelectionPanelProps> = ({
  onGenerateDialogueClip,
  onSaveFavouriteVoice,
  onApplyVoiceToAllScenes,
  onSynchronizeVoiceWithVideo,
}) => {
  const [characterConfigs, setCharacterConfigs] = useState<Record<string, CharacterVoiceConfig>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return parsed;
        }
      }
    } catch (_) {}
    return INITIAL_CHARACTER_CONFIGS;
  });

  const [activeCharacter, setActiveCharacter] = useState<string>(() => {
    const keys = Object.keys(INITIAL_CHARACTER_CONFIGS);
    return keys[0] || 'Hero';
  });
  const [newCharName, setNewCharName] = useState('');
  const [showAddCharacter, setShowAddCharacter] = useState(false);

  const [deviceVoices, setDeviceVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [cloudVoices, setCloudVoices] = useState<CloudTtsVoice[]>([]);
  const [googleCloudReady, setGoogleCloudReady] = useState(false);

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isGeneratingServerAudio, setIsGeneratingServerAudio] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<{
    url: string;
    extension: string;
    provider: string;
    filename: string;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const characterKeys = Object.keys(characterConfigs);
  const safeActiveKey = characterConfigs[activeCharacter] ? activeCharacter : characterKeys[0];
  const current = characterConfigs[safeActiveKey] || INITIAL_CHARACTER_CONFIGS.Hero;

  // Load device SpeechSynthesis voices & server Cloud TTS catalog
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        setDeviceVoices(window.speechSynthesis.getVoices() || []);
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    fetch('/api/tts/voices')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.voices)) setCloudVoices(data.voices);
        setGoogleCloudReady(Boolean(data.googleCloudConfigured));
      })
      .catch(() => {});
  }, []);

  // Revoke object URL on change/unmount
  useEffect(() => {
    return () => {
      if (generatedAudio?.url) {
        URL.revokeObjectURL(generatedAudio.url);
      }
    };
  }, [generatedAudio]);

  const showTempStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage((curr) => (curr === msg ? null : curr)), 3500);
  };

  const updateCurrent = (updates: Partial<CharacterVoiceConfig>) => {
    setCharacterConfigs((prev) => {
      const next = {
        ...prev,
        [safeActiveKey]: {
          ...prev[safeActiveKey],
          ...updates,
        },
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  const handleSaveAssignments = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(characterConfigs));
      soundFx.playShutterSound();
      showTempStatus(`Saved voice assignments for ${characterKeys.length} character(s).`);
    } catch (_) {
      showTempStatus('Unable to save assignments to browser storage.');
    }
  };

  const handleAddCharacter = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCharName.trim();
    if (!clean || characterConfigs[clean]) return;

    const created: CharacterVoiceConfig = {
      characterName: clean,
      language: current.language,
      gender: current.gender,
      style: 'Natural',
      age: 'Adult',
      emotion: 'Happy',
      speed: 1.0,
      pitchLevel: 'Normal',
      dialogueLine: SAMPLE_LINES[current.language].Default,
      cloudVoiceName: current.cloudVoiceName,
    };

    const next = { ...characterConfigs, [clean]: created };
    setCharacterConfigs(next);
    setActiveCharacter(clean);
    setNewCharName('');
    setShowAddCharacter(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (_) {}
    soundFx.playScannerBeep();
    showTempStatus(`Added character "${clean}".`);
  };

  const handleRemoveCharacter = () => {
    if (characterKeys.length <= 1) return;
    const removedName = safeActiveKey;
    const next = { ...characterConfigs };
    delete next[removedName];
    const nextActive = Object.keys(next)[0];
    setCharacterConfigs(next);
    setActiveCharacter(nextActive);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (_) {}
    soundFx.playWhoosh();
    showTempStatus(`Removed character "${removedName}".`);
  };

  const computeNumericPitch = (cfg: CharacterVoiceConfig): number => {
    let base = cfg.gender === 'Male' ? 0.88 : 1.12;
    if (cfg.age === 'Child') base += 0.25;
    else if (cfg.age === 'Young') base += 0.06;
    else if (cfg.age === 'Elder') base -= 0.1;

    if (cfg.pitchLevel === 'Low') base -= 0.14;
    else if (cfg.pitchLevel === 'High') base += 0.16;

    return Math.max(0.55, Math.min(1.85, Number(base.toFixed(2))));
  };

  const handlePreviewVoice = () => {
    soundFx.unlock();
    const numPitch = computeNumericPitch(current);
    const code = LANG_TO_CODE[current.language];
    setIsPreviewing(true);
    soundFx.speakDialogue(current.dialogueLine, code, numPitch, current.speed, () => {
      setIsPreviewing(false);
    });
    showTempStatus(
      `Playing ${current.characterName}: ${current.language} · ${current.gender} · ${current.style}`
    );
  };

  const handleStopPreview = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPreviewing(false);
    showTempStatus('Stopped voice preview.');
  };

  const handleSaveFavourite = () => {
    const numPitch = computeNumericPitch(current);
    const code = LANG_TO_CODE[current.language];
    const profile: SavedVoiceProfile = {
      id: `vfav-${Date.now()}`,
      name: `${current.characterName} (${current.language} ${current.gender})`,
      characterRole: `${current.style} · ${current.age}`,
      gender: current.gender,
      language: code,
      languageLabel: current.language,
      voiceStyle: current.style,
      ageStyle: current.age,
      emotion: current.emotion,
      pitchLevel: current.pitchLevel,
      isFavorite: true,
      accent: `${code} · ${current.language}`,
      tone: `${current.style}, ${current.emotion}`,
      pitch: numPitch,
      rate: current.speed,
      sampleText: current.dialogueLine,
      color: current.gender === 'Female' ? '#ec4899' : '#06b6d4',
    };
    onSaveFavouriteVoice(profile);
    soundFx.playShutterSound();
    showTempStatus(`Saved "${profile.name}" to Favourite Voices.`);
  };

  const handleGenerateDialogue = async () => {
    const numPitch = computeNumericPitch(current);
    const code = LANG_TO_CODE[current.language];
    setIsGeneratingServerAudio(true);

    // Insert clip into Audio Studio multitrack timeline immediately
    onGenerateDialogueClip({
      characterName: current.characterName,
      language: code,
      languageLabel: current.language,
      gender: current.gender,
      style: current.style,
      age: current.age,
      emotion: current.emotion,
      pitch: numPitch,
      rate: current.speed,
      text: current.dialogueLine,
    });

    // Also synthesize real MP3 (if Google Cloud TTS configured) or WAV on backend
    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: current.dialogueLine,
          languageCode: code,
          gender: current.gender,
          voiceName: current.cloudVoiceName,
          pitch: numPitch,
          speakingRate: current.speed,
          characterName: current.characterName,
        }),
      });
      const data = await res.json();
      if (data.success && data.audioBase64) {
        const binary = atob(data.audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: data.mimeType || 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setGeneratedAudio((prev) => {
          if (prev?.url) URL.revokeObjectURL(prev.url);
          return {
            url,
            extension: data.extension || 'wav',
            provider: data.provider || 'Studio Server PCM Engine',
            filename: `${current.characterName.replace(/\s+/g, '_')}_${current.language}.${data.extension || 'wav'}`,
          };
        });
        showTempStatus(`Generated ${data.extension?.toUpperCase()} via ${data.provider} & added to Track A1.`);
      }
    } catch (_) {
      showTempStatus(`Generated dialogue clip for ${current.characterName}.`);
    } finally {
      setIsGeneratingServerAudio(false);
    }
  };

  const handleDownloadAudio = () => {
    soundFx.unlock();
    if (generatedAudio) {
      const a = document.createElement('a');
      a.href = generatedAudio.url;
      a.download = generatedAudio.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      soundFx.playShutterSound();
      showTempStatus(`Downloaded ${generatedAudio.filename}.`);
      return;
    }

    showTempStatus('Click Generate Dialogue first to synthesize a real neural voice file before downloading.');
  };

  const matchingCloudVoices = cloudVoices.filter(
    (v) => v.code === LANG_TO_CODE[current.language]
  );
  const langPrefix = LANG_TO_CODE[current.language].split('-')[0];
  const matchingDeviceVoices = deviceVoices.filter((dv) =>
    dv.lang.toLowerCase().startsWith(langPrefix)
  );

  return (
    <div className="space-y-3.5">
      {/* Character Selector + Add / Remove / Save */}
      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5" />
            Character Voice Assignment
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowAddCharacter((v) => !v)}
              className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-purple-600 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-0.5"
              title="Add character"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
            <button
              type="button"
              disabled={characterKeys.length <= 1}
              onClick={handleRemoveCharacter}
              className="p-1 rounded bg-slate-900 hover:bg-rose-600/30 disabled:opacity-40 text-slate-400 hover:text-rose-300 border border-slate-700"
              title="Remove selected character"
            >
              <Trash2 className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={handleSaveAssignments}
              className="p-1 rounded bg-slate-900 hover:bg-emerald-600/30 text-emerald-400 border border-slate-700"
              title="Save voice assignments locally"
            >
              <Save className="w-3 h-3" />
            </button>
          </div>
        </div>

        {showAddCharacter && (
          <form onSubmit={handleAddCharacter} className="flex gap-1.5">
            <input
              type="text"
              value={newCharName}
              onChange={(e) => setNewCharName(e.target.value)}
              placeholder="New Character (e.g. Villain)"
              className="flex-1 bg-slate-900 border border-purple-500/50 rounded px-2 py-1 text-xs text-white outline-none"
              required
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded"
            >
              Create
            </button>
          </form>
        )}

        <select
          value={safeActiveKey}
          onChange={(e) => {
            setActiveCharacter(e.target.value);
            soundFx.playScannerBeep();
          }}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white outline-none focus:border-purple-500"
        >
          {characterKeys.map((charKey) => {
            const cfg = characterConfigs[charKey];
            return (
              <option key={charKey} value={charKey}>
                {cfg.characterName} ({cfg.language} · {cfg.gender} · {cfg.style})
              </option>
            );
          })}
        </select>

        {statusMessage && (
          <div className="text-[11px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded px-2 py-1">
            {statusMessage}
          </div>
        )}
      </div>

      {/* Voice Settings Matrix */}
      <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
        {/* Language */}
        <div className="space-y-1">
          <label className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span className="flex items-center gap-1.5">
              <Languages className="w-3 h-3 text-cyan-400" />
              <span>Language</span>
            </span>
            <span className="text-[9px] text-slate-500">
              {googleCloudReady ? 'Cloud TTS MP3 Active' : 'Studio PCM + Device TTS'}
            </span>
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(['Kannada', 'English', 'Hindi', 'Tamil', 'Telugu'] as SupportedVoiceLanguage[]).map(
              (lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    const roleKey =
                      safeActiveKey === 'Hero'
                        ? 'Hero'
                        : safeActiveKey === 'Heroine'
                        ? 'Heroine'
                        : 'Default';
                    updateCurrent({
                      language: lang,
                      dialogueLine: SAMPLE_LINES[lang][roleKey],
                    });
                  }}
                  className={`py-1 px-2 rounded text-[11px] font-mono border transition-colors ${
                    current.language === lang
                      ? 'bg-purple-600 text-white border-purple-500 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {lang}
                </button>
              )
            )}
          </div>
        </div>

        {/* Cloud / Device Voice Picker */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono text-slate-400 uppercase block">
            Voice Model ({matchingCloudVoices.length} Cloud · {matchingDeviceVoices.length} Device)
          </label>
          <select
            value={current.cloudVoiceName || matchingCloudVoices[0]?.name || ''}
            onChange={(e) => updateCurrent({ cloudVoiceName: e.target.value })}
            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-purple-500"
          >
            {matchingCloudVoices.map((cv) => (
              <option key={cv.name} value={cv.name}>
                {cv.label} ({cv.gender})
              </option>
            ))}
            {matchingDeviceVoices.map((dv) => (
              <option key={dv.voiceURI} value={dv.voiceURI}>
                Device: {dv.name} ({dv.lang})
              </option>
            ))}
            {matchingCloudVoices.length === 0 && matchingDeviceVoices.length === 0 && (
              <option value="studio-default">Studio Default Neural Synthesizer</option>
            )}
          </select>
        </div>

        {/* Voice Gender & Pitch Level */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-400 uppercase block">
              Voice Gender
            </label>
            <div className="flex gap-1">
              {(['Male', 'Female'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => updateCurrent({ gender: g })}
                  className={`flex-1 py-1 rounded text-[11px] font-mono border ${
                    current.gender === g
                      ? 'bg-cyan-600 text-white border-cyan-500 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-400 uppercase block">Pitch</label>
            <div className="flex gap-1">
              {(['Low', 'Normal', 'High'] as VoicePitchLevel[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => updateCurrent({ pitchLevel: p })}
                  className={`flex-1 py-1 rounded text-[10px] font-mono border ${
                    current.pitchLevel === p
                      ? 'bg-cyan-600 text-white border-cyan-500 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Voice Style & Age Style */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-400 uppercase block">
              Voice Style
            </label>
            <select
              value={current.style}
              onChange={(e) => updateCurrent({ style: e.target.value as VoiceStyleOption })}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500"
            >
              {(['Natural', 'Cinematic', 'Emotional', 'Narrator'] as VoiceStyleOption[]).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-400 uppercase block">
              Age Style
            </label>
            <select
              value={current.age}
              onChange={(e) => updateCurrent({ age: e.target.value as VoiceAgeOption })}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500"
            >
              {(['Child', 'Young', 'Adult', 'Elder'] as VoiceAgeOption[]).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Emotion */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono text-slate-400 uppercase block">Emotion</label>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              ['Happy', 'Sad', 'Angry', 'Fear', 'Romantic', 'Brave'] as VoiceEmotionOption[]
            ).map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => updateCurrent({ emotion: em })}
                className={`py-1 rounded text-[11px] font-mono border transition-colors ${
                  current.emotion === em
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        {/* Speed Slider 0.5x - 2.0x */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>SPEED</span>
            <span className="text-cyan-400 font-bold">{current.speed.toFixed(2)}×</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={current.speed}
            onChange={(e) => updateCurrent({ speed: parseFloat(e.target.value) })}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>

        {/* Dialogue Line */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono text-slate-400 uppercase block">
            Character Dialogue Script
          </label>
          <textarea
            rows={2}
            value={current.dialogueLine}
            onChange={(e) => updateCurrent({ dialogueLine: e.target.value })}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-purple-500 resize-none"
          />
        </div>

        {/* Play / Stop Preview + Save Favourite */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={isPreviewing ? handleStopPreview : handlePreviewVoice}
            className={`py-2 px-2.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 border transition-colors ${
              isPreviewing
                ? 'bg-rose-600 text-white border-rose-500'
                : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border-cyan-500/40'
            }`}
          >
            {isPreviewing ? (
              <Square className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isPreviewing ? 'Stop' : 'Preview Voice'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveFavourite}
            className="py-2 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold flex items-center justify-center gap-1.5"
          >
            <Star className="w-3.5 h-3.5" />
            <span>Save Favourite</span>
          </button>
        </div>

        <button
          type="button"
          disabled={isGeneratingServerAudio}
          onClick={handleGenerateDialogue}
          className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>
            {isGeneratingServerAudio
              ? 'Synthesizing Audio...'
              : 'Generate Dialogue & Add to Track'}
          </span>
        </button>

        {/* Inline Audio Playback Strip for Generated MP3 / WAV */}
        {generatedAudio && (
          <div className="p-2.5 rounded-lg bg-slate-900 border border-cyan-500/30 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300">
              <span className="flex items-center gap-1">
                <Volume2 className="w-3 h-3" />
                <span>{generatedAudio.provider}</span>
              </span>
              <span className="uppercase">.{generatedAudio.extension}</span>
            </div>
            <audio controls src={generatedAudio.url} className="w-full h-8" />
          </div>
        )}

        {/* Scene Batch & Video Sync & Download Controls */}
        <div className="grid grid-cols-1 gap-1.5 pt-1 border-t border-slate-800">
          <button
            type="button"
            onClick={() => {
              onApplyVoiceToAllScenes(current, computeNumericPitch(current));
              showTempStatus(`Applied ${current.characterName} voice across all scenes.`);
            }}
            className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-[11px] font-mono flex items-center justify-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Apply Voice to All Scenes</span>
          </button>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => {
                onSynchronizeVoiceWithVideo();
                showTempStatus('Synchronized voice clips with video scene timings.');
              }}
              className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-300 text-[11px] font-mono flex items-center justify-center gap-1"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Sync to Video</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadAudio}
              className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sky-300 text-[11px] font-mono flex items-center justify-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {generatedAudio ? generatedAudio.extension.toUpperCase() : 'WAV'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
