import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  Eye,
  Layers,
  Lock,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Wrench,
  X,
  AlertTriangle,
  Link2,
} from 'lucide-react';
import { StudioModule, StudioTheme } from '../../types';
import { useStudioAi } from '../../context/StudioAiContext';
import { soundFx } from '../../utils/audioSynth';
import { handleImageError } from '../../utils/imageUtils';
import {
  Az23PipelineMonitor,
  AzStepState,
  GenerationJobItem,
  RenderExportSettings,
} from './Az23PipelineMonitor';

export type StepStatus =
  | 'complete'
  | 'pending'
  | 'in_progress'
  | 'failed'
  | 'waiting_confirmation'
  | 'locked';

export type ProjectCategory = 'Cartoon Film' | 'Manhwa Animation' | 'Short Cartoon Video';

interface CartoonCharacter {
  id: string;
  name: string;
  role: string;
  appearancePrompt: string;
  consistencySeed: number;
  voiceStyle: string;
  avatarUrl: string;
}

interface CartoonSceneItem {
  id: string;
  sceneNumber: number;
  orderIndex: number;
  title: string;
  description: string;
  framing: 'Wide Shot' | 'Medium Shot' | 'Close-up' | 'Over-the-shoulder' | 'Establishing';
  characterIds: string[];
  characterSeedUsed: number;
  storyImageUrl: string;
  imageStatus: 'pending' | 'ready' | 'failed';
  videoClipStatus: 'pending' | 'ready' | 'failed' | 'corrupted';
  dialogueText: string;
  dialogueAudioStatus: 'pending' | 'ready' | 'missing';
  musicSfxPreset: string;
  musicSfxStatus: 'pending' | 'ready';
  vfxPreset: string;
  vfxStatus: 'pending' | 'ready';
  syncOffsetMs: number;
  syncStatus: 'pending' | 'synced' | 'out_of_sync';
  subtitleText: string;
  subtitleStatus: 'pending' | 'ready' | 'missing';
  durationSec: number;
  lastError?: string;
}

interface QualityIssueItem {
  id: string;
  sceneNumber?: number;
  category: string;
  severity: 'error' | 'warning';
  problem: string;
  suggestedFix: string;
  status: 'open' | 'fixed_verified' | 'ignored';
  verifiedAfterFix?: boolean;
  verifiedAt?: string;
}

interface StepStateEntry {
  stepNumber: number;
  key: string;
  label: string;
  phase: 'setup' | 'visual' | 'audio_vfx' | 'preview_edit' | 'approval_export';
  status: StepStatus;
  note?: string;
}

interface ReferenceImageAsset {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  sourceType: 'upload' | 'manhwa_url';
  addedAt: string;
}

interface CartoonFilmProject {
  id: string;
  name: string;
  projectType: ProjectCategory;
  animationStyle: string;
  aspectRatio: '16:9' | '9:16';
  language: string;
  thumbnailUrl: string;
  chapterUrl?: string;
  chapters?: string[];
  referenceImages?: ReferenceImageAsset[];
  storyPrompt: string;
  fullStory: string;
  characters: CartoonCharacter[];
  scenes: CartoonSceneItem[];
  storyboardGenerated: boolean;
  previewGenerated: boolean;
  previewStatus:
    | 'not_ready'
    | 'preview_ready_editing_required'
    | 'edited_ready_for_approval'
    | 'approved';
  timelineAdded: boolean;
  editingCompleted: boolean;
  watchedFinalPreview: boolean;
  finalApprovalConfirmed: boolean;
  qualityIssues: QualityIssueItem[];
  lastQualityCheckAt?: string;
  renderJob: {
    status: 'locked' | 'pending' | 'rendering' | 'completed' | 'failed';
    progress: number;
    verified: boolean;
    fileName?: string;
    fileSizeBytes?: number;
    durationSec?: number;
    errorMessage?: string;
    renderedAt?: string;
  };
  stepStates: StepStateEntry[];
  movieTitle?: string;
  durationMinutes?: number;
  resolution?: '1280x720' | '1920x1080' | '3840x2160';
  frameRate?: 24 | 25 | 30 | 60;
  approvalChecklist?: Record<string, boolean>;
  renderSettings?: RenderExportSettings;
  azSteps?: AzStepState[];
  azProgress?: number;
  generationJobs?: GenerationJobItem[];
  overallProgress: number;
  currentStepNumber: number;
  updatedAt: string;
  createdAt: string;
}

interface CartoonCreatorStudioProps {
  theme: StudioTheme;
  onNavigate: (module: StudioModule) => void;
}

const QUALITY_CHECK_RULES = [
  'Missing or duplicate scenes',
  'Character appearance changing between scenes',
  'Incorrect dialogue or missing audio',
  'Audio & video synchronization',
  'Black or corrupted video frames',
  'Missing images or media files',
  'Incorrect scene order',
  'Missing subtitles',
  'Video rendering errors',
];

