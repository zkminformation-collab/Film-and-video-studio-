import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  Film,
  Layers,
  Lock,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Save,
} from 'lucide-react';
import { StudioTheme } from '../../types';

export interface AzStepState {
  stepNumber: number;
  module: string;
  creates: string;
  status: 'complete' | 'pending' | 'in_progress' | 'failed' | 'waiting_confirmation' | 'locked';
  note?: string;
  mappedLegacyStep?: number;
}

export interface GenerationJobItem {
  id: string;
  label: string;
  azStepNumber: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  detail?: string;
}

export interface RenderExportSettings {
  codec: 'H.264' | 'H.265';
  resolution: '720p' | '1080p' | '4K';
  fps: 24 | 25 | 30 | 60;
  audioCodec: 'AAC';
  subtitlesMode: 'Embedded' | 'Separate';
  quality: 'Standard' | 'High';
}

export interface AzProjectSummary {
  id: string;
  name: string;
  movieTitle?: string;
  projectType: string;
  animationStyle: string;
  aspectRatio: '16:9' | '9:16';
  language: string;
  durationMinutes?: number;
  resolution?: '1280x720' | '1920x1080' | '3840x2160';
  frameRate?: 24 | 25 | 30 | 60;
  finalApprovalConfirmed: boolean;
  approvalChecklist?: Record<string, boolean>;
  renderSettings?: RenderExportSettings;
  renderJob: {
    status: string;
    progress: number;
    verified: boolean;
    fileName?: string;
    fileSizeBytes?: number;
  };
  azSteps?: AzStepState[];
  azProgress?: number;
  generationJobs?: GenerationJobItem[];
  scenes: Array<{
    sceneNumber: number;
    title: string;
    subtitleText: string;
    durationSec: number;
  }>;
}

const APPROVAL_CHECKLIST_ITEMS = [
  { key: 'story', label: 'Story approved' },
  { key: 'characters', label: 'Characters approved' },
  { key: 'images', label: 'Images approved' },
  { key: 'clips', label: 'Video clips approved' },
  { key: 'voices', label: 'Voices approved' },
  { key: 'music', label: 'Music approved' },
  { key: 'sfx', label: 'SFX approved' },
  { key: 'vfx', label: 'VFX approved' },
  { key: 'subtitles', label: 'Subtitles approved' },
  { key: 'editing', label: 'Editing completed' },
  { key: 'quality', label: 'Quality check passed' },
  { key: 'preview', label: 'Final preview approved' },
];

interface Az23PipelineMonitorProps {
  theme: StudioTheme;
  project: AzProjectSummary;
  busyAction: string | null;
  onRunAzStep: (azStepNumber: number) => Promise<void>;
  onUpdateProjectMeta: (patch: Record<string, any>) => Promise<void>;
  onJumpToWorkflowStep: (legacyStepNumber: number) => void;
  onDownloadMp4: (projectId: string) => void;
}

