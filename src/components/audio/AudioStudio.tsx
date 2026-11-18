import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Music,
  Volume2,
  Mic,
  Square,
  Play,
  Pause,
  Activity,
  Sliders,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { FilmProject } from '../../types';
import { INITIAL_VOICES } from '../../data/initialData';
import { useStudioAi } from '../../context/StudioAiContext';
import { soundFx } from '../../utils/audioSynth';
import {
  AudioTrackRole,
  AudioTrackState,
  AudioTimelineClip,
  SavedVoiceProfile,
  SupportedVoiceLanguage,
  VoiceAgeOption,
  VoiceEmotionOption,
  VoiceGenderOption,
  VoiceLanguageCode,
  VoiceStyleOption,
} from './audioTypes';
import { MultitrackAudioTimeline } from './MultitrackAudioTimeline';
import { VoiceProfilesPanel } from './VoiceProfilesPanel';
import { CharacterVoiceConfig } from './VoiceSelectionPanel';
import { MusicSfxStudioPanel } from './MusicSfxStudioPanel';

interface AudioStudioProps {
  activeFilm: FilmProject;
}

const SEED_VOICE_PROFILES: SavedVoiceProfile[] = [
  {
    id: INITIAL_VOICES[0].id,
    name: INITIAL_VOICES[0].name,
    characterRole: 'Lead Protagonist',
    gender: INITIAL_VOICES[0].gender,
    language: 'en-US',
    accent: INITIAL_VOICES[0].accent,
    tone: INITIAL_VOICES[0].tone,
    pitch: 1.0,
    rate: 0.98,
    sampleText: INITIAL_VOICES[0].sampleText,
    color: '#38bdf8',
  },
  {
    id: INITIAL_VOICES[1].id,
    name: INITIAL_VOICES[1].name,
    characterRole: 'Co-Pilot / Synthetic AI',
    gender: INITIAL_VOICES[1].gender,
    language: 'en-US',
    accent: INITIAL_VOICES[1].accent,
    tone: INITIAL_VOICES[1].tone,
    pitch: 1.15,
    rate: 1.02,
    sampleText: INITIAL_VOICES[1].sampleText,
    color: '#06b6d4',
  },
  {
    id: INITIAL_VOICES[2].id,
    name: INITIAL_VOICES[2].name,
    characterRole: 'Mission Director',
    gender: INITIAL_VOICES[2].gender,
    language: 'en-US',
    accent: INITIAL_VOICES[2].accent,
    tone: INITIAL_VOICES[2].tone,
    pitch: 0.85,
    rate: 0.94,
    sampleText: INITIAL_VOICES[2].sampleText,
    color: '#8b5cf6',
  },
  {
    id: INITIAL_VOICES[3].id,
    name: INITIAL_VOICES[3].name,
    characterRole: 'Trailer Narrator',
    gender: INITIAL_VOICES[3].gender,
    language: 'en-US',
    accent: INITIAL_VOICES[3].accent,
    tone: INITIAL_VOICES[3].tone,
    pitch: 0.78,
    rate: 0.9,
    sampleText: INITIAL_VOICES[3].sampleText,
    color: '#f59e0b',
  },
  {
    id: 'voice-kannada-ananya',
    name: 'Ananya K. (Kannada Dramatic)',
    characterRole: 'Kannada Lead & Narration',
    gender: 'Female',
    language: 'kn-IN',
    accent: 'Bengaluru Studio Standard',
    tone: 'Expressive, Warm, Cinematic',
    pitch: 1.02,
    rate: 0.96,
    sampleText: 'ನಕ್ಷತ್ರಗಳ ನಡುವೆ ಒಂದು ಹೊಸ ಲೋಕ ನಮ್ಮನ್ನು ಕರೆಯುತ್ತಿದೆ.',
    color: '#10b981',
  },
];

const INITIAL_CLIPS: AudioTimelineClip[] = [
  {
    id: 'aclip-seed-1',
    trackRole: 'voice',
    name: 'Valerie Opening Comms',
    startSec: 1.0,
    durationSec: 5.5,
    color: '#38bdf8',
    dialogueText: 'Prometheus Station, do you copy? Telemetry shows resonance at the monolith.',
    voiceProfileId: INITIAL_VOICES[0].id,
    voiceProfileName: INITIAL_VOICES[0].name,
    language: 'en-US',
    pitch: 1.0,
    rate: 0.98,
  },
  {
    id: 'aclip-seed-2',
    trackRole: 'music',
    name: 'Chronos Deep Space Score (Dm)',
    startSec: 0,
    durationSec: 18.0,
    color: '#a855f7',
    sourceAssetId: 'mus-orbital-synth',
  },
  {
    id: 'aclip-seed-3',
    trackRole: 'sfx',
    name: 'Gravity Sub-Boom Impact',
    startSec: 6.5,
    durationSec: 3.5,
    color: '#f59e0b',
    soundMethod: 'playCinematicImpact',
  },
  {
    id: 'aclip-seed-4',
    trackRole: 'foley',
    name: 'EVA Suit Boot Grating',
    startSec: 2.5,
    durationSec: 3.0,
    color: '#4ade80',
    soundMethod: 'playShutterSound',
  },
];