export const CartoonCreatorStudio: React.FC<CartoonCreatorStudioProps> = ({
  theme,
  onNavigate,
}) => {
  const { addAssetToTimeline, addAudioClip, addQueueItem } = useStudioAi();
  const isLight = theme === 'elevenlabs';

  const [projects, setProjects] = useState<CartoonFilmProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [workspaceView, setWorkspaceView] = useState<'dashboard' | 'az23' | 'workflow' | 'quality'>('dashboard');
  const [activeStepNumber, setActiveStepNumber] = useState<number>(1);
  const [selectedSceneNumber, setSelectedSceneNumber] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Create new project inline drawer
  const [showNewForm, setShowNewForm] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newType, setNewType] = useState<ProjectCategory>('Cartoon Film');
  const [newStyle, setNewStyle] = useState<string>('3D Stylized Cartoon');
  const [newAspect, setNewAspect] = useState<'16:9' | '9:16'>('16:9');

  // Editable prompt & manual scene editor fields
  const [promptDraft, setPromptDraft] = useState<string>('');
  const [editingSceneNum, setEditingSceneNum] = useState<number | null>(null);
  const [sceneEditTitle, setSceneEditTitle] = useState<string>('');
  const [sceneEditDesc, setSceneEditDesc] = useState<string>('');
  const [sceneEditDialogue, setSceneEditDialogue] = useState<string>('');
  const [sceneEditVfx, setSceneEditVfx] = useState<string>('');
  const [sceneEditFraming, setSceneEditFraming] =
    useState<CartoonSceneItem['framing']>('Wide Shot');

  // Preview playback & approval gate
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);
  const [previewSceneIdx, setPreviewSceneIdx] = useState<number>(0);
  const [watchedAllScenesInSession, setWatchedAllScenesInSession] = useState<boolean>(false);
  const [chapterTitle, setChapterTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Reference image upload & Manhwa URL import state
  const [chapterUrlDraft, setChapterUrlDraft] = useState<string>('');
  const [isDraggingAssets, setIsDraggingAssets] = useState<boolean>(false);
  const assetPickerRef = useRef<HTMLInputElement | null>(null);

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0] || null;

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice((cur) => (cur?.text === text ? null : cur)), 5500);
  };

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cartoon-projects');
      const data = await res.json();
      if (Array.isArray(data.projects)) {
        setProjects(data.projects);
        setSelectedProjectId((prev) => prev || data.projects[0]?.id || null);
      }
    } catch {
      showToast('error', 'Could not load cartoon film projects.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (activeProject) {
      setPromptDraft(activeProject.storyPrompt || '');
      setChapterUrlDraft(activeProject.chapterUrl || '');
      setChapterTitle('');
      setWatchedAllScenesInSession(false);
      setIsPreviewPlaying(false);
      setPreviewSceneIdx(0);
    }
  }, [activeProject?.id]);

  const handleRunAzStep = async (azStepNumber: number) => {
    if (!activeProject) return;
    setBusyAction(`az-${azStepNumber}`);
    try {
      const res = await fetch(
        `/api/cartoon-projects/${encodeURIComponent(activeProject.id)}/az-step`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ azStepNumber, storyPrompt: promptDraft }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Step ${azStepNumber} could not complete.`);
      }
      if (data.project) {
        setProjects((prev) => prev.map((p) => (p.id === data.project.id ? data.project : p)));
      }
      showToast(
        'success',
        `Step ${String(azStepNumber).padStart(2, '0')} completed & synced to Unified Asset Library.`
      );
    } catch (err: any) {
      showToast('error', err?.message || `Step ${azStepNumber} failed.`);
    } finally {
      setBusyAction(null);
    }
  };

  const handleUpdateProjectMeta = async (patch: Record<string, any>) => {
    if (!activeProject) return;
    setBusyAction('meta-save');
    try {
      const res = await fetch(
        `/api/cartoon-projects/${encodeURIComponent(activeProject.id)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not save project settings.');
      }
      if (data.project) {
        setProjects((prev) => prev.map((p) => (p.id === data.project.id ? data.project : p)));
      }
      if (patch.newChapterTitle) setChapterTitle('');
      showToast('success', patch.newChapterTitle ? 'Chapter added.' : 'Project settings saved.');
    } catch (err: any) {
      showToast('error', err?.message || 'Could not update project.');
    } finally {
      setBusyAction(null);
    }
  };

  const previewScene = activeProject?.scenes[previewSceneIdx];

  useEffect(() => {
    if (!isPreviewPlaying || !previewScene || activeStepNumber !== 12) return;

    const speech = window.speechSynthesis;
    const text = previewScene.dialogueText?.trim();
    let speechFinished = !speech || !text;
    let sceneTimeElapsed = false;
    const advance = () => {
      if (!speechFinished || !sceneTimeElapsed) return;
      if (previewSceneIdx + 1 >= (activeProject?.scenes.length ?? 0)) {
        setIsPreviewPlaying(false);
        setWatchedAllScenesInSession(true);
        setPreviewSceneIdx(0);
      } else {
        setPreviewSceneIdx(previewSceneIdx + 1);
      }
    };
    const timer = window.setTimeout(() => {
      sceneTimeElapsed = true;
      advance();
    }, Math.max(2, previewScene.durationSec || 3) * 1000);

    let utterance: SpeechSynthesisUtterance | undefined;
    if (speech && text) {
      const languageCodes: Record<string, string> = {
        Kannada: 'kn-IN', English: 'en-US', Hindi: 'hi-IN', Tamil: 'ta-IN', Telugu: 'te-IN',
      };
      utterance = new SpeechSynthesisUtterance(text);
      const language = activeProject?.language || 'Kannada';
      utterance.lang = languageCodes[language] || language;
      utterance.onend = () => {
        speechFinished = true;
        advance();
      };
      utterance.onerror = () => {
        showToast('error', 'Preview voice unavailable for this browser or language.');
        setIsPreviewPlaying(false);
      };
      speech.speak(utterance);
    } else if (text) {
      showToast('error', 'Preview voice is unavailable in this browser.');
      setIsPreviewPlaying(false);
    }

    return () => {
      window.clearTimeout(timer);
      if (utterance) {
        utterance.onend = null;
        utterance.onerror = null;
        speech.cancel();
      }
    };
  }, [isPreviewPlaying, previewScene, previewSceneIdx, activeProject?.scenes.length, activeProject?.language, activeStepNumber]);

  const replaceProjectInState = (updated: CartoonFilmProject) => {
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === updated.id);
      return exists ? prev.map((p) => (p.id === updated.id ? updated : p)) : [updated, ...prev];
    });
    setSelectedProjectId(updated.id);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) {
      showToast('error', 'Please enter a project name.');
      return;
    }
    setBusyAction('creating');
    soundFx.playScannerBeep();
    try {
      const res = await fetch('/api/cartoon-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          projectType: newType,
          animationStyle: newStyle,
          aspectRatio: newAspect,
          storyPrompt: `Create a story based on the project title "${name}".`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Creation failed');
      replaceProjectInState(data.project);
      setShowNewForm(false);
      setNewName('');
      setWorkspaceView('workflow');
      setActiveStepNumber(3);
      showToast('success', `Created "${data.project.name}". Ready to generate full story.`);
    } catch (err: any) {
      showToast('error', err?.message || 'Could not create project.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleDeleteProject = async (id: string) => {
    setBusyAction(`del-${id}`);
    try {
      const res = await fetch(`/api/cartoon-projects/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (Array.isArray(data.projects)) {
        setProjects(data.projects);
        if (selectedProjectId === id) {
          setSelectedProjectId(data.projects[0]?.id || null);
        }
      }
      setConfirmDeleteId(null);
      showToast('info', 'Project deleted.');
    } catch {
      showToast('error', 'Could not delete project.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleUploadReferenceImages = async (projectId: string, fileList: FileList | null) => {
    const rawFiles = Array.from(fileList || []);
    if (rawFiles.length === 0) return;

    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
    const maxBytes = 10 * 1024 * 1024;
    const validFiles: File[] = [];
    let skippedType = 0;
    let skippedSize = 0;

    for (const f of rawFiles) {
      if (!allowed.has(f.type)) {
        skippedType++;
        continue;
      }
      if (f.size > maxBytes) {
        skippedSize++;
        continue;
      }
      validFiles.push(f);
    }

    if (validFiles.length === 0) {
      showToast(
        'error',
        skippedSize > 0
          ? 'Files exceeded the 10 MB limit per image.'
          : 'Only JPG, PNG, and WebP images are supported.'
      );
      return;
    }

    setBusyAction('upload-assets');
    soundFx.playScannerBeep();
    try {
      const encoded = await Promise.all(
        validFiles.map(
          (file) =>
            new Promise<{
              name: string;
              mimeType: string;
              sizeBytes: number;
              dataUrl: string;
              sourceType: 'upload';
            }>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () =>
                resolve({
                  name: file.name,
                  mimeType: file.type,
                  sizeBytes: file.size,
                  dataUrl: String(reader.result || ''),
                  sourceType: 'upload',
                });
              reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
              reader.readAsDataURL(file);
            })
        )
      );

      const res = await fetch(`/api/cartoon-projects/${encodeURIComponent(projectId)}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assets: encoded }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Upload failed');
      replaceProjectInState(data.project);

      const skippedNotes: string[] = [];
      if (skippedSize > 0) skippedNotes.push(`${skippedSize} exceeded 10 MB`);
      if (skippedType > 0) skippedNotes.push(`${skippedType} unsupported format`);
      showToast(
        'success',
        `${validFiles.length} reference image(s) saved to project${
          skippedNotes.length ? ` (${skippedNotes.join(', ')} skipped)` : ''
        }.`
      );
    } catch (err: any) {
      showToast('error', err?.message || 'Could not upload reference images.');
    } finally {
      setBusyAction(null);
      if (assetPickerRef.current) assetPickerRef.current.value = '';
    }
  };

  const handleRemoveReferenceAsset = async (projectId: string, assetId: string) => {
    setBusyAction(`del-asset-${assetId}`);
    try {
      const res = await fetch(
        `/api/cartoon-projects/${encodeURIComponent(projectId)}/assets/${encodeURIComponent(assetId)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Remove failed');
      replaceProjectInState(data.project);
      showToast('info', 'Reference image removed.');
    } catch (err: any) {
      showToast('error', err?.message || 'Could not remove image.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleImportManhwaChapterUrl = async (projectId: string) => {
    const cleanUrl = chapterUrlDraft.trim();
    if (!cleanUrl) {
      showToast('error', 'Paste a Manhwa chapter URL first.');
      return;
    }
    setBusyAction('manhwa-import');
    soundFx.playScannerBeep();
    try {
      const res = await fetch(
        `/api/cartoon-projects/${encodeURIComponent(projectId)}/manhwa-import`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chapterUrl: cleanUrl }),
        }
      );
      const data = await res.json();
      if (data.project) replaceProjectInState(data.project);
      if (data.success && (data.importedCount || 0) > 0) {
        showToast('success', `Imported ${data.importedCount} panel image(s) from chapter URL.`);
      } else {
        showToast(
          'info',
          data.message ||
            'Chapter URL saved. Some sites block automated fetching—upload your JPG/PNG/WebP panels directly if needed.'
        );
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Chapter URL import failed.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleRunStep = async (
    projectId: string,
    stepNumber: number,
    extra?: { sceneNumber?: number; restartFailedOnly?: boolean }
  ) => {
    setBusyAction(`step-${stepNumber}`);
    soundFx.playScannerBeep();
    try {
      const res = await fetch(`/api/cartoon-projects/${encodeURIComponent(projectId)}/run-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepNumber,
          storyPrompt: promptDraft,
          sceneNumber: extra?.sceneNumber,
          restartFailedOnly: extra?.restartFailedOnly,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Step execution failed');
      replaceProjectInState(data.project);
      addQueueItem({
        tool: 'AI Cartoon Creator',
        prompt: `${data.project.name} · Step ${stepNumber}`,
        provider: 'ZKMAP Studio Pipeline',
        status: 'Completed',
        progress: 100,
      });
      if (stepNumber === 12) {
        setPreviewSceneIdx(0);
        setIsPreviewPlaying(true);
        showToast('info', 'Status: Preview Ready — Editing Required before final approval.');
      } else {
        showToast('success', `Step ${stepNumber} updated cleanly.`);
      }
      return true;
    } catch (err: any) {
      showToast('error', err?.message || 'Could not execute step.');
      return false;
    } finally {
      setBusyAction(null);
    }
  };

  const handleRestartFailedSteps = async (project: CartoonFilmProject) => {
    const failedSteps = project.stepStates.filter((s) => s.status === 'failed');
    if (failedSteps.length === 0) {
      showToast('info', 'No failed steps found on this project.');
      return;
    }
    setBusyAction(`restart-${project.id}`);
    soundFx.playSlateBeep();
    try {
      let latest = project;
      for (const st of failedSteps) {
        if (st.stepNumber === 14) continue;
        const res = await fetch(`/api/cartoon-projects/${encodeURIComponent(project.id)}/run-step`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stepNumber: st.stepNumber, restartFailedOnly: true }),
        });
        const data = await res.json();
        if (res.ok && data.project) latest = data.project;
      }
      // Run quality check after restarting failed steps
      const qcRes = await fetch(`/api/cartoon-projects/${encodeURIComponent(project.id)}/quality-check`, {
        method: 'POST',
      });
      const qcData = await qcRes.json();
      if (qcRes.ok && qcData.project) latest = qcData.project;

      replaceProjectInState(latest);
      setSelectedProjectId(latest.id);
      setWorkspaceView('workflow');
      setActiveStepNumber(latest.currentStepNumber);
      showToast('success', `Restarted failed steps for "${latest.name}" and verified results.`);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to restart steps.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleRunQualityCheck = async (projectId: string) => {
    setBusyAction('quality-check');
    soundFx.playScannerBeep();
    try {
      const res = await fetch(`/api/cartoon-projects/${encodeURIComponent(projectId)}/quality-check`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Quality check failed');
      replaceProjectInState(data.project);
      if (data.openErrorsCount === 0) {
        showToast('success', 'AI Quality Checker passed all 9 checks with 0 open problems.');
      } else {
        showToast(
          'info',
          `AI Quality Checker found ${data.openErrorsCount} issue(s) requiring attention.`
        );
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Quality check failed.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleResolveQualityIssue = async (
    projectId: string,
    issue: QualityIssueItem,
    action: 'auto_fix' | 'retry' | 'ignore' | 'manual_verified'
  ) => {
    setBusyAction(`issue-${issue.id}`);
    soundFx.playScannerBeep();
    try {
      const res = await fetch(`/api/cartoon-projects/${encodeURIComponent(projectId)}/quality-fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId: issue.id, action }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Fix failed');
      replaceProjectInState(data.project);
      soundFx.playCinematicImpact();
      showToast(data.verifiedFixed ? 'success' : 'info', data.verificationNote);
    } catch (err: any) {
      showToast('error', err?.message || 'Could not resolve issue.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleOpenManualEdit = (project: CartoonFilmProject, issue?: QualityIssueItem) => {
    const targetNum = issue?.sceneNumber || selectedSceneNumber || 1;
    const scene = project.scenes.find((s) => s.sceneNumber === targetNum) || project.scenes[0];
    if (!scene) return;
    setSelectedSceneNumber(scene.sceneNumber);
    setEditingSceneNum(scene.sceneNumber);
    setSceneEditTitle(scene.title);
    setSceneEditDesc(scene.description);
    setSceneEditDialogue(scene.dialogueText);
    setSceneEditVfx(scene.vfxPreset);
    setSceneEditFraming(scene.framing);
    setWorkspaceView('workflow');
    setActiveStepNumber(14);
  };

  const handleSaveSceneEdit = async (projectId: string, sceneNumber: number, regenerate = false) => {
    setBusyAction(`scene-${sceneNumber}`);
    try {
      const res = await fetch(
        `/api/cartoon-projects/${encodeURIComponent(projectId)}/scenes/${sceneNumber}/update`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: sceneEditTitle,
            description: sceneEditDesc,
            dialogueText: sceneEditDialogue,
            subtitleText: sceneEditDialogue,
            vfxPreset: sceneEditVfx,
            framing: sceneEditFraming,
            regenerate,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Scene update failed');
      replaceProjectInState(data.project);
      setEditingSceneNum(null);
      showToast('success', `Scene ${sceneNumber} saved and re-verified.`);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to update scene.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleReorderScene = async (
    projectId: string,
    sceneNumber: number,
    moveDirection: 'up' | 'down'
  ) => {
    setBusyAction(`reorder-${sceneNumber}`);
    try {
      const res = await fetch(
        `/api/cartoon-projects/${encodeURIComponent(projectId)}/scenes/${sceneNumber}/update`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ moveDirection }),
        }
      );
      const data = await res.json();
      if (res.ok && data.project) replaceProjectInState(data.project);
    } finally {
      setBusyAction(null);
    }
  };

  const handleAddToTimeline = async (project: CartoonFilmProject, openEditorAfter = false) => {
    setBusyAction('timeline-sync');
    soundFx.playCinematicImpact();
    try {
      for (const sc of project.scenes) {
        addAssetToTimeline({
          id: `cartoon-${project.id}-s${sc.sceneNumber}`,
          name: `${project.name} · Sc ${sc.sceneNumber}: ${sc.title}`,
          category: 'animation',
          subcategory: project.projectType,
          source: 'ai_generated',
          format: 'MP4',
          resolution: project.aspectRatio === '9:16' ? '720x1280' : '1280x720',
          duration: `00:0${sc.durationSec}`,
          size: '4.2 MB',
          thumbnail: sc.storyImageUrl,
          description: sc.description,
          tags: [project.projectType, sc.framing],
          license: {
            type: 'AI Studio Creative License',
            commercialUse: true,
            attribution: 'ZKMAP STUDIO',
            certificateId: `CERT-${project.id}-S${sc.sceneNumber}`,
            verified: true,
          },
          specs: {
            codec: 'H.264',
            fps: 24,
            aspect: project.aspectRatio,
          },
          isFavorite: false,
          addedAt: new Date().toISOString(),
          usageCount: 1,
        });
        if (sc.dialogueText) {
          addAudioClip({
            id: `cartoon-vo-${project.id}-s${sc.sceneNumber}-${Date.now()}`,
            trackRole: 'voice',
            name: `Sc ${sc.sceneNumber} Dialogue`,
            startSec: (sc.sceneNumber - 1) * sc.durationSec,
            durationSec: sc.durationSec,
            color: '#38bdf8',
            dialogueText: sc.dialogueText,
            language: 'en-US',
          });
        }
      }

      const res = await fetch(`/api/cartoon-projects/${encodeURIComponent(project.id)}/run-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepNumber: 13 }),
      });
      const data = await res.json();
      if (res.ok && data.project) {
        replaceProjectInState(data.project);
      }

      if (openEditorAfter) {
        onNavigate('editor');
      } else {
        setActiveStepNumber(14);
        showToast('success', 'All scenes & voice tracks added to the Editing Timeline (Step 13 Complete).');
      }
    } catch {
      showToast('error', 'Failed to sync project to editing timeline.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleApproveFinalVideo = async (project: CartoonFilmProject) => {
    setBusyAction('approve');
    soundFx.playCinematicImpact();
    try {
      const res = await fetch(`/api/cartoon-projects/${encodeURIComponent(project.id)}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          watchedFinalPreview: project.watchedFinalPreview || watchedAllScenesInSession,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Approval check failed');
      replaceProjectInState(data.project);
      setActiveStepNumber(16);
      showToast('success', 'Final video confirmed! Step 16 (Render Final MP4) is now unlocked.');
    } catch (err: any) {
      showToast('error', err?.message || 'Could not confirm final approval.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleRenderFinalMp4 = async (project: CartoonFilmProject) => {
    setBusyAction('render-mp4');
    soundFx.playSlateBeep();
    try {
      const res = await fetch(`/api/cartoon-projects/${encodeURIComponent(project.id)}/render`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Final MP4 render failed');
      replaceProjectInState(data.project);
      setActiveStepNumber(17);
      soundFx.playCinematicImpact();
      showToast('success', 'Final MP4 rendered & verified! Download Final MP4 is now ready.');
    } catch (err: any) {
      if (err?.project) replaceProjectInState(err.project);
      showToast('error', err?.message || 'Final MP4 rendering error.');
    } finally {
      setBusyAction(null);
    }
  };

  const renderStepStatusLabel = (status: StepStatus) => {
    switch (status) {
      case 'complete':
        return { text: 'Complete', cls: 'text-emerald-600 dark:text-emerald-400', Icon: CheckCircle2 };
      case 'failed':
        return { text: 'Failed', cls: 'text-rose-600 dark:text-rose-400', Icon: AlertTriangle };
      case 'waiting_confirmation':
        return { text: 'Waiting for confirmation', cls: 'text-amber-600 dark:text-amber-400', Icon: Eye };
      case 'in_progress':
        return { text: 'Running', cls: 'text-sky-600 dark:text-sky-400', Icon: RefreshCw };
      case 'locked':
        return { text: 'Locked', cls: isLight ? 'text-neutral-400' : 'text-slate-500', Icon: Lock };
      default:
        return { text: 'Pending', cls: isLight ? 'text-neutral-500' : 'text-slate-400', Icon: Clock };
    }
  };

  const buildDashboardSummaryRows = (p: CartoonFilmProject) => {
    const step = (n: number) => p.stepStates.find((s) => s.stepNumber === n);
    const failedVideoCount = p.scenes.filter(
      (s) => s.videoClipStatus === 'failed' || s.videoClipStatus === 'corrupted'
    ).length;

    return [
      {
        task: 'Story generation',
        stepNum: 3,
        label: step(3)?.status === 'complete' ? 'Complete' : 'Pending',
        tone: step(3)?.status === 'complete' ? 'ok' : 'pending',
      },
      {
        task: 'Character generation',
        stepNum: 4,
        label: step(4)?.status === 'complete' ? 'Complete' : 'Pending',
        tone: step(4)?.status === 'complete' ? 'ok' : 'pending',
      },
      {
        task: 'Story images',
        stepNum: 6,
        label: step(6)?.status === 'complete' ? 'Complete' : step(6)?.status === 'failed' ? 'Failed' : 'Pending',
        tone: step(6)?.status === 'complete' ? 'ok' : step(6)?.status === 'failed' ? 'fail' : 'pending',
      },
      {
        task: 'Cartoon video',
        stepNum: 7,
        label:
          failedVideoCount > 0
            ? `${failedVideoCount} scenes failed`
            : step(7)?.status === 'complete'
            ? 'Complete'
            : 'Pending',
        tone: failedVideoCount > 0 ? 'warn' : step(7)?.status === 'complete' ? 'ok' : 'pending',
      },
      {
        task: 'Audio generation',
        stepNum: 8,
        label:
          step(8)?.status === 'failed'
            ? 'Missing audio'
            : step(8)?.status === 'complete'
            ? 'Complete'
            : 'Pending',
        tone: step(8)?.status === 'failed' ? 'fail' : step(8)?.status === 'complete' ? 'ok' : 'pending',
      },
      {
        task: 'VFX',
        stepNum: 10,
        label: step(10)?.status === 'complete' ? 'Complete' : 'Pending',
        tone: step(10)?.status === 'complete' ? 'ok' : 'pending',
      },
      {
        task: 'Editing',
        stepNum: 14,
        label:
          step(14)?.status === 'complete'
            ? 'Complete'
            : step(14)?.status === 'failed'
            ? 'Fix Mistakes'
            : step(12)?.status === 'complete'
            ? 'Editing Required'
            : 'Pending',
        tone:
          step(14)?.status === 'complete'
            ? 'ok'
            : step(14)?.status === 'failed'
            ? 'fail'
            : 'pending',
      },
      {
        task: 'Final export',
        stepNum: 17,
        label:
          step(17)?.status === 'complete'
            ? 'Ready (MP4 Verified)'
            : step(15)?.status === 'waiting_confirmation'
            ? 'Waiting Approval'
            : 'Locked',
        tone:
          step(17)?.status === 'complete'
            ? 'ok'
            : step(15)?.status === 'waiting_confirmation'
            ? 'warn'
            : 'locked',
      },
    ];
  };

  const cardSurface = isLight
    ? 'bg-white border-neutral-200 text-neutral-950'
    : 'bg-[#0d111c] border-slate-800 text-slate-100';
  const mutedSurface = isLight
    ? 'bg-[#FAFAFB] border-neutral-200 text-neutral-800'
    : 'bg-slate-900/70 border-slate-800 text-slate-200';
  const inputCls = isLight
    ? 'bg-white border border-neutral-300 text-neutral-950 focus:border-neutral-900'
    : 'bg-slate-950 border border-slate-700 text-white focus:border-slate-400';

  const openIssues = activeProject?.qualityIssues.filter((q) => q.status === 'open') || [];
  const fixedVerifiedIssues =
    activeProject?.qualityIssues.filter((q) => q.status === 'fixed_verified') || [];

  return (
    <div
      className={`flex-1 overflow-y-auto px-6 py-6 md:px-10 ${
        isLight ? 'bg-white text-neutral-950' : 'bg-[#090b11] text-slate-100'
      }`}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Studio Header Bar */}
        <div
          className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b ${
            isLight ? 'border-neutral-200' : 'border-slate-800'
          }`}
        >
          <div className="space-y-1">
            <div
              className={`flex items-center gap-2 text-xs ${
                isLight ? 'text-neutral-500' : 'text-slate-400'
              }`}
            >
              <span>ZKMAP STUDIO</span>
              <span aria-hidden="true">·</span>
              <span>17-Step Creation Workflow</span>
              <span aria-hidden="true">·</span>
              <span>AI Quality Checker &amp; Approval Gate</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              AI Cartoon Film Creator
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Sub-view Switcher */}
            <div
              className={`flex items-center gap-1 p-1 rounded-xl border ${
                isLight ? 'bg-neutral-100 border-neutral-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              {[
                { id: 'dashboard', label: `All Projects (${projects.length})` },
                { id: 'az23', label: '23-Step A–Z Pipeline & Jobs' },
                { id: 'workflow', label: 'Step-by-Step Studio' },
                {
                  id: 'quality',
                  label: `AI Quality Checker${openIssues.length > 0 ? ` (${openIssues.length})` : ''}`,
                },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setWorkspaceView(t.id as 'dashboard' | 'az23' | 'workflow' | 'quality')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    workspaceView === t.id
                      ? isLight
                        ? 'bg-white text-neutral-950 shadow-sm'
                        : 'bg-white text-black'
                      : isLight
                      ? 'text-neutral-600 hover:text-neutral-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowNewForm((v) => !v)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                isLight
                  ? 'bg-neutral-950 text-white hover:bg-black'
                  : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {notice && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
              notice.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300'
                : notice.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
            }`}
          >
            <span className="font-medium">{notice.text}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="p-1 opacity-70 hover:opacity-100"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Inline New Project Creation Form */}
        {showNewForm && (
          <form onSubmit={handleCreateProject} className={`p-5 rounded-2xl border space-y-4 ${cardSurface}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">Create New Cartoon / Manhwa Film Project</h2>
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="md:col-span-2 space-y-1">
                <label htmlFor="new-cartoon-project-name" className="font-medium opacity-75">Project Name</label>
                <input
                  type="text"
                  id="new-cartoon-project-name"
                  required
                  maxLength={120}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={`Project ${String(projects.length + 1).padStart(3, '0')} – Cartoon Adventure`}
                  className={`w-full rounded-lg px-3 py-2 outline-none ${inputCls}`}
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium opacity-75">Project Category</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as ProjectCategory)}
                  className={`w-full rounded-lg px-3 py-2 outline-none ${inputCls}`}
                >
                  <option value="Cartoon Film">Cartoon Film</option>
                  <option value="Manhwa Animation">Manhwa Animation</option>
                  <option value="Short Cartoon Video">Short Cartoon Video</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-medium opacity-75">Aspect Ratio</label>
                <select
                  value={newAspect}
                  onChange={(e) => setNewAspect(e.target.value as '16:9' | '9:16')}
                  className={`w-full rounded-lg px-3 py-2 outline-none ${inputCls}`}
                >
                  <option value="16:9">Landscape 16:9</option>
                  <option value="9:16">Vertical 9:16</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium opacity-75">Visual Style</label>
                <select
                  value={newStyle}
                  onChange={(e) => setNewStyle(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 outline-none ${inputCls}`}
                >
                  <option value="3D Stylized Cartoon">3D Stylized Cartoon</option>
                  <option value="2D Cel-Shaded Cartoon">2D Cel-Shaded Cartoon</option>
                  <option value="2D Cel Manhwa + Motion Parallax">2D Cel Manhwa + Motion Parallax</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-slate-700 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busyAction === 'creating'}
                className={`px-5 py-2 rounded-lg text-xs font-semibold ${
                  isLight ? 'bg-neutral-950 text-white' : 'bg-amber-500 text-slate-950'
                }`}
              >
                {busyAction === 'creating' ? 'Creating...' : 'Create Project & Enter Workflow'}
              </button>
            </div>
          </form>
        )}

        {/* VIEW 1: MULTI-PROJECT DASHBOARD */}
        {workspaceView === 'dashboard' && (
          <div className="space-y-6">
            {isLoading ? (
              <div className={`p-10 text-center text-xs rounded-2xl border ${cardSurface}`}>
                Loading studio projects...
              </div>
            ) : projects.length === 0 ? (
              <div className={`p-12 text-center rounded-2xl border space-y-3 ${cardSurface}`}>
                <p className="text-sm font-semibold">No AI Cartoon Projects Yet</p>
                <p className="text-xs opacity-70 max-w-md mx-auto">
                  Create your first step-by-step cartoon film, Manhwa animation, or short cartoon video with built-in mistake detection and final approval controls.
                </p>
                <button
                  type="button"
                  onClick={() => setShowNewForm(true)}
                  className="px-4 py-2 rounded-xl bg-neutral-950 text-white text-xs font-semibold"
                >
                  Create First Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {projects.map((proj) => {
                  const completedCount = proj.stepStates.filter((s) => s.status === 'complete').length;
                  const pendingCount = proj.stepStates.filter(
                    (s) => s.status === 'pending' || s.status === 'waiting_confirmation'
                  ).length;
                  const failedSteps = proj.stepStates.filter((s) => s.status === 'failed');
                  const projectOpenErrors = proj.qualityIssues.filter((q) => q.status === 'open');
                  const currentStepDef = proj.stepStates.find(
                    (s) => s.stepNumber === proj.currentStepNumber
                  );
                  const summaryRows = buildDashboardSummaryRows(proj);

                  return (
                    <div
                      key={proj.id}
                      className={`rounded-2xl border p-5 flex flex-col justify-between gap-5 ${cardSurface}`}
                    >
                      <div className="space-y-4">
                        {/* Top Project Identity & Thumbnail */}
                        <div className="flex items-start gap-4">
                          <img
                            src={proj.thumbnailUrl}
                            alt={proj.name}
                            referrerPolicy="no-referrer"
                            onError={(e) => handleImageError(e, proj.name)}
                            className="w-28 h-20 rounded-xl object-cover shrink-0 border border-neutral-200 dark:border-slate-700"
                          />
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h2 className="text-base font-bold truncate">{proj.name}</h2>
                              {confirmDeleteId === proj.id ? (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => void handleDeleteProject(proj.id)}
                                    className="px-2 py-1 text-[11px] font-semibold bg-rose-600 text-white rounded"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="px-2 py-1 text-[11px] rounded border border-neutral-300 dark:border-slate-700"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(proj.id)}
                                  className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:text-rose-600 shrink-0"
                                  title="Delete project"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <div
                              className={`text-xs flex flex-wrap items-center gap-1.5 ${
                                isLight ? 'text-neutral-500' : 'text-slate-400'
                              }`}
                            >
                              <span>{proj.projectType}</span>
                              <span aria-hidden="true">·</span>
                              <span>{proj.animationStyle}</span>
                              <span aria-hidden="true">·</span>
                              <span>{proj.aspectRatio}</span>
                            </div>

                            <div className="pt-1 space-y-1">
                              <div className="flex items-center justify-between text-xs tabular-nums">
                                <span className="font-medium">
                                  Current: Step {proj.currentStepNumber} — {currentStepDef?.label}
                                </span>
                                <span className="font-mono-cinema font-bold">{proj.overallProgress}%</span>
                              </div>
                              <div
                                className={`h-2 rounded-full overflow-hidden ${
                                  isLight ? 'bg-neutral-200' : 'bg-slate-800'
                                }`}
                              >
                                <div
                                  className={`h-full transition-all ${
                                    failedSteps.length > 0
                                      ? 'bg-amber-500'
                                      : proj.finalApprovalConfirmed
                                      ? 'bg-emerald-500'
                                      : 'bg-sky-500'
                                  }`}
                                  style={{ width: `${proj.overallProgress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Step & Error Counts Summary */}
                        <div className="grid grid-cols-4 gap-2 text-xs tabular-nums pt-1">
                          <div className={`p-2.5 rounded-xl border ${mutedSurface}`}>
                            <div className="text-[11px] opacity-70">Completed</div>
                            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                              {completedCount}/17
                            </div>
                          </div>
                          <div className={`p-2.5 rounded-xl border ${mutedSurface}`}>
                            <div className="text-[11px] opacity-70">Pending</div>
                            <div className="text-base font-bold">{pendingCount}</div>
                          </div>
                          <div className={`p-2.5 rounded-xl border ${mutedSurface}`}>
                            <div className="text-[11px] opacity-70">Failed Steps</div>
                            <div
                              className={`text-base font-bold ${
                                failedSteps.length > 0 ? 'text-rose-600 dark:text-rose-400' : ''
                              }`}
                            >
                              {failedSteps.length}
                            </div>
                          </div>
                          <div className={`p-2.5 rounded-xl border ${mutedSurface}`}>
                            <div className="text-[11px] opacity-70">Errors to Fix</div>
                            <div
                              className={`text-base font-bold ${
                                projectOpenErrors.length > 0 ? 'text-amber-600 dark:text-amber-400' : ''
                              }`}
                            >
                              {projectOpenErrors.length}
                            </div>
                          </div>
                        </div>

                        {/* Task Status Table (Matches Prompt Section 2) */}
                        <div className={`rounded-xl border overflow-hidden ${mutedSurface}`}>
                          <table className="w-full text-xs">
                            <thead>
                              <tr
                                className={`border-b text-left ${
                                  isLight ? 'border-neutral-200 text-neutral-500' : 'border-slate-800 text-slate-400'
                                }`}
                              >
                                <th className="py-2 px-3 font-medium">Task</th>
                                <th className="py-2 px-3 font-medium text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200/70 dark:divide-slate-800">
                              {summaryRows.map((row) => (
                                <tr
                                  key={row.task}
                                  onClick={() => {
                                    setSelectedProjectId(proj.id);
                                    setActiveStepNumber(row.stepNum);
                                    setWorkspaceView('workflow');
                                  }}
                                  className="cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                >
                                  <td className="py-2 px-3 font-medium">{row.task}</td>
                                  <td className="py-2 px-3 text-right font-mono-cinema">
                                    <span
                                      className={
                                        row.tone === 'ok'
                                          ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                          : row.tone === 'warn'
                                          ? 'text-amber-600 dark:text-amber-400 font-semibold'
                                          : row.tone === 'fail'
                                          ? 'text-rose-600 dark:text-rose-400 font-semibold'
                                          : row.tone === 'locked'
                                          ? 'opacity-50'
                                          : 'opacity-80'
                                      }
                                    >
                                      {row.label}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProjectId(proj.id);
                            setActiveStepNumber(proj.currentStepNumber);
                            setWorkspaceView('workflow');
                          }}
                          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap ${
                            isLight
                              ? 'bg-neutral-950 text-white hover:bg-black'
                              : 'bg-white text-black hover:bg-slate-200'
                          }`}
                        >
                          <span>Continue Project</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        {failedSteps.length > 0 && (
                          <button
                            type="button"
                            disabled={busyAction === `restart-${proj.id}`}
                            onClick={() => void handleRestartFailedSteps(proj)}
                            className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>
                              {busyAction === `restart-${proj.id}` ? 'Restarting...' : 'Restart Failed Step'}
                            </span>
                          </button>
                        )}

                        {projectOpenErrors.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProjectId(proj.id);
                              setWorkspaceView('quality');
                            }}
                            className="py-2.5 px-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-semibold whitespace-nowrap"
                          >
                            Fix {projectOpenErrors.length} Errors
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 1B: PHASE 1 — 23-STEP A–Z WORKFLOW PIPELINE & GENERATION JOB MONITOR */}
        {workspaceView === 'az23' && activeProject && (
          <Az23PipelineMonitor
            theme={theme}
            project={activeProject}
            busyAction={busyAction}
            onRunAzStep={handleRunAzStep}
            onUpdateProjectMeta={handleUpdateProjectMeta}
            onJumpToWorkflowStep={(legacyStep) => {
              setActiveStepNumber(legacyStep);
              setWorkspaceView('workflow');
            }}
            onDownloadMp4={(projectId) => {
              const a = document.createElement('a');
              a.href = `/api/cartoon-projects/${encodeURIComponent(projectId)}/download-mp4`;
              a.download = `${activeProject.name.replace(/[^a-zA-Z0-9_-]+/g, '_')}.mp4`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
          />
        )}

        {/* VIEW 2: STEP-BY-STEP 17-STAGE WORKFLOW WORKSPACE */}
        {workspaceView === 'workflow' && activeProject && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Project Switcher & All 17 Steps */}
            <aside className={`lg:col-span-4 rounded-2xl border p-4 space-y-4 ${cardSurface}`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setWorkspaceView('dashboard')}
                    className="inline-flex items-center gap-1 font-medium opacity-75 hover:opacity-100"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>All Projects</span>
                  </button>
                  <span className="font-mono-cinema font-bold tabular-nums">
                    {activeProject.overallProgress}% Done
                  </span>
                </div>

                <select
                  value={activeProject.id}
                  onChange={(e) => {
                    const target = projects.find((p) => p.id === e.target.value);
                    if (target) {
                      setSelectedProjectId(target.id);
                      setActiveStepNumber(target.currentStepNumber);
                    }
                  }}
                  aria-label="Switch cartoon project"
                  className={`w-full rounded-xl px-3 py-2 text-xs font-semibold outline-none ${inputCls}`}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.overallProgress}%)
                    </option>
                  ))}
                </select>
              </div>

              <section className="space-y-2 text-xs">
                <h3 className="font-semibold">Chapters</h3>
                <ul className="list-disc space-y-1 pl-5">
                  {(activeProject.chapters ?? ['Chapter 1']).map((title, index) => (
                    <li key={index} className="break-words">{title}</li>
                  ))}
                </ul>
                <form
                  className="flex flex-wrap gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (chapterTitle.trim() && !busyAction) {
                      void handleUpdateProjectMeta({ newChapterTitle: chapterTitle.trim() });
                    }
                  }}
                >
                  <input
                    aria-label="New chapter title"
                    placeholder="New chapter title"
                    value={chapterTitle}
                    maxLength={120}
                    onChange={(event) => setChapterTitle(event.target.value)}
                    className={`min-w-0 flex-1 rounded-lg px-3 py-2 ${inputCls}`}
                  />
                  <button type="submit" disabled={!chapterTitle.trim() || Boolean(busyAction)}
                    className="rounded-lg border border-current px-3 py-2 font-semibold disabled:opacity-50">
                    Add Chapter
                  </button>
                </form>
              </section>

              {/* Complete 17-Step Checklist */}
              <div className="space-y-1 max-h-[640px] overflow-y-auto pr-1">
                {activeProject.stepStates.map((st) => {
                  const meta = renderStepStatusLabel(st.status);
                  const Icon = meta.Icon;
                  const isActive = activeStepNumber === st.stepNumber;

                  return (
                    <button
                      key={st.stepNumber}
                      type="button"
                      onClick={() => setActiveStepNumber(st.stepNumber)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs flex items-start justify-between gap-2 transition-colors ${
                        isActive
                          ? isLight
                            ? 'bg-neutral-950 text-white border-neutral-950'
                            : 'bg-slate-800 text-white border-slate-600'
                          : isLight
                          ? 'bg-[#FAFAFB] border-neutral-200/80 hover:bg-neutral-100 text-neutral-900'
                          : 'bg-slate-900/50 border-slate-800 hover:bg-slate-900 text-slate-200'
                      }`}
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="font-semibold truncate">
                          {st.stepNumber}. {st.label}
                        </div>
                        {st.note && (
                          <div
                            className={`text-[11px] truncate ${
                              isActive ? 'opacity-80' : 'opacity-60'
                            }`}
                          >
                            {st.note}
                          </div>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium shrink-0 ${
                          isActive && st.status === 'pending' ? 'text-white/80' : meta.cls
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{meta.text}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Right Main Column: Active Step Execution & Preview/Editing/Approval Controls */}
            <div className="lg:col-span-8 space-y-5">
              {/* Post-Preview Mandatory Warning Banner whenever Preview is ready and Editing/Approval isn't finished */}
              {activeProject.previewStatus === 'preview_ready_editing_required' && (
                <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-amber-800 dark:text-amber-300">
                        Status: Preview Ready — Editing Required
                      </div>
                      <p className="text-xs text-amber-900/80 dark:text-amber-200/80">
                        Preview is not final confirmation. Add to Editing Timeline, fix any detected mistakes, and run Quality Check before Final Approval unlocks.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleAddToTimeline(activeProject, false)}
                      className="px-3 py-1.5 rounded-lg bg-neutral-950 text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Add to Editing Timeline</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleAddToTimeline(activeProject, true)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap ${cardSurface}`}
                    >
                      Edit Video
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('ai_voice')}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap ${cardSurface}`}
                    >
                      Edit Audio
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('vfx')}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap ${cardSurface}`}
                    >
                      Edit VFX
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void handleRunStep(activeProject.id, 7, { sceneNumber: selectedSceneNumber })
                      }
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap ${cardSurface}`}
                    >
                      Regenerate Scene {selectedSceneNumber}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void handleRunQualityCheck(activeProject.id);
                        setWorkspaceView('quality');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold whitespace-nowrap"
                    >
                      Run Quality Check
                    </button>
                  </div>
                </div>
              )}

              {/* Active Step Card */}
              <div className={`rounded-2xl border p-6 space-y-6 ${cardSurface}`}>
                {(() => {
                  const stepMeta = activeProject.stepStates.find(
                    (s) => s.stepNumber === activeStepNumber
                  );
                  const statusUi = stepMeta ? renderStepStatusLabel(stepMeta.status) : null;
                  return (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-slate-800 pb-4">
                      <div>
                        <div className="text-xs opacity-60">
                          Step {activeStepNumber} of 17 · {activeProject.name}
                        </div>
                        <h2 className="text-lg font-bold">{stepMeta?.label}</h2>
                      </div>
                      {statusUi && (
                        <div className={`inline-flex items-center gap-1.5 text-xs font-semibold ${statusUi.cls}`}>
                          <statusUi.Icon className="w-4 h-4" />
                          <span>{statusUi.text}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* STEPS 1 - 2: Project Setup, Story Prompt & Reference Assets */}
                {activeStepNumber <= 2 && (
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Story Prompt</label>
                      <textarea
                        rows={4}
                        value={promptDraft}
                        onChange={(e) => setPromptDraft(e.target.value)}
                        className={`w-full rounded-xl p-3 text-sm outline-none ${inputCls}`}
                      />
                    </div>

                    {/* Reference Images Upload & Manhwa Chapter URL Importer */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      <div className={`lg:col-span-5 p-4 rounded-xl border space-y-3 ${mutedSurface}`}>
                        <div className="text-xs font-bold">Reference Images &amp; Chapter Import</div>
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDraggingAssets(true);
                          }}
                          onDragLeave={() => setIsDraggingAssets(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingAssets(false);
                            void handleUploadReferenceImages(activeProject.id, e.dataTransfer.files);
                          }}
                          className={`rounded-xl border border-dashed p-5 text-center space-y-2 transition-colors ${
                            isDraggingAssets
                              ? 'border-amber-500 bg-amber-500/10'
                              : isLight
                              ? 'border-neutral-300 bg-white'
                              : 'border-slate-700 bg-slate-950/60'
                          }`}
                        >
                          <Upload className="w-6 h-6 mx-auto opacity-70" />
                          <div className="text-xs font-semibold">Drag &amp; drop images here</div>
                          <button
                            type="button"
                            disabled={busyAction === 'upload-assets'}
                            onClick={() => assetPickerRef.current?.click()}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
                              isLight ? 'bg-neutral-950 text-white' : 'bg-amber-500 text-slate-950'
                            }`}
                          >
                            {busyAction === 'upload-assets' ? 'Uploading...' : 'Choose Images'}
                          </button>
                          <input
                            ref={assetPickerRef}
                            type="file"
                            hidden
                            multiple
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) =>
                              void handleUploadReferenceImages(activeProject.id, e.target.files)
                            }
                          />
                          <div className="text-[11px] opacity-65">
                            JPG, PNG, WebP · maximum 10 MB each
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <label className="text-xs font-medium flex items-center gap-1.5">
                            <Link2 className="w-3.5 h-3.5" />
                            <span>Paste Manhwa chapter link</span>
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              value={chapterUrlDraft}
                              onChange={(e) => setChapterUrlDraft(e.target.value)}
                              placeholder="https://example.com/chapter/1"
                              className={`flex-1 min-w-0 rounded-lg px-3 py-1.5 text-xs outline-none ${inputCls}`}
                            />
                            <button
                              type="button"
                              disabled={busyAction === 'manhwa-import'}
                              onClick={() => void handleImportManhwaChapterUrl(activeProject.id)}
                              className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-slate-700 text-xs font-semibold shrink-0"
                            >
                              {busyAction === 'manhwa-import' ? 'Loading...' : 'Load'}
                            </button>
                          </div>
                          <p className="text-[11px] opacity-65 leading-relaxed">
                            Only import chapters you own or have permission to use. Some sites block automated access.
                          </p>
                        </div>
                      </div>

                      <div className={`lg:col-span-7 p-4 rounded-xl border space-y-3 ${mutedSurface}`}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold">
                            Image Gallery ({(activeProject.referenceImages || []).length})
                          </span>
                          <span className="opacity-65">Saved on server</span>
                        </div>
                        {(activeProject.referenceImages || []).length === 0 ? (
                          <div className="h-44 rounded-xl border border-dashed border-neutral-300 dark:border-slate-700 flex items-center justify-center text-xs opacity-65 px-4 text-center">
                            Your uploaded reference images or imported chapter panels will appear here and feed directly into storyboard &amp; MP4 rendering.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
                            {(activeProject.referenceImages || []).map((asset) => (
                              <div
                                key={asset.id}
                                className={`relative rounded-lg overflow-hidden border ${cardSurface}`}
                              >
                                <img
                                  src={asset.url}
                                  alt={asset.name}
                                  referrerPolicy="no-referrer"
                                  onError={(e) => handleImageError(e, asset.name)}
                                  className="w-full h-24 object-cover"
                                />
                                <button
                                  type="button"
                                  disabled={busyAction === `del-asset-${asset.id}`}
                                  onClick={() =>
                                    void handleRemoveReferenceAsset(activeProject.id, asset.id)
                                  }
                                  title="Remove image"
                                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/75 text-white flex items-center justify-center text-xs hover:bg-rose-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                                <div className="px-2 py-1 text-[11px] truncate opacity-85">
                                  {asset.name}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => onNavigate('manhwa_studio')}
                        className="text-xs font-medium underline opacity-75 hover:opacity-100"
                      >
                        Open dedicated Manhwa Motion Studio
                      </button>
                      <button
                        type="button"
                        disabled={busyAction === 'step-3'}
                        onClick={async () => {
                          await handleRunStep(activeProject.id, 3);
                          setActiveStepNumber(3);
                        }}
                        className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                          isLight ? 'bg-neutral-950 text-white' : 'bg-amber-500 text-slate-950'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Save Prompt &amp; Generate Full Story (Step 3)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Generate Full Story */}
                {activeStepNumber === 3 && (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-xl border text-xs whitespace-pre-line leading-relaxed ${mutedSurface}`}>
                      {activeProject.fullStory || 'No story generated yet. Click Generate Full Story below.'}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => void handleRunStep(activeProject.id, 3)}
                        disabled={busyAction === 'step-3'}
                        className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 text-xs font-semibold"
                      >
                        {busyAction === 'step-3' ? 'Generating Story...' : 'Regenerate Full Story'}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await handleRunStep(activeProject.id, 4);
                          setActiveStepNumber(4);
                        }}
                        className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                          isLight ? 'bg-neutral-950 text-white' : 'bg-white text-black'
                        }`}
                      >
                        <span>Continue to Step 4 · Generate Characters</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: Generate Characters */}
                {activeStepNumber === 4 && (
                  <div className="space-y-4">
                    {activeProject.characters.length === 0 ? (
                      <div className={`p-6 rounded-xl border text-center text-xs space-y-3 ${mutedSurface}`}>
                        <p>No characters generated yet. Generate consistent seed-locked character sheets.</p>
                        <button
                          type="button"
                          onClick={() => void handleRunStep(activeProject.id, 4)}
                          className="px-4 py-2 rounded-lg bg-neutral-950 text-white font-semibold"
                        >
                          Generate Characters
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {activeProject.characters.map((ch) => (
                          <div key={ch.id} className={`p-4 rounded-xl border flex gap-3.5 ${mutedSurface}`}>
                            <img
                              src={ch.avatarUrl}
                              alt={ch.name}
                              referrerPolicy="no-referrer"
                              onError={(e) => handleImageError(e, ch.name)}
                              className="w-16 h-16 rounded-xl object-cover shrink-0 border border-neutral-200 dark:border-slate-700"
                            />
                            <div className="min-w-0 space-y-1 text-xs">
                              <div className="font-bold truncate">{ch.name}</div>
                              <div className="opacity-70">
                                {ch.role} · Seed #{ch.consistencySeed}
                              </div>
                              <p className="opacity-80 line-clamp-2">{ch.appearancePrompt}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          await handleRunStep(activeProject.id, 5);
                          setActiveStepNumber(5);
                        }}
                        className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                          isLight ? 'bg-neutral-950 text-white' : 'bg-white text-black'
                        }`}
                      >
                        <span>Continue to Step 5 · Generate Storyboard</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEPS 5 - 7: Storyboard, Story Images & Cartoon Video Clips */}
                {(activeStepNumber === 5 || activeStepNumber === 6 || activeStepNumber === 7) && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs opacity-75">
                        Each scene card tracks image generation, character seed consistency, and cartoon video clip status.
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void handleRunStep(activeProject.id, activeStepNumber)}
                          disabled={busyAction === `step-${activeStepNumber}`}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                            isLight ? 'bg-neutral-950 text-white' : 'bg-amber-500 text-slate-950'
                          }`}
                        >
                          {busyAction === `step-${activeStepNumber}`
                            ? 'Running...'
                            : activeStepNumber === 5
                            ? 'Generate / Refresh Storyboard'
                            : activeStepNumber === 6
                            ? 'Generate All Story Images'
                            : 'Convert All to Cartoon Video'}
                        </button>
                        {activeStepNumber === 7 && (
                          <button
                            type="button"
                            onClick={() => setActiveStepNumber(8)}
                            className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 text-xs font-semibold"
                          >
                            Next: Dialogue Audio (Step 8)
                          </button>
                        )}
                      </div>
                    </div>

                    {activeProject.scenes.length === 0 ? (
                      <div className={`p-8 rounded-xl border text-center text-xs space-y-3 ${mutedSurface}`}>
                        <p>No storyboard scenes generated yet.</p>
                        <button
                          type="button"
                          onClick={() => void handleRunStep(activeProject.id, 5)}
                          className="px-4 py-2 rounded-lg bg-neutral-950 text-white font-semibold"
                        >
                          Generate Storyboard Scenes
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeProject.scenes.map((sc, sIdx) => {
                          const hasClipFail =
                            sc.videoClipStatus === 'failed' || sc.videoClipStatus === 'corrupted';
                          return (
                            <div
                              key={sc.id}
                              className={`rounded-xl border p-3.5 space-y-3 ${
                                hasClipFail
                                  ? 'border-rose-500/50 bg-rose-500/5'
                                  : mutedSurface
                              }`}
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold">
                                  Scene {sc.sceneNumber} · {sc.title}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={sIdx === 0}
                                    onClick={() =>
                                      void handleReorderScene(activeProject.id, sc.sceneNumber, 'up')
                                    }
                                    className="p-1 rounded hover:bg-black/10 disabled:opacity-30"
                                    title="Move earlier"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={sIdx === activeProject.scenes.length - 1}
                                    onClick={() =>
                                      void handleReorderScene(activeProject.id, sc.sceneNumber, 'down')
                                    }
                                    className="p-1 rounded hover:bg-black/10 disabled:opacity-30"
                                    title="Move later"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              <img
                                src={sc.storyImageUrl}
                                alt={sc.title}
                                referrerPolicy="no-referrer"
                                onError={(e) => handleImageError(e, sc.title)}
                                className="w-full h-36 rounded-lg object-cover border border-neutral-200 dark:border-slate-700"
                              />

                              <div className="text-xs space-y-1">
                                <div className="opacity-70">
                                  {sc.framing} · {sc.durationSec}s · Image: {sc.imageStatus} · Clip:{' '}
                                  <span
                                    className={
                                      hasClipFail
                                        ? 'text-rose-600 dark:text-rose-400 font-semibold'
                                        : sc.videoClipStatus === 'ready'
                                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                        : ''
                                    }
                                  >
                                    {sc.videoClipStatus}
                                  </span>
                                </div>
                                <p className="line-clamp-2 opacity-85">{sc.description}</p>
                                {sc.lastError && (
                                  <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                                    Error: {sc.lastError}
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleRunStep(activeProject.id, 7, {
                                      sceneNumber: sc.sceneNumber,
                                    })
                                  }
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                                    hasClipFail
                                      ? 'bg-rose-600 text-white hover:bg-rose-700'
                                      : 'border border-neutral-300 dark:border-slate-700'
                                  }`}
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  <span>{hasClipFail ? 'Retry Scene Clip' : 'Regenerate Clip'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedSceneNumber(sc.sceneNumber);
                                    handleOpenManualEdit(activeProject);
                                  }}
                                  className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-slate-700 text-xs font-medium flex items-center gap-1"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Edit Scene</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* STEPS 8 - 11: Dialogue Audio, Music/SFX, VFX, A/V Sync */}
                {activeStepNumber >= 8 && activeStepNumber <= 11 && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs opacity-75">
                        Generate per-scene dialogue voice, layer music &amp; SFX, apply animation VFX shaders, and lock 0ms A/V sync.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void handleRunStep(activeProject.id, activeStepNumber)}
                          disabled={busyAction === `step-${activeStepNumber}`}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                            isLight ? 'bg-neutral-950 text-white' : 'bg-amber-500 text-slate-950'
                          }`}
                        >
                          {activeStepNumber === 8
                            ? 'Generate All Dialogue Audio'
                            : activeStepNumber === 9
                            ? 'Apply Music & SFX Layer'
                            : activeStepNumber === 10
                            ? 'Apply Animation & VFX'
                            : 'Synchronize Video, Voice & Audio'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveStepNumber(activeStepNumber === 11 ? 12 : activeStepNumber + 1)}
                          className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 text-xs font-semibold"
                        >
                          Next Step
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {activeProject.scenes.map((sc) => (
                        <div
                          key={sc.id}
                          className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${mutedSurface}`}
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="font-bold">
                              Scene {sc.sceneNumber}: {sc.title}
                            </div>
                            <div className="opacity-80 truncate">
                              Dialogue: &ldquo;{sc.dialogueText || 'No dialogue'}&rdquo;
                            </div>
                            <div className="opacity-70 flex flex-wrap gap-2">
                              <span>
                                Audio:{' '}
                                <strong
                                  className={
                                    sc.dialogueAudioStatus === 'missing'
                                      ? 'text-rose-600 dark:text-rose-400'
                                      : 'text-emerald-600 dark:text-emerald-400'
                                  }
                                >
                                  {sc.dialogueAudioStatus}
                                </strong>
                              </span>
                              <span>· Music: {sc.musicSfxStatus}</span>
                              <span>· VFX: {sc.vfxStatus}</span>
                              <span>
                                · Sync:{' '}
                                <strong
                                  className={
                                    sc.syncStatus === 'out_of_sync'
                                      ? 'text-rose-600 dark:text-rose-400'
                                      : ''
                                  }
                                >
                                  {sc.syncStatus} ({sc.syncOffsetMs}ms)
                                </strong>
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                void handleRunStep(activeProject.id, activeStepNumber, {
                                  sceneNumber: sc.sceneNumber,
                                })
                              }
                              className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-slate-700 font-semibold"
                            >
                              Process Scene {sc.sceneNumber}
                            </button>
                            <button
                              type="button"
                              onClick={() => onNavigate('ai_voice')}
                              className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-slate-700 font-medium"
                            >
                              Voice Studio
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 12: Preview Complete Film (Preview Is NOT Final Confirmation!) */}
                {activeStepNumber === 12 && (
                  <div className="space-y-4">
                    {activeProject.scenes.length > 0 && (
                      <div className="rounded-2xl overflow-hidden border border-neutral-800 bg-black text-white">
                        <div className="relative h-72 sm:h-80 flex items-center justify-center">
                          <img
                            src={
                              activeProject.scenes[previewSceneIdx]?.storyImageUrl ||
                              activeProject.thumbnailUrl
                            }
                            alt="Film Preview Frame"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30" />
                          <div className="absolute top-3 left-3 text-xs font-mono-cinema bg-black/70 px-2.5 py-1 rounded">
                            Scene {previewSceneIdx + 1}/{activeProject.scenes.length} ·{' '}
                            {activeProject.scenes[previewSceneIdx]?.framing}
                          </div>
                          <div className="absolute bottom-4 inset-x-4 text-center space-y-1">
                            <p className="text-sm font-medium bg-black/70 inline-block px-3 py-1.5 rounded-lg">
                              {activeProject.scenes[previewSceneIdx]?.subtitleText ||
                                activeProject.scenes[previewSceneIdx]?.dialogueText}
                            </p>
                          </div>
                        </div>
                        <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-neutral-950 border-t border-neutral-800 text-xs">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={busyAction === 'step-12'}
                              onClick={() => {
                                if (!activeProject.previewGenerated) {
                                  void handleRunStep(activeProject.id, 12);
                                  return;
                                }
                                setIsPreviewPlaying((v) => !v);
                                soundFx.playScannerBeep();
                              }}
                              className="px-3.5 py-1.5 rounded-lg bg-white text-black font-semibold flex items-center gap-1.5"
                            >
                              {isPreviewPlaying ? (
                                <>
                                  <Pause className="w-3.5 h-3.5" />
                                  <span>Pause</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-3.5 h-3.5" />
                                  <span>Play Preview</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              disabled={busyAction === 'step-12'}
                              onClick={() => void handleRunStep(activeProject.id, 12)}
                              className="px-3.5 py-1.5 rounded-lg border border-neutral-700 hover:bg-neutral-800 font-semibold"
                            >
                              Generate / Refresh Full Preview
                            </button>
                          </div>
                          <span className="font-mono-cinema text-neutral-400">
                            {activeProject.previewGenerated
                              ? 'Status: Preview Ready — Editing Required'
                              : 'Preview Not Generated Yet'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* All 6 Post-Preview Required Buttons */}
                    <div className={`p-4 rounded-xl border space-y-3 ${mutedSurface}`}>
                      <div className="text-xs font-bold">
                        Post-Preview Editing &amp; Verification Actions
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void handleAddToTimeline(activeProject, false)}
                          className="px-3.5 py-2 rounded-lg bg-neutral-950 text-white text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Add to Editing Timeline</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleAddToTimeline(activeProject, true)}
                          className={`px-3.5 py-2 rounded-lg border text-xs font-semibold ${cardSurface}`}
                        >
                          Edit Video
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigate('audio')}
                          className={`px-3.5 py-2 rounded-lg border text-xs font-semibold ${cardSurface}`}
                        >
                          Edit Audio
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigate('vfx')}
                          className={`px-3.5 py-2 rounded-lg border text-xs font-semibold ${cardSurface}`}
                        >
                          Edit VFX
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void handleRunStep(activeProject.id, 7, { sceneNumber: selectedSceneNumber })
                          }
                          className={`px-3.5 py-2 rounded-lg border text-xs font-semibold ${cardSurface}`}
                        >
                          Regenerate Scene
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void handleRunQualityCheck(activeProject.id);
                            setWorkspaceView('quality');
                          }}
                          className="px-3.5 py-2 rounded-lg bg-amber-600 text-white text-xs font-semibold"
                        >
                          Run Quality Check
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEPS 13 - 14: Timeline Sync + Edit and Fix Mistakes */}
                {(activeStepNumber === 13 || activeStepNumber === 14) && (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${mutedSurface}`}>
                      <div className="space-y-1 text-xs">
                        <div className="font-bold">Step 13 · Editing Timeline Connection</div>
                        <div className="opacity-75">
                          {activeProject.timelineAdded
                            ? 'Scenes, voice tracks, and subtitles are synchronized in the Timeline Editor.'
                            : 'Push all cartoon scenes and dialogue audio into the multi-track Timeline Editor.'}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => void handleAddToTimeline(activeProject, false)}
                          className="px-3.5 py-2 rounded-lg bg-neutral-950 text-white text-xs font-semibold"
                        >
                          {activeProject.timelineAdded ? 'Re-Sync Timeline' : 'Add to Editing Timeline'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleAddToTimeline(activeProject, true)}
                          className={`px-3.5 py-2 rounded-lg border text-xs font-semibold ${cardSurface}`}
                        >
                          Open Video Editor
                        </button>
                      </div>
                    </div>

                    {/* Inline Manual Scene Editor */}
                    <div className={`p-4 rounded-xl border space-y-3 ${mutedSurface}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-bold">Step 14 · Edit Scenes &amp; Fix Mistakes</div>
                        <div className="flex items-center gap-2">
                          <select
                            value={editingSceneNum ?? selectedSceneNumber}
                            onChange={(e) => {
                              const num = Number(e.target.value);
                              setSelectedSceneNumber(num);
                              const sc = activeProject.scenes.find((s) => s.sceneNumber === num);
                              if (sc) {
                                setEditingSceneNum(num);
                                setSceneEditTitle(sc.title);
                                setSceneEditDesc(sc.description);
                                setSceneEditDialogue(sc.dialogueText);
                                setSceneEditVfx(sc.vfxPreset);
                                setSceneEditFraming(sc.framing);
                              }
                            }}
                            className={`rounded-lg px-2.5 py-1.5 text-xs outline-none ${inputCls}`}
                          >
                            {activeProject.scenes.map((sc) => (
                              <option key={sc.id} value={sc.sceneNumber}>
                                Scene {sc.sceneNumber}: {sc.title}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => void handleRunQualityCheck(activeProject.id)}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold"
                          >
                            Run Quality Check
                          </button>
                        </div>
                      </div>

                      {editingSceneNum !== null && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2">
                          <div className="space-y-1">
                            <label className="font-medium opacity-75">Scene Title</label>
                            <input
                              type="text"
                              value={sceneEditTitle}
                              onChange={(e) => setSceneEditTitle(e.target.value)}
                              className={`w-full rounded-lg px-3 py-2 outline-none ${inputCls}`}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-medium opacity-75">Framing</label>
                            <select
                              value={sceneEditFraming}
                              onChange={(e) =>
                                setSceneEditFraming(e.target.value as CartoonSceneItem['framing'])
                              }
                              className={`w-full rounded-lg px-3 py-2 outline-none ${inputCls}`}
                            >
                              <option value="Wide Shot">Wide Shot</option>
                              <option value="Medium Shot">Medium Shot</option>
                              <option value="Close-up">Close-up</option>
                              <option value="Over-the-shoulder">Over-the-shoulder</option>
                              <option value="Establishing">Establishing</option>
                            </select>
                          </div>
                          <div className="md:col-span-2 space-y-1">
                            <label className="font-medium opacity-75">Dialogue &amp; Subtitles</label>
                            <input
                              type="text"
                              value={sceneEditDialogue}
                              onChange={(e) => setSceneEditDialogue(e.target.value)}
                              className={`w-full rounded-lg px-3 py-2 outline-none ${inputCls}`}
                            />
                          </div>
                          <div className="md:col-span-2 space-y-1">
                            <label className="font-medium opacity-75">Action Description</label>
                            <textarea
                              rows={2}
                              value={sceneEditDesc}
                              onChange={(e) => setSceneEditDesc(e.target.value)}
                              className={`w-full rounded-lg px-3 py-2 outline-none ${inputCls}`}
                            />
                          </div>
                          <div className="md:col-span-2 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                void handleSaveSceneEdit(activeProject.id, editingSceneNum, false)
                              }
                              className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-slate-700 font-semibold"
                            >
                              Save Manual Edits
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void handleSaveSceneEdit(activeProject.id, editingSceneNum, true)
                              }
                              className="px-4 py-2 rounded-lg bg-neutral-950 text-white font-semibold"
                            >
                              Save &amp; Regenerate Scene
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Inline Open Quality Issues inside Editing Step */}
                      {openIssues.length > 0 ? (
                        <div className="space-y-2 pt-2">
                          <div className="text-xs font-bold text-rose-600 dark:text-rose-400">
                            Errors Requiring Correction ({openIssues.length})
                          </div>
                          {openIssues.map((iss) => (
                            <div
                              key={iss.id}
                              className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="space-y-0.5">
                                <div className="font-semibold">Problem: {iss.problem}</div>
                                <div className="opacity-80">Suggested fix: {iss.suggestedFix}</div>
                              </div>
                              <div className="flex flex-wrap gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleResolveQualityIssue(activeProject.id, iss, 'auto_fix')
                                  }
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold"
                                >
                                  Fix Automatically
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleResolveQualityIssue(activeProject.id, iss, 'retry')
                                  }
                                  className="px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-slate-700 font-semibold"
                                >
                                  Retry
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenManualEdit(activeProject, iss)}
                                  className="px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-slate-700 font-medium"
                                >
                                  Edit Manually
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleResolveQualityIssue(activeProject.id, iss, 'ignore')
                                  }
                                  className="px-2.5 py-1.5 rounded-lg opacity-70 hover:opacity-100"
                                >
                                  Ignore
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                            All quality checks passed. Ready to complete Editing &amp; unlock Final Approval.
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!(await handleRunStep(activeProject.id, 14))) return;
                              setActiveStepNumber(activeProject.previewGenerated ? 15 : 12);
                            }}
                            className={`px-5 py-2 rounded-xl text-xs font-semibold ${
                              isLight ? 'bg-neutral-950 text-white' : 'bg-emerald-500 text-slate-950'
                            }`}
                          >
                            Mark Editing Complete &amp; Proceed to Final Approval
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEPS 15 - 17: Final Approval -> Render Final MP4 -> Verify -> Download MP4 */}
                {activeStepNumber >= 15 && (
                  <div className="space-y-5">
                    {(!activeProject.previewGenerated ||
                      !activeProject.timelineAdded ||
                      !activeProject.editingCompleted ||
                      openIssues.some((q) => q.severity === 'error')) && (
                      <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-xs space-y-2">
                        <div className="font-bold flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                          <Lock className="w-4 h-4" />
                          <span>Final Approval &amp; MP4 Export Are Locked</span>
                        </div>
                        <p className="opacity-85">
                          Complete the remaining prerequisite to unlock Final Approval.
                        </p>
                        <button
                          type="button"
                          className="rounded-lg border border-current px-3 py-1.5 font-semibold"
                          onClick={() => setActiveStepNumber(
                            !activeProject.previewGenerated ? 12 : !activeProject.timelineAdded ? 13 : 14
                          )}
                        >
                          {!activeProject.previewGenerated
                            ? 'Go to Step 12 · Film Preview'
                            : !activeProject.timelineAdded
                            ? 'Go to Step 13 · Editing Timeline'
                            : 'Go to Step 14 · Quality Checks'}
                        </button>
                      </div>
                    )}

                    {/* 5-Stage Final Approval Checklist */}
                    <div className={`p-5 rounded-xl border space-y-4 ${mutedSurface}`}>
                      <h3 className="text-sm font-bold">
                        Final Approval &amp; Export Verification Sequence
                      </h3>

                      <div className="space-y-3 text-xs">
                        {/* 1. Watch Final Preview */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-200 dark:border-slate-800">
                          <div>
                            <div className="font-semibold">1. Watch the final preview</div>
                            <div className="opacity-70">
                              Confirm pacing, dialogue sync, and transitions across all {activeProject.scenes.length} scenes.
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setWatchedAllScenesInSession(false);
                              setActiveStepNumber(12);
                              setPreviewSceneIdx(0);
                              setIsPreviewPlaying(true);
                            }}
                            className={`px-3.5 py-1.5 rounded-lg border font-semibold shrink-0 ${cardSurface}`}
                          >
                            {watchedAllScenesInSession || activeProject.watchedFinalPreview
                              ? 'Preview Watched'
                              : 'Watch Final Preview'}
                          </button>
                        </div>

                        {/* 2. Confirm the Video */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-200 dark:border-slate-800">
                          <div>
                            <div className="font-semibold">2. Confirm the video (Final Approval)</div>
                            <div className="opacity-70">
                              Explicit manual confirmation required before final MP4 render starts.
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={
                              activeProject.finalApprovalConfirmed ||
                              busyAction === 'approve' ||
                              !activeProject.editingCompleted
                            }
                            onClick={() => void handleApproveFinalVideo(activeProject)}
                            className={`px-4 py-2 rounded-lg font-semibold shrink-0 disabled:opacity-45 ${
                              activeProject.finalApprovalConfirmed
                                ? 'bg-emerald-600 text-white'
                                : 'bg-neutral-950 text-white hover:bg-black'
                            }`}
                          >
                            {activeProject.finalApprovalConfirmed
                              ? 'Confirmed & Approved'
                              : busyAction === 'approve'
                              ? 'Confirming...'
                              : 'Confirm Final Video'}
                          </button>
                        </div>

                        {/* 3 & 4. Render Final MP4 + Verify Exported File */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-200 dark:border-slate-800">
                          <div>
                            <div className="font-semibold">
                              3 &amp; 4. Render final MP4 &amp; verify exported file
                            </div>
                            <div className="opacity-70">
                              {activeProject.renderJob.verified
                                ? `Verified MP4: ${activeProject.renderJob.fileName} (${Math.round(
                                    (activeProject.renderJob.fileSizeBytes || 0) / 1024
                                  )} KB · ${activeProject.renderJob.durationSec}s)`
                                : 'Encodes H.264/AAC MP4 on server and verifies streams before enabling download.'}
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={!activeProject.finalApprovalConfirmed || busyAction === 'render-mp4'}
                            onClick={() => void handleRenderFinalMp4(activeProject)}
                            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold shrink-0 disabled:opacity-45"
                          >
                            {busyAction === 'render-mp4'
                              ? 'Rendering & Verifying MP4...'
                              : activeProject.renderJob.verified
                              ? 'Re-Render Final MP4'
                              : 'Render Final MP4'}
                          </button>
                        </div>

                        {/* 5. Download Final MP4 */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="font-semibold">5. Download Final MP4</div>
                            <div className="opacity-70">
                              Available strictly after approval, render, and file verification pass.
                            </div>
                          </div>
                          {activeProject.renderJob.verified ? (
                            <a
                              href={`/api/cartoon-projects/${encodeURIComponent(activeProject.id)}/download-mp4`}
                              download={activeProject.renderJob.fileName || 'cartoon_film.mp4'}
                              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold inline-flex items-center gap-1.5 shrink-0"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download Final MP4</span>
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1 opacity-50 font-semibold">
                              <Lock className="w-3.5 h-3.5" />
                              <span>Locked</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: AI QUALITY CHECKER & AUTOMATIC ERROR FIXING */}
        {workspaceView === 'quality' && activeProject && (
          <div className="space-y-6">
            <div className={`rounded-2xl border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${cardSurface}`}>
              <div className="space-y-1">
                <div className="text-xs opacity-70">
                  {activeProject.name} · 9-Point Automated Film Integrity Check
                </div>
                <h2 className="text-lg font-bold">AI Quality Checker &amp; Mistake Fixer</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleRunQualityCheck(activeProject.id)}
                  disabled={busyAction === 'quality-check'}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                    isLight ? 'bg-neutral-950 text-white' : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {busyAction === 'quality-check' ? 'Inspecting Project...' : 'Run Full Quality Check'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setWorkspaceView('workflow')}
                  className={`px-4 py-2 rounded-xl border text-xs font-semibold ${cardSurface}`}
                >
                  Back to Workflow
                </button>
              </div>
            </div>

            {/* 9 Quality Rules Coverage Grid */}
            <div className={`rounded-2xl border p-5 space-y-3 ${cardSurface}`}>
              <h3 className="text-xs font-bold uppercase tracking-wide opacity-70">
                9 Automated Inspection Checks
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                {QUALITY_CHECK_RULES.map((rule) => (
                  <div key={rule} className={`p-3 rounded-xl border flex items-center gap-2 ${mutedSurface}`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Open Problems Requiring Fix */}
            <div className={`rounded-2xl border p-5 space-y-4 ${cardSurface}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span>Detected Problems ({openIssues.length})</span>
                </h3>
                {fixedVerifiedIssues.length > 0 && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                    {fixedVerifiedIssues.length} fixed &amp; verified
                  </span>
                )}
              </div>

              {openIssues.length === 0 ? (
                <div className={`p-8 rounded-xl border text-center text-xs space-y-2 ${mutedSurface}`}>
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="font-semibold text-sm">All Quality Checks Passed</p>
                  <p className="opacity-70">
                    No open scene, audio, continuity, subtitle, sync, or render errors remain in this project.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {openIssues.map((iss) => (
                    <div
                      key={iss.id}
                      className={`p-4 rounded-xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${mutedSurface}`}
                    >
                      <div className="space-y-1 text-xs">
                        <div className="font-bold text-sm text-rose-600 dark:text-rose-400">
                          Problem: {iss.problem}
                        </div>
                        <div className="opacity-85">
                          Suggested fix: {iss.suggestedFix}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0 text-xs">
                        <button
                          type="button"
                          disabled={busyAction === `issue-${iss.id}`}
                          onClick={() =>
                            void handleResolveQualityIssue(activeProject.id, iss, 'auto_fix')
                          }
                          className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Fix Automatically</span>
                        </button>
                        <button
                          type="button"
                          disabled={busyAction === `issue-${iss.id}`}
                          onClick={() =>
                            void handleResolveQualityIssue(activeProject.id, iss, 'retry')
                          }
                          className={`px-3.5 py-2 rounded-lg border font-semibold ${cardSurface}`}
                        >
                          Retry
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenManualEdit(activeProject, iss)}
                          className={`px-3.5 py-2 rounded-lg border font-semibold ${cardSurface}`}
                        >
                          Edit Manually
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void handleResolveQualityIssue(activeProject.id, iss, 'ignore')
                          }
                          className="px-3 py-2 rounded-lg opacity-70 hover:opacity-100 font-medium"
                        >
                          Ignore
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Verified Fixes Audit Section */}
              {fixedVerifiedIssues.length > 0 && (
                <div className="pt-4 border-t border-neutral-200 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold opacity-70">Verified Fixes History</h4>
                  <div className="space-y-1.5">
                    {fixedVerifiedIssues.map((fixed) => (
                      <div
                        key={fixed.id}
                        className="text-xs flex items-center justify-between gap-2 py-1.5 px-3 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      >
                        <span>Verified Fixed: {fixed.problem}</span>
                        <span className="font-mono-cinema text-[11px]">
                          {fixed.verifiedAt ? new Date(fixed.verifiedAt).toLocaleTimeString() : 'Verified'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
