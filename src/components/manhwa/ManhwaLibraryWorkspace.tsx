import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Edit3,
  Film,
  FolderPlus,
  ImagePlus,
  Layers,
  Maximize2,
  Minimize2,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  Upload,
  Users,
  MessageSquare,
  Wand2,
  ZoomIn,
  ZoomOut,
  X,
  Check,
  Volume2,
} from 'lucide-react';
import type { ManhwaPanelItem } from './ManhwaStudio';
import { soundFx } from '../../utils/audioSynth';

export interface ManhwaSeriesSummary {
  id: string;
  title: string;
  description: string;
  cover_asset_id: string;
  cover_url: string;
  author: string;
  genre: string;
  language: string;
  art_style: string;
  status: 'Ongoing' | 'Completed';
  visibility: 'Private' | 'Public';
  is_favourite: boolean;
  last_opened_at: string | null;
  last_read_chapter_id: string | null;
  last_read_page: number;
  chapter_count?: number;
  created_at: string;
}

export interface ManhwaChapterSummary {
  id: string;
  manhwa_id: string;
  chapter_number: number;
  title: string;
  description: string;
  cover_asset_id: string;
  cover_url: string;
  backgrounds: string[];
  audio_tracks: Array<{ id: string; label: string; speaker: string; voice_gender: string; url: string; asset_id: string }>;
  status: 'Draft' | 'Processing' | 'Completed';
  page_count?: number;
  panel_count?: number;
  dialogue_count?: number;
  video_count?: number;
  created_at: string;
}

interface ManhwaPage {
  id: string;
  chapter_id: string;
  page_number: number;
  title: string;
  image_url: string;
  asset_id: string;
  created_at: string;
}

interface ManhwaPanel {
  id: string;
  chapter_id: string;
  page_id: string;
  panel_index: number;
  title: string;
  image_url: string;
  asset_id: string;
  camera_motion: string;
  duration_sec: number;
}

interface ManhwaCharacter {
  id: string;
  chapter_id: string;
  name: string;
  role: string;
  appearance: string;
  voice_gender: 'male' | 'female' | 'neutral';
}

interface ManhwaDialogue {
  id: string;
  chapter_id: string;
  panel_id: string;
  speaker: string;
  text: string;
  narration: string;
  emotion: string;
  order_index: number;
}

interface ManhwaScenePrompt {
  id: string;
  chapter_id: string;
  panel_id: string;
  prompt_text: string;
  style: string;
  camera_motion: string;
}

interface ManhwaVideoJob {
  id: string;
  chapter_id: string;
  title: string;
  status: 'Queued' | 'Rendering' | 'Completed';
  resolution: string;
  duration_sec: number;
  video_url: string;
  asset_id: string;
  created_at: string;
}

interface ChapterDetailPayload {
  series: ManhwaSeriesSummary | null;
  chapter: ManhwaChapterSummary;
  siblingChapters: ManhwaChapterSummary[];
  pages: ManhwaPage[];
  panels: ManhwaPanel[];
  characters: ManhwaCharacter[];
  dialogues: ManhwaDialogue[];
  scenePrompts: ManhwaScenePrompt[];
  videoJobs: ManhwaVideoJob[];
}

interface ManhwaLibraryWorkspaceProps {
  onSendChapterToVideoStudio: (payload: {
    seriesTitle: string;
    chapterId: string;
    chapterTitle: string;
    panels: ManhwaPanelItem[];
  }) => void;
}

const PRESET_COVERS = [
  {
    label: 'Shadow World',
    url: '/src/assets/images/manhwa_cover_shadow_world_1795002499270.jpg',
  },
  {
    label: 'Skyline Revenant',
    url: '/src/assets/images/manhwa_cover_skyline_revenant_1795002498039.jpg',
  },
  {
    label: 'Crimson Lotus',
    url: '/src/assets/images/manhwa_cover_crimson_lotus_1795002498343.jpg',
  },
];

const padChapter = (num: number) => String(num).padStart(3, '0');

