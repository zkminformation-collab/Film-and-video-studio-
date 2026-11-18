import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  Trash2,
  GripVertical,
  VolumeX,
  Music,
  Mic,
  Zap,
  Footprints,
  Plus,
  Library,
  ZoomIn,
  ZoomOut,
  MoveHorizontal,
} from 'lucide-react';
import { AudioTrackRole, AudioTrackState, AudioTimelineClip } from './audioTypes';
import { COMPLETE_MEDIA_CATALOG, UniversalAsset } from '../../data/libraryData';
import { soundFx } from '../../utils/audioSynth';

interface MultitrackAudioTimelineProps {
  tracks: AudioTrackState[];
  clips: AudioTimelineClip[];
  selectedClipId: string | null;
  onSelectClip: (clipId: string | null) => void;
  onAddClip: (clip: AudioTimelineClip) => void;
  onMoveClip: (clipId: string, newStartSec: number, newRole?: AudioTrackRole) => void;
  onDeleteClip: (clipId: string) => void;
  playheadSec: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (sec: number) => void;
  getEffectiveGain: (track: AudioTrackState) => number;
  onAuditionClip: (clip: AudioTimelineClip) => void;
}

const LANE_META: Record<AudioTrackRole, { label: string; icon: React.ElementType; badge: string; accent: string }> = {
  voice: { label: 'Dialogue / Voice', icon: Mic, badge: 'A1 VOX', accent: 'text-sky-400' },
  music: { label: 'Music / Film Score', icon: Music, badge: 'A2 MUS', accent: 'text-purple-400' },
  sfx: { label: 'Sound Effects (SFX)', icon: Zap, badge: 'A3 SFX', accent: 'text-amber-400' },
  foley: { label: 'Foley & Ambience', icon: Footprints, badge: 'A4 FOL', accent: 'text-emerald-400' },
};

