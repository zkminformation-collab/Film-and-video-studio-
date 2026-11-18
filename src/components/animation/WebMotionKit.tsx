import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { animate, stagger } from 'animejs';
import {
  Sparkles,
  Play,
  ExternalLink,
  Copy,
  Check,
  Wand2,
  Layers,
  Film,
  Zap,
} from 'lucide-react';
import { StudioTheme } from '../../types';

interface WebMotionKitProps {
  theme?: StudioTheme;
}

const ANIMATE_CSS_PRESETS = [
  'animate__fadeInUp',
  'animate__zoomIn',
  'animate__bounceIn',
  'animate__pulse',
  'animate__slideInRight',
  'animate__flipInX',
];

const FREE_LIBRARIES = [
  {
    name: 'LottieFiles',
    role: 'Animated icons and loading screens',
    url: 'https://lottiefiles.com/',
    status: 'Integrated (lottie-web)',
  },
  {
    name: 'useAnimations',
    role: 'Animated interface icons (300 MIT JSON)',
    url: 'https://useanimations.com/',
    status: 'Integrated (Live Catalog)',
  },
  {
    name: 'Lordicon',
    role: 'Animated buttons and interactive UI icons',
    url: 'https://lordicon.com/',
    status: 'Embed Ready',
  },
  {
    name: 'Animate.css',
    role: 'Page transitions and CSS micro-effects',
    url: 'https://animate.style/',
    status: 'Installed & Active',
  },
  {
    name: 'Anime.js',
    role: 'SVG paths and timeline element animations',
    url: 'https://animejs.com/',
    status: 'Installed & Active',
  },
  {
    name: 'Motion',
    role: 'Spring-physics React interface animations',
    url: 'https://motion.dev/',
    status: 'Installed & Active',
  },
];

