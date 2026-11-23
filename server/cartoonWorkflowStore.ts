import fs from 'fs';
import { createHash } from 'node:crypto';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export type StepStatus =
  | 'complete'
  | 'pending'
  | 'in_progress'
  | 'failed'
  | 'waiting_confirmation'
  | 'locked';

export type ProjectCategory = 'Cartoon Film' | 'Manhwa Animation' | 'Short Cartoon Video';

export type IssueCategory =
  | 'missing_or_duplicate_scene'
  | 'character_consistency'
  | 'missing_audio'
  | 'av_sync'
  | 'corrupted_video'
  | 'missing_media'
  | 'scene_order'
  | 'missing_subtitles'
  | 'render_error';

export type IssueStatus = 'open' | 'fixed_verified' | 'ignored';

export interface WorkflowStepDefinition {
  stepNumber: number;
  key: string;
  label: string;
  phase: 'setup' | 'visual' | 'audio_vfx' | 'preview_edit' | 'approval_export';
}

export const WORKFLOW_STEP_DEFINITIONS: WorkflowStepDefinition[] = [
  { stepNumber: 1, key: 'create_project', label: 'Create New Project', phase: 'setup' },
  { stepNumber: 2, key: 'story_prompt', label: 'Enter Story Prompt', phase: 'setup' },
  { stepNumber: 3, key: 'full_story', label: 'Generate Full Story', phase: 'setup' },
  { stepNumber: 4, key: 'characters', label: 'Generate Characters', phase: 'setup' },
  { stepNumber: 5, key: 'storyboard', label: 'Generate Storyboard', phase: 'setup' },
  { stepNumber: 6, key: 'story_images', label: 'Generate Story Images', phase: 'visual' },
  { stepNumber: 7, key: 'cartoon_videos', label: 'Convert Images into Cartoon Videos', phase: 'visual' },
  { stepNumber: 8, key: 'dialogue_audio', label: 'Generate Character Dialogue and Audio', phase: 'audio_vfx' },
  { stepNumber: 9, key: 'music_sfx', label: 'Add Background Music and Sound Effects', phase: 'audio_vfx' },
  { stepNumber: 10, key: 'animation_vfx', label: 'Add Animation and VFX', phase: 'audio_vfx' },
  { stepNumber: 11, key: 'sync_av', label: 'Synchronize Video, Voice and Audio', phase: 'audio_vfx' },
  { stepNumber: 12, key: 'preview_film', label: 'Preview Complete Film', phase: 'preview_edit' },
  { stepNumber: 13, key: 'add_timeline', label: 'Add to Editing Timeline', phase: 'preview_edit' },
  { stepNumber: 14, key: 'edit_fix', label: 'Edit and Fix Mistakes', phase: 'preview_edit' },
  { stepNumber: 15, key: 'final_approval', label: 'Final Preview and Approval', phase: 'approval_export' },
  { stepNumber: 16, key: 'render_final', label: 'Render Final Video', phase: 'approval_export' },
  { stepNumber: 17, key: 'download_mp4', label: 'Download Final MP4', phase: 'approval_export' },
];

export interface CartoonCharacter {
  id: string;
  name: string;
  role: string;
  appearancePrompt: string;
  consistencySeed: number;
  voiceStyle: string;
  avatarUrl: string;
}

export interface CartoonSceneItem {
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

export interface QualityIssueItem {
  id: string;
  sceneNumber?: number;
  category: IssueCategory;
  severity: 'error' | 'warning';
  problem: string;
  suggestedFix: string;
  status: IssueStatus;
  verifiedAfterFix?: boolean;
  verifiedAt?: string;
}

export interface StepStateEntry {
  stepNumber: number;
  key: string;
  label: string;
  phase: WorkflowStepDefinition['phase'];
  status: StepStatus;
  note?: string;
}

export interface RenderJobState {
  status: 'locked' | 'pending' | 'rendering' | 'completed' | 'failed';
  progress: number;
  verified: boolean;
  fileName?: string;
  fileSizeBytes?: number;
  durationSec?: number;
  errorMessage?: string;
  renderedAt?: string;
}

export interface ReferenceImageAsset {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  sourceType: 'upload' | 'manhwa_url';
  addedAt: string;
}

export interface AzStepState {
  stepNumber: number;
  module: string;
  creates: string;
  status: StepStatus;
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

export interface CartoonFilmProject {
  id: string;
  name: string;
  movieTitle?: string;
  projectType: ProjectCategory;
  animationStyle: string;
  aspectRatio: '16:9' | '9:16';
  language: string;
  durationMinutes?: number;
  resolution?: '1280x720' | '1920x1080' | '3840x2160';
  frameRate?: 24 | 25 | 30 | 60;
  thumbnailUrl: string;
  chapterUrl?: string;
  chapters?: string[];
  referenceImages?: ReferenceImageAsset[];
  storyPrompt: string;
  fullStory: string;
  screenplayGenerated?: boolean;
  voicesAssigned?: boolean;
  backgroundsGenerated?: boolean;
  shotPlanGenerated?: boolean;
  animationApplied?: boolean;
  compositingDone?: boolean;
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
  approvalChecklist?: Record<string, boolean>;
  renderSettings?: RenderExportSettings;
  qualityIssues: QualityIssueItem[];
  lastQualityCheckAt?: string;
  renderJob: RenderJobState;
  stepStates: StepStateEntry[];
  azSteps?: AzStepState[];
  azProgress?: number;
  generationJobs?: GenerationJobItem[];
  overallProgress: number;
  currentStepNumber: number;
  updatedAt: string;
  createdAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'cartoon-projects.json');
const RENDER_DIR = path.join(DATA_DIR, 'renders');
const ASSETS_DIR = path.join(DATA_DIR, 'cartoon-assets');

const CARTOON_IMAGE_POOL = [
  '/src/assets/images/cartoon_adventure_thumb_1794924309261.jpg',
  '/src/assets/images/cartoon_short_city_1794924309971.jpg',
  '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
  '/src/assets/images/cinema_cyberpunk_alley_1794406568416.jpg',
  '/src/assets/images/manhwa_panel_warrior_1794812531995.jpg',
  '/src/assets/images/manhwa_panel_temple_1794812532125.jpg',
  '/src/assets/images/manhwa_panel_clash_1794812531342.jpg',
  '/src/assets/images/cartoon_forest_bg_1794980040735.jpg',
  '/src/assets/images/cartoon_vfx_explosions_1794980039460.jpg',
  '/src/assets/images/cinema_soundstage_set_1794406569758.jpg',
  '/src/assets/images/manhwa_cover_crimson_lotus_1795002498343.jpg',
  '/src/assets/images/manhwa_cover_skyline_revenant_1795002498039.jpg',
];

function findSceneImage(url: string) {
  const match = /^\/(api\/cartoon-assets|src\/assets\/images|assets\/images)\/([^/]+)$/.exec(url);
  if (!match || match[2] === '.' || match[2] === '..' || match[2].includes('\\')) return undefined;
  const roots = match[1] === 'api/cartoon-assets' ? [ASSETS_DIR] : match[1] === 'assets/images'
    ? ['public/assets/images', 'src/assets/images']
    : ['src/assets/images'];
  for (const root of roots) {
    const filePath = path.resolve(root, match[2]);
    if (!fs.statSync(filePath, { throwIfNoEntry: false })?.isFile()) continue;
    const digest = createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
    return { filePath, digest };
  }
}

function assignUniqueSceneImages(scenes: CartoonSceneItem[], referenceUrls: string[]) {
  const assigned = new Set<string>();
  const images = new Map([...new Set([...referenceUrls, ...scenes.map((scene) => scene.storyImageUrl), ...CARTOON_IMAGE_POOL])]
    .filter(Boolean).map((url) => [url, findSceneImage(url)] as const));
  const ordered = [...scenes].sort((a, b) => a.orderIndex - b.orderIndex);
  const selections = new Map<string, string>();
  const choose = (scene: CartoonSceneItem, candidates: string[]) => {
    for (const url of candidates) {
      const image = images.get(url);
      if (!image || assigned.has(image.digest)) continue;
      assigned.add(image.digest);
      selections.set(scene.id, url);
      return;
    }
  };
  ordered.forEach((scene, index) => choose(scene, [referenceUrls[index], scene.storyImageUrl].filter(Boolean)));
  for (const scene of ordered) {
    if (!selections.has(scene.id)) choose(scene, [...referenceUrls, ...CARTOON_IMAGE_POOL]);
  }
  return scenes.map((scene): CartoonSceneItem => {
    const url = selections.get(scene.id);
    return {
      ...scene,
      storyImageUrl: url || '',
      imageStatus: url ? 'ready' : 'failed',
      lastError: url ? undefined : 'Upload another unique image for this scene.',
    };
  });
}

function requireUniqueSceneImages(scenes: CartoonSceneItem[]) {
  const assigned = new Map<string, number>();
  return scenes.map((scene) => {
    const image = findSceneImage(scene.storyImageUrl);
    if (!image) throw new Error(`Scene ${scene.sceneNumber} has no available image. Run Step 6 or upload a unique image.`);
    const firstScene = assigned.get(image.digest);
    if (firstScene !== undefined) {
      throw new Error(`Scenes ${firstScene} and ${scene.sceneNumber} use the same image. Run Step 6 to replace duplicates.`);
    }
    assigned.set(image.digest, scene.sceneNumber);
    return image.filePath;
  });
}

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(RENDER_DIR)) fs.mkdirSync(RENDER_DIR, { recursive: true });
  if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

/**
 * Deterministic 9-point AI Quality Checker across scenes, characters, audio, VFX, sync, subtitles, and render status.
 */
export function runQualityInspection(project: CartoonFilmProject): QualityIssueItem[] {
  const previousMap = new Map<string, QualityIssueItem>();
  for (const prev of project.qualityIssues || []) {
    previousMap.set(`${prev.category}::${prev.sceneNumber ?? 'global'}`, prev);
  }

  const detected: QualityIssueItem[] = [];
  const pushIssue = (
    category: IssueCategory,
    sceneNumber: number | undefined,
    severity: 'error' | 'warning',
    problem: string,
    suggestedFix: string
  ) => {
    const key = `${category}::${sceneNumber ?? 'global'}`;
    const existing = previousMap.get(key);
    if (existing && existing.status === 'ignored') {
      detected.push(existing);
      return;
    }
    detected.push({
      id: existing?.id || `qi_${category}_${sceneNumber ?? 'g'}_${Date.now().toString(36)}`,
      sceneNumber,
      category,
      severity,
      problem,
      suggestedFix,
      status: 'open',
      verifiedAfterFix: false,
    });
  };

  const scenes = project.scenes || [];
  if (scenes.length === 0) {
    pushIssue(
      'missing_or_duplicate_scene',
      undefined,
      'error',
      'Project has no storyboard scenes generated yet.',
      'Generate storyboard scenes in Step 5 before video conversion.'
    );
  }

  // 1. Missing or duplicate scene numbers + 7. Incorrect scene order
  const seenNumbers = new Set<number>();
  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i];
    if (seenNumbers.has(sc.sceneNumber)) {
      pushIssue(
        'missing_or_duplicate_scene',
        sc.sceneNumber,
        'error',
        `Duplicate scene number detected: Scene ${sc.sceneNumber} appears multiple times.`,
        `Renumber and deduplicate Scene ${sc.sceneNumber} sequence.`
      );
    }
    seenNumbers.add(sc.sceneNumber);

