import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  Film,
  Users,
  HardDrive,
  ArrowUpRight,
  Trash2,
  Activity,
  ShieldCheck,
  Server,
  CreditCard,
  Save,
  Receipt,
  Lock,
  History,
  Plus,
  Gift,
  Coins,
} from 'lucide-react';
import { FilmProject } from '../../types';
import { soundFx } from '../../utils/audioSynth';
import { useAuth, SubscriptionPlanName, PLAN_CREDIT_MAP } from '../../context/AuthContext';

export interface PlanFeatureAccess {
  aiVoice: boolean;
  musicSfx: boolean;
  aiVideo: boolean;
  manhwaStudio: boolean;
  aiFilmMaker: boolean;
  export4k: boolean;
}

interface AdminPlanConfig {
  id: string;
  name: string;
  tagline: string;
  monthlyPriceInr: number;
  yearlyPriceInr: number;
  monthlyCredits: number;
  creditExpiryDays: number;
  discountPercent: number;
  enabled: boolean;
  features: string[];
  featureAccess?: PlanFeatureAccess;
  highlighted?: boolean;
}

interface AdminCreditPackConfig {
  id: string;
  name: string;
  credits: number;
  priceInr: number;
  discountPercent: number;
  creditExpiryDays: number;
  enabled: boolean;
  bonusLabel?: string;
}

interface AdminPaymentRecord {
  id: string;
  invoiceId: string;
  paymentId: string;
  userEmail: string;
  itemName: string;
  creditsGranted: number;
  amountInr: number;
  method: string;
  mode: string;
  createdAt: string;
}

interface AdminSubscriptionRecord {
  id: string;
  userId: string;
  userEmail: string;
  planId: string;
  planName?: string;
  billingCycle: string;
  status: 'active' | 'cancelled';
  currentPeriodEnd: string;
  monthlyCredits: number;
}

interface AdminCreditTransaction {
  id: string;
  userId: string;
  userEmail: string;
  type: string;
  creditsDelta: number;
  description: string;
  referenceId: string;
  performedBy: string;
  expiresAt?: string;
  createdAt: string;
}

interface AdminAuditLogEntry {
  id: string;
  adminEmail: string;
  action: string;
  summary: string;
  createdAt: string;
}

type AdminTabId = 'ledger' | 'pricing' | 'users' | 'usage' | 'apis';