export const WebMotionKit: React.FC<WebMotionKitProps> = ({ theme = 'elevenlabs' }) => {
  const isLight = theme === 'elevenlabs';

  // Animate.css live demo
  const [cssPreset, setCssPreset] = useState<string>('animate__fadeInUp');
  const [cssKey, setCssKey] = useState<number>(0);

  // Motion spring live demo
  const [motionStep, setMotionStep] = useState<number>(0);

  // Anime.js live stagger wave demo
  const animeBarsRef = useRef<HTMLDivElement | null>(null);
  const [copiedId, setCopiedId] = useState<string>('');

  const triggerAnimeWave = () => {
    const container = animeBarsRef.current;
    if (!container) return;
    const bars = container.querySelectorAll('.anime-wave-bar');
    animate(bars, {
      scaleY: [
        { to: 2.2, duration: 280, ease: 'outQuad' },
        { to: 0.7, duration: 240, ease: 'inOutQuad' },
        { to: 1, duration: 320, ease: 'outElastic(1, .6)' },
      ],
      delay: stagger(55, { from: 'center' }),
    });
  };

  useEffect(() => {
    triggerAnimeWave();
  }, []);

  const copySnippet = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(''), 1600);
    } catch {
      // ignore clipboard errors
    }
  };

  const cardClass = isLight
    ? 'bg-white border-neutral-200 text-neutral-900'
    : 'bg-slate-900/80 border-slate-800 text-slate-100';
  const mutedClass = isLight ? 'text-neutral-600' : 'text-slate-400';

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Architecture Banner: Website UI Animations vs Film Animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-4 rounded-xl border ${cardClass}`}>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-purple-500">
            <Zap className="w-4 h-4" />
            <span>Website & Studio UI Animations</span>
          </div>
          <p className={`text-xs mt-1.5 leading-relaxed ${mutedClass}`}>
            Powered by <strong>LottieFiles, useAnimations, Lordicon, Animate.css, Anime.js, and Motion</strong> for responsive buttons, loading states, menus, and dashboard transitions.
          </p>
        </div>
        <div className={`p-4 rounded-xl border ${cardClass}`}>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-500">
            <Film className="w-4 h-4" />
            <span>Film & Cartoon Production Animations</span>
          </div>
          <p className={`text-xs mt-1.5 leading-relaxed ${mutedClass}`}>
            Powered by <strong>Storyboard Studio, AI Image Studio, AI Video Generator, Voice/Music/SFX Studios, and Timeline MP4 Export</strong> for complete animated films from one prompt.
          </p>
        </div>
      </div>

      {/* 6 Integrated Free Libraries Directory */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {FREE_LIBRARIES.map((lib) => (
          <div key={lib.name} className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 ${cardClass}`}>
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold">{lib.name}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-300'}`}>
                  {lib.status}
                </span>
              </div>
              <p className={`text-xs mt-1 ${mutedClass}`}>{lib.role}</p>
            </div>
            <a
              href={lib.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-purple-500 hover:underline w-fit"
            >
              <span>Open {lib.name}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ))}
      </div>

      {/* Interactive Live Sandboxes: Motion, Anime.js, Animate.css */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1. Motion (React Spring Physics) */}
        <div className={`p-4 rounded-xl border space-y-3 ${cardClass}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-purple-500">
              <Sparkles className="w-3.5 h-3.5" />
              Motion (React)
            </span>
            <button
              type="button"
              onClick={() => setMotionStep((s) => (s + 1) % 3)}
              className="px-2.5 py-1 rounded-md bg-purple-600 text-white text-[11px] font-bold flex items-center gap-1"
            >
              <Play className="w-3 h-3" />
              Spring
            </button>
          </div>
          <div className={`h-28 rounded-lg border flex items-center justify-center overflow-hidden ${isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-slate-950 border-slate-800'}`}>
            <motion.div
              animate={{
                scale: motionStep === 1 ? 1.15 : motionStep === 2 ? 0.92 : 1,
                rotate: motionStep === 1 ? 6 : motionStep === 2 ? -6 : 0,
                borderRadius: motionStep === 1 ? '24px' : '12px',
              }}
              transition={{ type: 'spring', stiffness: 320, damping: 18 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-lg cursor-pointer select-none"
            >
              Motion Spring Card
            </motion.div>
          </div>
          <button
            type="button"
            onClick={() =>
              copySnippet(
                'motion',
                `import { motion } from 'motion/react';\n<motion.div whileHover={{ scale: 1.05 }} transition={{ type: 'spring' }} />`
              )
            }
            className={`w-full py-1.5 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1.5 ${isLight ? 'bg-neutral-50 border-neutral-300' : 'bg-slate-950 border-slate-700'}`}
          >
            {copiedId === 'motion' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedId === 'motion' ? 'Copied Motion Snippet' : 'Copy Motion React Snippet'}</span>
          </button>
        </div>

        {/* 2. Anime.js (SVG & Element Stagger Timeline) */}
        <div className={`p-4 rounded-xl border space-y-3 ${cardClass}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-amber-500">
              <Wand2 className="w-3.5 h-3.5" />
              Anime.js (Stagger)
            </span>
            <button
              type="button"
              onClick={triggerAnimeWave}
              className="px-2.5 py-1 rounded-md bg-amber-500 text-black text-[11px] font-bold flex items-center gap-1"
            >
              <Play className="w-3 h-3" />
              Pulse Wave
            </button>
          </div>
          <div
            ref={animeBarsRef}
            className={`h-28 rounded-lg border flex items-center justify-center gap-2 px-4 ${isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-slate-950 border-slate-800'}`}
          >
            {Array.from({ length: 9 }).map((_, idx) => (
              <div
                key={idx}
                className="anime-wave-bar w-2.5 h-8 rounded-full bg-gradient-to-t from-amber-500 to-purple-500"
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              copySnippet(
                'anime',
                `import { animate, stagger } from 'animejs';\nanimate('.bar', { scaleY: [1, 2.2, 1], delay: stagger(55, { from: 'center' }) });`
              )
            }
            className={`w-full py-1.5 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1.5 ${isLight ? 'bg-neutral-50 border-neutral-300' : 'bg-slate-950 border-slate-700'}`}
          >
            {copiedId === 'anime' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedId === 'anime' ? 'Copied Anime.js Snippet' : 'Copy Anime.js Snippet'}</span>
          </button>
        </div>

        {/* 3. Animate.css (Page & Component Transitions) */}
        <div className={`p-4 rounded-xl border space-y-3 ${cardClass}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-sky-500">
              <Layers className="w-3.5 h-3.5" />
              Animate.css
            </span>
            <select
              value={cssPreset}
              onChange={(e) => {
                setCssPreset(e.target.value);
                setCssKey((k) => k + 1);
              }}
              className={`px-2 py-1 rounded-md border text-[11px] font-semibold outline-none ${isLight ? 'bg-white border-neutral-300' : 'bg-slate-950 border-slate-700'}`}
            >
              {ANIMATE_CSS_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  {preset.replace('animate__', '')}
                </option>
              ))}
            </select>
          </div>
          <div className={`h-28 rounded-lg border flex items-center justify-center overflow-hidden ${isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-slate-950 border-slate-800'}`}>
            <div
              key={`${cssPreset}-${cssKey}`}
              onClick={() => setCssKey((k) => k + 1)}
              className={`animate__animated ${cssPreset} px-4 py-2.5 rounded-lg bg-sky-600 text-white text-xs font-bold cursor-pointer select-none`}
            >
              {cssPreset.replace('animate__', '')}
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              copySnippet('animatecss', `<div className="animate__animated ${cssPreset}">Scene Panel</div>`)
            }
            className={`w-full py-1.5 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1.5 ${isLight ? 'bg-neutral-50 border-neutral-300' : 'bg-slate-950 border-slate-700'}`}
          >
            {copiedId === 'animatecss' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedId === 'animatecss' ? 'Copied Animate.css Class' : 'Copy Animate.css Class'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