    if (sc.orderIndex !== i + 1 || sc.sceneNumber !== i + 1) {
      pushIssue(
        'scene_order',
        sc.sceneNumber,
        'warning',
        `Scene ${sc.sceneNumber} is out of chronological order (slot #${i + 1}).`,
        `Reorder scenes sequentially starting from Scene 1.`
      );
    }
  }

  const expectedPrimarySeed = project.characters?.[0]?.consistencySeed || 882194;

  for (const sc of scenes) {
    // 2. Character appearance consistency check
    if (sc.characterSeedUsed && sc.characterSeedUsed !== expectedPrimarySeed) {
      pushIssue(
        'character_consistency',
        sc.sceneNumber,
        'warning',
        `Scene ${sc.sceneNumber} character appearance seed drifted (#${sc.characterSeedUsed} vs locked #${expectedPrimarySeed}).`,
        `Re-lock character seed #${expectedPrimarySeed} and regenerate Scene ${sc.sceneNumber} character frame.`
      );
    }

    // 6. Missing story images / media files
    if (sc.imageStatus !== 'ready' || !sc.storyImageUrl) {
      pushIssue(
        'missing_media',
        sc.sceneNumber,
        'error',
        `Scene ${sc.sceneNumber} is missing a generated story image frame.`,
        `Generate or assign story illustration for Scene ${sc.sceneNumber}.`
      );
    }

    // 5. Black or corrupted video frames / failed cartoon video
    if (sc.videoClipStatus === 'failed' || sc.videoClipStatus === 'corrupted') {
      pushIssue(
        'corrupted_video',
        sc.sceneNumber,
        'error',
        sc.videoClipStatus === 'corrupted'
          ? `Scene ${sc.sceneNumber} has black or corrupted video frames.`
          : `Scene ${sc.sceneNumber} cartoon video generation failed.`,
        `Regenerate Scene ${sc.sceneNumber} cartoon video clip from its keyframe image.`
      );
    }

    // 3. Incorrect dialogue or missing audio
    if (
      sc.dialogueAudioStatus === 'missing' ||
      (sc.videoClipStatus === 'ready' && sc.dialogueAudioStatus !== 'ready') ||
      !sc.dialogueText.trim()
    ) {
      pushIssue(
        'missing_audio',
        sc.sceneNumber,
        'error',
        `Scene ${sc.sceneNumber} has no audio.`,
        `Regenerate Scene ${sc.sceneNumber} audio.`
      );
    }

    // 4. Audio & video synchronization
    if (sc.syncStatus === 'out_of_sync' || Math.abs(sc.syncOffsetMs || 0) > 120) {
      pushIssue(
        'av_sync',
        sc.sceneNumber,
        'error',
        `Scene ${sc.sceneNumber} audio and video are out of sync (${sc.syncOffsetMs}ms drift).`,
        `Re-align Scene ${sc.sceneNumber} voice waveform to video frame timecode (0ms offset).`
      );
    }

    // 8. Missing subtitles
    if (sc.subtitleStatus === 'missing' || (sc.dialogueAudioStatus === 'ready' && !sc.subtitleText.trim())) {
      pushIssue(
        'missing_subtitles',
        sc.sceneNumber,
        'warning',
        `Scene ${sc.sceneNumber} is missing synchronized subtitles.`,
        `Generate subtitles from Scene ${sc.sceneNumber} dialogue.`
      );
    }
  }

  // 9. Video rendering error
  if (project.renderJob?.status === 'failed') {
    pushIssue(
      'render_error',
      undefined,
      'error',
      project.renderJob.errorMessage || 'Final MP4 rendering encountered an encoding error.',
      'Re-verify scene assets and restart final MP4 render.'
    );
  }

  // Preserve verified badges for previously fixed items that no longer fail
  const openKeys = new Set(detected.map((d) => `${d.category}::${d.sceneNumber ?? 'global'}`));
  const verifiedHistory = (project.qualityIssues || [])
    .filter((old) => old.status === 'fixed_verified' && !openKeys.has(`${old.category}::${old.sceneNumber ?? 'global'}`))
    .slice(0, 12);

  return [...detected, ...verifiedHistory];
}

/**
 * Recompute all 17 workflow step statuses strictly.
 * CRITICAL RULE: Preview (Step 12) never marks the film complete or auto-approves Step 15/16/17.
 */
export function recomputeProjectSteps(project: CartoonFilmProject): CartoonFilmProject {
  const scenes = project.scenes || [];
  const hasPrompt = Boolean(project.storyPrompt?.trim().length >= 5);
  const hasStory = Boolean(project.fullStory?.trim().length >= 20);
  const hasCharacters = (project.characters?.length || 0) > 0;
  const hasStoryboard = Boolean(project.storyboardGenerated && scenes.length > 0);

  const imagesReadyCount = scenes.filter((s) => s.imageStatus === 'ready' && s.storyImageUrl).length;
  const imagesFailedCount = scenes.filter((s) => s.imageStatus === 'failed').length;
  const allImagesDone = scenes.length > 0 && imagesReadyCount === scenes.length;

  const videoReadyCount = scenes.filter((s) => s.videoClipStatus === 'ready').length;
  const videoFailedCount = scenes.filter(
    (s) => s.videoClipStatus === 'failed' || s.videoClipStatus === 'corrupted'
  ).length;
  const allVideosDone = scenes.length > 0 && videoReadyCount === scenes.length;

  const audioReadyCount = scenes.filter((s) => s.dialogueAudioStatus === 'ready').length;
  const audioFailedCount = scenes.filter((s) => s.dialogueAudioStatus === 'missing').length;
  const allAudioDone = scenes.length > 0 && audioReadyCount === scenes.length;

  const musicDone = scenes.length > 0 && scenes.every((s) => s.musicSfxStatus === 'ready');
  const vfxDone = scenes.length > 0 && scenes.every((s) => s.vfxStatus === 'ready');

  const syncDone =
    scenes.length > 0 &&
    scenes.every((s) => s.syncStatus === 'synced' && Math.abs(s.syncOffsetMs || 0) <= 120);
  const syncFailed = scenes.some((s) => s.syncStatus === 'out_of_sync');

  const openErrors = (project.qualityIssues || []).filter((q) => q.status === 'open');
  const criticalOpenErrors = openErrors.filter((q) => q.severity === 'error');

  const stepStatusMap: Record<number, { status: StepStatus; note?: string }> = {
    1: { status: 'complete', note: 'Project initialized' },
    2: { status: hasPrompt ? 'complete' : 'pending', note: hasPrompt ? 'Prompt saved' : 'Waiting for story prompt' },
    3: { status: hasStory ? 'complete' : 'pending', note: hasStory ? 'Full story & acts ready' : 'Pending story generation' },
    4: { status: hasCharacters ? 'complete' : 'pending', note: hasCharacters ? `${project.characters.length} characters seed-locked` : 'Pending character design' },
    5: { status: hasStoryboard ? 'complete' : 'pending', note: hasStoryboard ? `${scenes.length} storyboard scenes` : 'Pending storyboard' },
    6: {
      status: imagesFailedCount > 0 ? 'failed' : allImagesDone ? 'complete' : 'pending',
      note:
        imagesFailedCount > 0
          ? `${imagesFailedCount} image(s) failed`
          : `${imagesReadyCount}/${scenes.length} story images ready`,
    },
    7: {
      status: videoFailedCount > 0 ? 'failed' : allVideosDone ? 'complete' : 'pending',
      note:
        videoFailedCount > 0
          ? `${videoFailedCount} scenes failed`
          : `${videoReadyCount}/${scenes.length} video clips rendered`,
    },
    8: {
      status: audioFailedCount > 0 ? 'failed' : allAudioDone ? 'complete' : 'pending',
      note:
        audioFailedCount > 0
          ? `${audioFailedCount} scene audio missing`
          : `${audioReadyCount}/${scenes.length} dialogue tracks ready`,
    },
    9: {
      status: musicDone ? 'complete' : 'pending',
      note: musicDone ? 'Background score & SFX layered' : 'Pending music & SFX',
    },
    10: {
      status: vfxDone ? 'complete' : 'pending',
      note: vfxDone ? 'Animation & VFX shaders applied' : 'Pending VFX pass',
    },
    11: {
      status: syncFailed ? 'failed' : syncDone ? 'complete' : 'pending',
      note: syncFailed ? 'A/V sync offset detected' : syncDone ? 'Video, voice & audio synced' : 'Pending A/V sync',
    },
    12: {
      status: project.previewGenerated ? 'complete' : 'pending',
      note: project.previewGenerated ? 'Preview Ready — Editing Required' : 'Pending full preview',
    },
    13: {
      status: project.timelineAdded ? 'complete' : 'pending',
      note: project.timelineAdded ? 'Added to editing timeline' : 'Waiting to add clips to timeline',
    },
    14: {
      status:
        criticalOpenErrors.length > 0 && (project.previewGenerated || project.timelineAdded)
          ? 'failed'
          : project.editingCompleted && criticalOpenErrors.length === 0
          ? 'complete'
          : 'pending',
      note:
        criticalOpenErrors.length > 0
          ? `${criticalOpenErrors.length} error(s) require fixing`
          : project.editingCompleted
          ? 'Edits & quality checks verified'
          : 'Editing required before approval',
    },
    15: {
      status: !project.previewGenerated || !project.timelineAdded || !project.editingCompleted || criticalOpenErrors.length > 0
        ? 'locked'
        : project.finalApprovalConfirmed
        ? 'complete'
        : 'waiting_confirmation',
      note: !project.previewGenerated || !project.timelineAdded || !project.editingCompleted || criticalOpenErrors.length > 0
        ? 'Locked until preview, timeline editing & quality checks pass'
        : project.finalApprovalConfirmed
        ? 'Final video approved by creator'
        : 'Waiting for confirmation',
    },
    16: {
      status: !project.finalApprovalConfirmed
        ? 'locked'
        : project.renderJob?.status === 'failed'
        ? 'failed'
        : project.renderJob?.status === 'completed' && project.renderJob.verified
        ? 'complete'
        : project.renderJob?.status === 'rendering'
        ? 'in_progress'
        : 'pending',
      note: !project.finalApprovalConfirmed
        ? 'Locked until Final Approval'
        : project.renderJob?.status === 'completed' && project.renderJob.verified
        ? `MP4 rendered & verified (${Math.round((project.renderJob.fileSizeBytes || 0) / 1024)} KB)`
        : project.renderJob?.status === 'failed'
        ? project.renderJob.errorMessage || 'Render failed'
        : 'Ready to render final MP4',
    },
    17: {
      status:
        project.finalApprovalConfirmed && project.renderJob?.status === 'completed' && project.renderJob.verified
          ? 'complete'
          : 'locked',
      note:
        project.finalApprovalConfirmed && project.renderJob?.status === 'completed' && project.renderJob.verified
          ? 'Verified MP4 ready to download'
          : 'Locked until Final Render & Verification',
    },
  };

  const stepStates: StepStateEntry[] = WORKFLOW_STEP_DEFINITIONS.map((def) => ({
    stepNumber: def.stepNumber,
    key: def.key,
    label: def.label,
    phase: def.phase,
    status: stepStatusMap[def.stepNumber]?.status || 'pending',
    note: stepStatusMap[def.stepNumber]?.note,
  }));

  const completedCount = stepStates.filter((s) => s.status === 'complete').length;
  const overallProgress = Math.round((completedCount / WORKFLOW_STEP_DEFINITIONS.length) * 100);

  const firstFailed = stepStates.find((s) => s.status === 'failed');
  const firstPendingOrWait = stepStates.find(
    (s) => s.status === 'pending' || s.status === 'waiting_confirmation' || s.status === 'in_progress'
  );
  const currentStepNumber = firstFailed?.stepNumber || firstPendingOrWait?.stepNumber || 17;

  let nextPreviewStatus = project.previewStatus;
  if (project.finalApprovalConfirmed) {
    nextPreviewStatus = 'approved';
  } else if (project.editingCompleted && criticalOpenErrors.length === 0 && project.previewGenerated) {
    nextPreviewStatus = 'edited_ready_for_approval';
  } else if (project.previewGenerated) {
    nextPreviewStatus = 'preview_ready_editing_required';
  } else {
    nextPreviewStatus = 'not_ready';
  }

  const azSteps = computeAz23Steps(project, {
    hasStory,
    hasCharacters,
    hasStoryboard,
    allImagesDone,
    imagesFailedCount,
    allVideosDone,
    videoFailedCount,
    allAudioDone,
    audioFailedCount,
    musicDone,
    vfxDone,
    syncDone,
    syncFailed,
    criticalOpenErrorsCount: criticalOpenErrors.length,
  });
  const azCompleted = azSteps.filter((s) => s.status === 'complete').length;
  const azProgress = Math.round((azCompleted / azSteps.length) * 100);
  const generationJobs = computeGenerationJobs(project, azSteps);

  return {
    ...project,
    movieTitle: project.movieTitle || project.name,
    durationMinutes: project.durationMinutes || 20,
    resolution: project.resolution || '1920x1080',
    frameRate: project.frameRate || 24,
    renderSettings: project.renderSettings || {
      codec: 'H.264',
      resolution: '1080p',
      fps: 24,
      audioCodec: 'AAC',
      subtitlesMode: 'Embedded',
      quality: 'High',
    },
    previewStatus: nextPreviewStatus,
    stepStates,
    azSteps,
    azProgress,
    generationJobs,
    overallProgress,
    currentStepNumber,
    updatedAt: new Date().toISOString(),
  };
}

