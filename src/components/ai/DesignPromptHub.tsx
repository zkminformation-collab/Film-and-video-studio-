import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  Search,
  Star,
  Copy,
  Check,
  ArrowRight,
  Plus,
  Layers,
  LayoutTemplate,
  Sliders,
  Clock,
  X,
  Palette,
  Upload,
  Edit3,
  CopyPlus,
  History,
  Globe,
  Lock,
  Cpu,
  Save,
} from 'lucide-react';
import { StudioModule } from '../../types';
import { useStudioAi } from '../../context/StudioAiContext';
import { soundFx } from '../../utils/audioSynth';

interface DesignLibraryItem {
  id: string;
  name: string;
  category: string;
  previewUrl: string;
  description: string;
  associatedPrompts: string[];
  editableSettings: Record<string, string>;
  license: string;
  source: string;
  targetModule: string;
  isFavourite: boolean;
}

type PromptOrigin = 'builtin' | 'user_created' | 'user_imported' | 'ai_generated';

interface VariablePromptItem {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  category: string;
  promptTemplate: string;
  defaultVariables: Record<string, string>;
  provider?: string;
  model?: string;
  tags?: string[];
  targetModule: string;
  scope: 'builtin' | 'my' | 'community';
  origin?: PromptOrigin;
  is_public?: boolean;
  isFavourite: boolean;
  version?: number;
  usageCount: number;
  lastUsedAt?: string | null;
}

interface PromptVersionEntry {
  id: string;
  prompt_id: string;
  version: number;
  title: string;
  promptTemplate: string;
  savedAt: string;
}

interface StudioTemplateItem {
  id: string;
  name: string;
  category: string;
  description: string;
  aspectRatio: string;
  duration: string;
  visualStyle: string;
  includedModules: string[];
  starterPrompt: string;
  targetModule: string;
  previewUrl: string;
}

interface DesignPromptHubProps {
  activeTab: 'prompts' | 'designs' | 'templates';
  onNavigate: (module: StudioModule) => void;
}

const DEFAULT_26_PROMPT_CATEGORIES = [
  'AI Film Prompts',
  'Story Prompts',
  'Screenplay Prompts',
  'Scene Prompts',
  'Character Prompts',
  'Background Prompts',
  'Storyboard Prompts',
  'AI Image Prompts',
  'Image Editing Prompts',
  'AI Video Prompts',
  'Image-to-Video Prompts',
  'Animation Prompts',
  'Manhwa Prompts',
  'Camera Prompts',
  'Lighting Prompts',
  'Voice Prompts',
  'Emotion Prompts',
  'Lip-Sync Prompts',
  'Music Prompts',
  'Sound Effects Prompts',
  'VFX Prompts',
  'Transition Prompts',
  'Subtitle Prompts',
  'Editing Prompts',
  'Thumbnail Prompts',
  'Marketing Prompts',
];

const DESIGN_CATEGORIES = [
  'All',
  'Film Styles',
  'Animation',
  'Manhwa',
  'Character Designs',
  'Backgrounds',
  'Camera Designs',
  'Lighting',
  'VFX Designs',
  'Transitions',
  'Typography',
  'UI Designs',
];

const AI_PROVIDER_MODELS: Record<string, string[]> = {
  Gemini: ['gemini-2.5-flash', 'gemini-2.5-pro'],
  Veo: ['veo-3.1-generate-preview', 'veo-2.0-generate-001'],
  Imagen: ['imagen-3.0-generate-002', 'gemini-2.5-flash-image'],
  Runway: ['gen-4-turbo', 'gen-3-alpha-turbo'],
  Kling: ['kling-v2-master', 'kling-v1.6-pro'],
  Luma: ['ray-2', 'dream-machine-1.6'],
  ElevenLabs: ['eleven_multilingual_v2', 'eleven_flash_v2_5'],
  Suno: ['suno-v4', 'suno-v3.5'],
  OpenAI: ['gpt-4.1', 'sora-2'],
};

const ORIGIN_META: Record<PromptOrigin, { label: string; className: string }> = {
  builtin: {
    label: 'Built-in Example',
    className: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
  },
  user_created: {
    label: 'User Created',
    className: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  },
  user_imported: {
    label: 'User Imported',
    className: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  },
  ai_generated: {
    label: 'AI Generated',
    className: 'bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30',
  },
};