export const MultitrackAudioTimeline: React.FC<MultitrackAudioTimelineProps> = ({
  tracks,
  clips,
  selectedClipId,
  onSelectClip,
  onAddClip,
  onMoveClip,
  onDeleteClip,
  playheadSec,
  isPlaying,
  onTogglePlay,
  onSeek,
  getEffectiveGain,
  onAuditionClip,
}) => {
  const [pxPerSec, setPxPerSec] = useState<number>(28);
  const [dragOverRole, setDragOverRole] = useState<AudioTrackRole | null>(null);
  const [showMediaTray, setShowMediaTray] = useState<boolean>(true);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'voice' | 'music' | 'sfx'>('all');
  const timelineTotalSec = 45;

  const laneRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Audio / Voice / Music / SFX assets from the Unified Asset Library
  const audioLibraryAssets = COMPLETE_MEDIA_CATALOG.filter((item) => {
    const isAudioAsset = item.category === 'music' || item.category === 'sfx' || item.category === 'voice';
    if (!isAudioAsset) return false;
    if (mediaFilter === 'all') return true;
    return item.category === mediaFilter;
  });

  const parseDurationSec = (dur?: string): number => {
    if (!dur) return 4;
    if (dur.includes(':')) {
      const parts = dur.split(':').map((n) => parseFloat(n) || 0);
      if (parts.length === 2) return Math.min(18, Math.max(2, parts[0] * 60 + parts[1]));
    }
    const parsed = parseFloat(dur.replace(/[^0-9.]/g, ''));
    return isNaN(parsed) ? 3 : Math.min(15, Math.max(1.5, parsed));
  };

  const mapAssetToRole = (asset: UniversalAsset, fallbackRole: AudioTrackRole): AudioTrackRole => {
    if (fallbackRole) return fallbackRole;
    if (asset.category === 'voice') return 'voice';
    if (asset.category === 'music') return 'music';
    if (asset.category === 'sfx' && asset.subcategory.toLowerCase().includes('foley')) return 'foley';
    return 'sfx';
  };

  const handleLibraryDragStart = (e: React.DragEvent, asset: UniversalAsset) => {
    soundFx.unlock();
    e.dataTransfer.setData('application/x-studio-audio-asset', JSON.stringify(asset));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleClipDragStart = (e: React.DragEvent, clip: AudioTimelineClip) => {
    e.dataTransfer.setData('application/x-studio-timeline-clip', JSON.stringify(clip));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleLaneDrop = (e: React.DragEvent, role: AudioTrackRole) => {
    e.preventDefault();
    setDragOverRole(null);

    const laneEl = laneRefs.current[role];
    let dropStartSec = Math.max(0, Math.round(playheadSec * 2) / 2);
    if (laneEl) {
      const rect = laneEl.getBoundingClientRect();
      const offsetX = Math.max(0, e.clientX - rect.left + laneEl.scrollLeft);
      dropStartSec = Math.max(0, Math.min(timelineTotalSec - 2, Math.round((offsetX / pxPerSec) * 2) / 2));
    }

    const assetRaw = e.dataTransfer.getData('application/x-studio-audio-asset');
    if (assetRaw) {
      try {
        const asset: UniversalAsset = JSON.parse(assetRaw);
        const colorMap: Record<AudioTrackRole, string> = {
          voice: '#38bdf8',
          music: '#a855f7',
          sfx: '#f59e0b',
          foley: '#4ade80',
        };
        const newClip: AudioTimelineClip = {
          id: `aclip-${Date.now()}`,
          trackRole: mapAssetToRole(asset, role),
          name: asset.name,
          startSec: dropStartSec,
          durationSec: parseDurationSec(asset.duration),
          color: colorMap[role],
          sourceAssetId: asset.id,
          soundMethod: asset.specs.soundMethod,
          dialogueText: asset.category === 'voice' ? asset.description : undefined,
        };
        onAddClip(newClip);
        onSelectClip(newClip.id);
        soundFx.playShutterSound();
        return;
      } catch (_) {}
    }

    const existingClipRaw = e.dataTransfer.getData('application/x-studio-timeline-clip');
    if (existingClipRaw) {
      try {
        const movedClip: AudioTimelineClip = JSON.parse(existingClipRaw);
        onMoveClip(movedClip.id, dropStartSec, role);
        soundFx.playShutterSound();
      } catch (_) {}
    }
  };

  const quickAppendAsset = (asset: UniversalAsset) => {
    const targetRole: AudioTrackRole =
      asset.category === 'voice'
        ? 'voice'
        : asset.category === 'music'
        ? 'music'
        : asset.subcategory.toLowerCase().includes('foley')
        ? 'foley'
        : 'sfx';
    const laneClips = clips.filter((c) => c.trackRole === targetRole);
    const nextStart = laneClips.reduce((max, c) => Math.max(max, c.startSec + c.durationSec), 0);
    const colorMap: Record<AudioTrackRole, string> = {
      voice: '#38bdf8',
      music: '#a855f7',
      sfx: '#f59e0b',
      foley: '#4ade80',
    };

    const newClip: AudioTimelineClip = {
      id: `aclip-${Date.now()}`,
      trackRole: targetRole,
      name: asset.name,
      startSec: Math.min(timelineTotalSec - 3, nextStart),
      durationSec: parseDurationSec(asset.duration),
      color: colorMap[targetRole],
      sourceAssetId: asset.id,
      soundMethod: asset.specs.soundMethod,
      dialogueText: asset.category === 'voice' ? asset.description : undefined,
    };
    onAddClip(newClip);
    onSelectClip(newClip.id);
    soundFx.playScannerBeep();
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-xl">
      {/* Timeline Header & Transport */}
      <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono-cinema">
            Multitrack Audio Timeline
          </span>
          <span className="text-[11px] font-mono text-cyan-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
            {formatTime(playheadSec)} / 00:45.0
          </span>
        </div>

        {/* Transport & Zoom */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSeek(0)}
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300"
            title="Return to 00:00"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              isPlaying
                ? 'bg-rose-600 text-white shadow shadow-rose-600/30'
                : 'bg-purple-600 hover:bg-purple-500 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'Stop Timeline' : 'Play Mix Timeline'}</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-1">
            <button
              type="button"
              onClick={() => setPxPerSec((z) => Math.max(16, z - 4))}
              className="p-0.5 text-slate-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-slate-400 px-1">{pxPerSec}px/s</span>
            <button
              type="button"
              onClick={() => setPxPerSec((z) => Math.min(60, z + 4))}
              className="p-0.5 text-slate-400 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowMediaTray((v) => !v)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition-colors ${
              showMediaTray
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Library className="w-3.5 h-3.5" />
            <span>Media Drag Tray</span>
          </button>
        </div>
      </div>

      {/* Draggable Media Library Audio Assets Tray */}
      {showMediaTray && (
        <div className="border-b border-slate-800 bg-slate-950/60 p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <MoveHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Drag & drop any asset from the Media Library onto a timeline track below:</span>
            </div>

            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono">
              {(['all', 'voice', 'music', 'sfx'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setMediaFilter(cat)}
                  className={`px-2 py-0.5 rounded capitalize transition-colors ${
                    mediaFilter === cat ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {audioLibraryAssets.map((asset) => (
              <div
                key={asset.id}
                draggable
                onDragStart={(e) => handleLibraryDragStart(e, asset)}
                className="shrink-0 w-56 p-2 bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-purple-500/50 rounded-lg cursor-grab active:cursor-grabbing flex items-center justify-between gap-2 transition-colors group"
                title={`Drag "${asset.name}" onto any track lane`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <GripVertical className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-white truncate">{asset.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {asset.category.toUpperCase()} · {asset.duration || '3s'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => quickAppendAsset(asset)}
                  className="p-1 rounded bg-slate-950 hover:bg-purple-600 text-slate-400 hover:text-white border border-slate-800 shrink-0"
                  title="Append to matching track"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time Ruler + Layered Track Rows */}
      <div className="overflow-x-auto relative bg-[#07090f]">
        <div style={{ minWidth: `${180 + timelineTotalSec * pxPerSec}px` }}>
          {/* Ruler Row */}
          <div className="flex border-b border-slate-800 bg-slate-950 h-7 items-center">
            <div className="w-44 shrink-0 px-3 text-[10px] font-mono text-slate-500 border-r border-slate-800 h-full flex items-center">
              TRACK LAYERS
            </div>
            <div
              className="flex-1 relative h-full cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.max(0, e.clientX - rect.left);
                onSeek(Math.min(timelineTotalSec, Math.round((x / pxPerSec) * 10) / 10));
              }}
            >
              {Array.from({ length: Math.floor(timelineTotalSec / 5) + 1 }).map((_, idx) => {
                const sec = idx * 5;
                return (
                  <div
                    key={sec}
                    className="absolute top-0 bottom-0 border-l border-slate-800/90 pl-1 text-[9px] font-mono text-slate-500 flex items-center"
                    style={{ left: `${sec * pxPerSec}px` }}
                  >
                    {sec}s
                  </div>
                );
              })}

              {/* Playhead Handle */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-20 pointer-events-none"
                style={{ left: `${playheadSec * pxPerSec}px` }}
              >
                <div className="w-2.5 h-2.5 bg-cyan-400 -ml-1 rotate-45 -mt-0.5" />
              </div>
            </div>
          </div>

          {/* 4 Vertical Audio Track Lanes */}
          {tracks.map((track) => {
            const meta = LANE_META[track.role];
            const Icon = meta.icon;
            const laneClips = clips.filter((c) => c.trackRole === track.role);
            const effectiveGain = getEffectiveGain(track);
            const isAttenuated = effectiveGain <= 0.001;
            const isHovered = dragOverRole === track.role;

            return (
              <div
                key={track.id}
                className={`flex border-b border-slate-800/80 h-16 transition-colors ${
                  isAttenuated ? 'opacity-50' : ''
                }`}
              >
                {/* Left Track Header */}
                <div className="w-44 shrink-0 px-3 py-2 bg-slate-900/90 border-r border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${meta.accent}`} />
                      <span className="text-[11px] font-bold text-slate-200 truncate">{meta.label}</span>
                    </div>
                    {isAttenuated && <VolumeX className="w-3 h-3 text-rose-400 shrink-0" />}
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{meta.badge}</span>
                    <span>
                      {track.isMuted ? 'MUTED' : track.isSolo ? 'SOLO' : `${Math.round(effectiveGain * 100)}%`}
                    </span>
                  </div>
                </div>

                {/* Droppable Clip Lane */}
                <div
                  ref={(el) => {
                    laneRefs.current[track.role] = el;
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                    if (dragOverRole !== track.role) setDragOverRole(track.role);
                  }}
                  onDragLeave={() => {
                    if (dragOverRole === track.role) setDragOverRole(null);
                  }}
                  onDrop={(e) => handleLaneDrop(e, track.role)}
                  className={`flex-1 relative overflow-hidden transition-colors ${
                    isHovered
                      ? 'bg-purple-500/15 ring-1 ring-inset ring-purple-400/60'
                      : 'bg-[#080b12]'
                  }`}
                >
                  {/* Grid Lines */}
                  {Array.from({ length: Math.floor(timelineTotalSec / 5) + 1 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="absolute top-0 bottom-0 border-l border-slate-900 pointer-events-none"
                      style={{ left: `${idx * 5 * pxPerSec}px` }}
                    />
                  ))}

                  {/* Playhead Line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-cyan-400/70 z-20 pointer-events-none"
                    style={{ left: `${playheadSec * pxPerSec}px` }}
                  />

                  {/* Lane Clips */}
                  {laneClips.map((clip) => {
                    const isSelected = clip.id === selectedClipId;
                    const leftPx = clip.startSec * pxPerSec;
                    const widthPx = Math.max(54, clip.durationSec * pxPerSec);

                    return (
                      <div
                        key={clip.id}
                        draggable
                        onDragStart={(e) => handleClipDragStart(e, clip)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectClip(clip.id);
                          onAuditionClip(clip);
                        }}
                        style={{
                          left: `${leftPx}px`,
                          width: `${widthPx}px`,
                          borderColor: isSelected ? '#ffffff' : clip.color,
                        }}
                        className={`absolute top-1.5 bottom-1.5 rounded-lg border px-2 py-1 flex flex-col justify-between cursor-pointer select-none overflow-hidden transition-shadow group ${
                          isSelected
                            ? 'bg-slate-800/95 ring-2 ring-cyan-400/60 shadow-lg z-10'
                            : 'bg-slate-900/95 hover:bg-slate-800/90'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold text-white truncate" title={clip.name}>
                            {clip.name}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteClip(clip.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-400 transition-opacity"
                            title="Remove clip"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Simulated Waveform Strip + Assigned Voice Label */}
                        <div className="flex items-center justify-between gap-1 text-[9px] font-mono">
                          <span className="truncate" style={{ color: clip.color }}>
                            {clip.voiceProfileName ? `Voice: ${clip.voiceProfileName}` : `${clip.durationSec.toFixed(1)}s`}
                          </span>
                          <span className="text-slate-500 shrink-0">{clip.startSec.toFixed(1)}s</span>
                        </div>
                      </div>
                    );
                  })}

                  {laneClips.length === 0 && (
                    <div className="absolute inset-0 flex items-center px-4 text-[10px] font-mono text-slate-600 pointer-events-none">
                      Drop {meta.label.toLowerCase()} asset here...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
