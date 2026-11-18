import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  UserCircle2,
  Mountain,
  BookOpen,
  Film,
  RefreshCw,
  Wand2,
  Scissors,
  Maximize2,
  FolderOpen,
  Settings,
  Download,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clapperboard,
  Mic2,
  LayoutGrid,
  Play,
  Search,
  Layers,
  Clock,
  Sliders,
} from 'lucide-react';
import { FilmProject, StudioModule, StudioTheme } from '../../types';
import { useStudioAi } from '../../context/StudioAiContext';
import { soundFx } from '../../utils/audioSynth';

type ImageStudioSection =
  | 'overview'
  | 'generate_image'
  | 'generate_character'
  | 'generate_background'
  | 'generate_manhwa'
  | 'generate_film_scene'
  | 'image_to_image'
  | 'ai_editing'
  | 'remove_background'
  | 'upscale'
  | 'recent_images'
  | 'saved_images'
  | 'project_images'
  | 'settings';

type ImageFolder =
  | 'All'
  | 'Characters'
  | 'Backgrounds'
  | 'Manhwa'
  | 'Anime'
  | 'Film Scenes'
  | 'Posters'
  | 'Thumbnails'
  | 'Edited Images';

interface GeneratedImageRecord {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  prompt: string;
  provider: string;
  mode: string;
  folder: Exclude<ImageFolder, 'All'>;
  style: string;
  aspectRatio: string;
  resolution: string;
  width: number;
  height: number;
  quality: string;
  url: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  status: string;
  libraryAssetId?: string;
  characterId?: string;
  characterName?: string;
  editOperation?: string;
  createdAt: string;
}

interface SavedCharacterIdentity {
  id: string;
  projectId: string;
  name: string;
  description: string;
  hair: string;
  clothes: string;
  eyes: string;
  skin: string;
  expression: string;
  pose: string;
  cameraAngle: string;
  style: string;
  referenceImageUrl?: string;
  latestImageUrl: string;
  identitySeed: number;
  createdAt: string;
}

interface ProviderStatusMap {
  openai: { configured: boolean; label: string; envVar: string };
  stability: { configured: boolean; label: string; envVar: string };
  flux: { configured: boolean; label: string; envVar: string };
  studio_builtin: { configured: boolean; label: string; envVar: string };
}

interface AiImageGeneratorProps {
  activeFilm: FilmProject;
  theme?: StudioTheme;
  onSendToStoryboard?: (imageUrl: string) => void;
  onNavigate?: (module: StudioModule) => void;
}

const IMAGE_STYLES = ['Realistic', 'Anime', 'Manhwa', '3D', 'Cartoon', 'Cinematic'];
const ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3'];
const RESOLUTIONS = ['512px', '1024px', '2K', '4K'];
const LIBRARY_FOLDERS: ImageFolder[] = [
  'All',
  'Characters',
  'Backgrounds',
  'Manhwa',
  'Anime',
  'Film Scenes',
  'Posters',
  'Thumbnails',
  'Edited Images',
];

const EXAMPLE_PROMPTS = [
  'A young anime hero standing on a mountain, cinematic lighting, detailed face, realistic anime style, 4K quality, dramatic sky, professional composition.',
  'Korean manhwa action panel, glowing sword slash through dark stormy temple, dramatic speed lines, vibrant full-color webtoon shading.',
  'Enchanted village nestled in misty emerald mountains at golden hour, warm lantern glow, 3D animated movie background plate.',
  'Epic sci-fi movie poster, lone explorer facing a cosmic portal above obsidian cliffs, teal and amber rim lighting, theatrical composition.',
];

