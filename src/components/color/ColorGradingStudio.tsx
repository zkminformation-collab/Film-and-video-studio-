import React, { useState } from 'react';
import { 
  Palette, 
  RotateCcw, 
  SplitSquareVertical, 
  Sliders, 
  Sun, 
  Contrast, 
  Activity,
  CheckCircle2
} from 'lucide-react';
import { FilmProject } from '../../types';
import { soundFx } from '../../utils/audioSynth';

interface ColorGradingStudioProps {
  activeFilm: FilmProject;
}

export const ColorGradingStudio: React.FC<ColorGradingStudioProps> = ({ activeFilm }) => {
  const [activeLut, setActiveLut] = useState<string>('kodak_2383');
  const [temperature, setTemperature] = useState<number>(0); // -50 to 50
  const [tint, setTint] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(1.2);
  const [saturation, setSaturation] = useState<number>(115);
  const [splitView, setSplitView] = useState<boolean>(false);
  const [scopeMode, setScopeMode] = useState<'waveform' | 'vectorscope' | 'false_color'>('waveform');

  // 3-Way Color Wheel Offsets
  const [liftHue, setLiftHue] = useState<number>(210); // Cool cyan in shadows
  const [gammaHue, setGammaHue] = useState<number>(45); // Warm gold in midtones
  const [gainHue, setGainHue] = useState<number>(35); // Warm highlights

  const handleReset = () => {
    soundFx.playWhoosh();
    setTemperature(0);
    setTint(0);
    setContrast(1.0);
    setSaturation(100);
    setLiftHue(210);
    setGammaHue(45);
    setGainHue(35);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 text-slate-100">
      {/* Top Half: Dual Monitor (Cinema Grading Canvas + Waveform Scope) */}
      <div className="h-[46%] border-b border-slate-800 flex flex-col md:flex-row bg-black">
        {/* Main Cinema Viewport */}
        <div className="flex-1 relative flex items-center justify-center p-3 overflow-hidden">
          <div className="relative w-full max-w-2xl aspect-[2.39/1] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            <img
              src="/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg"
              alt="Color Grade Master"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-all duration-200"
              style={{
                filter: `contrast(${contrast}) saturate(${saturation}%) hue-rotate(${temperature * 0.5}deg)`,
              }}
            />

            {/* Top HUD */}
            <div className="absolute top-2 left-2 bg-black/85 text-[10px] text-amber-400 font-mono-cinema px-2 py-0.5 rounded border border-amber-500/30">
              ACES 1.3 · {activeLut.toUpperCase()} · 2.39:1 SCOPE
            </div>

            {/* Split Screen Overlay */}
            {splitView && (
              <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden border-l-2 border-amber-400">
                <img
                  src="/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg"
                  alt="Raw View"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover max-w-none -ml-[100%] filter grayscale-30"
                />
                <div className="absolute bottom-2 right-2 text-[10px] font-mono text-white bg-black/80 px-1.5 py-0.5 rounded">
                  RAW REAR SENSOR
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Waveform Scope / Vectorscope Monitor */}
        <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-950 p-3 flex flex-col justify-between select-none">
          <div className="flex items-center justify-between text-[11px] font-mono-cinema text-slate-400">
            <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <Activity className="w-3.5 h-3.5" />
              PARADE RGB SCOPE
            </span>
            <div className="flex gap-1 text-[10px]">
              {(['waveform', 'false_color'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setScopeMode(mode)}
                  className={`px-1.5 py-0.5 rounded ${
                    scopeMode === mode ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-500'
                  }`}
                >
                  {mode.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Scope graphic simulation */}
          <div className="h-32 bg-slate-900 border border-slate-800 rounded relative overflow-hidden flex items-end justify-between px-2 pb-1">
            <div className="w-1/3 h-full border-r border-slate-800 flex items-end justify-center">
              <div className="w-3/4 bg-rose-500/40 h-3/4 rounded-t blur-2xs" />
            </div>
            <div className="w-1/3 h-full border-r border-slate-800 flex items-end justify-center">
              <div className="w-3/4 bg-emerald-500/40 h-2/3 rounded-t blur-2xs" />
            </div>
            <div className="w-1/3 h-full flex items-end justify-center">
              <div className="w-3/4 bg-sky-500/40 h-4/5 rounded-t blur-2xs" />
            </div>

            {/* Scope IRE Grid lines */}
            <div className="absolute inset-x-0 top-1/4 border-b border-dashed border-white/10" />
            <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-white/10" />
            <div className="absolute inset-x-0 top-3/4 border-b border-dashed border-white/10" />
            <div className="absolute right-1 top-1 text-[9px] text-slate-500 font-mono">100 IRE</div>
            <div className="absolute right-1 bottom-1 text-[9px] text-slate-500 font-mono">0 IRE</div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono-cinema">
            <span>R-Parade: 82%</span>
            <span>G-Parade: 74%</span>
            <span>B-Parade: 89%</span>
          </div>
        </div>
      </div>

      {/* Bottom Half: 3-Way Color Wheels & Primary Faders */}
      <div className="flex-1 bg-slate-950 p-4 overflow-y-auto space-y-4">
        {/* Top Control Strip */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono-cinema">
              DaVinci Style 3-Way Color Wheels
            </span>
            <button
              onClick={() => setSplitView(!splitView)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono border ${
                splitView ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>Wipe Split</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={activeLut}
              onChange={(e) => setActiveLut(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-amber-300 font-mono rounded px-2.5 py-1 outline-none"
            >
              <option value="kodak_2383">Kodak 2383 Print Film Stock</option>
              <option value="fuji_eterna">Fujifilm Eterna 500T</option>
              <option value="teal_orange">Hollywood Teal & Orange</option>
              <option value="bleach_bypass">Bleach Bypass Silver</option>
            </select>

            <button
              onClick={handleReset}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              title="Reset All Corrections"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Color Wheels (Lift, Gamma, Gain) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Lift (Shadows) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center space-y-2">
            <div className="text-xs font-bold font-mono text-cyan-400">LIFT (SHADOWS)</div>
            {/* Circular Color Wheel Simulator */}
            <div className="w-24 h-24 rounded-full border-2 border-slate-700 relative flex items-center justify-center bg-radial from-slate-950 to-slate-900">
              <div
                className="w-4 h-4 rounded-full bg-cyan-400 shadow-md border-2 border-white absolute transition-transform"
                style={{
                  transform: `translate(${Math.cos((liftHue * Math.PI) / 180) * 24}px, ${Math.sin((liftHue * Math.PI) / 180) * 24}px)`,
                }}
              />
              <div className="w-1.5 h-1.5 bg-slate-600 rounded-full" />
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={liftHue}
              onChange={(e) => setLiftHue(parseInt(e.target.value))}
              className="w-36 accent-cyan-400"
            />
          </div>

          {/* Gamma (Midtones) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center space-y-2">
            <div className="text-xs font-bold font-mono text-amber-400">GAMMA (MIDTONES)</div>
            <div className="w-24 h-24 rounded-full border-2 border-slate-700 relative flex items-center justify-center bg-radial from-slate-950 to-slate-900">
              <div
                className="w-4 h-4 rounded-full bg-amber-400 shadow-md border-2 border-white absolute transition-transform"
                style={{
                  transform: `translate(${Math.cos((gammaHue * Math.PI) / 180) * 24}px, ${Math.sin((gammaHue * Math.PI) / 180) * 24}px)`,
                }}
              />
              <div className="w-1.5 h-1.5 bg-slate-600 rounded-full" />
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={gammaHue}
              onChange={(e) => setGammaHue(parseInt(e.target.value))}
              className="w-36 accent-amber-400"
            />
          </div>

          {/* Gain (Highlights) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center space-y-2">
            <div className="text-xs font-bold font-mono text-rose-400">GAIN (HIGHLIGHTS)</div>
            <div className="w-24 h-24 rounded-full border-2 border-slate-700 relative flex items-center justify-center bg-radial from-slate-950 to-slate-900">
              <div
                className="w-4 h-4 rounded-full bg-rose-400 shadow-md border-2 border-white absolute transition-transform"
                style={{
                  transform: `translate(${Math.cos((gainHue * Math.PI) / 180) * 24}px, ${Math.sin((gainHue * Math.PI) / 180) * 24}px)`,
                }}
              />
              <div className="w-1.5 h-1.5 bg-slate-600 rounded-full" />
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={gainHue}
              onChange={(e) => setGainHue(parseInt(e.target.value))}
              className="w-36 accent-rose-400"
            />
          </div>
        </div>

        {/* Primary Color Faders */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs">
          <div className="space-y-1">
            <div className="flex justify-between text-slate-400 font-mono">
              <span>COLOR TEMP</span>
              <span>{temperature > 0 ? `+${temperature}` : temperature}</span>
            </div>
            <input
              type="range"
              min="-40"
              max="40"
              value={temperature}
              onChange={(e) => setTemperature(parseInt(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-slate-400 font-mono">
              <span>CONTRAST</span>
              <span>{contrast.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.6"
              step="0.02"
              value={contrast}
              onChange={(e) => setContrast(parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-slate-400 font-mono">
              <span>SATURATION</span>
              <span>{saturation}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="180"
              value={saturation}
              onChange={(e) => setSaturation(parseInt(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-slate-400 font-mono">
              <span>TINT BALANCE</span>
              <span>{tint}</span>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              value={tint}
              onChange={(e) => setTint(parseInt(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
