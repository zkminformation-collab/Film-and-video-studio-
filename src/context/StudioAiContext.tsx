import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  AiProviderConfig, 
  CreditWallet, 
  CreditTransaction, 
  CostEstimate, 
  AiQueueItem, 
  PromptTemplate,
  StudioModule
} from '../types';
import { INITIAL_AI_PROVIDERS, PROMPT_LIBRARY_TEMPLATES } from '../data/promptLibraryData';
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
  setActiveProviderId: (id: string) => void;
  loadPromptIntoTool: (prompt: PromptTemplate, onNavigate: (module: StudioModule) => void) => void;
  requestCostApproval: (estimate: CostEstimate, onApproved: () => void) => void;
  closeCostApproval: () => void;
  confirmCostApproval: () => void;
  addQueueItem: (item: Omit<AiQueueItem, 'id' | 'timeElapsed'>) => void;
  updateWalletPlan: (plan: CreditWallet['plan']) => void;
  rechargeCredits: (amount: number, costUsd: number) => void;
  toggleProvider: (id: string) => void;
  updateProviderLimit: (id: string, limitUsd: number) => void;
  reprocessAllPending: () => Promise<void>;
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

  const [queue, setQueue] = useState<AiQueueItem[]>([
    {
      id: 'q-pending-1',
      tool: 'AI Video Generator',
      prompt: '35mm anamorphic drone tracking shot over basalt monolith valley, 4K',
      provider: 'Runway Gen-3 Alpha',
      status: 'Queued',
      progress: 0,
      timeElapsed: 'Pending',
    },
    {
      id: 'q-pending-2',
      tool: 'AI Voice Studio',
      prompt: 'Commander Valerie Chen comms distress call (ADR Neural Speech)',
      provider: 'ElevenLabs Voice Engine',
      status: 'Queued',
      progress: 0,
      timeElapsed: 'Pending',
    },
    {
      id: 'q-pending-3',
      tool: 'Export & Render Engine',
      prompt: 'ProRes 422 HQ 4K Master Cinema Color Grade Pipeline',
      provider: 'Cloud GPU Render Node',
      status: 'Queued',
      progress: 0,
      timeElapsed: 'Pending',
    },
    {
      id: 'q-comp-1',
      tool: 'AI Image Generator',
      prompt: 'Cinematic wide alien planet with lone astronaut discovering glowing ancient obelisk',
      provider: 'Google Gemini Studio Engine',
      status: 'Completed',
      progress: 100,
      timeElapsed: '18s',
      resultUrl: '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    },
  ]);

  const [history, setHistory] = useState<CreditTransaction[]>([
    { id: 'tx-1', type: 'Deduction', tool: 'AI Video 4K Render', amount: 40, costUsd: 0.12, timestamp: '12 mins ago', status: 'Completed' },
    { id: 'tx-2', type: 'Deduction', tool: 'Screenplay Polish (Gemini)', amount: 10, costUsd: 0.02, timestamp: '45 mins ago', status: 'Completed' },
    { id: 'tx-3', type: 'Recharge', tool: 'Monthly Plan Grant', amount: 2500, costUsd: 0.0, timestamp: '3 days ago', status: 'Completed' },
  ]);

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

  const updateWalletPlan = (plan: CreditWallet['plan']) => {
    soundFx.playScannerBeep();
    setWallet((prev) => ({
      ...prev,
      plan,
      balance: plan === 'Unlimited' ? 99999 : plan === 'Professional' ? 10000 : plan === 'Creator' ? 2500 : 250,
    }));
  };

  const rechargeCredits = (amount: number, costUsd: number) => {
    soundFx.playCinematicImpact();
    setWallet((prev) => ({
      ...prev,
      balance: prev.balance + amount,
    }));
    setHistory((prev) => [
      {
        id: `tx-${Date.now()}`,
        type: 'Recharge',
        tool: `Purchased Credit Pack (+${amount.toLocaleString()})`,
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

  // Reprocess single queue item
  const retryQueueItem = async (id: string) => {
    soundFx.playScannerBeep();
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'Synthesizing', progress: 30 } : item))
    );
    await new Promise((r) => setTimeout(r, 800));

    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'Completed', progress: 100, timeElapsed: '12s' } : item))
    );
    soundFx.playCinematicImpact();
  };

  // Reprocess ALL pending queue items sequentially with full visual & worker feedback
  const reprocessAllPending = async () => {
    const pendingItems = queue.filter((i) => i.status === 'Queued' || i.status === 'Failed');
    if (pendingItems.length === 0) {
      soundFx.playScannerBeep();
      setReprocessStatusText('All tasks are already completed! Queue clean.');
      setTimeout(() => setReprocessStatusText(''), 3000);
      return;
    }

    setIsReprocessing(true);
    soundFx.playScannerBeep();

    try {
      await fetch('/api/providers/reprocess-all', { method: 'POST' });
    } catch (e) {
      console.warn('Backend reprocess call warning:', e);
    }

    for (let index = 0; index < pendingItems.length; index++) {
      const item = pendingItems[index];
      setReprocessStatusText(`Reprocessing (${index + 1}/${pendingItems.length}): ${item.tool} via ${item.provider}...`);

      // Update to Synthesizing
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'Synthesizing', progress: 25 } : q))
      );
      await new Promise((r) => setTimeout(r, 600));

      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, progress: 75 } : q))
      );
      await new Promise((r) => setTimeout(r, 600));

      // Mark Completed
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? {
                ...q,
                status: 'Completed',
                progress: 100,
                timeElapsed: 'Just now',
                resultUrl: '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
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
    setReprocessStatusText(`Successfully reprocessed ${pendingItems.length} pending jobs! All tasks are Completed.`);
    setIsReprocessing(false);
    setTimeout(() => setReprocessStatusText(''), 5000);
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
        setActiveProviderId,
        loadPromptIntoTool,
        requestCostApproval,
        closeCostApproval,
        confirmCostApproval,
        addQueueItem,
        updateWalletPlan,
        rechargeCredits,
        toggleProvider,
        updateProviderLimit,
        reprocessAllPending,
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