export const AiImageGenerator: React.FC<AiImageGeneratorProps> = ({
  activeFilm,
  theme = 'elevenlabs',
  onSendToStoryboard,
  onNavigate,
}) => {
  const { addAssetToTimeline } = useStudioAi();
  const isLight = theme === 'elevenlabs';

  const [section, setSection] = useState<ImageStudioSection>('overview');
  const [images, setImages] = useState<GeneratedImageRecord[]>([]);
  const [characters, setCharacters] = useState<SavedCharacterIdentity[]>([]);
  const [providers, setProviders] = useState<ProviderStatusMap | null>(null);
  const [selectedImage, setSelectedImage] = useState<GeneratedImageRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [noticeMsg, setNoticeMsg] = useState('');

  // Shared Settings
  const [provider, setProvider] = useState<'auto' | 'openai' | 'stability' | 'flux' | 'studio_builtin'>('auto');
  const [defaultQuality, setDefaultQuality] = useState('High Detail');
  const [defaultResolution, setDefaultResolution] = useState('1024px');

  // Text-to-Image / Film Scene state
  const [prompt, setPrompt] = useState(EXAMPLE_PROMPTS[0]);
  const [style, setStyle] = useState('Anime');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resolution, setResolution] = useState('1024px');
  const [imageCount, setImageCount] = useState(1);
  const [quality, setQuality] = useState('High Detail');
  const [sceneOutputKind, setSceneOutputKind] = useState<'Film Scenes' | 'Posters' | 'Thumbnails'>('Film Scenes');
  const [cinemaLens, setCinemaLens] = useState('35mm Anamorphic T1.9');
  const [lightingMood, setLightingMood] = useState('Dramatic Cinematic Rim Lighting');

  // Character Studio state
  const [activeCharId, setActiveCharId] = useState<string>('');
  const [charName, setCharName] = useState('Arjun');
  const [charDesc, setCharDesc] = useState('Courageous young protagonist from an animated fantasy film');
  const [charHair, setCharHair] = useState('Spiky dark black hair with wind movement');
  const [charClothes, setCharClothes] = useState('Navy explorer jacket with gold trim and scarf');
  const [charEyes, setCharEyes] = useState('Bright amber expressive eyes');
  const [charSkin, setCharSkin] = useState('Warm sunlit skin tone');
  const [charExpression, setCharExpression] = useState('Determined');
  const [charPose, setCharPose] = useState('Heroic standing three-quarter pose');
  const [charAngle, setCharAngle] = useState('Medium portrait');
  const [charStyle, setCharStyle] = useState('Anime');
  const [charRefDataUrl, setCharRefDataUrl] = useState('');
  const [saveCharIdentity, setSaveCharIdentity] = useState(true);

  // Manhwa Studio state
  const [manhwaPrompt, setManhwaPrompt] = useState(
    'Dramatic close-up of a young swordsman awakening glowing aura in a ruined courtyard, sharp Korean manhwa line art'
  );
  const [manhwaStyle, setManhwaStyle] = useState('Korean Manhwa (Full-Color)');
  const [manhwaLayout, setManhwaLayout] = useState('Action Panel (Single)');
  const [manhwaEmotion, setManhwaEmotion] = useState('Intense Determination');

  // Background Generator state
  const [bgLocation, setBgLocation] = useState('Mountains and Forests');
  const [bgTime, setBgTime] = useState('Golden Hour');
  const [bgWeather, setBgWeather] = useState('Misty clouds & sunbeams');
  const [bgPrompt, setBgPrompt] = useState('Ancient stone path winding through towering pine forests with distant waterfalls');
  const [bgStyle, setBgStyle] = useState('Anime');

  // Image Tools state (Img2Img, Edit, Remove BG, Upscale)
  const [toolSourceImage, setToolSourceImage] = useState('');
  const [img2imgType, setImg2imgType] = useState('Change Image Style');
  const [img2imgStyle, setImg2imgStyle] = useState('Manhwa');
  const [img2imgStrength, setImg2imgStrength] = useState(0.65);
  const [img2imgPrompt, setImg2imgPrompt] = useState('Transform into vibrant Korean manhwa style with dramatic sunset lighting');

  const [editOperation, setEditOperation] = useState<
    'remove_object' | 'replace_background' | 'expand_image' | 'inpaint' | 'change_colors' | 'add_object'
  >('replace_background');
  const [editPrompt, setEditPrompt] = useState('Replace background with a glowing futuristic city skyline at night');
  const [colorShift, setColorShift] = useState(35);

  const [upscaleFactor, setUpscaleFactor] = useState<'2x' | '4x'>('2x');
  const [upscaleTarget, setUpscaleTarget] = useState<'2K' | '4K'>('2K');
  const [enhanceDetail, setEnhanceDetail] = useState(true);

  // My Images Filters
  const [folderFilter, setFolderFilter] = useState<ImageFolder>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const charRefInputRef = useRef<HTMLInputElement | null>(null);

  const showNotice = (msg: string) => {
    setNoticeMsg(msg);
    setTimeout(() => setNoticeMsg(''), 4000);
  };

  const fetchLibrary = async () => {
    try {
      const res = await fetch('/api/images/library');
      const data = await res.json();
      if (data.success) {
        setImages(data.images || []);
        setCharacters(data.characters || []);
        if (data.providers) setProviders(data.providers);
        if (!selectedImage && data.images?.length > 0) {
          setSelectedImage(data.images[0]);
        }
      }
    } catch {
      // ignore initial load error
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, []);

  const handleFileToDataUrl = (file: File, onReady: (dataUrl: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onReady(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateTextToImage = async (customOpts?: {
    overridePrompt?: string;
    overrideStyle?: string;
    overrideFolder?: Exclude<ImageFolder, 'All'>;
    overrideMode?: string;
    titlePrefix?: string;
  }) => {
    setIsLoading(true);
    setErrorMsg('');
    soundFx.playScannerBeep();
    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: customOpts?.overridePrompt || prompt,
          style: customOpts?.overrideStyle || style,
          aspectRatio,
          resolution,
          count: imageCount,
          quality,
          folder: customOpts?.overrideFolder,
          mode: customOpts?.overrideMode || 'text_to_image',
          provider,
          projectId: activeFilm.id,
          projectName: activeFilm.title,
          titlePrefix: customOpts?.titlePrefix,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Image generation failed.');
      }
      soundFx.playCinematicImpact();
      const created: GeneratedImageRecord[] = data.images || [];
      setImages((prev) => [...created, ...prev]);
      if (created[0]) setSelectedImage(created[0]);
      if (data.providers) setProviders(data.providers);
      showNotice(`Generated ${created.length} image(s) and auto-saved to Media Library.`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Image generation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCharacter = async () => {
    setIsLoading(true);
    setErrorMsg('');
    soundFx.playScannerBeep();
    try {
      const res = await fetch('/api/images/character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: activeCharId || undefined,
          name: charName,
          description: charDesc,
          hair: charHair,
          clothes: charClothes,
          eyes: charEyes,
          skin: charSkin,
          expression: charExpression,
          pose: charPose,
          cameraAngle: charAngle,
          style: charStyle,
          aspectRatio: '1:1',
          resolution,
          provider,
          referenceImageDataUrl: charRefDataUrl || undefined,
          saveIdentity: saveCharIdentity,
          projectId: activeFilm.id,
          projectName: activeFilm.title,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Character generation failed.');
      soundFx.playCinematicImpact();
      if (data.image) {
        setImages((prev) => [data.image, ...prev]);
        setSelectedImage(data.image);
      }
      if (data.character) {
        setActiveCharId(data.character.id);
        setCharacters((prev) => {
          const filtered = prev.filter((c) => c.id !== data.character.id);
          return [data.character, ...filtered];
        });
      }
      showNotice(`Character "${charName}" generated & saved to Media Library/Images/Characters.`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Character generation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateBackground = async () => {
    setIsLoading(true);
    setErrorMsg('');
    soundFx.playScannerBeep();
    try {
      const res = await fetch('/api/images/background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: bgPrompt,
          locationType: bgLocation,
          timeOfDay: bgTime,
          weather: bgWeather,
          style: bgStyle,
          aspectRatio: '16:9',
          resolution,
          provider,
          projectId: activeFilm.id,
          projectName: activeFilm.title,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Background generation failed.');
      soundFx.playCinematicImpact();
      if (data.image) {
        setImages((prev) => [data.image, ...prev]);
        setSelectedImage(data.image);
      }
      showNotice('Background plate generated & saved to Media Library/Images/Backgrounds.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Background generation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageToImage = async () => {
    const src = toolSourceImage || selectedImage?.url || '';
    if (!src) {
      setErrorMsg('Upload an image or select one from your gallery first.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    soundFx.playScannerBeep();
    try {
      const res = await fetch('/api/images/image-to-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceImageDataUrl: src,
          prompt: img2imgPrompt,
          transformType: img2imgType,
          style: img2imgStyle,
          strength: img2imgStrength,
          aspectRatio,
          resolution,
          projectId: activeFilm.id,
          projectName: activeFilm.title,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Image-to-Image failed.');
      soundFx.playCinematicImpact();
      if (data.image) {
        setImages((prev) => [data.image, ...prev]);
        setSelectedImage(data.image);
      }
      showNotice('Transformed image saved to Media Library/Images/Edited Images.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Image-to-Image failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditImage = async (overrideOp?: 'remove_background') => {
    const src = toolSourceImage || selectedImage?.url || '';
    if (!src) {
      setErrorMsg('Upload an image or select one from your gallery first.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    soundFx.playScannerBeep();
    try {
      const op = overrideOp || editOperation;
      const res = await fetch('/api/images/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceImageDataUrl: src,
          operation: op,
          prompt: overrideOp === 'remove_background' ? 'Remove background cleanly to transparent PNG' : editPrompt,
          colorShift,
          projectId: activeFilm.id,
          projectName: activeFilm.title,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'AI edit failed.');
      soundFx.playCinematicImpact();
      if (data.image) {
        setImages((prev) => [data.image, ...prev]);
        setSelectedImage(data.image);
      }
      showNotice(
        overrideOp === 'remove_background'
          ? 'Background removed & transparent PNG saved to Media Library.'
          : 'Edited image saved to Media Library/Images/Edited Images.'
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'AI edit failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpscaleImage = async () => {
    const src = toolSourceImage || selectedImage?.url || '';
    if (!src) {
      setErrorMsg('Upload an image or select one from your gallery first.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    soundFx.playScannerBeep();
    try {
      const res = await fetch('/api/images/upscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceImageDataUrl: src,
          scaleFactor: upscaleFactor,
          targetResolution: upscaleTarget,
          enhanceDetail,
          projectId: activeFilm.id,
          projectName: activeFilm.title,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Upscaling failed.');
      soundFx.playCinematicImpact();
      if (data.image) {
        setImages((prev) => [data.image, ...prev]);
        setSelectedImage(data.image);
      }
      showNotice(`Upscaled to ${upscaleTarget} & saved to Media Library.`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Upscaling failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteImage = async (id: string) => {
    soundFx.playWhoosh();
    await fetch(`/api/images/${encodeURIComponent(id)}`, { method: 'DELETE' });
    setImages((prev) => {
      const next = prev.filter((img) => img.id !== id);
      if (selectedImage?.id === id) setSelectedImage(next[0] || null);
      return next;
    });
    showNotice('Image deleted from AI Image Studio & Media Library.');
  };

  const handleAddToTimeline = (img: GeneratedImageRecord) => {
    soundFx.playShutterSound();
    addAssetToTimeline({
      id: img.libraryAssetId || img.id,
      name: img.title,
      category: img.folder === 'Characters' ? 'character' : img.folder === 'Backgrounds' ? 'background' : 'image',
      subcategory: `Images / ${img.folder}`,
      source: 'ai_generated',
      format: 'PNG',
      size: `${Math.max(1, Math.round(img.sizeBytes / 1024))} KB`,
      thumbnail: img.url,
      url: img.url,
      description: img.prompt,
      tags: ['AI Image Studio', img.folder, img.style],
      addedAt: img.createdAt.split('T')[0],
      projectId: img.projectId,
      projectName: img.projectName,
      timelineTrack: img.folder === 'Characters' ? 'Character / Image' : 'Image',
    } as any);
    showNotice(`Added "${img.title}" to Timeline Editor.`);
    if (onNavigate) onNavigate('editor');
  };

  const handleSendToModule = (mod: StudioModule, img: GeneratedImageRecord, label: string) => {
    soundFx.playShutterSound();
    try {
      localStorage.setItem(
        'fvs_last_ai_image_handoff',
        JSON.stringify({ id: img.id, title: img.title, url: img.url, prompt: img.prompt, folder: img.folder })
      );
    } catch {
      // ignore storage error
    }
    showNotice(`Sent "${img.title}" to ${label}.`);
    if (mod === 'storyboard' && onSendToStoryboard) {
      onSendToStoryboard(img.url);
    } else if (onNavigate) {
      onNavigate(mod);
    }
  };

  const filteredImages = useMemo(() => {
    return images.filter((img) => {
      if (section === 'project_images' && img.projectId !== activeFilm.id) return false;
      if (section === 'saved_images' && folderFilter !== 'All' && img.folder !== folderFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = `${img.title} ${img.prompt} ${img.folder} ${img.style} ${img.provider}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [images, section, folderFilter, searchQuery, activeFilm.id]);

  // Theme tokens
  const surfaceBg = isLight ? 'bg-white text-neutral-900' : 'bg-[#090b11] text-slate-100';
  const sidebarBg = isLight ? 'bg-[#FAFAFB] border-neutral-200' : 'bg-[#0d111c] border-slate-800';
  const cardBg = isLight ? 'bg-white border-neutral-200' : 'bg-[#111625] border-slate-800';
  const inputBg = isLight
    ? 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-neutral-900'
    : 'bg-slate-950 border-slate-800 text-white focus:border-purple-500';
  const mutedText = isLight ? 'text-neutral-500' : 'text-slate-400';

  const navGroups: Array<{
    title: string;
    items: Array<{ id: ImageStudioSection; label: string; icon: React.ElementType }>;
  }> = [
    {
      title: 'Dashboard',
      items: [
        { id: 'overview', label: 'Studio Overview', icon: LayoutGrid },
        { id: 'generate_image', label: 'Generate Image', icon: Sparkles },
        { id: 'generate_character', label: 'Generate Character', icon: UserCircle2 },
        { id: 'generate_background', label: 'Generate Background', icon: Mountain },
        { id: 'generate_manhwa', label: 'Generate Manhwa', icon: BookOpen },
        { id: 'generate_film_scene', label: 'Generate Film Scene', icon: Film },
      ],
    },
    {
      title: 'Image Tools',
      items: [
        { id: 'image_to_image', label: 'Image-to-Image', icon: RefreshCw },
        { id: 'ai_editing', label: 'AI Image Editing', icon: Wand2 },
        { id: 'remove_background', label: 'Background Removal', icon: Scissors },
        { id: 'upscale', label: 'Image Upscaling', icon: Maximize2 },
      ],
    },
    {
      title: 'My Images',
      items: [
        { id: 'recent_images', label: 'Recent Images', icon: Clock },
        { id: 'saved_images', label: 'Saved Images', icon: FolderOpen },
        { id: 'project_images', label: 'Project Images', icon: Layers },
      ],
    },
    {
      title: 'Settings',
      items: [{ id: 'settings', label: 'Providers & Quality', icon: Settings }],
    },
  ];

  const overviewCards: Array<{
    id: ImageStudioSection;
    title: string;
    desc: string;
    icon: React.ElementType;
    accent: string;
  }> = [
    { id: 'generate_image', title: 'Generate Image', desc: 'Text-to-Image in Realistic, Anime, Manhwa, 3D, Cartoon & Cinematic.', icon: Sparkles, accent: 'text-purple-500' },
    { id: 'generate_character', title: 'Generate Character', desc: 'Consistent characters with hair, outfit, eyes, pose & saved identity.', icon: UserCircle2, accent: 'text-indigo-500' },
    { id: 'generate_background', title: 'Generate Background', desc: 'Cities, forests, rooms, fantasy worlds & day/night film plates.', icon: Mountain, accent: 'text-emerald-500' },
    { id: 'generate_manhwa', title: 'Generate Anime / Manhwa', desc: 'Korean full-color webtoon & Japanese B&W manga comic panels.', icon: BookOpen, accent: 'text-rose-500' },
    { id: 'generate_film_scene', title: 'Generate Film Scene', desc: 'Cinematic shots, movie posters & high-CTR thumbnails.', icon: Film, accent: 'text-amber-500' },
    { id: 'image_to_image', title: 'Image-to-Image', desc: 'Upload an image and restyle clothes, lighting, pose or mood.', icon: RefreshCw, accent: 'text-cyan-500' },
    { id: 'ai_editing', title: 'Image Editing', desc: 'Remove objects, replace backgrounds, expand, inpaint & recolor.', icon: Wand2, accent: 'text-violet-500' },
    { id: 'upscale', title: 'Image Upscaling', desc: 'Super-resolution 2x / 4x upscaling to crisp 2K and 4K masters.', icon: Maximize2, accent: 'text-sky-500' },
    { id: 'remove_background', title: 'Remove Background', desc: 'One-click transparent PNG cutout for compositing & overlays.', icon: Scissors, accent: 'text-pink-500' },
    { id: 'saved_images', title: 'My Generated Images', desc: `Browse all ${images.length} saved images organized by Media Library folder.`, icon: FolderOpen, accent: 'text-teal-500' },
  ];

  const renderPreviewPanel = () => (
    <div className={`w-full xl:w-[390px] border-l p-5 overflow-y-auto shrink-0 space-y-4 ${sidebarBg}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider">Preview & Studio Handoff</h3>
          <p className={`text-[11px] ${mutedText}`}>Auto-synced with Unified Media Library</p>
        </div>
        {selectedImage && (
          <a
            href={selectedImage.url}
            download={`${selectedImage.title.replace(/[^\w-]+/g, '_')}.png`}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${
              isLight
                ? 'bg-white border-neutral-200 hover:bg-neutral-100 text-neutral-800'
                : 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>PNG</span>
          </a>
        )}
      </div>

      {selectedImage ? (
        <>
          <div className="relative rounded-xl overflow-hidden border border-purple-500/30 bg-black aspect-video flex items-center justify-center">
            <img
              src={selectedImage.url}
              alt={selectedImage.title}
              className="w-full h-full object-contain"
            />
            {isLoading && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-[11px] font-mono text-white">PROCESSING IMAGE...</span>
              </div>
            )}
          </div>

          <div className={`rounded-xl border p-3 space-y-2 text-xs ${cardBg}`}>
            <div className="font-bold truncate">{selectedImage.title}</div>
            <p className={`text-[11px] leading-relaxed line-clamp-3 ${mutedText}`}>{selectedImage.prompt}</p>
            <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] font-mono">
              <div className={mutedText}>ID: <span className={isLight ? 'text-neutral-900' : 'text-slate-200'}>{selectedImage.id}</span></div>
              <div className={mutedText}>Size: <span className={isLight ? 'text-neutral-900' : 'text-slate-200'}>{selectedImage.width}×{selectedImage.height}</span></div>
              <div className={mutedText}>Folder: <span className={isLight ? 'text-neutral-900' : 'text-slate-200'}>{selectedImage.folder}</span></div>
              <div className={mutedText}>Ratio: <span className={isLight ? 'text-neutral-900' : 'text-slate-200'}>{selectedImage.aspectRatio}</span></div>
            </div>
            <div className={`text-[10px] font-mono truncate ${mutedText}`}>
              Provider: {selectedImage.provider}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-semibold pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Saved to {selectedImage.storagePath}</span>
            </div>
          </div>

          {/* Step 10: Connect to Video Studio */}
          <div className="space-y-2">
            <div className={`text-[10px] font-bold uppercase tracking-wider ${mutedText}`}>
              Send to Film & Video Studio
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAddToTimeline(selectedImage)}
                className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Clapperboard className="w-3.5 h-3.5" />
                <span>Add to Timeline</span>
              </button>
              <button
                onClick={() => handleSendToModule('manhwa_studio', selectedImage, 'Manhwa Studio')}
                className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Manhwa Studio</span>
              </button>
              <button
                onClick={() => handleSendToModule('ai_video', selectedImage, 'Image-to-Video')}
                className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 ${cardBg}`}
              >
                <Play className="w-3.5 h-3.5 text-cyan-500" />
                <span>Image-to-Video</span>
              </button>
              <button
                onClick={() => handleSendToModule('storyboard', selectedImage, 'Storyboard')}
                className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 ${cardBg}`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-amber-500" />
                <span>Storyboard</span>
              </button>
              <button
                onClick={() => handleSendToModule('ai_voice', selectedImage, 'Voice Studio')}
                className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 ${cardBg}`}
              >
                <Mic2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Assign Voice</span>
              </button>
              <button
                onClick={() => handleSendToModule('media', selectedImage, 'Unified Media Library')}
                className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 ${cardBg}`}
              >
                <FolderOpen className="w-3.5 h-3.5 text-emerald-500" />
                <span>Media Library</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                onClick={() => {
                  setToolSourceImage(selectedImage.url);
                  setSection('ai_editing');
                }}
                className={`px-2 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1 ${cardBg}`}
              >
                <Wand2 className="w-3 h-3 text-violet-500" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => {
                  setToolSourceImage(selectedImage.url);
                  setSection('upscale');
                }}
                className={`px-2 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1 ${cardBg}`}
              >
                <Maximize2 className="w-3 h-3 text-sky-500" />
                <span>Upscale</span>
              </button>
              <button
                onClick={() => handleDeleteImage(selectedImage.id)}
                className="px-2 py-1.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 text-[11px] font-semibold flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className={`rounded-xl border border-dashed p-8 text-center space-y-2 ${cardBg}`}>
          <ImageIcon className={`w-8 h-8 mx-auto ${mutedText}`} />
          <p className="text-xs font-semibold">No Image Selected Yet</p>
          <p className={`text-[11px] ${mutedText}`}>
            Generate an image, character, manhwa panel, or background to preview and send to Video Studio.
          </p>
        </div>
      )}

      {/* Recent Strip */}
      {images.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-neutral-200/20">
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${mutedText}`}>
              Recent Creations ({images.length})
            </span>
            <button
              onClick={() => setSection('recent_images')}
              className="text-[11px] text-purple-500 hover:underline font-semibold"
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {images.slice(0, 6).map((img) => (
              <button
                key={img.id}
                onClick={() => setSelectedImage(img)}
                className={`aspect-square rounded-lg overflow-hidden border transition-all ${
                  selectedImage?.id === img.id
                    ? 'border-purple-500 ring-2 ring-purple-500/30'
                    : isLight
                    ? 'border-neutral-200'
                    : 'border-slate-800'
                }`}
              >
                <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`flex-1 flex overflow-hidden ${surfaceBg}`}>
      {/* Left AI Image Studio Navigation Sidebar */}
      <aside className={`w-60 border-r p-4 overflow-y-auto shrink-0 space-y-5 hidden md:block ${sidebarBg}`}>
        <div>
          <div className="flex items-center gap-2 text-purple-500 font-extrabold text-xs uppercase tracking-wider">
            <ImageIcon className="w-4 h-4" />
            <span>AI Image Studio</span>
          </div>
          <p className={`text-[11px] mt-1 ${mutedText}`}>
            Prompt → Image → Edit → Library → Video
          </p>
        </div>

        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <div className={`px-2 text-[10px] font-bold uppercase tracking-wider ${mutedText}`}>
              {group.title}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    soundFx.playScannerBeep();
                    setSection(item.id);
                    setErrorMsg('');
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    active
                      ? isLight
                        ? 'bg-neutral-900 text-white'
                        : 'bg-purple-600 text-white'
                      : isLight
                      ? 'text-neutral-700 hover:bg-neutral-200/70'
                      : 'text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </aside>

      {/* Center Main Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className={`px-6 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 ${sidebarBg}`}>
          <div>
            <h1 className="text-base font-extrabold tracking-tight">
              AI Image Studio — {activeFilm.title}
            </h1>
            <p className={`text-xs ${mutedText}`}>
              Project ID: <span className="font-mono">{activeFilm.id}</span> · Auto-saving to Media Library/Images/
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as any)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold outline-none ${inputBg}`}
            >
              <option value="auto">Provider: Auto (Best Available)</option>
              <option value="studio_builtin">Studio Image Engine (Built-in)</option>
              <option value="openai">OpenAI (GPT-Image-1)</option>
              <option value="stability">Stability AI (Stable Image)</option>
              <option value="flux">Black Forest Labs (FLUX)</option>
            </select>
            <button
              onClick={() => setSection('saved_images')}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${cardBg}`}
            >
              <FolderOpen className="w-3.5 h-3.5 text-purple-500" />
              <span>My Images ({images.length})</span>
            </button>
          </div>
        </div>

        {/* Status Banners */}
        {(errorMsg || noticeMsg) && (
          <div className="px-6 pt-3">
            {errorMsg && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {noticeMsg && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{noticeMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* Scrollable Workspace Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: STUDIO OVERVIEW */}
          {section === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-extrabold">AI Image Studio Dashboard</h2>
                <p className={`text-xs mt-0.5 ${mutedText}`}>
                  Choose a generator or editing tool. Every output automatically registers into the Unified Media Library.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {overviewCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.id}
                      onClick={() => setSection(card.id)}
                      className={`text-left p-4 rounded-xl border transition-all hover:border-purple-500/60 hover:shadow-md space-y-2 ${cardBg}`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={`w-5 h-5 ${card.accent}`} />
                        <span className={`text-[10px] font-mono uppercase ${mutedText}`}>Open Tool →</span>
                      </div>
                      <div className="font-bold text-sm">{card.title}</div>
                      <p className={`text-xs leading-relaxed ${mutedText}`}>{card.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2 & FILM SCENE: TEXT-TO-IMAGE / FILM SCENE GENERATOR */}
          {(section === 'generate_image' || section === 'generate_film_scene') && (
            <div className="space-y-5 max-w-3xl">
              <div>
                <h2 className="text-lg font-extrabold">
                  {section === 'generate_film_scene'
                    ? 'Film Scene, Poster & Thumbnail Generator'
                    : 'Text-to-Image Generator'}
                </h2>
                <p className={`text-xs mt-0.5 ${mutedText}`}>
                  Describe your scene, choose style, aspect ratio, resolution, and number of images (1–4).
                </p>
              </div>

              {section === 'generate_film_scene' && (
                <div className="grid grid-cols-3 gap-2">
                  {(['Film Scenes', 'Posters', 'Thumbnails'] as const).map((kind) => (
                    <button
                      key={kind}
                      onClick={() => setSceneOutputKind(kind)}
                      className={`py-2 rounded-lg border text-xs font-bold ${
                        sceneOutputKind === kind
                          ? 'bg-purple-600 text-white border-purple-600'
                          : cardBg
                      }`}
                    >
                      {kind}
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider">Image Prompt</label>
                  <div className="flex items-center gap-1.5">
                    {EXAMPLE_PROMPTS.map((ex, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPrompt(ex)}
                        className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${cardBg}`}
                      >
                        Preset {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your anime hero, film scene, lighting, composition..."
                  className={`w-full rounded-xl border p-3 text-sm outline-none resize-none ${inputBg}`}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Image Style</label>
                  <select value={style} onChange={(e) => setStyle(e.target.value)} className={`w-full rounded-lg border p-2 text-xs font-semibold ${inputBg}`}>
                    {IMAGE_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Aspect Ratio</label>
                  <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className={`w-full rounded-lg border p-2 text-xs font-semibold ${inputBg}`}>
                    {ASPECT_RATIOS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Resolution</label>
                  <select value={resolution} onChange={(e) => setResolution(e.target.value)} className={`w-full rounded-lg border p-2 text-xs font-semibold ${inputBg}`}>
                    {RESOLUTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Images (1–4)</label>
                  <select value={imageCount} onChange={(e) => setImageCount(Number(e.target.value))} className={`w-full rounded-lg border p-2 text-xs font-semibold ${inputBg}`}>
                    {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} Image{n > 1 ? 's' : ''}</option>)}
                  </select>
                </div>
              </div>

              {section === 'generate_film_scene' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Cinema Lens</label>
                    <input value={cinemaLens} onChange={(e) => setCinemaLens(e.target.value)} className={`w-full rounded-lg border p-2 text-xs ${inputBg}`} />
                  </div>
                  <div className="space-y-1">
                    <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Lighting & Atmosphere</label>
                    <input value={lightingMood} onChange={(e) => setLightingMood(e.target.value)} className={`w-full rounded-lg border p-2 text-xs ${inputBg}`} />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Quality & Detail</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Standard Draft', 'High Detail', '4K Ultra Master'].map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuality(q)}
                      className={`py-2 rounded-lg border text-xs font-semibold ${
                        quality === q ? 'bg-purple-600 text-white border-purple-600' : cardBg
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={isLoading}
                onClick={() =>
                  handleGenerateTextToImage(
                    section === 'generate_film_scene'
                      ? {
                          overridePrompt: `${prompt}. Lens: ${cinemaLens}. Lighting: ${lightingMood}. Output type: ${sceneOutputKind}.`,
                          overrideFolder: sceneOutputKind,
                          overrideMode: 'film_scene',
                        }
                      : undefined
                  )
                }
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isLoading ? 'Generating Images...' : `Generate ${imageCount} Image${imageCount > 1 ? 's' : ''}`}</span>
              </button>
            </div>
          )}

          {/* STEP 3: CHARACTER STUDIO */}
          {section === 'generate_character' && (
            <div className="space-y-5 max-w-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold">Character Studio (Identity Consistency)</h2>
                  <p className={`text-xs mt-0.5 ${mutedText}`}>
                    Design consistent characters with reference images, expressions, poses, and saved character seeds.
                  </p>
                </div>
                {activeCharId && (
                  <button
                    onClick={() => setActiveCharId('')}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${cardBg}`}
                  >
                    + New Character
                  </button>
                )}
              </div>

              {characters.length > 0 && (
                <div className={`p-3 rounded-xl border space-y-2 ${cardBg}`}>
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${mutedText}`}>
                    Saved Character Identities ({characters.length}) — Click to Reuse
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {characters.map((ch) => (
                      <button
                        key={ch.id}
                        onClick={() => {
                          setActiveCharId(ch.id);
                          setCharName(ch.name);
                          setCharDesc(ch.description);
                          setCharHair(ch.hair);
                          setCharClothes(ch.clothes);
                          setCharEyes(ch.eyes);
                          setCharSkin(ch.skin);
                          setCharStyle(ch.style);
                          setCharRefDataUrl(ch.referenceImageUrl || ch.latestImageUrl);
                          showNotice(`Loaded saved identity for "${ch.name}" (Seed #${ch.identitySeed}).`);
                        }}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
                          activeCharId === ch.id
                            ? 'border-purple-500 bg-purple-500/10 text-purple-500'
                            : cardBg
                        }`}
                      >
                        <img src={ch.latestImageUrl} alt={ch.name} className="w-6 h-6 rounded-full object-cover" />
                        <span>{ch.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Character Name</label>
                  <input value={charName} onChange={(e) => setCharName(e.target.value)} className={`w-full rounded-lg border p-2 text-xs ${inputBg}`} />
                </div>
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Art Style</label>
                  <select value={charStyle} onChange={(e) => setCharStyle(e.target.value)} className={`w-full rounded-lg border p-2 text-xs ${inputBg}`}>
                    {IMAGE_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Character Description</label>
                <textarea rows={2} value={charDesc} onChange={(e) => setCharDesc(e.target.value)} className={`w-full rounded-lg border p-2.5 text-xs ${inputBg}`} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Hair Details</label>
                  <input value={charHair} onChange={(e) => setCharHair(e.target.value)} className={`w-full rounded-lg border p-2 text-xs ${inputBg}`} />
                </div>
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Clothes & Outfit</label>
                  <input value={charClothes} onChange={(e) => setCharClothes(e.target.value)} className={`w-full rounded-lg border p-2 text-xs ${inputBg}`} />
                </div>
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Eyes</label>
                  <input value={charEyes} onChange={(e) => setCharEyes(e.target.value)} className={`w-full rounded-lg border p-2 text-xs ${inputBg}`} />
                </div>
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Skin Tone</label>
                  <input value={charSkin} onChange={(e) => setCharSkin(e.target.value)} className={`w-full rounded-lg border p-2 text-xs ${inputBg}`} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Expression</label>
                  <select value={charExpression} onChange={(e) => setCharExpression(e.target.value)} className={`w-full rounded-lg border p-2 text-xs ${inputBg}`}>
                    {['Determined', 'Happy', 'Angry', 'Sad', 'Surprised', 'Calm'].map((ex) => <option key={ex}>{ex}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Pose</label>
                  <select value={charPose} onChange={(e) => setCharPose(e.target.value)} className={`w-full rounded-lg border p-2 text-xs ${inputBg}`}>
                    {['Heroic standing three-quarter pose', 'Action combat stance', 'Walking forward', 'Sitting calmly', 'Full body turnaround'].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Camera Angle</label>
                  <select value={charAngle} onChange={(e) => setCharAngle(e.target.value)} className={`w-full rounded-lg border p-2 text-xs ${inputBg}`}>
                    {['Medium portrait', 'Close-up face', 'Full body shot', 'Low angle hero shot', 'Side profile'].map((a) => <option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${cardBg}`}>
                <div className="flex items-center gap-3">
                  <input
                    ref={charRefInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileToDataUrl(f, setCharRefDataUrl);
                    }}
                  />
                  <button
                    onClick={() => charRefInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Face/Body Reference</span>
                  </button>
                  {charRefDataUrl && (
                    <span className="text-xs text-emerald-500 font-semibold">Reference attached</span>
                  )}
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveCharIdentity}
                    onChange={(e) => setSaveCharIdentity(e.target.checked)}
                  />
                  <span>Save Character Identity for Reuse</span>
                </label>
              </div>

              <button
                disabled={isLoading}
                onClick={handleGenerateCharacter}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                <UserCircle2 className="w-4 h-4" />
                <span>{isLoading ? 'Generating Character...' : 'Generate Character Sheet'}</span>
              </button>
            </div>
          )}

          {/* STEP 4: MANHWA / ANIME GENERATOR */}
          {section === 'generate_manhwa' && (
            <div className="space-y-5 max-w-3xl">
              <div>
                <h2 className="text-lg font-extrabold">Manhwa & Manga Panel Generator</h2>
                <p className={`text-xs mt-0.5 ${mutedText}`}>
                  Create Korean full-color webtoon panels, Japanese B&W manga, action spreads, and character close-ups.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Panel Scene Prompt</label>
                <textarea
                  rows={3}
                  value={manhwaPrompt}
                  onChange={(e) => setManhwaPrompt(e.target.value)}
                  className={`w-full rounded-xl border p-3 text-sm outline-none ${inputBg}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Comic Style</label>
                  <select value={manhwaStyle} onChange={(e) => setManhwaStyle(e.target.value)} className={`w-full rounded-lg border p-2 text-xs ${inputBg}`}>
                    <option>Korean Manhwa (Full-Color)</option>
                    <option>Japanese Manga (Black-and-White)</option>
                    <option>Webtoon Fantasy Glow</option>
                    <option>Shonen Action Ink</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Panel Layout</label>
                  <select value={manhwaLayout} onChange={(e) => setManhwaLayout(e.target.value)} className={`w-full rounded-lg border p-2 text-xs ${inputBg}`}>
                    <option>Action Panel (Single)</option>
                    <option>Character Close-Up</option>
                    <option>2-Panel Split Dialogue</option>
                    <option>Multiple-Panel Vertical Strip</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Emotional Expression</label>
                  <select value={manhwaEmotion} onChange={(e) => setManhwaEmotion(e.target.value)} className={`w-full rounded-lg border p-2 text-xs ${inputBg}`}>
                    <option>Intense Determination</option>
                    <option>Shocked / Dramatic Reveal</option>
                    <option>Tearful Emotion</option>
                    <option>Confident Smirk</option>
                  </select>
                </div>
              </div>

              <button
                disabled={isLoading}
                onClick={() =>
                  handleGenerateTextToImage({
                    overridePrompt: `${manhwaPrompt}. Style: ${manhwaStyle}. Layout: ${manhwaLayout}. Emotion: ${manhwaEmotion}.`,
                    overrideStyle: manhwaStyle,
                    overrideFolder: 'Manhwa',
                    overrideMode: 'manhwa',
                    titlePrefix: `Manhwa Panel (${manhwaLayout})`,
                  })
                }
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                <BookOpen className="w-4 h-4" />
                <span>{isLoading ? 'Generating Manhwa Panel...' : 'Generate Manhwa Panel'}</span>
              </button>
            </div>
          )}

          {/* STEP 5: BACKGROUND GENERATOR */}
          {section === 'generate_background' && (
            <div className="space-y-5 max-w-3xl">
              <div>
                <h2 className="text-lg font-extrabold">Background & World Generator</h2>
                <p className={`text-xs mt-0.5 ${mutedText}`}>
                  Generate clean establishing locations and film background plates with daytime, night, or fantasy lighting.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  'City and Village',
                  'Mountains and Forests',
                  'Houses and Rooms',
                  'Schools and Offices',
                  'Fantasy Worlds',
                  'Historical Locations',
                ].map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setBgLocation(loc)}
                    className={`p-2.5 rounded-lg border text-xs font-bold text-left ${
                      bgLocation === loc ? 'bg-emerald-600 text-white border-emerald-600' : cardBg
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Environment Details</label>
                <textarea rows={3} value={bgPrompt} onChange={(e) => setBgPrompt(e.target.value)} className={`w-full rounded-xl border p-3 text-sm outline-none ${inputBg}`} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Time of Day</label>
                  <select value={bgTime} onChange={(e) => setBgTime(e.target.value)} className={`w-full rounded-lg border p-2 text-xs ${inputBg}`}>
                    <option>Daytime</option>
                    <option>Golden Hour</option>
                    <option>Night</option>
                    <option>Dawn Mist</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Atmosphere</label>
                  <input value={bgWeather} onChange={(e) => setBgWeather(e.target.value)} className={`w-full rounded-lg border p-2 text-xs ${inputBg}`} />
                </div>
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Art Style</label>
                  <select value={bgStyle} onChange={(e) => setBgStyle(e.target.value)} className={`w-full rounded-lg border p-2 text-xs ${inputBg}`}>
                    {IMAGE_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <button
                disabled={isLoading}
                onClick={handleGenerateBackground}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                <Mountain className="w-4 h-4" />
                <span>{isLoading ? 'Rendering Background...' : 'Generate Background Plate'}</span>
              </button>
            </div>
          )}

          {/* STEP 6, 7, 8: IMAGE TOOLS (Img2Img, AI Edit, Remove BG, Upscale) */}
          {(section === 'image_to_image' ||
            section === 'ai_editing' ||
            section === 'remove_background' ||
            section === 'upscale') && (
            <div className="space-y-5 max-w-3xl">
              <div>
                <h2 className="text-lg font-extrabold">
                  {section === 'image_to_image'
                    ? 'Image-to-Image Transformation Studio'
                    : section === 'ai_editing'
                    ? 'AI Image Editing Studio'
                    : section === 'remove_background'
                    ? 'One-Click Background Removal'
                    : 'AI Super-Resolution Image Upscaling'}
                </h2>
                <p className={`text-xs mt-0.5 ${mutedText}`}>
                  Upload an image from your computer or use the currently selected preview image.
                </p>
              </div>

              {/* Source Image Picker */}
              <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${cardBg}`}>
                <div className="flex items-center gap-3">
                  {(toolSourceImage || selectedImage?.url) ? (
                    <img
                      src={toolSourceImage || selectedImage?.url}
                      alt="Source"
                      className="w-16 h-16 rounded-lg object-cover border border-purple-500/40"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg border border-dashed flex items-center justify-center">
                      <ImageIcon className={`w-6 h-6 ${mutedText}`} />
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold">Source Image</div>
                    <p className={`text-[11px] ${mutedText}`}>
                      {toolSourceImage
                        ? 'Custom image loaded'
                        : selectedImage
                        ? `Using selected: ${selectedImage.title}`
                        : 'Upload PNG/JPG/WebP to begin'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileToDataUrl(f, setToolSourceImage);
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                  </button>
                </div>
              </div>

              {section === 'image_to_image' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Transformation Mode</label>
                      <select value={img2imgType} onChange={(e) => setImg2imgType(e.target.value)} className={`w-full rounded-lg border p-2 text-xs ${inputBg}`}>
                        <option>Change Image Style</option>
                        <option>Change Clothes</option>
                        <option>Change Background</option>
                        <option>Change Lighting</option>
                        <option>Improve Image Quality</option>
                        <option>Create Different Character Pose</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Target Style</label>
                      <select value={img2imgStyle} onChange={(e) => setImg2imgStyle(e.target.value)} className={`w-full rounded-lg border p-2 text-xs ${inputBg}`}>
                        {IMAGE_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className={`text-[11px] font-bold uppercase ${mutedText}`}>
                      Transformation Strength: {Math.round(img2imgStrength * 100)}%
                    </label>
                    <input
                      type="range"
                      min={0.1}
                      max={1}
                      step={0.05}
                      value={img2imgStrength}
                      onChange={(e) => setImg2imgStrength(Number(e.target.value))}
                      className="w-full accent-purple-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Transformation Instructions</label>
                    <textarea rows={3} value={img2imgPrompt} onChange={(e) => setImg2imgPrompt(e.target.value)} className={`w-full rounded-xl border p-3 text-xs ${inputBg}`} />
                  </div>
                  <button
                    disabled={isLoading}
                    onClick={handleImageToImage}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>{isLoading ? 'Transforming Image...' : 'Run Image-to-Image Transform'}</span>
                  </button>
                </>
              )}

              {section === 'ai_editing' && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'remove_object', label: 'Remove Objects' },
                      { id: 'replace_background', label: 'Replace Background' },
                      { id: 'expand_image', label: 'Expand Image' },
                      { id: 'inpaint', label: 'Inpaint Area' },
                      { id: 'change_colors', label: 'Change Colours' },
                      { id: 'add_object', label: 'Add Objects' },
                    ].map((op) => (
                      <button
                        key={op.id}
                        onClick={() => setEditOperation(op.id as any)}
                        className={`py-2 px-3 rounded-lg border text-xs font-bold ${
                          editOperation === op.id ? 'bg-violet-600 text-white border-violet-600' : cardBg
                        }`}
                      >
                        {op.label}
                      </button>
                    ))}
                  </div>
                  {editOperation === 'change_colors' && (
                    <div className="space-y-1">
                      <label className={`text-[11px] font-bold uppercase ${mutedText}`}>
                        Color Hue Shift: {colorShift}°
                      </label>
                      <input
                        type="range"
                        min={-180}
                        max={180}
                        value={colorShift}
                        onChange={(e) => setColorShift(Number(e.target.value))}
                        className="w-full accent-violet-600"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Edit Prompt</label>
                    <textarea rows={3} value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} className={`w-full rounded-xl border p-3 text-xs ${inputBg}`} />
                  </div>
                  <button
                    disabled={isLoading}
                    onClick={() => handleEditImage()}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    <Wand2 className="w-4 h-4" />
                    <span>{isLoading ? 'Applying AI Edit...' : 'Apply AI Image Edit'}</span>
                  </button>
                </>
              )}

              {section === 'remove_background' && (
                <button
                  disabled={isLoading}
                  onClick={() => handleEditImage('remove_background')}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  <Scissors className="w-4 h-4" />
                  <span>{isLoading ? 'Removing Background...' : 'Remove Background (Transparent PNG)'}</span>
                </button>
              )}

              {section === 'upscale' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Scale Factor</label>
                      <select value={upscaleFactor} onChange={(e) => setUpscaleFactor(e.target.value as '2x' | '4x')} className={`w-full rounded-lg border p-2 text-xs ${inputBg}`}>
                        <option value="2x">2x Upscale</option>
                        <option value="4x">4x Ultra Upscale</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Target Master Resolution</label>
                      <select value={upscaleTarget} onChange={(e) => setUpscaleTarget(e.target.value as '2K' | '4K')} className={`w-full rounded-lg border p-2 text-xs ${inputBg}`}>
                        <option value="2K">2K Master</option>
                        <option value="4K">4K Cinema Master</option>
                      </select>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input type="checkbox" checked={enhanceDetail} onChange={(e) => setEnhanceDetail(e.target.checked)} />
                    <span>Apply Lanczos Edge Sharpening & Texture Clarity</span>
                  </label>
                  <button
                    disabled={isLoading}
                    onClick={handleUpscaleImage}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    <Maximize2 className="w-4 h-4" />
                    <span>{isLoading ? 'Upscaling Image...' : `Upscale Image to ${upscaleTarget}`}</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* STEP 9: MY IMAGES (Recent, Saved Folders, Project Images) */}
          {(section === 'recent_images' || section === 'saved_images' || section === 'project_images') && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold">
                    {section === 'project_images'
                      ? `Project Images (${activeFilm.title})`
                      : section === 'saved_images'
                      ? 'Saved Images — Media Library Folders'
                      : 'Recent Generated Images'}
                  </h2>
                  <p className={`text-xs ${mutedText}`}>
                    Showing {filteredImages.length} image(s) stored in Unified Media Library
                  </p>
                </div>
                <div className="relative w-64">
                  <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${mutedText}`} />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search prompt, style, folder..."
                    className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs outline-none ${inputBg}`}
                  />
                </div>
              </div>

              {section === 'saved_images' && (
                <div className="flex flex-wrap gap-1.5">
                  {LIBRARY_FOLDERS.map((folder) => (
                    <button
                      key={folder}
                      onClick={() => setFolderFilter(folder)}
                      className={`px-3 py-1 rounded-lg border text-xs font-semibold ${
                        folderFilter === folder
                          ? 'bg-purple-600 text-white border-purple-600'
                          : cardBg
                      }`}
                    >
                      {folder}
                    </button>
                  ))}
                </div>
              )}

              {filteredImages.length === 0 ? (
                <div className={`p-10 rounded-xl border border-dashed text-center space-y-2 ${cardBg}`}>
                  <ImageIcon className={`w-8 h-8 mx-auto ${mutedText}`} />
                  <p className="text-sm font-bold">No images in this view yet</p>
                  <button
                    onClick={() => setSection('generate_image')}
                    className="px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-bold"
                  >
                    + Generate Your First Image
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredImages.map((img) => (
                    <div
                      key={img.id}
                      onClick={() => setSelectedImage(img)}
                      className={`rounded-xl border overflow-hidden cursor-pointer transition-all ${
                        selectedImage?.id === img.id
                          ? 'border-purple-500 ring-2 ring-purple-500/30'
                          : cardBg
                      }`}
                    >
                      <div className="aspect-video bg-black relative">
                        <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 text-white text-[10px] font-bold">
                          {img.folder}
                        </span>
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/75 text-purple-300 text-[10px] font-mono">
                          {img.width}×{img.height}
                        </span>
                      </div>
                      <div className="p-3 space-y-1">
                        <div className="text-xs font-bold truncate">{img.title}</div>
                        <p className={`text-[11px] line-clamp-2 ${mutedText}`}>{img.prompt}</p>
                        <div className={`flex items-center justify-between pt-1 text-[10px] font-mono ${mutedText}`}>
                          <span>{img.style}</span>
                          <span>{img.createdAt.split('T')[0]}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SETTINGS: PROVIDERS, QUALITY & USAGE */}
          {section === 'settings' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-lg font-extrabold">AI Image Studio Settings</h2>
                <p className={`text-xs mt-0.5 ${mutedText}`}>
                  Backend provider status (keys stay strictly on the server), default quality, and workspace usage.
                </p>
              </div>

              <div className={`p-4 rounded-xl border space-y-3 ${cardBg}`}>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                  <Sliders className="w-4 h-4 text-purple-500" />
                  <span>Connected Backend AI Image Providers</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {providers &&
                    Object.entries(providers).map(([key, info]) => (
                      <div key={key} className={`p-3 rounded-lg border flex items-center justify-between ${cardBg}`}>
                        <div>
                          <div className="text-xs font-bold">{info.label}</div>
                          <div className={`text-[10px] font-mono ${mutedText}`}>Env: {info.envVar}</div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            info.configured
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : 'bg-amber-500/15 text-amber-500'
                          }`}
                        >
                          {info.configured ? 'Active' : 'Not Configured'}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className={`p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-2 gap-4 ${cardBg}`}>
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Default Quality</label>
                  <select
                    value={defaultQuality}
                    onChange={(e) => {
                      setDefaultQuality(e.target.value);
                      setQuality(e.target.value);
                    }}
                    className={`w-full rounded-lg border p-2 text-xs ${inputBg}`}
                  >
                    <option>Standard Draft</option>
                    <option>High Detail</option>
                    <option>4K Ultra Master</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Default Resolution</label>
                  <select
                    value={defaultResolution}
                    onChange={(e) => {
                      setDefaultResolution(e.target.value);
                      setResolution(e.target.value);
                    }}
                    className={`w-full rounded-lg border p-2 text-xs ${inputBg}`}
                  >
                    {RESOLUTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className={`p-4 rounded-xl border grid grid-cols-3 gap-4 text-center ${cardBg}`}>
                <div>
                  <div className="text-xl font-extrabold text-purple-500">{images.length}</div>
                  <div className={`text-[11px] ${mutedText}`}>Saved Studio Images</div>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-indigo-500">{characters.length}</div>
                  <div className={`text-[11px] ${mutedText}`}>Saved Character Seeds</div>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-emerald-500">100%</div>
                  <div className={`text-[11px] ${mutedText}`}>Unified Library Synced</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Preview & Cross-Module Handoff Panel */}
      {renderPreviewPanel()}
    </div>
  );
};