export const AudioStudio: React.FC<AudioStudioProps> = ({ activeFilm }) => {
  const [tracks, setTracks] = useState<AudioTrackState[]>([
    {
      id: 'trk-1',
      role: 'voice',
      name: '01 Dialogue / Voice',
      volume: 85,
      pan: 0,
      isMuted: false,
      isSolo: false,
      color: '#38bdf8',
    },
    {
      id: 'trk-2',
      role: 'music',
      name: '02 Film Score / Music',
      volume: 65,
      pan: 0,
      isMuted: false,
      isSolo: false,
      color: '#a855f7',
    },
    {
      id: 'trk-3',
      role: 'sfx',
      name: '03 Sound FX (SFX)',
      volume: 78,
      pan: 12,
      isMuted: false,
      isSolo: false,
      color: '#f59e0b',
    },
    {
      id: 'trk-4',
      role: 'foley',
      name: '04 Foley & Ambience',
      volume: 68,
      pan: -12,
      isMuted: false,
      isSolo: false,
      color: '#4ade80',
    },
  ]);

  const { audioClips: clips, setAudioClips: setClips, voiceProfiles, addVoiceProfile } = useStudioAi();
  const [selectedClipId, setSelectedClipId] = useState<string | null>(() => clips[0]?.id || null);

  const [masterVolume, setMasterVolume] = useState(85);
  const [noiseReductionEnabled, setNoiseReductionEnabled] = useState(true);
  const [isSyncingDialogue, setIsSyncingDialogue] = useState(false);
  const [isPlayingMasterBus, setIsPlayingMasterBus] = useState(false);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState(false);
  const [playheadSec, setPlayheadSec] = useState(0);

  const [isRecordingVo, setIsRecordingVo] = useState(false);
  const [voDuration, setVoDuration] = useState(0);
  const [studioNotice, setStudioNotice] = useState<string | null>(null);

  const [aiMood, setAiMood] = useState('Epic and suspenseful deep space atmosphere');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [audioCues, setAudioCues] = useState([
    { timecode: '00:00:02', track: 'Ambience', cue: 'Low frequency 55Hz subterranean rumble' },
    { timecode: '00:00:14', track: 'Foley', cue: 'Magnetic boot steps on resonant steel grating' },
    { timecode: '00:00:26', track: 'SFX', cue: 'Electro-static ionization crackle near obelisk' },
    { timecode: '00:00:42', track: 'Score', cue: 'D minor crescendo with French horn & deep cellos' },
  ]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const triggeredClipsRef = useRef<Set<string>>(new Set());

  const showNotice = useCallback((msg: string) => {
    setStudioNotice(msg);
  }, []);

  useEffect(() => {
    if (!studioNotice) return;
    const t = setTimeout(() => setStudioNotice(null), 3500);
    return () => clearTimeout(t);
  }, [studioNotice]);

  // DAW Mute / Solo / Master Summing Gain Calculation
  const getEffectiveGain = useCallback(
    (track: AudioTrackState): number => {
      const anySolo = tracks.some((t) => t.isSolo);
      const isAudible = anySolo ? track.isSolo : !track.isMuted;
      if (!isAudible) return 0;
      return (track.volume / 100) * (masterVolume / 100);
    },
    [tracks, masterVolume]
  );

  // Sync live mixer sliders (Volume, Pan, Mute, Solo, Master) to real-time Web Audio playback
  useEffect(() => {
    const musicTrack = tracks.find((t) => t.role === 'music');
    if (!musicTrack) return;

    const musicGain = getEffectiveGain(musicTrack);
    const hasMusicUnderPlayhead = clips.some(
      (c) =>
        c.trackRole === 'music' &&
        playheadSec >= c.startSec &&
        playheadSec <= c.startSec + c.durationSec
    );

    if (isPlayingMasterBus || (isPlayingTimeline && hasMusicUnderPlayhead)) {
      if (soundFx.isScorePlaying()) {
        soundFx.setLiveScoreGain(musicGain * 0.75);
        soundFx.setLiveScorePan(musicTrack.pan);
      } else if (musicGain > 0.001) {
        soundFx.startScorePlayback(musicGain * 0.75, musicTrack.pan);
      }
    } else if (soundFx.isScorePlaying()) {
      soundFx.stopScorePlayback();
    }
  }, [tracks, masterVolume, isPlayingMasterBus, isPlayingTimeline, playheadSec, clips, getEffectiveGain]);

  // Cleanup score audio on unmount
  useEffect(() => {
    return () => {
      soundFx.stopScorePlayback();
    };
  }, []);

  // Audition helper respecting track effective gain
  const auditionClip = useCallback(
    (clip: AudioTimelineClip) => {
      soundFx.unlock();
      const track = tracks.find((t) => t.role === clip.trackRole);
      const effective = track ? getEffectiveGain(track) : 0.8;
      if (effective <= 0.001) {
        showNotice(`Track "${track?.name || clip.trackRole}" is currently muted or excluded by Solo.`);
        return;
      }

      if (clip.trackRole === 'voice' && clip.dialogueText) {
        soundFx.speakDialogue(
          clip.dialogueText,
          clip.language || 'en-US',
          clip.pitch || 1.0,
          clip.rate || 1.0
        );
      } else if (clip.soundMethod && typeof (soundFx as any)[clip.soundMethod] === 'function') {
        (soundFx as any)[clip.soundMethod]();
      } else {
        soundFx.playTrackAudition(track?.name || clip.trackRole, effective * 100, track?.pan || 0);
      }
    },
    [tracks, getEffectiveGain, showNotice]
  );

  // Multitrack timeline playback loop
  useEffect(() => {
    if (!isPlayingTimeline) {
      triggeredClipsRef.current.clear();
      return;
    }

    const interval = setInterval(() => {
      setPlayheadSec((prev) => {
        const next = prev + 0.1;
        if (next >= 45) {
          setIsPlayingTimeline(false);
          return 0;
        }
        return Math.round(next * 10) / 10;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlayingTimeline]);

  // Trigger non-music clips as playhead passes their start points
  useEffect(() => {
    if (!isPlayingTimeline) return;

    clips.forEach((clip) => {
      if (clip.trackRole === 'music') return; // Handled continuously above
      const inStartWindow = playheadSec >= clip.startSec && playheadSec < clip.startSec + 0.35;
      if (inStartWindow && !triggeredClipsRef.current.has(clip.id)) {
        triggeredClipsRef.current.add(clip.id);
        const track = tracks.find((t) => t.role === clip.trackRole);
        const effective = track ? getEffectiveGain(track) : 0.8;
        if (effective > 0.001) {
          if (clip.trackRole === 'voice' && clip.dialogueText) {
            soundFx.speakDialogue(
              clip.dialogueText,
              clip.language || 'en-US',
              clip.pitch || 1.0,
              clip.rate || 1.0
            );
          } else if (clip.soundMethod && typeof (soundFx as any)[clip.soundMethod] === 'function') {
            (soundFx as any)[clip.soundMethod]();
          } else {
            soundFx.playTrackAudition(track?.name || clip.trackRole, effective * 100, track?.pan || 0);
          }
        }
      }
    });
  }, [playheadSec, isPlayingTimeline, clips, tracks, getEffectiveGain]);

  // Animated Audio Waveform Spectrum on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const draw = () => {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const numBars = 48;
      const barWidth = canvas.width / numBars - 2;
      const activeFactor = isPlayingMasterBus || isPlayingTimeline ? 1.0 : 0.42;

      for (let i = 0; i < numBars; i++) {
        const wave = Math.sin(phase + i * 0.22) * 0.5 + 0.5;
        const noise = Math.random() * 0.16;
        const barHeight = Math.max(
          4,
          (wave + noise) * (canvas.height * 0.82) * (masterVolume / 100) * activeFactor
        );

        const x = i * (barWidth + 2);
        const y = (canvas.height - barHeight) / 2;

        const hue = i < 28 ? 175 : i < 40 ? 265 : 340;
        ctx.fillStyle = `hsl(${hue}, 82%, 58%)`;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      phase += isPlayingMasterBus || isPlayingTimeline ? 0.14 : 0.05;
      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [masterVolume, isPlayingMasterBus, isPlayingTimeline]);

  // Voiceover Recording Timer
  useEffect(() => {
    let t: any;
    if (isRecordingVo) {
      t = setInterval(() => setVoDuration((d) => d + 1), 1000);
    } else {
      setVoDuration(0);
    }
    return () => clearInterval(t);
  }, [isRecordingVo]);

  const toggleVoRecord = async () => {
    soundFx.unlock();
    if (!isRecordingVo) {
      soundFx.playSlateBeep();
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        }
      } catch (err) {
        console.log('Mic fallback simulation:', err);
      }
      setIsRecordingVo(true);
    } else {
      soundFx.playShutterSound();
      const recordedSec = Math.max(2, voDuration || 3);
      setIsRecordingVo(false);
      const newClip: AudioTimelineClip = {
        id: `aclip-vo-${Date.now()}`,
        trackRole: 'voice',
        name: `Director VO Take (${recordedSec}s)`,
        startSec: Math.round(playheadSec * 2) / 2,
        durationSec: recordedSec,
        color: '#38bdf8',
        dialogueText: 'Studio booth voiceover take synced to timeline.',
        voiceProfileId: voiceProfiles[0]?.id,
        voiceProfileName: voiceProfiles[0]?.name || 'Studio Mic',
        language: 'en-US',
        pitch: 1.0,
        rate: 1.0,
      };
      setClips((prev) => [...prev, newClip]);
      setSelectedClipId(newClip.id);
      showNotice(`Recorded ${recordedSec}s Voiceover added to A1 Dialogue track.`);
    }
  };

  const handleAiSoundtrack = async () => {
    setIsAiLoading(true);
    soundFx.playScannerBeep();
    const localFallbackCues = [
      { timecode: '00:00:02', track: 'Ambience', cue: `Sub-bass drone calibrated for mood: ${aiMood}` },
      { timecode: '00:00:14', track: 'Foley', cue: 'Crisp EVA suit footsteps on basalt floor with plate reverb' },
      { timecode: '00:00:28', track: 'SFX', cue: 'Electromagnetic arc pulse and telemetry chime' },
      { timecode: '00:00:45', track: 'Score', cue: `D minor orchestral swell matching "${activeFilm.title}"` },
    ];
    try {
      const res = await fetch('/api/ai/soundtrack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: aiMood,
          sceneDescription: activeFilm.tagline,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.cues && Array.isArray(data.cues) && data.cues.length > 0) {
        setAudioCues(data.cues);
        soundFx.playCinematicImpact();
        showNotice(`Generated ${data.cues.length} AI soundscape cues.`);
      } else {
        setAudioCues(localFallbackCues);
        soundFx.playCinematicImpact();
        showNotice('Generated studio cue sheet from local composer profile.');
      }
    } catch (_) {
      setAudioCues(localFallbackCues);
      soundFx.playCinematicImpact();
      showNotice('Generated local studio cue sheet (offline composer mode).');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAssignVoiceToClip = (clipId: string, profile: SavedVoiceProfile) => {
    setClips((prev) =>
      prev.map((c) =>
        c.id === clipId
          ? {
              ...c,
              voiceProfileId: profile.id,
              voiceProfileName: profile.name,
              language: profile.language,
              pitch: profile.pitch,
              rate: profile.rate,
              dialogueText: c.dialogueText || profile.sampleText,
            }
          : c
      )
    );
    const targetClip = clips.find((c) => c.id === clipId);
    soundFx.speakDialogue(
      targetClip?.dialogueText || profile.sampleText,
      profile.language,
      profile.pitch,
      profile.rate
    );
    showNotice(`Assigned voice "${profile.name}" to clip.`);
  };

  const handleGenerateTtsClip = ({
    profile,
    text,
    language,
  }: {
    profile: SavedVoiceProfile;
    text: string;
    language: VoiceLanguageCode;
  }) => {
    soundFx.speakDialogue(text, language, profile.pitch, profile.rate);

    const voiceClips = clips.filter((c) => c.trackRole === 'voice');
    const nextStart = voiceClips.reduce(
      (max, c) => Math.max(max, c.startSec + c.durationSec + 0.5),
      0
    );
    const estDuration = Math.min(10, Math.max(2.5, Math.round((text.split(/\s+/).length * 0.45) * 10) / 10));

    const newClip: AudioTimelineClip = {
      id: `aclip-tts-${Date.now()}`,
      trackRole: 'voice',
      name: `${profile.name.split(' ')[0]}: "${text.slice(0, 22)}${text.length > 22 ? '…' : ''}"`,
      startSec: Math.min(38, nextStart),
      durationSec: estDuration,
      color: profile.color || '#38bdf8',
      dialogueText: text,
      voiceProfileId: profile.id,
      voiceProfileName: profile.name,
      language,
      pitch: profile.pitch,
      rate: profile.rate,
    };

    setClips((prev) => [...prev, newClip]);
    setSelectedClipId(newClip.id);
    showNotice(`Generated ${language} TTS dialogue clip.`);
  };

  const handleGenerateCharacterDialogueClip = ({
    characterName,
    language,
    languageLabel,
    gender,
    style,
    emotion,
    pitch,
    rate,
    text,
  }: {
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
  }) => {
    soundFx.speakDialogue(text, language, pitch, rate);
    const voiceClips = clips.filter((c) => c.trackRole === 'voice');
    const nextStart = voiceClips.reduce(
      (max, c) => Math.max(max, c.startSec + c.durationSec + 0.5),
      0
    );
    const estDuration = Math.min(10, Math.max(2.5, Math.round(text.split(/\s+/).length * 0.45 * 10) / 10));

    const newClip: AudioTimelineClip = {
      id: `aclip-char-${Date.now()}`,
      trackRole: 'voice',
      name: `${characterName} (${languageLabel})`,
      startSec: Math.min(38, nextStart),
      durationSec: estDuration,
      color: gender === 'Female' ? '#ec4899' : '#06b6d4',
      dialogueText: text,
      voiceProfileName: `${characterName} · ${languageLabel} ${gender} (${style}/${emotion})`,
      characterName,
      emotion,
      language,
      pitch,
      rate,
    };

    setClips((prev) => [...prev, newClip]);
    setSelectedClipId(newClip.id);
    showNotice(`Generated ${languageLabel} dialogue clip for ${characterName}.`);
  };

  const handleApplyVoiceToAllScenes = (cfg: CharacterVoiceConfig, numericPitch: number) => {
    const langMap: Record<SupportedVoiceLanguage, VoiceLanguageCode> = {
      Kannada: 'kn-IN',
      English: 'en-US',
      Hindi: 'hi-IN',
      Tamil: 'ta-IN',
      Telugu: 'te-IN',
    };
    const code = langMap[cfg.language];
    setClips((prev) => {
      const hasVoiceClips = prev.some((c) => c.trackRole === 'voice');
      if (!hasVoiceClips) {
        return [
          ...prev,
          {
            id: `aclip-scene1-${Date.now()}`,
            trackRole: 'voice',
            name: `Scene 1 · ${cfg.characterName}`,
            startSec: 0.5,
            durationSec: 4.5,
            color: cfg.gender === 'Female' ? '#ec4899' : '#06b6d4',
            dialogueText: cfg.dialogueLine,
            voiceProfileName: `${cfg.characterName} · ${cfg.language} ${cfg.gender}`,
            characterName: cfg.characterName,
            emotion: cfg.emotion,
            language: code,
            pitch: numericPitch,
            rate: cfg.speed,
            syncedToVideo: true,
          },
        ];
      }
      return prev.map((c) =>
        c.trackRole === 'voice'
          ? {
              ...c,
              voiceProfileName: `${cfg.characterName} · ${cfg.language} ${cfg.gender}`,
              characterName: cfg.characterName,
              emotion: cfg.emotion,
              language: code,
              pitch: numericPitch,
              rate: cfg.speed,
            }
          : c
      );
    });
    soundFx.playCinematicImpact();
    showNotice(`Applied ${cfg.characterName} (${cfg.language}) voice across all dialogue scenes.`);
  };

  const handleSynchronizeVoiceWithVideo = () => {
    soundFx.playSlateBeep();
    setClips((prev) => {
      let cursor = 0.5;
      return prev.map((c) => {
        if (c.trackRole !== 'voice') return c;
        const aligned = { ...c, startSec: Number(cursor.toFixed(1)), syncedToVideo: true };
        cursor += Math.max(3.5, c.durationSec + 0.5);
        return aligned;
      });
    });
    setPlayheadSec(0);
    showNotice('Voice track aligned sequentially to video scene cut markers.');
  };

  const handleQuickAddSfxClip = (name: string, soundMethod: string, trackRole: 'sfx' | 'foley') => {
    const laneClips = clips.filter((c) => c.trackRole === trackRole);
    const nextStart = laneClips.reduce((max, c) => Math.max(max, c.startSec + c.durationSec + 0.5), 1);

    const newClip: AudioTimelineClip = {
      id: `aclip-sfx-${Date.now()}`,
      trackRole,
      name,
      startSec: Math.min(40, nextStart),
      durationSec: 2.5,
      color: trackRole === 'foley' ? '#4ade80' : '#f59e0b',
      soundMethod,
    };
    setClips((prev) => [...prev, newClip]);
    setSelectedClipId(newClip.id);
    showNotice(`Added "${name}" to ${trackRole.toUpperCase()} track.`);
  };

  const handleSyncDialogueFromScreenplay = async (mode: 'dialogue' | 'narration') => {
    setIsSyncingDialogue(true);
    soundFx.playScannerBeep();
    try {
      const res = await fetch('/api/ai/dialogue-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: activeFilm.title,
          language: activeFilm.language || 'English',
          mode,
          screenplay: activeFilm.tagline,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data.cues) && data.cues.length > 0) {
        const syncedClips: AudioTimelineClip[] = data.cues.map((cue: any, idx: number) => {
          const matchedProfile =
            voiceProfiles.find((p) =>
              cue.language === 'kn-IN' ? p.language === 'kn-IN' : p.name.toLowerCase().includes(String(cue.speaker).split(' ')[0].toLowerCase())
            ) || voiceProfiles[0];
          return {
            id: `aclip-sync-${Date.now()}-${idx}`,
            trackRole: 'voice',
            name: `${cue.speaker}: "${String(cue.text).slice(0, 20)}…"`,
            startSec: Number(cue.startSec) || idx * 5 + 1,
            durationSec: Number(cue.durationSec) || 4.5,
            color: cue.language === 'kn-IN' ? '#10b981' : '#38bdf8',
            dialogueText: cue.text,
            voiceProfileId: matchedProfile?.id,
            voiceProfileName: matchedProfile?.name || cue.speaker,
            language: cue.language || 'en-US',
            pitch: Number(cue.pitch) || matchedProfile?.pitch || 1.0,
            rate: Number(cue.rate) || matchedProfile?.rate || 0.98,
          };
        });
        setClips((prev) => [...prev, ...syncedClips]);
        setSelectedClipId(syncedClips[0].id);
        soundFx.speakDialogue(
          syncedClips[0].dialogueText || '',
          syncedClips[0].language || 'en-US',
          syncedClips[0].pitch || 1.0,
          syncedClips[0].rate || 1.0
        );
        showNotice(`Synced ${syncedClips.length} ${mode} cues to Voice track & auditioning first line.`);
      }
    } catch (_) {
      const isKn = String(activeFilm.language || '').toLowerCase().includes('kannada');
      const fallbackText = isKn
        ? 'ಪ್ರೊಮೆಥಿಯಸ್ ಸ್ಟೇಷನ್, ಆಕಾಶಕಾಯದ ಸಂಕೇತ ದೃಢಪಟ್ಟಿದೆ.'
        : 'Prometheus Station, telemetry anomaly confirmed.';
      const prof = voiceProfiles.find((p) => (isKn ? p.language === 'kn-IN' : p.language === 'en-US')) || voiceProfiles[0];
      const fallbackClip: AudioTimelineClip = {
        id: `aclip-sync-local-${Date.now()}`,
        trackRole: 'voice',
        name: `${prof?.name.split(' ')[0] || 'Valerie'} Script Cue`,
        startSec: 1.0,
        durationSec: 4.5,
        color: '#38bdf8',
        dialogueText: fallbackText,
        voiceProfileId: prof?.id,
        voiceProfileName: prof?.name || 'Studio Voice',
        language: isKn ? 'kn-IN' : 'en-US',
        pitch: prof?.pitch || 1.0,
        rate: prof?.rate || 1.0,
      };
      setClips((prev) => [...prev, fallbackClip]);
      setSelectedClipId(fallbackClip.id);
      soundFx.speakDialogue(fallbackText, fallbackClip.language, fallbackClip.pitch, fallbackClip.rate);
      showNotice('Synced local script dialogue cue to Voice track.');
    } finally {
      setIsSyncingDialogue(false);
    }
  };

  const selectedClip = clips.find((c) => c.id === selectedClipId) || null;
  const musicTrack = tracks.find((t) => t.role === 'music');

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 text-slate-100">
      {/* Top Banner: Master Output Spectrum & Voiceover Booth */}
      <div className="border-b border-slate-800 bg-slate-900/80 px-4 py-3 flex flex-col md:flex-row items-center gap-4 shrink-0">
        {/* Real-time Spectrum Visualizer */}
        <div className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-mono-cinema text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <Activity className="w-3.5 h-3.5" />
              MASTER BUS SPECTRUM · 96kHz / 24-bit
            </span>
            {studioNotice ? (
              <span className="text-emerald-300 font-mono text-[11px]">{studioNotice}</span>
            ) : (
              <span className="text-emerald-400 font-bold">
                MASTER: {masterVolume}% · {isPlayingMasterBus || isPlayingTimeline ? 'ACTIVE' : 'MONITOR'}
              </span>
            )}
          </div>

          <canvas ref={canvasRef} width={640} height={64} className="w-full h-14 rounded" />

          <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono-cinema mt-1">
            <span>20 Hz</span>
            <span>250 Hz</span>
            <span>1 kHz</span>
            <span>4 kHz</span>
            <span>12 kHz</span>
            <span>20 kHz</span>
          </div>
        </div>

        {/* Master Bus & Voiceover Controls */}
        <div className="w-full md:w-96 flex flex-col justify-between gap-2.5 bg-slate-950 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono-cinema text-slate-200 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-purple-400" />
              MASTER & VOICEOVER BOOTH
            </span>
            {isRecordingVo ? (
              <span className="text-xs text-rose-500 font-mono-cinema font-bold animate-pulse">
                REC {voDuration}s
              </span>
            ) : (
              <span className="text-[11px] text-slate-500 font-mono-cinema">Ready</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleVoRecord}
              className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                isRecordingVo
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isRecordingVo ? <Square className="w-3.5 h-3.5 fill-current" /> : <Mic className="w-3.5 h-3.5 text-rose-400" />}
              <span>{isRecordingVo ? 'Stop VO' : 'Record VO'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFx.unlock();
                if (isPlayingMasterBus) {
                  setIsPlayingMasterBus(false);
                } else {
                  const g = musicTrack ? getEffectiveGain(musicTrack) : masterVolume / 100;
                  soundFx.startScorePlayback(g * 0.75, musicTrack?.pan || 0);
                  setIsPlayingMasterBus(true);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow ${
                isPlayingMasterBus
                  ? 'bg-rose-600 text-white'
                  : 'bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white'
              }`}
              title="Toggle continuous score monitor through live mixer"
            >
              {isPlayingMasterBus ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlayingMasterBus ? 'Stop Bus' : 'Play Score Bus'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 uppercase font-mono-cinema shrink-0">
              Master Gain
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={masterVolume}
              onChange={(e) => setMasterVolume(parseInt(e.target.value, 10))}
              className="flex-1 accent-purple-500 cursor-pointer"
            />
            <span className="text-xs font-mono-cinema text-cyan-400 w-9 text-right font-bold">
              {masterVolume}%
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-slate-800/80 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => {
                setNoiseReductionEnabled((v) => !v);
                showNotice(!noiseReductionEnabled ? 'Spectral Noise Reduction ON (-42dB gate)' : 'Noise Reduction bypassed');
              }}
              className={`px-2 py-1 rounded border flex items-center gap-1 transition-colors ${
                noiseReductionEnabled
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              <span>De-Noise {noiseReductionEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              disabled={isSyncingDialogue}
              onClick={() => handleSyncDialogueFromScreenplay('dialogue')}
              className="px-2 py-1 rounded bg-purple-600/20 hover:bg-purple-600/35 text-purple-300 border border-purple-500/40 flex items-center gap-1 disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3" />
              <span>{isSyncingDialogue ? 'Syncing...' : 'Sync Script Voice'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace: Left Mixer + Multitrack Timeline | Right Voice Profiles Side-Panel */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-5 bg-[#07090e]">
          {/* Audio Mixer Panel */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono-cinema">
                  Real-Time Track Audio Mixer
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Volume, Pan & Mute/Solo switches drive live Web Audio bus gain
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {tracks.map((track) => {
                const effectiveGain = getEffectiveGain(track);
                const anySolo = tracks.some((t) => t.isSolo);
                const isDimmed = (anySolo && !track.isSolo) || track.isMuted;

                return (
                  <div
                    key={track.id}
                    className={`bg-slate-900/80 border rounded-xl p-3.5 flex flex-col justify-between space-y-3 transition-all ${
                      isDimmed ? 'border-slate-800/70 opacity-75' : 'border-slate-800'
                    }`}
                  >
                    {/* Track Header */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate" style={{ color: track.color }}>
                          {track.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          Out: {Math.round(effectiveGain * 100)}% {anySolo && track.isSolo ? '· SOLOED' : ''}
                        </div>
                      </div>
                      <Music className="w-3.5 h-3.5 shrink-0 opacity-60" style={{ color: track.color }} />
                    </div>

                    {/* Mute / Solo Toggle Switches */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setTracks((prev) =>
                            prev.map((t) => (t.id === track.id ? { ...t, isMuted: !t.isMuted } : t))
                          )
                        }
                        className={`flex-1 py-1 rounded-md text-[11px] font-mono font-bold border transition-colors ${
                          track.isMuted
                            ? 'bg-rose-600 text-white border-rose-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        MUTE
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setTracks((prev) =>
                            prev.map((t) => (t.id === track.id ? { ...t, isSolo: !t.isSolo } : t))
                          )
                        }
                        className={`flex-1 py-1 rounded-md text-[11px] font-mono font-bold border transition-colors ${
                          track.isSolo
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        SOLO
                      </button>
                    </div>

                    {/* Volume Slider + Live Level Meter Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>VOLUME</span>
                        <span className="text-slate-200 font-bold">{track.volume}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={track.volume}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setTracks((prev) =>
                            prev.map((t) => (t.id === track.id ? { ...t, volume: val } : t))
                          );
                        }}
                        className="w-full accent-purple-500 cursor-pointer"
                      />
                      <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full transition-all duration-100"
                          style={{
                            width: `${Math.round(effectiveGain * 100)}%`,
                            backgroundColor: isDimmed ? '#475569' : track.color,
                          }}
                        />
                      </div>
                    </div>

                    {/* Pan Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>PAN</span>
                        <span className="text-cyan-400">
                          {track.pan === 0
                            ? 'CENTER'
                            : track.pan < 0
                            ? `L${Math.abs(track.pan)}`
                            : `R${track.pan}`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={track.pan}
                        onChange={(e) => {
                          const p = parseInt(e.target.value, 10);
                          setTracks((prev) =>
                            prev.map((t) => (t.id === track.id ? { ...t, pan: p } : t))
                          );
                        }}
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                    </div>

                    {/* Track Audition Button */}
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.unlock();
                        if (effectiveGain <= 0.001) {
                          showNotice(`"${track.name}" is muted or excluded by Solo.`);
                          return;
                        }
                        soundFx.playTrackAudition(track.name, effectiveGain * 100, track.pan);
                      }}
                      className="w-full py-1.5 bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 hover:border-cyan-500/40 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Audition Stem</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Music Studio & Sound Effects Studio (Stable Audio + Unified Library) */}
          <MusicSfxStudioPanel />

          {/* Multitrack Audio Timeline */}
          <MultitrackAudioTimeline
            tracks={tracks}
            clips={clips}
            selectedClipId={selectedClipId}
            onSelectClip={setSelectedClipId}
            onAddClip={(newClip) => setClips((prev) => [...prev, newClip])}
            onMoveClip={(clipId, newStartSec, newRole?: AudioTrackRole) =>
              setClips((prev) =>
                prev.map((c) =>
                  c.id === clipId
                    ? { ...c, startSec: newStartSec, trackRole: newRole || c.trackRole }
                    : c
                )
              )
            }
            onDeleteClip={(clipId) => {
              setClips((prev) => prev.filter((c) => c.id !== clipId));
              if (selectedClipId === clipId) setSelectedClipId(null);
            }}
            playheadSec={playheadSec}
            isPlaying={isPlayingTimeline}
            onTogglePlay={() => {
              soundFx.unlock();
              setIsPlayingTimeline((v) => !v);
            }}
            onSeek={(sec) => {
              triggeredClipsRef.current.clear();
              setPlayheadSec(sec);
            }}
            getEffectiveGain={getEffectiveGain}
            onAuditionClip={auditionClip}
          />
        </div>

        {/* Right Side-Panel: Voice Selection, Profiles, Foley & AI Cue Sheet */}
        <VoiceProfilesPanel
          profiles={voiceProfiles}
          onAddProfile={(profile) => {
            addVoiceProfile(profile);
            showNotice(`Saved new voice profile "${profile.name}".`);
          }}
          selectedClip={selectedClip}
          onAssignVoiceToClip={handleAssignVoiceToClip}
          onGenerateTtsClip={handleGenerateTtsClip}
          onGenerateCharacterDialogueClip={handleGenerateCharacterDialogueClip}
          onApplyVoiceToAllScenes={handleApplyVoiceToAllScenes}
          onSynchronizeVoiceWithVideo={handleSynchronizeVoiceWithVideo}
          onQuickAddSfxClip={handleQuickAddSfxClip}
          aiMood={aiMood}
          onAiMoodChange={setAiMood}
          isAiLoading={isAiLoading}
          onGenerateAiSoundtrack={handleAiSoundtrack}
          audioCues={audioCues}
        />
      </div>
    </div>
  );
};