const getTargetModuleForCategory = (cat: string): StudioModule => {
  const lower = cat.toLowerCase();
  if (lower.includes('image') || lower.includes('thumbnail') || lower.includes('background')) return 'ai_image';
  if (lower.includes('character') || lower.includes('emotion')) return 'character';
  if (lower.includes('storyboard')) return 'storyboard';
  if (lower.includes('voice') || lower.includes('lip-sync')) return 'ai_voice';
  if (lower.includes('music') || lower.includes('sound')) return 'audio';
  if (lower.includes('vfx') || lower.includes('transition')) return 'vfx';
  if (lower.includes('manhwa') || lower.includes('animation')) return 'animation';
  if (lower.includes('film') || lower.includes('story') || lower.includes('screenplay') || lower.includes('scene')) {
    return 'ai_wizard';
  }
  return 'ai_video';
};

export const DesignPromptHub: React.FC<DesignPromptHubProps> = ({ activeTab, onNavigate }) => {
  const { loadPromptIntoTool } = useStudioAi();

  const [prompts, setPrompts] = useState<VariablePromptItem[]>([]);
  const [promptCategories, setPromptCategories] = useState<string[]>(DEFAULT_26_PROMPT_CATEGORIES);
  const [designs, setDesigns] = useState<DesignLibraryItem[]>([]);
  const [templates, setTemplates] = useState<StudioTemplateItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notice, setNotice] = useState<string>('');

  // Prompt Library state
  const [promptScope, setPromptScope] = useState<
    'all' | 'my' | 'builtin' | 'community' | 'favourites' | 'recent'
  >('all');
  const [promptCat, setPromptCat] = useState<string>('All');
  const [promptSearch, setPromptSearch] = useState<string>('');
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const [varValues, setVarValues] = useState<Record<string, string>>({});
  const [selectedProvider, setSelectedProvider] = useState<string>('Gemini');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [copiedId, setCopiedId] = useState<string>('');

  // New Prompt Modal state
  const [showNewPrompt, setShowNewPrompt] = useState<boolean>(false);
  const [newPromptTitle, setNewPromptTitle] = useState<string>('');
  const [newPromptDesc, setNewPromptDesc] = useState<string>('');
  const [newPromptCat, setNewPromptCat] = useState<string>('AI Video Prompts');
  const [newPromptProvider, setNewPromptProvider] = useState<string>('Veo');
  const [newPromptModel, setNewPromptModel] = useState<string>('veo-3.1-generate-preview');
  const [newPromptTags, setNewPromptTags] = useState<string>('cinematic, 4k');
  const [newPromptPublic, setNewPromptPublic] = useState<boolean>(false);
  const [newPromptBody, setNewPromptBody] = useState<string>(
    'Create a [STYLE] scene featuring [CHARACTER] in [LOCATION] with [CAMERA_MOVEMENT] and [LIGHTING].'
  );

  // Import Prompts Modal state (JSON / CSV / TXT)
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importFormat, setImportFormat] = useState<'json' | 'csv' | 'txt'>('json');
  const [importDefaultCat, setImportDefaultCat] = useState<string>('AI Video Prompts');
  const [importContent, setImportContent] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Edit & Version History state
  const [isEditingPrompt, setIsEditingPrompt] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editDesc, setEditDesc] = useState<string>('');
  const [editCat, setEditCat] = useState<string>('AI Video Prompts');
  const [editTags, setEditTags] = useState<string>('');
  const [editBody, setEditBody] = useState<string>('');
  const [showVersions, setShowVersions] = useState<boolean>(false);
  const [promptVersions, setPromptVersions] = useState<PromptVersionEntry[]>([]);
  const [loadingVersions, setLoadingVersions] = useState<boolean>(false);

  // Design Library state
  const [designCat, setDesignCat] = useState<string>('All');
  const [designFavOnly, setDesignFavOnly] = useState<boolean>(false);
  const [designSearch, setDesignSearch] = useState<string>('');
  const [selectedDesignId, setSelectedDesignId] = useState<string>('');
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, dRes, tRes] = await Promise.all([
        fetch('/api/prompts').then((r) => r.json()),
        fetch('/api/designs').then((r) => r.json()),
        fetch('/api/templates').then((r) => r.json()),
      ]);
      if (pRes?.success && Array.isArray(pRes.prompts)) {
        setPrompts(pRes.prompts);
        setSelectedPromptId((prev) => prev || pRes.prompts[0]?.id || '');
      }
      if (pRes?.success && Array.isArray(pRes.categories) && pRes.categories.length > 0) {
        setPromptCategories(pRes.categories);
      }
      if (dRes?.success && Array.isArray(dRes.designs)) {
        setDesigns(dRes.designs);
        setSelectedDesignId((prev) => prev || dRes.designs[0]?.id || '');
      }
      if (tRes?.success && Array.isArray(tRes.templates)) {
        setTemplates(tRes.templates);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const selectedPrompt = useMemo(
    () => prompts.find((p) => p.id === selectedPromptId) || prompts[0] || null,
    [prompts, selectedPromptId]
  );

  const extractedVars = useMemo(() => {
    if (!selectedPrompt) return [];
    const set = new Set<string>();
    for (const match of selectedPrompt.promptTemplate.matchAll(/\[([A-Z0-9_]+)\]/g)) {
      set.add(match[1]);
    }
    return Array.from(set);
  }, [selectedPrompt]);

  useEffect(() => {
    if (!selectedPrompt) return;
    const defaults: Record<string, string> = {};
    extractedVars.forEach((v) => {
      defaults[v] = selectedPrompt.defaultVariables?.[v] || '';
    });
    setVarValues(defaults);
    const provider = selectedPrompt.provider && AI_PROVIDER_MODELS[selectedPrompt.provider]
      ? selectedPrompt.provider
      : 'Gemini';
    setSelectedProvider(provider);
    setSelectedModel(selectedPrompt.model || AI_PROVIDER_MODELS[provider][0]);
    setIsEditingPrompt(false);
    setShowVersions(false);
    setPromptVersions([]);
  }, [selectedPrompt, extractedVars]);

  const resolvedPromptText = useMemo(() => {
    if (!selectedPrompt) return '';
    return selectedPrompt.promptTemplate.replace(/\[([A-Z0-9_]+)\]/g, (_m, key) => {
      const val = (varValues[key] || '').trim();
      return val ? val : `[${key}]`;
    });
  }, [selectedPrompt, varValues]);

  const filteredPrompts = useMemo(() => {
    const q = promptSearch.trim().toLowerCase();
    return prompts.filter((p) => {
      if (promptScope === 'my' && p.scope !== 'my' && p.origin !== 'user_created' && p.origin !== 'user_imported') {
        return false;
      }
      if (promptScope === 'builtin' && p.origin !== 'builtin' && p.scope !== 'builtin') return false;
      if (promptScope === 'community' && !p.is_public && p.scope !== 'community') return false;
      if (promptScope === 'favourites' && !p.isFavourite) return false;
      if (promptScope === 'recent' && !p.lastUsedAt) return false;
      if (promptCat !== 'All' && p.category !== promptCat) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q)) ||
        p.promptTemplate.toLowerCase().includes(q)
      );
    });
  }, [prompts, promptScope, promptCat, promptSearch]);

  const selectedDesign = useMemo(
    () => designs.find((d) => d.id === selectedDesignId) || designs[0] || null,
    [designs, selectedDesignId]
  );

  useEffect(() => {
    if (selectedDesign) {
      setEditedSettings({ ...selectedDesign.editableSettings });
    }
  }, [selectedDesign]);

  const filteredDesigns = useMemo(() => {
    const q = designSearch.trim().toLowerCase();
    return designs.filter((d) => {
      if (designCat !== 'All' && d.category !== designCat) return false;
      if (designFavOnly && !d.isFavourite) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
      );
    });
  }, [designs, designCat, designFavOnly, designSearch]);

  const handleTogglePromptFav = async (id: string) => {
    const resp = await fetch(`/api/prompts/${encodeURIComponent(id)}/favourite`, { method: 'POST' });
    const data = await resp.json();
    if (data?.success && data.prompt) {
      setPrompts((prev) => prev.map((p) => (p.id === id ? data.prompt : p)));
    }
  };

  const handleSendPromptToStudio = async () => {
    if (!selectedPrompt) return;
    const res = await fetch(`/api/prompts/${encodeURIComponent(selectedPrompt.id)}/use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: selectedProvider, model: selectedModel }),
    }).catch(() => null);
    if (res) {
      const data = await res.json().catch(() => null);
      if (data?.success && data.prompt) {
        setPrompts((prev) => prev.map((p) => (p.id === selectedPrompt.id ? data.prompt : p)));
      }
    }
    const target = (selectedPrompt.targetModule || getTargetModuleForCategory(selectedPrompt.category)) as StudioModule;
    loadPromptIntoTool(
      {
        id: selectedPrompt.id,
        title: selectedPrompt.title,
        prompt: resolvedPromptText,
        category: 'film',
        targetModule: target,
        tags: selectedPrompt.tags?.length ? selectedPrompt.tags : [selectedPrompt.category],
        estimatedCredits: 2,
      },
      onNavigate
    );
    soundFx.playCinematicImpact();
    setNotice(`Sent "${selectedPrompt.title}" (${selectedProvider} · ${selectedModel}) to studio.`);
  };

  const handleCreatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromptTitle.trim() || !newPromptBody.trim()) return;
    const resp = await fetch('/api/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newPromptTitle.trim(),
        description: newPromptDesc.trim(),
        category: newPromptCat,
        promptTemplate: newPromptBody.trim(),
        provider: newPromptProvider,
        model: newPromptModel,
        tags: newPromptTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        is_public: newPromptPublic,
        origin: 'user_created',
        targetModule: getTargetModuleForCategory(newPromptCat),
      }),
    });
    const data = await resp.json();
    if (data?.success && data.prompt) {
      setPrompts((prev) => [data.prompt, ...prev]);
      setSelectedPromptId(data.prompt.id);
      setShowNewPrompt(false);
      setNewPromptTitle('');
      setNewPromptDesc('');
      setNotice(`Saved custom prompt "${data.prompt.title}" to My Prompts.`);
    }
  };

  const handleImportPrompts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importContent.trim()) return;
    setIsImporting(true);
    try {
      const resp = await fetch('/api/prompts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: importFormat,
          content: importContent,
          defaultCategory: importDefaultCat,
        }),
      });
      const data = await resp.json();
      if (data?.success && Array.isArray(data.prompts)) {
        setPrompts((prev) => [...data.prompts, ...prev]);
        if (data.prompts[0]?.id) {
          setSelectedPromptId(data.prompts[0].id);
        }
        setShowImportModal(false);
        setImportContent('');
        setNotice(`Imported ${data.importedCount} prompt(s) via ${importFormat.toUpperCase()} into My Prompts.`);
      } else {
        setNotice(data?.error || 'Could not import prompts. Check format syntax.');
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportFileRead = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'json' || ext === 'csv' || ext === 'txt') {
      setImportFormat(ext);
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImportContent(reader.result);
      }
    };
    reader.readAsText(file);
  };

  const startEditingPrompt = () => {
    if (!selectedPrompt) return;
    setEditTitle(selectedPrompt.title);
    setEditDesc(selectedPrompt.description || '');
    setEditCat(selectedPrompt.category);
    setEditTags((selectedPrompt.tags || []).join(', '));
    setEditBody(selectedPrompt.promptTemplate);
    setIsEditingPrompt(true);
  };

  const handleSaveEditedPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrompt || !editTitle.trim() || !editBody.trim()) return;
    const resp = await fetch(`/api/prompts/${encodeURIComponent(selectedPrompt.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editTitle.trim(),
        description: editDesc.trim(),
        category: editCat,
        promptTemplate: editBody.trim(),
        provider: selectedProvider,
        model: selectedModel,
        tags: editTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    });
    const data = await resp.json();
    if (data?.success && data.prompt) {
      setPrompts((prev) => prev.map((p) => (p.id === selectedPrompt.id ? data.prompt : p)));
      setIsEditingPrompt(false);
      setNotice(`Updated "${data.prompt.title}" to v${data.prompt.version || 1} (previous version archived).`);
    }
  };

  const handleDuplicatePrompt = async () => {
    if (!selectedPrompt) return;
    const resp = await fetch(`/api/prompts/${encodeURIComponent(selectedPrompt.id)}/duplicate`, {
      method: 'POST',
    });
    const data = await resp.json();
    if (data?.success && data.prompt) {
      setPrompts((prev) => [data.prompt, ...prev]);
      setSelectedPromptId(data.prompt.id);
      setNotice(`Duplicated "${selectedPrompt.title}" into My Prompts.`);
    }
  };

  const handleTogglePublicShare = async () => {
    if (!selectedPrompt) return;
    const nextPublic = !selectedPrompt.is_public;
    const resp = await fetch(`/api/prompts/${encodeURIComponent(selectedPrompt.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_public: nextPublic }),
    });
    const data = await resp.json();
    if (data?.success && data.prompt) {
      setPrompts((prev) => prev.map((p) => (p.id === selectedPrompt.id ? data.prompt : p)));
      setNotice(
        nextPublic
          ? `Shared "${data.prompt.title}" to Community Prompts.`
          : `Set "${data.prompt.title}" back to Private.`
      );
    }
  };

  const handleToggleVersions = async () => {
    if (!selectedPrompt) return;
    if (showVersions) {
      setShowVersions(false);
      return;
    }
    setShowVersions(true);
    setLoadingVersions(true);
    try {
      const resp = await fetch(`/api/prompts/${encodeURIComponent(selectedPrompt.id)}/versions`);
      const data = await resp.json();
      if (data?.success && Array.isArray(data.versions)) {
        setPromptVersions(data.versions);
      }
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleToggleDesignFav = async (id: string) => {
    const resp = await fetch(`/api/designs/${encodeURIComponent(id)}/favourite`, { method: 'POST' });
    const data = await resp.json();
    if (data?.success && data.design) {
      setDesigns((prev) => prev.map((d) => (d.id === id ? data.design : d)));
    }
  };

  const handleApplyDesignToStudio = (design: DesignLibraryItem) => {
    const settingsSummary = Object.entries(editedSettings)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    const fullPrompt = `${design.associatedPrompts[0] || design.name} (${settingsSummary})`;
    const target = (design.targetModule || 'ai_image') as StudioModule;
    loadPromptIntoTool(
      {
        id: design.id,
        title: design.name,
        prompt: fullPrompt,
        category: 'film',
        targetModule: target,
        tags: [design.category],
        estimatedCredits: 2,
      },
      onNavigate
    );
    soundFx.playCinematicImpact();
  };

  const handleLaunchTemplate = (tpl: StudioTemplateItem) => {
    const target = (tpl.targetModule || 'cartoon_creator') as StudioModule;
    loadPromptIntoTool(
      {
        id: tpl.id,
        title: tpl.name,
        prompt: tpl.starterPrompt,
        category: 'film',
        targetModule: target,
        tags: [tpl.category, tpl.visualStyle],
        estimatedCredits: 5,
      },
      onNavigate
    );
    soundFx.playCinematicImpact();
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(''), 1600);
    } catch {
      // ignore clipboard errors
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#07090e] text-slate-400 text-xs font-mono">
        Loading Design, 26-Category Prompt & Template Libraries...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#07090e] text-slate-100">
      {notice && (
        <div className="px-6 py-2 bg-emerald-500/10 border-b border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between shrink-0">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} className="underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: 26-CATEGORY VARIABLE PROMPT LIBRARY */}
      {activeTab === 'prompts' && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Filter & List */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-800">
            <div className="p-4 border-b border-slate-800 bg-slate-900/70 space-y-3 shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={promptSearch}
                    onChange={(e) => setPromptSearch(e.target.value)}
                    placeholder="Search 26 prompt categories, tags & [VARIABLES]..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import JSON / CSV / TXT</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewPrompt(true)}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Prompt</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      ['all', 'All Prompts'],
                      ['my', 'My Prompts'],
                      ['builtin', 'Built-in Prompts'],
                      ['community', 'Community'],
                      ['favourites', 'Favourites'],
                      ['recent', 'Recently Used'],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPromptScope(id)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                        promptScope === id
                          ? 'bg-amber-500 text-black'
                          : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  Showing {filteredPrompts.length} of {prompts.length} prompts
                </span>
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {['All', ...promptCategories].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPromptCat(cat)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap ${
                      promptCat === cat
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
              {filteredPrompts.length === 0 ? (
                <div className="col-span-full py-12 text-center text-xs text-slate-500 font-mono">
                  No prompts match the current filter. Create a custom prompt or import a JSON/CSV/TXT library.
                </div>
              ) : (
                filteredPrompts.map((p) => {
                  const isSel = selectedPrompt?.id === p.id;
                  const originKey: PromptOrigin = p.origin || (p.scope === 'builtin' ? 'builtin' : 'user_created');
                  const originMeta = ORIGIN_META[originKey];
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPromptId(p.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-2 ${
                        isSel
                          ? 'bg-purple-950/30 border-purple-500 ring-1 ring-purple-500/40'
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase">
                              {p.category}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${originMeta.className}`}>
                              {originMeta.label}
                            </span>
                          </div>
                          <h4 className="text-xs font-extrabold text-white">{p.title}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePromptFav(p.id);
                          }}
                          className={`p-1 rounded ${p.isFavourite ? 'text-amber-400' : 'text-slate-500 hover:text-slate-200'}`}
                        >
                          <Star className="w-3.5 h-3.5" fill={p.isFavourite ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                      {p.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-1">{p.description}</p>
                      )}
                      <p className="text-[11px] text-slate-400 line-clamp-3 font-mono whitespace-pre-line bg-slate-950/60 p-2 rounded-lg border border-slate-800/70">
                        {p.promptTemplate}
                      </p>
                      <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Used {p.usageCount}×
                          </span>
                          <span>v{p.version || 1}</span>
                        </span>
                        <span className="font-mono text-amber-400">
                          {p.provider || 'Gemini'} · {p.id}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Variable Prompt Builder */}
          {selectedPrompt && (
            <aside className="w-full lg:w-[440px] bg-slate-900/70 overflow-y-auto p-5 space-y-4 shrink-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase text-purple-400 font-bold">
                    {selectedPrompt.category} · v{selectedPrompt.version || 1}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ORIGIN_META[selectedPrompt.origin || 'builtin'].className
                    }`}
                  >
                    {ORIGIN_META[selectedPrompt.origin || 'builtin'].label}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-white">{selectedPrompt.title}</h3>
                {selectedPrompt.description && (
                  <p className="text-xs text-slate-400">{selectedPrompt.description}</p>
                )}

                {/* Action Toolbar: Edit, Duplicate, Versions, Public/Private */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={isEditingPrompt ? () => setIsEditingPrompt(false) : startEditingPrompt}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold border flex items-center gap-1 ${
                      isEditingPrompt
                        ? 'bg-purple-600 text-white border-purple-500'
                        : 'bg-slate-950 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isEditingPrompt ? 'Cancel Edit' : 'Edit'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDuplicatePrompt}
                    className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-950 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1"
                  >
                    <CopyPlus className="w-3 h-3" />
                    <span>Duplicate</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleVersions}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold border flex items-center gap-1 ${
                      showVersions
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <History className="w-3 h-3" />
                    <span>Versions</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleTogglePublicShare}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold border flex items-center gap-1 ${
                      selectedPrompt.is_public
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {selectedPrompt.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    <span>{selectedPrompt.is_public ? 'Public' : 'Private'}</span>
                  </button>
                </div>
              </div>

              {/* Version History Panel */}
              {showVersions && (
                <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center justify-between">
                    <span>Prompt Version History</span>
                    <span className="font-mono text-[10px]">Current: v{selectedPrompt.version || 1}</span>
                  </div>
                  {loadingVersions ? (
                    <div className="text-[11px] text-slate-500 font-mono">Loading history...</div>
                  ) : promptVersions.length === 0 ? (
                    <div className="text-[11px] text-slate-500">
                      No previous versions archived yet. Edit and save this prompt to create version snapshots.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {promptVersions.map((ver) => (
                        <div key={ver.id} className="p-2 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-indigo-300 font-bold">v{ver.version} · {ver.title}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditTitle(ver.title);
                                setEditDesc(selectedPrompt.description || '');
                                setEditCat(selectedPrompt.category);
                                setEditTags((selectedPrompt.tags || []).join(', '));
                                setEditBody(ver.promptTemplate);
                                setIsEditingPrompt(true);
                              }}
                              className="text-amber-400 hover:underline"
                            >
                              Load into Editor
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono line-clamp-2">{ver.promptTemplate}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Inline Edit Prompt Form */}
              {isEditingPrompt ? (
                <form
                  onSubmit={handleSaveEditedPrompt}
                  className="p-3.5 rounded-xl bg-slate-950 border border-purple-500/40 space-y-3"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">Title</label>
                    <input
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">Category</label>
                    <select
                      value={editCat}
                      onChange={(e) => setEditCat(e.target.value)}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-white"
                    >
                      {promptCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">Description</label>
                    <input
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">Tags (comma-separated)</label>
                    <input
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">Prompt Template</label>
                    <textarea
                      required
                      rows={6}
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save New Version (v{(selectedPrompt.version || 1) + 1})</span>
                  </button>
                </form>
              ) : (
                <>
                  {/* AI Provider & Model Selector */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                      Target AI Provider & Model
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={selectedProvider}
                        onChange={(e) => {
                          const prov = e.target.value;
                          setSelectedProvider(prov);
                          setSelectedModel(AI_PROVIDER_MODELS[prov]?.[0] || '');
                        }}
                        className="rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-500"
                      >
                        {Object.keys(AI_PROVIDER_MODELS).map((prov) => (
                          <option key={prov} value={prov}>
                            {prov}
                          </option>
                        ))}
                      </select>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-cyan-300 font-mono outline-none focus:border-cyan-500"
                      >
                        {(AI_PROVIDER_MODELS[selectedProvider] || []).map((mdl) => (
                          <option key={mdl} value={mdl}>
                            {mdl}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Variable Fields */}
                  {extractedVars.length > 0 && (
                    <div className="space-y-2.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Fill Prompt Variables ({extractedVars.length})
                      </span>
                      <div className="space-y-2">
                        {extractedVars.map((varKey) => (
                          <div key={varKey} className="space-y-1">
                            <label className="text-[10px] font-mono text-amber-300 font-bold">[{varKey}]</label>
                            <input
                              value={varValues[varKey] || ''}
                              onChange={(e) => setVarValues((prev) => ({ ...prev, [varKey]: e.target.value }))}
                              placeholder={`Enter ${varKey.toLowerCase().replace(/_/g, ' ')}...`}
                              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completed Prompt Preview */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Completed Prompt Preview
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedPrompt.id, resolvedPromptText)}
                        className="inline-flex items-center gap-1 text-[11px] text-purple-300 hover:text-white"
                      >
                        {copiedId === selectedPrompt.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedId === selectedPrompt.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
                      {resolvedPromptText}
                    </pre>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendPromptToStudio}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-extrabold flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Send Completed Prompt to Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </aside>
          )}
        </div>
      )}

      {/* TAB 2: DESIGN LIBRARY (11 CATEGORIES) */}
      {activeTab === 'designs' && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-800">
            <div className="p-4 border-b border-slate-800 bg-slate-900/70 space-y-3 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={designSearch}
                    onChange={(e) => setDesignSearch(e.target.value)}
                    placeholder="Search film styles, lighting, camera, VFX designs..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setDesignFavOnly((v) => !v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${
                    designFavOnly
                      ? 'bg-amber-500 text-black border-amber-500'
                      : 'bg-slate-950 border-slate-700 text-slate-300'
                  }`}
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>Favourites</span>
                </button>
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {DESIGN_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setDesignCat(cat)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap ${
                      designCat === cat
                        ? 'bg-amber-500 text-black'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 content-start">
              {filteredDesigns.map((d) => {
                const isSel = selectedDesign?.id === d.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => setSelectedDesignId(d.id)}
                    className={`rounded-xl border overflow-hidden cursor-pointer transition-all ${
                      isSel
                        ? 'bg-slate-900 border-amber-500 ring-1 ring-amber-500/40'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="h-28 bg-black relative">
                      <img src={d.previewUrl} alt={d.name} className="w-full h-full object-cover opacity-85" />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-amber-300 text-[10px] font-bold">
                        {d.category}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleDesignFav(d.id);
                        }}
                        className={`absolute top-2 right-2 p-1 rounded bg-black/70 ${
                          d.isFavourite ? 'text-amber-400' : 'text-slate-300'
                        }`}
                      >
                        <Star className="w-3.5 h-3.5" fill={d.isFavourite ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                    <div className="p-3 space-y-1">
                      <div className="text-xs font-extrabold text-white">{d.name}</div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{d.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedDesign && (
            <aside className="w-full lg:w-96 bg-slate-900/70 overflow-y-auto p-5 space-y-4 shrink-0">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  {selectedDesign.category} · {selectedDesign.id}
                </span>
                <h3 className="text-sm font-extrabold text-white mt-1">{selectedDesign.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{selectedDesign.description}</p>
              </div>

              <img
                src={selectedDesign.previewUrl}
                alt={selectedDesign.name}
                className="w-full h-36 rounded-xl object-cover border border-slate-800"
              />

              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  Editable Design Settings
                </span>
                <div className="space-y-2">
                  {Object.entries(editedSettings).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400 w-28 truncate">{k}</span>
                      <input
                        value={v}
                        onChange={(e) => setEditedSettings((prev) => ({ ...prev, [k]: e.target.value }))}
                        className="flex-1 rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1 text-xs text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Source</span>
                  <span className="text-white font-semibold">{selectedDesign.source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">License</span>
                  <span className="text-emerald-400 font-semibold">{selectedDesign.license}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleApplyDesignToStudio(selectedDesign)}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold flex items-center justify-center gap-2"
              >
                <Layers className="w-4 h-4" />
                <span>Apply Design Preset to Studio</span>
              </button>
            </aside>
          )}
        </div>
      )}

      {/* TAB 3: TEMPLATE LIBRARY */}
      {activeTab === 'templates' && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden flex flex-col"
              >
                <div className="h-40 bg-black relative">
                  <img src={tpl.previewUrl} alt={tpl.name} className="w-full h-full object-cover opacity-80" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/80 text-amber-300 text-xs font-bold">
                    {tpl.category} · {tpl.aspectRatio}
                  </span>
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-purple-600 text-white text-xs font-mono font-bold">
                    {tpl.duration}
                  </span>
                </div>
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <LayoutTemplate className="w-4 h-4 text-purple-400" />
                      <span>{tpl.name}</span>
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{tpl.description}</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {tpl.includedModules.map((m) => (
                        <span
                          key={m}
                          className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-semibold"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLaunchTemplate(tpl)}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Launch Template in Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Custom Variable Prompt Modal */}
      {showNewPrompt && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatePrompt}
            className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-5 space-y-3.5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white">Create Reusable Variable Prompt</h3>
              <button type="button" onClick={() => setShowNewPrompt(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">Prompt Title</label>
              <input
                required
                value={newPromptTitle}
                onChange={(e) => setNewPromptTitle(e.target.value)}
                placeholder="e.g. Epic Fantasy Battle Scene"
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">Description</label>
              <input
                value={newPromptDesc}
                onChange={(e) => setNewPromptDesc(e.target.value)}
                placeholder="Short summary of what this prompt creates..."
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Category (26 Studio Categories)</label>
                <select
                  value={newPromptCat}
                  onChange={(e) => setNewPromptCat(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                >
                  {promptCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Tags (comma-separated)</label>
                <input
                  value={newPromptTags}
                  onChange={(e) => setNewPromptTags(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Default AI Provider</label>
                <select
                  value={newPromptProvider}
                  onChange={(e) => {
                    const prov = e.target.value;
                    setNewPromptProvider(prov);
                    setNewPromptModel(AI_PROVIDER_MODELS[prov]?.[0] || '');
                  }}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                >
                  {Object.keys(AI_PROVIDER_MODELS).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Default Model</label>
                <select
                  value={newPromptModel}
                  onChange={(e) => setNewPromptModel(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-cyan-300 font-mono"
                >
                  {(AI_PROVIDER_MODELS[newPromptProvider] || []).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">
                Prompt Template (use [VARIABLE_NAME] tokens)
              </label>
              <textarea
                required
                rows={4}
                value={newPromptBody}
                onChange={(e) => setNewPromptBody(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white font-mono"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={newPromptPublic}
                onChange={(e) => setNewPromptPublic(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950"
              />
              <span>Share publicly in Community Prompts</span>
            </label>
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold"
            >
              Save to My Prompts
            </button>
          </form>
        </div>
      )}

      {/* Import Prompts Modal (JSON / CSV / TXT) */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <form
            onSubmit={handleImportPrompts}
            className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-5 space-y-3.5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white">Import Your Own Prompt Library</h3>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Import your own prompts from JSON, CSV, or TXT files. Imported entries are clearly tagged as{' '}
              <span className="text-amber-300 font-semibold">User Imported</span> and saved in your studio database.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Import Format</label>
                <select
                  value={importFormat}
                  onChange={(e) => setImportFormat(e.target.value as 'json' | 'csv' | 'txt')}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                >
                  <option value="json">JSON Array / Object</option>
                  <option value="csv">CSV (title,category,prompt)</option>
                  <option value="txt">TXT (one prompt per line or --- block)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Default Category</label>
                <select
                  value={importDefaultCat}
                  onChange={(e) => setImportDefaultCat(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                >
                  {promptCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">Upload File (.json, .csv, .txt)</label>
              <input
                type="file"
                accept=".json,.csv,.txt"
                onChange={handleImportFileRead}
                className="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-800 file:text-amber-300 file:font-bold hover:file:bg-slate-700"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">Or Paste Content Directly</label>
              <textarea
                required
                rows={6}
                value={importContent}
                onChange={(e) => setImportContent(e.target.value)}
                placeholder={
                  importFormat === 'json'
                    ? '[{"title": "Neon Noir Chase", "category": "AI Video Prompts", "prompt": "Create a [STYLE] chase scene..."}]'
                    : importFormat === 'csv'
                    ? 'title,category,prompt\nNeon Noir Chase,AI Video Prompts,"Create a [STYLE] chase scene..."'
                    : 'Create a [STYLE] scene in [LOCATION] with [LIGHTING]\n---\nGenerate a [GENRE] trailer for [TITLE]'
                }
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isImporting}
              className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-xs font-extrabold"
            >
              {isImporting ? 'Importing Prompts...' : `Import ${importFormat.toUpperCase()} Prompts`}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
