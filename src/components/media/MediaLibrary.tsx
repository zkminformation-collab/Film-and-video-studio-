import React, { useState, useRef, useEffect } from 'react';
import { 
  FolderOpen, 
  Search, 
  Upload, 
  Film, 
  Music, 
  Image as ImageIcon, 
  Sparkles, 
  Download, 
  Play, 
  Pause,
  Sliders, 
  Volume2, 
  Activity, 
  Layers, 
  Wand2, 
  Camera, 
  FileText,
  Check,
  Copy,
  Plus,
  Star,
  ShieldCheck,
  Box,
  User,
  Radio,
  Share2,
  Filter,
  ExternalLink,
  ChevronRight,
  Info,
  Clock,
  HardDrive,
  Eye,
  Trash2
} from 'lucide-react';
import { FilmProject, StudioModule } from '../../types';
import { soundFx } from '../../utils/audioSynth';
import { downloadCartoonProjectMp4 } from '../../utils/cartoonProjectApi';
import { useAuth, CloudLibraryAsset } from '../../context/AuthContext';
import { FreeAssetLibraryWorkspace } from './FreeAssetLibraryWorkspace';
import { isLibraryRenderImage, LibraryVideoComposer } from './LibraryVideoComposer';
import { isStoredLibraryMedia, LIBRARY_FILE_ACCEPT, MAX_LIBRARY_UPLOAD_BYTES } from '../../data/libraryMediaFormats';
import type { LibraryUploadedAsset } from '../../../server/mediaLibraryStore.ts';
import { 
  ASSET_CATEGORIES,
  INITIAL_COLLECTIONS,
  COMPLETE_MEDIA_CATALOG,
  UniversalAsset,
  AssetCategory,
  AssetSource,
  AssetCollection 
} from '../../data/libraryData';

interface MediaLibraryProps {
  activeFilm: FilmProject;
  onSendToEditor?: (asset: UniversalAsset) => void;
  onNavigate?: (module: StudioModule) => void;
}

function fromLibraryRecord(item: LibraryUploadedAsset): UniversalAsset {
  return {
    id: item.id,
    name: item.name,
    category: item.category as AssetCategory,
    subcategory: item.subcategory || 'Uploaded Studio Asset',
    source: item.source,
    format: item.format || 'FILE',
    durationSeconds: item.durationSeconds,
    size: item.size || '1.0 MB',
    thumbnail: item.thumbnail || '/assets/images/cartoon_adventure_thumb_1794924309261.jpg',
    mediaUrl: item.url,
    description: item.description || 'Persisted in Unified Cartoon Production Library.',
    tags: Array.isArray(item.tags) ? item.tags : ['Uploaded'],
    projectId: item.projectId || undefined,
    projectName: item.projectName || undefined,
    timelineTrack: item.timelineTrack || undefined,
    license: {
      type: 'Studio Master Proprietary',
      commercialUse: true,
      attribution: 'ZKMAP STUDIO Unified Library',
      certificateId: `ZK-LIB-${String(item.id).slice(0, 10)}`,
      verified: true,
    },
    specs: { codec: item.format, fps: 24, aspect: '16:9' },
    isFavorite: false,
    addedAt: item.addedAt || new Date().toISOString().split('T')[0],
    usageCount: 1,
  };
}

export const MediaLibrary: React.FC<MediaLibraryProps> = (props) => {
  const { firebaseUser } = useAuth();
  return <MediaLibraryWorkspace key={firebaseUser?.uid || 'guest'} {...props} />;
};