function computeAz23Steps(
  project: CartoonFilmProject,
  flags: {
    hasStory: boolean;
    hasCharacters: boolean;
    hasStoryboard: boolean;
    allImagesDone: boolean;
    imagesFailedCount: number;
    allVideosDone: boolean;
    videoFailedCount: number;
    allAudioDone: boolean;
    audioFailedCount: number;
    musicDone: boolean;
    vfxDone: boolean;
    syncDone: boolean;
    syncFailed: boolean;
    criticalOpenErrorsCount: number;
  }
): AzStepState[] {
  const scenes = project.scenes || [];
  const subtitlesReady = scenes.length > 0 && scenes.every((s) => s.subtitleStatus === 'ready');
  const renderDone =
    project.finalApprovalConfirmed &&
    project.renderJob?.status === 'completed' &&
    Boolean(project.renderJob?.verified);
  const readyForApproval =
    project.previewGenerated &&
    project.timelineAdded &&
    project.editingCompleted &&
    flags.criticalOpenErrorsCount === 0;

  return [
    { stepNumber: 1, module: 'New Project', creates: 'Movie project and settings', status: 'complete', note: `${project.resolution || '1920x1080'} · ${project.frameRate || 24} FPS · ${project.language}`, mappedLegacyStep: 1 },
    { stepNumber: 2, module: 'Story Generator', creates: 'Complete movie story', status: flags.hasStory ? 'complete' : 'pending', note: flags.hasStory ? 'Story approved & saved' : 'Enter prompt & generate story', mappedLegacyStep: 3 },
    { stepNumber: 3, module: 'Screenplay Generator', creates: 'Scenes and dialogue', status: project.screenplayGenerated || flags.hasStoryboard ? 'complete' : 'pending', note: project.screenplayGenerated || flags.hasStoryboard ? `${scenes.length || 4} screenplay scenes ready` : 'Convert story into screenplay', mappedLegacyStep: 5 },
    { stepNumber: 4, module: 'Character Studio', creates: 'Cartoon characters', status: flags.hasCharacters ? 'complete' : 'pending', note: flags.hasCharacters ? `${project.characters.length} seed-locked characters` : 'Generate consistent characters', mappedLegacyStep: 4 },
    { stepNumber: 5, module: 'Character Voice Studio', creates: 'Voice for each character', status: project.voicesAssigned || flags.allAudioDone ? 'complete' : 'pending', note: project.voicesAssigned || flags.allAudioDone ? `Voices assigned (${project.language})` : 'Assign voice profiles', mappedLegacyStep: 8 },
    { stepNumber: 6, module: 'World & Background Studio', creates: 'Locations and environments', status: project.backgroundsGenerated || flags.allImagesDone ? 'complete' : 'pending', note: project.backgroundsGenerated || flags.allImagesDone ? 'Environment plates saved to library' : 'Generate scene backgrounds', mappedLegacyStep: 6 },
    { stepNumber: 7, module: 'Storyboard Generator', creates: 'Images for every scene', status: flags.hasStoryboard ? 'complete' : 'pending', note: flags.hasStoryboard ? `${scenes.length} storyboard panels` : 'Generate scene panels', mappedLegacyStep: 5 },
    { stepNumber: 8, module: 'Shot Planner', creates: 'Camera angles and shot lists', status: project.shotPlanGenerated || flags.hasStoryboard ? 'complete' : 'pending', note: project.shotPlanGenerated || flags.hasStoryboard ? `${scenes.length} camera shots planned` : 'Plan shot IDs & camera moves', mappedLegacyStep: 5 },
    { stepNumber: 9, module: 'Image Generator', creates: 'Cartoon images', status: flags.imagesFailedCount > 0 ? 'failed' : flags.allImagesDone ? 'complete' : 'pending', note: flags.imagesFailedCount > 0 ? `${flags.imagesFailedCount} image(s) failed` : 'Auto-saved to Unified Library', mappedLegacyStep: 6 },
    { stepNumber: 10, module: 'Image-to-Video', creates: 'Animated video clips', status: flags.videoFailedCount > 0 ? 'failed' : flags.allVideosDone ? 'complete' : 'pending', note: flags.videoFailedCount > 0 ? `${flags.videoFailedCount} clip(s) failed` : `${scenes.filter((s) => s.videoClipStatus === 'ready').length}/${scenes.length} clips ready`, mappedLegacyStep: 7 },
    { stepNumber: 11, module: 'Animation Studio', creates: 'Character movement', status: project.animationApplied || flags.vfxDone ? 'complete' : 'pending', note: project.animationApplied || flags.vfxDone ? 'Motion, lip-sync & keyframes active' : 'Apply character animation', mappedLegacyStep: 10 },
    { stepNumber: 12, module: 'Voice Generator', creates: 'Dialogue and narration', status: flags.audioFailedCount > 0 ? 'failed' : flags.allAudioDone ? 'complete' : 'pending', note: flags.audioFailedCount > 0 ? `${flags.audioFailedCount} dialogue track(s) missing` : 'Saved to Voice Library', mappedLegacyStep: 8 },
    { stepNumber: 13, module: 'Music Studio', creates: 'Background music', status: flags.musicDone ? 'complete' : 'pending', note: flags.musicDone ? 'Background score mixed' : 'Add background music', mappedLegacyStep: 9 },
    { stepNumber: 14, module: 'SFX Studio', creates: 'Sound effects', status: flags.musicDone ? 'complete' : 'pending', note: flags.musicDone ? 'Foley & impact SFX layered' : 'Add sound effects', mappedLegacyStep: 9 },
    { stepNumber: 15, module: 'VFX Studio', creates: 'Visual effects', status: flags.vfxDone ? 'complete' : 'pending', note: flags.vfxDone ? 'Fire, magic & particles applied' : 'Apply VFX presets', mappedLegacyStep: 10 },
    { stepNumber: 16, module: 'Compositing Studio', creates: 'Combine visual layers', status: project.compositingDone || (flags.vfxDone && flags.syncDone) ? 'complete' : flags.syncFailed ? 'failed' : 'pending', note: flags.syncFailed ? 'A/V compositing drift detected' : 'Layers, lighting & sync combined', mappedLegacyStep: 11 },
    { stepNumber: 17, module: 'Subtitle Studio', creates: 'Subtitles and captions', status: subtitlesReady ? 'complete' : 'pending', note: subtitlesReady ? `${project.language} SRT/VTT ready` : 'Generate timed subtitles', mappedLegacyStep: 8 },
    { stepNumber: 18, module: 'Video Editor', creates: 'Professional editing timeline', status: project.timelineAdded ? 'complete' : 'pending', note: project.timelineAdded ? '8-track timeline populated' : 'Send assets to timeline', mappedLegacyStep: 13 },
    { stepNumber: 19, module: 'Quality Checker', creates: 'Detect and fix mistakes', status: flags.criticalOpenErrorsCount > 0 ? 'failed' : project.editingCompleted ? 'complete' : 'pending', note: flags.criticalOpenErrorsCount > 0 ? `${flags.criticalOpenErrorsCount} error(s) require fixing` : 'All quality checks passed', mappedLegacyStep: 14 },
    { stepNumber: 20, module: 'Preview Studio', creates: 'Preview complete movie', status: project.previewGenerated ? 'complete' : 'pending', note: project.previewGenerated ? 'Preview Ready (does not auto-approve)' : 'Generate movie preview', mappedLegacyStep: 12 },
    { stepNumber: 21, module: 'Final Approval', creates: 'User confirms final movie', status: !readyForApproval ? 'locked' : project.finalApprovalConfirmed ? 'complete' : 'waiting_confirmation', note: project.finalApprovalConfirmed ? 'Confirmed by creator' : readyForApproval ? 'Waiting for creator confirmation' : 'Complete editing & quality check first', mappedLegacyStep: 15 },
    { stepNumber: 22, module: 'Render Studio', creates: 'Render MP4', status: !project.finalApprovalConfirmed ? 'locked' : project.renderJob?.status === 'failed' ? 'failed' : renderDone ? 'complete' : project.renderJob?.status === 'rendering' ? 'in_progress' : 'pending', note: renderDone ? `${project.renderJob.fileName} verified` : !project.finalApprovalConfirmed ? 'Locked until Final Approval' : 'Ready to encode MP4', mappedLegacyStep: 16 },
    { stepNumber: 23, module: 'Export Studio', creates: 'Download completed movie', status: renderDone ? 'complete' : 'locked', note: renderDone ? 'MP4, subtitles & backup ready' : 'Locked until Render completes', mappedLegacyStep: 17 },
  ];
}

