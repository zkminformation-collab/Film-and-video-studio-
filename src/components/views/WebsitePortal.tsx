import React, { useEffect, useRef, useState } from 'react';
import {
  Clapperboard,
  Film,
  Mic2,
  Music,
  BookOpen,
  SlidersHorizontal,
  Image as ImageIcon,
  Download,
  FolderOpen,
  Play,
  Square,
  ArrowRight,
  Check,
  ShieldCheck,
  Volume2,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { FilmProject, StudioModule } from '../../types';
import { soundFx } from '../../utils/audioSynth';
import { useStudioAi } from '../../context/StudioAiContext';
import { useAuth, SubscriptionPlanName } from '../../context/AuthContext';

interface WebsitePortalProps {
  allFilms: FilmProject[];
  onOpenWorkstation: () => void;
  onOpenModule: (module: StudioModule) => void;
  onOpenAdmin: () => void;
}

const DEMO_SCRIPTS: Record<'English' | 'Kannada' | 'Hindi' | 'Tamil' | 'Telugu', string> = {
  English:
    'In a single workspace, transform your story brief into cinema footage, multilingual voiceovers, and master MP4 reels.',
  Kannada:
    'ಒಂದೇ ಸ್ಟುಡಿಯೋದಲ್ಲಿ ನಿಮ್ಮ ಕಥೆಯನ್ನು ಸಿನಿಮಾ ದೃಶ್ಯಗಳು, ಪಾತ್ರದ ಧ್ವನಿಗಳು ಮತ್ತು ಸಂಗೀತದೊಂದಿಗೆ ಜೀವಂತಗೊಳಿಸಿ.',
  Hindi:
    'एक ही स्टूडियो में अपनी कहानी को सिनेमाई वीडियो, बहुभाषी आवाज़ और बैकग्राउंड म्यूज़िक में बदलें।',
  Tamil:
    'ஒரே ஸ்டுடியோவில் உங்கள் கதையை சினிமா காட்சிகள் மற்றும் இயல்பான குரல் பதிவுகளாக மாற்றுங்கள்.',
  Telugu:
    'ఒకే స్టూడియోలో మీ కథను సినిమాటిక్ వీడియోలు మరియు బహుభాషా వాయిస్‌లుగా మార్చండి.',
};

const LANG_CODES: Record<keyof typeof DEMO_SCRIPTS, string> = {
  English: 'en-US',
  Kannada: 'kn-IN',
  Hindi: 'hi-IN',
  Tamil: 'ta-IN',
  Telugu: 'te-IN',
};

const STUDIO_MODULES_SHOWCASE: Array<{
  id: StudioModule;
  name: string;
  subtitle: string;
  tag: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'dashboard',
    name: 'Flows & Studio Dashboard',
    subtitle: 'View film projects, AI canvas workflows, cloud credits, and studio apps in one workspace.',
    tag: 'Projects & Flows',
    icon: Clapperboard,
  },
  {
    id: 'ai_wizard',
    name: 'AI Film Maker',
    subtitle: 'Turn a story brief into a screenplay, storyboard, scenes, and director-ready shots.',
    tag: 'Story to Film',
    icon: Sparkles,
  },
  {
    id: 'manhwa_studio',
    name: 'Manhwa Studio',
    subtitle: 'Paste a chapter link or upload panels to animate camera motion, dialogue, and narration.',
    tag: 'Image to Video',
    icon: BookOpen,
  },
  {
    id: 'ai_voice',
    name: 'Voice Studio',
    subtitle: 'Character voices, dubbing & narration across Kannada, English, Hindi, Tamil & Telugu.',
    tag: 'ElevenLabs & TTS',
    icon: Mic2,
  },
  {
    id: 'audio',
    name: 'Music Studio',
    subtitle: 'Compose orchestral background scores, foley impacts, and multi-track soundscapes.',
    tag: 'Audio & SFX',
    icon: Music,
  },
  {
    id: 'ai_video',
    name: 'AI Video Studio',
    subtitle: 'Text-to-video, image-to-video, character animation & 2D/3D scene rendering.',
    tag: 'Text & Image-to-Video',
    icon: Film,
  },
  {
    id: 'editor',
    name: 'Timeline Editor',
    subtitle: 'Precision multi-track timeline for V1/V2 video, A1/A2 dialogue/music, and subtitles.',
    tag: 'Multi-Track NLE',
    icon: SlidersHorizontal,
  },
  {
    id: 'ai_image',
    name: 'AI Image Studio',
    subtitle: 'Synthesize keyframe stills, character portraits, posters, and concept plates.',
    tag: 'Concept Stills',
    icon: ImageIcon,
  },
  {
    id: 'export',
    name: 'Export Studio',
    subtitle: 'Preview final cuts and export MP4 masters or publish to YouTube, Meta, and Blogger.',
    tag: 'MP4 & Publish',
    icon: Download,
  },
  {
    id: 'media',
    name: 'My Library',
    subtitle: 'Access cloud-synced personal uploads, saved AI voice stems, footage, and projects.',
    tag: 'Cloud Vault',
    icon: FolderOpen,
  },
  {
    id: 'settings',
    name: 'Account & Settings',
    subtitle: 'Manage studio preferences, active film specs, cloud storage & subscription usage.',
    tag: 'Preferences',
    icon: ShieldCheck,
  },
];