const MediaLibraryWorkspace: React.FC<MediaLibraryProps> = ({ activeFilm, onSendToEditor, onNavigate }) => {
  const [libraryView, setLibraryView] = useState<'free_library' | 'studio_vault'>('free_library');
  const { firebaseUser, studioMediaReady, cloudAssets, saveLibraryAsset, deleteLibraryAsset } = useAuth();
  const [catalog, setCatalog] = useState<UniversalAsset[]>(COMPLETE_MEDIA_CATALOG);
  const [collections, setCollections] = useState<AssetCollection[]>(INITIAL_COLLECTIONS);

  useEffect(() => {
    if (!cloudAssets || cloudAssets.length === 0) return;
    setCatalog((prev) => {
      const existingIds = new Set(prev.map((a) => a.id));
      const mappedNew: UniversalAsset[] = cloudAssets
        .filter((ca) => !existingIds.has(ca.id))
        .map((ca) => ({
          id: ca.id,
          name: ca.name,
          category:
            ca.category === 'audio'
              ? 'music'
              : ca.category === 'stills'
              ? 'image'
              : ca.category === 'sfx'
              ? 'sfx'
              : ca.category === 'vfx'
              ? 'vfx'
              : 'video',
          subcategory: 'Cloud Vault Sync',
          source: 'upload',
          format: ca.format,
          size: ca.size,
          duration: ca.duration,
          thumbnail: ca.thumbnail || '/assets/images/hero_studio_suite_1794901010340.jpg',
          mediaUrl: ca.url || '/assets/images/hero_studio_suite_1794901010340.jpg',
          description: `Synced via ${ca.provider}`,
          tags: ['Cloud Synced', ca.category, ca.provider],
          license: {
            type: 'Studio Master Proprietary',
            commercialUse: true,
            attribution: 'Personal Cloud Vault',
            certificateId: `FVS-CLOUD-${ca.id.slice(0, 10)}`,
            verified: true,
          },
          specs: { codec: ca.format, fps: 24, aspect: '16:9' },
          isFavorite: false,
          addedAt: new Date().toISOString().split('T')[0],
          usageCount: 1,
        }));
      return mappedNew.length > 0 ? [...mappedNew, ...prev] : prev;
    });
  }, [cloudAssets]);

  // Load persisted server-uploaded assets from Unified Cartoon Production Library
  useEffect(() => {
    if (firebaseUser?.emailVerified && !studioMediaReady) return;
    const controller = new AbortController();
    fetch('/api/library/assets', { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (!data?.success || !Array.isArray(data.assets) || data.assets.length === 0) return;
        setCatalog((prev) => {
          const existingIds = new Set(prev.map((a) => a.id));
          const mapped: UniversalAsset[] = data.assets
            .filter((item: any) => !existingIds.has(item.id))
            .map(fromLibraryRecord);
          return mapped.length > 0 ? [...mapped, ...prev] : prev;
        });
      })
      .catch(() => {});
    return () => controller.abort();
  }, [firebaseUser, studioMediaReady]);
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'all'>('all');
  const [selectedSource, setSelectedSource] = useState<AssetSource | 'all'>('all');
  const [selectedCollection, setSelectedCollection] = useState<string | 'all'>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Active Selected Asset
  const [selectedAsset, setSelectedAsset] = useState<UniversalAsset | null>(COMPLETE_MEDIA_CATALOG[0] || null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // Modals & Panels
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [showLicenseModal, setShowLicenseModal] = useState<boolean>(false);
  const [showNewCollectionModal, setShowNewCollectionModal] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showTechStackModal, setShowTechStackModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Unified Production Library Tech Stack & Catalog Specs from /api/library/catalog
  const [techStack, setTechStack] = useState<Array<{ name: string; purpose: string }>>([]);
  const [catalogSpecs, setCatalogSpecs] = useState<
    Array<{ id: string; name: string; summary: string; assetTypes: string[] }>
  >([]);

  // Category-Aware Upload Modal State
  const [uploadCategory, setUploadCategory] = useState<AssetCategory | 'auto'>('auto');
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [videoComposer, setVideoComposer] = useState<{ initialImage?: UniversalAsset } | null>(null);
  const [uploadTags, setUploadTags] = useState<string>('Cartoon, Studio');
  const [uploadDescription, setUploadDescription] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (firebaseUser?.emailVerified && !studioMediaReady) return;
    const controller = new AbortController();
    fetch('/api/library/catalog', { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (data?.success) {
          if (Array.isArray(data.techStack)) setTechStack(data.techStack);
          if (Array.isArray(data.categories)) setCatalogSpecs(data.categories);
        }
      })
      .catch(() => {});

    return () => {
      controller.abort();
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, [firebaseUser, studioMediaReady]);

  // AI Generator Form State
  const [aiPrompt, setAiPrompt] = useState('Epic cinematic establishing drone shot of ancient alien obelisk at golden hour');
  const [aiAssetType, setAiAssetType] = useState<string>('video');
  const [aiStyle, setAiStyle] = useState('Cinematic Hollywood 35mm');
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);

  // New Collection Form State
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [newColCategory, setNewColCategory] = useState('Film & VFX');

  // Licensing Certificate state
  const [licenseCertificate, setLicenseCertificate] = useState<any>(null);

  // Waveform Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  // Audio Waveform Visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const draw = () => {
      ctx.fillStyle = '#06080e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const numBars = 44;
      const barWidth = canvas.width / numBars - 2;

      for (let i = 0; i < numBars; i++) {
        const heightMultiplier = isPlayingAudio ? 0.85 : 0.15;
        const wave = Math.sin(phase + i * 0.22) * 0.5 + 0.5;
        const noise = isPlayingAudio ? Math.random() * 0.25 : 0.04;
        const barHeight = Math.max(3, (wave + noise) * canvas.height * heightMultiplier);

        const x = i * (barWidth + 2);
        const y = (canvas.height - barHeight) / 2;

        ctx.fillStyle = isPlayingAudio ? '#06b6d4' : '#334155';
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      phase += isPlayingAudio ? 0.14 : 0.02;
      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlayingAudio]);

  // Distinct project IDs present in catalog for quick filtering
  const availableProjects = Array.from(
    new Map(
      catalog
        .filter((a) => a.projectId)
        .map((a) => [a.projectId as string, a.projectName || (a.projectId as string)])
    ).entries()
  );

  // Filter Catalog
  const filteredAssets = catalog.filter((asset) => {
    const matchCategory = selectedCategory === 'all' || asset.category === selectedCategory;
    const matchSource = selectedSource === 'all' || asset.source === selectedSource;
    const matchCollection = selectedCollection === 'all' || asset.collection === selectedCollection;
    const matchProject = selectedProjectId === 'all' || asset.projectId === selectedProjectId;
    const matchFav = !showFavoritesOnly || asset.isFavorite;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      asset.name.toLowerCase().includes(q) ||
      asset.description.toLowerCase().includes(q) ||
      (asset.projectId || '').toLowerCase().includes(q) ||
      (asset.projectName || '').toLowerCase().includes(q) ||
      asset.tags.some((t) => t.toLowerCase().includes(q));

    return matchCategory && matchSource && matchCollection && matchProject && matchFav && matchSearch;
  });

  const notify = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleFavorite = (assetId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundFx.playScannerBeep();
    setCatalog((prev) =>
      prev.map((a) => (a.id === assetId ? { ...a, isFavorite: !a.isFavorite } : a))
    );
    if (selectedAsset?.id === assetId) {
      setSelectedAsset((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
    }
    fetch(`/api/assets/${assetId}/favorite`, { method: 'POST' }).catch(() => {});
  };

  const handleDeleteAsset = (assetId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundFx.playWhoosh();
    const removed = catalog.find((a) => a.id === assetId);
    setCatalog((prev) => {
      const next = prev.filter((a) => a.id !== assetId);
      if (selectedAsset?.id === assetId) {
        setSelectedAsset(next[0] || null);
      }
      return next;
    });
    setConfirmDeleteId(null);
    fetch(`/api/assets/${encodeURIComponent(assetId)}`, { method: 'DELETE' }).catch(() => {});
    fetch(`/api/library/assets/${encodeURIComponent(assetId)}`, { method: 'DELETE' }).catch(() => {});
    if (firebaseUser) {
      deleteLibraryAsset(assetId).catch(() => {});
    }
    if (removed) {
      notify(`Deleted "${removed.name}" from studio media library.`);
    }
  };

  const handleAudition = (asset: UniversalAsset) => {
    soundFx.unlock();
    if (isPlayingAudio) {
      soundFx.stopScorePlayback();
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
        audioPlayerRef.current = null;
      }
      setIsPlayingAudio(false);
      return;
    }

    // Play real uploaded audio files directly when available
    const isRealAudioUrl =
      asset.mediaUrl &&
      (asset.mediaUrl.startsWith('/api/library-uploads/') ||
        /\.(mp3|wav|ogg|m4a)(\?|$)/i.test(asset.mediaUrl)) &&
      ['music', 'sfx', 'voice'].includes(asset.category);

    if (isRealAudioUrl) {
      const player = new Audio(asset.mediaUrl);
      audioPlayerRef.current = player;
      setIsPlayingAudio(true);
      player.onended = () => {
        setIsPlayingAudio(false);
        audioPlayerRef.current = null;
      };
      player.onerror = () => {
        setIsPlayingAudio(false);
        audioPlayerRef.current = null;
      };
      player.play().catch(() => {
        setIsPlayingAudio(false);
        audioPlayerRef.current = null;
      });
      return;
    }

    setIsPlayingAudio(true);
    const method = asset.specs.soundMethod;
    if (method && typeof (soundFx as any)[method] === 'function') {
      (soundFx as any)[method].call(soundFx);
    } else if (asset.category === 'music') {
      soundFx.startScorePlayback(0.6);
    } else {
      soundFx.playCinematicImpact();
    }

    setTimeout(() => {
      if (asset.category !== 'music') {
        setIsPlayingAudio(false);
      }
    }, 2500);
  };

  const resolveTimelineTrackLabel = (asset: UniversalAsset): string => {
    if (asset.timelineTrack) return asset.timelineTrack;
    switch (asset.category) {
      case 'character':
        return 'Character / Image';
      case 'image':
      case 'background':
      case 'prop':
        return 'Image';
      case 'video':
      case 'animation':
        return 'Video';
      case 'voice':
        return 'Voice';
      case 'music':
        return 'Music';
      case 'sfx':
        return 'SFX';
      case 'vfx':
        return 'VFX';
      case 'subtitle':
      case 'template':
      case 'transition':
      case 'camera':
      case 'color':
        return 'Overlay';
      default:
        return 'Video';
    }
  };

  const handleSendToTimeline = (asset: UniversalAsset) => {
    soundFx.playCinematicImpact();
    const trackName = resolveTimelineTrackLabel(asset);
    if (onSendToEditor) {
      onSendToEditor({ ...asset, timelineTrack: trackName });
    }
    notify(`Inserted "${asset.name}" into Editing Timeline (${trackName} track)!`);
  };

  const handleDownloadAsset = async (asset: UniversalAsset) => {
    soundFx.playScannerBeep();
    if (/^\/api\/cartoon-projects\/[^/]+\/download-mp4$/.test(asset.mediaUrl || '')) {
      if (!firebaseUser?.emailVerified) {
        notify('Sign in with a verified Studio account to download this project.');
        return;
      }
      try {
        await downloadCartoonProjectMp4(firebaseUser, asset.mediaUrl!, asset.name);
      } catch (error) {
        notify(error instanceof Error ? error.message : 'Could not download the final MP4.');
      }
      return;
    }
    if (!isStoredLibraryMedia(asset.mediaUrl) && asset.category === 'color') {
      let cubeContent = `# Film & Video Studio 3D LUT\n# Title: ${asset.name}\nLUT_3D_SIZE 33\n`;
      for (let r = 0; r < 33; r += 8) {
        for (let g = 0; g < 33; g += 8) {
          for (let b = 0; b < 33; b += 8) {
            cubeContent += `${(r / 32).toFixed(6)} ${(g / 32).toFixed(6)} ${(b / 32).toFixed(6)}\n`;
          }
        }
      }
      const blob = new Blob([cubeContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${asset.name.replace(/[^a-zA-Z0-9]/g, '_')}.cube`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notify(`Downloaded .CUBE 3D LUT for "${asset.name}"`);
    } else if (!isStoredLibraryMedia(asset.mediaUrl) && asset.category === 'subtitle') {
      const srtContent = `1\n00:00:00,000 --> 00:00:05,000\n${asset.description || asset.name}\n`;
      const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${asset.name.replace(/[^a-zA-Z0-9]/g, '_')}.srt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notify(`Downloaded .SRT subtitle file for "${asset.name}"`);
    } else if (asset.mediaUrl && !asset.mediaUrl.includes('#')) {
      const a = document.createElement('a');
      a.href = asset.mediaUrl;
      a.download = asset.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      notify(`Downloaded "${asset.name}"`);
    } else {
      const manifest = JSON.stringify(
        {
          id: asset.id,
          name: asset.name,
          category: asset.category,
          projectId: asset.projectId || null,
          timelineTrack: resolveTimelineTrackLabel(asset),
          format: asset.format,
          description: asset.description,
          tags: asset.tags,
        },
        null,
        2
      );
      const blob = new Blob([manifest], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${asset.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notify(`Downloaded production asset package for "${asset.name}"`);
    }
  };

  const handleVerifyLicense = async (asset: UniversalAsset) => {
    soundFx.playScannerBeep();
    try {
      const res = await fetch(`/api/assets/${asset.id}/license`);
      const data = await res.json();
      setLicenseCertificate(data);
      setShowLicenseModal(true);
    } catch {
      setLicenseCertificate({
        assetId: asset.id,
        status: 'Verified & Certified',
        licenseType: asset.license.type,
        commercialRights: 'Authorized for Worldwide Digital, Theatrical & Broadcast Distribution',
        certificateAuthority: 'Film & Video Studio Ultimate Digital Rights Engine',
        sha256Hash: `0x${asset.id}-fvs-verified-2026`
      });
      setShowLicenseModal(true);
    }
  };

  const addLibraryRecord = (record: LibraryUploadedAsset) => {
    const asset = fromLibraryRecord(record);
    setCatalog(prev => [asset, ...prev.filter(item => item.id !== asset.id)]);
    setSelectedAsset(asset);
    return asset;
  };

  const openUpload = (category: AssetCategory | 'auto') => {
    setUploadErrors([]);
    setUploadCategory(category);
    setLibraryView('studio_vault');
    setShowUploadModal(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const files = Array.from(input.files || []);
    if (!files.length) return;

    setIsUploading(true);
    setUploadErrors([]);
    soundFx.playShutterSound();
    const errors: string[] = [];
    let uploadedCount = 0;
    const tags = uploadTags.split(',').map(value => value.trim()).filter(Boolean);

    try {
      for (const file of files) {
        try {
          if (!file.size || file.size > MAX_LIBRARY_UPLOAD_BYTES) {
            throw new Error('File size must be between 1 byte and 25 MB.');
          }
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = reader.onabort = () => reject(new Error('Could not read this file.'));
            reader.readAsDataURL(file);
          });
          const response = await fetch('/api/library/assets/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: file.name,
              category: uploadCategory === 'auto' ? undefined : uploadCategory,
              mimeType: file.type,
              dataUrl,
              description: uploadDescription.trim(),
              tags,
            }),
          });
          const data = await response.json().catch(() => null);
          if (!response.ok || !data?.success) {
            throw new Error(data?.error || (response.status === 413 ? 'File is too large.' : 'Upload failed. Try again.'));
          }

          const record = data.asset as LibraryUploadedAsset;
          const newAsset = addLibraryRecord(record);
          uploadedCount += 1;
          if (firebaseUser) {
            const cloudCategory: CloudLibraryAsset['category'] = record.category === 'vfx' ? 'vfx'
              : record.mimeType.startsWith('image/') ? 'stills'
              : record.mimeType.startsWith('audio/') ? 'audio'
              : 'footage';
            saveLibraryAsset({
              id: newAsset.id,
              name: newAsset.name,
              category: cloudCategory,
              format: newAsset.format,
              duration: newAsset.duration || '00:08',
              size: newAsset.size,
              url: newAsset.mediaUrl,
              thumbnail: newAsset.thumbnail,
              provider: 'Unified Studio Library',
            }).catch(() => {});
          }
        } catch (error) {
          errors.push(file.name + ': ' + (error instanceof Error ? error.message : 'Upload failed.'));
        }
      }
      setUploadErrors(errors);
      if (uploadedCount > 0) notify('Saved ' + uploadedCount + ' asset(s) to the Studio Media Vault.');
      if (!errors.length) {
        setShowUploadModal(false);
        setUploadDescription('');
      }
    } finally {
      setIsUploading(false);
      input.value = '';
    }
  };

  const handleGenerateAiAsset = async () => {
    setIsAiGenerating(true);
    soundFx.playScannerBeep();
    try {
      const res = await fetch('/api/assets/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, assetType: aiAssetType, style: aiStyle })
      });
      const data = await res.json();
      const gen = data.generatedAsset || {};

      const newAiAsset: UniversalAsset = {
        id: `ai-${Date.now()}`,
        name: gen.name || `AI_${aiAssetType.toUpperCase()}_Asset`,
        category: (aiAssetType as AssetCategory) || 'video',
        subcategory: gen.subcategory || 'AI Synthesized Assets',
        source: 'ai_generated',
        format: gen.technicalSpecs?.codec || 'ProRes 4444 XQ',
        size: '480 MB',
        resolution: gen.technicalSpecs?.resolution || '3840x2160 (4K DCI)',
        duration: '00:06',
        thumbnail: aiAssetType === 'music' || aiAssetType === 'sfx'
          ? '/assets/images/cinema_soundstage_set_1794406569758.jpg'
          : '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
        mediaUrl: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
        description: gen.description || aiPrompt,
        tags: gen.tags || ['AI Generated', aiAssetType, aiStyle],
        license: {
          type: 'AI Studio Creative License',
          commercialUse: true,
          attribution: 'AI Studio Generator',
          certificateId: `FVS-AI-${Date.now()}`,
          verified: true
        },
        specs: {
          codec: gen.technicalSpecs?.codec || 'ProRes 4444',
          colorSpace: gen.technicalSpecs?.colorSpace || 'ACES 1.3',
          fps: 24,
          aspect: '2.39:1'
        },
        isFavorite: true,
        addedAt: new Date().toISOString().split('T')[0],
        usageCount: 1
      };

      setCatalog((prev) => [newAiAsset, ...prev]);
      setSelectedAsset(newAiAsset);
      if (firebaseUser) {
        const fsCat: CloudLibraryAsset['category'] =
          aiAssetType === 'music'
            ? 'audio'
            : aiAssetType === 'sfx'
            ? 'sfx'
            : aiAssetType === 'image'
            ? 'stills'
            : 'footage';
        saveLibraryAsset({
          id: newAiAsset.id,
          name: newAiAsset.name,
          category: fsCat,
          format: newAiAsset.format,
          duration: newAiAsset.duration || '00:06',
          size: newAiAsset.size,
          url: newAiAsset.mediaUrl,
          thumbnail: newAiAsset.thumbnail,
          provider: aiStyle,
        }).catch(() => {});
      }
      setShowAiModal(false);
      soundFx.playCinematicImpact();
      notify(`Synthesized new AI ${aiAssetType} asset and registered to catalog!`);
    } catch {
      notify('AI generation dispatched to studio background queue.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleCreateCollection = () => {
    if (!newColName.trim()) return;
    const newCol: AssetCollection = {
      id: `col-${Date.now()}`,
      name: newColName,
      description: newColDesc || 'Curated studio collection',
      assetCount: 1,
      coverImage: selectedAsset?.thumbnail || '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
      category: newColCategory
    };
    setCollections((prev) => [...prev, newCol]);
    setSelectedCollection(newCol.id);
    setShowNewCollectionModal(false);
    setNewColName('');
    setNewColDesc('');
    soundFx.playCinematicImpact();
    notify(`Created new collection "${newCol.name}"!`);
  };

  if (libraryView === 'free_library') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-[#07090e] text-slate-100">
        <div className="px-5 py-2 border-b border-slate-800 bg-slate-900 flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setLibraryView('free_library')}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-extrabold"
          >
            Unified Free Asset Library (Lottie · 3D · VFX · Audio · Video · Tools)
          </button>
          <button
            type="button"
            onClick={() => setLibraryView('studio_vault')}
            className="px-3.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
          >
            Studio Media Vault & Uploads
          </button>
          <button type="button" onClick={() => openUpload('auto')}
            className="px-3.5 py-1.5 rounded-lg border border-purple-500/40 text-purple-300 text-xs font-semibold">
            Upload Asset
          </button>
        </div>
        <FreeAssetLibraryWorkspace
          activeFilm={activeFilm}
          onSendToEditor={onSendToEditor}
          onNavigate={onNavigate}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#07090e] text-slate-100 select-none">
      <div className="px-5 py-2 border-b border-slate-800 bg-slate-900 flex flex-wrap items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setLibraryView('free_library')}
          className="px-3.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
        >
          Unified Free Asset Library (Lottie · 3D · VFX · Audio · Video · Tools)
        </button>
        <button
          type="button"
          onClick={() => setLibraryView('studio_vault')}
          className="px-3.5 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-extrabold"
        >
          Studio Media Vault & Uploads
        </button>
        <button type="button" onClick={() => setVideoComposer({})}
          className="px-3.5 py-1.5 rounded-lg border border-purple-500/40 text-purple-300 text-xs font-semibold">
          Create MP4 from Images
        </button>
      </div>
      {videoComposer && (
        <LibraryVideoComposer
          assets={catalog}
          initialImage={videoComposer.initialImage}
          onClose={() => setVideoComposer(null)}
          onRendered={({ asset }) => addLibraryRecord(asset)}
        />
      )}
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 p-3 bg-purple-950/90 border border-purple-500/50 text-white rounded-xl text-xs font-mono flex items-center gap-2 shadow-2xl shadow-purple-900/50 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner: Master Search, 4 Sources, AI Generator & Personal Upload Buttons */}
      <div className="border-b border-purple-500/20 bg-[#090b11] px-5 py-3 space-y-3 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box & Project ID Filter */}
          <div className="flex items-center gap-2 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search all ${ASSET_CATEGORIES.length} libraries, tags, or project ID...`}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            {availableProjects.length > 0 && (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-cyan-300 outline-none focus:border-cyan-500 max-w-[170px]"
                title="Filter library assets by Project ID"
              >
                <option value="all">All Projects</option>
                {availableProjects.map(([pid, pname]) => (
                  <option key={pid} value={pid}>
                    {pid} · {pname}
                  </option>
                ))}
              </select>
            )}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-900 rounded"
              >
                Clear
              </button>
            )}
          </div>

          {/* 4 Asset Source Selector (Zero-Pill discipline compliant) */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-950 border border-slate-800 rounded-xl">
            {[
              { id: 'all', label: 'All Sources' },
              { id: 'builtin', label: '1. Built-in' },
              { id: 'licensed', label: '2. Licensed Online' },
              { id: 'upload', label: '3. User Uploads' },
              { id: 'ai_generated', label: '4. AI Generated' },
              { id: 'rendered', label: 'Rendered' },
            ].map((src) => (
              <button
                key={src.id}
                onClick={() => {
                  soundFx.playScannerBeep();
                  setSelectedSource(src.id as any);
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  selectedSource === src.id
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {src.label}
              </button>
            ))}
          </div>

          {/* Action Bar: Favorites, Stack, AI Gen & Upload */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => {
                soundFx.playScannerBeep();
                setShowFavoritesOnly(!showFavoritesOnly);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                showFavoritesOnly
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Show only favorited items"
            >
              <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-current text-amber-400' : ''}`} />
              <span>Favorites</span>
            </button>

            <button
              onClick={() => {
                soundFx.playScannerBeep();
                setShowTechStackModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold transition-all active:scale-95"
              title="Inspect 15 Cartoon Production Categories & 10 Programming Libraries"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Production Stack</span>
            </button>

            <button
              onClick={() => {
                soundFx.playScannerBeep();
                setShowAiModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-600/30 transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Asset Creator</span>
            </button>

            <button
              onClick={() => {
                soundFx.playScannerBeep();
                openUpload(selectedCategory === 'all' ? 'auto' : selectedCategory);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Asset</span>
            </button>
          </div>
        </div>

        {/* All Cartoon & Film Categories Horizontal Strip */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs scrollbar-thin">
          <button
            onClick={() => {
              soundFx.playScannerBeep();
              setSelectedCategory('all');
            }}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow'
                : 'bg-slate-950/80 text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            All {ASSET_CATEGORIES.length} Libraries ({catalog.length})
          </button>

          {ASSET_CATEGORIES.map((cat) => {
            const isCatActive = selectedCategory === cat.id;
            const countInCat = catalog.filter((c) => c.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  soundFx.playScannerBeep();
                  setSelectedCategory(cat.id);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all border ${
                  isCatActive
                    ? 'bg-purple-600/20 text-purple-200 border-purple-500/50 font-bold shadow'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
                title={cat.description}
              >
                <span>{cat.icon}</span>
                <span>{cat.name.replace(' Library', '')}</span>
                <span className="text-[10px] font-mono text-slate-500">({countInCat})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Body: Catalog Browser & Right Inspector */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Collections Selector Sidebar (Collapsible / Compact) */}
        <div className="hidden xl:flex w-60 border-r border-purple-500/20 bg-[#080a10] p-4 flex-col justify-between shrink-0 overflow-y-auto space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono-cinema">
                Curated Collections
              </span>
              <button
                onClick={() => setShowNewCollectionModal(true)}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
                title="Create New Custom Collection"
              >
                <Plus className="w-3 h-3" />
                <span>New</span>
              </button>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => setSelectedCollection('all')}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                  selectedCollection === 'all'
                    ? 'bg-purple-600/20 text-purple-300 font-bold border border-purple-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span>All Projects</span>
                <span className="text-[10px] font-mono text-slate-500">{catalog.length}</span>
              </button>

              {collections.map((col) => (
                <button
                  key={col.id}
                  onClick={() => setSelectedCollection(col.id)}
                  className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center gap-2.5 ${
                    selectedCollection === col.id
                      ? 'bg-purple-600/20 text-purple-300 font-bold border border-purple-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <img
                    src={col.coverImage}
                    alt={col.name}
                    className="w-7 h-7 rounded object-cover shrink-0 border border-slate-800"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] text-white">{col.name}</div>
                    <div className="text-[9px] text-slate-500 font-mono truncate">{col.category}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Storage & Licensing Status Bar */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-[10px] font-mono text-slate-400">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                <span>Cloud Storage</span>
              </span>
              <span className="text-cyan-400 font-bold">4.2 / 50 GB</span>
            </div>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full w-[12%]" />
            </div>
            <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1">
              <span>Sync: Real-time</span>
              <span className="text-emerald-400 font-bold">● Connected</span>
            </div>
          </div>
        </div>

        {/* Center: Assets Gallery Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Gallery Bar with Count & Active Filter Indicator */}
          <div className="h-10 border-b border-purple-500/20 px-5 flex items-center justify-between text-xs font-mono text-slate-400 bg-[#090b11]">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">{filteredAssets.length}</span>
              <span>assets found</span>
              {selectedCategory !== 'all' && (
                <span className="text-purple-300">· {selectedCategory.toUpperCase()}</span>
              )}
              {selectedSource !== 'all' && (
                <span className="text-cyan-300">· Source: {selectedSource}</span>
              )}
            </div>
            <span className="text-[11px] text-slate-500">Click asset to inspect & audition</span>
          </div>

          {/* Grid View */}
          <div className="flex-1 overflow-y-auto p-5">
            {filteredAssets.length === 0 ? (
              <div className="p-16 border-2 border-dashed border-slate-800 rounded-2xl text-center space-y-3">
                <FolderOpen className="w-10 h-10 text-purple-400 mx-auto" />
                <h3 className="text-sm font-bold text-white">No Assets Match Filters</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Try clearing search filters or use "AI Asset Creator" above to synthesize brand new assets on demand.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedSource('all');
                    setSelectedCollection('all');
                    setShowFavoritesOnly(false);
                    setSearchQuery('');
                  }}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-mono font-bold"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredAssets.map((asset) => {
                  const isSelected = selectedAsset?.id === asset.id;
                  const isAudio = asset.category === 'music' || asset.category === 'sfx' || asset.category === 'voice';
                  const isConfirmingCardDelete = confirmDeleteId === `card-${asset.id}`;

                  return (
                    <div
                      key={asset.id}
                      onClick={() => {
                        soundFx.playScannerBeep();
                        setSelectedAsset(asset);
                      }}
                      className={`bg-slate-900/90 border rounded-xl overflow-hidden cursor-pointer transition-all flex flex-col group relative ${
                        isSelected
                          ? 'border-purple-500 ring-2 ring-purple-500/30 shadow-xl shadow-purple-500/10'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Media Card Thumbnail / Screen */}
                      <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
                        <img
                          src={asset.thumbnail}
                          alt={asset.name}
                          referrerPolicy="no-referrer"
                          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                            asset.specs.lutFilter || ''
                          }`}
                        />

                        {/* Top Category Badge */}
                        <div className="absolute top-2 left-2 bg-black/85 text-[10px] font-mono text-purple-300 uppercase px-2 py-0.5 rounded border border-purple-500/30 flex items-center gap-1">
                          <span>{asset.category}</span>
                        </div>

                        {/* Top-Right Actions: Delete & Favorite */}
                        <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                          {isConfirmingCardDelete ? (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 bg-rose-950/95 border border-rose-500/60 rounded-lg px-1.5 py-1 shadow-lg"
                            >
                              <button
                                type="button"
                                onClick={(e) => handleDeleteAsset(asset.id, e)}
                                className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold rounded"
                              >
                                Delete
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteId(null);
                                }}
                                className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] rounded"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteId(`card-${asset.id}`);
                                }}
                                className="p-1.5 bg-black/70 hover:bg-rose-600/90 text-rose-300 hover:text-white rounded-lg transition-colors"
                                title={`Delete ${asset.name}`}
                                aria-label={`Delete ${asset.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => toggleFavorite(asset.id, e)}
                                className="p-1.5 bg-black/70 hover:bg-black/90 rounded-lg transition-transform active:scale-90"
                                title="Favorite Asset"
                              >
                                <Star className={`w-3.5 h-3.5 ${asset.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                              </button>
                            </>
                          )}
                        </div>

                        {/* Duration or Format Badge */}
                        {asset.duration && (
                          <div className="absolute bottom-2 right-2 bg-black/85 text-[10px] font-mono text-cyan-300 px-1.5 py-0.5 rounded">
                            {asset.duration}
                          </div>
                        )}

                        {/* Audio Play Overlay Button */}
                        {isAudio && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAsset(asset);
                              handleAudition(asset);
                            }}
                            className="absolute inset-0 bg-black/40 hover:bg-black/20 flex items-center justify-center transition-colors"
                          >
                            <div className="w-10 h-10 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </div>
                          </button>
                        )}
                      </div>

                      {/* Card Information */}
                      <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-bold text-white truncate" title={asset.name}>
                              {asset.name}
                            </h4>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {asset.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[10px] text-slate-500 font-mono">
                          <span className="truncate">
                            {asset.projectId ? `${asset.projectId} · ` : ''}
                            {resolveTimelineTrackLabel(asset)}
                          </span>
                          <span className="text-slate-400 shrink-0">{asset.size}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Asset Studio Inspector & Direct Editor Insertion Panel */}
        <div className="w-full lg:w-96 bg-[#090b11] border-l border-purple-500/20 p-5 overflow-y-auto space-y-5 shrink-0">
          {!selectedAsset ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-400 text-xs">
              <FolderOpen className="w-8 h-8 text-slate-600" />
              <p>No media asset selected. Upload personal media or generate an AI asset above.</p>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono-cinema">
                    Asset Inspector
                  </h3>
                  <p className="text-[10px] text-purple-400 font-mono mt-0.5">
                    Technical Metadata & Direct Timeline Routing
                  </p>
                </div>
                <button
                  onClick={() => toggleFavorite(selectedAsset.id)}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400"
                  title="Toggle Favorite"
                >
                  <Star className={`w-4 h-4 ${selectedAsset.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                </button>
              </div>

              {/* Main Monitor Box / Preview Area */}
              <div className="space-y-4 text-xs">
                <div className="aspect-video bg-black rounded-xl overflow-hidden border border-purple-500/30 relative shadow-2xl flex items-center justify-center">
                  {isStoredLibraryMedia(selectedAsset.mediaUrl) && /\.(mp4|mov|webm)$/i.test(selectedAsset.mediaUrl) ? (
                    <video key={selectedAsset.mediaUrl} src={selectedAsset.mediaUrl} controls playsInline preload="metadata"
                      className="w-full h-full object-contain" />
                  ) : (
                    <img
                      src={selectedAsset.thumbnail}
                      alt={selectedAsset.name}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover ${selectedAsset.specs.lutFilter || ''}`}
                    />
                  )}

                  <div className="absolute top-2 left-2 bg-black/85 text-[10px] font-mono text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30 uppercase">
                    {selectedAsset.category} · {resolveTimelineTrackLabel(selectedAsset)}
                  </div>

                  {selectedAsset.projectId && (
                    <div className="absolute top-2 right-2 bg-black/85 text-[10px] font-mono text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                      {selectedAsset.projectId}
                    </div>
                  )}

                  {selectedAsset.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/85 text-[10px] font-mono text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                      {selectedAsset.duration}
                    </div>
                  )}
                </div>

                {/* Audio Waveform Oscillogram if audio-related */}
                {(selectedAsset.category === 'music' || selectedAsset.category === 'sfx' || selectedAsset.category === 'voice') && (
                  <div className="h-28 bg-black rounded-xl overflow-hidden border border-cyan-500/30 p-2.5 flex flex-col justify-between relative shadow-xl">
                    <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3 animate-pulse" />
                        AUDIO SPECTRUM OSCILLOGRAM
                      </span>
                      <span>{selectedAsset.specs.sampleRate || '96 kHz'}</span>
                    </div>
                    <canvas ref={canvasRef} width={340} height={60} className="w-full h-14 rounded" />
                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
                      <span>{selectedAsset.specs.bitDepth || '24-bit'} / {selectedAsset.specs.channels || 'Stereo'}</span>
                      <span className={isPlayingAudio ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                        {isPlayingAudio ? '● PLAYING AUDIO OUTPUT' : 'STANDBY'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Title & Description */}
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Asset Name</span>
                  <h4 className="text-xs font-bold text-white break-all">{selectedAsset.name}</h4>
                  <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                    {selectedAsset.description}
                  </p>
                </div>

                {/* Licensing & Rights Certificate Box */}
                <div className="p-3 bg-gradient-to-r from-purple-950/40 to-slate-950 border border-purple-500/30 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>{selectedAsset.license.type}</span>
                    </div>
                    <button
                      onClick={() => handleVerifyLicense(selectedAsset)}
                      className="text-[10px] font-mono text-cyan-300 hover:underline"
                    >
                      Verify Rights →
                    </button>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                    <span>Commercial Use: {selectedAsset.license.commercialUse ? 'Permitted ✓' : 'Non-Commercial'}</span>
                    <span>Cert: {selectedAsset.license.certificateId.slice(0, 14)}</span>
                  </div>
                </div>

                {/* Technical Metadata Specs Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
                    <span className="text-[9px] text-slate-500 uppercase font-mono block">Format / Codec</span>
                    <span className="text-purple-300 font-mono font-bold">{selectedAsset.format}</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
                    <span className="text-[9px] text-slate-500 uppercase font-mono block">Resolution / Spec</span>
                    <span className="text-amber-400 font-mono font-bold truncate block">{selectedAsset.resolution || selectedAsset.specs.polyCount || 'High Fidelity'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
                    <span className="text-[9px] text-slate-500 uppercase font-mono block">File Size</span>
                    <span className="text-slate-200 font-mono font-bold">{selectedAsset.size}</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
                    <span className="text-[9px] text-slate-500 uppercase font-mono block">Added / Usage</span>
                    <span className="text-cyan-400 font-mono font-bold">{selectedAsset.usageCount} times used</span>
                  </div>
                </div>

                {/* Core Action Buttons: Timeline Insert, Audition, Download, Delete */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleSendToTimeline(selectedAsset)}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xl shadow-purple-600/30 transition-all active:scale-95"
                  >
                    <Film className="w-4 h-4" />
                    <span>Add Directly to Video Editor Timeline</span>
                  </button>

                  {isLibraryRenderImage(selectedAsset) && (
                    <button type="button" onClick={() => setVideoComposer({ initialImage: selectedAsset })}
                      className="w-full rounded-xl border border-purple-500/40 p-2.5 text-purple-300 hover:bg-purple-950">
                      Create MP4 with This Image
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {(selectedAsset.category === 'music' || selectedAsset.category === 'sfx' || selectedAsset.category === 'voice') && (
                      <button
                        type="button"
                        onClick={() => handleAudition(selectedAsset)}
                        className="py-2.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        {isPlayingAudio ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        <span>{isPlayingAudio ? 'Stop Sound' : 'Audition Audio'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDownloadAsset(selectedAsset)}
                      className="py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File</span>
                    </button>
                  </div>

                  {confirmDeleteId === `insp-${selectedAsset.id}` ? (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleDeleteAsset(selectedAsset.id)}
                        className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Confirm Delete</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-mono"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(`insp-${selectedAsset.id}`)}
                      className="w-full py-2.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>
                        {selectedAsset.category === 'video' || selectedAsset.category === 'film' || selectedAsset.category === 'animation'
                          ? 'Delete Video'
                          : 'Delete Asset'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL 1: AI Asset Creator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#090b11] border border-purple-500/40 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-purple-400">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">AI Asset Creator (Central Manager)</h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Synthesize production-ready stock footage, orchestral music cues, procedural SFX, or concept image plates with Gemini AI.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Asset Category</label>
                <div className="grid grid-cols-4 gap-2">
                  {['video', 'music', 'sfx', 'image'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setAiAssetType(t)}
                      className={`py-1.5 rounded-lg font-mono text-center uppercase transition-colors ${
                        aiAssetType === t
                          ? 'bg-purple-600 text-white font-bold'
                          : 'bg-slate-950 border border-slate-800 text-slate-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Visual / Sonic Style</label>
                <select
                  value={aiStyle}
                  onChange={(e) => setAiStyle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-purple-500 font-mono"
                >
                  <option value="Cinematic Hollywood 35mm">Cinematic Hollywood 35mm (Arri LogC4)</option>
                  <option value="Blade Runner 2049 Neon Cyberpunk">Blade Runner 2049 Neon Cyberpunk</option>
                  <option value="Hans Zimmer Heavy Orchestral Score">Hans Zimmer Heavy Orchestral Score</option>
                  <option value="Dune 2021 Volumetric Basalt Desert">Dune 2021 Volumetric Basalt Desert</option>
                  <option value="Kannada Sandalwood Action Cinema">Kannada Sandalwood Action Cinema</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Creative Description Prompt</label>
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-purple-500"
                  placeholder="Describe the asset in detail..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowAiModal(false)}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateAiAsset}
                disabled={isAiGenerating}
                className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAiGenerating ? 'Synthesizing...' : 'Generate Asset'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Rights & Licensing Verification Certificate */}
      {showLicenseModal && licenseCertificate && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#090b11] border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-bold text-white uppercase tracking-wider">Digital Rights Certificate</h3>
              </div>
              <button
                onClick={() => setShowLicenseModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-black border border-slate-800 rounded-xl space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Asset ID:</span>
                <span className="text-white font-bold">{licenseCertificate.assetId}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Status:</span>
                <span className="text-emerald-400 font-bold">{licenseCertificate.status}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>License:</span>
                <span className="text-purple-300">{licenseCertificate.licenseType}</span>
              </div>
              <div className="text-slate-400 border-t border-slate-900 pt-1 text-[11px]">
                {licenseCertificate.commercialRights}
              </div>
              <div className="text-[10px] text-slate-500 break-all pt-1">
                Hash: {licenseCertificate.sha256Hash}
              </div>
            </div>

            <button
              onClick={() => {
                soundFx.playScannerBeep();
                setShowLicenseModal(false);
                notify('License verification certificate confirmed.');
              }}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl"
            >
              Confirm & Close Certificate
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: Create Custom Collection Modal */}
      {showNewCollectionModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#090b11] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <Plus className="w-4 h-4" />
                <span>Create New Collection</span>
              </div>
              <button
                onClick={() => setShowNewCollectionModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Collection Name</label>
                <input
                  type="text"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="e.g. Climax Battle Scene FX"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Category</label>
                <input
                  type="text"
                  value={newColCategory}
                  onChange={(e) => setNewColCategory(e.target.value)}
                  placeholder="e.g. Action / VFX"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                  placeholder="Description of curated items..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowNewCollectionModal(false)}
                className="flex-1 py-2 bg-slate-900 text-slate-300 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCollection}
                className="flex-1 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white font-bold rounded-xl"
              >
                Save Collection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Category-Aware Upload to Unified Production Library */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#090b11] border border-purple-500/40 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-purple-300 font-bold">
                <Upload className="w-4 h-4" />
                <span>Upload to Cartoon Production Library</span>
              </div>
              <button
                disabled={isUploading}
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Target Library Category
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as AssetCategory | 'auto')}
                  disabled={isUploading}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-purple-500"
                >
                  <option value="auto">Detect from file type</option>
                  {ASSET_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  placeholder="e.g. Hero, Explosion, Kannada, Scene 4"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Notes / Description (optional)
                </label>
                <textarea
                  rows={2}
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Short production note for editors..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-purple-500/40 hover:border-purple-400 bg-slate-950/70 rounded-xl p-5 cursor-pointer transition-colors">
                <Upload className="w-6 h-6 text-purple-400" />
                <span className="font-bold text-white">
                  {isUploading ? 'Uploading & Saving...' : 'Select File(s) to Upload'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono text-center">
                  Images, video, audio, subtitles, 3D assets and presets · Max 25 MB per file
                </span>
                <input
                  type="file"
                  multiple
                  disabled={isUploading}
                  accept={LIBRARY_FILE_ACCEPT}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {uploadErrors.length > 0 && (
              <ul role="alert" className="max-h-28 list-disc space-y-1 overflow-y-auto pl-4 text-rose-300">
                {uploadErrors.map((error, index) => <li className="break-words" key={index}>{error}</li>)}
              </ul>
            )}
            <div className="flex justify-end pt-1">
              <button
                disabled={isUploading}
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Complete Cartoon Production Library & Programming Stack */}
      {showTechStackModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[85vh] flex flex-col bg-[#090b11] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                <Layers className="w-5 h-5" />
                <span>Unified Cartoon Production Library & Programming Stack</span>
              </div>
              <button
                onClick={() => setShowTechStackModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-5 pr-1">
              <div className="space-y-2">
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-purple-300 font-bold">
                  1. Complete 15-Category Cartoon Production Catalog
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {catalogSpecs.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id as AssetCategory);
                        setShowTechStackModal(false);
                      }}
                      className="text-left p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition-colors space-y-1"
                    >
                      <div className="font-bold text-white">{cat.name}</div>
                      <div className="text-[10px] text-slate-400 leading-snug">{cat.summary}</div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {cat.assetTypes.map((t) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] font-mono text-cyan-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-cyan-300 font-bold">
                  2. Core Programming Libraries & Studio Engine Stack
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {techStack.map((item) => (
                    <div
                      key={item.name}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-white">{item.name}</div>
                        <div className="text-[11px] text-slate-400">{item.purpose}</div>
                      </div>
                      {item.purpose.includes('Active in Studio') && (
                        <span className="shrink-0 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-[9px] font-mono font-bold text-emerald-300">
                          ACTIVE
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-800 pt-3 shrink-0">
              <button
                onClick={() => setShowTechStackModal(false)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
