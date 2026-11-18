export type AudioTrackRole = 'voice' | 'music' | 'sfx' | 'foley';

export type SupportedVoiceLanguage = 'Kannada' | 'English' | 'Hindi' | 'Tamil' | 'Telugu';
export type VoiceLanguageCode = 'kn-IN' | 'en-US' | 'hi-IN' | 'ta-IN' | 'te-IN';
export type VoiceGenderOption = 'Male' | 'Female' | 'Synthetic AI';
export type VoiceStyleOption = 'Natural' | 'Cinematic' | 'Emotional' | 'Narrator';
export type VoiceAgeOption = 'Child' | 'Young' | 'Adult' | 'Elder';
export type VoiceEmotionOption = 'Happy' | 'Sad' | 'Angry' | 'Fear' | 'Romantic' | 'Brave';
export type VoicePitchLevel = 'Low' | 'Normal' | 'High';

export interface AudioTrackState {
  id: string;
  role: AudioTrackRole;
  name: string;
  volume: number; // 0 to 100
  pan: number; // -50 to 50
  isMuted: boolean;
  isSolo: boolean;
  color: string;
}

export interface AudioTimelineClip {
  id: string;
  trackRole: AudioTrackRole;
  name: string;
  startSec: number;
  durationSec: number;
  color: string;
  sourceAssetId?: string;
  soundMethod?: string;
  dialogueText?: string;
  voiceProfileId?: string;
  voiceProfileName?: string;
  language?: string;
  pitch?: number;
  rate?: number;
  characterName?: string;
  emotion?: VoiceEmotionOption;
  syncedToVideo?: boolean;
}

export interface SavedVoiceProfile {
  id: string;
  name: string;
  characterRole: string;
  gender: VoiceGenderOption;
  language: VoiceLanguageCode;
  languageLabel?: SupportedVoiceLanguage;
  voiceStyle?: VoiceStyleOption;
  ageStyle?: VoiceAgeOption;
  emotion?: VoiceEmotionOption;
  pitchLevel?: VoicePitchLevel;
  isFavorite?: boolean;
  accent: string;
  tone: string;
  pitch: number;
  rate: number;
  sampleText: string;
  color: string;
}
