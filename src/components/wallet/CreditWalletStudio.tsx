import React, { useCallback, useEffect, useState } from 'react';
import {
  Coins,
  CreditCard,
  ShieldCheck,
  Check,
  Calculator,
  CheckCircle2,
  Smartphone,
  Building2,
  Receipt,
  Download,
  X,
  AlertCircle,
  Lock,
  Sparkles,
  FileText,
  Sliders,
  XCircle,
  UserCheck,
  RefreshCw,
  Clock,
  Tag,
  History,
} from 'lucide-react';
import { StudioTheme } from '../../types';
import { useStudioAi } from '../../context/StudioAiContext';
import { useAuth, SubscriptionPlanName } from '../../context/AuthContext';
import { soundFx } from '../../utils/audioSynth';

export type PricingPlanId = string;
export type BillingCycle = 'monthly' | 'yearly';
export type RazorpayPaymentMethod = 'upi' | 'card' | 'netbanking';

interface PlanFeatureAccess {
  aiVoice: boolean;
  musicSfx: boolean;
  aiVideo: boolean;
  manhwaStudio: boolean;
  aiFilmMaker: boolean;
  export4k: boolean;
}

interface PricingPlanConfig {
  id: PricingPlanId;
  name: string;
  tagline: string;
  monthlyPriceInr: number;
  yearlyPriceInr: number;
  monthlyCredits: number;
  creditExpiryDays?: number;
  discountPercent?: number;
  enabled?: boolean;
  features: string[];
  featureAccess?: PlanFeatureAccess;
  highlighted?: boolean;
}

interface CreditPackConfig {
  id: string;
  name: string;
  credits: number;
  priceInr: number;
  discountPercent?: number;
  creditExpiryDays?: number;
  enabled?: boolean;
  bonusLabel?: string;
}

interface CreditTransactionRecord {
  id: string;
  userId: string;
  userEmail: string;
  type:
    | 'payment_subscription'
    | 'payment_credits'
    | 'admin_add'
    | 'admin_deduct'
    | 'promo_grant'
    | 'free_activation';
  creditsDelta: number;
  description: string;
  referenceId: string;
  performedBy: string;
  expiresAt?: string;
  createdAt: string;
}

interface BillingPaymentRecord {
  id: string;
  invoiceId: string;
  orderId: string;
  paymentId: string;
  purchaseType: 'subscription' | 'credits';
  planId?: PricingPlanId;
  itemName: string;
  creditsGranted: number;
  amountInr: number;
  taxInr: number;
  subtotalInr: number;
  currency: 'INR';
  method: RazorpayPaymentMethod | 'free_tier';
  mode: 'live' | 'test';
  status: 'captured' | 'failed';
  createdAt: string;
}

interface UserSubscriptionRecord {
  id: string;
  userId: string;
  planId: PricingPlanId;
  planName?: string;
  billingCycle: BillingCycle;
  status: 'active' | 'cancelled';
  cancelAtPeriodEnd: boolean;
  amountInr: number;
  monthlyCredits: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

interface ActiveOrderSession {
  orderId: string;
  itemName: string;
  amountInr: number;
  amountPaise: number;
  creditsToGrant: number;
  purchaseType: 'subscription' | 'credits';
  planId?: PricingPlanId;
  billingCycle?: BillingCycle;
  mode: 'live' | 'test';
}

function getDiscountedInr(baseInr: number, discountPct?: number): number {
  const clean = Math.max(0, Math.round(Number(baseInr) || 0));
  if (clean === 0) return 0;
  const pct = Math.max(0, Math.min(90, Number(discountPct || 0)));
  if (pct <= 0) return clean;
  return Math.max(1, Math.round(clean * (1 - pct / 100)));
}

interface CreditWalletStudioProps {
  theme?: StudioTheme;
  initialSection?: 'my-credits' | 'buy-credits' | 'my-subscription' | null;
  onOpenAdmin?: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, cb: (res: any) => void) => void;
    };
  }
}

function loadRazorpayCheckoutScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export const CreditWalletStudio: React.FC<CreditWalletStudioProps> = ({
  theme = 'elevenlabs',
  initialSection = null,
  onOpenAdmin,
}) => {
  const isLight = theme === 'elevenlabs';
  const { wallet, updateWalletPlan, rechargeCredits } = useStudioAi();
  const { firebaseUser, account, isAdmin, openAuthModal, applyVerifiedBillingUpdate } = useAuth();

  const effectiveUserId = firebaseUser?.uid || 'guest_studio_user';
  const effectiveEmail = firebaseUser?.email || account?.email || 'creator@filmvideostudio.local';
  const effectiveName = account?.displayName || firebaseUser?.displayName || 'Studio Creator';

  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [plans, setPlans] = useState<PricingPlanConfig[]>([]);
  const [creditPacks, setCreditPacks] = useState<CreditPackConfig[]>([]);
  const [payments, setPayments] = useState<BillingPaymentRecord[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransactionRecord[]>([]);
  const [activeSub, setActiveSub] = useState<UserSubscriptionRecord | null>(null);
  const [razorpayMode, setRazorpayMode] = useState<'live' | 'test'>('test');
  const [razorpayConfigured, setRazorpayConfigured] = useState(false);
  const [loadingState, setLoadingState] = useState<boolean>(true);

  const [isCreatingOrder, setIsCreatingOrder] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isCancellingSub, setIsCancellingSub] = useState<boolean>(false);
  const [confirmCancelSub, setConfirmCancelSub] = useState<boolean>(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Hosted Razorpay Test Checkout Modal State (no card/bank form inputs stored on site)
  const [checkoutOrder, setCheckoutOrder] = useState<ActiveOrderSession | null>(null);
  const [checkoutMethod, setCheckoutMethod] = useState<RazorpayPaymentMethod>('upi');
  const [checkoutAppLabel, setCheckoutAppLabel] = useState<string>('Google Pay / PhonePe / UPI');
  const [simulateFailure, setSimulateFailure] = useState<boolean>(false);
  const [showEstimator, setShowEstimator] = useState<boolean>(false);

  // In-App Invoice Viewer Modal
  const [invoicePreview, setInvoicePreview] = useState<BillingPaymentRecord | null>(null);

  // Interactive 20-Minute Film Cost Calculator State
  const [calcScenes, setCalcScenes] = useState<number>(100);
  const [calcDurationMin, setCalcDurationMin] = useState<number>(20);
  const [calcResolution, setCalcResolution] = useState<'1080p' | '4K DCI'>('4K DCI');
  const [calcVoiceMinutes, setCalcVoiceMinutes] = useState<number>(16);
  const [calcMusicTracks] = useState<number>(6);

  const fetchBillingState = useCallback(async () => {
    try {
      const res = await fetch(`/api/payments/state?userId=${encodeURIComponent(effectiveUserId)}`);
      const data = await res.json();
      if (data?.success) {
        if (Array.isArray(data.plans)) setPlans(data.plans);
        if (Array.isArray(data.creditPacks)) setCreditPacks(data.creditPacks);
        if (Array.isArray(data.payments)) setPayments(data.payments);
        if (Array.isArray(data.creditTransactions)) setCreditTransactions(data.creditTransactions);
        setActiveSub(data.activeSubscription || null);
        if (data.razorpay?.mode) setRazorpayMode(data.razorpay.mode);
        setRazorpayConfigured(Boolean(data.razorpay?.configured));
      }
    } catch (err) {
      console.warn('Unable to load billing state:', err);
    } finally {
      setLoadingState(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    void fetchBillingState();
  }, [fetchBillingState]);

  useEffect(() => {
    if (!initialSection) return;
    const targetId =
      initialSection === 'my-credits'
        ? 'my-credits'
        : initialSection === 'buy-credits'
        ? 'buy-credits'
        : 'upgrade-plan';
    const timer = setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [initialSection]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 6500);
  };

  const applyVerifiedGrantLocallyAndCloud = async (grant: {
    purchaseType: 'subscription' | 'credits';
    planId?: PricingPlanId;
    billingCycle?: BillingCycle;
    creditsToAdd?: number;
    setMonthlyCredits?: number;
    itemName?: string;
    amountInr?: number;
  }) => {
    if (grant.purchaseType === 'subscription' && grant.planId) {
      const targetCredits = grant.setMonthlyCredits ?? grant.creditsToAdd ?? 10000;
      updateWalletPlan(grant.planId, targetCredits);
      if (firebaseUser && account) {
        await applyVerifiedBillingUpdate({
          plan: grant.planId as SubscriptionPlanName,
          setCreditsTo: targetCredits,
          tool: 'Razorpay Subscription',
          summary: `Verified ${grant.planId} (${grant.billingCycle || 'monthly'}) · ₹${grant.amountInr ?? 0}`,
        });
      }
    } else if (grant.creditsToAdd && grant.creditsToAdd > 0) {
      const approxUsd = Number(((grant.amountInr || 0) / 84).toFixed(2));
      rechargeCredits(grant.creditsToAdd, approxUsd, grant.itemName);
      if (firebaseUser && account) {
        await applyVerifiedBillingUpdate({
          creditsToAdd: grant.creditsToAdd,
          tool: 'Razorpay Credit Pack',
          summary: `Verified +${grant.creditsToAdd.toLocaleString()} credits · ₹${grant.amountInr ?? 0}`,
        });
      }
    }
  };

  const verifyPaymentWithBackend = async (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    method: RazorpayPaymentMethod;
  }) => {
    setIsVerifying(true);
    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        throw new Error(data?.error || 'Payment verification failed on server.');
      }

      if (data.grant) {
        await applyVerifiedGrantLocallyAndCloud({
          ...data.grant,
          itemName: data.payment?.itemName,
          amountInr: data.payment?.amountInr,
        });
      }

      if (Array.isArray(data.payments)) setPayments(data.payments);
      if (Array.isArray(data.creditTransactions)) setCreditTransactions(data.creditTransactions);
      if (data.subscription !== undefined) setActiveSub(data.subscription);

      soundFx.playCinematicImpact();
      setCheckoutOrder(null);
      showToast(
        'success',
        `Payment verified! Invoice ${data.payment?.invoiceId || ''} issued and ${Number(
          data.payment?.creditsGranted || 0
        ).toLocaleString()} credits synced.`
      );
    } catch (err: any) {
      showToast('error', err?.message || 'Payment signature verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePayNow = async (opts: {
    purchaseType: 'subscription' | 'credits';
    planId?: PricingPlanId;
    packId?: string;
  }) => {
    soundFx.playScannerBeep();
    const loadingKey = opts.planId || opts.packId || 'order';
    setIsCreatingOrder(loadingKey);

    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: effectiveUserId,
          userEmail: effectiveEmail,
          userName: effectiveName,
          purchaseType: opts.purchaseType,
          planId: opts.planId,
          packId: opts.packId,
          billingCycle,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Unable to initiate Razorpay order.');
      }

      // Handle ₹0 Free Tier Instant Switch
      if (data.freeActivation && data.grant) {
        await applyVerifiedGrantLocallyAndCloud(data.grant);
        if (data.subscription) setActiveSub(data.subscription);
        if (Array.isArray(data.creditTransactions)) setCreditTransactions(data.creditTransactions);
        showToast('success', 'Switched to Free Plan with monthly studio credits.');
        return;
      }

      const order = data.order as ActiveOrderSession;

      if (data.razorpay?.configured) {
        const loaded = await loadRazorpayCheckoutScript();
        if (!loaded || !window.Razorpay) {
          throw new Error('Could not load Razorpay Checkout SDK.');
        }

        const rzp = new window.Razorpay({
          key: data.razorpay.keyId,
          amount: order.amountPaise,
          currency: 'INR',
          name: 'ZKMAP STUDIO',
          description: order.itemName,
          order_id: order.orderId,
          prefill: {
            name: effectiveName,
            email: effectiveEmail,
          },
          theme: {
            color: '#111111',
          },
          handler: (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            void verifyPaymentWithBackend({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              method: 'upi',
            });
          },
        });
        rzp.on('payment.failed', (failRes: any) => {
          showToast(
            'error',
            failRes?.error?.description || 'Razorpay payment failed. Credits were not issued.'
          );
        });
        rzp.open();
        return;
      }

      // Test Mode Checkout Modal
      setSimulateFailure(false);
      setCheckoutOrder(order);
    } catch (err: any) {
      showToast('error', err?.message || 'Order creation failed.');
    } finally {
      setIsCreatingOrder(null);
    }
  };

  const handleConfirmTestCheckout = async () => {
    if (!checkoutOrder) return;
    setIsVerifying(true);
    try {
      const gwRes = await fetch('/api/payments/test-gateway-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: checkoutOrder.orderId,
          method: checkoutMethod,
          simulateFailure,
        }),
      });
      const gwData = await gwRes.json();

      if (!gwRes.ok || !gwData.success) {
        setCheckoutOrder(null);
        showToast(
          'error',
          gwData?.error?.description || 'Test payment declined. No credits were added.'
        );
        return;
      }

      await verifyPaymentWithBackend({
        razorpay_order_id: gwData.razorpay_order_id,
        razorpay_payment_id: gwData.razorpay_payment_id,
        razorpay_signature: gwData.razorpay_signature,
        method: checkoutMethod,
      });
    } catch (err: any) {
      showToast('error', err?.message || 'Test checkout error.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsCancellingSub(true);
    try {
      const res = await fetch('/api/payments/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: effectiveUserId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Could not cancel subscription.');
      }
      setActiveSub(data.subscription);
      setConfirmCancelSub(false);
      showToast(
        'success',
        'Auto-renewal cancelled. Your existing credits remain active through the current period.'
      );
    } catch (err: any) {
      showToast('error', err?.message || 'Cancellation failed.');
    } finally {
      setIsCancellingSub(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/payments/invoice/${encodeURIComponent(invoiceId)}`);
      if (!res.ok) throw new Error('Invoice file not found.');
      const html = await res.text();
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceId}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      showToast('error', err?.message || 'Unable to download invoice.');
    }
  };

  const displayedCredits = account ? account.creditsRemaining : wallet.balance;
  const displayedPlan = activeSub?.planId || account?.plan || wallet.plan;

  // Calculator math
  const creditPerShot = calcResolution === '4K DCI' ? 30 : 15;
  const totalVideoCredits = calcScenes * creditPerShot;
  const voiceCredits = calcVoiceMinutes * 20;
  const musicCredits = calcMusicTracks * 40;
  const totalCreditsNeeded = totalVideoCredits + voiceCredits + musicCredits;
  const totalProviderUsd =
    calcScenes * (calcResolution === '4K DCI' ? 0.35 : 0.2) +
    calcVoiceMinutes * 0.15 +
    calcMusicTracks * 0.4;

  const surfaceBg = isLight ? 'bg-white text-neutral-950' : 'bg-[#090b11] text-slate-100';
  const cardBg = isLight
    ? 'bg-[#FAFAFB] border-neutral-200 text-neutral-950'
    : 'bg-[#0d111c] border-slate-800 text-slate-100';
  const innerCardBg = isLight
    ? 'bg-white border-neutral-200 text-neutral-950'
    : 'bg-[#090b11] border-slate-800 text-slate-100';
  const mutedText = isLight ? 'text-neutral-500' : 'text-slate-400';

  return (
    <div className={`flex-1 overflow-y-auto p-6 lg:p-8 ${surfaceBg}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header Bar */}
        <div
          className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 ${
            isLight ? 'border-neutral-200' : 'border-slate-800'
          }`}
        >
          <div className="space-y-1">
            <div className={`flex items-center gap-2 text-xs ${mutedText}`}>
              <span>Credits, Subscriptions &amp; Razorpay Billing</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-cinema">
                {razorpayMode === 'live' ? 'Razorpay Live Gateway' : razorpayConfigured ? 'Razorpay Test Checkout' : 'Simulated Checkout'}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Pricing Plans &amp; Credit Wallet
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {!firebaseUser ? (
              <button
                type="button"
                onClick={openAuthModal}
                className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  isLight
                    ? 'bg-white border-neutral-300 hover:bg-neutral-50 text-neutral-900'
                    : 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Sign In to Sync Cloud Credits</span>
              </button>
            ) : (
              <div
                className={`px-3 py-2 rounded-xl border text-xs flex items-center gap-2 ${
                  isLight
                    ? 'bg-[#FAFAFB] border-neutral-200 text-neutral-700'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="truncate max-w-[180px]">{effectiveEmail}</span>
              </div>
            )}

            {isAdmin && onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  isLight
                    ? 'bg-neutral-950 hover:bg-black text-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                }`}
                title="Authorized Studio Administrator Price Config"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Admin Price Config</span>
                <Lock className="w-3 h-3 opacity-80" />
              </button>
            )}
          </div>
        </div>

        {/* Status Toast */}
        {notice && (
          <div
            className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 ${
              notice.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {notice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{notice.text}</span>
            </div>
            <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss alert">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Simple Dashboard Top Grid: My Credits & My Plan */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* My Credits */}
          <div id="my-credits" className={`lg:col-span-6 border rounded-2xl p-6 flex flex-col justify-between gap-4 ${cardBg}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>
                  My Credits
                </span>
                <div className="text-4xl font-bold font-mono-cinema tabular-nums flex items-center gap-3 pt-1">
                  <Coins className="w-8 h-8 text-amber-500 shrink-0" />
                  <span>{displayedCredits.toLocaleString()}</span>
                  <span className={`text-sm font-normal ${mutedText}`}>Credits</span>
                </div>
              </div>

              <a
                href="#buy-credits"
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                  isLight
                    ? 'bg-neutral-950 hover:bg-black text-white'
                    : 'bg-white hover:bg-slate-200 text-black'
                }`}
              >
                Buy Credits
              </a>
            </div>

            <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${mutedText}`}>
              <span>UPI, Google Pay, PhonePe, Cards &amp; Netbanking via Razorpay Checkout</span>
              <span aria-hidden="true">·</span>
              <span>Auto-verified before credits are added</span>
            </div>
          </div>

          {/* My Plan */}
          <div id="my-subscription" className={`lg:col-span-6 border rounded-2xl p-6 flex flex-col justify-between gap-4 ${cardBg}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>
                  My Plan
                </span>
                <div className="text-xl font-bold flex items-center gap-2.5 pt-0.5">
                  <span>
                    {activeSub ? `${activeSub.planId} (${activeSub.billingCycle})` : `${displayedPlan} Plan`}
                  </span>
                  {activeSub && (
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                        activeSub.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {activeSub.status === 'active' ? 'Active' : 'Cancels at period end'}
                    </span>
                  )}
                </div>
              </div>

              <a
                href="#upgrade-plan"
                className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap ${innerCardBg}`}
              >
                Upgrade Plan
              </a>
            </div>

            {activeSub ? (
              <div className="space-y-2.5">
                <div className={`text-xs tabular-nums flex items-center justify-between ${mutedText}`}>
                  <span>Current Cycle Ends:</span>
                  <span className={isLight ? 'text-neutral-900 font-medium' : 'text-slate-200 font-medium'}>
                    {new Date(activeSub.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>

                {activeSub.status === 'active' &&
                  activeSub.planId !== 'Free' &&
                  (confirmCancelSub ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isCancellingSub}
                        onClick={() => void handleCancelSubscription()}
                        className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors"
                      >
                        {isCancellingSub ? 'Cancelling...' : 'Confirm Cancel'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmCancelSub(false)}
                        className={`py-2 px-3 rounded-xl border text-xs font-medium ${innerCardBg}`}
                      >
                        Keep Plan
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmCancelSub(true)}
                      className={`w-full py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                        isLight
                          ? 'bg-white border-neutral-200 hover:border-rose-300 hover:text-rose-700 text-neutral-700'
                          : 'bg-slate-900 border-slate-700 hover:border-rose-500 text-slate-300'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel Subscription Renewal</span>
                    </button>
                  ))}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className={mutedText}>Select any plan or credit bundle and click Pay Now.</span>
                <a href="#payment-history" className="font-semibold hover:underline shrink-0">
                  Payment History &darr;
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Upgrade Plan Section */}
        <section id="upgrade-plan" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Upgrade Plan (Monthly &amp; Yearly)</h2>
              <p className={`text-xs ${mutedText}`}>
                Simple subscription plans with automatic monthly credit allowance. Pay directly via Razorpay Checkout.
              </p>
            </div>

            {/* Monthly / Yearly Segmented Control */}
            <div
              className={`inline-flex items-center p-1 rounded-xl border self-start ${
                isLight ? 'bg-neutral-100 border-neutral-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  billingCycle === 'monthly'
                    ? isLight
                      ? 'bg-white text-neutral-950 shadow-sm'
                      : 'bg-slate-800 text-white'
                    : mutedText
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  billingCycle === 'yearly'
                    ? isLight
                      ? 'bg-white text-neutral-950 shadow-sm'
                      : 'bg-slate-800 text-white'
                    : mutedText
                }`}
              >
                Yearly (Save ~17%)
              </button>
            </div>
          </div>

          {loadingState && plans.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className={`h-72 rounded-2xl border animate-pulse ${cardBg}`} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {plans
                .filter((p) => p.enabled !== false)
                .map((plan) => {
                  const basePrice =
                    billingCycle === 'yearly' ? plan.yearlyPriceInr : plan.monthlyPriceInr;
                  const discountPct = Math.max(0, Math.min(90, Number(plan.discountPercent || 0)));
                  const price = getDiscountedInr(basePrice, discountPct);
                  const isCurrent = displayedPlan === plan.id || displayedPlan === plan.name;
                  const busy = isCreatingOrder === plan.id;

                  return (
                    <div
                      key={plan.id}
                      className={`rounded-2xl border p-5 flex flex-col justify-between gap-5 transition-colors ${
                        plan.highlighted
                          ? isLight
                            ? 'bg-[#FAFAFB] border-neutral-950 shadow-sm'
                            : 'bg-[#111625] border-purple-500'
                          : innerCardBg
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-bold">{plan.name}</h3>
                          {discountPct > 0 ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                              <Tag className="w-2.5 h-2.5" />
                              {discountPct}% OFF
                            </span>
                          ) : (
                            plan.highlighted && (
                              <span className={`text-[11px] font-medium ${mutedText}`}>Popular</span>
                            )
                          )}
                        </div>

                        <div className="flex items-baseline gap-1.5 font-mono-cinema tabular-nums flex-wrap">
                          <span className="text-2xl font-bold">
                            ₹{price.toLocaleString('en-IN')}
                          </span>
                          {discountPct > 0 && basePrice > price && (
                            <span className={`text-xs line-through ${mutedText}`}>
                              ₹{basePrice.toLocaleString('en-IN')}
                            </span>
                          )}
                          <span className={`text-xs ${mutedText}`}>
                            /{billingCycle === 'yearly' ? 'yr' : 'mo'}
                          </span>
                        </div>

                        <div className="space-y-0.5">
                          <div className="text-xs font-mono-cinema font-semibold text-emerald-600 tabular-nums">
                            {plan.monthlyCredits.toLocaleString()} credits / mo
                          </div>
                          <div className={`text-[11px] flex items-center gap-1 ${mutedText}`}>
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>
                              {plan.creditExpiryDays && plan.creditExpiryDays > 0
                                ? `Credits valid for ${plan.creditExpiryDays} days`
                                : 'Credits never expire'}
                            </span>
                          </div>
                        </div>

                        <p className={`text-xs leading-relaxed ${mutedText}`}>{plan.tagline}</p>

                        <ul
                          className={`space-y-2 pt-3 border-t text-xs ${
                            isLight ? 'border-neutral-200 text-neutral-700' : 'border-slate-800 text-slate-300'
                          }`}
                        >
                          {plan.features.map((feat) => (
                            <li key={feat} className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>

                        {plan.featureAccess && (
                          <div
                            className={`pt-2.5 border-t grid grid-cols-2 gap-1.5 text-[11px] ${
                              isLight ? 'border-neutral-200' : 'border-slate-800'
                            }`}
                          >
                            {[
                              { key: 'aiVoice' as const, label: 'AI Voice' },
                              { key: 'musicSfx' as const, label: 'Music & SFX' },
                              { key: 'aiVideo' as const, label: 'AI Video' },
                              { key: 'manhwaStudio' as const, label: 'Manhwa' },
                              { key: 'aiFilmMaker' as const, label: 'Film Maker' },
                              { key: 'export4k' as const, label: '4K Export' },
                            ].map((cap) => {
                              const enabled = Boolean(plan.featureAccess?.[cap.key]);
                              return (
                                <div
                                  key={cap.key}
                                  className={`flex items-center gap-1 ${
                                    enabled
                                      ? isLight
                                        ? 'text-neutral-800 font-medium'
                                        : 'text-slate-200 font-medium'
                                      : mutedText
                                  }`}
                                >
                                  {enabled ? (
                                    <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                  ) : (
                                    <Lock className="w-3 h-3 opacity-50 shrink-0" />
                                  )}
                                  <span className="truncate">{cap.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={Boolean(isCreatingOrder)}
                        onClick={() =>
                          void handlePayNow({
                            purchaseType: 'subscription',
                            planId: plan.id,
                          })
                        }
                        className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                          isCurrent
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : plan.highlighted
                            ? isLight
                              ? 'bg-neutral-950 hover:bg-black text-white'
                              : 'bg-purple-600 hover:bg-purple-500 text-white'
                            : isLight
                            ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-950'
                            : 'bg-slate-800 hover:bg-slate-700 text-white'
                        }`}
                      >
                        {busy
                          ? 'Creating Order...'
                          : isCurrent
                          ? 'Renew / Active Plan'
                          : price === 0
                          ? 'Select Free'
                          : 'Pay Now'}
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </section>

        {/* Buy Credits (One-Time Credit Purchases) */}
        <section id="buy-credits" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Buy Credits (One-Time Purchase)</h2>
              <p className={`text-xs ${mutedText}`}>
                Need extra AI credits right now? Pay once with UPI, Google Pay, PhonePe, or card through Razorpay.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {creditPacks
              .filter((pk) => pk.enabled !== false)
              .map((pack) => {
                const busy = isCreatingOrder === pack.id;
                const discountPct = Math.max(0, Math.min(90, Number(pack.discountPercent || 0)));
                const effectivePrice = getDiscountedInr(pack.priceInr, discountPct);
                return (
                  <div
                    key={pack.id}
                    className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 ${cardBg}`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>{pack.bonusLabel || 'Credit Top-Up'}</span>
                        </span>
                        <div className="flex items-baseline gap-1.5 font-mono-cinema tabular-nums">
                          {discountPct > 0 && pack.priceInr > effectivePrice && (
                            <span className={`text-[11px] line-through ${mutedText}`}>
                              ₹{pack.priceInr.toLocaleString('en-IN')}
                            </span>
                          )}
                          <span className="text-base font-bold">
                            ₹{effectivePrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xl font-bold font-mono-cinema tabular-nums">
                          +{pack.credits.toLocaleString()} Credits
                        </div>
                        {discountPct > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            {discountPct}% OFF
                          </span>
                        )}
                      </div>

                      <div className={`text-[11px] flex items-center gap-1 ${mutedText}`}>
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>
                          {pack.creditExpiryDays && pack.creditExpiryDays > 0
                            ? `Valid for ${pack.creditExpiryDays} days`
                            : 'Credits never expire'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={Boolean(isCreatingOrder)}
                      onClick={() =>
                        void handlePayNow({
                          purchaseType: 'credits',
                          packId: pack.id,
                        })
                      }
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors ${
                        isLight
                          ? 'bg-neutral-950 hover:bg-black text-white'
                          : 'bg-white hover:bg-slate-200 text-black'
                      }`}
                    >
                      {busy ? 'Creating Order...' : `Pay Now · ₹${effectivePrice.toLocaleString('en-IN')}`}
                    </button>
                  </div>
                );
              })}
          </div>
        </section>

        {/* Payment History & Invoices Table */}
        <section id="payment-history" className={`border rounded-2xl p-6 space-y-4 ${cardBg}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <h2 className="text-base font-bold">Payment History</h2>
            </div>
            <button
              type="button"
              onClick={() => void fetchBillingState()}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 ${innerCardBg}`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {payments.length === 0 ? (
            <div
              className={`p-8 text-center rounded-xl border border-dashed text-xs ${mutedText} ${
                isLight ? 'border-neutral-300 bg-white' : 'border-slate-800 bg-[#090b11]'
              }`}
            >
              No Razorpay transactions recorded yet. Select any plan or one-time credit package above and click Pay Now to generate your first verified invoice.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs tabular-nums">
                <thead
                  className={`border-b text-[11px] uppercase ${
                    isLight ? 'border-neutral-200 text-neutral-500' : 'border-slate-800 text-slate-400'
                  }`}
                >
                  <tr>
                    <th className="py-3 pr-4">Invoice</th>
                    <th className="py-3 pr-4">Plan / Pack</th>
                    <th className="py-3 pr-4">Method</th>
                    <th className="py-3 pr-4">Date</th>
                    <th className="py-3 pr-4 text-right">Credits</th>
                    <th className="py-3 pr-4 text-right">Amount</th>
                    <th className="py-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-neutral-200' : 'divide-slate-800'}`}>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 pr-4 font-mono-cinema font-semibold">{p.invoiceId}</td>
                      <td className="py-3 pr-4">
                        <div className="font-medium">{p.itemName}</div>
                        <div className={`text-[11px] font-mono-cinema ${mutedText}`}>{p.paymentId}</div>
                      </td>
                      <td className="py-3 pr-4 uppercase font-mono-cinema">{p.method}</td>
                      <td className={`py-3 pr-4 ${mutedText}`}>
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono-cinema text-emerald-600 font-semibold">
                        +{p.creditsGranted.toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono-cinema font-bold">
                        ₹{p.amountInr.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInvoicePreview(p)}
                            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium inline-flex items-center gap-1 ${innerCardBg}`}
                          >
                            <FileText className="w-3 h-3" />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDownloadInvoice(p.invoiceId)}
                            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium inline-flex items-center gap-1 ${innerCardBg}`}
                            title="Download HTML Invoice"
                          >
                            <Download className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Credit Transaction History (Purchases, Promo Grants & Admin Adjustments) */}
        <section id="credit-transactions" className={`border rounded-2xl p-6 space-y-4 ${cardBg}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-bold">Credit Transaction History</h2>
            </div>
            <span className={`text-xs font-mono-cinema ${mutedText}`}>
              {creditTransactions.length} entries
            </span>
          </div>

          {creditTransactions.length === 0 ? (
            <div
              className={`p-6 text-center rounded-xl border border-dashed text-xs ${mutedText} ${
                isLight ? 'border-neutral-300 bg-white' : 'border-slate-800 bg-[#090b11]'
              }`}
            >
              No credit ledger changes recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs tabular-nums">
                <thead
                  className={`border-b text-[11px] uppercase ${
                    isLight ? 'border-neutral-200 text-neutral-500' : 'border-slate-800 text-slate-400'
                  }`}
                >
                  <tr>
                    <th className="py-2.5 pr-4">Date</th>
                    <th className="py-2.5 pr-4">Type</th>
                    <th className="py-2.5 pr-4">Details</th>
                    <th className="py-2.5 pr-4">Expiry</th>
                    <th className="py-2.5 text-right">Credits</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-neutral-200' : 'divide-slate-800'}`}>
                  {creditTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className={`py-2.5 pr-4 whitespace-nowrap ${mutedText}`}>
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 pr-4 uppercase font-mono-cinema text-[11px]">
                        {tx.type.replace('_', ' ')}
                      </td>
                      <td className="py-2.5 pr-4">
                        <div className="font-medium">{tx.description}</div>
                        <div className={`text-[11px] font-mono-cinema ${mutedText}`}>
                          Ref: {tx.referenceId}
                        </div>
                      </td>
                      <td className={`py-2.5 pr-4 text-[11px] ${mutedText}`}>
                        {tx.expiresAt ? new Date(tx.expiresAt).toLocaleDateString() : 'Never expires'}
                      </td>
                      <td
                        className={`py-2.5 text-right font-mono-cinema font-bold ${
                          tx.creditsDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {tx.creditsDelta >= 0
                          ? `+${tx.creditsDelta.toLocaleString()}`
                          : tx.creditsDelta.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Optional Collapsible Film Cost Estimator */}
        <section className={`border rounded-2xl p-5 space-y-4 ${cardBg}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-neutral-600" />
              <h2 className="text-sm font-bold">Film Production Credit Estimator (Optional Helper)</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowEstimator((v) => !v)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${innerCardBg}`}
            >
              {showEstimator ? 'Hide Estimator' : 'Open Estimator'}
            </button>
          </div>

          {showEstimator && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2 border-t border-neutral-200 dark:border-slate-800">
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className={`p-3.5 rounded-xl border space-y-1.5 ${innerCardBg}`}>
                <div className="flex justify-between">
                  <span className={mutedText}>Scene / Shot Count</span>
                  <span className="font-mono-cinema font-bold tabular-nums">{calcScenes} Shots</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="5"
                  value={calcScenes}
                  onChange={(e) => setCalcScenes(Number(e.target.value))}
                  className="w-full accent-neutral-900"
                />
              </div>

              <div className={`p-3.5 rounded-xl border space-y-1.5 ${innerCardBg}`}>
                <div className="flex justify-between">
                  <span className={mutedText}>Target Runtime</span>
                  <span className="font-mono-cinema font-bold tabular-nums">{calcDurationMin} Min</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="60"
                  step="1"
                  value={calcDurationMin}
                  onChange={(e) => setCalcDurationMin(Number(e.target.value))}
                  className="w-full accent-neutral-900"
                />
              </div>

              <div className={`p-3.5 rounded-xl border space-y-1.5 ${innerCardBg}`}>
                <div className="flex justify-between">
                  <span className={mutedText}>Output Resolution</span>
                  <span className="font-mono-cinema font-bold">{calcResolution}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {(['1080p', '4K DCI'] as const).map((res) => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setCalcResolution(res)}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        calcResolution === res
                          ? isLight
                            ? 'bg-neutral-950 text-white'
                            : 'bg-purple-600 text-white'
                          : isLight
                          ? 'bg-neutral-100 text-neutral-600'
                          : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`p-3.5 rounded-xl border space-y-1.5 ${innerCardBg}`}>
                <div className="flex justify-between">
                  <span className={mutedText}>AI Dialogue Duration</span>
                  <span className="font-mono-cinema font-bold tabular-nums">{calcVoiceMinutes} Min</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="2"
                  value={calcVoiceMinutes}
                  onChange={(e) => setCalcVoiceMinutes(Number(e.target.value))}
                  className="w-full accent-neutral-900"
                />
              </div>
            </div>

            <div className={`p-5 rounded-xl border flex flex-col justify-between space-y-3 text-xs ${innerCardBg}`}>
              <div className="space-y-2 tabular-nums">
                <div className="flex justify-between">
                  <span className={mutedText}>Video Shots ({calcScenes}x)</span>
                  <span className="font-mono-cinema font-semibold">{totalVideoCredits.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className={mutedText}>Voiceover ({calcVoiceMinutes}m)</span>
                  <span className="font-mono-cinema font-semibold">{voiceCredits.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className={mutedText}>Music &amp; SFX ({calcMusicTracks} tracks)</span>
                  <span className="font-mono-cinema font-semibold">{musicCredits.toLocaleString()}</span>
                </div>
              </div>

              <div
                className={`pt-3 border-t flex items-baseline justify-between tabular-nums ${
                  isLight ? 'border-neutral-200' : 'border-slate-800'
                }`}
              >
                <span className="font-semibold">Estimated Needed:</span>
                <span className="text-lg font-bold font-mono-cinema">
                  {totalCreditsNeeded.toLocaleString()} Credits
                </span>
              </div>
              <div className={`text-[11px] font-mono-cinema flex justify-between ${mutedText}`}>
                <span>Estimated API Cost Ref:</span>
                <span>${totalProviderUsd.toFixed(2)}</span>
              </div>
            </div>
          </div>
          )}
        </section>
      </div>

      {/* Razorpay Hosted-Style Checkout Modal (No Card Details Entered on Website) */}
      {checkoutOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white text-neutral-950 rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden">
            {/* Gateway Header */}
            <div className="bg-neutral-950 text-white px-6 py-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>Razorpay Checkout (Test Mode)</span>
                </div>
                <div className="text-sm font-bold">Film &amp; Video Studio Ultimate</div>
              </div>
              <div className="text-right font-mono-cinema tabular-nums">
                <div className="text-lg font-bold">₹{checkoutOrder.amountInr.toLocaleString('en-IN')}</div>
                <div className="text-[10px] text-neutral-400">+{checkoutOrder.creditsToGrant.toLocaleString()} Credits</div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="text-xs bg-[#FAFAFB] border border-neutral-200 rounded-xl p-3 flex items-center justify-between gap-2">
                <span className="font-medium truncate">{checkoutOrder.itemName}</span>
                <span className="font-mono-cinema text-[11px] text-neutral-500 shrink-0">
                  {checkoutOrder.orderId}
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-800">
                    Choose How to Pay via Razorpay
                  </label>
                  <span className="text-[11px] text-neutral-500">Handled securely by Razorpay</span>
                </div>

                <div className="space-y-2">
                  {[
                    {
                      id: 'upi' as const,
                      appLabel: 'Google Pay / PhonePe / UPI',
                      subtitle: 'Instant UPI app approval or QR code',
                      icon: Smartphone,
                    },
                    {
                      id: 'card' as const,
                      appLabel: 'Debit / Credit Card (Visa, Mastercard, RuPay)',
                      subtitle: 'Authorized directly inside Razorpay Checkout',
                      icon: CreditCard,
                    },
                    {
                      id: 'netbanking' as const,
                      appLabel: 'Netbanking (HDFC, ICICI, SBI, Axis)',
                      subtitle: 'Direct bank portal authorization via Razorpay',
                      icon: Building2,
                    },
                  ].map((option) => {
                    const Icon = option.icon;
                    const selected = checkoutAppLabel === option.appLabel;
                    return (
                      <button
                        key={option.appLabel}
                        type="button"
                        onClick={() => {
                          setCheckoutMethod(option.id);
                          setCheckoutAppLabel(option.appLabel);
                        }}
                        className={`w-full p-3.5 rounded-xl border text-left flex items-center gap-3 transition-colors ${
                          selected
                            ? 'bg-neutral-950 text-white border-neutral-950'
                            : 'bg-white text-neutral-900 border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${selected ? 'text-white' : 'text-neutral-600'}`} />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold truncate">{option.appLabel}</div>
                          <div className={`text-[11px] truncate ${selected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                            {option.subtitle}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Test Mode Outcome Toggle */}
              <div className="p-3 rounded-xl bg-[#FAFAFB] border border-neutral-200 flex items-center justify-between text-xs">
                <span className="text-neutral-600 font-medium">Test Outcome:</span>
                <div className="flex items-center gap-1 bg-neutral-200/70 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setSimulateFailure(false)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                      !simulateFailure ? 'bg-white text-emerald-700 shadow-sm' : 'text-neutral-600'
                    }`}
                  >
                    Success
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulateFailure(true)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                      simulateFailure ? 'bg-white text-rose-700 shadow-sm' : 'text-neutral-600'
                    }`}
                  >
                    Decline
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={isVerifying}
                  onClick={() => setCheckoutOrder(null)}
                  className="px-4 py-3 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-xs font-semibold text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isVerifying}
                  onClick={() => void handleConfirmTestCheckout()}
                  className="flex-1 py-3 px-4 rounded-xl bg-neutral-950 hover:bg-black text-white text-xs font-semibold transition-colors disabled:opacity-60"
                >
                  {isVerifying
                    ? 'Verifying Automatically...'
                    : `Pay ₹${checkoutOrder.amountInr.toLocaleString('en-IN')} with Razorpay`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {invoicePreview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white text-neutral-950 rounded-2xl border border-neutral-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-neutral-200 pb-4 gap-3">
              <div className="flex items-center gap-3">
                <img
                  src="/images/zkmap-studio-logo.png"
                  alt="ZKMAP STUDIO"
                  className="h-9 w-auto rounded-lg object-contain border border-neutral-200"
                />
                <div>
                  <h3 className="text-base font-bold">Invoice {invoicePreview.invoiceId}</h3>
                  <p className="text-xs text-neutral-500">
                    ZKMAP STUDIO · {new Date(invoicePreview.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInvoicePreview(null)}
                className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">Order ID</span>
                <span className="font-mono-cinema">{invoicePreview.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Payment ID</span>
                <span className="font-mono-cinema">{invoicePreview.paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Method</span>
                <span className="uppercase font-semibold">{invoicePreview.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Item</span>
                <span className="font-semibold">{invoicePreview.itemName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Credits Issued</span>
                <span className="font-mono-cinema text-emerald-700 font-semibold">
                  +{invoicePreview.creditsGranted.toLocaleString()}
                </span>
              </div>
              <div className="border-t border-neutral-200 pt-2.5 flex justify-between text-neutral-600">
                <span>Taxable Subtotal</span>
                <span className="font-mono-cinema">₹{invoicePreview.subtotalInr.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>GST (18% Included)</span>
                <span className="font-mono-cinema">₹{invoicePreview.taxInr.toFixed(2)}</span>
              </div>
              <div className="border-t border-neutral-900 pt-2.5 flex justify-between font-bold text-sm">
                <span>Total Paid</span>
                <span className="font-mono-cinema">₹{invoicePreview.amountInr.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => void handleDownloadInvoice(invoicePreview.invoiceId)}
                className="px-4 py-2 rounded-xl bg-neutral-950 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download HTML Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
