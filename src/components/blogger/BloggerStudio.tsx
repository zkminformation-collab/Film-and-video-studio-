import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Link2,
  Unlink,
  Globe,
  FilePlus,
  Wand2,
  Film,
  Image as ImageIcon,
  Youtube,
  Search,
  Eye,
  Send,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  ExternalLink,
  Calendar,
  ShieldCheck,
  Edit3,
  Plus,
} from 'lucide-react';
import { FilmProject } from '../../types';
import { soundFx } from '../../utils/audioSynth';

interface BloggerStudioProps {
  activeFilm: FilmProject;
  onOpenSocialStudio?: () => void;
}

type BloggerSectionId =
  | 'connect'
  | 'select_blog'
  | 'create_post'
  | 'ai_writer'
  | 'film_articles'
  | 'upload_images'
  | 'embed_video'
  | 'seo_settings'
  | 'preview'
  | 'publish'
  | 'drafts'
  | 'published';

interface BloggerBlogSite {
  id: string;
  name: string;
  url: string;
  description: string;
  postsCount: number;
  locale: string;
}

interface BloggerAccountState {
  connected: boolean;
  connectionMode: 'live_oauth' | 'sandbox' | 'disconnected';
  accountName: string;
  email: string;
  scope: string;
  connectedAt?: string;
}

interface BloggerPostRecord {
  id: string;
  blogId: string;
  blogName: string;
  filmTitle: string;
  title: string;
  description: string;
  contentHtml: string;
  posterUrl: string;
  posterName: string;
  youtubeUrl: string;
  labels: string[];
  seoMetaDescription: string;
  seoKeywords: string;
  status: 'Draft' | 'Scheduled' | 'Published';
  scheduledForIso?: string;
  bloggerPostUrl?: string;
  mode: 'live_blogger_v3' | 'sandbox';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

interface BloggerWorkflowSettings {
  publishMode: 'review_before_publish' | 'auto_draft_on_render';
  defaultLabels: string;
  autoEmbedLatestYoutube: boolean;
}

const BLOGGER_SECTIONS: { id: BloggerSectionId; label: string; icon: React.ElementType }[] = [
  { id: 'connect', label: 'Connect Google Account', icon: Link2 },
  { id: 'select_blog', label: 'Select Blogger Website', icon: Globe },
  { id: 'create_post', label: 'Create New Post', icon: FilePlus },
  { id: 'ai_writer', label: 'AI Blog Writer', icon: Wand2 },
  { id: 'film_articles', label: 'Film & Video Articles', icon: Film },
  { id: 'upload_images', label: 'Upload Images', icon: ImageIcon },
  { id: 'embed_video', label: 'Embed YouTube Video', icon: Youtube },
  { id: 'seo_settings', label: 'SEO Settings', icon: Search },
  { id: 'preview', label: 'Preview Post', icon: Eye },
  { id: 'publish', label: 'Publish Post', icon: Send },
  { id: 'drafts', label: 'Draft Posts', icon: FileText },
  { id: 'published', label: 'Published Posts', icon: CheckCircle2 },
];

const STUDIO_ARTICLE_TEMPLATES = [
  { number: 1, title: 'Act I – Opening Sequence' },
  { number: 2, title: 'Act II – Rising Conflict' },
  { number: 3, title: 'Act III – Climax & Resolution' },
  { number: 4, title: 'Behind the Scenes – VFX & Audio Breakdown' },
  { number: 5, title: 'Director’s Cut & 4K Master Release' },
];

function extractYouTubeEmbedUrl(rawUrl: string): string | null {
  const clean = rawUrl.trim();
  if (!clean) return null;
  const shortMatch = clean.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  const watchMatch = clean.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  const shortsMatch = clean.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/);
  if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
  const embedMatch = clean.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/);
  if (embedMatch) return clean;
  return null;
}