function computeGenerationJobs(
  project: CartoonFilmProject,
  azSteps: AzStepState[]
): GenerationJobItem[] {
  const jobs: GenerationJobItem[] = [];
  const stepMap = new Map(azSteps.map((s) => [s.stepNumber, s]));
  const mapStatus = (st?: StepStatus): GenerationJobItem['status'] => {
    if (st === 'complete') return 'completed';
    if (st === 'failed') return 'failed';
    if (st === 'in_progress') return 'processing';
    return 'pending';
  };

  jobs.push({
    id: `${project.id}-job-story`,
    label: 'Story & Screenplay Generation',
    azStepNumber: 2,
    status: mapStatus(stepMap.get(2)?.status),
    detail: stepMap.get(2)?.note,
  });
  jobs.push({
    id: `${project.id}-job-chars`,
    label: 'Character Studio & Voice Profiles',
    azStepNumber: 4,
    status: mapStatus(stepMap.get(4)?.status),
    detail: stepMap.get(4)?.note,
  });

  for (const sc of (project.scenes || []).slice(0, 6)) {
    jobs.push({
      id: `${project.id}-job-sc-vid-${sc.sceneNumber}`,
      label: `Scene ${String(sc.sceneNumber).padStart(2, '0')} Cartoon Video`,
      azStepNumber: 10,
      status:
        sc.videoClipStatus === 'ready'
          ? 'completed'
          : sc.videoClipStatus === 'failed' || sc.videoClipStatus === 'corrupted'
          ? 'failed'
          : 'pending',
      detail: sc.lastError || sc.title,
    });
  }

  jobs.push({
    id: `${project.id}-job-dialogue`,
    label: 'AI Dialogue & Subtitles',
    azStepNumber: 12,
    status: mapStatus(stepMap.get(12)?.status),
    detail: stepMap.get(12)?.note,
  });
  jobs.push({
    id: `${project.id}-job-music`,
    label: 'Background Music & SFX Mix',
    azStepNumber: 13,
    status: mapStatus(stepMap.get(13)?.status),
    detail: stepMap.get(13)?.note,
  });
  jobs.push({
    id: `${project.id}-job-vfx`,
    label: 'VFX & Compositing Pass',
    azStepNumber: 15,
    status: mapStatus(stepMap.get(15)?.status),
    detail: stepMap.get(15)?.note,
  });
  jobs.push({
    id: `${project.id}-job-render`,
    label: 'Final MP4 Render & FFprobe Verify',
    azStepNumber: 22,
    status: mapStatus(stepMap.get(22)?.status),
    detail: stepMap.get(22)?.note,
  });

  return jobs;
}

function buildSeedProjects(): CartoonFilmProject[] {
  const now = new Date().toISOString();

  // Project 001 — Matches prompt example ("Cartoon Adventure" with 2 scenes failed & Scene 4 missing audio!)
  const p1Raw: CartoonFilmProject = {
    id: 'proj-001',
    name: 'Project 001 – Cartoon Adventure',
    projectType: 'Cartoon Film',
    animationStyle: '3D Stylized Cartoon',
    aspectRatio: '16:9',
    language: 'English + Kannada',
    thumbnailUrl: CARTOON_IMAGE_POOL[0],
    storyPrompt:
      'A curious young astronomer Maya and her clockwork owl Pip discover a floating lantern observatory above a misty emerald valley and race to wind its starlit gears before eclipse.',
    fullStory:
      'Act I: Maya traces a glowing star map across the misty ridge and meets Pip, a brass clockwork owl.\nAct II: Together they board the floating lantern observatory, where ancient celestial gears have stalled.\nAct III: After solving the sundial chime puzzle and outsmarting a storm cloud sprite, Maya aligns the grand lens and illuminates the valley.',
    characters: [
      {
        id: 'char-maya',
        name: 'Maya (Lead Explorer)',
        role: 'Protagonist',
        appearancePrompt: 'Curly dark hair, patched teal satchel jacket, orange knit scarf, brass compass',
        consistencySeed: 882194,
        voiceStyle: 'Warm Energetic Youth Alto',
        avatarUrl: '/src/assets/images/cartoon_character_hero_1794924310265.jpg',
      },
      {
        id: 'char-pip',
        name: 'Pip (Clockwork Owl)',
        role: 'Companion',
        appearancePrompt: 'Miniature golden-brass owl with glowing amber eyes and filigree wings',
        consistencySeed: 882194,
        voiceStyle: 'Playful Melodic Chime',
        avatarUrl: '/src/assets/images/cartoon_adventure_thumb_1794924309261.jpg',
      },
    ],
    scenes: [
      {
        id: 'p1-s1',
        sceneNumber: 1,
        orderIndex: 1,
        title: 'Misty Valley Star Map',
        description: 'Maya holds up the glowing parchment map while Pip perches on her sleeve overlooking the floating observatory.',
        framing: 'Wide Shot',
        characterIds: ['char-maya', 'char-pip'],
        characterSeedUsed: 882194,
        storyImageUrl: CARTOON_IMAGE_POOL[0],
        imageStatus: 'ready',
        videoClipStatus: 'ready',
        dialogueText: 'Look Pip! The lantern observatory really is floating above the ridge!',
        dialogueAudioStatus: 'ready',
        musicSfxPreset: 'Wonder Strings + Mountain Breeze',
        musicSfxStatus: 'pending',
        vfxPreset: 'Golden Dusk Rim Bloom',
        vfxStatus: 'pending',
        syncOffsetMs: 0,
        syncStatus: 'pending',
        subtitleText: 'Look Pip! The lantern observatory really is floating above the ridge!',
        subtitleStatus: 'ready',
        durationSec: 4,
      },
      {
        id: 'p1-s2',
        sceneNumber: 2,
        orderIndex: 2,
        title: 'Clockwork Courtyard',
        description: 'Maya & Pip step across the cobblestone sky-bridge lined with warm golden lanterns.',
        framing: 'Medium Shot',
        characterIds: ['char-maya', 'char-pip'],
        characterSeedUsed: 882194,
        storyImageUrl: CARTOON_IMAGE_POOL[1],
        imageStatus: 'ready',
        videoClipStatus: 'ready',
        dialogueText: 'Careful on those mossy stones—one slip and we miss the eclipse window.',
        dialogueAudioStatus: 'ready',
        musicSfxPreset: 'Pizzicato Adventure Groove',
        musicSfxStatus: 'pending',
        vfxPreset: 'Floating Firefly Dust',
        vfxStatus: 'pending',
        syncOffsetMs: 0,
        syncStatus: 'pending',
        subtitleText: 'Careful on those mossy stones—one slip and we miss the eclipse window.',
        subtitleStatus: 'ready',
        durationSec: 4,
      },
      {
        id: 'p1-s3',
        sceneNumber: 3,
        orderIndex: 3,
        title: 'Celestial Gear Hall',
        description: 'Inside the dome, massive bronze gears rotate around a hovering star orb.',
        framing: 'Establishing',
        characterIds: ['char-maya'],
        characterSeedUsed: 882194,
        storyImageUrl: CARTOON_IMAGE_POOL[2],
        imageStatus: 'ready',
        videoClipStatus: 'corrupted',
        dialogueText: 'The central gear is jammed! Let us check the secondary chime lever.',
        dialogueAudioStatus: 'ready',
        musicSfxPreset: 'Deep Clockwork Chime',
        musicSfxStatus: 'pending',
        vfxPreset: 'Volumetric Light Shafts',
        vfxStatus: 'pending',
        syncOffsetMs: 0,
        syncStatus: 'pending',
        subtitleText: 'The central gear is jammed! Let us check the secondary chime lever.',
        subtitleStatus: 'ready',
        durationSec: 4,
        lastError: 'Black / corrupted transition frame detected at frame 42.',
      },
      {
        id: 'p1-s4',
        sceneNumber: 4,
        orderIndex: 4,
        title: 'Beacon Alignment Finale',
        description: 'Pip spins the brass key as the observatory cupola bursts into warm starlight across the valley.',
        framing: 'Close-up',
        characterIds: ['char-maya', 'char-pip'],
        characterSeedUsed: 882194,
        storyImageUrl: CARTOON_IMAGE_POOL[3],
        imageStatus: 'ready',
        videoClipStatus: 'failed',
        dialogueText: 'We did it! Every lantern in the valley is shining bright!',
        dialogueAudioStatus: 'missing',
        musicSfxPreset: 'Triumphant Brass Finale',
        musicSfxStatus: 'pending',
        vfxPreset: 'Starburst Halo & Lens Flare',
        vfxStatus: 'pending',
        syncOffsetMs: 320,
        syncStatus: 'out_of_sync',
        subtitleText: '',
        subtitleStatus: 'missing',
        durationSec: 4,
        lastError: 'Cartoon video render timed out and dialogue audio track is missing.',
      },
    ],
    storyboardGenerated: true,
    previewGenerated: false,
    previewStatus: 'not_ready',
    timelineAdded: false,
    editingCompleted: false,
    watchedFinalPreview: false,
    finalApprovalConfirmed: false,
    qualityIssues: [],
    lastQualityCheckAt: now,
    renderJob: {
      status: 'locked',
      progress: 0,
      verified: false,
    },
    stepStates: [],
    overallProgress: 0,
    currentStepNumber: 7,
    createdAt: now,
    updatedAt: now,
  };
  p1Raw.qualityIssues = runQualityInspection(p1Raw);

  // Project 002 — Manhwa Animation at Preview Ready — Editing Required!
  const p2Raw: CartoonFilmProject = {
    id: 'proj-002',
    name: 'Project 002 – Manhwa Animation',
    projectType: 'Manhwa Animation',
    animationStyle: '2D Cel Manhwa + Motion Parallax',
    aspectRatio: '9:16',
    language: 'English',
    thumbnailUrl: CARTOON_IMAGE_POOL[4],
    storyPrompt:
      'A lone blade master ascends the misty crimson temple steps to seal an ancient shadow rift before midnight.',
    fullStory:
      'Act I: Warrior Jin arrives at the ruined sky temple.\nAct II: A lightning clash shatters the stone courtyard.\nAct III: Jin channels golden seal energy to restore balance.',
    characters: [
      {
        id: 'char-jin',
        name: 'Jin (Shadow Blade)',
        role: 'Hero',
        appearancePrompt: 'Dark flowing cloak, silver blade, glowing amber scar',
        consistencySeed: 551029,
        voiceStyle: 'Deep Stoic Baritone',
        avatarUrl: CARTOON_IMAGE_POOL[4],
      },
    ],
    scenes: [
      {
        id: 'p2-s1',
        sceneNumber: 1,
        orderIndex: 1,
        title: 'Temple Ascent',
        description: 'Jin walks through lantern fog toward the crimson gate.',
        framing: 'Wide Shot',
        characterIds: ['char-jin'],
        characterSeedUsed: 551029,
        storyImageUrl: CARTOON_IMAGE_POOL[5],
        imageStatus: 'ready',
        videoClipStatus: 'ready',
        dialogueText: 'The seal weakens with every breath of wind.',
        dialogueAudioStatus: 'ready',
        musicSfxPreset: 'Taiko Percussion & Wind',
        musicSfxStatus: 'ready',
        vfxPreset: 'Ink Speedlines + Ember Fog',
        vfxStatus: 'ready',
        syncOffsetMs: 0,
        syncStatus: 'synced',
        subtitleText: 'The seal weakens with every breath of wind.',
        subtitleStatus: 'ready',
        durationSec: 4,
      },
      {
        id: 'p2-s2',
        sceneNumber: 2,
        orderIndex: 2,
        title: 'Blade Clash',
        description: 'Sparks erupt in slow-motion parallax across the temple courtyard.',
        framing: 'Close-up',
        characterIds: ['char-jin'],
        characterSeedUsed: 551029,
        storyImageUrl: CARTOON_IMAGE_POOL[6],
        imageStatus: 'ready',
        videoClipStatus: 'ready',
        dialogueText: 'Not one step further!',
        dialogueAudioStatus: 'ready',
        musicSfxPreset: 'Steel Clash + Sub Impact',
        musicSfxStatus: 'ready',
        vfxPreset: 'Anime Impact Frame Flash',
        vfxStatus: 'ready',
        syncOffsetMs: 0,
        syncStatus: 'synced',
        subtitleText: 'Not one step further!',
        subtitleStatus: 'ready',
        durationSec: 4,
      },
      {
        id: 'p2-s3',
        sceneNumber: 3,
        orderIndex: 3,
        title: 'Golden Seal Restored',
        description: 'Calm golden sunrise breaks over the temple pillars.',
        framing: 'Establishing',
        characterIds: ['char-jin'],
        characterSeedUsed: 551029,
        storyImageUrl: CARTOON_IMAGE_POOL[4],
        imageStatus: 'ready',
        videoClipStatus: 'ready',
        dialogueText: 'Until the next eclipse, the valley is safe.',
        dialogueAudioStatus: 'ready',
        musicSfxPreset: 'Ethereal Flute Outro',
        musicSfxStatus: 'ready',
        vfxPreset: 'Warm Morning Bloom',
        vfxStatus: 'ready',
        syncOffsetMs: 0,
        syncStatus: 'synced',
        subtitleText: 'Until the next eclipse, the valley is safe.',
        subtitleStatus: 'ready',
        durationSec: 4,
      },
    ],
    storyboardGenerated: true,
    previewGenerated: true,
    previewStatus: 'preview_ready_editing_required',
    timelineAdded: false,
    editingCompleted: false,
    watchedFinalPreview: false,
    finalApprovalConfirmed: false,
    qualityIssues: [],
    lastQualityCheckAt: now,
    renderJob: {
      status: 'locked',
      progress: 0,
      verified: false,
    },
    stepStates: [],
    overallProgress: 0,
    currentStepNumber: 13,
    createdAt: now,
    updatedAt: now,
  };
  p2Raw.qualityIssues = runQualityInspection(p2Raw);

  // Project 003 — Fresh Short Cartoon Video starting at Step 3
  const p3Raw: CartoonFilmProject = {
    id: 'proj-003',
    name: 'Project 003 – Short Cartoon Video',
    projectType: 'Short Cartoon Video',
    animationStyle: '2D Cel-Shaded European Cartoon',
    aspectRatio: '16:9',
    language: 'English',
    thumbnailUrl: CARTOON_IMAGE_POOL[1],
    storyPrompt:
      'A mischievous tabby cat in a sunny French town square races a bicycle courier to rescue a warm croissant before breakfast.',
    fullStory: '',
    characters: [],
    scenes: [],
    storyboardGenerated: false,
    previewGenerated: false,
    previewStatus: 'not_ready',
    timelineAdded: false,
    editingCompleted: false,
    watchedFinalPreview: false,
    finalApprovalConfirmed: false,
    qualityIssues: [],
    renderJob: {
      status: 'locked',
      progress: 0,
      verified: false,
    },
    stepStates: [],
    overallProgress: 0,
    currentStepNumber: 3,
    createdAt: now,
    updatedAt: now,
  };

  return [
    recomputeProjectSteps(p1Raw),
    recomputeProjectSteps(p2Raw),
    recomputeProjectSteps(p3Raw),
  ];
}