export const ManhwaLibraryWorkspace: React.FC<ManhwaLibraryWorkspaceProps> = ({
  onSendChapterToVideoStudio,
}) => {
  const [view, setView] = useState<'library' | 'series' | 'chapter' | 'reader'>('library');
  const [libraryTab, setLibraryTab] = useState<'my' | 'explore' | 'recent' | 'favourites'>('my');
  const [searchQuery, setSearchQuery] = useState('');
  const [seriesList, setSeriesList] = useState<ManhwaSeriesSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  // Selected Series state
  const [activeSeries, setActiveSeries] = useState<ManhwaSeriesSummary | null>(null);
  const [chaptersList, setChaptersList] = useState<ManhwaChapterSummary[]>([]);
  const [visibleChaptersCount, setVisibleChaptersCount] = useState(5);

  // Selected Chapter detail state
  const [chapterDetail, setChapterDetail] = useState<ChapterDetailPayload | null>(null);
  const [chapterSubTab, setChapterSubTab] = useState<
    'pages' | 'panels' | 'characters' | 'dialogue' | 'prompts' | 'media'
  >('pages');

  // Reader state
  const [readerMode, setReaderMode] = useState<'vertical' | 'paged'>('vertical');
  const [readerPageIdx, setReaderPageIdx] = useState(0);
  const [readerZoom, setReaderZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const readerContainerRef = useRef<HTMLDivElement | null>(null);

  // Create / Edit Series Modal
  const [showSeriesModal, setShowSeriesModal] = useState(false);
  const [editingSeriesId, setEditingSeriesId] = useState<string | null>(null);
  const [seriesForm, setSeriesForm] = useState({
    title: '',
    description: '',
    cover_url: PRESET_COVERS[0].url,
    author: 'Studio Creator',
    genre: 'Action, Fantasy',
    language: 'English',
    art_style: 'Dark Fantasy Webtoon',
    status: 'Ongoing' as 'Ongoing' | 'Completed',
    visibility: 'Public' as 'Private' | 'Public',
  });

  // Create / Edit Chapter Modal
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [chapterForm, setChapterForm] = useState({
    title: '',
    description: '',
    cover_url: '',
    status: 'Draft' as 'Draft' | 'Processing' | 'Completed',
  });

  // Quick add forms inside Chapter Detail
  const [importPageUrl, setImportPageUrl] = useState('');
  const [newCharName, setNewCharName] = useState('');
  const [newCharRole, setNewCharRole] = useState('Supporting');
  const [newCharAppearance, setNewCharAppearance] = useState('');
  const [newDlgSpeaker, setNewDlgSpeaker] = useState('');
  const [newDlgText, setNewDlgText] = useState('');
  const [newDlgEmotion, setNewDlgEmotion] = useState('Determined');
  const [newBgLabel, setNewBgLabel] = useState('');

  const loadSeriesList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tab: libraryTab });
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      const resp = await fetch(`/api/manhwa/series?${params.toString()}`);
      const data = await resp.json();
      if (data?.success && Array.isArray(data.series)) {
        setSeriesList(data.series);
      }
    } finally {
      setLoading(false);
    }
  }, [libraryTab, searchQuery]);

  useEffect(() => {
    loadSeriesList();
  }, [loadSeriesList]);

  const openSeries = async (seriesId: string) => {
    soundFx.playScannerBeep();
    const resp = await fetch(`/api/manhwa/series/${encodeURIComponent(seriesId)}`);
    const data = await resp.json();
    if (data?.success && data.series) {
      setActiveSeries(data.series);
      setChaptersList(data.chapters || []);
      setVisibleChaptersCount(5);
      setView('series');
    }
  };

  const openChapter = async (chapterId: string, openInReader = false) => {
    soundFx.playScannerBeep();
    const resp = await fetch(`/api/manhwa/chapters/${encodeURIComponent(chapterId)}`);
    const data = await resp.json();
    if (data?.success && data.chapter) {
      setChapterDetail(data);
      if (data.series) setActiveSeries(data.series);
      setReaderPageIdx(0);
      setView(openInReader ? 'reader' : 'chapter');

      // Save reading progress
      if (data.series?.id) {
        fetch(`/api/manhwa/series/${encodeURIComponent(data.series.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ last_read_chapter_id: chapterId, last_read_page: 1 }),
        }).catch(() => {});
      }
    }
  };

  const handleToggleFavourite = async (series: ManhwaSeriesSummary, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const resp = await fetch(`/api/manhwa/series/${encodeURIComponent(series.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_favourite: !series.is_favourite }),
    });
    const data = await resp.json();
    if (data?.success && data.series) {
      setSeriesList((prev) => prev.map((s) => (s.id === series.id ? { ...s, is_favourite: data.series.is_favourite } : s)));
      if (activeSeries?.id === series.id) {
        setActiveSeries((prev) => (prev ? { ...prev, is_favourite: data.series.is_favourite } : prev));
      }
    }
  };

  const openCreateSeriesModal = () => {
    setEditingSeriesId(null);
    setSeriesForm({
      title: '',
      description: '',
      cover_url: PRESET_COVERS[0].url,
      author: 'Studio Creator',
      genre: 'Action, Fantasy',
      language: 'English',
      art_style: 'Dark Fantasy Webtoon',
      status: 'Ongoing',
      visibility: 'Public',
    });
    setShowSeriesModal(true);
  };

  const openEditSeriesModal = (s: ManhwaSeriesSummary) => {
    setEditingSeriesId(s.id);
    setSeriesForm({
      title: s.title,
      description: s.description,
      cover_url: s.cover_url,
      author: s.author,
      genre: s.genre,
      language: s.language,
      art_style: s.art_style,
      status: s.status,
      visibility: s.visibility,
    });
    setShowSeriesModal(true);
  };

  const handleCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSeriesForm((prev) => ({ ...prev, cover_url: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesForm.title.trim()) return;
    if (editingSeriesId) {
      const resp = await fetch(`/api/manhwa/series/${encodeURIComponent(editingSeriesId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seriesForm),
      });
      const data = await resp.json();
      if (data?.success && data.series) {
        setActiveSeries(data.series);
        setShowSeriesModal(false);
        loadSeriesList();
        setNotice(`Updated manhwa "${data.series.title}".`);
      }
    } else {
      const resp = await fetch('/api/manhwa/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seriesForm),
      });
      const data = await resp.json();
      if (data?.success && data.series) {
        setShowSeriesModal(false);
        await loadSeriesList();
        await openSeries(data.series.id);
        setNotice(`Created manhwa "${data.series.title}" and linked cover to Unified Media Library.`);
      }
    }
  };

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSeries) return;
    if (editingChapterId) {
      const resp = await fetch(`/api/manhwa/chapters/${encodeURIComponent(editingChapterId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chapterForm),
      });
      const data = await resp.json();
      if (data?.success) {
        setShowChapterModal(false);
        await openSeries(activeSeries.id);
        setNotice(`Updated chapter "${data.chapter.title}".`);
      }
    } else {
      const resp = await fetch(`/api/manhwa/series/${encodeURIComponent(activeSeries.id)}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chapterForm),
      });
      const data = await resp.json();
      if (data?.success && data.chapter) {
        setShowChapterModal(false);
        await openSeries(activeSeries.id);
        setNotice(`Added Chapter ${padChapter(data.chapter.chapter_number)} — ${data.chapter.title}.`);
      }
    }
  };

  const handleReorderChapter = async (index: number, direction: -1 | 1) => {
    if (!activeSeries) return;
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= chaptersList.length) return;
    const next = [...chaptersList];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    const resp = await fetch(`/api/manhwa/series/${encodeURIComponent(activeSeries.id)}/chapters/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedChapterIds: next.map((c) => c.id) }),
    });
    const data = await resp.json();
    if (data?.success && Array.isArray(data.chapters)) {
      setChaptersList(data.chapters);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!activeSeries) return;
    const resp = await fetch(`/api/manhwa/chapters/${encodeURIComponent(chapterId)}`, { method: 'DELETE' });
    const data = await resp.json();
    if (data?.success) {
      await openSeries(activeSeries.id);
      setNotice('Chapter removed and chapter numbers re-sequenced.');
    }
  };

  const handleMultiPageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!chapterDetail) return;
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const pagesPayload: Array<{ title: string; image_url: string }> = [];
    for (const file of files) {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.readAsDataURL(file);
      });
      if (dataUrl) {
        pagesPayload.push({
          title: file.name.replace(/\.[^.]+$/, ''),
          image_url: dataUrl,
        });
      }
    }

    const resp = await fetch(`/api/manhwa/chapters/${encodeURIComponent(chapterDetail.chapter.id)}/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pages: pagesPayload }),
    });
    const data = await resp.json();
    if (data?.success) {
      await openChapter(chapterDetail.chapter.id, false);
      setNotice(`Uploaded ${data.pages.length} page(s) and linked to Unified Media Library.`);
    }
    e.target.value = '';
  };

  const handleImportPageByUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterDetail || !importPageUrl.trim()) return;
    const resp = await fetch(`/api/manhwa/chapters/${encodeURIComponent(chapterDetail.chapter.id)}/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pages: [{ image_url: importPageUrl.trim() }] }),
    });
    const data = await resp.json();
    if (data?.success) {
      setImportPageUrl('');
      await openChapter(chapterDetail.chapter.id, false);
      setNotice('Imported page image and saved to Unified Media Library.');
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!chapterDetail) return;
    await fetch(
      `/api/manhwa/chapters/${encodeURIComponent(chapterDetail.chapter.id)}/pages/${encodeURIComponent(pageId)}`,
      { method: 'DELETE' }
    );
    await openChapter(chapterDetail.chapter.id, false);
  };

  const handleDetectPanels = async () => {
    if (!chapterDetail) return;
    const resp = await fetch(`/api/manhwa/chapters/${encodeURIComponent(chapterDetail.chapter.id)}/detect-panels`, {
      method: 'POST',
    });
    const data = await resp.json();
    if (data?.success) {
      await openChapter(chapterDetail.chapter.id, false);
      setChapterSubTab('panels');
      setNotice(`Detected ${data.panels.length} comic panel(s) from chapter pages.`);
    }
  };

  const handleExtractCharacters = async (manual?: boolean) => {
    if (!chapterDetail) return;
    const body = manual && newCharName.trim()
      ? { character: { name: newCharName.trim(), role: newCharRole, appearance: newCharAppearance } }
      : {};
    const resp = await fetch(
      `/api/manhwa/chapters/${encodeURIComponent(chapterDetail.chapter.id)}/extract-characters`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    const data = await resp.json();
    if (data?.success) {
      setNewCharName('');
      setNewCharAppearance('');
      await openChapter(chapterDetail.chapter.id, false);
      setChapterSubTab('characters');
      setNotice(`Updated chapter cast (${data.characters.length} characters).`);
    }
  };

  const handleExtractDialogue = async (manual?: boolean) => {
    if (!chapterDetail) return;
    const body = manual && newDlgText.trim()
      ? { dialogue: { speaker: newDlgSpeaker || 'Narrator', text: newDlgText.trim(), emotion: newDlgEmotion } }
      : {};
    const resp = await fetch(
      `/api/manhwa/chapters/${encodeURIComponent(chapterDetail.chapter.id)}/extract-dialogue`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    const data = await resp.json();
    if (data?.success) {
      setNewDlgText('');
      await openChapter(chapterDetail.chapter.id, false);
      setChapterSubTab('dialogue');
      setNotice(`Chapter script updated (${data.dialogues.length} dialogue entries).`);
    }
  };

  const handleGenerateScenePrompts = async () => {
    if (!chapterDetail) return;
    const resp = await fetch(
      `/api/manhwa/chapters/${encodeURIComponent(chapterDetail.chapter.id)}/generate-prompts`,
      { method: 'POST' }
    );
    const data = await resp.json();
    if (data?.success) {
      await openChapter(chapterDetail.chapter.id, false);
      setChapterSubTab('prompts');
      setNotice(`Generated ${data.scenePrompts.length} AI scene animation prompt(s).`);
    }
  };

  const handleAddBackground = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterDetail || !newBgLabel.trim()) return;
    const nextBgs = [...(chapterDetail.chapter.backgrounds || []), newBgLabel.trim()];
    await fetch(`/api/manhwa/chapters/${encodeURIComponent(chapterDetail.chapter.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backgrounds: nextBgs }),
    });
    setNewBgLabel('');
    await openChapter(chapterDetail.chapter.id, false);
  };

  const handleSendToAiVideoStudio = () => {
    if (!chapterDetail) return;
    const sourceItems =
      chapterDetail.panels.length > 0
        ? chapterDetail.panels
        : chapterDetail.pages.map((pg, idx) => ({
            id: pg.id,
            title: pg.title,
            image_url: pg.image_url,
            camera_motion: idx % 2 === 0 ? 'Slow Zoom In' : 'Vertical Scroll (Webtoon)',
            duration_sec: 5,
          }));

    const mappedPanels: ManhwaPanelItem[] = sourceItems.map((item, idx) => {
      const dlg = chapterDetail.dialogues[idx];
      const charMatch = chapterDetail.characters.find((c) => c.name === dlg?.speaker);
      return {
        id: item.id,
        title: item.title,
        sceneNumber: idx + 1,
        imageUrl: item.image_url,
        sourceType: 'upload',
        mimeType: 'image/jpeg',
        durationSec: item.duration_sec || 5,
        cameraMotion: (item.camera_motion as ManhwaPanelItem['cameraMotion']) || 'Slow Zoom In',
        transition: idx === 0 ? 'Crossfade' : 'Flash White',
        animationStyle: 'Ken Burns Motion',
        sfxPreset: idx === 0 ? 'Whoosh' : 'Impact Boom',
        voiceGender: charMatch?.voice_gender === 'female' ? 'female' : 'male',
        speakerName: dlg?.speaker || chapterDetail.characters[0]?.name || 'Narrator',
        dialogue: dlg?.text || `Scene ${idx + 1} from ${chapterDetail.chapter.title}.`,
        narration: dlg?.narration || chapterDetail.chapter.description,
      };
    });

    soundFx.playCinematicImpact();
    onSendChapterToVideoStudio({
      seriesTitle: chapterDetail.series?.title || activeSeries?.title || 'Manhwa Series',
      chapterId: chapterDetail.chapter.id,
      chapterTitle: `Chapter ${padChapter(chapterDetail.chapter.chapter_number)} — ${chapterDetail.chapter.title}`,
      panels: mappedPanels,
    });
  };

  const toggleFullscreen = () => {
    const el = readerContainerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => setIsFullscreen(false));
    }
  };

  const siblingNav = useMemo(() => {
    if (!chapterDetail) return { prev: null, next: null };
    const idx = chapterDetail.siblingChapters.findIndex((c) => c.id === chapterDetail.chapter.id);
    return {
      prev: idx > 0 ? chapterDetail.siblingChapters[idx - 1] : null,
      next: idx >= 0 && idx < chapterDetail.siblingChapters.length - 1 ? chapterDetail.siblingChapters[idx + 1] : null,
    };
  }, [chapterDetail]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#090b10] text-slate-100">
      {notice && (
        <div className="px-6 py-2 bg-emerald-500/10 border-b border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between shrink-0">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} className="underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* VIEW 1: MANHWA LIBRARY HOMEPAGE */}
      {view === 'library' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800/90 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  ['my', 'My Manhwa'],
                  ['explore', 'Explore Manhwa'],
                  ['recent', 'Recently Opened'],
                  ['favourites', 'Favourite Manhwa'],
                ] as const
              ).map(([tabId, label]) => (
                <button
                  key={tabId}
                  type="button"
                  onClick={() => setLibraryTab(tabId)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    libraryTab === tabId
                      ? 'bg-amber-500 text-black font-bold'
                      : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search manhwa, genre, author..."
                  className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-amber-500 w-56"
                />
              </div>
              <button
                type="button"
                onClick={openCreateSeriesModal}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Manhwa</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400 font-mono">Loading Manhwa Library...</div>
            ) : seriesList.length === 0 ? (
              <div className="max-w-md mx-auto py-16 text-center space-y-3">
                <p className="text-sm font-semibold text-white">No manhwa series in this view yet.</p>
                <p className="text-xs text-slate-400">
                  Create a new manhwa series, add chapters, upload pages, and convert them into animated AI videos.
                </p>
                <button
                  type="button"
                  onClick={openCreateSeriesModal}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-black text-xs font-bold"
                >
                  Create New Manhwa
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {seriesList.map((series) => (
                  <div
                    key={series.id}
                    onClick={() => openSeries(series.id)}
                    className="group cursor-pointer rounded-xl border border-slate-800 bg-slate-900/50 hover:border-amber-500/60 overflow-hidden transition-colors flex flex-col"
                  >
                    <div className="aspect-[3/4] bg-slate-950 relative overflow-hidden">
                      <img
                        src={series.cover_url}
                        alt={series.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavourite(series, e)}
                        aria-label="Toggle favourite"
                        className={`absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/70 ${
                          series.is_favourite ? 'text-amber-400' : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        <Star className="w-4 h-4" fill={series.is_favourite ? 'currentColor' : 'none'} />
                      </button>
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-base font-bold text-white leading-tight truncate">{series.title}</h3>
                        <p className="text-xs text-slate-300 mt-0.5 truncate">
                          {series.genre} · {series.status}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{series.description}</p>
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 tabular-nums">
                        <span>{series.author}</span>
                        <span className="font-mono text-amber-400">{series.chapter_count || 0} Chapters</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: MANHWA OPENING PAGE (SERIES DETAILS & CHAPTER LIST) */}
      {view === 'series' && activeSeries && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setView('library');
                  loadSeriesList();
                }}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Manhwa Library</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleFavourite(activeSeries)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 hover:text-white flex items-center gap-1.5"
                >
                  <Star
                    className={`w-3.5 h-3.5 ${activeSeries.is_favourite ? 'text-amber-400' : 'text-slate-400'}`}
                    fill={activeSeries.is_favourite ? 'currentColor' : 'none'}
                  />
                  <span>{activeSeries.is_favourite ? 'Favourited' : 'Favourite'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => openEditSeriesModal(activeSeries)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 hover:text-white flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Series</span>
                </button>
              </div>
            </div>

            {/* Hero Series Header */}
            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 p-6 rounded-xl border border-slate-800 bg-slate-900/50">
              <div className="aspect-[3/4] rounded-lg overflow-hidden bg-slate-950 border border-slate-800">
                <img
                  src={activeSeries.cover_url}
                  alt={activeSeries.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <div className="text-xs text-slate-400">
                    {activeSeries.genre} · {activeSeries.language} · {activeSeries.art_style} · {activeSeries.status} ·{' '}
                    {activeSeries.visibility}
                  </div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">{activeSeries.title}</h1>
                  <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">{activeSeries.description}</p>
                  <div className="text-xs text-slate-400">
                    Author: <span className="text-slate-200 font-medium">{activeSeries.author}</span> ·{' '}
                    <span className="tabular-nums">{chaptersList.length} Chapters</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={chaptersList.length === 0}
                    onClick={() => chaptersList[0] && openChapter(chaptersList[0].id, true)}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black text-xs font-bold flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Read First Chapter</span>
                  </button>
                  <button
                    type="button"
                    disabled={chaptersList.length === 0}
                    onClick={() => {
                      const targetId = activeSeries.last_read_chapter_id || chaptersList[0]?.id;
                      if (targetId) openChapter(targetId, true);
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>Continue Reading</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingChapterId(null);
                      setChapterForm({
                        title: '',
                        description: '',
                        cover_url: activeSeries.cover_url,
                        status: 'Draft',
                      });
                      setShowChapterModal(true);
                    }}
                    className="px-4 py-2 rounded-lg border border-slate-700 hover:border-amber-500 text-slate-200 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Chapter</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Chapters List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h2 className="text-sm font-bold text-white">Chapters ({chaptersList.length})</h2>
                <span className="text-xs text-slate-400">Click any chapter to inspect pages, panels, dialogue & AI video</span>
              </div>

              {chaptersList.length === 0 ? (
                <div className="p-8 rounded-xl border border-slate-800 text-center space-y-2">
                  <p className="text-xs text-slate-400">No chapters created yet for {activeSeries.title}.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingChapterId(null);
                      setChapterForm({ title: 'The Beginning', description: '', cover_url: activeSeries.cover_url, status: 'Draft' });
                      setShowChapterModal(true);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-bold"
                  >
                    Create Chapter 001
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
                  {chaptersList.slice(0, visibleChaptersCount).map((ch, idx) => (
                    <div
                      key={ch.id}
                      onClick={() => openChapter(ch.id, false)}
                      className="px-4 py-3.5 hover:bg-slate-900/90 cursor-pointer flex flex-wrap items-center justify-between gap-4 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <img
                          src={ch.cover_url}
                          alt={ch.title}
                          referrerPolicy="no-referrer"
                          className="w-12 h-14 rounded object-cover border border-slate-800 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white truncate">
                            <span className="font-mono text-amber-400 tabular-nums">
                              Chapter {padChapter(ch.chapter_number)}
                            </span>{' '}
                            — {ch.title}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 truncate">
                            {ch.status} · {ch.page_count || 0} Pages · {ch.panel_count || 0} Panels ·{' '}
                            {ch.dialogue_count || 0} Dialogue Lines · {ch.video_count || 0} Videos
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => openChapter(ch.id, true)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white whitespace-nowrap"
                        >
                          Read
                        </button>
                        <button
                          type="button"
                          onClick={() => openChapter(ch.id, false)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold whitespace-nowrap"
                        >
                          Open Studio
                        </button>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleReorderChapter(idx, -1)}
                          title="Move chapter up"
                          className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-30"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === chaptersList.length - 1}
                          onClick={() => handleReorderChapter(idx, 1)}
                          title="Move chapter down"
                          className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-30"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingChapterId(ch.id);
                            setChapterForm({
                              title: ch.title,
                              description: ch.description,
                              cover_url: ch.cover_url,
                              status: ch.status,
                            });
                            setShowChapterModal(true);
                          }}
                          title="Edit chapter"
                          className="p-1.5 rounded text-slate-400 hover:text-white"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteChapter(ch.id)}
                          title="Delete chapter"
                          className="p-1.5 rounded text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {chaptersList.length > visibleChaptersCount && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setVisibleChaptersCount((c) => c + 10)}
                    className="px-5 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-500 text-xs font-semibold text-slate-200"
                  >
                    Load More Chapters ({chaptersList.length - visibleChaptersCount} remaining)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: COMPLETE CHAPTER DETAILS & AI WORKFLOW */}
      {view === 'chapter' && chapterDetail && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => activeSeries && openSeries(activeSeries.id)}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to {chapterDetail.series?.title || 'Manhwa'}</span>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setView('reader')}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Open Chapter Reader</span>
                </button>
                <button
                  type="button"
                  onClick={handleSendToAiVideoStudio}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Clapperboard className="w-3.5 h-3.5" />
                  <span>Generate AI Animation & Export MP4</span>
                </button>
              </div>
            </div>

            {/* Chapter Summary Header */}
            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-5 p-5 rounded-xl border border-slate-800 bg-slate-900/50">
              <img
                src={chapterDetail.chapter.cover_url}
                alt={chapterDetail.chapter.title}
                referrerPolicy="no-referrer"
                className="w-full h-40 object-cover rounded-lg border border-slate-800"
              />
              <div className="space-y-3">
                <div className="text-xs text-slate-400 tabular-nums">
                  Chapter {padChapter(chapterDetail.chapter.chapter_number)} · Status: {chapterDetail.chapter.status} ·
                  Created {new Date(chapterDetail.chapter.created_at).toLocaleDateString()}
                </div>
                <h1 className="text-2xl font-bold text-white">{chapterDetail.chapter.title}</h1>
                <p className="text-xs text-slate-300 leading-relaxed">{chapterDetail.chapter.description}</p>

                {/* AI Pipeline Quick Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDetectPanels}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:border-amber-500 text-xs text-slate-200 flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>1. Detect Comic Panels</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtractCharacters(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:border-amber-500 text-xs text-slate-200 flex items-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>2. Extract Characters</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtractDialogue(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:border-amber-500 text-xs text-slate-200 flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                    <span>3. Extract Dialogue</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateScenePrompts}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:border-amber-500 text-xs text-slate-200 flex items-center gap-1.5"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>4. Generate Scene Prompts</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Chapter Detail Section Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-3">
              {(
                [
                  ['pages', `Pages (${chapterDetail.pages.length})`],
                  ['panels', `Panels (${chapterDetail.panels.length})`],
                  ['characters', `Characters (${chapterDetail.characters.length})`],
                  ['dialogue', `Dialogue (${chapterDetail.dialogues.length})`],
                  ['prompts', `Scene Prompts (${chapterDetail.scenePrompts.length})`],
                  [
                    'media',
                    `Backgrounds, Audio & Video (${
                      (chapterDetail.chapter.backgrounds?.length || 0) +
                      (chapterDetail.chapter.audio_tracks?.length || 0) +
                      chapterDetail.videoJobs.length
                    })`,
                  ],
                ] as const
              ).map(([tabId, label]) => (
                <button
                  key={tabId}
                  type="button"
                  onClick={() => setChapterSubTab(tabId)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    chapterSubTab === tabId
                      ? 'bg-amber-500 text-black font-bold'
                      : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* SUB-TAB: PAGES */}
            {chapterSubTab === 'pages' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/40">
                  <label className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold cursor-pointer flex items-center gap-2 whitespace-nowrap">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Multiple Pages</span>
                    <input type="file" multiple accept="image/*" onChange={handleMultiPageUpload} className="hidden" />
                  </label>
                  <form onSubmit={handleImportPageByUrl} className="flex-1 flex items-center gap-2 min-w-[240px]">
                    <input
                      value={importPageUrl}
                      onChange={(e) => setImportPageUrl(e.target.value)}
                      placeholder="Or paste permitted page image URL..."
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white whitespace-nowrap"
                    >
                      Import Page
                    </button>
                  </form>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {chapterDetail.pages.map((pg) => (
                    <div
                      key={pg.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden flex flex-col"
                    >
                      <div className="h-56 bg-slate-950 relative">
                        <img
                          src={pg.image_url}
                          alt={pg.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeletePage(pg.id)}
                          className="absolute top-2 right-2 p-1.5 rounded bg-black/75 text-slate-300 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="p-3 flex items-center justify-between text-xs">
                        <span className="font-semibold text-white truncate">{pg.title}</span>
                        <span className="font-mono text-slate-400 tabular-nums">Page {pg.page_number}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-TAB: PANELS */}
            {chapterSubTab === 'panels' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {chapterDetail.panels.length === 0 ? (
                  <div className="col-span-full p-8 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                    No panels detected yet. Click &ldquo;1. Detect Comic Panels&rdquo; above.
                  </div>
                ) : (
                  chapterDetail.panels.map((pnl) => (
                    <div key={pnl.id} className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                      <img
                        src={pnl.image_url}
                        alt={pnl.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-44 object-cover"
                      />
                      <div className="p-3 space-y-1">
                        <div className="text-xs font-bold text-white">{pnl.title}</div>
                        <div className="text-xs text-slate-400 tabular-nums">
                          Motion: {pnl.camera_motion} · {pnl.duration_sec}s
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* SUB-TAB: CHARACTERS */}
            {chapterSubTab === 'characters' && (
              <div className="space-y-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleExtractCharacters(true);
                  }}
                  className="grid grid-cols-1 md:grid-cols-4 gap-2 p-4 rounded-xl border border-slate-800 bg-slate-900/40"
                >
                  <input
                    required
                    value={newCharName}
                    onChange={(e) => setNewCharName(e.target.value)}
                    placeholder="Character name"
                    className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                  <input
                    value={newCharRole}
                    onChange={(e) => setNewCharRole(e.target.value)}
                    placeholder="Role (e.g. Protagonist)"
                    className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                  <input
                    value={newCharAppearance}
                    onChange={(e) => setNewCharAppearance(e.target.value)}
                    placeholder="Visual appearance notes"
                    className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-lg bg-amber-500 text-black text-xs font-bold"
                  >
                    Add Character
                  </button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {chapterDetail.characters.map((ch) => (
                    <div key={ch.id} className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1">
                      <div className="text-sm font-bold text-white">
                        {ch.name} <span className="text-xs font-normal text-slate-400">· {ch.role} · {ch.voice_gender}</span>
                      </div>
                      <p className="text-xs text-slate-300">{ch.appearance}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-TAB: DIALOGUE */}
            {chapterSubTab === 'dialogue' && (
              <div className="space-y-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleExtractDialogue(true);
                  }}
                  className="grid grid-cols-1 md:grid-cols-4 gap-2 p-4 rounded-xl border border-slate-800 bg-slate-900/40"
                >
                  <input
                    value={newDlgSpeaker}
                    onChange={(e) => setNewDlgSpeaker(e.target.value)}
                    placeholder="Speaker (e.g. Kairo)"
                    className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                  <input
                    required
                    value={newDlgText}
                    onChange={(e) => setNewDlgText(e.target.value)}
                    placeholder="Dialogue line"
                    className="md:col-span-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                  <button type="submit" className="px-3 py-2 rounded-lg bg-amber-500 text-black text-xs font-bold">
                    Add Dialogue
                  </button>
                </form>

                <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
                  {chapterDetail.dialogues.map((d) => (
                    <div key={d.id} className="p-4 space-y-1">
                      <div className="text-xs font-semibold text-amber-400">
                        {d.speaker} · {d.emotion}
                      </div>
                      <p className="text-sm text-white">&ldquo;{d.text}&rdquo;</p>
                      {d.narration && <p className="text-xs text-slate-400">Narration: {d.narration}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-TAB: SCENE PROMPTS */}
            {chapterSubTab === 'prompts' && (
              <div className="space-y-3">
                {chapterDetail.scenePrompts.length === 0 ? (
                  <div className="p-8 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                    Click &ldquo;4. Generate Scene Prompts&rdquo; to create image-to-video motion prompts for every panel.
                  </div>
                ) : (
                  chapterDetail.scenePrompts.map((prm, idx) => (
                    <div key={prm.id} className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1.5">
                      <div className="text-xs font-mono text-amber-400 tabular-nums">
                        Scene {idx + 1} · {prm.style} · {prm.camera_motion}
                      </div>
                      <p className="text-xs text-slate-200 font-mono leading-relaxed">{prm.prompt_text}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* SUB-TAB: BACKGROUNDS, AUDIO & VIDEO */}
            {chapterSubTab === 'media' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
                  <h3 className="text-xs font-bold text-white">Scene Backgrounds</h3>
                  <form onSubmit={handleAddBackground} className="flex gap-2">
                    <input
                      value={newBgLabel}
                      onChange={(e) => setNewBgLabel(e.target.value)}
                      placeholder="Add background setting..."
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                    />
                    <button type="submit" className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold">
                      Add
                    </button>
                  </form>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {(chapterDetail.chapter.backgrounds || []).map((bg, i) => (
                      <li key={i} className="py-1 border-b border-slate-800/70">
                        {bg}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Generated Character Voices</span>
                  </h3>
                  {(chapterDetail.chapter.audio_tracks || []).length === 0 ? (
                    <p className="text-xs text-slate-400">
                      Open AI Animation & Video Studio to synthesize voices in Kannada, English, Hindi, Tamil, or Telugu.
                    </p>
                  ) : (
                    chapterDetail.chapter.audio_tracks.map((tr) => (
                      <div key={tr.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                        <div className="font-semibold text-white">{tr.label}</div>
                        <div className="text-slate-400">{tr.speaker} · {tr.voice_gender}</div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-amber-400" />
                    <span>Rendered Animation Clips</span>
                  </h3>
                  {chapterDetail.videoJobs.length === 0 ? (
                    <p className="text-xs text-slate-400">
                      No rendered MP4 clips yet. Send this chapter to the AI Video Studio to render and export MP4.
                    </p>
                  ) : (
                    chapterDetail.videoJobs.map((job) => (
                      <div key={job.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                        <div className="font-semibold text-white">{job.title}</div>
                        <div className="text-slate-400 tabular-nums">
                          {job.status} · {job.resolution} · {job.duration_sec}s
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 4: MANHWA CHAPTER READER */}
      {view === 'reader' && chapterDetail && (
        <div ref={readerContainerRef} className="flex-1 flex flex-col overflow-hidden bg-black text-slate-100">
          <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => activeSeries && openSeries(activeSeries.id)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-slate-200 flex items-center gap-1.5 whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Manhwa</span>
              </button>
              <div className="text-xs truncate">
                <span className="font-bold text-white">{chapterDetail.series?.title}</span>
                <span className="text-slate-400">
                  {' '}
                  · Chapter {padChapter(chapterDetail.chapter.chapter_number)} — {chapterDetail.chapter.title}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setReaderMode('vertical')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${
                    readerMode === 'vertical' ? 'bg-amber-500 text-black' : 'text-slate-300'
                  }`}
                >
                  Vertical Scroll
                </button>
                <button
                  type="button"
                  onClick={() => setReaderMode('paged')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${
                    readerMode === 'paged' ? 'bg-amber-500 text-black' : 'text-slate-300'
                  }`}
                >
                  Page-by-Page
                </button>
              </div>

              <div className="flex items-center gap-1 bg-slate-900 rounded-lg px-2 py-1 border border-slate-800 text-xs tabular-nums">
                <button
                  type="button"
                  onClick={() => setReaderZoom((z) => Math.max(50, z - 15))}
                  className="text-slate-300 hover:text-white"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-mono">{readerZoom}%</span>
                <button
                  type="button"
                  onClick={() => setReaderZoom((z) => Math.min(200, z + 15))}
                  className="text-slate-300 hover:text-white"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                aria-label="Toggle fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6">
            {chapterDetail.pages.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <p className="text-sm text-slate-300">No pages uploaded to this chapter yet.</p>
                <button
                  type="button"
                  onClick={() => setView('chapter')}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-black text-xs font-bold"
                >
                  Upload Pages in Chapter Studio
                </button>
              </div>
            ) : readerMode === 'vertical' ? (
              <div className="mx-auto space-y-3 flex flex-col items-center" style={{ maxWidth: `${Math.round(7.6 * readerZoom)}px` }}>
                {chapterDetail.pages.map((pg) => (
                  <figure key={pg.id} className="w-full space-y-1">
                    <img
                      src={pg.image_url}
                      alt={pg.title}
                      referrerPolicy="no-referrer"
                      className="w-full rounded border border-slate-900"
                    />
                    <figcaption className="text-center text-xs text-slate-500 font-mono tabular-nums">
                      Page {pg.page_number} of {chapterDetail.pages.length}
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <div className="mx-auto flex flex-col items-center space-y-4" style={{ maxWidth: `${Math.round(7.6 * readerZoom)}px` }}>
                <img
                  src={chapterDetail.pages[readerPageIdx]?.image_url}
                  alt={chapterDetail.pages[readerPageIdx]?.title}
                  referrerPolicy="no-referrer"
                  className="w-full rounded border border-slate-900"
                />
                <div className="flex items-center gap-4 text-xs tabular-nums">
                  <button
                    type="button"
                    disabled={readerPageIdx <= 0}
                    onClick={() => setReaderPageIdx((i) => Math.max(0, i - 1))}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 disabled:opacity-40 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous Page</span>
                  </button>
                  <span className="font-mono text-slate-300">
                    Page {readerPageIdx + 1} / {chapterDetail.pages.length}
                  </span>
                  <button
                    type="button"
                    disabled={readerPageIdx >= chapterDetail.pages.length - 1}
                    onClick={() => setReaderPageIdx((i) => Math.min(chapterDetail.pages.length - 1, i + 1))}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 disabled:opacity-40 flex items-center gap-1"
                  >
                    <span>Next Page</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
            <button
              type="button"
              disabled={!siblingNav.prev}
              onClick={() => siblingNav.prev && openChapter(siblingNav.prev.id, true)}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-xs font-semibold flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Chapter</span>
            </button>
            <button
              type="button"
              onClick={() => setView('chapter')}
              className="px-3.5 py-1.5 rounded-lg border border-slate-700 hover:border-amber-500 text-xs font-semibold text-amber-300"
            >
              Open Chapter Studio
            </button>
            <button
              type="button"
              disabled={!siblingNav.next}
              onClick={() => siblingNav.next && openChapter(siblingNav.next.id, true)}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-black text-xs font-bold flex items-center gap-1.5"
            >
              <span>Next Chapter</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MANHWA SERIES MODAL */}
      {showSeriesModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveSeries}
            className="w-full max-w-lg rounded-xl bg-slate-900 border border-slate-700 p-5 space-y-3.5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                {editingSeriesId ? 'Edit Manhwa Series' : 'Create New Manhwa'}
              </h3>
              <button type="button" onClick={() => setShowSeriesModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Manhwa Name</label>
              <input
                required
                value={seriesForm.title}
                onChange={(e) => setSeriesForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Shadow World"
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Description</label>
              <textarea
                rows={3}
                value={seriesForm.description}
                onChange={(e) => setSeriesForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="An adventure in a mysterious fantasy world..."
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Cover Image</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COVERS.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setSeriesForm((p) => ({ ...p, cover_url: preset.url }))}
                    className={`px-2.5 py-1 rounded text-xs border ${
                      seriesForm.cover_url === preset.url
                        ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                        : 'border-slate-700 bg-slate-950 text-slate-300'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
                <label className="px-2.5 py-1 rounded text-xs border border-slate-700 bg-slate-950 text-slate-200 cursor-pointer hover:border-amber-500">
                  Upload Cover
                  <input type="file" accept="image/*" onChange={handleCoverFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Author</label>
                <input
                  value={seriesForm.author}
                  onChange={(e) => setSeriesForm((p) => ({ ...p, author: e.target.value }))}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Genre</label>
                <input
                  value={seriesForm.genre}
                  onChange={(e) => setSeriesForm((p) => ({ ...p, genre: e.target.value }))}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Language</label>
                <input
                  value={seriesForm.language}
                  onChange={(e) => setSeriesForm((p) => ({ ...p, language: e.target.value }))}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Art Style</label>
                <input
                  value={seriesForm.art_style}
                  onChange={(e) => setSeriesForm((p) => ({ ...p, art_style: e.target.value }))}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Status</label>
                <select
                  value={seriesForm.status}
                  onChange={(e) => setSeriesForm((p) => ({ ...p, status: e.target.value as 'Ongoing' | 'Completed' }))}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                >
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Visibility</label>
                <select
                  value={seriesForm.visibility}
                  onChange={(e) =>
                    setSeriesForm((p) => ({ ...p, visibility: e.target.value as 'Private' | 'Public' }))
                  }
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                >
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold"
            >
              {editingSeriesId ? 'Save Changes' : 'Create Manhwa'}
            </button>
          </form>
        </div>
      )}

      {/* CREATE / EDIT CHAPTER MODAL */}
      {showChapterModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveChapter}
            className="w-full max-w-md rounded-xl bg-slate-900 border border-slate-700 p-5 space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                {editingChapterId ? 'Edit Chapter' : 'Add New Chapter'}
              </h3>
              <button
                type="button"
                onClick={() => setShowChapterModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Chapter Title</label>
              <input
                required
                value={chapterForm.title}
                onChange={(e) => setChapterForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. The Awakening"
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Chapter Description</label>
              <textarea
                rows={3}
                value={chapterForm.description}
                onChange={(e) => setChapterForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Summary of events in this chapter..."
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Status</label>
              <select
                value={chapterForm.status}
                onChange={(e) =>
                  setChapterForm((p) => ({ ...p, status: e.target.value as 'Draft' | 'Processing' | 'Completed' }))
                }
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
              >
                <option value="Draft">Draft</option>
                <option value="Processing">Processing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold"
            >
              {editingChapterId ? 'Save Chapter' : 'Create Chapter'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