export const BloggerStudio: React.FC<BloggerStudioProps> = ({
  activeFilm,
  onOpenSocialStudio,
}) => {
  const [activeSection, setActiveSection] = useState<BloggerSectionId>('connect');
  const [account, setAccount] = useState<BloggerAccountState | null>(null);
  const [blogs, setBlogs] = useState<BloggerBlogSite[]>([]);
  const [selectedBlogId, setSelectedBlogId] = useState<string>('');
  const [posts, setPosts] = useState<BloggerPostRecord[]>([]);
  const [settings, setSettings] = useState<BloggerWorkflowSettings>({
    publishMode: 'review_before_publish',
    defaultLabels: 'Animated Film, Kannada Cinema, Official Release',
    autoEmbedLatestYoutube: true,
  });
  const [oauthStatus, setOauthStatus] = useState<{
    configured: boolean;
    redirectUri: string;
    requiredEnv: string[];
  } | null>(null);
  const [tokenSecured, setTokenSecured] = useState<boolean>(false);

  // Recent YouTube links published via Social Media Studio
  const [recentYoutubeVideos, setRecentYoutubeVideos] = useState<
    { title: string; url: string; publishedAt: string }[]
  >([]);

  // Account sandbox / custom blog inputs
  const [sandboxName, setSandboxName] = useState('Film Studio Google Account');
  const [sandboxEmail, setSandboxEmail] = useState('studio@filmvideostudio.pro');
  const [customBlogName, setCustomBlogName] = useState('');
  const [customBlogUrl, setCustomBlogUrl] = useState('');

  // Composer State
  const [editingPostId, setEditingPostId] = useState<string | undefined>(undefined);
  const [chapterNumber, setChapterNumber] = useState<number>(1);
  const [chapterTitle, setChapterTitle] = useState<string>('Act I – Opening Sequence');
  const [articleLang, setArticleLang] = useState<string>(activeFilm.language || 'Kannada & English');
  const [focusNotes, setFocusNotes] = useState<string>('');

  const [postTitle, setPostTitle] = useState<string>(
    `${activeFilm.title} – Official Film Release & Behind the Scenes`
  );
  const [postDescription, setPostDescription] = useState<string>(
    'Explore the full film release, character breakdown, Kannada & English voice production notes, and official YouTube film stream.'
  );
  const [contentHtml, setContentHtml] = useState<string>(
    `<article class="fvs-blogger-article">
  <h2>${activeFilm.title} – Official Studio Release</h2>
  <p><strong>Film Introduction:</strong> Produced in Film &amp; Video Studio Ultimate, ${activeFilm.title} brings together AI screenplay crafting, synchronized dialogue, orchestral scoring, and 4K visual effects.</p>
  <h3>Story Summary</h3>
  <p>As tension escalates across the central conflict, our lead characters uncover a signal that alters their mission and pushes the production into an unforgettable climax.</p>
  <h3>Character Descriptions</h3>
  <ul>
    <li><strong>Lead Protagonist:</strong> Resolute commander driving the central narrative arc.</li>
    <li><strong>Supporting Specialist:</strong> Master strategist decoding the core mystery of the film.</li>
  </ul>
  <h3>Production Highlights</h3>
  <ul>
    <li>Part 1: Act I – Opening Sequence</li>
    <li>Part 2: VFX, Audio &amp; Master Export Breakdown</li>
  </ul>
</article>`
  );
  const [posterUrl, setPosterUrl] = useState<string>(
    activeFilm.coverImage || '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg'
  );
  const [posterName, setPosterName] = useState<string>('studio_film_poster.jpg');
  const [youtubeUrl, setYoutubeUrl] = useState<string>('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [labelsInput, setLabelsInput] = useState<string>(
    `${activeFilm.title}, Official Film, Kannada Cinema, Film Studio Ultimate`
  );
  const [seoMetaDescription, setSeoMetaDescription] = useState<string>(
    `Watch ${activeFilm.title}. Official film stream, character profiles, production breakdown, and story guide.`
  );
  const [seoKeywords, setSeoKeywords] = useState<string>(
    `${activeFilm.title}, Animated Film, Official Release, Film and Video Studio Ultimate`
  );
  const [scheduledForIso, setScheduledForIso] = useState<string>(() => {
    const dt = new Date(Date.now() + 7200 * 1000);
    return dt.toISOString().slice(0, 16);
  });

  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [noticeMsg, setNoticeMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const posterUploadRef = useRef<HTMLInputElement>(null);

  const notify = (msg: string) => {
    setErrorMsg('');
    setNoticeMsg(msg);
    setTimeout(() => setNoticeMsg((p) => (p === msg ? '' : p)), 6000);
  };

  const warn = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg((p) => (p === msg ? '' : p)), 6000);
  };

  const applyBloggerState = (data: any) => {
    if (data.account) setAccount(data.account);
    if (Array.isArray(data.blogs)) setBlogs(data.blogs);
    if (typeof data.selectedBlogId === 'string') setSelectedBlogId(data.selectedBlogId);
    if (Array.isArray(data.posts)) setPosts(data.posts);
    if (data.settings) setSettings(data.settings);
    if (data.oauthStatus) setOauthStatus(data.oauthStatus);
    if (typeof data.tokenSecured === 'boolean') setTokenSecured(data.tokenSecured);
  };

  const loadState = async () => {
    try {
      const [bloggerRes, socialRes] = await Promise.all([
        fetch('/api/blogger/state'),
        fetch('/api/social/state'),
      ]);
      if (bloggerRes.ok) {
        const bJson = await bloggerRes.json();
        applyBloggerState(bJson);
      }
      if (socialRes.ok) {
        const sJson = await socialRes.json();
        const ytItems = (sJson.history || [])
          .filter((h: any) => h.platform === 'youtube')
          .map((h: any) => ({
            title: h.videoTitle,
            url: h.publishedUrl,
            publishedAt: h.publishedAt,
          }));
        setRecentYoutubeVideos(ytItems);
      }
    } catch {
      // Ignore transient load error
    }
  };

  useEffect(() => {
    loadState();

    const handleOAuthMsg = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) return;
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.platform === 'blogger') {
        soundFx.playCinematicImpact();
        notify('Google Blogger OAuth 2.0 connected and retrieved your blogs.');
        loadState();
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR' && event.data?.platform === 'blogger') {
        warn(`Google Blogger OAuth failed: ${event.data.error}`);
      }
    };

    window.addEventListener('message', handleOAuthMsg);
    return () => window.removeEventListener('message', handleOAuthMsg);
  }, []);

  const handleLiveGoogleOAuth = async () => {
    soundFx.playScannerBeep();
    try {
      const res = await fetch('/api/blogger/oauth/url');
      const data = await res.json();
      if (data.mode === 'live_oauth' && data.url) {
        const popup = window.open(data.url, 'blogger_oauth_popup', 'width=600,height=720');
        if (!popup) {
          warn('Popup blocked by browser. Allow popups to complete Google Blogger OAuth.');
        }
        return;
      }
      if (data.invalidClientId) {
        warn(
          'Your server secret YOUTUBE_CLIENT_ID / GOOGLE_BLOGGER_CLIENT_ID is not a valid Google OAuth Client ID (*.apps.googleusercontent.com). Connect safely with Studio Sandbox Connect below or update the OAuth Client ID in Secrets.'
        );
        return;
      }
      warn(
        `Google OAuth credentials (${(data.missingCredentials || []).join(
          ', '
        )}) are not configured in server secrets yet. Use Studio Sandbox Connect below or add credentials in Secrets.`
      );
    } catch {
      warn('Unable to request Google Blogger OAuth URL.');
    }
  };

  const handleSandboxConnect = async () => {
    soundFx.playCinematicImpact();
    const res = await fetch('/api/blogger/connect/sandbox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountName: sandboxName, email: sandboxEmail }),
    });
    if (res.ok) {
      applyBloggerState(await res.json());
      notify('Connected Google Blogger Studio (encrypted token vault initialized).');
      setActiveSection('select_blog');
    }
  };

  const handleDisconnect = async () => {
    soundFx.playScannerBeep();
    const res = await fetch('/api/blogger/disconnect', { method: 'POST' });
    if (res.ok) {
      applyBloggerState(await res.json());
      notify('Disconnected Google Blogger account and purged stored tokens.');
    }
  };

  const handleSelectBlog = async (blogId: string) => {
    soundFx.playScannerBeep();
    const res = await fetch('/api/blogger/blogs/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blogId }),
    });
    if (res.ok) {
      const data = await res.json();
      applyBloggerState(data);
      notify(`Active Blogger website set to: ${data.selectedSite?.name}`);
    }
  };

  const handleAddCustomBlog = async () => {
    if (!customBlogName.trim() || !customBlogUrl.trim()) {
      warn('Enter both Blog Name and Blog URL.');
      return;
    }
    const res = await fetch('/api/blogger/blogs/custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: customBlogName, url: customBlogUrl }),
    });
    if (res.ok) {
      applyBloggerState(await res.json());
      setCustomBlogName('');
      setCustomBlogUrl('');
      notify('Added & selected custom Blogger website.');
    }
  };

  const handleGenerateAiArticle = async (titleOnly = false) => {
    soundFx.playSlateBeep();
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/blogger/ai/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filmTitle: activeFilm.title,
          chapterNumber,
          chapterTitle,
          language: articleLang,
          youtubeUrl,
          posterUrl,
          focusNotes,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPostTitle(data.title || postTitle);
        if (!titleOnly) {
          setPostDescription(data.description || postDescription);
          setContentHtml(data.contentHtml || contentHtml);
          setSeoMetaDescription(data.seoMetaDescription || seoMetaDescription);
          setSeoKeywords(data.seoKeywords || seoKeywords);
          if (Array.isArray(data.labels)) {
            setLabelsInput(data.labels.join(', '));
          }
        }
        soundFx.playCinematicImpact();
        notify(
          titleOnly
            ? 'Generated SEO-optimized Blogger title.'
            : `Generated complete article for Chapter ${chapterNumber}: ${chapterTitle}.`
        );
      }
    } catch {
      warn('Failed to generate AI blog content.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handlePosterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPosterName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPosterUrl(reader.result);
        notify(`Loaded poster image: ${file.name}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPost = async (action: 'draft' | 'publish' | 'schedule') => {
    if (!postTitle.trim()) {
      warn('Post title cannot be empty.');
      return;
    }
    if (action === 'publish' && !account?.connected) {
      warn('Connect your Google Blogger account first before publishing.');
      setActiveSection('connect');
      return;
    }

    soundFx.playSlateBeep();
    setIsSubmitting(true);
    try {
      const labels = labelsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/blogger/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPostId,
          blogId: selectedBlogId,
          filmTitle: activeFilm.title,
          title: postTitle,
          description: postDescription,
          contentHtml,
          posterUrl,
          posterName,
          youtubeUrl,
          labels,
          seoMetaDescription,
          seoKeywords,
          action,
          scheduledForIso: action === 'schedule' ? scheduledForIso : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        applyBloggerState(data);
        setEditingPostId(data.post?.id);
        soundFx.playCinematicImpact();
        if (action === 'publish') {
          notify(`Published to Blogger: "${data.post?.title}"`);
          setActiveSection('published');
        } else if (action === 'schedule') {
          notify(`Scheduled blog post for ${new Date(scheduledForIso).toLocaleString()}`);
          setActiveSection('drafts');
        } else {
          notify(`Saved post to Drafts: "${data.post?.title}"`);
          setActiveSection('drafts');
        }
      } else {
        const err = await res.json();
        warn(err.error || 'Failed to save blog post.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishDraftById = async (id: string) => {
    if (!account?.connected) {
      warn('Connect your Google Blogger account first.');
      setActiveSection('connect');
      return;
    }
    soundFx.playSlateBeep();
    const res = await fetch(`/api/blogger/posts/${encodeURIComponent(id)}/publish`, {
      method: 'POST',
    });
    if (res.ok) {
      applyBloggerState(await res.json());
      soundFx.playCinematicImpact();
      notify('Post published to Blogger.');
      setActiveSection('published');
    }
  };

  const handleDeletePost = async (id: string) => {
    const res = await fetch(`/api/blogger/posts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      applyBloggerState(await res.json());
      if (editingPostId === id) setEditingPostId(undefined);
      notify('Deleted post from Blogger Studio.');
    }
  };

  const loadPostIntoEditor = (post: BloggerPostRecord) => {
    setEditingPostId(post.id);
    setPostTitle(post.title);
    setPostDescription(post.description);
    setContentHtml(post.contentHtml);
    setPosterUrl(post.posterUrl || activeFilm.coverImage);
    setPosterName(post.posterName || 'poster.jpg');
    setYoutubeUrl(post.youtubeUrl);
    setLabelsInput(post.labels.join(', '));
    setSeoMetaDescription(post.seoMetaDescription);
    setSeoKeywords(post.seoKeywords);
    setActiveSection('create_post');
    notify(`Loaded "${post.title}" into composer.`);
  };

  const updateWorkflowMode = async (publishMode: 'review_before_publish' | 'auto_draft_on_render') => {
    const res = await fetch('/api/blogger/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publishMode }),
    });
    if (res.ok) {
      applyBloggerState(await res.json());
      notify(
        publishMode === 'review_before_publish'
          ? 'Workflow set to Review & Approve before publishing.'
          : 'Auto-Draft enabled: rendered MP4 films automatically create a Blogger draft for your review.'
      );
    }
  };

  const selectedBlog = blogs.find((b) => b.id === selectedBlogId) || blogs[0];
  const draftAndScheduled = posts.filter((p) => p.status === 'Draft' || p.status === 'Scheduled');
  const publishedPosts = posts.filter((p) => p.status === 'Published');
  const ytEmbedUrl = extractYouTubeEmbedUrl(youtubeUrl);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 text-slate-100">
      {/* Studio Header Bar */}
      <header className="px-6 py-4 border-b border-slate-800 bg-[#0b0e16] flex items-center justify-between gap-8 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <BookOpen className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0">
            Blogger Studio
          </span>
        </div>

        <div className="hidden md:flex items-center gap-4 text-xs text-slate-400 font-mono tabular-nums truncate">
          <span>{account?.connected ? account.email : 'Google Account Disconnected'}</span>
          <span aria-hidden="true">/</span>
          <span className="text-amber-300 truncate">{selectedBlog?.name || 'No Blog Selected'}</span>
          <span aria-hidden="true">/</span>
          <span>
            {draftAndScheduled.length} Drafts · {publishedPosts.length} Published
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenSocialStudio && (
            <button
              onClick={onOpenSocialStudio}
              className="px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg whitespace-nowrap shrink-0 transition-colors"
            >
              Social Media Studio
            </button>
          )}
          <button
            onClick={() => setActiveSection('publish')}
            className="px-4 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg whitespace-nowrap shrink-0 transition-colors"
          >
            Review &amp; Publish
          </button>
        </div>
      </header>

      {/* Notification Strip */}
      {(noticeMsg || errorMsg) && (
        <div
          className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between border-b shrink-0 ${
            errorMsg
              ? 'bg-red-950/60 border-red-800 text-red-200'
              : 'bg-emerald-950/50 border-emerald-800 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {errorMsg ? (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{errorMsg || noticeMsg}</span>
          </div>
          <button
            onClick={() => {
              setNoticeMsg('');
              setErrorMsg('');
            }}
            className="text-slate-400 hover:text-white text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Split Workspace: 12-Item Blogger Studio Tree + Active Tool Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Blogger Studio Tree Navigation */}
        <aside className="w-60 border-r border-slate-800 bg-[#090b11] overflow-y-auto p-3 space-y-1 shrink-0">
          <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Blogger Workflow
          </div>
          {BLOGGER_SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            const count =
              sec.id === 'drafts'
                ? draftAndScheduled.length
                : sec.id === 'published'
                ? publishedPosts.length
                : null;
            return (
              <button
                key={sec.id}
                onClick={() => {
                  soundFx.playScannerBeep();
                  setActiveSection(sec.id);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span className="truncate">{sec.label}</span>
                </div>
                {count !== null && (
                  <span className="text-[11px] font-mono tabular-nums text-slate-400">{count}</span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Active Tool Content Pane */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. CONNECT GOOGLE ACCOUNT */}
          {activeSection === 'connect' && (
            <div className="max-w-4xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">1. Connect Google Blogger Account</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Authorize Google Blogger API v3 using OAuth 2.0 or encrypted Studio Sandbox mode. Access tokens stay encrypted on the server.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <ShieldCheck
                      className={`w-4 h-4 ${account?.connected ? 'text-emerald-400' : 'text-slate-500'}`}
                    />
                    <span>
                      {account?.connected
                        ? `Connected: ${account.accountName}`
                        : 'Google Account Not Connected'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {account?.email} · {account?.connectionMode === 'live_oauth' ? 'Live Blogger API v3' : account?.connectionMode === 'sandbox' ? 'Encrypted Sandbox Vault' : 'Disconnected'} · Vault Secured: {tokenSecured ? 'Yes (AES-256-GCM)' : 'No'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLiveGoogleOAuth}
                    className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg whitespace-nowrap"
                  >
                    Authorize Google OAuth 2.0
                  </button>
                  {account?.connected && (
                    <button
                      onClick={handleDisconnect}
                      className="px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-red-950 text-red-300 border border-slate-700 rounded-lg flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      <span>Disconnect</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Studio Sandbox Quick Connect */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="text-sm font-semibold text-white">
                  Studio Sandbox Connection &amp; OAuth Configuration
                </div>
                <p className="text-xs text-slate-400">
                  {oauthStatus?.configured
                    ? 'Google OAuth client keys are configured on this server. You can authorize live Blogger API v3 above or test locally below.'
                    : `Live Google OAuth callback URL: ${oauthStatus?.redirectUri || '/auth/blogger/callback'}. While GOOGLE_BLOGGER_CLIENT_ID is unset, test the full workflow via encrypted Studio Sandbox below.`}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Google Author Name</label>
                    <input
                      value={sandboxName}
                      onChange={(e) => setSandboxName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Google Account Email</label>
                    <input
                      value={sandboxEmail}
                      onChange={(e) => setSandboxEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                  <div className="text-xs text-slate-500 font-mono">
                    Scope: https://www.googleapis.com/auth/blogger
                  </div>
                  <button
                    onClick={handleSandboxConnect}
                    className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg whitespace-nowrap"
                  >
                    Connect Blogger Sandbox Account
                  </button>
                </div>
              </div>

              {/* Review Approval Preference (Directly Answers Pipeline Automation Mode) */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="text-sm font-semibold text-white">
                  Post Creation &amp; Approval Policy
                </div>
                <p className="text-xs text-slate-400">
                  Choose whether Blogger Studio prepares a draft automatically after every MP4 render or waits for your explicit review and approval before posting.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => updateWorkflowMode('review_before_publish')}
                    className={`px-4 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      settings.publishMode === 'review_before_publish'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Wait for Review &amp; Approval (Recommended)
                  </button>
                  <button
                    onClick={() => updateWorkflowMode('auto_draft_on_render')}
                    className={`px-4 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      settings.publishMode === 'auto_draft_on_render'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Auto-Create Draft After MP4 Render
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. SELECT BLOGGER WEBSITE */}
          {activeSection === 'select_blog' && (
            <div className="max-w-4xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">2. Select Blogger Website</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Retrieve blogs from your connected Google Account and pick the destination website for your film articles.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const res = await fetch('/api/blogger/blogs/refresh', { method: 'POST' });
                    if (res.ok) {
                      applyBloggerState(await res.json());
                      notify('Refreshed available Blogger websites.');
                    }
                  }}
                  className="px-3 py-2 text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg flex items-center gap-1.5 text-slate-200"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retrieve Blogs</span>
                </button>
              </div>

              <div className="space-y-3">
                {blogs.map((b) => {
                  const selected = b.id === selectedBlogId;
                  return (
                    <div
                      key={b.id}
                      className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${
                        selected
                          ? 'bg-amber-500/10 border-amber-500/60'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="text-sm font-semibold text-white">{b.name}</div>
                        <div className="text-xs text-slate-400">{b.description}</div>
                        <div className="text-xs font-mono text-amber-300 tabular-nums">
                          {b.url} · {b.postsCount} posts · {b.locale}
                        </div>
                      </div>
                      <button
                        onClick={() => handleSelectBlog(b.id)}
                        className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap ${
                          selected
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        {selected ? 'Active Blog' : 'Select Website'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="text-sm font-semibold text-white">Add Existing Blogspot URL</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    placeholder="Blog Title (e.g. Studio Film Devblog)"
                    value={customBlogName}
                    onChange={(e) => setCustomBlogName(e.target.value)}
                    className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 outline-none"
                  />
                  <input
                    placeholder="https://yourblog.blogspot.com"
                    value={customBlogUrl}
                    onChange={(e) => setCustomBlogUrl(e.target.value)}
                    className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 outline-none"
                  />
                </div>
                <button
                  onClick={handleAddCustomBlog}
                  className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Blogger Website</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. CREATE NEW POST */}
          {activeSection === 'create_post' && (
            <div className="max-w-4xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">3. Create New Blogger Post</h2>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    Target Blog: {selectedBlog?.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleGenerateAiArticle(true)}
                    disabled={isGeneratingAi}
                    className="px-3 py-2 text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-amber-300"
                  >
                    AI Title Generator
                  </button>
                  <button
                    onClick={() => setActiveSection('ai_writer')}
                    className="px-3 py-2 text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white rounded-lg"
                  >
                    Open AI Blog Writer
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Blog Post Title</label>
                  <input
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Short Description / Excerpt
                  </label>
                  <textarea
                    rows={2}
                    value={postDescription}
                    onChange={(e) => setPostDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Article Content (HTML Ready for Blogger API v3)
                  </label>
                  <textarea
                    rows={11}
                    value={contentHtml}
                    onChange={(e) => setContentHtml(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tags / Blogger Labels (comma separated)
                  </label>
                  <input
                    value={labelsInput}
                    onChange={(e) => setLabelsInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleSubmitPost('draft')}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg"
                  >
                    Save as Draft
                  </button>
                  <button
                    onClick={() => setActiveSection('preview')}
                    className="px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg"
                  >
                    Preview Post
                  </button>
                  <button
                    onClick={() => handleSubmitPost('publish')}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg"
                  >
                    Publish Directly to Blogger
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. AI BLOG WRITER */}
          {activeSection === 'ai_writer' && (
            <div className="max-w-4xl space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white">4. AI Blog Writer &amp; Title Generator</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Automatically drafts introduction, story summary, character bios, film poster placement, YouTube embed notes, and related chapter links.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Chapter Number (1–108)</label>
                    <input
                      type="number"
                      min={1}
                      max={108}
                      value={chapterNumber}
                      onChange={(e) => setChapterNumber(Math.max(1, Math.min(108, Number(e.target.value) || 1)))}
                      className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-950 border border-slate-800 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Chapter / Episode Title</label>
                    <input
                      value={chapterTitle}
                      onChange={(e) => setChapterTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Language Coverage</label>
                    <select
                      value={articleLang}
                      onChange={(e) => setArticleLang(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white"
                    >
                      <option value="English & Kannada">English &amp; Kannada</option>
                      <option value="Kannada">Kannada</option>
                      <option value="English">English</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Custom Story / Production Highlights (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Highlight voice actors, combat animation highlights, or music motifs..."
                    value={focusNotes}
                    onChange={(e) => setFocusNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={() => handleGenerateAiArticle(false)}
                    disabled={isGeneratingAi}
                    className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-lg flex items-center gap-2"
                  >
                    <Wand2 className="w-4 h-4" />
                    <span>{isGeneratingAi ? 'Generating Article...' : 'Generate Complete Film Article'}</span>
                  </button>
                  <button
                    onClick={() => handleGenerateAiArticle(true)}
                    disabled={isGeneratingAi}
                    className="px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg"
                  >
                    Generate SEO Title Only
                  </button>
                  <button
                    onClick={() => setActiveSection('preview')}
                    className="px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg"
                  >
                    Inspect Preview
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. FILM & VIDEO ARTICLES (STUDIO PRESETS + RECENT RENDERS) */}
          {activeSection === 'film_articles' && (
            <div className="max-w-4xl space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white">5. Film &amp; Video Article Templates</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Select a production template for <span className="text-white font-medium">{activeFilm.title}</span> to generate and populate a complete release article.
                </p>
              </div>

              <div className="space-y-2.5">
                {STUDIO_ARTICLE_TEMPLATES.map((ch) => (
                  <div
                    key={ch.number}
                    className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white">
                        Part {ch.number} – {ch.title}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5 tabular-nums">
                        {activeFilm.title} · Kannada &amp; English · Includes Story Summary, Characters &amp; YouTube Embed
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setChapterNumber(ch.number);
                        setChapterTitle(ch.title);
                        setActiveSection('ai_writer');
                        notify(`Selected ${ch.title}. Click Generate Complete Film Article.`);
                      }}
                      className="px-3.5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg whitespace-nowrap"
                    >
                      Prepare Article
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. UPLOAD IMAGES */}
          {activeSection === 'upload_images' && (
            <div className="max-w-4xl space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white">6. Upload Film Poster &amp; Images</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Attach a film poster or still frame to embed at the top of your Blogger article.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs font-mono text-slate-300">
                    Current Poster: <span className="text-amber-300">{posterName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      ref={posterUploadRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePosterUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => posterUploadRef.current?.click()}
                      className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg"
                    >
                      Upload Poster File
                    </button>
                    <button
                      onClick={() => {
                        setPosterUrl(
                          activeFilm.coverImage || '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg'
                        );
                        setPosterName('studio_project_cover.jpg');
                        notify('Applied active project cover artwork.');
                      }}
                      className="px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
                    >
                      Use Active Film Cover
                    </button>
                  </div>
                </div>

                <div className="aspect-video max-w-xl bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex items-center justify-center">
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt={`${postTitle} Poster`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-xs text-slate-500">No poster image selected</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 7. EMBED YOUTUBE VIDEO */}
          {activeSection === 'embed_video' && (
            <div className="max-w-4xl space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white">7. Embed YouTube Video</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Paste any YouTube watch or Shorts URL, or select a video recently uploaded via Social Media Studio.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    YouTube Video / Shorts URL
                  </label>
                  <input
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-white outline-none focus:border-amber-500"
                  />
                </div>

                {recentYoutubeVideos.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="text-xs font-medium text-slate-400">
                      Recently Published from Social Media Studio:
                    </div>
                    <div className="space-y-2">
                      {recentYoutubeVideos.map((v, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="truncate">
                            <span className="text-slate-200 font-medium">{v.title}</span>
                            <span className="text-slate-500 font-mono ml-2">{v.url}</span>
                          </div>
                          <button
                            onClick={() => {
                              setYoutubeUrl(v.url);
                              notify(`Embedded YouTube video: ${v.title}`);
                            }}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded shrink-0"
                          >
                            Use Video
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ytEmbedUrl && (
                  <div className="space-y-2">
                    <div className="text-xs font-mono text-emerald-400">
                      Embed Ready: {ytEmbedUrl}
                    </div>
                    <div className="aspect-video max-w-xl rounded-lg overflow-hidden border border-slate-800 bg-black">
                      <iframe
                        src={ytEmbedUrl}
                        title="YouTube Embed Preview"
                        className="w-full h-full"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 8. SEO SETTINGS */}
          {activeSection === 'seo_settings' && (
            <div className="max-w-4xl space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white">8. SEO Settings &amp; Search Preview</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Configure Google Search meta description, keywords, and Blogger labels for higher discoverability.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">Search Meta Description</span>
                    <span className="font-mono tabular-nums text-slate-400">
                      {seoMetaDescription.length} / 160 chars
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={seoMetaDescription}
                    onChange={(e) => setSeoMetaDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Focus Keywords</label>
                  <input
                    value={seoKeywords}
                    onChange={(e) => setSeoKeywords(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Blogger Labels / Tags</label>
                  <input
                    value={labelsInput}
                    onChange={(e) => setLabelsInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 outline-none"
                  />
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                  <div className="text-[11px] font-mono text-emerald-400 truncate">
                    {selectedBlog?.url}/2026/11/{postTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48)}.html
                  </div>
                  <div className="text-sm font-semibold text-sky-400">{postTitle}</div>
                  <div className="text-xs text-slate-400">{seoMetaDescription}</div>
                </div>
              </div>
            </div>
          )}

          {/* 9. PREVIEW POST */}
          {activeSection === 'preview' && (
            <div className="max-w-4xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">9. Live Blog Post Preview</h2>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    Previewing on {selectedBlog?.name} ({selectedBlog?.url})
                  </p>
                </div>
                <button
                  onClick={() => setActiveSection('publish')}
                  className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg"
                >
                  Approve &amp; Proceed to Publish
                </button>
              </div>

              <article className="bg-white text-slate-900 rounded-xl p-8 space-y-5 shadow-xl">
                <div className="text-xs text-slate-500 font-mono">
                  {selectedBlog?.name} · {labelsInput.split(',').map((t) => t.trim()).filter(Boolean).join(' · ')}
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{postTitle}</h1>
                <p className="text-sm text-slate-600 leading-relaxed">{postDescription}</p>

                {posterUrl && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                    <img
                      src={posterUrl}
                      alt={postTitle}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {ytEmbedUrl && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-black border border-slate-200">
                    <iframe
                      src={ytEmbedUrl}
                      title="Embedded Film Video"
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                )}

                <div
                  className="prose prose-sm max-w-none text-slate-800 space-y-3 leading-relaxed [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{ __html: contentHtml }}
                />
              </article>
            </div>
          )}

          {/* 10. PUBLISH POST */}
          {activeSection === 'publish' && (
            <div className="max-w-4xl space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white">10. Review, Schedule &amp; Publish Post</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Verify article details, save as draft, schedule release, or publish directly via Blogger API v3.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                    <div className="text-slate-400">Google Blogger Account</div>
                    <div className="font-semibold text-white">
                      {account?.connected ? `${account.accountName} (${account.email})` : 'Not Connected'}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                    <div className="text-slate-400">Destination Blog</div>
                    <div className="font-semibold text-amber-300">{selectedBlog?.name}</div>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5 text-xs">
                  <div className="text-slate-400">Article Summary</div>
                  <div className="text-sm font-semibold text-white">{postTitle}</div>
                  <div className="text-slate-400 font-mono">
                    Poster: {posterName} · YouTube Embed: {ytEmbedUrl ? 'Attached' : 'None'} · Labels: {labelsInput}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Schedule Date &amp; Time (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledForIso}
                      onChange={(e) => setScheduledForIso(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-white"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <button
                      onClick={() => handleSubmitPost('draft')}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
                    >
                      Save Draft
                    </button>
                    <button
                      onClick={() => handleSubmitPost('schedule')}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white rounded-lg inline-flex items-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Schedule Post</span>
                    </button>
                    <button
                      onClick={() => handleSubmitPost('publish')}
                      disabled={isSubmitting}
                      className="px-5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg inline-flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Publish to Blogger Now</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 11. DRAFT POSTS */}
          {activeSection === 'drafts' && (
            <div className="max-w-4xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">11. Draft &amp; Scheduled Posts</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Posts awaiting your final review and approval before going live.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingPostId(undefined);
                    setActiveSection('create_post');
                  }}
                  className="px-3.5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg"
                >
                  New Post
                </button>
              </div>

              {draftAndScheduled.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-3">
                  <div className="text-sm font-medium text-slate-300">No drafts or scheduled posts yet</div>
                  <p className="text-xs text-slate-500">
                    Use the AI Blog Writer or Post Creator to prepare an article draft for review.
                  </p>
                  <button
                    onClick={() => setActiveSection('ai_writer')}
                    className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg"
                  >
                    Open AI Blog Writer
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {draftAndScheduled.map((post) => (
                    <div
                      key={post.id}
                      className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{post.title}</div>
                        <div className="text-xs text-slate-400 font-mono tabular-nums">
                          {post.status} · {post.blogName}
                          {post.scheduledForIso ? ` · Scheduled ${new Date(post.scheduledForIso).toLocaleString()}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => loadPostIntoEditor(post)}
                          className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg inline-flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handlePublishDraftById(post.id)}
                          className="px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg"
                        >
                          Publish Now
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          aria-label="Delete post"
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 12. PUBLISHED POSTS */}
          {activeSection === 'published' && (
            <div className="max-w-4xl space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white">12. Published Blogger Posts</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Live articles published to your selected Google Blogger websites.
                </p>
              </div>

              {publishedPosts.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-3">
                  <div className="text-sm font-medium text-slate-300">No published articles yet</div>
                  <p className="text-xs text-slate-500">
                    Review your post in Preview Post and click Publish Directly to Blogger.
                  </p>
                  <button
                    onClick={() => setActiveSection('publish')}
                    className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg"
                  >
                    Go to Publish Post
                  </button>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400">
                      <tr>
                        <th className="py-2.5 px-4 font-medium">Article Title</th>
                        <th className="py-2.5 px-4 font-medium">Blogger Website</th>
                        <th className="py-2.5 px-4 font-medium">Mode</th>
                        <th className="py-2.5 px-4 font-medium text-right">Published</th>
                        <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {publishedPosts.map((post) => (
                        <tr key={post.id} className="hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-medium text-white max-w-xs truncate">
                            {post.title}
                          </td>
                          <td className="py-3 px-4 text-slate-400 truncate max-w-[180px]">
                            {post.blogName}
                          </td>
                          <td className="py-3 px-4 font-mono text-emerald-400">
                            {post.mode === 'live_blogger_v3' ? 'Blogger v3 Live' : 'Sandbox Publish'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-400">
                            {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '-'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => loadPostIntoEditor(post)}
                                className="text-slate-300 hover:text-white underline"
                              >
                                Edit
                              </button>
                              {post.bloggerPostUrl && (
                                <a
                                  href={post.bloggerPostUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300"
                                >
                                  <span>View</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
