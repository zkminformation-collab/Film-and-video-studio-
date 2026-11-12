import React, { useState } from 'react';
import { 
  Mic, 
  Volume2, 
  Sparkles, 
  Play, 
  Pause, 
  Sliders, 
  Download, 
  Layers,
  Radio,
  Share2
} from 'lucide-react';
import { AiVoicePreset, FilmProject } from '../../types';
import { INITIAL_VOICES } from '../../data/initialData';
import { soundFx } from '../../utils/audioSynth';

interface AiVoiceStudioProps {
  activeFilm: FilmProject;
}

export const AiVoiceStudio: React.FC<AiVoiceStudioProps> = ({ activeFilm }) => {
  const [voices, setVoices] = useState<AiVoicePreset[]>(INITIAL_VOICES);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('voice-valerie');
  const [scriptText, setScriptText] = useState('Prometheus Station, do you copy? Atmospheric seal is holding. We have visual confirmation of the anomaly.');
  const [emotion, setEmotion] = useState<'Dramatic' | 'Whisper' | 'Urgent' | 'Calm'>('Dramatic');
  const [pitch, setPitch] = useState<number>(1.0);
  const [speed, setSpeed] = useState<number>(1.0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const selectedVoice = voices.find((v) => v.id === selectedVoiceId) || voices[0];

  const handleSpeak = () => {
    setIsSpeaking(true);
    soundFx.speakDialogue(
      scriptText,
      selectedVoice.accent || 'en-US',
      pitch,
      emotion === 'Urgent' ? speed * 1.25 : speed,
      () => setIsSpeaking(false)
    );
  };

  const handleStop = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-950 text-slate-100">
      {/* Voice Models List (Left) */}
      <div className="w-full lg:w-80 border-r border-slate-800 bg-slate-900/90 p-4 overflow-y-auto space-y-4 shrink-0">
        <div className="border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-cyan-400 font-mono-cinema font-bold text-xs uppercase tracking-wider">
            <Radio className="w-4 h-4" />
            <span>Neural Voice Synthesizer</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Hollywood dialogue & narration models
          </p>
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
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-500/50 ring-1 ring-cyan-500/30'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono">{v.name}</span>
                  <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded font-mono">
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
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono-cinema">Active Voice Persona</span>
              <h2 className="text-lg font-bold text-white font-cinzel">{selectedVoice.name}</h2>
              <p className="text-xs text-cyan-400 font-mono">{selectedVoice.tone}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={isSpeaking ? handleStop : handleSpeak}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg ${
                  isSpeaking
                    ? 'bg-rose-600 text-white shadow-rose-600/30'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25'
                }`}
              >
                {isSpeaking ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                <span>{isSpeaking ? 'Stop Voice' : 'Synthesize Voice'}</span>
              </button>
            </div>
          </div>

          {/* Script Text Input */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono-cinema block">
              Dialogue Lines for Synthesis
            </span>
            <textarea
              rows={5}
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
                  min="0.6"
                  max="1.6"
                  step="0.05"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>

            {/* Direct insert to timeline button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  soundFx.playCinematicImpact();
                  alert(`Rendered neural audio "${selectedVoice.name}" and inserted directly into Audio Studio Track A1!`);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg text-xs font-medium"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Send to Audio Track A1</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