interface PortalPricingTier {
  id: 'Free' | 'Starter' | 'Creator' | 'Professional' | 'Enterprise';
  name: string;
  tagline: string;
  monthlyPriceInr: number;
  yearlyPriceInr: number;
  monthlyCredits: number;
  features: string[];
  highlighted?: boolean;
}

const DEFAULT_PORTAL_TIERS: PortalPricingTier[] = [
  {
    id: 'Free',
    name: 'Free',
    tagline: 'Limited AI credits to explore the platform.',
    monthlyPriceInr: 0,
    yearlyPriceInr: 0,
    monthlyCredits: 10000,
    features: ['Limited AI Voice & TTS credits', 'Up to 3 active film studio projects', '1080p web MP4 preview export'],
  },
  {
    id: 'Starter',
    name: 'Starter',
    tagline: 'Basic AI voice and video for solo creators.',
    monthlyPriceInr: 499,
    yearlyPriceInr: 4990,
    monthlyCredits: 30000,
    features: ['Manhwa chapter link & image-to-video', 'Commercial audio & MP3 downloads', 'Cloud-synced My Library assets'],
  },
  {
    id: 'Creator',
    name: 'Creator',
    tagline: 'More generation credits and full multimodal tools.',
    monthlyPriceInr: 1499,
    yearlyPriceInr: 14990,
    monthlyCredits: 100000,
    highlighted: true,
    features: ['ElevenLabs Multilingual v2 voice API', 'Multi-track Video & Audio Studio unlock', 'YouTube, Instagram, Facebook & Blogger tools'],
  },
  {
    id: 'Professional',
    name: 'Professional',
    tagline: 'Advanced film, VFX, and 4K video tools.',
    monthlyPriceInr: 4999,
    yearlyPriceInr: 49990,
    monthlyCredits: 500000,
    features: ['500k shared generation credits/mo', 'High-bitrate 4K MP4 & ProRes pipelines', 'Priority GPU queue reprocessing'],
  },
  {
    id: 'Enterprise',
    name: 'Enterprise',
    tagline: 'Custom usage, dedicated throughput & team features.',
    monthlyPriceInr: 14999,
    yearlyPriceInr: 149990,
    monthlyCredits: 2000000,
    features: ['2M monthly credits across workspaces', 'Executive Admin user & quota oversight', 'Dedicated API throughput allocation'],
  },
];

