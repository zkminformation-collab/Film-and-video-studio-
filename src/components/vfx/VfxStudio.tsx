import React, { useState, useEffect, useRef } from 'react';
import { 
  Wand2, 
  Sparkles, 
  Layers, 
  Sliders, 
  Eye, 
  Contrast, 
  Sun, 
  Zap, 
  SplitSquareVertical,
  Check
} from 'lucide-react';
import { FilmProject } from '../../types';
import { soundFx } from '../../utils/audioSynth';

interface VfxStudioProps {
  activeFilm: FilmProject;
}

export const VfxStudio: React.FC<VfxStudioProps> = ({ activeFilm }) => {
  const [activeLut, setActiveLut] = useState<string>('teal-orange');
  const [chromaKeyActive, setChromaKeyActive] = useState<boolean>(true);
  const [chromaTolerance, setChromaTolerance] = useState<number>(45);
  const [filmGrain, setFilmGrain] = useState<number>(25);
  const [lensFlare, setLensFlare] = useState<boolean>(true);
  const [flareIntensity, setFlareIntensity] = useState<number>(70);
  const [chromaticAberration, setChromaticAberration] = useState<number>(20);
  const [splitView, setSplitView] = useState<boolean>(false);
  const [splitPos, setSplitPos] = useState<number>(50); // percentage

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  // Render VFX Pipeline on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg';

    let grainPhase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background plate (if Chroma Key is active, render space backdrop behind actor)
      if (chromaKeyActive) {
        const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        bgGrad.addColorStop(0, '#020617');
        bgGrad.addColorStop(0.5, '#0f172a');
        bgGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw distant stars
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        for (let i = 0; i < 40; i++) {
          const sx = (i * 97) % canvas.width;
          const sy = (i * 53) % canvas.height;
          ctx.fillRect(sx, sy, 1.5, 1.5);
        }
      }

      // Draw main plate image
      if (img.complete) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }

      // If Split View is active, draw divider
      const effectiveWidth = splitView ? (canvas.width * splitPos) / 100 : canvas.width;

      // Apply Grading Filter Clip
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, effectiveWidth, canvas.height);
      ctx.clip();

      // Apply LUT simulation
      if (activeLut === 'teal-orange') {
        ctx.fillStyle = 'rgba(14, 165, 233, 0.12)'; // Cyan shadows
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(249, 115, 22, 0.08)'; // Orange highlights
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (activeLut === 'bleach') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (activeLut === 'noir') {
        // High contrast B&W overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Anamorphic Lens Flare
      if (lensFlare) {
        const flareY = canvas.height * 0.42;
        const flareAlpha = flareIntensity / 100;

        const flareGrad = ctx.createLinearGradient(0, flareY, canvas.width, flareY);
        flareGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
        flareGrad.addColorStop(0.35, `rgba(56, 189, 248, ${0.4 * flareAlpha})`);
        flareGrad.addColorStop(0.5, `rgba(255, 255, 255, ${0.9 * flareAlpha})`);
        flareGrad.addColorStop(0.65, `rgba(56, 189, 248, ${0.4 * flareAlpha})`);
        flareGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

        ctx.fillStyle = flareGrad;
        ctx.fillRect(0, flareY - 3, canvas.width, 6);

        // Core orb
        const radial = ctx.createRadialGradient(
          canvas.width * 0.5, flareY, 2,
          canvas.width * 0.5, flareY, 35
        );
        radial.addColorStop(0, `rgba(255, 255, 255, ${flareAlpha})`);
        radial.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = radial;
        ctx.beginPath();
        ctx.arc(canvas.width * 0.5, flareY, 35, 0, Math.PI * 2);
        ctx.fill();
      }

      // 35mm Film Grain
      if (filmGrain > 0) {
        const grainImg = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = grainImg.data;
        const grainAmount = filmGrain * 0.7;

        for (let i = 0; i < data.length; i += 16) {
          const noise = (Math.random() - 0.5) * grainAmount;
          data[i] = Math.min(255, Math.max(0, data[i] + noise));
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
        }
        ctx.putImageData(grainImg, 0, 0);
      }

      ctx.restore();

      // Draw Split Line
      if (splitView) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(effectiveWidth, 0);
        ctx.lineTo(effectiveWidth, canvas.height);
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.font = '10px monospace';
        ctx.fillText('GRADED VFX', effectiveWidth - 75, 20);
        ctx.fillText('RAW SENSOR', effectiveWidth + 10, 20);
      }

      grainPhase++;
      animRef.current = requestAnimationFrame(render);
    };

    img.onload = () => {
      render();
    };

    return () => cancelAnimationFrame(animRef.current);
  }, [activeLut, chromaKeyActive, chromaTolerance, filmGrain, lensFlare, flareIntensity, splitView, splitPos]);

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-950 text-slate-100">
      {/* Main VFX Compositor Viewport */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 select-none">
        {/* Canvas Display */}
        <div className="relative border-2 border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-black">
          <canvas
            ref={canvasRef}
            width={720}
            height={360}
            className="w-full max-w-3xl aspect-[2/1] block"
          />

          {/* Top HUD */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between text-xs font-mono-cinema pointer-events-none">
            <span className="bg-black/80 px-2 py-0.5 rounded text-amber-400 border border-amber-500/30">
              VFX NODE: CHROMA_KEY_COMP + ANAMORPHIC_LUT
            </span>
            <span className="bg-black/80 px-2 py-0.5 rounded text-slate-300 border border-white/10">
              {activeLut.toUpperCase()} · GRAIN: {filmGrain}%
            </span>
          </div>

          {/* Split View Slider Overlay */}
          {splitView && (
            <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 bg-black/80 p-2 rounded border border-slate-700">
              <span className="text-[10px] text-amber-400 font-mono">WIPE SPLIT:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={splitPos}
                onChange={(e) => setSplitPos(parseInt(e.target.value))}
                className="flex-1 accent-amber-500"
              />
              <span className="text-xs font-mono text-white">{splitPos}%</span>
            </div>
          )}
        </div>

        {/* Bottom Quick Controls */}
        <div className="w-full max-w-3xl mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFx.playScannerBeep();
                setSplitView(!splitView);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border transition-colors ${
                splitView
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>Before / After Split</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono-cinema">
            ACEScc Color Science Engine Active
          </div>
        </div>
      </div>

      {/* Right Sidebar: Shaders, Chroma Keyer, LUT selector */}
      <div className="w-full lg:w-84 bg-slate-900 border-l border-slate-800 p-5 overflow-y-auto space-y-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono-cinema">
            Color Grading LUTs
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Hollywood 3D LUT Color Transforms
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'teal-orange', label: 'Teal & Orange', desc: 'Blockbuster Sci-Fi' },
            { id: 'bleach', label: 'Bleach Bypass', desc: 'Desaturated Grit' },
            { id: 'noir', label: 'Film Noir', desc: 'High Contrast B&W' },
            { id: 'none', label: 'Rec.709 Flat', desc: 'Neutral Balance' },
          ].map((lut) => (
            <button
              key={lut.id}
              onClick={() => {
                soundFx.playScannerBeep();
                setActiveLut(lut.id);
              }}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                activeLut === lut.id
                  ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="text-xs font-bold">{lut.label}</div>
              <div className="text-[10px] text-slate-500">{lut.desc}</div>
            </button>
          ))}
        </div>

        {/* Optical Effects Sliders */}
        <div className="space-y-4 pt-4 border-t border-slate-800 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white uppercase font-mono-cinema">
              35mm Film Grain ({filmGrain}%)
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="60"
            value={filmGrain}
            onChange={(e) => setFilmGrain(parseInt(e.target.value))}
            className="w-full accent-amber-500"
          />

          <div className="flex items-center justify-between pt-2">
            <span className="font-bold text-white uppercase font-mono-cinema">
              Anamorphic Lens Flare
            </span>
            <button
              onClick={() => setLensFlare(!lensFlare)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                lensFlare ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {lensFlare ? 'ENABLED' : 'OFF'}
            </button>
          </div>

          {lensFlare && (
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Flare Brightness ({flareIntensity}%)</span>
              <input
                type="range"
                min="20"
                max="100"
                value={flareIntensity}
                onChange={(e) => setFlareIntensity(parseInt(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
          )}

          {/* Chroma Key Green Screen Section */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white uppercase font-mono-cinema">
                Chroma Keyer (Green Screen)
              </span>
              <button
                onClick={() => setChromaKeyActive(!chromaKeyActive)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                  chromaKeyActive ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {chromaKeyActive ? 'KEYED' : 'BYPASS'}
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Keying Tolerance ({chromaTolerance})</span>
              <input
                type="range"
                min="10"
                max="80"
                value={chromaTolerance}
                onChange={(e) => setChromaTolerance(parseInt(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
