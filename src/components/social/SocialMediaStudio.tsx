import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Share2,
  Youtube,
  Instagram,
  Facebook,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Calendar,
  History,
  Settings,
  Link2,
  Unlink,
  ExternalLink,
  ShieldCheck,
  Send,
  Clock,
  Film,
  Image as ImageIcon,
  Layers,
  XCircle,
} from 'lucide-react';
import { FilmProject } from '../../types';
import { soundFx } from '../../utils/audioSynth';

interface SocialMediaStudioProps {
  activeFilm: FilmProject;
}

type SocialPlatform = 'youtube' | 'instagram' | 'facebook';

type SocialSectionTab =
  | 'accounts'
  | 'youtube_mgr'
  | 'instagram_mgr'
  | 'facebook_mgr'
  | 'video_upload'
  | 'multi_publish'
  | 'scheduled'
  | 'history'
  | 'upload_progress'
  | 'settings';

interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  connected: boolean;
  connectionMode: 'live_oauth' | 'sandbox' | 'disconnected';
  accountName: string;
  handleOrId: string;
  accountType: string;
  eligibleForPublishing: boolean;
  note?: string;
}

interface UploadJob {
  id: string;
  filmTitle: string;
  platform: SocialPlatform;
  format: string;
  title: string;
  description: string;
  privacy: string;
  thumbnailName: string;
  videoFileName: string;
  progress: number;
  status: 'Queued' | 'Uploading' | 'Processing' | 'Published' | 'Simulation complete' | 'Failed';
  errorMessage?: string;
  publishedUrl?: string;
  retryCount: number;
  createdAt: string;
}

interface PublishHistoryItem {
  id: string;
  platform: SocialPlatform;
  filmTitle: string;
  videoTitle: string;
  format: string;
  privacy: string;
  publishedUrl: string;
  mode: 'live_oauth' | 'sandbox';
  publishedAt: string;
}

interface ScheduledPost {
  id: string;
  filmTitle: string;
  title: string;
  platforms: SocialPlatform[];
  scheduledForIso: string;
  privacy: string;
  videoFileName: string;
  status: 'Scheduled' | 'Dispatched' | 'Cancelled';
}

const SECTION_TABS: { id: SocialSectionTab; label: string; icon: React.ElementType }[] = [
  { id: 'accounts', label: '1. Connected Accounts', icon: Link2 },
  { id: 'youtube_mgr', label: '2. YouTube Manager', icon: Youtube },
  { id: 'instagram_mgr', label: '3. Instagram Manager', icon: Instagram },
  { id: 'facebook_mgr', label: '4. Facebook Manager', icon: Facebook },
  { id: 'video_upload', label: '5. Video Upload', icon: Upload },
  { id: 'multi_publish', label: '6. Multi-Platform Publish', icon: Send },
  { id: 'scheduled', label: '7. Scheduled Publishing', icon: Calendar },
  { id: 'history', label: '8. Publishing History', icon: History },
  { id: 'upload_progress', label: '9. Upload Progress', icon: RefreshCw },
  { id: 'settings', label: '10. Account Settings', icon: Settings },
];