export const WebsitePortal: React.FC<WebsitePortalProps> = ({
  allFilms,
  onOpenWorkstation,
  onOpenModule,
  onOpenAdmin,
}) => {
  const { updateWalletPlan } = useStudioAi();
  const { firebaseUser, account, openAuthModal, updateUserPlan, isAdmin, usageLogs } = useAuth();

  const [demoLang, setDemoLang] = useState<keyof typeof DEMO_SCRIPTS>('English');
  const [demoGender, setDemoGender] = useState<'Female' | 'Male'>('Female');
  const [demoText, setDemoText] = useState(DEMO_SCRIPTS.English);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [voiceProviderLabel, setVoiceProviderLabel] = useState<string>('Studio Voice Engine');
  const [elevenLabsConfigured, setElevenLabsConfigured] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [planNotice, setPlanNotice] = useState<string | null>(null);
  const [portalPlans, setPortalPlans] = useState<PortalPricingTier[]>(DEFAULT_PORTAL_TIERS);
  const [portalBillingCycle, setPortalBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch('/api/elevenlabs/status')
      .then((r) => r.json())
      .then((d) => {
        if (typeof d?.configured === 'boolean') {
          setElevenLabsConfigured(d.configured);
        }
      })
      .catch(() => {});

    fetch('/api/payments/state')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.plans) && d.plans.length > 0) {
          setPortalPlans(d.plans);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handleLanguageSwitch = (lang: keyof typeof DEMO_SCRIPTS) => {
    setDemoLang(lang);
    setDemoText(DEMO_SCRIPTS[lang]);
  };

  const handleSynthesizeDemo = async () => {
    if (!demoText.trim()) return;
    soundFx.unlock();
    setIsGeneratingVoice(true);
    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: demoText,
          languageCode: LANG_CODES[demoLang],
          gender: demoGender,
          provider: elevenLabsConfigured ? 'elevenlabs' : 'auto',
          pitch: demoGender === 'Female' ? 1.06 : 0.92,
          speakingRate: 1.0,
        }),
      });
      const data = await res.json();
      if (data?.audioBase64) {
        const binary = atob(data.audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: data.mimeType || 'audio/wav' });
        const nextUrl = URL.createObjectURL(blob);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(nextUrl);
        setVoiceProviderLabel(data.provider || 'Studio Engine');

        if (audioRef.current) {
          audioRef.current.src = nextUrl;
          await audioRef.current.play();
          setIsPlayingVoice(true);
        }
      }
    } catch (e) {
      console.error('Demo synthesis error:', e);
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  const handleStopDemo = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlayingVoice(false);
  };

  const handleSelectPlan = async (tier: PortalPricingTier) => {
    soundFx.playScannerBeep();
    if (tier.id === 'Free' && firebaseUser) {
      await updateUserPlan('Free', tier.monthlyCredits);
      updateWalletPlan('Free', tier.monthlyCredits);
      setPlanNotice(`Updated active subscription to Free (${tier.monthlyCredits.toLocaleString()} credits).`);
      setTimeout(() => setPlanNotice(null), 4000);
      return;
    }
    onOpenModule('credit_wallet');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white text-neutral-950 selection:bg-neutral-900 selection:text-white">
      <audio
        ref={audioRef}
        onEnded={() => setIsPlayingVoice(false)}
        onPause={() => setIsPlayingVoice(false)}
        className="hidden"
      />

      {/* Crisp Editorial Sticky Navigation */}
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="/"
            aria-label="ZKMAP STUDIO Home"
            onClick={(e) => {
              e.preventDefault();
              soundFx.playScannerBeep();
              onOpenWorkstation();
            }}
            className="text-sm font-extrabold tracking-tight text-neutral-950 whitespace-nowrap shrink-0 flex items-center gap-2.5 cursor-pointer"
          >
            <img
              src="/images/zkmap-studio-logo.png"
              alt="ZKMAP STUDIO"
              className="h-9 w-auto rounded-lg object-contain border border-neutral-200 shadow-sm"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-xs sm:text-sm font-extrabold text-neutral-950">ZKMAP STUDIO</span>
              <span className="text-[10px] font-mono-cinema font-medium text-neutral-500">
                zkmapstudio.com
              </span>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-600">
            <button
              type="button"
              onClick={() => onOpenModule('dashboard')}
              className="hover:text-neutral-950 transition-colors whitespace-nowrap"
            >
              Flows & Dashboard
            </button>
            <a href="#studio-showcase" className="hover:text-neutral-950 transition-colors whitespace-nowrap">
              Studio Apps
            </a>
            <a href="#voice-synthesis" className="hover:text-neutral-950 transition-colors whitespace-nowrap">
              Voice & Dubbing
            </a>
            <a href="#pricing-plans" className="hover:text-neutral-950 transition-colors whitespace-nowrap">
              Pricing
            </a>
            <button
              type="button"
              onClick={onOpenAdmin}
              className="hover:text-neutral-950 transition-colors flex items-center gap-1 whitespace-nowrap"
            >
              <span>Admin{isAdmin ? '' : ' Portal'}</span>
            </button>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={openAuthModal}
              className="px-3.5 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-800 flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <UserCheck className="w-3.5 h-3.5 text-neutral-600" />
              <span>{account ? account.displayName.split(' ')[0] : 'Sign In'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFx.playScannerBeep();
                onOpenWorkstation();
              }}
              className="px-4 py-2 rounded-xl bg-neutral-950 hover:bg-black text-white text-xs font-semibold transition-colors whitespace-nowrap"
            >
              Open Flows App
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-6 py-12 md:py-16 space-y-20">
        {/* Hero Split: Editorial Copy + Interactive Live Voice Synthesis Box */}
        <section id="voice-synthesis" className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-6 space-y-6 pt-2">
            <div className="text-xs font-medium text-neutral-500">
              AI Film Maker · Manhwa Video · Neural Voice · Timeline Editor
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-neutral-950 leading-[1.06] [text-wrap:balance]">
              Direct complete films, voices, and sound in one studio.
            </h1>

            <p className="text-base text-neutral-600 leading-relaxed max-w-xl">
              Write stories from a single prompt, animate Manhwa chapters into camera-tracked scenes, generate natural multilingual dialogue and music, edit on a full multi-track timeline, and export mastered MP4 video.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onOpenModule('dashboard')}
                className="px-5 py-3 rounded-xl bg-neutral-950 hover:bg-black text-white text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <span>Open Creative Flows</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onOpenModule('manhwa_studio')}
                className="px-5 py-3 rounded-xl border border-neutral-200 bg-[#FAFAFB] hover:bg-neutral-100 text-neutral-900 text-xs font-semibold transition-colors"
              >
                Manhwa Studio
              </button>

              <button
                type="button"
                onClick={() => onOpenModule('editor')}
                className="px-5 py-3 rounded-xl border border-neutral-200 hover:border-neutral-400 text-neutral-700 hover:text-neutral-950 text-xs font-medium transition-colors"
              >
                Timeline Editor
              </button>
            </div>

            {/* Clean Visual Studio Frame */}
            <div className="rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100 aspect-video relative">
              <img
                src="/src/assets/images/hero_studio_suite_1794901010340.jpg"
                alt="Film & Video Studio color grading and AI audio workstation"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between text-xs text-white">
                <span className="font-medium">Unified 21-Module Production Pipeline</span>
                <span className="font-mono-cinema text-neutral-300">4K DCI · MP4 / MP3</span>
              </div>
            </div>
          </div>

          {/* Right: ElevenLabs-style Interactive Live Voice Synthesizer Box */}
          <div className="lg:col-span-6 bg-[#FAFAFB] border border-neutral-200 rounded-2xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
              <div>
                <h2 className="text-sm font-semibold text-neutral-950">Interactive Voice & Narration Preview</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Test live dialogue synthesis ({elevenLabsConfigured ? 'ElevenLabs Multilingual v2 Ready' : 'Studio Voice Engine Ready'})
                </p>
              </div>
              <Volume2 className="w-4 h-4 text-neutral-500" />
            </div>

            {/* Language tabs */}
            <div className="grid grid-cols-5 gap-1 bg-neutral-200/70 p-1 rounded-xl">
              {(Object.keys(DEMO_SCRIPTS) as Array<keyof typeof DEMO_SCRIPTS>).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleLanguageSwitch(lang)}
                  className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    demoLang === lang
                      ? 'bg-white text-neutral-950 shadow-sm font-semibold'
                      : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Character Voice Gender */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-neutral-600 font-medium">Character Persona</span>
              <div className="flex items-center gap-1 bg-neutral-200/70 p-1 rounded-xl">
                {(['Female', 'Male'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setDemoGender(g)}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                      demoGender === g ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-600 hover:text-neutral-950'
                    }`}
                  >
                    {g === 'Female' ? 'Rachel / Ananya' : 'Adam / Vikram'}
                  </button>
                ))}
              </div>
            </div>

            {/* Dialogue Input */}
            <textarea
              rows={5}
              value={demoText}
              onChange={(e) => setDemoText(e.target.value)}
              className="w-full bg-white border border-neutral-200 rounded-xl p-4 text-sm text-neutral-950 leading-relaxed outline-none focus:border-neutral-500 resize-none"
              placeholder="Type dialogue or narration in Kannada, English, Hindi, Tamil, or Telugu..."
            />

            {/* Controls Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="text-xs font-mono-cinema text-neutral-500">
                Engine: <span className="text-neutral-900 font-medium">{voiceProviderLabel}</span>
              </div>

              <div className="flex items-center gap-2">
                {isPlayingVoice ? (
                  <button
                    type="button"
                    onClick={handleStopDemo}
                    className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop Audio</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isGeneratingVoice}
                    onClick={() => void handleSynthesizeDemo()}
                    className="px-5 py-2.5 rounded-xl bg-neutral-950 hover:bg-black text-white text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-60"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isGeneratingVoice ? 'Synthesizing...' : 'Generate & Play Voice'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onOpenModule('ai_voice')}
                  className="px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 text-xs font-semibold text-neutral-900 transition-colors"
                >
                  Full Voice Studio &rarr;
                </button>
              </div>
            </div>

            {/* Cloud Account Quota Summary Bar */}
            <div className="border-t border-neutral-200 pt-4 flex items-center justify-between text-xs">
              {account ? (
                <>
                  <div className="text-neutral-600">
                    Signed in as <span className="text-neutral-950 font-semibold">{account.displayName}</span> · {account.plan}
                  </div>
                  <div className="font-mono-cinema text-emerald-700 font-semibold">
                    {account.creditsRemaining.toLocaleString()} credits left
                  </div>
                </>
              ) : (
                <>
                  <span className="text-neutral-500">Sign in to claim 10,000 monthly studio credits & cloud vault</span>
                  <button
                    type="button"
                    onClick={openAuthModal}
                    className="text-neutral-950 font-semibold hover:underline"
                  >
                    Register / Sign In &rarr;
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Featured Capabilities Split Cards (Bento) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div
            onClick={() => onOpenModule('ai_voice')}
            className="group rounded-2xl border border-neutral-200 bg-[#FAFAFB] overflow-hidden cursor-pointer hover:border-neutral-400 transition-colors flex flex-col"
          >
            <div className="aspect-[16/9] bg-neutral-100 overflow-hidden">
              <img
                src="/src/assets/images/feature_voice_dubbing_1794901010817.jpg"
                alt="Multilingual voice booth and vocal dubbing suite"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
              />
            </div>
            <div className="p-6 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-[11px] font-medium text-neutral-500">
                  ElevenLabs & Multilingual ADR
                </div>
                <h3 className="text-lg font-semibold text-neutral-950">Character Voices & Dubbing Booth</h3>
                <p className="text-xs text-neutral-600">
                  Perform character dialogue in Kannada, English, Hindi, Tamil, and Telugu with studio emotion control.
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-950 shrink-0" />
            </div>
          </div>

          <div
            onClick={() => onOpenModule('editor')}
            className="group rounded-2xl border border-neutral-200 bg-[#FAFAFB] overflow-hidden cursor-pointer hover:border-neutral-400 transition-colors flex flex-col"
          >
            <div className="aspect-[16/9] bg-neutral-100 overflow-hidden">
              <img
                src="/src/assets/images/feature_film_timeline_1794901011133.jpg"
                alt="Multi-track timeline video editor and 4K export room"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
              />
            </div>
            <div className="p-6 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-[11px] font-medium text-neutral-500">
                  Timeline & 4K Master Export
                </div>
                <h3 className="text-lg font-semibold text-neutral-950">Non-Linear Editor & Finishing</h3>
                <p className="text-xs text-neutral-600">
                  Assemble scenes, sync dialogue & music stems, grade color LUTs, and render downloadable MP4 files.
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-950 shrink-0" />
            </div>
          </div>
        </section>

        {/* All Connected Studio Workspaces */}
        <section id="studio-showcase" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200 pb-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">
                One Creative Platform. Every Studio Connected.
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Click any module below to open that studio directly with your active film project.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenWorkstation}
              className="text-xs font-semibold text-neutral-900 hover:underline flex items-center gap-1"
            >
              <span>Launch Flows Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {STUDIO_MODULES_SHOWCASE.map((mod) => {
              const Icon = mod.icon;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => {
                    soundFx.playScannerBeep();
                    onOpenModule(mod.id);
                  }}
                  className="text-left p-5 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-400 hover:bg-[#FAFAFB] transition-all flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-900">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-medium text-neutral-500">
                        {mod.tag}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-neutral-950">
                      {mod.name}
                    </h3>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {mod.subtitle}
                    </p>
                  </div>

                  <span className="text-xs font-semibold text-neutral-700 group-hover:text-neutral-950 flex items-center gap-1.5">
                    <span>Open {mod.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Pricing Tiers (Shared Credit Pool) */}
        <section id="pricing-plans" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200 pb-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">
                Transparent Studio Plans &amp; Razorpay Billing
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                One shared credit pool across AI Voice, Film Maker, Manhwa animation, and Music Studio.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="inline-flex items-center p-1 rounded-xl bg-neutral-100 border border-neutral-200 text-xs">
                <button
                  type="button"
                  onClick={() => setPortalBillingCycle('monthly')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    portalBillingCycle === 'monthly'
                      ? 'bg-white text-neutral-950 shadow-sm'
                      : 'text-neutral-500'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setPortalBillingCycle('yearly')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    portalBillingCycle === 'yearly'
                      ? 'bg-white text-neutral-950 shadow-sm'
                      : 'text-neutral-500'
                  }`}
                >
                  Yearly
                </button>
              </div>
              {planNotice && (
                <div className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                  {planNotice}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {portalPlans
              .filter((t: any) => t.enabled !== false)
              .map((tier: any) => {
                const isCurrent = account?.plan === tier.id || account?.plan === tier.name;
                const rawPrice =
                  portalBillingCycle === 'yearly' ? tier.yearlyPriceInr : tier.monthlyPriceInr;
                const discountPct = Math.max(0, Math.min(90, Number(tier.discountPercent || 0)));
                const price =
                  discountPct > 0 && rawPrice > 0
                    ? Math.max(1, Math.round(rawPrice * (1 - discountPct / 100)))
                    : rawPrice;
                return (
                  <div
                    key={tier.id}
                    className={`p-5 rounded-2xl border flex flex-col justify-between gap-5 ${
                      tier.highlighted
                        ? 'bg-[#FAFAFB] border-neutral-950 shadow-sm'
                        : 'bg-white border-neutral-200'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-neutral-950">{tier.name}</span>
                        {discountPct > 0 ? (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                            {discountPct}% OFF
                          </span>
                        ) : (
                          tier.highlighted && (
                            <span className="text-[11px] font-medium text-neutral-600">
                              Popular
                            </span>
                          )
                        )}
                      </div>

                      <div className="flex items-baseline gap-1.5 tabular-nums flex-wrap">
                        <span className="text-2xl font-bold font-mono-cinema text-neutral-950">
                          ₹{price.toLocaleString('en-IN')}
                        </span>
                        {discountPct > 0 && rawPrice > price && (
                          <span className="text-xs line-through text-neutral-400 font-mono-cinema">
                            ₹{rawPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                        <span className="text-xs text-neutral-500">
                          /{portalBillingCycle === 'yearly' ? 'year' : 'month'}
                        </span>
                      </div>

                      <div className="text-xs font-mono-cinema text-neutral-700 font-semibold tabular-nums">
                        {tier.monthlyCredits.toLocaleString()} credits/mo
                      </div>

                    <p className="text-xs text-neutral-600 leading-relaxed">{tier.tagline}</p>

                    <ul className="space-y-2 pt-2 border-t border-neutral-200 text-xs text-neutral-700">
                      {(tier.features || []).map((h: string) => (
                        <li key={h} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleSelectPlan(tier)}
                    className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                      isCurrent
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : tier.highlighted
                        ? 'bg-neutral-950 hover:bg-black text-white'
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900'
                    }`}
                  >
                    {isCurrent
                      ? 'Current Plan'
                      : price === 0
                      ? 'Select Free'
                      : 'Pay Now with Razorpay'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Active Projects & Recent Usage Activity */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-[#FAFAFB] border border-neutral-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-neutral-950">Your Production Slate</h3>
                <p className="text-xs text-neutral-500">Open any project directly in the Workstation</p>
              </div>
              <button
                type="button"
                onClick={() => onOpenModule('films')}
                className="text-xs text-neutral-700 hover:text-neutral-950 font-medium"
              >
                Manage Films &rarr;
              </button>
            </div>

            {allFilms.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-500 border border-dashed border-neutral-200 rounded-xl">
                No film projects currently open. Launch AI Film Maker to generate a new project.
              </div>
            ) : (
              <div className="space-y-2.5">
                {allFilms.slice(0, 4).map((film) => (
                  <div
                    key={film.id}
                    onClick={onOpenWorkstation}
                    className="p-3.5 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-neutral-950 truncate">{film.title}</div>
                      <div className="text-[11px] font-mono-cinema text-neutral-500">
                        {film.genre} · {film.aspectRatio} · {film.resolution}
                      </div>
                    </div>
                    <span className="text-[11px] font-mono-cinema text-neutral-600 shrink-0">
                      {film.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 bg-[#FAFAFB] border border-neutral-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-neutral-950">Recent Cloud Activity</h3>
                <p className="text-xs text-neutral-500">Synced voice, manhwa & export telemetry</p>
              </div>
              {account && (
                <span className="text-xs font-mono-cinema text-emerald-700">
                  {account.creditsUsedThisMonth.toLocaleString()} used
                </span>
              )}
            </div>

            {!firebaseUser ? (
              <div className="p-5 rounded-xl bg-white border border-neutral-200 space-y-3">
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Sign in with your Google account to track monthly credits, persist My Library uploads, and manage subscription usage logs in Cloud Firestore.
                </p>
                <button
                  type="button"
                  onClick={openAuthModal}
                  className="w-full py-2.5 rounded-xl bg-neutral-950 hover:bg-black text-white text-xs font-semibold transition-colors"
                >
                  Sign In / Create Account
                </button>
              </div>
            ) : usageLogs.length === 0 ? (
              <div className="p-5 text-xs text-neutral-500 rounded-xl bg-white border border-neutral-200">
                No generation runs logged yet in this session. Try generating a voice take or saving an asset in My Library.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {usageLogs.slice(0, 6).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-white border border-neutral-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-neutral-950 truncate">{log.tool}</div>
                      <div className="text-[11px] text-neutral-500 truncate">{log.summary}</div>
                    </div>
                    <span className="font-mono-cinema text-neutral-700 shrink-0">
                      -{log.creditsUsed}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 py-8 px-6 text-center text-xs text-neutral-500">
        ZKMAP STUDIO · https://zkmapstudio.com · Unified AI Film, Manhwa, Voice, Audio &amp; 4K Master Suite
      </footer>
    </div>
  );
};
