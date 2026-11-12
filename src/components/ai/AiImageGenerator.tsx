import React, { useState } from 'react';
import { 
  Sparkles, 
  Download, 
  Clapperboard, 
  FolderPlus, 
  Camera, 
  Sun, 
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { FilmProject } from '../../types';
import { soundFx } from '../../utils/audioSynth';

interface AiImageGeneratorProps {
  activeFilm: FilmProject;
  onSendToStoryboard?: (imageUrl: string) => void;
}

export const AiImageGenerator: React.FC<AiImageGeneratorProps> = ({ activeFilm, onSendToStoryboard }) => {
  const [prompt, setPrompt] = useState('Cinematic film still, high-tech command deck on an orbital dreadnought, holographic navigation star map, dramatic blue rim lighting');
  const [lens, setLens] = useState('35mm Anamorphic T1.9');
  const [lighting, setLighting] = useState('Volumetric Fog + Blue/Amber Rim');
  const [aspectRatio, setAspectRatio] = useState<'2.39:1' | '16:9' | '1:1' | '9:16'>('2.39:1');
  const [isGenerating, setIsGenerating] = useState(false);

  const [gallery, setGallery] = useState<string[]>([
    '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    '/src/assets/images/cinema_cyberpunk_alley_1794406568416.jpg',
    '/src/assets/images/cinema_soundstage_set_1794406569758.jpg',
    '/src/assets/images/avatar_director_1794406569000.jpg',
  ]);

  const [activeImage, setActiveImage] = useState<string>(gallery[0]);

  const handleGenerate = () => {
    setIsGenerating(true);
    soundFx.playScannerBeep();
    setTimeout(() => {
      setIsGenerating(false);
      soundFx.playCinematicImpact();
      const newImg = '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg';
      setGallery((prev) => [newImg, ...prev]);
      setActiveImage(newImg);
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-950 text-slate-100">
      {/* Main Image Stage (Left) */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 select-none">
        <div
          className={`relative bg-black border-2 border-purple-500/40 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center transition-all ${
            aspectRatio === '2.39:1'
              ? 'w-full max-w-3xl aspect-[2.39/1]'
              : aspectRatio === '9:16'
              ? 'w-[320px] aspect-[9/16]'
              : 'w-full max-w-3xl aspect-video'
          }`}
        >
          <img
            src={activeImage}
            alt="AI Concept"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover filter contrast-105"
          />

          <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 rounded text-xs font-mono-cinema text-purple-400 border border-purple-500/30">
            AI CONCEPT ART ENGINE · {aspectRatio}
          </div>

          {isGenerating && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-white font-mono">
                DIFFUSING 4K CINEMATIC TEXTURES...
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="w-full max-w-3xl mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFx.playShutterSound();
                if (onSendToStoryboard) {
                  onSendToStoryboard(activeImage);
                } else {
                  alert('Sent concept frame to Storyboard Studio Panel #1!');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition-colors shadow-lg shadow-purple-600/30"
            >
              <Clapperboard className="w-3.5 h-3.5" />
              <span>Send to Storyboard Panel</span>
            </button>

            <button
              onClick={() => {
                soundFx.playShutterSound();
                alert('Saved 4K concept art to Media Library!');
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs"
            >
              <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add to Media Bin</span>
            </button>
          </div>

          <span className="text-xs text-slate-400 font-mono-cinema">
            4K DCI Photorealistic Diffusion
          </span>
        </div>
      </div>

      {/* Right Sidebar: Prompt & Lighting Director */}
      <div className="w-full lg:w-96 bg-slate-900 border-l border-slate-800 p-5 overflow-y-auto space-y-5">
        <div>
          <div className="flex items-center gap-2 text-purple-400 font-mono-cinema font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>AI Image Concept Generator</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Photorealistic cinematic still generation
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-400 uppercase font-mono-cinema">Prompt</label>
          <textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-purple-500 resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-400 uppercase font-mono-cinema">Cinema Lens Selection</label>
          <select
            value={lens}
            onChange={(e) => setLens(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-amber-300 font-mono outline-none"
          >
            <option value="35mm Anamorphic T1.9">35mm Anamorphic T1.9</option>
            <option value="50mm Prime T1.2 (Hero Close-up)">50mm Prime T1.2</option>
            <option value="18mm Ultra-Wide Basalt Vista">18mm Ultra-Wide</option>
            <option value="85mm Portrait Cine Cooke S4">85mm Portrait Cine</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-400 uppercase font-mono-cinema">Lighting & Mood</label>
          <select
            value={lighting}
            onChange={(e) => setLighting(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-cyan-300 font-mono outline-none"
          >
            <option value="Volumetric Fog + Blue/Amber Rim">Volumetric Fog + Blue/Amber Rim</option>
            <option value="Chiaroscuro High Contrast Noir">Chiaroscuro High Contrast Noir</option>
            <option value="Golden Hour Magic Sunset Spill">Golden Hour Magic Sunset Spill</option>
            <option value="Cyberpunk Neon Rain Reflections">Cyberpunk Neon Rain Reflections</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-400 uppercase font-mono-cinema">Aspect Ratio</label>
          <div className="grid grid-cols-4 gap-1">
            {(['2.39:1', '16:9', '1:1', '9:16'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setAspectRatio(r)}
                className={`py-1.5 rounded font-mono text-[10px] font-bold border transition-colors ${
                  aspectRatio === r
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-xl transition-all shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isGenerating ? 'Synthesizing...' : 'Generate 4K Concept Frame'}</span>
        </button>

        {/* Gallery Thumbnails */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <span className="text-[10px] text-slate-500 uppercase font-mono">Recent Generated Frames</span>
          <div className="grid grid-cols-2 gap-2">
            {gallery.map((url, idx) => (
              <div
                key={idx}
                onClick={() => setActiveImage(url)}
                className={`aspect-video rounded-lg overflow-hidden border cursor-pointer ${
                  activeImage === url ? 'border-purple-500 ring-2 ring-purple-500/30' : 'border-slate-800'
                }`}
              >
                <img src={url} alt="Thumb" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