export const SocialMediaStudio: React.FC<SocialMediaStudioProps> = ({ activeFilm }) => {
  const { firebaseUser, isAdmin } = useAuth();
  const [selectedMp4, setSelectedMp4] = useState<File | null>(null);
  const [youtubeAudience, setYouTubeAudience] = useState('');
  const [youtubeUploading, setYouTubeUploading] = useState(false);
  const [youtubeResult, setYouTubeResult] = useState<{ url: string; privacyStatus: string } | null>(null);
  const [activeTab, setActiveTab] = useState<SocialSectionTab>('accounts');
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [history, setHistory] = useState<PublishHistoryItem[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [platformSettings, setPlatformSettings] = useState<any>(null);
  const [oauthStatus, setOauthStatus] = useState<any>(null);
  const [tokenVaultCount, setTokenVaultCount] = useState<number>(0);

  const filmSlug = activeFilm.title.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '') || 'Studio_Film';

  // Video & Publishing Composer State
  const [videoFileName, setVideoFileName] = useState<string>(`${filmSlug}_Master.mp4`);
  const [videoFileSize, setVideoFileSize] = useState<string>('148.4 MB (H.264 4K MP4)');
  const [thumbnailPreview, setThumbnailPreview] = useState<string>(
    activeFilm.coverImage || '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg'
  );
  const [thumbnailName, setThumbnailName] = useState<string>(`${filmSlug}_thumbnail.jpg`);

  const [publishTitle, setPublishTitle] = useState<string>(
    `${activeFilm.title} — Official Master Film Release (Kannada & English)`
  );
  const [publishDescription, setPublishDescription] = useState<string>(
    'Created & rendered in Film & Video Studio Ultimate.\nFull master release with synchronized Kannada & English dialogue, score, and VFX.'
  );
  const [privacySetting, setPrivacySetting] = useState<'Public' | 'Unlisted' | 'Private'>('Public');
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([
    'youtube',
    'instagram',
    'facebook',
  ]);
  const [youtubeFormat, setYoutubeFormat] = useState<'Video (16:9)' | 'YouTube Short (9:16)'>('Video (16:9)');
  const [instagramFormat, setInstagramFormat] = useState<'Instagram Reel' | 'Feed Video'>('Instagram Reel');
  const [facebookFormat, setFacebookFormat] = useState<'Page Video' | 'Facebook Reel'>('Page Video');
  const [scheduleDatetime, setScheduleDatetime] = useState<string>(() => {
    const dt = new Date(Date.now() + 3600 * 1000);
    return dt.toISOString().slice(0, 16);
  });

  // Sandbox connect inline inputs
  const [sandboxNameInputs, setSandboxNameInputs] = useState<Record<SocialPlatform, string>>({
    youtube: 'Film Studio Official',
    instagram: 'filmstudio.official',
    facebook: 'Film & Video Studio Official Page',
  });

  const [noticeBanner, setNoticeBanner] = useState<string>('');
  const [errorBanner, setErrorBanner] = useState<string>('');
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const showNotice = (msg: string) => {
    setErrorBanner('');
    setNoticeBanner(msg);
    setTimeout(() => setNoticeBanner((p) => (p === msg ? '' : p)), 6000);
  };

  const showError = (msg: string) => {
    setErrorBanner(msg);
    setTimeout(() => setErrorBanner((p) => (p === msg ? '' : p)), 6000);
  };

  const applyServerState = (data: any) => {
    if (Array.isArray(data.accounts)) setAccounts(data.accounts);
    if (Array.isArray(data.jobs)) setJobs(data.jobs);
    if (Array.isArray(data.history)) setHistory(data.history);
    if (Array.isArray(data.scheduledPosts)) setScheduledPosts(data.scheduledPosts);
    if (data.platformSettings) setPlatformSettings(data.platformSettings);
    if (data.oauthStatus) setOauthStatus(data.oauthStatus);
    if (typeof data.tokenVaultCount === 'number') setTokenVaultCount(data.tokenVaultCount);
  };

  const fetchSocialState = async () => {
    try {
      const res = await fetch('/api/social/state');
      if (res.ok) {
        const data = await res.json();
        applyServerState(data);
      }
    } catch {
      // Ignore transient poll errors
    }
  };

  useEffect(() => {
    fetchSocialState();

    const onMessage = (event: MessageEvent) => {
      const origin = event.origin || '';
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) return;
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        soundFx.playCinematicImpact();
        showNotice(`Authorized ${String(event.data.platform).toUpperCase()} account via official OAuth 2.0.`);
        fetchSocialState();
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        showError(`OAuth authorization failed: ${event.data.error}`);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Poll upload progress automatically whenever any job is active
  useEffect(() => {
    const hasActive = jobs.some((j) => j.status === 'Queued' || j.status === 'Uploading' || j.status === 'Processing');
    if (!hasActive) return;
    const timer = setInterval(() => {
      fetchSocialState();
    }, 650);
    return () => clearInterval(timer);
  }, [jobs]);

  const handleConnectPlatform = async (platform: SocialPlatform) => {
    soundFx.playScannerBeep();
    try {
      const res = await fetch(`/api/social/oauth/${platform}/url`);
      const data = await res.json();

      if (data.mode === 'live_oauth' && data.url) {
        const authWin = window.open(data.url, `${platform}_oauth_popup`, 'width=600,height=720');
        if (!authWin) {
          showError('Popup was blocked. Allow popups for this studio window to complete OAuth authorization.');
        } else {
          showNotice(`Opened ${platform.toUpperCase()} authorization popup.`);
        }
        return;
      }

      // Live OAuth client secrets not yet configured — connect via encrypted Sandbox OAuth session
      const sbRes = await fetch('/api/social/connect/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          accountName: sandboxNameInputs[platform],
        }),
      });
      if (sbRes.ok) {
        const sbData = await sbRes.json();
        applyServerState(sbData);
        soundFx.playCinematicImpact();
        showNotice(
          data.invalidClientId
            ? `Connected ${platform.toUpperCase()} in Studio Sandbox mode (YOUTUBE_CLIENT_ID must end in .apps.googleusercontent.com for live Google OAuth).`
            : `Connected ${platform.toUpperCase()} in encrypted Sandbox mode (add ${data.missingCredentials?.join(' & ')} for live API upload).`
        );
      }
    } catch {
      showError(`Could not initiate ${platform} authorization.`);
    }
  };

  const handleDisconnect = async (platform: SocialPlatform) => {
    soundFx.playWhoosh();
    const res = await fetch(`/api/social/disconnect/${platform}`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      applyServerState(data);
      showNotice(`Disconnected ${platform.toUpperCase()} and purged encrypted access token.`);
    }
  };

  const youtubeChannel = accounts.find((account) => account.platform === 'youtube' && account.connectionMode === 'live_oauth');
  const uploadToYouTube = async () => {
    if (!firebaseUser || !isAdmin || !selectedMp4 || !youtubeAudience || !youtubeChannel || youtubeUploading) return;
    setYouTubeUploading(true);
    setYouTubeResult(null);
    try {
      const params = new URLSearchParams({
        title: publishTitle, description: publishDescription, channelId: youtubeChannel.handleOrId,
        privacy: privacySetting.toLowerCase(), madeForKids: youtubeAudience,
      });
      const response = await fetch(`/api/social/youtube/upload?${params}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${await firebaseUser.getIdToken()}`, 'Content-Type': 'video/mp4' },
        body: selectedMp4,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'YouTube upload failed.');
      setYouTubeResult(data);
      showNotice(`YouTube received the video. Visibility: ${data.privacyStatus}. Processing may take time.`);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'YouTube upload failed.');
    } finally {
      setYouTubeUploading(false);
    }
  };

  const handlePublishMulti = async (simulateFailure?: SocialPlatform) => {
    if (selectedPlatforms.length === 0) {
      showError('Select at least one platform (YouTube, Instagram, or Facebook).');
      return;
    }
    soundFx.playCinematicImpact();

    const res = await fetch('/api/social/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filmTitle: activeFilm.title,
        platforms: selectedPlatforms,
        title: publishTitle,
        description: publishDescription,
        privacy: privacySetting,
        formatByPlatform: {
          youtube: youtubeFormat,
          instagram: instagramFormat,
          facebook: facebookFormat,
        },
        thumbnailName,
        videoFileName,
        simulateFailurePlatform: simulateFailure,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      applyServerState(data);
      setActiveTab('upload_progress');
      if (data.createdJobs?.every((job: { status: string }) => job.status === 'Failed')) {
        showError(data.createdJobs[0]?.errorMessage || 'Upload could not start.');
      } else {
        showNotice('Sandbox test started. No platform upload will be made.');
      }
    } else {
      showError(data.error || 'Publish request failed.');
    }
  };

  const handleRetryJob = async (jobId: string) => {
    soundFx.playScannerBeep();
    const res = await fetch(`/api/social/jobs/${jobId}/retry`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      applyServerState(data);
      if (data.job?.status === 'Failed') showError(data.job.errorMessage || 'Upload could not start.');
      else if (data.job?.status === 'Uploading') showNotice('Retrying the sandbox test...');
    }
  };

  const handleSchedulePost = async () => {
    if (selectedPlatforms.length === 0) {
      showError('Select at least one target platform to schedule.');
      return;
    }
    soundFx.playShutterSound();
    const res = await fetch('/api/social/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filmTitle: activeFilm.title,
        title: publishTitle,
        description: publishDescription,
        platforms: selectedPlatforms,
        scheduledForIso: new Date(scheduleDatetime).toISOString(),
        privacy: privacySetting,
        videoFileName,
        thumbnailName,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      applyServerState(data);
      showNotice(`Scheduled "${publishTitle}" for ${selectedPlatforms.join(', ')}.`);
    }
  };

  const handleDispatchScheduled = async (id: string) => {
    soundFx.playCinematicImpact();
    const res = await fetch(`/api/social/schedule/${id}/dispatch`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      applyServerState(data);
      setActiveTab('upload_progress');
      showNotice('Dispatched scheduled post to upload pipeline.');
    }
  };

  const handleCancelScheduled = async (id: string) => {
    const res = await fetch(`/api/social/schedule/${id}`, { method: 'DELETE' });
    if (res.ok) {
      const data = await res.json();
      applyServerState(data);
      showNotice('Cancelled scheduled post.');
    }
  };

  const handleSavePlatformSetting = async (platform: SocialPlatform, updates: any) => {
    soundFx.playScannerBeep();
    const res = await fetch(`/api/social/settings/${platform}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      applyServerState(data);
      showNotice(`Updated ${platform.toUpperCase()} default publishing settings.`);
    }
  };

  const togglePlatformCheck = (p: SocialPlatform) => {
    setSelectedPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const platformIcon = (p: SocialPlatform) => {
    if (p === 'youtube') return <Youtube className="w-4 h-4 text-rose-400" />;
    if (p === 'instagram') return <Instagram className="w-4 h-4 text-pink-400" />;
    return <Facebook className="w-4 h-4 text-sky-400" />;
  };

  const ytAcc = accounts.find((a) => a.platform === 'youtube');
  const igAcc = accounts.find((a) => a.platform === 'instagram');
  const fbAcc = accounts.find((a) => a.platform === 'facebook');

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#07090e] text-slate-100">
      {/* Left 10-Section Navigation Rail */}
      <div className="w-full lg:w-64 bg-slate-900/95 border-b lg:border-b-0 lg:border-r border-slate-800 p-3 flex flex-col shrink-0">
        <div className="pb-3 mb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase font-mono-cinema">
            <Share2 className="w-4 h-4 text-cyan-400" />
            <span>Social Media Studio</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            YouTube · Instagram · Facebook Publishing · {tokenVaultCount} Encrypted Tokens
          </p>
        </div>

        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-y-auto pb-1">
          {SECTION_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundFx.playScannerBeep();
                  setActiveTab(tab.id);
                }}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap text-left transition-colors ${
                  active
                    ? 'bg-purple-600/25 text-white border border-purple-400/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-cyan-300' : 'text-slate-500'}`} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="hidden lg:block mt-auto pt-3 border-t border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>AES-256-GCM Server Token Vault</span>
          </div>
          <div>Tokens never exposed to frontend JS.</div>
        </div>
      </div>

      {/* Main Content Workspace */}
      <div className="flex-1 overflow-y-auto p-5 lg:p-6 space-y-5">
        {/* Global Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h1 className="text-xl font-bold text-white font-cinzel">
              {SECTION_TABS.find((t) => t.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-slate-400">
              Active Film: {activeFilm.title} · Select Video → Edit Details → Select Platforms → Publish → Track Uploads
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('multi_publish')}
              className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Multi-Platform Publish</span>
            </button>
          </div>
        </div>

        {/* Status / Error Feedback */}
        {noticeBanner && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{noticeBanner}</span>
          </div>
        )}
        {errorBanner && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorBanner}</span>
          </div>
        )}

        {/* 1. CONNECTED ACCOUNTS */}
        {activeTab === 'accounts' && (
          <div className="space-y-5">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Platform</th>
                    <th className="py-3 px-4">Connection</th>
                    <th className="py-3 px-4">Account / Channel / Page</th>
                    <th className="py-3 px-4">Authorization Mode</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {accounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-950/50">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2 capitalize">
                        {platformIcon(acc.platform)}
                        <span>{acc.platform}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold ${
                            acc.connected
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {acc.connected ? 'Connected' : 'Not connected'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200">{acc.accountName}</div>
                        <div className="text-[11px] text-slate-400">{acc.handleOrId} · {acc.accountType}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] font-mono text-cyan-300">
                        {acc.connectionMode === 'live_oauth'
                          ? 'Official OAuth 2.0 Token'
                          : acc.connectionMode === 'sandbox'
                          ? 'Studio Sandbox Vault'
                          : 'Awaiting Authorization'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {acc.connected ? (
                          <button
                            onClick={() => handleDisconnect(acc.platform)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/40 text-rose-300 text-xs"
                          >
                            <Unlink className="w-3.5 h-3.5" />
                            <span>Disconnect</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleConnectPlatform(acc.platform)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            <span>Connect</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Official OAuth Requirements & Sandbox Note */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1.5">
                <div className="font-bold text-rose-300 flex items-center gap-1.5">
                  <Youtube className="w-4 h-4" /> YouTube (Google OAuth 2.0)
                </div>
                <p className="text-slate-400 text-[11px]">
                  Supports long-form MP4 uploads and 9:16 YouTube Shorts with title, description, privacy, and thumbnail.
                </p>
                <div className="text-[10px] font-mono text-cyan-300 break-all">
                  Callback: {oauthStatus?.youtube?.redirectUri || '/auth/youtube/callback'}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1.5">
                <div className="font-bold text-pink-300 flex items-center gap-1.5">
                  <Instagram className="w-4 h-4" /> Instagram Professional API
                </div>
                <p className="text-slate-400 text-[11px]">
                  Requires an eligible Instagram Business or Creator Professional account linked to Meta Graph API.
                </p>
                <div className="text-[10px] font-mono text-cyan-300 break-all">
                  Callback: {oauthStatus?.instagram?.redirectUri || '/auth/instagram/callback'}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1.5">
                <div className="font-bold text-sky-300 flex items-center gap-1.5">
                  <Facebook className="w-4 h-4" /> Facebook Authorized Pages
                </div>
                <p className="text-slate-400 text-[11px]">
                  Publishes videos and Reels strictly to authorized Facebook Pages using encrypted Page access tokens.
                </p>
                <div className="text-[10px] font-mono text-cyan-300 break-all">
                  Callback: {oauthStatus?.facebook?.redirectUri || '/auth/facebook/callback'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. YOUTUBE MANAGER */}
        {activeTab === 'youtube_mgr' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Youtube className="w-6 h-6 text-rose-400" />
                <div>
                  <h2 className="text-sm font-bold text-white">YouTube Channel Manager</h2>
                  <p className="text-[11px] text-slate-400">
                    {ytAcc?.connected ? `${ytAcc.accountName} (${ytAcc.handleOrId})` : 'Channel not connected'}
                  </p>
                </div>
              </div>
              {!ytAcc?.connected ? (
                <button
                  onClick={() => handleConnectPlatform('youtube')}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  Connect YouTube Channel
                </button>
              ) : (
                <span className="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-300 font-mono">
                  Authorized for Video &amp; Shorts
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">
                  YouTube Publish Format
                </label>
                <select
                  value={youtubeFormat}
                  onChange={(e) => setYoutubeFormat(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none"
                >
                  <option value="Video (16:9)">Standard Cinema Video (16:9 / 4K MP4)</option>
                  <option value="YouTube Short (9:16)">YouTube Short (Vertical 9:16)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">
                  Default Privacy Level
                </label>
                <select
                  value={privacySetting}
                  onChange={(e) => setPrivacySetting(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none"
                >
                  <option value="Public">Public</option>
                  <option value="Unlisted">Unlisted (Review First)</option>
                  <option value="Private">Private</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('multi_publish')}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold"
            >
              Open Composer with YouTube Settings →
            </button>
          </div>
        )}

        {/* 3. INSTAGRAM MANAGER */}
        {activeTab === 'instagram_mgr' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Instagram className="w-6 h-6 text-pink-400" />
                <div>
                  <h2 className="text-sm font-bold text-white">Instagram Professional Manager</h2>
                  <p className="text-[11px] text-slate-400">
                    {igAcc?.connected ? `${igAcc.accountName} · Eligible Professional Account` : 'Not connected'}
                  </p>
                </div>
              </div>
              {!igAcc?.connected && (
                <button
                  onClick={() => handleConnectPlatform('instagram')}
                  className="px-3.5 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold"
                >
                  Connect Instagram Pro
                </button>
              )}
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-300">
              Note: Instagram Content Publishing API requires an eligible <strong>Business or Creator Professional</strong> account. Personal consumer accounts cannot publish Reels via API.
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">
                Instagram Video Format
              </label>
              <select
                value={instagramFormat}
                onChange={(e) => setInstagramFormat(e.target.value as any)}
                className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none"
              >
                <option value="Instagram Reel">Instagram Reel (9:16)</option>
                <option value="Feed Video">Supported Feed Video</option>
              </select>
            </div>
          </div>
        )}

        {/* 4. FACEBOOK MANAGER */}
        {activeTab === 'facebook_mgr' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Facebook className="w-6 h-6 text-sky-400" />
                <div>
                  <h2 className="text-sm font-bold text-white">Facebook Page Video Manager</h2>
                  <p className="text-[11px] text-slate-400">
                    {fbAcc?.connected ? `${fbAcc.accountName} (${fbAcc.handleOrId})` : 'No Facebook Page authorized'}
                  </p>
                </div>
              </div>
              {!fbAcc?.connected && (
                <button
                  onClick={() => handleConnectPlatform('facebook')}
                  className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold"
                >
                  Connect Facebook Page
                </button>
              )}
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-300">
              Publishes strictly to authorized <strong>Facebook Pages</strong> using encrypted Page access tokens (personal timelines excluded).
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">
                Facebook Page Format
              </label>
              <select
                value={facebookFormat}
                onChange={(e) => setFacebookFormat(e.target.value as any)}
                className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none"
              >
                <option value="Page Video">Facebook Page Master Video</option>
                <option value="Facebook Reel">Facebook Page Reel</option>
              </select>
            </div>
          </div>
        )}

        {/* 5. VIDEO UPLOAD & THUMBNAIL PREP */}
        {activeTab === 'video_upload' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="font-bold text-white flex items-center gap-2">
                <Film className="w-4 h-4 text-purple-400" />
                <span>Select Rendered Film / MP4 File</span>
              </div>

              <div className="p-4 bg-slate-950 border border-dashed border-slate-700 rounded-xl space-y-2 text-center">
                <div className="text-slate-200 font-medium">{videoFileName}</div>
                <div className="text-[11px] text-cyan-400 font-mono">{videoFileSize}</div>
                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="mt-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold inline-flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Choose Local MP4 / MOV File</span>
                </button>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setSelectedMp4(/\.mp4$/i.test(f.name) ? f : null);
                      setVideoFileName(f.name);
                      setVideoFileSize(`${(f.size / (1024 * 1024)).toFixed(2)} MB (${f.type || 'video/mp4'})`);
                      showNotice(`Attached video file "${f.name}" ready for multi-platform publishing.`);
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <p>Live YouTube upload uses the title, description and visibility from Multi-Platform Publish.</p>
                <p>{youtubeChannel ? `Channel: ${youtubeChannel.accountName} (${youtubeChannel.handleOrId})` : 'Connect a live YouTube channel first.'}</p>
                {!isAdmin && <p>Sign in as a Studio administrator to upload.</p>}
                <label className="block">
                  YouTube audience
                  <select value={youtubeAudience} onChange={(event) => setYouTubeAudience(event.target.value)}
                    className="ml-2 rounded bg-slate-950 p-2">
                    <option value="">Select audience</option>
                    <option value="true">Made for kids</option>
                    <option value="false">Not made for kids</option>
                  </select>
                </label>
                <button type="button" onClick={() => void uploadToYouTube()}
                  disabled={!selectedMp4 || !youtubeAudience || !youtubeChannel || !isAdmin || youtubeUploading}
                  className="rounded bg-red-700 px-4 py-2 font-semibold text-white disabled:opacity-50">
                  {youtubeUploading ? 'Sending MP4 to YouTube…' : `Upload to YouTube · ${privacySetting}`}
                </button>
                {youtubeResult && <a className="block text-cyan-400" href={youtubeResult.url} target="_blank" rel="noopener noreferrer">
                  Open uploaded video · {youtubeResult.privacyStatus}
                </a>}
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">
                  Quick-Load Rendered Project Masters
                </span>
                {[
                  { name: `${filmSlug}_Master.mp4`, size: '148.4 MB · 16:9 · H.264' },
                  { name: `${filmSlug}_Vertical_Reel_9x16.mp4`, size: '38.2 MB · 60s · H.264' },
                  { name: `${filmSlug}_4K_DCI_Director_Cut.mp4`, size: '112.0 MB · 4K DCI MP4' },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setSelectedMp4(null);
                      setVideoFileName(preset.name);
                      setVideoFileSize(preset.size);
                      showNotice(`Selected master "${preset.name}".`);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left ${
                      videoFileName === preset.name
                        ? 'bg-purple-600/20 border-purple-400 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span className="truncate font-mono">{preset.name}</span>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">{preset.size}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>Upload Thumbnail Cover</span>
              </div>

              <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-800">
                <img
                  src={thumbnailPreview}
                  alt="Video Thumbnail Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono truncate">{thumbnailName}</span>
                <button
                  onClick={() => thumbInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Upload Custom Thumbnail
                </button>
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setThumbnailName(f.name);
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === 'string') {
                        setThumbnailPreview(reader.result);
                        showNotice(`Loaded thumbnail "${f.name}".`);
                      }
                    };
                    reader.readAsDataURL(f);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 6. MULTI-PLATFORM PUBLISHING COMPOSER */}
        {activeTab === 'multi_publish' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
            {/* Left Composer Form (7 Cols) */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">
                  Video / Film Title (Kannada &amp; English supported)
                </label>
                <input
                  type="text"
                  value={publishTitle}
                  onChange={(e) => setPublishTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">
                  Description &amp; Tags
                </label>
                <textarea
                  rows={4}
                  value={publishDescription}
                  onChange={(e) => setPublishDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white outline-none focus:border-purple-500 resize-none"
                />
              </div>

              {/* Select Target Platforms */}
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-mono block mb-2">
                  Target Platforms (Independent Upload Pipelines)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(['youtube', 'instagram', 'facebook'] as SocialPlatform[]).map((p) => {
                    const acc = accounts.find((a) => a.platform === p);
                    const checked = selectedPlatforms.includes(p);
                    return (
                      <button
                        key={p}
                        onClick={() => togglePlatformCheck(p)}
                        className={`p-3 rounded-xl border text-left space-y-1 transition-colors ${
                          checked
                            ? 'bg-purple-600/20 border-purple-400 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-bold capitalize">
                            {platformIcon(p)} {p}
                          </span>
                          <input type="checkbox" checked={checked} readOnly className="accent-purple-500" />
                        </div>
                        <div className={`text-[10px] font-mono ${acc?.connected ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {acc?.connected ? acc.accountName : 'Not connected (will fail unless connected)'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Privacy & Audience */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">
                    Privacy / Audience
                  </label>
                  <select
                    value={privacySetting}
                    onChange={(e) => setPrivacySetting(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none"
                  >
                    <option value="Public">Public</option>
                    <option value="Unlisted">Unlisted</option>
                    <option value="Private">Private</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">
                    Attached Video Asset
                  </label>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-cyan-300 font-mono truncate">
                    {videoFileName}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  onClick={() => handlePublishMulti()}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25"
                >
                  <Send className="w-4 h-4" />
                  <span>Publish to Selected Platforms</span>
                </button>

                <button
                  onClick={() => handlePublishMulti('facebook')}
                  className="py-3 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-amber-300 font-mono text-[11px]"
                  title="Test retry recovery by simulating a failure on Facebook"
                >
                  Test Failure + Retry
                </button>
              </div>
            </div>

            {/* Right Publishing Preview Panel (5 Cols) */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Publishing Details Preview</span>
              </div>

              <div className="aspect-video bg-black rounded-lg overflow-hidden border border-slate-800 relative">
                <img src={thumbnailPreview} alt="Publish Preview" className="w-full h-full object-cover" />
                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-white">
                  {privacySetting.toUpperCase()}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="font-bold text-white text-sm">{publishTitle}</div>
                <p className="text-[11px] text-slate-400 whitespace-pre-line">{publishDescription}</p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px] font-mono">
                <div className="text-slate-400">Per-Platform Formats:</div>
                {selectedPlatforms.includes('youtube') && (
                  <div className="flex justify-between text-rose-300">
                    <span>YouTube</span>
                    <span>{youtubeFormat} · {privacySetting}</span>
                  </div>
                )}
                {selectedPlatforms.includes('instagram') && (
                  <div className="flex justify-between text-pink-300">
                    <span>Instagram</span>
                    <span>{instagramFormat} · Pro Account</span>
                  </div>
                )}
                {selectedPlatforms.includes('facebook') && (
                  <div className="flex justify-between text-sky-300">
                    <span>Facebook</span>
                    <span>{facebookFormat} · Page Target</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 7. SCHEDULED PUBLISHING */}
        {activeTab === 'scheduled' && (
          <div className="space-y-5 text-xs">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Schedule Multi-Platform Release</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="md:col-span-2">
                  <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1">
                    Publish Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleDatetime}
                    onChange={(e) => setScheduleDatetime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none"
                  />
                </div>
                <button
                  onClick={handleSchedulePost}
                  className="py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  + Schedule Post ({selectedPlatforms.length} Platforms)
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-3 bg-slate-950 border-b border-slate-800 font-mono uppercase text-[10px] text-slate-400">
                Scheduled Queue ({scheduledPosts.length})
              </div>
              {scheduledPosts.length === 0 ? (
                <div className="p-6 text-center text-slate-500">No scheduled releases yet.</div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {scheduledPosts.map((sp) => (
                    <div key={sp.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-white">{sp.title}</div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{new Date(sp.scheduledForIso).toLocaleString()}</span>
                          <span>·</span>
                          <span className="uppercase text-purple-300">{sp.platforms.join(', ')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                          {sp.status}
                        </span>
                        {sp.status === 'Scheduled' && (
                          <>
                            <button
                              onClick={() => handleDispatchScheduled(sp.id)}
                              className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                            >
                              Dispatch Now
                            </button>
                            <button
                              onClick={() => handleCancelScheduled(sp.id)}
                              className="px-2.5 py-1 rounded bg-slate-950 border border-slate-700 text-rose-300"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 8. PUBLISHING HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-xs">
            <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span className="font-mono uppercase text-[10px] text-slate-400">
                Completed Multi-Platform Releases ({history.length})
              </span>
              <button
                onClick={fetchSocialState}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>
            {history.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No videos published yet. Publish from Multi-Platform Publish to record release links.
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-950/60 text-slate-400 font-mono text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Platform</th>
                    <th className="py-2.5 px-4">Title</th>
                    <th className="py-2.5 px-4">Format &amp; Privacy</th>
                    <th className="py-2.5 px-4">Published At</th>
                    <th className="py-2.5 px-4 text-right">Published Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-950/40">
                      <td className="py-3 px-4 font-bold capitalize flex items-center gap-1.5">
                        {platformIcon(h.platform)} {h.platform}
                      </td>
                      <td className="py-3 px-4 text-slate-200">{h.videoTitle}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {h.format} · {h.privacy}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {new Date(h.publishedAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-cyan-400 font-mono">
                          <ExternalLink className="w-3 h-3" />
                          <span>{h.publishedUrl}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 9. UPLOAD PROGRESS */}
        {activeTab === 'upload_progress' && (
          <div className="space-y-3 text-xs">
            {jobs.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
                No active or recent upload jobs. Trigger a release from Multi-Platform Publish.
              </div>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-white">
                      {platformIcon(job.platform)}
                      <span className="capitalize">{job.platform}</span>
                      <span className="text-slate-500">·</span>
                      <span>{job.title}</span>
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          job.status === 'Published'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : job.status === 'Failed'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-cyan-500/20 text-cyan-300'
                        }`}
                      >
                        {job.status} ({job.progress}%)
                      </span>
                      {job.status === 'Failed' && (
                        <button
                          onClick={() => handleRetryJob(job.id)}
                          className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Retry Failed Upload</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-300 ${
                        job.status === 'Published'
                          ? 'bg-emerald-500'
                          : job.status === 'Failed'
                          ? 'bg-rose-500'
                          : 'bg-gradient-to-r from-purple-500 to-cyan-400'
                      }`}
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>
                      File: {job.videoFileName} · Format: {job.format} · Retries: {job.retryCount}
                    </span>
                    {job.platform === 'youtube' && job.status !== 'Published' && (
                      <a href="https://studio.youtube.com/" target="_blank" rel="noopener noreferrer"
                        className="text-cyan-400 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> Upload MP4 in YouTube Studio
                      </a>
                    )}
                    {job.publishedUrl && (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> {job.publishedUrl}
                      </span>
                    )}
                    {job.errorMessage && (
                      <span className="text-rose-400 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> {job.errorMessage}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 10. ACCOUNT SETTINGS */}
        {activeTab === 'settings' && platformSettings && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* YouTube Settings */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="font-bold text-rose-300 flex items-center gap-1.5">
                <Youtube className="w-4 h-4" /> YouTube Defaults
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">Channel Label (Sandbox)</label>
                <input
                  type="text"
                  value={sandboxNameInputs.youtube}
                  onChange={(e) => setSandboxNameInputs((p) => ({ ...p, youtube: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">Default Privacy</label>
                <select
                  value={platformSettings.youtube.defaultPrivacy}
                  onChange={(e) => handleSavePlatformSetting('youtube', { defaultPrivacy: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>

            {/* Instagram Settings */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="font-bold text-pink-300 flex items-center gap-1.5">
                <Instagram className="w-4 h-4" /> Instagram Defaults
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">Pro Handle (Sandbox)</label>
                <input
                  type="text"
                  value={sandboxNameInputs.instagram}
                  onChange={(e) => setSandboxNameInputs((p) => ({ ...p, instagram: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                />
              </div>
              <label className="flex items-center justify-between text-slate-300 cursor-pointer pt-1">
                <span>Share Reels to Profile Feed</span>
                <input
                  type="checkbox"
                  checked={platformSettings.instagram.shareToFeed}
                  onChange={(e) => handleSavePlatformSetting('instagram', { shareToFeed: e.target.checked })}
                  className="accent-pink-500"
                />
              </label>
            </div>

            {/* Facebook Settings */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="font-bold text-sky-300 flex items-center gap-1.5">
                <Facebook className="w-4 h-4" /> Facebook Page Defaults
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">Authorized Page Name</label>
                <input
                  type="text"
                  value={sandboxNameInputs.facebook}
                  onChange={(e) => setSandboxNameInputs((p) => ({ ...p, facebook: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                />
              </div>
              <label className="flex items-center justify-between text-slate-300 cursor-pointer pt-1">
                <span>Enable Crossposting to Linked Pages</span>
                <input
                  type="checkbox"
                  checked={platformSettings.facebook.allowCrossposting}
                  onChange={(e) => handleSavePlatformSetting('facebook', { allowCrossposting: e.target.checked })}
                  className="accent-sky-500"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
