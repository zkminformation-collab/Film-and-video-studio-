import React, { useState } from 'react';
import {
  Mic,
  Volume2,
  Plus,
  Check,
  Sparkles,
  Zap,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Sliders,
  Star,
} from 'lucide-react';
import {
  AudioTimelineClip,
  SavedVoiceProfile,
  SupportedVoiceLanguage,
  VoiceAgeOption,
  VoiceEmotionOption,
  VoiceGenderOption,
  VoiceLanguageCode,
  VoiceStyleOption,
} from './audioTypes';
import { VoiceSelectionPanel, CharacterVoiceConfig } from './VoiceSelectionPanel';
import { soundFx } from '../../utils/audioSynth';

interface VoiceProfilesPanelProps {
  profiles: SavedVoiceProfile[];
  onAddProfile: (profile: SavedVoiceProfile) => void;
  selectedClip: AudioTimelineClip | null;
  onAssignVoiceToClip: (clipId: string, profile: SavedVoiceProfile) => void;
  onGenerateTtsClip: (params: {
    profile: SavedVoiceProfile;
    text: string;
    language: VoiceLanguageCode;
  }) => void;
  onGenerateCharacterDialogueClip: (params: {
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
  onApplyVoiceToAllScenes: (config: CharacterVoiceConfig, numericPitch: number) => void;
  onSynchronizeVoiceWithVideo: () => void;
  onQuickAddSfxClip: (name: string, soundMethod: string, trackRole: 'sfx' | 'foley') => void;
  aiMood: string;
  onAiMoodChange: (val: string) => void;
  isAiLoading: boolean;
  onGenerateAiSoundtrack: () => void;
  audioCues: Array<{ timecode: string; track: string; cue: string }>;
}

export const VoiceProfilesPanel: React.FC<VoiceProfilesPanelProps> = ({
  profiles,
  onAddProfile,
  selectedClip,
  onAssignVoiceToClip,
  onGenerateTtsClip,
  onGenerateCharacterDialogueClip,
  onApplyVoiceToAllScenes,
  onSynchronizeVoiceWithVideo,
  onQuickAddSfxClip,
  aiMood,
  onAiMoodChange,
  isAiLoading,
  onGenerateAiSoundtrack,
  audioCues,
}) => {
  const [activeTab, setActiveTab] = useState<'selection' | 'voices' | 'foley' | 'cues'>('selection');
  const [selectedProfileId, setSelectedProfileId] = useState<string>(profiles[0]?.id || '');
  const [ttsLanguage, setTtsLanguage] = useState<VoiceLanguageCode>('en-US');
  const [ttsText, setTtsText] = useState<string>(
    'Prometheus Station, do you copy? Atmospheric telemetry shows resonance at the monolith.'
  );
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Supporting Cast');
  const [newLanguage, setNewLanguage] = useState<VoiceLanguageCode>('kn-IN');
  const [newTone, setNewTone] = useState('Warm, Cinematic');
  const [newPitch, setNewPitch] = useState(1.0);
  const [newRate, setNewRate] = useState(1.0);

  const activeProfile = profiles.find((p) => p.id === selectedProfileId) || profiles[0];

  const handleTestVoice = (profile: SavedVoiceProfile, customText?: string) => {
    soundFx.unlock();
    soundFx.speakDialogue(
      customText || profile.sampleText,
      profile.language,
      profile.pitch,
      profile.rate
    );
  };

  const handleGenerateDialogue = () => {
    if (!activeProfile || !ttsText.trim()) return;
    onGenerateTtsClip({
      profile: activeProfile,
      text: ttsText.trim(),
      language: ttsLanguage,
    });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const created: SavedVoiceProfile = {
      id: `vprof-${Date.now()}`,
      name: newName.trim(),
      characterRole: newRole.trim() || 'Character Voice',
      gender: 'Female',
      language: newLanguage,
      accent: newLanguage,
      tone: newTone.trim() || 'Clear, Expressive',
      pitch: newPitch,
      rate: newRate,
      isFavorite: true,
      sampleText:
        newLanguage === 'kn-IN'
          ? 'ನಮಸ್ಕಾರ, ದೃಶ್ಯ ಒಂದು ಈಗ ಪ್ರಾರಂಭವಾಗುತ್ತಿದೆ.'
          : `Voice calibration active for ${newName.trim()}.`,
      color: newLanguage === 'kn-IN' ? '#06b6d4' : '#8b5cf6',
    };
    onAddProfile(created);
    setSelectedProfileId(created.id);
    setNewName('');
    setShowCreateForm(false);
    handleTestVoice(created);
  };

  return (
    <aside className="w-full lg:w-[410px] bg-slate-900/95 border-l border-slate-800 flex flex-col overflow-hidden shrink-0">
      {/* Side-Panel Tab Header */}
      <div className="p-2.5 border-b border-slate-800 bg-slate-950/80 grid grid-cols-4 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('selection')}
          className={`py-1.5 px-1.5 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-colors ${
            activeTab === 'selection'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sliders className="w-3 h-3" />
          <span>Voice Select</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('voices')}
          className={`py-1.5 px-1.5 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-colors ${
            activeTab === 'voices'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Mic className="w-3 h-3" />
          <span>Profiles</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('foley')}
          className={`py-1.5 px-1.5 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-colors ${
            activeTab === 'foley'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Zap className="w-3 h-3" />
          <span>Foley</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('cues')}
          className={`py-1.5 px-1.5 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-colors ${
            activeTab === 'cues'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>AI Cues</span>
        </button>
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {activeTab === 'selection' && (
          <VoiceSelectionPanel
            selectedClip={selectedClip}
            onGenerateDialogueClip={onGenerateCharacterDialogueClip}
            onSaveFavouriteVoice={onAddProfile}
            onApplyVoiceToAllScenes={onApplyVoiceToAllScenes}
            onSynchronizeVoiceWithVideo={onSynchronizeVoiceWithVideo}
          />
        )}

        {activeTab === 'voices' && (
          <>
            {/* Selected Clip Voice Assignment Inspector */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  Selected Clip Voice Target
                </span>
                {selectedClip && (
                  <span className="text-slate-500">
                    {selectedClip.startSec.toFixed(1)}s · {selectedClip.trackRole.toUpperCase()}
                  </span>
                )}
              </div>

              {selectedClip ? (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-white truncate">{selectedClip.name}</div>
                  <div className="text-[11px] text-slate-400">
                    Assigned Voice:{' '}
                    <span className="text-purple-300 font-semibold">
                      {selectedClip.voiceProfileName || 'Unassigned (click Assign below)'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Select a dialogue clip on the timeline to assign or swap its character voice profile.
                </p>
              )}
            </div>

            {/* AI TTS Dialogue Generator */}
            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono-cinema">
                  AI TTS Dialogue Engine
                </span>
                <select
                  value={ttsLanguage}
                  onChange={(e) => setTtsLanguage(e.target.value as VoiceLanguageCode)}
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[10px] font-mono text-cyan-300 outline-none"
                >
                  <option value="kn-IN">Kannada (kn-IN)</option>
                  <option value="en-US">English (en-US)</option>
                  <option value="hi-IN">Hindi (hi-IN)</option>
                  <option value="ta-IN">Tamil (ta-IN)</option>
                  <option value="te-IN">Telugu (te-IN)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">
                  ACTIVE VOICE PROFILE
                </label>
                <select
                  value={activeProfile?.id || ''}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedProfileId(id);
                    const found = profiles.find((p) => p.id === id);
                    if (found) setTtsLanguage(found.language);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.language})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">
                  DIALOGUE SCRIPT LINE
                </label>
                <textarea
                  rows={2}
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-purple-500 resize-none"
                  placeholder="Enter Kannada, English, Hindi, Tamil, or Telugu dialogue..."
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateDialogue}
                disabled={!activeProfile || !ttsText.trim()}
                className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate TTS & Add Dialogue Clip</span>
              </button>
            </div>

            {/* Saved Voice Profiles List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono-cinema">
                  Saved Voice Profiles ({profiles.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowCreateForm((v) => !v)}
                  className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Profile</span>
                  {showCreateForm ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {showCreateForm && (
                <form
                  onSubmit={handleSaveProfile}
                  className="p-3 rounded-xl bg-slate-950 border border-purple-500/40 space-y-2.5"
                >
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Character Voice Name (e.g. Hero Kannada)"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                    required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      placeholder="Character Role"
                      className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white outline-none"
                    />
                    <select
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value as VoiceLanguageCode)}
                      className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white outline-none"
                    >
                      <option value="kn-IN">Kannada (kn-IN)</option>
                      <option value="en-US">English (en-US)</option>
                      <option value="hi-IN">Hindi (hi-IN)</option>
                      <option value="ta-IN">Tamil (ta-IN)</option>
                      <option value="te-IN">Telugu (te-IN)</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    value={newTone}
                    onChange={(e) => setNewTone(e.target.value)}
                    placeholder="Tone (e.g. Deep, Cinematic)"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                    <label className="space-y-1">
                      <div className="flex justify-between">
                        <span>PITCH</span>
                        <span className="text-cyan-400">{newPitch.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.6"
                        max="1.6"
                        step="0.05"
                        value={newPitch}
                        onChange={(e) => setNewPitch(parseFloat(e.target.value))}
                        className="w-full accent-purple-500"
                      />
                    </label>
                    <label className="space-y-1">
                      <div className="flex justify-between">
                        <span>RATE</span>
                        <span className="text-cyan-400">{newRate.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.05"
                        value={newRate}
                        onChange={(e) => setNewRate(parseFloat(e.target.value))}
                        className="w-full accent-cyan-500"
                      />
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Save Voice Profile
                  </button>
                </form>
              )}

              <div className="space-y-2">
                {profiles.map((profile) => {
                  const isAssignedToSelected = selectedClip?.voiceProfileId === profile.id;
                  const isActiveGenerator = activeProfile?.id === profile.id;

                  return (
                    <div
                      key={profile.id}
                      onClick={() => {
                        setSelectedProfileId(profile.id);
                        setTtsLanguage(profile.language);
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                        isActiveGenerator
                          ? 'bg-slate-950 border-purple-500/60 shadow-md shadow-purple-950/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: profile.color }}
                            />
                            <span className="text-xs font-bold text-white truncate">
                              {profile.name}
                            </span>
                            {profile.isFavorite && (
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {profile.characterRole} · {profile.language} · Pitch {profile.pitch.toFixed(1)}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTestVoice(profile);
                            }}
                            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-mono text-cyan-300 flex items-center gap-1"
                            title="Audition voice"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>Test</span>
                          </button>

                          {selectedClip && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAssignVoiceToClip(selectedClip.id, profile);
                              }}
                              className={`px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 border transition-colors ${
                                isAssignedToSelected
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                                  : 'bg-purple-600 hover:bg-purple-500 text-white border-purple-500'
                              }`}
                              title="Assign voice profile to selected timeline clip"
                            >
                              {isAssignedToSelected && <Check className="w-3 h-3" />}
                              <span>{isAssignedToSelected ? 'Assigned' : 'Assign'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 italic">
                        "{profile.sampleText}"
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {activeTab === 'foley' && (
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono-cinema block">
              Foley & SFX Soundboard
            </span>
            <p className="text-[11px] text-slate-400">
              Trigger physical Web Audio synthesis or insert directly onto the multitrack timeline:
            </p>

            <div className="grid grid-cols-1 gap-2">
              {[
                {
                  label: 'Sub-Boom Impact',
                  desc: 'Low 35Hz cinematic drop',
                  color: 'text-amber-400',
                  method: 'playCinematicImpact',
                  role: 'sfx' as const,
                  trigger: () => soundFx.playCinematicImpact(),
                },
                {
                  label: '1kHz Studio Slate',
                  desc: 'Calibration sync tone',
                  color: 'text-sky-400',
                  method: 'playSlateBeep',
                  role: 'sfx' as const,
                  trigger: () => soundFx.playSlateBeep(),
                },
                {
                  label: 'Shutter Snap Foley',
                  desc: 'Mechanical camera click',
                  color: 'text-emerald-400',
                  method: 'playShutterSound',
                  role: 'foley' as const,
                  trigger: () => soundFx.playShutterSound(),
                },
                {
                  label: 'Atmospheric Whoosh',
                  desc: 'Bandpass noise sweep',
                  color: 'text-purple-400',
                  method: 'playWhoosh',
                  role: 'foley' as const,
                  trigger: () => soundFx.playWhoosh(),
                },
                {
                  label: 'Trailer Brass Braam',
                  desc: 'Low-brass sawtooth swell',
                  color: 'text-rose-400',
                  method: 'playTrailerBraam',
                  role: 'sfx' as const,
                  trigger: () => soundFx.playTrailerBraam(),
                },
              ].map((pad) => (
                <div
                  key={pad.label}
                  className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between gap-2"
                >
                  <button
                    type="button"
                    onClick={pad.trigger}
                    className="flex-1 text-left hover:opacity-90 active:scale-[0.99] transition-transform"
                  >
                    <div className={`text-xs font-bold ${pad.color}`}>{pad.label}</div>
                    <div className="text-[10px] text-slate-500">{pad.desc}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuickAddSfxClip(pad.label, pad.method, pad.role)}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-purple-600 text-[10px] font-mono text-slate-300 hover:text-white border border-slate-700"
                  >
                    + Track
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'cues' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <Sparkles className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono-cinema">
                AI Soundscape Designer
              </h3>
            </div>

            <textarea
              rows={2}
              value={aiMood}
              onChange={(e) => onAiMoodChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white outline-none focus:border-amber-500"
              placeholder="Describe scene mood..."
            />

            <button
              type="button"
              onClick={onGenerateAiSoundtrack}
              disabled={isAiLoading}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAiLoading ? 'Synthesizing Cues...' : 'Generate Cue Sheet'}</span>
            </button>

            <div className="space-y-2 pt-2">
              {audioCues.map((cue, idx) => (
                <div key={idx} className="p-2.5 bg-slate-950 border border-slate-800 rounded text-xs space-y-1">
                  <div className="flex items-center justify-between font-mono-cinema text-[10px]">
                    <span className="text-amber-400 font-bold">{cue.timecode}</span>
                    <span className="text-slate-400 uppercase">{cue.track}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-tight">{cue.cue}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