function loadProjectsDb(): CartoonFilmProject[] {
  ensureDirs();
  if (!fs.existsSync(DB_FILE)) {
    const seeded = buildSeedProjects();
    fs.writeFileSync(DB_FILE, JSON.stringify(seeded, null, 2), 'utf8');
    return seeded;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((p) => recomputeProjectSteps(p));
    }
  } catch {
    // recreate cleanly if corrupted
  }
  const seeded = buildSeedProjects();
  fs.writeFileSync(DB_FILE, JSON.stringify(seeded, null, 2), 'utf8');
  return seeded;
}

function saveProjectsDb(projects: CartoonFilmProject[]) {
  ensureDirs();
  fs.writeFileSync(DB_FILE, JSON.stringify(projects, null, 2), 'utf8');
}

export function listCartoonProjects(): CartoonFilmProject[] {
  return loadProjectsDb().map((p) => (p.azSteps && p.generationJobs ? p : recomputeProjectSteps(p)));
}

export function getCartoonProject(id: string): CartoonFilmProject | null {
  const all = loadProjectsDb();
  const found = all.find((p) => p.id === id);
  if (!found) return null;
  return found.azSteps && found.generationJobs ? found : recomputeProjectSteps(found);
}

export function createCartoonProject(input: {
  name: string;
  movieTitle?: string;
  projectType?: ProjectCategory;
  animationStyle?: string;
  aspectRatio?: '16:9' | '9:16';
  language?: string;
  durationMinutes?: number;
  resolution?: '1280x720' | '1920x1080' | '3840x2160';
  frameRate?: 24 | 25 | 30 | 60;
  storyPrompt: string;
}): CartoonFilmProject {
  const all = loadProjectsDb();
  const now = new Date().toISOString();
  const projectType: ProjectCategory =
    input.projectType === 'Manhwa Animation' || input.projectType === 'Short Cartoon Video'
      ? input.projectType
      : 'Cartoon Film';
  const thumb =
    projectType === 'Manhwa Animation'
      ? CARTOON_IMAGE_POOL[4]
      : projectType === 'Short Cartoon Video'
      ? CARTOON_IMAGE_POOL[1]
      : CARTOON_IMAGE_POOL[0];

  const cleanNum = String(all.length + 1).padStart(3, '0');
  const cleanName = String(input.name || `Project ${cleanNum} – ${projectType}`).trim().slice(0, 120);
  const created = recomputeProjectSteps({
    id: `proj-${Date.now().toString(36)}`,
    name: cleanName,
    movieTitle: String(input.movieTitle || cleanName).trim().slice(0, 120),
    projectType,
    animationStyle: String(input.animationStyle || '3D Stylized Cartoon').trim(),
    aspectRatio: input.aspectRatio === '9:16' ? '9:16' : '16:9',
    language: String(input.language || 'Kannada').trim(),
    durationMinutes: Math.max(1, Math.min(180, Number(input.durationMinutes) || 20)),
    resolution: input.resolution || '1920x1080',
    frameRate: input.frameRate || 24,
    thumbnailUrl: thumb,
    chapters: ['Chapter 1'],
    storyPrompt: String(input.storyPrompt || '').trim(),
    fullStory: '',
    characters: [],
    scenes: [],
    storyboardGenerated: false,
    previewGenerated: false,
    previewStatus: 'not_ready',
    timelineAdded: false,
    editingCompleted: false,
    watchedFinalPreview: false,
    finalApprovalConfirmed: false,
    qualityIssues: [],
    renderJob: { status: 'locked', progress: 0, verified: false },
    stepStates: [],
    overallProgress: 0,
    currentStepNumber: 2,
    createdAt: now,
    updatedAt: now,
  });

  all.unshift(created);
  saveProjectsDb(all);
  return created;
}

export function deleteCartoonProject(id: string): CartoonFilmProject[] {
  const next = loadProjectsDb().filter((p) => p.id !== id);
  saveProjectsDb(next);
  return next;
}