export const Az23PipelineMonitor: React.FC<Az23PipelineMonitorProps> = ({
  theme,
  project,
  busyAction,
  onRunAzStep,
  onUpdateProjectMeta,
  onJumpToWorkflowStep,
  onDownloadMp4,
}) => {
  const isLight = theme === 'elevenlabs';
  const [jobFilter, setJobFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'failed'>('all');
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(project.name);
  const [titleDraft, setTitleDraft] = useState(project.movieTitle || project.name);
  const [langDraft, setLangDraft] = useState(project.language || 'Kannada');
  const [durationDraft, setDurationDraft] = useState(project.durationMinutes || 20);
  const [resDraft, setResDraft] = useState<'1280x720' | '1920x1080' | '3840x2160'>(
    project.resolution || '1920x1080'
  );
  const [fpsDraft, setFpsDraft] = useState<24 | 25 | 30 | 60>(project.frameRate || 24);

  const azSteps = project.azSteps || [];
  const azProgress = project.azProgress ?? 0;
  const jobs = project.generationJobs || [];
  const filteredJobs = jobs.filter((j) => jobFilter === 'all' || j.status === jobFilter);
  const checklist = project.approvalChecklist || {};
  const checkedCount = APPROVAL_CHECKLIST_ITEMS.filter((i) => Boolean(checklist[i.key])).length;

  const renderSettings: RenderExportSettings = project.renderSettings || {
    codec: 'H.264',
    resolution: '1080p',
    fps: 24,
    audioCodec: 'AAC',
    subtitlesMode: 'Embedded',
    quality: 'High',
  };

  const cardBg = isLight
    ? 'bg-white border-zinc-200 text-zinc-900'
    : 'bg-zinc-900/70 border-zinc-800 text-zinc-100';
  const subtleBg = isLight
    ? 'bg-zinc-50 border-zinc-200'
    : 'bg-zinc-950/70 border-zinc-800/80';

  const handleSaveMeta = async () => {
    await onUpdateProjectMeta({
      name: nameDraft.trim() || project.name,
      movieTitle: titleDraft.trim() || nameDraft.trim() || project.name,
      language: langDraft,
      durationMinutes: durationDraft,
      resolution: resDraft,
      frameRate: fpsDraft,
    });
    setIsRenaming(false);
  };

  const handleExportProjectBackup = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/[^a-zA-Z0-9_-]+/g, '_')}_backup.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportSubtitlesSrt = () => {
    let cursor = 0;
    const blocks = (project.scenes || []).map((sc, idx) => {
      const start = cursor;
      const end = cursor + (sc.durationSec || 4);
      cursor = end;
      const fmt = (sec: number) => {
        const m = String(Math.floor(sec / 60)).padStart(2, '0');
        const s = String(sec % 60).padStart(2, '0');
        return `00:${m}:${s},000`;
      };
      return `${idx + 1}\n${fmt(start)} --> ${fmt(end)}\n${sc.subtitleText || sc.title}\n`;
    });
    const blob = new Blob([blocks.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/[^a-zA-Z0-9_-]+/g, '_')}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const firstUnfinishedAzStep = azSteps.find(
    (s) => s.status === 'failed' || s.status === 'pending' || s.status === 'waiting_confirmation'
  );

  return (
    <div className="space-y-5">
      {/* Phase 1 Project Settings & Rename Bar */}
      <div className={`rounded-2xl border p-4 space-y-3 ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold">{project.movieTitle || project.name}</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                {project.id}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {project.language} · {project.animationStyle} · {project.durationMinutes || 20} min ·{' '}
              {project.resolution || '1920x1080'} · {project.frameRate || 24} FPS · {project.aspectRatio}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {firstUnfinishedAzStep && (
              <button
                onClick={() => onRunAzStep(firstUnfinishedAzStep.stepNumber)}
                disabled={Boolean(busyAction)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white text-xs font-bold shadow"
              >
                <Play className="w-3.5 h-3.5" />
                <span>
                  Resume Step {String(firstUnfinishedAzStep.stepNumber).padStart(2, '0')}:{' '}
                  {firstUnfinishedAzStep.module}
                </span>
              </button>
            )}
            <button
              onClick={() => {
                setNameDraft(project.name);
                setTitleDraft(project.movieTitle || project.name);
                setLangDraft(project.language || 'Kannada');
                setDurationDraft(project.durationMinutes || 20);
                setResDraft(project.resolution || '1920x1080');
                setFpsDraft(project.frameRate || 24);
                setIsRenaming((v) => !v);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isRenaming ? 'Cancel Edit' : 'Rename / Settings'}</span>
            </button>
          </div>
        </div>

        {/* Overall 23-step progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono text-zinc-400">
            <span>23-Step A–Z Movie Pipeline Progress</span>
            <span className="text-emerald-400 font-bold">
              {azSteps.filter((s) => s.status === 'complete').length} / {azSteps.length} Complete ({azProgress}%)
            </span>
          </div>
          <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${azProgress}%` }}
            />
          </div>
        </div>

        {/* Inline Rename & Settings Editor */}
        {isRenaming && (
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 rounded-xl border ${subtleBg}`}>
            <div>
              <label className="block text-[10px] font-mono text-zinc-400 mb-1">Project Name</label>
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-zinc-400 mb-1">Movie Title</label>
              <input
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-zinc-400 mb-1">Language</label>
              <select
                value={langDraft}
                onChange={(e) => setLangDraft(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white"
              >
                <option value="Kannada">Kannada</option>
                <option value="English">English</option>
                <option value="English + Kannada">English + Kannada</option>
                <option value="Hindi">Hindi</option>
                <option value="Tamil">Tamil</option>
                <option value="Telugu">Telugu</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-zinc-400 mb-1">Duration (minutes)</label>
              <input
                type="number"
                min={1}
                max={180}
                value={durationDraft}
                onChange={(e) => setDurationDraft(Number(e.target.value) || 20)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-zinc-400 mb-1">Resolution</label>
              <select
                value={resDraft}
                onChange={(e) => setResDraft(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white"
              >
                <option value="1280x720">1280 × 720 (HD)</option>
                <option value="1920x1080">1920 × 1080 (Full HD)</option>
                <option value="3840x2160">3840 × 2160 (4K UHD)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-zinc-400 mb-1">Frame Rate</label>
              <select
                value={fpsDraft}
                onChange={(e) => setFpsDraft(Number(e.target.value) as any)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white"
              >
                <option value={24}>24 FPS (Cinema)</option>
                <option value={25}>25 FPS (PAL)</option>
                <option value={30}>30 FPS (Standard)</option>
                <option value={60}>60 FPS (Smooth)</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
              <button
                onClick={handleSaveMeta}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Project Settings</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Two-Column Grid: 23-Step A-Z Tracker + Job Monitor / Approval / Export */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left 2 Columns: Complete 23-Step A-Z Production Workflow */}
        <div className={`xl:col-span-2 rounded-2xl border p-4 space-y-3 ${cardBg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Complete 23-Step A–Z Movie Creation Workflow
              </h4>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">
              All generated outputs auto-save to Unified Asset Library
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {azSteps.map((step) => {
              const isLocked = step.status === 'locked';
              const isDone = step.status === 'complete';
              const isFailed = step.status === 'failed';
              const isWait = step.status === 'waiting_confirmation';
              const isRunning = busyAction === `az-${step.stepNumber}`;

              return (
                <div
                  key={step.stepNumber}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-2 transition-colors ${
                    isFailed
                      ? 'border-rose-500/50 bg-rose-500/10'
                      : isDone
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : isWait
                      ? 'border-amber-500/40 bg-amber-500/10'
                      : subtleBg
                  }`}
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        {String(step.stepNumber).padStart(2, '0')}
                      </span>
                      <span className="text-xs font-bold truncate">{step.module}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">{step.creates}</p>
                    {step.note && (
                      <p className="text-[10px] font-mono text-zinc-500 truncate">{step.note}</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {isDone ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Done
                      </span>
                    ) : isFailed ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-rose-400">
                        <AlertTriangle className="w-3.5 h-3.5" /> Failed
                      </span>
                    ) : isLocked ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-zinc-500">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    ) : isWait ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-300">
                        <Clock className="w-3 h-3" /> Confirm
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-zinc-400">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      {step.stepNumber === 23 && isDone ? (
                        <button
                          onClick={() => onDownloadMp4(project.id)}
                          className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[10px] flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> MP4
                        </button>
                      ) : (
                        <button
                          disabled={isLocked || Boolean(busyAction)}
                          onClick={() => onRunAzStep(step.stepNumber)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                            isLocked
                              ? 'bg-zinc-800/60 text-zinc-600 cursor-not-allowed'
                              : isFailed
                              ? 'bg-rose-600 hover:bg-rose-500 text-white'
                              : isDone
                              ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                              : 'bg-purple-600 hover:bg-purple-500 text-white'
                          }`}
                        >
                          {isRunning ? 'Running...' : isFailed ? 'Retry' : isDone ? 'Re-run' : 'Run'}
                        </button>
                      )}
                      {step.mappedLegacyStep && (
                        <button
                          onClick={() => onJumpToWorkflowStep(step.mappedLegacyStep!)}
                          className="px-1.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-cyan-500/50 text-cyan-300 text-[10px]"
                          title="Open detailed step workspace"
                        >
                          Open
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Generation Jobs Monitor, 12-Item Final Approval & Render/Export Studio */}
        <div className="space-y-4">
          {/* Generation Jobs Monitor */}
          <div className={`rounded-2xl border p-4 space-y-3 ${cardBg}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Generation Job Monitor</h4>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">{jobs.length} jobs</span>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              {(['all', 'pending', 'processing', 'completed', 'failed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setJobFilter(tab)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono uppercase font-bold ${
                    jobFilter === tab
                      ? 'bg-purple-600 text-white'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab} ({tab === 'all' ? jobs.length : jobs.filter((j) => j.status === tab).length})
                </button>
              ))}
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${subtleBg}`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{job.label}</div>
                    {job.detail && (
                      <div className="text-[10px] font-mono text-zinc-500 truncate">{job.detail}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                        job.status === 'completed'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : job.status === 'failed'
                          ? 'bg-rose-500/15 text-rose-400'
                          : job.status === 'processing'
                          ? 'bg-cyan-500/15 text-cyan-300'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {job.status}
                    </span>
                    {job.status === 'failed' && (
                      <button
                        onClick={() => onRunAzStep(job.azStepNumber)}
                        disabled={Boolean(busyAction)}
                        className="p-1 rounded bg-rose-600 hover:bg-rose-500 text-white"
                        title="Retry failed job"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 21: 12-Item Final Approval Checklist */}
          <div className={`rounded-2xl border p-4 space-y-3 ${cardBg}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Step 21 · Final Approval</h4>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">
                {checkedCount}/{APPROVAL_CHECKLIST_ITEMS.length} checked
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {APPROVAL_CHECKLIST_ITEMS.map((item) => {
                const isChecked = Boolean(checklist[item.key]);
                return (
                  <label
                    key={item.key}
                    className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-[11px] cursor-pointer ${
                      isChecked
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                        : subtleBg
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) =>
                        onUpdateProjectMeta({
                          approvalChecklist: { [item.key]: e.target.checked },
                        })
                      }
                      className="accent-emerald-500"
                    />
                    <span className="truncate">{item.label}</span>
                  </label>
                );
              })}
            </div>

            <button
              onClick={() => onRunAzStep(21)}
              disabled={Boolean(busyAction) || project.finalApprovalConfirmed}
              className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                project.finalApprovalConfirmed
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 cursor-default'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 text-slate-950 shadow'
              }`}
            >
              {project.finalApprovalConfirmed ? '✓ COMPLETE MOVIE CONFIRMED' : 'CONFIRM COMPLETE MOVIE'}
            </button>
          </div>

          {/* Steps 22-23: Render Settings & Export Studio */}
          <div className={`rounded-2xl border p-4 space-y-3 ${cardBg}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Steps 22–23 · Render & Export</h4>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">{renderSettings.codec} / AAC</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 mb-1">Codec</label>
                <select
                  value={renderSettings.codec}
                  onChange={(e) =>
                    onUpdateProjectMeta({ renderSettings: { codec: e.target.value } })
                  }
                  className="w-full px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                >
                  <option value="H.264">H.264 (MP4)</option>
                  <option value="H.265">H.265 (HEVC)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 mb-1">Resolution</label>
                <select
                  value={renderSettings.resolution}
                  onChange={(e) =>
                    onUpdateProjectMeta({ renderSettings: { resolution: e.target.value } })
                  }
                  className="w-full px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                >
                  <option value="720p">720p HD</option>
                  <option value="1080p">1080p Full HD</option>
                  <option value="4K">4K UHD</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 mb-1">Frame Rate</label>
                <select
                  value={renderSettings.fps}
                  onChange={(e) =>
                    onUpdateProjectMeta({ renderSettings: { fps: Number(e.target.value) } })
                  }
                  className="w-full px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                >
                  <option value={24}>24 FPS</option>
                  <option value={25}>25 FPS</option>
                  <option value={30}>30 FPS</option>
                  <option value={60}>60 FPS</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 mb-1">Subtitles</label>
                <select
                  value={renderSettings.subtitlesMode}
                  onChange={(e) =>
                    onUpdateProjectMeta({ renderSettings: { subtitlesMode: e.target.value } })
                  }
                  className="w-full px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                >
                  <option value="Embedded">Embedded</option>
                  <option value="Separate">Separate (.SRT)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                onClick={() => onRunAzStep(22)}
                disabled={!project.finalApprovalConfirmed || Boolean(busyAction)}
                className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${
                  project.finalApprovalConfirmed
                    ? 'bg-purple-600 hover:bg-purple-500 text-white'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${busyAction === 'az-22' ? 'animate-spin' : ''}`} />
                <span>
                  {busyAction === 'az-22'
                    ? 'Rendering & Verifying MP4...'
                    : 'Render Final MP4 (FFmpeg)'}
                </span>
              </button>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => onDownloadMp4(project.id)}
                  disabled={!project.renderJob?.verified}
                  className={`py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 ${
                    project.renderJob?.verified
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  <Download className="w-3 h-3" /> MP4
                </button>
                <button
                  onClick={handleExportSubtitlesSrt}
                  className="py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold"
                >
                  Export .SRT
                </button>
                <button
                  onClick={handleExportProjectBackup}
                  className="py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold"
                >
                  Backup JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
