import React, { useState, useEffect, useRef } from 'react';
import { 
  Palette, 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Layers, 
  Eye, 
  Sparkles,
  Download
} from 'lucide-react';
import { FilmProject } from '../../types';
import { soundFx } from '../../utils/audioSynth';

interface AnimationStudioProps {
  activeFilm: FilmProject;
}

interface AnimObject {
  id: string;
  type: 'monolith' | 'character' | 'nebula' | 'circle' | 'text';
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color: string;
}

export const AnimationStudio: React.FC<AnimationStudioProps> = ({ activeFilm }) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [onionSkin, setOnionSkin] = useState(true);
  const [selectedObjId, setSelectedObjId] = useState<string>('obj-1');

  const [objects, setObjects] = useState<AnimObject[]>([
    { id: 'obj-1', type: 'monolith', x: 300, y: 180, scale: 1.2, rotation: 0, color: '#f59e0b' },
    { id: 'obj-2', type: 'character', x: 150, y: 240, scale: 1.0, rotation: 0, color: '#38bdf8' },
    { id: 'obj-3', type: 'nebula', x: 250, y: 100, scale: 1.5, rotation: 0, color: '#a855f7' },
  ]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const totalFrames = 48;

  // Animation Playback Loop
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentFrame((f) => (f + 1) % totalFrames);
      }, 1000 / 24); // 24 FPS
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear Screen (Cinema Deep Charcoal)
    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw subtle grid
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Onion Skinning (Previous Frame Ghost)
    if (onionSkin && currentFrame > 0) {
      ctx.save();
      ctx.globalAlpha = 0.2;
      drawFrameScene(ctx, currentFrame - 1, '#64748b');
      ctx.restore();
    }

    // Draw Current Frame Scene
    drawFrameScene(ctx, currentFrame);

  }, [currentFrame, objects, onionSkin]);

  const drawFrameScene = (ctx: CanvasRenderingContext2D, frame: number, overrideColor?: string) => {
    const t = frame / totalFrames; // 0 to 1

    objects.forEach((obj) => {
      ctx.save();
      const posX = obj.x + Math.sin(t * Math.PI * 2) * (obj.type === 'character' ? 30 : 5);
      const posY = obj.y + (obj.type === 'nebula' ? Math.cos(t * Math.PI * 2) * 10 : 0);
      ctx.translate(posX, posY);
      ctx.rotate((obj.rotation * Math.PI) / 180);
      ctx.scale(obj.scale, obj.scale);

      ctx.fillStyle = overrideColor || obj.color;
      ctx.strokeStyle = overrideColor || obj.color;

      if (obj.type === 'monolith') {
        // Draw futuristic monolith
        ctx.fillRect(-20, -70, 40, 140);
        ctx.fillStyle = '#050811';
        ctx.fillRect(-4, -60, 8, 120);
        ctx.fillStyle = overrideColor || '#38bdf8';
        // Glowing glyph pulse
        const glyphAlpha = Math.sin(t * Math.PI * 4) * 0.5 + 0.5;
        ctx.globalAlpha = glyphAlpha;
        ctx.fillRect(-3, -40, 6, 20);
        ctx.fillRect(-3, 0, 6, 35);
      } else if (obj.type === 'character') {
        // Draw astronaut stick puppet
        ctx.lineWidth = 4;
        ctx.beginPath();
        // Helmet
        ctx.arc(0, -30, 12, 0, Math.PI * 2);
        ctx.fill();
        // Torso
        ctx.moveTo(0, -18);
        ctx.lineTo(0, 15);
        // Legs animated walking
        const legAngle = Math.sin(t * Math.PI * 4) * 15;
        ctx.moveTo(0, 15);
        ctx.lineTo(-12 + legAngle, 38);
        ctx.moveTo(0, 15);
        ctx.lineTo(12 - legAngle, 38);
        // Arms
        ctx.moveTo(0, -5);
        ctx.lineTo(-15, 10);
        ctx.moveTo(0, -5);
        ctx.lineTo(15, -10);
        ctx.stroke();
      } else if (obj.type === 'nebula') {
        // Draw cosmic particle cluster
        for (let i = 0; i < 18; i++) {
          const angle = (i / 18) * Math.PI * 2 + t * Math.PI;
          const dist = 30 + (i % 3) * 15;
          const px = Math.cos(angle) * dist;
          const py = Math.sin(angle) * dist;
          ctx.beginPath();
          ctx.arc(px, py, (i % 4) + 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    });
  };

  const handleAddObject = (type: AnimObject['type']) => {
    soundFx.playShutterSound();
    const newObj: AnimObject = {
      id: `obj-${Date.now()}`,
      type,
      x: 200 + Math.random() * 200,
      y: 150 + Math.random() * 100,
      scale: 1.0,
      rotation: 0,
      color: type === 'nebula' ? '#c084fc' : type === 'character' ? '#38bdf8' : '#f59e0b',
    };
    setObjects((prev) => [...prev, newObj]);
    setSelectedObjId(newObj.id);
  };

  const selectedObj = objects.find((o) => o.id === selectedObjId);

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-950 text-slate-100">
      {/* Canvas Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-950 select-none">
        {/* Cinema 2D Animation Stage */}
        <div className="relative border-2 border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-black">
          <canvas
            ref={canvasRef}
            width={640}
            height={360}
            className="w-full max-w-2xl aspect-[16/9] block cursor-crosshair"
          />

          {/* Canvas HUD */}
          <div className="absolute top-2 inset-x-3 flex items-center justify-between text-xs font-mono-cinema pointer-events-none">
            <span className="bg-black/75 px-2 py-0.5 rounded text-amber-400 border border-amber-500/30">
              FRAME {currentFrame} / {totalFrames} (24 FPS)
            </span>
            <span className="bg-black/75 px-2 py-0.5 rounded text-slate-400 border border-white/10">
              VECTOR 2D ENGINE
            </span>
          </div>
        </div>

        {/* Animation Scrubber & Transport Bar */}
        <div className="w-full max-w-2xl mt-4 bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  soundFx.playScannerBeep();
                  setIsPlaying(!isPlaying);
                }}
                className="p-2 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-transform active:scale-95"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <button
                onClick={() => setCurrentFrame(0)}
                className="p-2 rounded hover:bg-slate-800 text-slate-300"
                title="Rewind to Frame 0"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono-cinema text-amber-400 font-bold ml-2">
                Frame {currentFrame}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setOnionSkin(!onionSkin)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono border transition-colors ${
                  onionSkin
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Onion Skin</span>
              </button>
            </div>
          </div>

          {/* Interactive Frame Scrubber Bar */}
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max={totalFrames - 1}
              value={currentFrame}
              onChange={(e) => setCurrentFrame(parseInt(e.target.value))}
              className="flex-1 accent-amber-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Right Sidebar: Objects Rigging & Transform Controls */}
      <div className="w-full lg:w-80 bg-slate-900 border-l border-slate-800 p-5 overflow-y-auto space-y-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono-cinema">
            Animation Actors & Rigging
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Keyframe canvas scene entities
          </p>
        </div>

        {/* Add Object Buttons */}
        <div className="space-y-2">
          <label className="text-[10px] text-slate-500 uppercase font-mono-cinema">Add Actor to Canvas</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleAddObject('character')}
              className="py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-xs text-sky-300 font-medium text-center"
            >
              + Character
            </button>
            <button
              onClick={() => handleAddObject('monolith')}
              className="py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-xs text-amber-300 font-medium text-center"
            >
              + Monolith
            </button>
            <button
              onClick={() => handleAddObject('nebula')}
              className="py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-xs text-purple-300 font-medium text-center"
            >
              + Nebula
            </button>
          </div>
        </div>

        {/* Inspector for selected object */}
        {selectedObj && (
          <div className="space-y-4 pt-4 border-t border-slate-800 text-xs">
            <div className="font-bold text-white uppercase font-mono-cinema">
              {selectedObj.type} Properties
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-mono-cinema">Scale ({selectedObj.scale.toFixed(1)}x)</label>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={selectedObj.scale}
                onChange={(e) => {
                  const s = parseFloat(e.target.value);
                  setObjects((prev) =>
                    prev.map((o) => (o.id === selectedObj.id ? { ...o, scale: s } : o))
                  );
                }}
                className="w-full accent-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-mono-cinema">Rotation ({selectedObj.rotation}°)</label>
              <input
                type="range"
                min="-180"
                max="180"
                value={selectedObj.rotation}
                onChange={(e) => {
                  const r = parseInt(e.target.value);
                  setObjects((prev) =>
                    prev.map((o) => (o.id === selectedObj.id ? { ...o, rotation: r } : o))
                  );
                }}
                className="w-full accent-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-mono-cinema">X Position</label>
              <input
                type="range"
                min="50"
                max="580"
                value={selectedObj.x}
                onChange={(e) => {
                  const x = parseInt(e.target.value);
                  setObjects((prev) =>
                    prev.map((o) => (o.id === selectedObj.id ? { ...o, x } : o))
                  );
                }}
                className="w-full accent-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-mono-cinema">Y Position</label>
              <input
                type="range"
                min="50"
                max="320"
                value={selectedObj.y}
                onChange={(e) => {
                  const y = parseInt(e.target.value);
                  setObjects((prev) =>
                    prev.map((o) => (o.id === selectedObj.id ? { ...o, y } : o))
                  );
                }}
                className="w-full accent-amber-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