export function updateCartoonProjectMeta(
  projectId: string,
  patch: {
    name?: string;
    movieTitle?: string;
    newChapterTitle?: string;
    language?: string;
    animationStyle?: string;
    durationMinutes?: number;
    resolution?: '1280x720' | '1920x1080' | '3840x2160';
    frameRate?: 24 | 25 | 30 | 60;
    aspectRatio?: '16:9' | '9:16';
    renderSettings?: Partial<RenderExportSettings>;
    approvalChecklist?: Record<string, boolean>;
  }
): CartoonFilmProject {
  const existing = getCartoonProject(projectId);
  if (!existing) throw new Error('Cartoon project not found.');

  const p: CartoonFilmProject = JSON.parse(JSON.stringify(existing));
  if (patch.name !== undefined && patch.name.trim()) p.name = patch.name.trim().slice(0, 120);
  if (patch.newChapterTitle !== undefined) {
    const title = typeof patch.newChapterTitle === 'string' ? patch.newChapterTitle.trim() : '';
    if (!title || title.length > 120) throw new Error('Enter a chapter title of 1 to 120 characters.');
    p.chapters = [...(p.chapters ?? ['Chapter 1']), title];
  }
  if (patch.movieTitle !== undefined) p.movieTitle = patch.movieTitle.trim().slice(0, 120);
  if (patch.language !== undefined) p.language = patch.language.trim();
  if (patch.animationStyle !== undefined) p.animationStyle = patch.animationStyle.trim();
  if (patch.durationMinutes !== undefined) p.durationMinutes = Math.max(1, Math.min(180, Number(patch.durationMinutes) || 20));
  if (patch.resolution !== undefined) p.resolution = patch.resolution;
  if (patch.frameRate !== undefined) p.frameRate = patch.frameRate;
  if (patch.aspectRatio !== undefined) p.aspectRatio = patch.aspectRatio;
  if (patch.renderSettings) {
    p.renderSettings = {
      ...(p.renderSettings || {
        codec: 'H.264',
        resolution: '1080p',
        fps: 24,
        audioCodec: 'AAC',
        subtitlesMode: 'Embedded',
        quality: 'High',
      }),
      ...patch.renderSettings,
    };
  }
  if (patch.approvalChecklist) {
    p.approvalChecklist = { ...(p.approvalChecklist || {}), ...patch.approvalChecklist };
  }

  return saveSingleProject(p);
}

export function runAzWorkflowStep(
  projectId: string,
  azStepNumber: number,
  options?: { storyPrompt?: string; fullStory?: string }
): CartoonFilmProject {
  const step = Number(azStepNumber);
  const existing = getCartoonProject(projectId);
  if (!existing) throw new Error('Cartoon project not found.');

  const p: CartoonFilmProject = JSON.parse(JSON.stringify(existing));

  if (step === 1) {
    return saveSingleProject(p);
  }
  if (step === 2) {
    return runCartoonWorkflowStep(projectId, 3, options);
  }
  if (step === 3) {
    const updated = runCartoonWorkflowStep(projectId, 5, options);
    updated.screenplayGenerated = true;
    return saveSingleProject(updated);
  }
  if (step === 4) {
    return runCartoonWorkflowStep(projectId, 4, options);
  }
  if (step === 5) {
    const updated = runCartoonWorkflowStep(projectId, 8, options);
    updated.voicesAssigned = true;
    return saveSingleProject(updated);
  }
  if (step === 6) {
    const updated = runCartoonWorkflowStep(projectId, 6, options);
    updated.backgroundsGenerated = true;
    return saveSingleProject(updated);
  }
  if (step === 7) {
    return runCartoonWorkflowStep(projectId, 5, options);
  }
  if (step === 8) {
    const updated = runCartoonWorkflowStep(projectId, 5, options);
    updated.shotPlanGenerated = true;
    return saveSingleProject(updated);
  }
  if (step === 9) {
    return runCartoonWorkflowStep(projectId, 6, options);
  }
  if (step === 10) {
    return runCartoonWorkflowStep(projectId, 7, options);
  }
  if (step === 11) {
    const updated = runCartoonWorkflowStep(projectId, 10, options);
    updated.animationApplied = true;
    return saveSingleProject(updated);
  }
  if (step === 12 || step === 17) {
    return runCartoonWorkflowStep(projectId, 8, options);
  }
  if (step === 13 || step === 14) {
    return runCartoonWorkflowStep(projectId, 9, options);
  }
  if (step === 15) {
    return runCartoonWorkflowStep(projectId, 10, options);
  }
  if (step === 16) {
    const updated = runCartoonWorkflowStep(projectId, 11, options);
    updated.compositingDone = true;
    return saveSingleProject(updated);
  }
  if (step === 18) {
    return runCartoonWorkflowStep(projectId, 13, options);
  }
  if (step === 19) {
    return runCartoonWorkflowStep(projectId, 14, options);
  }
  if (step === 20) {
    return runCartoonWorkflowStep(projectId, 12, options);
  }
  if (step === 21) {
    return confirmFinalProjectApproval(projectId, true);
  }

  return saveSingleProject(p);
}

function saveSingleProject(project: CartoonFilmProject): CartoonFilmProject {
  const inspected = {
    ...project,
    qualityIssues: runQualityInspection(project),
    lastQualityCheckAt: new Date().toISOString(),
  };
  const recomputed = recomputeProjectSteps(inspected);
  const all = loadProjectsDb();
  const idx = all.findIndex((p) => p.id === recomputed.id);
  if (idx >= 0) {
    all[idx] = recomputed;
  } else {
    all.unshift(recomputed);
  }
  saveProjectsDb(all);
  return recomputed;
}