interface AdminPanelProps {
  allFilms: FilmProject[];
  onSelectFilm: (film: FilmProject) => void;
  onDeleteFilm?: (filmId: string) => void;
  onOpenWorkstation: () => void;
  initialTab?: AdminTabId;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  allFilms,
  onSelectFilm,
  onDeleteFilm,
  onOpenWorkstation,
  initialTab = 'ledger',
}) => {
  const {
    firebaseUser,
    isAdmin,
    allUsersAdmin,
    allUsageAdmin,
    adminUpdateUserAccount,
    openAuthModal,
  } = useAuth();

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<AdminTabId>(initialTab);
  const [adminNotice, setAdminNotice] = useState<string | null>(null);
  const [backendProviders, setBackendProviders] = useState<
    Array<{ id: string; name: string; category: string; configured: boolean; keySource: string; status: string; latency: string }>
  >([]);

  const [pricingPlans, setPricingPlans] = useState<AdminPlanConfig[]>([]);
  const [creditPacks, setCreditPacks] = useState<AdminCreditPackConfig[]>([]);
  const [adminPayments, setAdminPayments] = useState<AdminPaymentRecord[]>([]);
  const [adminSubscriptions, setAdminSubscriptions] = useState<AdminSubscriptionRecord[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<AdminCreditTransaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogEntry[]>([]);
  const [razorpayStatus, setRazorpayStatus] = useState<{ mode: string; configured: boolean }>({
    mode: 'test',
    configured: false,
  });
  const [isSavingPricing, setIsSavingPricing] = useState(false);

  // Admin credit adjustment / promo grant form state
  const [creditTargetUid, setCreditTargetUid] = useState<string>('');
  const [creditAdjustMode, setCreditAdjustMode] = useState<'add' | 'deduct' | 'promo'>('promo');
  const [creditAdjustAmount, setCreditAdjustAmount] = useState<number>(5000);
  const [creditAdjustReason, setCreditAdjustReason] = useState<string>('Studio promotional bonus');
  const [creditAdjustExpiryDays, setCreditAdjustExpiryDays] = useState<number>(90);
  const [isAdjustingCredits, setIsAdjustingCredits] = useState<boolean>(false);

  useEffect(() => {
    setAdminTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!firebaseUser || !isAdmin) {
      setAdminPayments([]);
      setAdminSubscriptions([]);
      setCreditTransactions([]);
      setAuditLogs([]);
      return;
    }
    const controller = new AbortController();
    firebaseUser.getIdToken()
      .then((idToken) => fetch('/api/payments/state?includeAll=true', {
        headers: { Authorization: `Bearer ${idToken}` },
        signal: controller.signal,
      }))
      .then((r) => r.json())
      .then((d) => {
        if (controller.signal.aborted || !d?.success) return;
        if (Array.isArray(d?.plans)) setPricingPlans(d.plans);
        if (Array.isArray(d?.creditPacks)) setCreditPacks(d.creditPacks);
        if (Array.isArray(d?.payments)) setAdminPayments(d.payments);
        if (Array.isArray(d?.allSubscriptions)) setAdminSubscriptions(d.allSubscriptions);
        if (Array.isArray(d?.creditTransactions)) setCreditTransactions(d.creditTransactions);
        if (Array.isArray(d?.auditLogs)) setAuditLogs(d.auditLogs);
        if (d?.razorpay) setRazorpayStatus(d.razorpay);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [firebaseUser, isAdmin]);

  useEffect(() => {
    fetch('/api/providers/status')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.providers)) {
          setBackendProviders(d.providers);
        }
      })
      .catch(() => {});
  }, []);


  const totalBudget = allFilms.reduce((sum, f) => sum + f.budget, 0);
  const totalSpent = allFilms.reduce((sum, f) => sum + f.spent, 0);

  const handlePlanChange = async (uid: string, plan: SubscriptionPlanName) => {
    const configuredPlan = pricingPlans.find((p) => p.id === plan);
    const creditsToSet = configuredPlan ? configuredPlan.monthlyCredits : PLAN_CREDIT_MAP[plan] ?? 10000;
    await adminUpdateUserAccount(uid, {
      plan: configuredPlan ? configuredPlan.name : plan,
      creditsRemaining: creditsToSet,
    });
    setAdminNotice(`Updated user subscription to ${configuredPlan?.name || plan} (${creditsToSet.toLocaleString()} credits).`);
    setTimeout(() => setAdminNotice(null), 3000);
  };

  const handleAddCustomPlan = () => {
    soundFx.playScannerBeep();
    const nextPlan: AdminPlanConfig = {
      id: `plan_${Date.now()}`,
      name: `Custom Tier ${pricingPlans.length + 1}`,
      tagline: 'Custom AI studio credits & generation access',
      monthlyPriceInr: 2499,
      yearlyPriceInr: 24990,
      monthlyCredits: 250000,
      creditExpiryDays: 60,
      discountPercent: 0,
      enabled: true,
      features: ['Custom studio credit allowance', 'AI Voice, Video & Manhwa Studio access'],
      featureAccess: {
        aiVoice: true,
        musicSfx: true,
        aiVideo: true,
        manhwaStudio: true,
        aiFilmMaker: true,
        export4k: true,
      },
    };
    setPricingPlans((prev) => [...prev, nextPlan]);
  };

  const handleDeletePlan = (planId: string) => {
    if (pricingPlans.length <= 1) return;
    setPricingPlans((prev) => prev.filter((p) => p.id !== planId));
  };

  const handleAddCreditPack = () => {
    soundFx.playScannerBeep();
    const nextPack: AdminCreditPackConfig = {
      id: `pack_${Date.now()}`,
      name: '50,000 Bonus Credits',
      credits: 50000,
      priceInr: 1799,
      discountPercent: 0,
      creditExpiryDays: 365,
      enabled: true,
      bonusLabel: 'Special Pack',
    };
    setCreditPacks((prev) => [...prev, nextPack]);
  };

  const handleDeleteCreditPack = (packId: string) => {
    if (creditPacks.length <= 1) return;
    setCreditPacks((prev) => prev.filter((pk) => pk.id !== packId));
  };

  const handleAdjustCustomerCredits = async () => {
    if (!firebaseUser || !isAdmin) {
      openAuthModal();
      return;
    }
    const selectedUser =
      allUsersAdmin.find((u) => u.uid === creditTargetUid) || allUsersAdmin[0];
    if (!selectedUser) {
      setAdminNotice('Select a registered customer account first.');
      return;
    }
    setIsAdjustingCredits(true);
    soundFx.playScannerBeep();
    try {
      const amount = Math.max(1, Math.round(Number(creditAdjustAmount) || 0));
      const nextBalance =
        creditAdjustMode === 'deduct'
          ? Math.max(0, (selectedUser.creditsRemaining || 0) - amount)
          : Math.min(5000000, (selectedUser.creditsRemaining || 0) + amount);

      await adminUpdateUserAccount(selectedUser.uid, {
        creditsRemaining: nextBalance,
      });

      const idToken = await firebaseUser.getIdToken();
      const res = await fetch('/api/admin/credits/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId: selectedUser.uid,
          userEmail: selectedUser.email,
          mode: creditAdjustMode,
          creditsAmount: amount,
          reason: creditAdjustReason,
          creditExpiryDays: creditAdjustExpiryDays,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Failed to record credit transaction.');
      }
      if (Array.isArray(data.creditTransactions)) setCreditTransactions(data.creditTransactions);
      if (Array.isArray(data.auditLogs)) setAuditLogs(data.auditLogs);
      setAdminNotice(
        `${selectedUser.email}: ${
          creditAdjustMode === 'deduct' ? `-${amount.toLocaleString()}` : `+${amount.toLocaleString()}`
        } credits applied and recorded in ledger.`
      );
      setTimeout(() => setAdminNotice(null), 4000);
    } catch (err: any) {
      setAdminNotice(err?.message || 'Error adjusting customer credits.');
    } finally {
      setIsAdjustingCredits(false);
    }
  };

  const handleAdminSubStatus = async (userId: string, action: 'cancel' | 'activate') => {
    if (!firebaseUser || !isAdmin) return;
    try {
      const idToken = await firebaseUser.getIdToken();
      const res = await fetch('/api/admin/subscriptions/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ userId, action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (Array.isArray(data.allSubscriptions)) setAdminSubscriptions(data.allSubscriptions);
        if (Array.isArray(data.auditLogs)) setAuditLogs(data.auditLogs);
        setAdminNotice(`Subscription updated to ${action === 'cancel' ? 'cancelled' : 'active'}.`);
        setTimeout(() => setAdminNotice(null), 3500);
      }
    } catch {
      // ignore
    }
  };

  const handleToggleFeatureAccess = (planId: AdminPlanConfig['id'], key: keyof PlanFeatureAccess) => {
    setPricingPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;
        const current = p.featureAccess || {
          aiVoice: true,
          musicSfx: true,
          aiVideo: true,
          manhwaStudio: true,
          aiFilmMaker: true,
          export4k: true,
        };
        return {
          ...p,
          featureAccess: {
            ...current,
            [key]: !current[key],
          },
        };
      })
    );
  };

  const handleSavePricingConfig = async () => {
    if (!firebaseUser || !isAdmin) {
      setAdminNotice('Authorized administrator sign-in is required to modify pricing.');
      openAuthModal();
      return;
    }

    soundFx.playScannerBeep();
    setIsSavingPricing(true);
    try {
      const idToken = await firebaseUser.getIdToken();
      const res = await fetch('/api/admin/pricing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          plans: pricingPlans,
          creditPacks,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Failed to save pricing');
      }
      if (Array.isArray(data.plans)) setPricingPlans(data.plans);
      if (Array.isArray(data.creditPacks)) setCreditPacks(data.creditPacks);
      if (Array.isArray(data.auditLogs)) setAuditLogs(data.auditLogs);
      setAdminNotice('Published updated pricing & recorded entry in Admin Audit Log.');
      setTimeout(() => setAdminNotice(null), 4000);
    } catch (err: any) {
      setAdminNotice(err?.message || 'Error saving pricing config');
    } finally {
      setIsSavingPricing(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-950 text-slate-100 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3.5">
          <img
            src="/images/zkmap-studio-logo.png"
            alt="ZKMAP STUDIO"
            className="h-12 w-auto rounded-xl object-contain border border-slate-800 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-mono-cinema">
              <span>ZKMAP STUDIO</span>
              <span aria-hidden="true">·</span>
              <span>zkmapstudio.com</span>
              <span aria-hidden="true">·</span>
              <span>Executive Admin</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-cinzel">
              Studio Portfolio &amp; Executive Administration
            </h1>
          </div>
        </div>

        <button
          onClick={onOpenWorkstation}
          className="flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-lg shadow-amber-500/20 whitespace-nowrap"
        >
          <span>Return to Workstation</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Admin KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Portfolio Capital</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono-cinema text-white">
            ${(totalBudget / 1000000).toFixed(2)}M
          </div>
          <p className="text-[11px] text-slate-500">
            ${(totalSpent / 1000000).toFixed(2)}M committed ({totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%)
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Productions</span>
            <Film className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono-cinema text-white">
            {allFilms.length} Features
          </div>
          <p className="text-[11px] text-emerald-400 font-mono-cinema">
            Production pipeline active
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Registered Creators</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono-cinema text-white">
            {isAdmin ? allUsersAdmin.length : '—'}
          </div>
          <p className="text-[11px] text-slate-500">
            {isAdmin ? 'Live Firestore subscriber count' : 'Sign in as admin for live directory'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Usage Telemetry Logs</span>
            <HardDrive className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono-cinema text-white">
            {isAdmin ? allUsageAdmin.length : '—'}
          </div>
          <p className="text-[11px] text-slate-500">
            Syntheses & renders tracked
          </p>
        </div>
      </div>

      {/* Section Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          {[
            { id: 'ledger', label: 'Executive Production Ledger', icon: Film },
            { id: 'pricing', label: 'Admin Price Config 🔒', icon: CreditCard },
            { id: 'users', label: 'Users & Subscriptions', icon: Users },
            { id: 'usage', label: 'Usage Telemetry', icon: Activity },
            { id: 'apis', label: 'API & Providers', icon: Server },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setAdminTab(t.id as 'ledger' | 'pricing' | 'users' | 'usage' | 'apis')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  adminTab === t.id
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {adminNotice && (
          <div className="text-xs font-mono-cinema text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
            {adminNotice}
          </div>
        )}
      </div>

      {/* TAB 1: Production Slate Portfolio Table */}
      {adminTab === 'ledger' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-mono-cinema uppercase">
              Executive Production Ledger
            </h3>
            <span className="text-xs text-slate-500 font-mono-cinema">{allFilms.length} Features</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-cinema">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                <tr>
                  <th className="py-3 px-4">Feature Title</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Director</th>
                  <th className="py-3 px-4">Spent / Budget</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {allFilms.map((film) => (
                  <tr key={film.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-3">
                      <img
                        src={film.coverImage}
                        alt={film.title}
                        referrerPolicy="no-referrer"
                        className="w-12 h-8 rounded object-cover border border-slate-800"
                      />
                      <span>{film.title}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                        {film.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-sans">{film.director}</td>
                    <td className="py-3.5 px-4 text-slate-300">
                      ${(film.spent / 1000000).toFixed(1)}M / ${(film.budget / 1000000).toFixed(1)}M
                    </td>
                    <td className="py-3.5 px-4 text-emerald-400">
                      Day {film.shootingDaysDone} of {film.shootingDaysTotal}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {film.aspectRatio} · {film.fps}fps
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => {
                            soundFx.playScannerBeep();
                            onSelectFilm(film);
                            onOpenWorkstation();
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded text-[11px] font-bold"
                        >
                          Manage Film &rarr;
                        </button>
                        {onDeleteFilm &&
                          (confirmDeleteId === film.id ? (
                            <>
                              <button
                                onClick={() => {
                                  onDeleteFilm(film.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-bold"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-[11px]"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(film.id)}
                              className="p-1.5 bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded transition-colors"
                              title={`Delete ${film.title}`}
                              aria-label={`Delete ${film.title}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Admin Price Config & Razorpay Transactions (Strictly Admin Only) */}
      {adminTab === 'pricing' && (
        <div className="space-y-6">
          {!firebaseUser || !isAdmin ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6 text-amber-400" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-base font-bold text-white">
                  Admin Price Config 🔒 — Restricted Access
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Only authorized administrators can configure subscription prices, credit allocations, feature access toggles, and publish pricing updates. Customers can view plans in Credits &amp; Plans without editing them.
                </p>
              </div>
              <button
                type="button"
                onClick={openAuthModal}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors"
              >
                {firebaseUser ? 'Switch to Authorized Admin Account' : 'Sign In as Administrator'}
              </button>
            </div>
          ) : (
            <>
              {/* Plan Price, Credit Allocation & Feature Access Editor */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono-cinema uppercase flex items-center gap-2">
                      <span>Admin Price Config</span>
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Create, edit, delete, or enable/disable plans &amp; credit packages, set discounts, credit expiry, and AI feature access. Gateway:{' '}
                      <span className="text-amber-300 font-semibold">
                        {razorpayStatus.configured ? 'Razorpay Live' : 'Razorpay Test Mode'}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddCustomPlan}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Plan</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSavingPricing}
                      onClick={() => void handleSavePricingConfig()}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingPricing ? 'Publishing...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {pricingPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`bg-slate-950 border rounded-xl p-4 space-y-3 text-xs ${
                        plan.enabled === false ? 'border-rose-500/40 opacity-75' : 'border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={plan.name}
                          aria-label="Plan Name"
                          onChange={(e) => {
                            const name = e.target.value;
                            setPricingPlans((prev) =>
                              prev.map((p) => (p.id === plan.id ? { ...p, name } : p))
                            );
                          }}
                          className="font-bold text-white text-sm bg-slate-900 border border-slate-700 rounded px-2 py-1 w-full outline-none focus:border-amber-400"
                        />
                        {pricingPlans.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeletePlan(plan.id)}
                            title={`Delete ${plan.name}`}
                            aria-label={`Delete ${plan.name}`}
                            className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Enable / Disable Plan Toggle */}
                      <label className="flex items-center justify-between bg-slate-900/70 border border-slate-800 rounded-lg px-2.5 py-1.5 cursor-pointer">
                        <span className="text-[11px] text-slate-300 font-medium">
                          Plan Status: {plan.enabled !== false ? 'Enabled' : 'Disabled'}
                        </span>
                        <input
                          type="checkbox"
                          checked={plan.enabled !== false}
                          onChange={() =>
                            setPricingPlans((prev) =>
                              prev.map((p) =>
                                p.id === plan.id ? { ...p, enabled: !(p.enabled !== false) } : p
                              )
                            )
                          }
                          className="accent-emerald-500"
                        />
                      </label>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase block mb-1">
                            Monthly (₹)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={plan.monthlyPriceInr}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setPricingPlans((prev) =>
                                prev.map((p) => (p.id === plan.id ? { ...p, monthlyPriceInr: val } : p))
                              );
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono-cinema outline-none focus:border-amber-400"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 uppercase block mb-1">
                            Yearly (₹)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={plan.yearlyPriceInr}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setPricingPlans((prev) =>
                                prev.map((p) => (p.id === plan.id ? { ...p, yearlyPriceInr: val } : p))
                              );
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono-cinema outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 uppercase block mb-1">
                          Included AI Credits / Mo
                        </label>
                        <input
                          type="number"
                          min={100}
                          max={5000000}
                          step={500}
                          value={plan.monthlyCredits}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setPricingPlans((prev) =>
                              prev.map((p) => (p.id === plan.id ? { ...p, monthlyCredits: val } : p))
                            );
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-emerald-400 font-mono-cinema font-bold outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase block mb-1">
                            Expiry (Days)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={3650}
                            value={plan.creditExpiryDays ?? 30}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setPricingPlans((prev) =>
                                prev.map((p) => (p.id === plan.id ? { ...p, creditExpiryDays: val } : p))
                              );
                            }}
                            title="0 means credits never expire"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 font-mono-cinema outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase block mb-1">
                            Discount (%)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={90}
                            value={plan.discountPercent ?? 0}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(90, Number(e.target.value) || 0));
                              setPricingPlans((prev) =>
                                prev.map((p) => (p.id === plan.id ? { ...p, discountPercent: val } : p))
                              );
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-amber-300 font-mono-cinema outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      {/* Feature Access Toggles */}
                      <div className="pt-2 border-t border-slate-800 space-y-1.5">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">
                          Feature Access
                        </div>
                        {[
                          { key: 'aiVoice' as const, label: 'AI Voice Studio' },
                          { key: 'musicSfx' as const, label: 'Music & SFX' },
                          { key: 'aiVideo' as const, label: 'AI Video Gen' },
                          { key: 'manhwaStudio' as const, label: 'Manhwa Studio' },
                          { key: 'aiFilmMaker' as const, label: 'AI Film Maker' },
                          { key: 'export4k' as const, label: '4K Export' },
                        ].map((feat) => {
                          const enabled = Boolean(plan.featureAccess?.[feat.key]);
                          return (
                            <label
                              key={feat.key}
                              className="flex items-center justify-between gap-2 text-[11px] text-slate-300 cursor-pointer py-0.5"
                            >
                              <span>{feat.label}</span>
                              <input
                                type="checkbox"
                                checked={enabled}
                                onChange={() => handleToggleFeatureAccess(plan.id, feat.key)}
                                className="accent-amber-500 rounded"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* One-Time Extra Credit Packages Editor */}
                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-300 uppercase font-mono-cinema">
                      Extra Credit Packages (Enable / Disable, Expiry &amp; Discount)
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddCreditPack}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Package</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {creditPacks.map((pack) => (
                      <div
                        key={pack.id}
                        className={`bg-slate-950 border rounded-xl p-3.5 space-y-2.5 text-xs ${
                          pack.enabled === false ? 'border-rose-500/40 opacity-75' : 'border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={pack.name}
                            aria-label="Package Name"
                            onChange={(e) => {
                              const name = e.target.value;
                              setCreditPacks((prev) =>
                                prev.map((pk) => (pk.id === pack.id ? { ...pk, name } : pk))
                              );
                            }}
                            className="font-semibold text-white bg-slate-900 border border-slate-700 rounded px-2 py-1 w-full outline-none"
                          />
                          {creditPacks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCreditPack(pack.id)}
                              title={`Delete ${pack.name}`}
                              className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <label className="flex items-center justify-between bg-slate-900/70 border border-slate-800 rounded px-2 py-1 cursor-pointer text-[11px]">
                          <span className="text-slate-300">
                            Package: {pack.enabled !== false ? 'Enabled' : 'Disabled'}
                          </span>
                          <input
                            type="checkbox"
                            checked={pack.enabled !== false}
                            onChange={() =>
                              setCreditPacks((prev) =>
                                prev.map((pk) =>
                                  pk.id === pack.id ? { ...pk, enabled: !(pk.enabled !== false) } : pk
                                )
                              )
                            }
                            className="accent-emerald-500"
                          />
                        </label>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-400 uppercase block mb-1">
                              Credits
                            </label>
                            <input
                              type="number"
                              min={100}
                              value={pack.credits}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                setCreditPacks((prev) =>
                                  prev.map((pk) => (pk.id === pack.id ? { ...pk, credits: val } : pk))
                                );
                              }}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-emerald-400 font-mono-cinema outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 uppercase block mb-1">
                              Price (₹)
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={pack.priceInr}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                setCreditPacks((prev) =>
                                  prev.map((pk) => (pk.id === pack.id ? { ...pk, priceInr: val } : pk))
                                );
                              }}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono-cinema outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 uppercase block mb-1">
                              Expiry (Days)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={3650}
                              value={pack.creditExpiryDays ?? 365}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                setCreditPacks((prev) =>
                                  prev.map((pk) => (pk.id === pack.id ? { ...pk, creditExpiryDays: val } : pk))
                                );
                              }}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono-cinema outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 uppercase block mb-1">
                              Discount (%)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={90}
                              value={pack.discountPercent ?? 0}
                              onChange={(e) => {
                                const val = Math.max(0, Math.min(90, Number(e.target.value) || 0));
                                setCreditPacks((prev) =>
                                  prev.map((pk) => (pk.id === pack.id ? { ...pk, discountPercent: val } : pk))
                                );
                              }}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-amber-300 font-mono-cinema outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Admin Audit Log */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white font-mono-cinema uppercase">
                      Admin Price Config Audit Log
                    </h3>
                  </div>
                  <span className="text-xs font-mono-cinema text-slate-400">
                    {auditLogs.length} recorded changes
                  </span>
                </div>

                {auditLogs.length === 0 ? (
                  <div className="p-6 text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                    No price configuration updates published yet. Every saved change is recorded here with administrator email and timestamp.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono-cinema tabular-nums">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                        <tr>
                          <th className="py-2.5 px-3">Timestamp</th>
                          <th className="py-2.5 px-3">Administrator</th>
                          <th className="py-2.5 px-3">Action</th>
                          <th className="py-2.5 px-3">Change Summary</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {auditLogs.map((entry) => (
                          <tr key={entry.id} className="hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                              {new Date(entry.createdAt).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-amber-300 font-semibold">
                              {entry.adminEmail}
                            </td>
                            <td className="py-2.5 px-3 text-cyan-300">{entry.action}</td>
                            <td className="py-2.5 px-3 text-slate-200 font-sans">{entry.summary}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Razorpay Verified Transactions Ledger */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white font-mono-cinema uppercase">
                      Razorpay Payments &amp; Invoices Ledger
                    </h3>
                  </div>
                  <span className="text-xs font-mono-cinema text-emerald-400">
                    Total Captured: ₹
                    {adminPayments.reduce((acc, p) => acc + (p.amountInr || 0), 0).toLocaleString('en-IN')}
                  </span>
                </div>

                {adminPayments.length === 0 ? (
                  <div className="p-6 text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                    No Razorpay transactions verified yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono-cinema tabular-nums">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                        <tr>
                          <th className="py-2.5 px-3">Invoice ID</th>
                          <th className="py-2.5 px-3">User</th>
                          <th className="py-2.5 px-3">Item</th>
                          <th className="py-2.5 px-3">Method</th>
                          <th className="py-2.5 px-3 text-right">Credits</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {adminPayments.map((pay) => (
                          <tr key={pay.id} className="hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-bold text-white">{pay.invoiceId}</td>
                            <td className="py-2.5 px-3 text-slate-300">{pay.userEmail}</td>
                            <td className="py-2.5 px-3 text-slate-200">{pay.itemName}</td>
                            <td className="py-2.5 px-3 uppercase text-cyan-300">{pay.method}</td>
                            <td className="py-2.5 px-3 text-right text-emerald-400">
                              +{pay.creditsGranted.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right text-white font-bold">
                              ₹{pay.amountInr.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: Users, Credits & Subscription Management */}
      {adminTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono-cinema uppercase">
                Creator Accounts, Plan Allocations &amp; Credit Adjustments
              </h3>
              <span className="text-xs text-slate-400 font-mono-cinema">
                {isAdmin ? `${allUsersAdmin.length} accounts` : 'Admin access required'}
              </span>
            </div>

            {!firebaseUser || !isAdmin ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl space-y-3">
                <ShieldCheck className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Sign in with your verified Studio Administrator Google account to inspect subscriber tiers, add/deduct or grant promotional credits, and manage subscriptions.
                </p>
                <button
                  type="button"
                  onClick={openAuthModal}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg"
                >
                  {firebaseUser ? 'Switch Account' : 'Sign In as Admin'}
                </button>
              </div>
            ) : (
              <>
                {/* Admin Credit Add / Deduct / Promotional Credits Control */}
                {allUsersAdmin.length > 0 && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase font-mono-cinema">
                      <Gift className="w-4 h-4" />
                      <span>Add, Deduct, or Grant Promotional Credits</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
                      <div className="lg:col-span-2">
                        <label className="text-[10px] text-slate-400 uppercase block mb-1">
                          Customer Account
                        </label>
                        <select
                          value={creditTargetUid || allUsersAdmin[0]?.uid || ''}
                          onChange={(e) => setCreditTargetUid(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white outline-none"
                        >
                          {allUsersAdmin.map((u) => (
                            <option key={u.uid} value={u.uid}>
                              {u.email} ({u.creditsRemaining.toLocaleString()} cr)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 uppercase block mb-1">
                          Action
                        </label>
                        <select
                          value={creditAdjustMode}
                          onChange={(e) =>
                            setCreditAdjustMode(e.target.value as 'add' | 'deduct' | 'promo')
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white outline-none"
                        >
                          <option value="promo">Give Promo Credits</option>
                          <option value="add">Add Credits (+)</option>
                          <option value="deduct">Deduct Credits (-)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 uppercase block mb-1">
                          Credits
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={creditAdjustAmount}
                          onChange={(e) => setCreditAdjustAmount(Number(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-emerald-400 font-mono-cinema outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 uppercase block mb-1">
                          Expiry (Days)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={creditAdjustExpiryDays}
                          onChange={(e) => setCreditAdjustExpiryDays(Number(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 font-mono-cinema outline-none"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          disabled={isAdjustingCredits}
                          onClick={() => void handleAdjustCustomerCredits()}
                          className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>{isAdjustingCredits ? 'Applying...' : 'Apply'}</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={creditAdjustReason}
                        onChange={(e) => setCreditAdjustReason(e.target.value)}
                        placeholder="Transaction note (recorded in audit & customer credit history)"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none"
                      />
                    </div>
                  </div>
                )}

                {allUsersAdmin.length === 0 ? (
                  <div className="p-6 text-xs text-slate-400">
                    No subscriber documents indexed yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono-cinema">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                        <tr>
                          <th className="py-3 px-4">Creator</th>
                          <th className="py-3 px-4">Email</th>
                          <th className="py-3 px-4">Role</th>
                          <th className="py-3 px-4">Active Plan</th>
                          <th className="py-3 px-4">Credits Remaining</th>
                          <th className="py-3 px-4">Used / Mo</th>
                          <th className="py-3 px-4 text-right">Adjust Plan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {allUsersAdmin.map((u) => (
                          <tr key={u.uid} className="hover:bg-slate-800/40">
                            <td className="py-3 px-4 font-bold text-white">{u.displayName}</td>
                            <td className="py-3 px-4 text-slate-300">{u.email}</td>
                            <td className="py-3 px-4 uppercase text-amber-300">{u.role}</td>
                            <td className="py-3 px-4 text-cyan-300 font-bold">{u.plan}</td>
                            <td className="py-3 px-4 text-emerald-400">{u.creditsRemaining.toLocaleString()}</td>
                            <td className="py-3 px-4 text-slate-400">{u.creditsUsedThisMonth.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right">
                              <select
                                value={u.plan}
                                onChange={(e) => void handlePlanChange(u.uid, e.target.value as SubscriptionPlanName)}
                                aria-label={`Change plan for ${u.email}`}
                                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-amber-400"
                              >
                                {pricingPlans.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Subscription Status & Credit Transaction Ledger (Admin View) */}
          {firebaseUser && isAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white font-mono-cinema uppercase">
                  Customer Subscription Status ({adminSubscriptions.length})
                </h3>
                {adminSubscriptions.length === 0 ? (
                  <p className="text-xs text-slate-400">No active customer subscriptions recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono-cinema">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                        <tr>
                          <th className="py-2 px-3">Customer</th>
                          <th className="py-2 px-3">Plan</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3 text-right">Control</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {adminSubscriptions.map((sub) => (
                          <tr key={sub.id}>
                            <td className="py-2.5 px-3 text-slate-200">{sub.userEmail}</td>
                            <td className="py-2.5 px-3 text-cyan-300">
                              {sub.planName || sub.planId} ({sub.billingCycle})
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                  sub.status === 'active'
                                    ? 'bg-emerald-500/15 text-emerald-300'
                                    : 'bg-rose-500/15 text-rose-300'
                                }`}
                              >
                                {sub.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  void handleAdminSubStatus(
                                    sub.userId,
                                    sub.status === 'active' ? 'cancel' : 'activate'
                                  )
                                }
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px]"
                              >
                                {sub.status === 'active' ? 'Cancel' : 'Reactivate'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white font-mono-cinema uppercase">
                  Credit Transaction History ({creditTransactions.length})
                </h3>
                {creditTransactions.length === 0 ? (
                  <p className="text-xs text-slate-400">No credit ledger entries yet.</p>
                ) : (
                  <div className="overflow-x-auto max-h-72">
                    <table className="w-full text-left text-xs font-mono-cinema">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                        <tr>
                          <th className="py-2 px-3">Customer</th>
                          <th className="py-2 px-3">Type</th>
                          <th className="py-2 px-3 text-right">Delta</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {creditTransactions.slice(0, 25).map((tx) => (
                          <tr key={tx.id}>
                            <td className="py-2 px-3">
                              <div className="text-slate-200">{tx.userEmail}</div>
                              <div className="text-[10px] text-slate-400 font-sans truncate max-w-[200px]">
                                {tx.description}
                              </div>
                            </td>
                            <td className="py-2 px-3 text-cyan-300 uppercase text-[10px]">
                              {tx.type.replace('_', ' ')}
                            </td>
                            <td
                              className={`py-2 px-3 text-right font-bold ${
                                tx.creditsDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
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
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Usage Telemetry */}
      {adminTab === 'usage' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-mono-cinema uppercase">
              Studio AI Synthesis & Export Audit Log
            </h3>
            <span className="text-xs text-slate-400 font-mono-cinema">
              {isAdmin ? `${allUsageAdmin.length} events` : 'Admin access required'}
            </span>
          </div>

          {!firebaseUser || !isAdmin ? (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl space-y-3">
              <p className="text-xs text-slate-300">
                Administrator privileges required to review workspace-wide synthesis telemetry.
              </p>
              <button
                type="button"
                onClick={openAuthModal}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg"
              >
                {firebaseUser ? 'Switch Account' : 'Sign In as Admin'}
              </button>
            </div>
          ) : allUsageAdmin.length === 0 ? (
            <div className="p-6 text-xs text-slate-400">
              No generation logs recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono-cinema">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                  <tr>
                    <th className="py-3 px-4">Workspace Tool</th>
                    <th className="py-3 px-4">Provider</th>
                    <th className="py-3 px-4">Summary</th>
                    <th className="py-3 px-4 text-right">Credits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {allUsageAdmin.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-white">{log.tool}</td>
                      <td className="py-3 px-4 text-cyan-300">{log.provider}</td>
                      <td className="py-3 px-4 text-slate-300 font-sans">{log.summary}</td>
                      <td className="py-3 px-4 text-right text-amber-400">-{log.creditsUsed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: API & Backend Integrations Status */}
      {adminTab === 'apis' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white font-mono-cinema uppercase">
                Connected AI Providers & Environment Configuration
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                API keys are managed exclusively via Cloud Run / AI Studio server Environment Variables (never stored in browser state).
              </p>
            </div>
            <span className="text-xs font-mono-cinema text-emerald-400">
              {backendProviders.filter((p) => p.configured).length} / {backendProviders.length} Configured
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {backendProviders.map((prov) => (
              <div
                key={prov.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-white truncate">{prov.name}</span>
                  <span
                    className={`font-mono-cinema text-[11px] px-2 py-0.5 rounded border ${
                      prov.configured
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {prov.configured ? 'ACTIVE' : 'FALLBACK'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">{prov.category}</div>
                <div className="text-[11px] font-mono-cinema text-cyan-300">{prov.status}</div>
                <div className="text-[10px] text-slate-500 border-t border-slate-900 pt-1.5 flex items-center justify-between">
                  <span>{prov.keySource}</span>
                  <span>{prov.latency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
