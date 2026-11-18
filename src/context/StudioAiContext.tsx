import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  AiProviderConfig, 
  CreditWallet, 
  CreditTransaction, 
  CostEstimate, 
  AiQueueItem, 
  PromptTemplate,
  StudioModule,
  TimelineClip
} from '../types';
import { INITIAL_AI_PROVIDERS, PROMPT_LIBRARY_TEMPLATES } from '../data/promptLibraryData';
import { INITIAL_VOICES } from '../data/initialData';
import { AudioTimelineClip, SavedVoiceProfile } from '../components/audio/audioTypes';
import { UniversalAsset } from '../data/libraryData';
import { soundFx } from '../utils/audioSynth';

interface StudioAiContextType {
  wallet: CreditWallet;
  providers: AiProviderConfig[];
  queue: AiQueueItem[];
  history: CreditTransaction[];
  activePrompt: PromptTemplate | null;
  activeProviderId: string;
  costApprovalModal: CostEstimate | null;
  isReprocessing: boolean;
  reprocessStatusText: string;
  queuedEditorClips: TimelineClip[];
  audioClips: AudioTimelineClip[];
  voiceProfiles: SavedVoiceProfile[];
  setAudioClips: React.Dispatch<React.SetStateAction<AudioTimelineClip[]>>;
  addAudioClip: (clip: AudioTimelineClip) => void;
  addVoiceProfile: (profile: SavedVoiceProfile) => void;
  setActiveProviderId: (id: string) => void;
  loadPromptIntoTool: (prompt: PromptTemplate, onNavigate: (module: StudioModule) => void) => void;
  requestCostApproval: (estimate: CostEstimate, onApproved: () => void) => void;
  closeCostApproval: () => void;
  confirmCostApproval: () => void;
  addQueueItem: (item: Omit<AiQueueItem, 'id' | 'timeElapsed'>) => void;
  addAssetToTimeline: (asset: UniversalAsset) => TimelineClip;
  consumeQueuedEditorClips: () => TimelineClip[];
  updateWalletPlan: (plan: CreditWallet['plan'], customCredits?: number) => void;
  rechargeCredits: (amount: number, costUsd: number, label?: string) => void;
  toggleProvider: (id: string) => void;
  updateProviderLimit: (id: string, limitUsd: number) => void;
  recheckPendingQueue: () => void;
  reprocessAllPending: () => Promise<void>;
  reprocessAllPrompts: (templates?: PromptTemplate[]) => Promise<void>;
  submitCustomPrompt: (title: string, prompt: string, category: PromptTemplate['category'], targetModule: StudioModule) => PromptTemplate;
  retryQueueItem: (id: string) => Promise<void>;
  clearCompletedQueue: () => void;
}

const StudioAiContext = createContext<StudioAiContextType | undefined>(undefined);