export function addReferenceAssetsToProject(
  projectId: string,
  assets: Array<{
    name: string;
    mimeType: string;
    sizeBytes?: number;
    dataUrl?: string;
    url?: string;
    sourceType?: 'upload' | 'manhwa_url';
  }>,
  chapterUrl?: string
): CartoonFilmProject {
  const existing = getCartoonProject(projectId);
  if (!existing) throw new Error('Cartoon project not found.');

  ensureDirs();
  const p: CartoonFilmProject = JSON.parse(JSON.stringify(existing));
  if (chapterUrl !== undefined) {
    p.chapterUrl = String(chapterUrl).trim();
  }

  const currentAssets = p.referenceImages ? [...p.referenceImages] : [];
  const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  const maxBytes = 10 * 1024 * 1024;

  for (const item of assets) {
    const mime = String(item.mimeType || 'image/png').toLowerCase();
    if (!allowedTypes.has(mime)) continue;

    let finalUrl = String(item.url || '').trim();
    let finalSize = Number(item.sizeBytes || 0);

    if (item.dataUrl && item.dataUrl.startsWith('data:image/')) {
      const commaIdx = item.dataUrl.indexOf(',');
      if (commaIdx > 0) {
        const b64 = item.dataUrl.slice(commaIdx + 1);
        const buf = Buffer.from(b64, 'base64');
        if (buf.length === 0 || buf.length > maxBytes) {
          continue;
        }
        finalSize = buf.length;
        const ext = mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png';
        const safeName = `${p.id.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now().toString(36)}_${Math.random()
          .toString(36)
          .slice(2, 7)}.${ext}`;
        fs.writeFileSync(path.join(ASSETS_DIR, safeName), buf);
        finalUrl = `/api/cartoon-assets/${safeName}`;
      }
    }

    if (!finalUrl || finalSize > maxBytes) continue;

    currentAssets.push({
      id: `ref-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name: String(item.name || 'reference-image').slice(0, 120),
      url: finalUrl,
      mimeType: mime,
      sizeBytes: finalSize,
      sourceType: item.sourceType === 'manhwa_url' ? 'manhwa_url' : 'upload',
      addedAt: new Date().toISOString(),
    });
  }

  p.referenceImages = currentAssets;
  if (currentAssets.length > 0 && p.scenes.length > 0) {
    p.scenes = assignUniqueSceneImages(p.scenes, currentAssets.map((asset) => asset.url));
    p.thumbnailUrl = currentAssets[0].url;
  } else if (currentAssets.length > 0 && !p.thumbnailUrl) {
    p.thumbnailUrl = currentAssets[0].url;
  }

  return saveSingleProject(p);
}

export function removeReferenceAssetFromProject(
  projectId: string,
  assetId: string
): CartoonFilmProject {
  const existing = getCartoonProject(projectId);
  if (!existing) throw new Error('Cartoon project not found.');

  const p: CartoonFilmProject = JSON.parse(JSON.stringify(existing));
  const target = (p.referenceImages || []).find((a) => a.id === assetId);
  p.referenceImages = (p.referenceImages || []).filter((a) => a.id !== assetId);

  if (target && target.url.startsWith('/api/cartoon-assets/')) {
    const fname = path.basename(target.url);
    const full = path.join(ASSETS_DIR, fname);
    if (fs.existsSync(full)) {
      try {
        fs.unlinkSync(full);
      } catch {
        // Ignore cleanup failure
      }
    }
  }

  return saveSingleProject(p);
}

export function parseCartoonChapters(story: string) {
  const headings = [...story.matchAll(/(?:^|(?<=[\s.!?]))([1-9]\d?)\.\s+([^—\r\n]+?)\s+—\s+/gu)];
  if (headings.length < 2 || headings.length > 25) return [];
  const chapters = headings.map((heading, index) => {
    const end = headings[index + 1]?.index ?? story.length;
    return {
      number: Number(heading[1]),
      title: heading[2].trim(),
      description: story.slice(heading.index + heading[0].length, end).trim(),
    };
  });
  return chapters.every((chapter, index) =>
    chapter.number === index + 1 && chapter.title && chapter.description
  ) ? chapters : [];
}

export function runCartoonWorkflowStep(
  projectId: string,
  stepNumber: number,
  options?: {
    storyPrompt?: string;
    fullStory?: string;
    sceneCount?: number;
    sceneNumber?: number;
    restartFailedOnly?: boolean;
  }
): CartoonFilmProject {
  const existing = getCartoonProject(projectId);
  if (!existing) throw new Error('Cartoon project not found.');

  let p: CartoonFilmProject = JSON.parse(JSON.stringify(existing));

  if (options?.storyPrompt !== undefined) {
    p.storyPrompt = String(options.storyPrompt).trim();
  }

  const targetStep = Number(stepNumber);
  const baseSeed = p.characters?.[0]?.consistencySeed || Math.floor(100000 + Math.random() * 899999);

  if (targetStep === 3 || (!p.fullStory && targetStep > 3)) {
    p.fullStory =
      options?.fullStory?.trim() ||
      `Act I — Setup: Guided by "${p.storyPrompt || p.name}", our hero sets out through a colorful animated world.\n` +
        `Act II — Discovery & Challenge: An unexpected mechanical riddle stalls their journey across the skyline.\n` +
        `Act III — Climax & Resolution: Working together with synchronized timing, they restore light and celebrate.`;
  }

  if (targetStep === 4 || (p.characters.length === 0 && targetStep > 4)) {
    if (p.characters.length === 0) {
      p.characters = [
        {
          id: `char-${Date.now().toString(36)}-1`,
          name: p.projectType === 'Manhwa Animation' ? 'Kai (Protagonist)' : 'Leo (Lead Hero)',
          role: 'Lead Character',
          appearancePrompt: `${p.animationStyle} protagonist with expressive eyes, satchel, and locked color palette`,
          consistencySeed: baseSeed,
          voiceStyle: 'Expressive Lead Alto/Tenor',
          avatarUrl: '/src/assets/images/cartoon_character_hero_1794924310265.jpg',
        },
        {
          id: `char-${Date.now().toString(36)}-2`,
          name: 'Milo (Companion)',
          role: 'Sidekick',
          appearancePrompt: `${p.animationStyle} lively sidekick with glowing lantern emblem`,
          consistencySeed: baseSeed,
          voiceStyle: 'Bright Playful Voice',
          avatarUrl: p.thumbnailUrl,
        },
      ];
    }
  }

  const chapters = parseCartoonChapters(p.storyPrompt || '');
  const refUrls = (p.referenceImages || []).map((a) => a.url).filter(Boolean);

  if (targetStep === 5 || (!p.storyboardGenerated && targetStep > 5)) {
    const count = chapters.length || Math.max(3, Math.min(25, Number(options?.sceneCount || p.scenes.length || refUrls.length || 4)));
    if (chapters.length) p.chapters = chapters.map((chapter) => chapter.title);
    if (p.scenes.length === 0 || (chapters.length > 0 && p.scenes.length < chapters.length)) {
      const existingScenes = p.scenes;
      const framings: CartoonSceneItem['framing'][] = [
        'Wide Shot',
        'Medium Shot',
        'Close-up',
        'Over-the-shoulder',
        'Establishing',
      ];
      const leadId = p.characters[0]?.id || 'char-1';
      p.scenes = Array.from({ length: count }, (_, idx) => {
        const scNum = idx + 1;
        const chapter = chapters[idx];
        const previous = existingScenes[idx];
        if (previous && (!chapter || previous.title === chapter.title)) return previous;
        const dialogue = chapter?.description || `Scene ${scNum} dialogue: Ready for action on beat ${scNum}!`;
        return {
          id: `${p.id}-sc-${scNum}`,
          sceneNumber: scNum,
          orderIndex: scNum,
          title: chapter?.title || `Scene ${scNum}: ${scNum === 1 ? 'Opening Horizon' : scNum === count ? 'Grand Finale' : `Sequence Beat ${scNum}`}`,
          description: chapter?.description || `${p.animationStyle} beat ${scNum} advancing "${(p.storyPrompt || p.name).slice(0, 90)}".`,
          framing: framings[idx % framings.length],
          characterIds: [leadId],
          characterSeedUsed: p.characters[0]?.consistencySeed || baseSeed,
          storyImageUrl: refUrls[idx] || CARTOON_IMAGE_POOL[idx] || '',
          imageStatus: 'pending',
          videoClipStatus: 'pending',
          dialogueText: dialogue,
          dialogueAudioStatus: 'pending',
          musicSfxPreset: scNum === count ? 'Triumphant Finale Score' : 'Upbeat Cartoon Underscore',
          musicSfxStatus: 'pending',
          vfxPreset: scNum % 2 === 0 ? 'Sparkle Rim Glow' : 'Atmospheric Depth Haze',
          vfxStatus: 'pending',
          syncOffsetMs: 0,
          syncStatus: 'pending',
          subtitleText: dialogue,
          subtitleStatus: 'pending',
          durationSec: 4,
        };
      });
    }
    p.scenes = assignUniqueSceneImages(p.scenes, refUrls);
    p.storyboardGenerated = true;
  }

  const shouldTouchScene = (sc: CartoonSceneItem, isFailed: boolean) => {
    if (options?.sceneNumber && sc.sceneNumber !== options.sceneNumber) return false;
    if (options?.restartFailedOnly && !isFailed) return false;
    return true;
  };

  if (targetStep === 6) {
    p.scenes = assignUniqueSceneImages(p.scenes, refUrls);
  } else if (targetStep === 7) {
    p.scenes = assignUniqueSceneImages(p.scenes, refUrls).map((sc) =>
      shouldTouchScene(sc, sc.videoClipStatus === 'failed' || sc.videoClipStatus === 'corrupted')
        ? { ...sc, videoClipStatus: sc.imageStatus === 'ready' ? 'ready' : 'failed' }
        : sc
    );
  } else if (targetStep === 8) {
    p.scenes = p.scenes.map((sc) =>
      shouldTouchScene(sc, sc.dialogueAudioStatus !== 'ready')
        ? {
            ...sc,
            dialogueText: sc.dialogueText || `Scene ${sc.sceneNumber} character voice line.`,
            dialogueAudioStatus: 'ready',
            subtitleText: sc.subtitleText || sc.dialogueText || `Scene ${sc.sceneNumber} character voice line.`,
            subtitleStatus: 'ready',
            lastError: undefined,
          }
        : sc
    );
  } else if (targetStep === 9) {
    p.scenes = p.scenes.map((sc) => ({
      ...sc,
      musicSfxStatus: 'ready',
    }));
  } else if (targetStep === 10) {
    p.scenes = p.scenes.map((sc) => ({
      ...sc,
      vfxStatus: 'ready',
    }));
  } else if (targetStep === 11) {
    p.scenes = p.scenes.map((sc) =>
      shouldTouchScene(sc, sc.syncStatus !== 'synced')
        ? {
            ...sc,
            syncOffsetMs: 0,
            syncStatus: 'synced',
            lastError: undefined,
          }
        : sc
    );
  } else if (targetStep === 12) {
    requireUniqueSceneImages(p.scenes);
    p.previewGenerated = true;
    // IMPORTANT: Preview is NEVER final confirmation!
    p.previewStatus = 'preview_ready_editing_required';
    p.finalApprovalConfirmed = false;
  } else if (targetStep === 13) {
    p.timelineAdded = true;
  } else if (targetStep === 14) {
    const remainingErrors = runQualityInspection(p).filter((q) => q.status === 'open' && q.severity === 'error');
    if (remainingErrors.length > 0) {
      throw new Error(
        `Cannot mark editing complete while ${remainingErrors.length} error(s) remain open. Fix or retry them first.`
      );
    }
    p.editingCompleted = true;
  }

  return saveSingleProject(p);
}

export function updateCartoonScene(
  projectId: string,
  sceneNumber: number,
  patch: Partial<Pick<CartoonSceneItem, 'title' | 'description' | 'framing' | 'dialogueText' | 'vfxPreset' | 'musicSfxPreset' | 'subtitleText' | 'durationSec'>> & {
    regenerate?: boolean;
    moveDirection?: 'up' | 'down';
  }
): CartoonFilmProject {
  const existing = getCartoonProject(projectId);
  if (!existing) throw new Error('Cartoon project not found.');

  let p: CartoonFilmProject = JSON.parse(JSON.stringify(existing));
  const idx = p.scenes.findIndex((s) => s.sceneNumber === sceneNumber);
  if (idx < 0) throw new Error(`Scene ${sceneNumber} not found.`);

  if (patch.moveDirection === 'up' && idx > 0) {
    const tmp = p.scenes[idx - 1];
    p.scenes[idx - 1] = p.scenes[idx];
    p.scenes[idx] = tmp;
  } else if (patch.moveDirection === 'down' && idx < p.scenes.length - 1) {
    const tmp = p.scenes[idx + 1];
    p.scenes[idx + 1] = p.scenes[idx];
    p.scenes[idx] = tmp;
  } else {
    const sc = p.scenes[idx];
    if (patch.title !== undefined) sc.title = patch.title;
    if (patch.description !== undefined) sc.description = patch.description;
    if (patch.framing !== undefined) sc.framing = patch.framing;
    if (patch.dialogueText !== undefined) {
      sc.dialogueText = patch.dialogueText;
      sc.subtitleText = patch.subtitleText ?? patch.dialogueText;
      sc.dialogueAudioStatus = sc.dialogueText.trim() ? 'ready' : 'missing';
      sc.subtitleStatus = sc.subtitleText.trim() ? 'ready' : 'missing';
    }
    if (patch.subtitleText !== undefined) {
      sc.subtitleText = patch.subtitleText;
      sc.subtitleStatus = sc.subtitleText.trim() ? 'ready' : 'missing';
    }
    if (patch.vfxPreset !== undefined) {
      sc.vfxPreset = patch.vfxPreset;
      sc.vfxStatus = 'ready';
    }
    if (patch.musicSfxPreset !== undefined) {
      sc.musicSfxPreset = patch.musicSfxPreset;
      sc.musicSfxStatus = 'ready';
    }
    if (patch.durationSec !== undefined) {
      sc.durationSec = Math.max(2, Math.min(30, Number(patch.durationSec) || 4));
    }
    if (patch.regenerate) {
      sc.imageStatus = 'ready';
      sc.videoClipStatus = 'ready';
      sc.dialogueAudioStatus = 'ready';
      sc.syncOffsetMs = 0;
      sc.syncStatus = 'synced';
      sc.subtitleText = sc.subtitleText || sc.dialogueText;
      sc.subtitleStatus = 'ready';
      sc.characterSeedUsed = p.characters[0]?.consistencySeed || sc.characterSeedUsed;
      sc.lastError = undefined;
    }
  }

  // Keep order cleanly re-indexed on reorder
  p.scenes = p.scenes.map((sc, i) => ({
    ...sc,
    sceneNumber: i + 1,
    orderIndex: i + 1,
  }));

  return saveSingleProject(p);
}

/**
 * Fix a detected quality issue AND immediately re-verify against the 9-point checker.
 */
export function resolveCartoonQualityIssue(
  projectId: string,
  issueId: string,
  action: 'auto_fix' | 'retry' | 'ignore' | 'manual_verified'
): { project: CartoonFilmProject; verifiedFixed: boolean; verificationNote: string } {
  const existing = getCartoonProject(projectId);
  if (!existing) throw new Error('Cartoon project not found.');

  let p: CartoonFilmProject = JSON.parse(JSON.stringify(existing));
  const issue = p.qualityIssues.find((q) => q.id === issueId);
  if (!issue) throw new Error('Quality issue not found.');

  if (action === 'ignore') {
    issue.status = 'ignored';
    const saved = saveSingleProject(p);
    return {
      project: saved,
      verifiedFixed: false,
      verificationNote: `Issue ignored: "${issue.problem}"`,
    };
  }

  const targetSceneNum = issue.sceneNumber;
  const leadSeed = p.characters[0]?.consistencySeed || 882194;

  if (issue.category === 'missing_or_duplicate_scene' || issue.category === 'scene_order') {
    const seen = new Set<number>();
    p.scenes = p.scenes
      .filter((s) => {
        if (seen.has(s.sceneNumber)) return false;
        seen.add(s.sceneNumber);
        return true;
      })
      .map((s, idx) => ({ ...s, sceneNumber: idx + 1, orderIndex: idx + 1 }));
  } else if (issue.category === 'render_error') {
    p.renderJob = { status: 'pending', progress: 0, verified: false };
  } else if (targetSceneNum !== undefined) {
    const scIdx = p.scenes.findIndex((s) => s.sceneNumber === targetSceneNum);
    if (scIdx >= 0) {
      const sc = p.scenes[scIdx];
      if (issue.category === 'character_consistency') {
        sc.characterSeedUsed = leadSeed;
        sc.imageStatus = 'ready';
      } else if (issue.category === 'missing_media' || issue.category === 'corrupted_video') {
        p.scenes = assignUniqueSceneImages(p.scenes, (p.referenceImages || []).map((asset) => asset.url));
        const repaired = p.scenes[scIdx];
        if (issue.category === 'corrupted_video') {
          repaired.videoClipStatus = repaired.imageStatus === 'ready' ? 'ready' : 'failed';
        }
      } else if (issue.category === 'missing_audio') {
        sc.dialogueText = sc.dialogueText?.trim() || `Scene ${sc.sceneNumber}: Voice dialogue synchronized.`;
        sc.dialogueAudioStatus = 'ready';
        sc.subtitleText = sc.subtitleText?.trim() || sc.dialogueText;
        sc.subtitleStatus = 'ready';
        sc.lastError = undefined;
      } else if (issue.category === 'av_sync') {
        sc.syncOffsetMs = 0;
        sc.syncStatus = 'synced';
        sc.lastError = undefined;
      } else if (issue.category === 'missing_subtitles') {
        sc.subtitleText = sc.dialogueText?.trim() || `Scene ${sc.sceneNumber} narration caption.`;
        sc.subtitleStatus = 'ready';
      }
    }
  }

  // Re-run inspection to verify the fix actually resolved the problem
  const recheckedIssues = runQualityInspection(p);
  const stillFailing = recheckedIssues.find(
    (q) => q.category === issue.category && q.sceneNumber === issue.sceneNumber && q.status === 'open'
  );

  if (!stillFailing) {
    const verifiedEntry: QualityIssueItem = {
      ...issue,
      status: 'fixed_verified',
      verifiedAfterFix: true,
      verifiedAt: new Date().toISOString(),
    };
    p.qualityIssues = [verifiedEntry, ...recheckedIssues.filter((q) => q.id !== issue.id)];
  } else {
    p.qualityIssues = recheckedIssues;
  }

  const saved = recomputeProjectSteps({
    ...p,
    lastQualityCheckAt: new Date().toISOString(),
  });
  const all = loadProjectsDb();
  const idx = all.findIndex((item) => item.id === saved.id);
  if (idx >= 0) all[idx] = saved;
  saveProjectsDb(all);

  return {
    project: saved,
    verifiedFixed: !stillFailing,
    verificationNote: !stillFailing
      ? `Fixed and verified: "${issue.problem}"`
      : `Retry ran, but issue still requires attention: "${stillFailing.problem}"`,
  };
}

export function confirmFinalProjectApproval(
  projectId: string,
  watchedFinalPreview: boolean
): CartoonFilmProject {
  const existing = getCartoonProject(projectId);
  if (!existing) throw new Error('Cartoon project not found.');
  if (!watchedFinalPreview) {
    throw new Error('Please watch the final preview before confirming Final Approval.');
  }

  const openCritical = runQualityInspection(existing).filter(
    (q) => q.status === 'open' && q.severity === 'error'
  );
  if (!existing.previewGenerated || !existing.timelineAdded || !existing.editingCompleted) {
    throw new Error(
      'Final Approval is locked until Preview, Add to Editing Timeline, and Editing steps are completed.'
    );
  }
  if (openCritical.length > 0) {
    throw new Error(
      `Cannot approve film while ${openCritical.length} quality error(s) remain unfixed.`
    );
  }

  const p: CartoonFilmProject = {
    ...existing,
    watchedFinalPreview: true,
    finalApprovalConfirmed: true,
    previewStatus: 'approved',
    renderJob: {
      ...existing.renderJob,
      status: existing.renderJob.verified ? 'completed' : 'pending',
    },
  };
  return saveSingleProject(p);
}

const activeCartoonRenders = new Set<string>();

/** Render the approved film with synchronized scene dialogue. */
export async function renderAndVerifyCartoonMp4(
  projectId: string,
  synthesizeDialogue: (text: string, language: string) => Promise<{ audioBuffer: Buffer; mimeType: string } | null>
): Promise<CartoonFilmProject> {
  const existing = getCartoonProject(projectId);
  if (!existing) throw new Error('Cartoon project not found.');
  if (!existing.finalApprovalConfirmed) {
    throw new Error('Render Final Video is locked until Final Preview & Approval is explicitly confirmed.');
  }

  ensureDirs();
  const safeBase = existing.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const outMp4Path = path.join(RENDER_DIR, `${safeBase}.mp4`);
  if (activeCartoonRenders.has(projectId)) throw new Error('This film is already rendering.');
  const tempDir = fs.mkdtempSync(path.join(RENDER_DIR, 'cartoon-render-'));
  const concatListPath = path.join(tempDir, 'images.txt');
  const audioPath = path.join(tempDir, 'dialogue.pcm');
  const tempMp4Path = path.join(tempDir, 'film.mp4');
  activeCartoonRenders.add(projectId);
  try {
    const scenes = [...existing.scenes].sort((a, b) => a.orderIndex - b.orderIndex);
    const sampleRate = 48000;
    const sceneFiles: { filePath: string; durationSec: number }[] = [];
    fs.writeFileSync(audioPath, Buffer.alloc(0));
    const imagePaths = requireUniqueSceneImages(scenes);
    for (const [index, sc] of scenes.entries()) {
      const dialogue = sc.dialogueText?.trim();
      let pcm = Buffer.alloc(0);
      if (dialogue) {
        const speech = await synthesizeDialogue(dialogue, existing.language);
        if (!speech?.audioBuffer.length) {
          throw new Error(`Scene ${sc.sceneNumber}: dialogue audio could not be generated. Check the studio voice provider and retry.`);
        }
        const voicePath = path.join(tempDir, 'voice');
        const pcmPath = path.join(tempDir, 'voice.pcm');
        fs.writeFileSync(voicePath, speech.audioBuffer);
        const pcmRate = speech.mimeType.match(/rate=(\d+)/i)?.[1] || '24000';
        const inputOptions = /audio\/(?:l16|pcm)/i.test(speech.mimeType)
          ? ['-f', 's16le', '-ar', pcmRate, '-ac', '1']
          : [];
        await execFileAsync('ffmpeg', [
          '-v', 'error', '-y', ...inputOptions, '-i', voicePath,
          '-vn', '-ac', '1', '-ar', String(sampleRate), '-f', 's16le', pcmPath,
        ], { timeout: 30000 });
        pcm = fs.readFileSync(pcmPath);
        if (!pcm.some((byte) => byte !== 0)) throw new Error(`Scene ${sc.sceneNumber}: the voice provider returned silent audio.`);
      }
      const sceneDuration = Math.max(2, Math.min(180, Number(sc.durationSec) || 3));
      const durationSec = Math.ceil(Math.max(sceneDuration, pcm.length / (sampleRate * 2)) * 25) / 25;
      fs.appendFileSync(audioPath, pcm);
      fs.appendFileSync(audioPath, Buffer.alloc(Math.round(durationSec * sampleRate) * 2 - pcm.length));
      sceneFiles.push({
        filePath: imagePaths[index],
        durationSec,
      });
    }

    if (sceneFiles.length === 0) throw new Error('Add scenes before rendering the film.');

    const concatBody =
      sceneFiles
        .map((item) => `file '${item.filePath.replace(/'/g, "'\\''")}'\nduration ${item.durationSec}`)
        .join('\n') +
      `\nfile '${sceneFiles[sceneFiles.length - 1].filePath.replace(/'/g, "'\\''")}'\n`;

    fs.writeFileSync(concatListPath, concatBody, 'utf8');

    const totalSec = sceneFiles.reduce((sum, s) => sum + s.durationSec, 0);
    const scaleFilter =
      existing.aspectRatio === '9:16'
        ? 'scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2,format=yuv420p'
        : 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,format=yuv420p';

    const visualTreatment = existing.animationStyle === '2D Anime (Cel Shading)'
      ? ',eq=contrast=1.12:saturation=1.25,unsharp=5:5:0.65'
      : '';

    await execFileAsync('ffmpeg', [
      '-v', 'error',
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      concatListPath,
      '-f', 's16le', '-ar', String(sampleRate), '-ac', '1',
      '-i', audioPath,
      '-map', '0:v:0', '-map', '1:a:0',
      '-t', String(totalSec),
      '-vf',
      `${scaleFilter}${visualTreatment},fps=24,tpad=stop_mode=clone:stop_duration=1`,
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-c:a',
      'aac',
      '-movflags',
      '+faststart',
      tempMp4Path,
    ]);

    // Verify rendered file via fs.statSync + ffprobe
    if (!fs.existsSync(tempMp4Path)) {
      throw new Error('Rendered MP4 file was not created on disk.');
    }
    const stats = fs.statSync(tempMp4Path);
    if (stats.size < 2048) {
      throw new Error('Rendered MP4 file verification failed (output too small).');
    }

    const { stdout: probeOut } = await execFileAsync('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      tempMp4Path,
    ]);
    const verifiedDuration = Number.parseFloat(String(probeOut || totalSec).trim()) || totalSec;

    const latest = getCartoonProject(projectId);
    if (!latest) throw new Error('Cartoon project was deleted during rendering.');
    fs.renameSync(tempMp4Path, outMp4Path);
    const p: CartoonFilmProject = {
      ...latest,
      renderJob: {
        status: 'completed',
        progress: 100,
        verified: true,
        fileName: `${existing.name.replace(/[^a-zA-Z0-9_-]+/g, '_')}.mp4`,
        fileSizeBytes: stats.size,
        durationSec: Math.round(verifiedDuration * 10) / 10,
        renderedAt: new Date().toISOString(),
      },
    };
    return saveSingleProject(p);
  } catch (err: any) {
    const latest = getCartoonProject(projectId);
    if (!latest) throw err;
    const failedProject: CartoonFilmProject = {
      ...latest,
      renderJob: {
        status: 'failed',
        progress: 0,
        verified: false,
        errorMessage: err?.message || 'FFmpeg render verification failed.',
      },
    };
    return saveSingleProject(failedProject);
  } finally {
    activeCartoonRenders.delete(projectId);
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

export function getVerifiedRenderMp4Path(projectId: string): {
  filePath: string;
  fileName: string;
} | null {
  const project = getCartoonProject(projectId);
  if (!project || !project.renderJob?.verified || project.renderJob.status !== 'completed') {
    return null;
  }
  const safeBase = project.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const outMp4Path = path.join(RENDER_DIR, `${safeBase}.mp4`);
  if (!fs.existsSync(outMp4Path)) return null;
  return {
    filePath: outMp4Path,
    fileName: project.renderJob.fileName || `${safeBase}.mp4`,
  };
}