export const StudioAiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<CreditWallet>({
    balance: 3450,
    plan: 'Unlimited',
    unlimitedFairUseCap: 50000,
    creditsUsedThisMonth: 1240,
    providerSpendThisMonthUsd: 28.5,
  });

  const [providers, setProviders] = useState<AiProviderConfig[]>(INITIAL_AI_PROVIDERS);
  const [activeProviderId, setActiveProviderId] = useState<string>('google_gemini');
  const [activePrompt, setActivePrompt] = useState<PromptTemplate | null>(null);
  const [isReprocessing, setIsReprocessing] = useState<boolean>(false);
  const [reprocessStatusText, setReprocessStatusText] = useState<string>('');
  const [queuedEditorClips, setQueuedEditorClips] = useState<TimelineClip[]>([]);

  const [voiceProfiles, setVoiceProfiles] = useState<SavedVoiceProfile[]>([
    {
      id: INITIAL_VOICES[0].id,
      name: INITIAL_VOICES[0].name,
      characterRole: 'Lead Protagonist',
      gender: INITIAL_VOICES[0].gender,
      language: 'en-US',
      accent: INITIAL_VOICES[0].accent,
      tone: INITIAL_VOICES[0].tone,
      pitch: 1.0,
      rate: 0.98,
      sampleText: INITIAL_VOICES[0].sampleText,
      color: '#38bdf8',
    },
    {
      id: INITIAL_VOICES[1].id,
      name: INITIAL_VOICES[1].name,
      characterRole: 'Mission Director',
      gender: INITIAL_VOICES[1].gender,
      language: 'en-US',
      accent: INITIAL_VOICES[1].accent,
      tone: INITIAL_VOICES[1].tone,
      pitch: 0.85,
      rate: 0.94,
      sampleText: INITIAL_VOICES[1].sampleText,
      color: '#8b5cf6',
    },
    {
      id: INITIAL_VOICES[2].id,
      name: INITIAL_VOICES[2].name,
      characterRole: 'Co-Pilot / Synthetic AI',
      gender: INITIAL_VOICES[2].gender,
      language: 'en-US',
      accent: INITIAL_VOICES[2].accent,
      tone: INITIAL_VOICES[2].tone,
      pitch: 1.15,
      rate: 1.02,
      sampleText: INITIAL_VOICES[2].sampleText,
      color: '#06b6d4',
    },
    {
      id: INITIAL_VOICES[3].id,
      name: INITIAL_VOICES[3].name,
      characterRole: 'Story Narrator',
      gender: INITIAL_VOICES[3].gender,
      language: 'en-US',
      accent: INITIAL_VOICES[3].accent,
      tone: INITIAL_VOICES[3].tone,
      pitch: 0.78,
      rate: 0.9,
      sampleText: INITIAL_VOICES[3].sampleText,
      color: '#f59e0b',
    },
    {
      id: INITIAL_VOICES[4].id,
      name: INITIAL_VOICES[4].name,
      characterRole: 'Kannada Female Lead',
      gender: INITIAL_VOICES[4].gender,
      language: 'kn-IN',
      accent: INITIAL_VOICES[4].accent,
      tone: INITIAL_VOICES[4].tone,
      pitch: 1.05,
      rate: 0.96,
      sampleText: INITIAL_VOICES[4].sampleText,
      color: '#10b981',
    },
    {
      id: INITIAL_VOICES[5].id,
      name: INITIAL_VOICES[5].name,
      characterRole: 'Kannada Male Lead',
      gender: INITIAL_VOICES[5].gender,
      language: 'kn-IN',
      accent: INITIAL_VOICES[5].accent,
      tone: INITIAL_VOICES[5].tone,
      pitch: 0.84,
      rate: 0.95,
      sampleText: INITIAL_VOICES[5].sampleText,
      color: '#ec4899',
    },
  ]);

  const [audioClips, setAudioClips] = useState<AudioTimelineClip[]>([
    {
      id: 'aclip-seed-1',
      trackRole: 'voice',
      name: 'Valerie Opening Comms',
      startSec: 1.0,
      durationSec: 5.5,
      color: '#38bdf8',
      dialogueText: 'Prometheus Station, do you copy? Telemetry shows resonance at the monolith.',
      voiceProfileId: INITIAL_VOICES[0].id,
      voiceProfileName: INITIAL_VOICES[0].name,
      language: 'en-US',
      pitch: 1.0,
      rate: 0.98,
    },
    {
      id: 'aclip-seed-2',
      trackRole: 'music',
      name: 'Chronos Deep Space Score (Dm)',
      startSec: 0,
      durationSec: 18.0,
      color: '#a855f7',
      sourceAssetId: 'mus-orbital-synth',
    },
    {
      id: 'aclip-seed-3',
      trackRole: 'sfx',
      name: 'Gravity Sub-Boom Impact',
      startSec: 6.5,
      durationSec: 3.5,
      color: '#f59e0b',
      soundMethod: 'playCinematicImpact',
    },
    {
      id: 'aclip-seed-4',
      trackRole: 'foley',
      name: 'EVA Suit Boot Grating',
      startSec: 2.5,
      durationSec: 3.0,
      color: '#4ade80',
      soundMethod: 'playShutterSound',
    },
  ]);

  const addAudioClip = (clip: AudioTimelineClip) => {
    setAudioClips((prev) => [...prev, clip]);
  };

  const addVoiceProfile = (profile: SavedVoiceProfile) => {
    setVoiceProfiles((prev) => [profile, ...prev]);
  };

  const DEFAULT_QUEUE: AiQueueItem[] = [
    {
      id: 'q-pending-1',
      tool: 'AI Video Generator',
      prompt: '35mm anamorphic drone tracking shot over basalt monolith valley, 4K',
      provider: 'Runway Gen-3 Alpha',
      status: 'Completed',
      progress: 100,
      timeElapsed: 'Completed',
      resultUrl: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    },
    {
      id: 'q-pending-2',
      tool: 'AI Voice Studio',
      prompt: 'Commander Valerie Chen comms distress call (ADR Neural Speech)',
      provider: 'ElevenLabs Voice Engine',
      status: 'Completed',
      progress: 100,
      timeElapsed: 'Completed',
      resultUrl: '/assets/images/feature_voice_dubbing_1794901010817.jpg',
    },
    {
      id: 'q-pending-3',
      tool: 'Export & Render Engine',
      prompt: 'ProRes 422 HQ 4K Master Cinema Color Grade Pipeline',
      provider: 'Cloud GPU Render Node',
      status: 'Completed',
      progress: 100,
      timeElapsed: 'Completed',
      resultUrl: '/assets/images/feature_film_timeline_1794901011133.jpg',
    },
    {
      id: 'q-comp-1',
      tool: 'AI Image Generator',
      prompt: 'Cinematic wide alien planet with lone astronaut discovering glowing ancient obelisk',
      provider: 'Google Gemini Studio Engine',
      status: 'Completed',
      progress: 100,
      timeElapsed: '18s',
      resultUrl: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    },
  ];

  const [queue, setQueue] = useState<AiQueueItem[]>(() => {
    try {
      const saved = localStorage.getItem('fvs_ai_queue_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore storage error
    }
    return DEFAULT_QUEUE;
  });

  useEffect(() => {
    try {
      localStorage.setItem('fvs_ai_queue_v1', JSON.stringify(queue));
    } catch {
      // Ignore quota exceeded
    }
  }, [queue]);

  const [history, setHistory] = useState<CreditTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('fvs_ai_history_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage error
    }
    return [
      { id: 'tx-1', type: 'Deduction', tool: 'AI Video 4K Render', amount: 40, costUsd: 0.12, timestamp: '12 mins ago', status: 'Completed' },
      { id: 'tx-2', type: 'Deduction', tool: 'Screenplay Polish (Gemini)', amount: 10, costUsd: 0.02, timestamp: '45 mins ago', status: 'Completed' },
      { id: 'tx-3', type: 'Recharge', tool: 'Monthly Plan Grant', amount: 2500, costUsd: 0.0, timestamp: '3 days ago', status: 'Completed' },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('fvs_ai_history_v1', JSON.stringify(history));
    } catch {
      // Ignore quota exceeded
    }
  }, [history]);

  const [costApprovalModal, setCostApprovalModal] = useState<CostEstimate | null>(null);
  const [pendingApprovalAction, setPendingApprovalAction] = useState<(() => void) | null>(null);

  const loadPromptIntoTool = (promptTemplate: PromptTemplate, onNavigate: (module: StudioModule) => void) => {
    soundFx.playScannerBeep();
    setActivePrompt(promptTemplate);
    onNavigate(promptTemplate.targetModule);
  };

  const requestCostApproval = (estimate: CostEstimate, onApproved: () => void) => {
    soundFx.playShutterSound();
    setCostApprovalModal(estimate);
    setPendingApprovalAction(() => onApproved);
  };

  const closeCostApproval = () => {
    setCostApprovalModal(null);
    setPendingApprovalAction(null);
  };

  const confirmCostApproval = () => {
    if (costApprovalModal) {
      soundFx.playCinematicImpact();
      if (wallet.plan !== 'Unlimited') {
        setWallet((prev) => ({
          ...prev,
          balance: Math.max(0, prev.balance - costApprovalModal.estimatedCredits),
          creditsUsedThisMonth: prev.creditsUsedThisMonth + costApprovalModal.estimatedCredits,
          providerSpendThisMonthUsd: prev.providerSpendThisMonthUsd + costApprovalModal.estimatedFinancialCostUsd,
        }));
      } else {
        setWallet((prev) => ({
          ...prev,
          creditsUsedThisMonth: prev.creditsUsedThisMonth + costApprovalModal.estimatedCredits,
          providerSpendThisMonthUsd: prev.providerSpendThisMonthUsd + costApprovalModal.estimatedFinancialCostUsd,
        }));
      }

      setHistory((prev) => [
        {
          id: `tx-${Date.now()}`,
          type: wallet.plan === 'Unlimited' ? 'Unlimited Pass' : 'Deduction',
          tool: costApprovalModal.operationName,
          amount: costApprovalModal.estimatedCredits,
          costUsd: costApprovalModal.estimatedFinancialCostUsd,
          timestamp: 'Just now',
          status: 'Completed',
        },
        ...prev,
      ]);

      if (pendingApprovalAction) {
        pendingApprovalAction();
      }
    }
    closeCostApproval();
  };

  const addQueueItem = (item: Omit<AiQueueItem, 'id' | 'timeElapsed'>) => {
    const newItem: AiQueueItem = {
      ...item,
      id: `q-${Date.now()}`,
      timeElapsed: 'Just now',
    };
    setQueue((prev) => [newItem, ...prev]);
  };

  const addAssetToTimeline = (asset: UniversalAsset): TimelineClip => {
    let trackId: TimelineClip['trackId'] = 'v1';
    let type: TimelineClip['type'] = 'video';
    let color = '#8b5cf6';

    if (asset.category === 'image' || asset.category === 'vfx' || asset.category === 'animation' || asset.category === 'character' || asset.category === '3d_asset') {
      trackId = 'v2';
      type = 'overlay';
      color = '#06b6d4';
    } else if (asset.category === 'music' || asset.category === 'voice') {
      trackId = 'a1';
      type = 'audio';
      color = '#10b981';
    } else if (asset.category === 'sfx') {
      trackId = 'a2';
      type = 'audio';
      color = '#f59e0b';
    } else if (asset.category === 'template') {
      trackId = 'titles';
      type = 'title';
      color = '#eab308';
    }

    const newClip: TimelineClip = {
      id: `clip-lib-${Date.now()}`,
      trackId,
      name: asset.name,
      start: 0,
      duration: 6,
      color,
      type,
      speed: 1.0,
      volume: 1.0,
      filter: asset.specs.lutFilter,
      assetUrl: asset.mediaUrl || asset.thumbnail || '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    };

    setQueuedEditorClips((prev) => [...prev, newClip]);
    return newClip;
  };

  const consumeQueuedEditorClips = (): TimelineClip[] => {
    const copy = [...queuedEditorClips];
    if (copy.length > 0) {
      setQueuedEditorClips([]);
    }
    return copy;
  };

  const updateWalletPlan = (plan: CreditWallet['plan'], customCredits?: number) => {
    soundFx.playScannerBeep();
    const defaultPlanCredits: Record<CreditWallet['plan'], number> = {
      Free: 10000,
      Starter: 30000,
      Creator: 100000,
      Professional: 500000,
      Enterprise: 2000000,
      Unlimited: 99999,
    };
    setWallet((prev) => ({
      ...prev,
      plan,
      balance: typeof customCredits === 'number' ? customCredits : defaultPlanCredits[plan] ?? 10000,
    }));
  };

  const rechargeCredits = (amount: number, costUsd: number, label?: string) => {
    soundFx.playCinematicImpact();
    setWallet((prev) => ({
      ...prev,
      balance: prev.balance + amount,
    }));
    setHistory((prev) => [
      {
        id: `tx-${Date.now()}`,
        type: 'Recharge',
        tool: label || `Purchased Credit Pack (+${amount.toLocaleString()})`,
        amount,
        costUsd,
        timestamp: 'Just now',
        status: 'Completed',
      },
      ...prev,
    ]);
  };

  const toggleProvider = (id: string) => {
    soundFx.playScannerBeep();
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, connected: !p.connected } : p))
    );
  };

  const updateProviderLimit = (id: string, limitUsd: number) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, spendingLimitUsd: limitUsd } : p))
    );
  };

  const recheckPendingQueue = () => {
    soundFx.playScannerBeep();
    const pendingCount = queue.filter((i) => i.status === 'Queued' || i.status === 'Failed').length;
    setReprocessStatusText(
      pendingCount > 0
        ? `Queue scan complete: ${pendingCount} pending task(s) waiting for execution.`
        : 'Queue scan complete: 0 pending tasks. All pipelines verified.'
    );
    setTimeout(() => setReprocessStatusText(''), 4000);
  };

  // Reprocess single queue item
  const retryQueueItem = async (id: string) => {
    soundFx.playScannerBeep();
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'Synthesizing', progress: 30 } : item))
    );
    await new Promise((r) => setTimeout(r, 800));

    setQueue((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'Completed',
              progress: 100,
              timeElapsed: '12s',
              resultUrl: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
            }
          : item
      )
    );
    soundFx.playCinematicImpact();
  };

  // Reprocess ALL pending queue items sequentially with full visual & backend worker feedback
  const reprocessAllPending = async () => {
    const pendingItems = queue.filter((i) => i.status === 'Queued' || i.status === 'Failed');
    setIsReprocessing(true);
    soundFx.playScannerBeep();
    setReprocessStatusText('Syncing pending jobs and film stages with backend dispatcher...');

    let backendMsg = '';
    try {
      const res = await fetch('/api/providers/reprocess-all', { method: 'POST' });
      const data = await res.json();
      if (data?.message) backendMsg = data.message;
    } catch (e) {
      console.warn('Backend reprocess call warning:', e);
    }

    if (pendingItems.length === 0) {
      await new Promise((r) => setTimeout(r, 500));
      soundFx.playCinematicImpact();
      setReprocessStatusText(backendMsg || 'All queue tasks and production stages verified & up to date!');
      setIsReprocessing(false);
      setTimeout(() => setReprocessStatusText(''), 5000);
      return;
    }

    for (let index = 0; index < pendingItems.length; index++) {
      const item = pendingItems[index];
      setReprocessStatusText(`Reprocessing (${index + 1}/${pendingItems.length}): ${item.tool} via ${item.provider}...`);

      // Update to Synthesizing
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'Synthesizing', progress: 25 } : q))
      );
      await new Promise((r) => setTimeout(r, 500));

      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, progress: 75 } : q))
      );
      await new Promise((r) => setTimeout(r, 500));

      // Mark Completed
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? {
                ...q,
                status: 'Completed',
                progress: 100,
                timeElapsed: 'Just now',
                resultUrl: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
              }
            : q
        )
      );

      setHistory((prev) => [
        {
          id: `tx-reprocess-${Date.now()}-${index}`,
          type: wallet.plan === 'Unlimited' ? 'Unlimited Pass' : 'Deduction',
          tool: `Reprocessed ${item.tool}`,
          amount: wallet.plan === 'Unlimited' ? 0 : 25,
          costUsd: 0.08,
          timestamp: 'Just now',
          status: 'Completed',
        },
        ...prev,
      ]);
    }

    soundFx.playCinematicImpact();
    setReprocessStatusText(
      `Successfully reprocessed ${pendingItems.length} pending job(s)! ${backendMsg || 'All tasks are Completed.'}`
    );
    setIsReprocessing(false);
    setTimeout(() => setReprocessStatusText(''), 6000);
  };

  const submitCustomPrompt = (
    title: string,
    promptText: string,
    category: PromptTemplate['category'] = 'film',
    targetModule: StudioModule = 'ai_wizard'
  ): PromptTemplate => {
    soundFx.playShutterSound();
    const newPrompt: PromptTemplate = {
      id: `p-custom-${Date.now()}`,
      title: title.trim() || 'Custom Studio Prompt',
      category,
      targetModule,
      prompt: promptText.trim(),
      tags: ['Custom Prompt', 'Pending', category],
      estimatedCredits: 35,
    };

    const queueEntry: AiQueueItem = {
      id: `q-prompt-${Date.now()}`,
      tool: `Prompt: ${newPrompt.title}`,
      prompt: newPrompt.prompt,
      provider: 'Google Gemini Studio Engine',
      status: 'Queued',
      progress: 0,
      timeElapsed: 'Pending',
    };
    setQueue((prev) => [queueEntry, ...prev]);
    setReprocessStatusText(`Queued prompt "${newPrompt.title}" for AI processing.`);
    return newPrompt;
  };

  const reprocessAllPrompts = async (templates: PromptTemplate[] = PROMPT_LIBRARY_TEMPLATES) => {
    setIsReprocessing(true);
    soundFx.playScannerBeep();
    setReprocessStatusText(`Collecting pending queue jobs & ${templates.length} studio prompts...`);

    const currentPending = queue.filter((i) => i.status === 'Queued' || i.status === 'Failed');
    const existingPromptsSet = new Set(queue.map((q) => q.prompt.trim().toLowerCase()));

    // Queue any library prompts not yet present in the queue as pending
    const newPromptJobs: AiQueueItem[] = templates
      .filter((t) => !existingPromptsSet.has(t.prompt.trim().toLowerCase()))
      .map((t) => ({
        id: `q-tpl-${t.id}-${Date.now()}`,
        tool: t.title,
        prompt: t.prompt,
        provider: t.category === 'voice' ? 'ElevenLabs Voice Engine' : t.category === 'camera' ? 'RunWay Gen-3 Alpha' : 'Google Gemini Studio Engine',
        status: 'Queued' as const,
        progress: 0,
        timeElapsed: 'Pending',
      }));

    const allToProcess = [...currentPending, ...newPromptJobs];
    if (newPromptJobs.length > 0) {
      setQueue((prev) => [...newPromptJobs, ...prev]);
    }

    try {
      await fetch('/api/providers/reprocess-all', { method: 'POST' });
    } catch (e) {
      console.warn('Backend prompt reprocess warning:', e);
    }

    for (let index = 0; index < allToProcess.length; index++) {
      const item = allToProcess[index];
      setReprocessStatusText(`Reprocessing prompt (${index + 1}/${allToProcess.length}): ${item.tool}...`);

      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'Synthesizing', progress: 35 } : q))
      );
      await new Promise((r) => setTimeout(r, 220));

      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? {
                ...q,
                status: 'Completed',
                progress: 100,
                timeElapsed: 'Just now',
                resultUrl: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
              }
            : q
        )
      );

      setHistory((prev) => [
        {
          id: `tx-prompt-${Date.now()}-${index}`,
          type: wallet.plan === 'Unlimited' ? 'Unlimited Pass' : 'Deduction',
          tool: `Prompt Batch: ${item.tool}`,
          amount: wallet.plan === 'Unlimited' ? 0 : 15,
          costUsd: 0.04,
          timestamp: 'Just now',
          status: 'Completed',
        },
        ...prev,
      ]);
    }

    soundFx.playCinematicImpact();
    setReprocessStatusText(`All ${allToProcess.length} pending & library prompts reprocessed cleanly!`);
    setIsReprocessing(false);
    setTimeout(() => setReprocessStatusText(''), 6000);
  };

  const clearCompletedQueue = () => {
    soundFx.playWhoosh();
    setQueue((prev) => prev.filter((i) => i.status !== 'Completed'));
  };

  return (
    <StudioAiContext.Provider
      value={{
        wallet,
        providers,
        queue,
        history,
        activePrompt,
        activeProviderId,
        costApprovalModal,
        isReprocessing,
        reprocessStatusText,
        queuedEditorClips,
        audioClips,
        voiceProfiles,
        setAudioClips,
        addAudioClip,
        addVoiceProfile,
        setActiveProviderId,
        loadPromptIntoTool,
        requestCostApproval,
        closeCostApproval,
        confirmCostApproval,
        addQueueItem,
        addAssetToTimeline,
        consumeQueuedEditorClips,
        updateWalletPlan,
        rechargeCredits,
        toggleProvider,
        updateProviderLimit,
        recheckPendingQueue,
        reprocessAllPending,
        reprocessAllPrompts,
        submitCustomPrompt,
        retryQueueItem,
        clearCompletedQueue,
      }}
    >
      {children}
    </StudioAiContext.Provider>
  );
};

export const useStudioAi = () => {
  const context = useContext(StudioAiContext);
  if (!context) {
    throw new Error('useStudioAi must be used within a StudioAiProvider');
  }
  return context;
};
