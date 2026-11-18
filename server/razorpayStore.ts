import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export type PricingPlanId = string;
export type BillingCycle = 'monthly' | 'yearly';
export type RazorpayPaymentMethod = 'upi' | 'card' | 'netbanking';

export interface PlanFeatureAccess {
  aiVoice: boolean;
  musicSfx: boolean;
  aiVideo: boolean;
  manhwaStudio: boolean;
  aiFilmMaker: boolean;
  export4k: boolean;
}

export interface PricingPlanConfig {
  id: PricingPlanId;
  name: string;
  tagline: string;
  monthlyPriceInr: number;
  yearlyPriceInr: number;
  monthlyCredits: number;
  creditExpiryDays: number; // 0 = never expires
  discountPercent: number; // 0 - 90
  enabled: boolean;
  features: string[];
  featureAccess?: PlanFeatureAccess;
  highlighted?: boolean;
  isCustomContact?: boolean;
  isCustom?: boolean;
}

export interface AdminAuditLogEntry {
  id: string;
  adminEmail: string;
  action: string;
  summary: string;
  createdAt: string;
}

export interface CreditPackConfig {
  id: string;
  name: string;
  credits: number;
  priceInr: number;
  discountPercent: number; // 0 - 90
  creditExpiryDays: number; // 0 = never expires
  enabled: boolean;
  bonusLabel?: string;
}

export interface CreditTransactionRecord {
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

export interface BillingOrderRecord {
  orderId: string;
  userId: string;
  userEmail: string;
  userName: string;
  purchaseType: 'subscription' | 'credits';
  planId?: PricingPlanId;
  packId?: string;
  billingCycle?: BillingCycle;
  itemName: string;
  creditsToGrant: number;
  creditExpiryDays?: number;
  amountInr: number;
  amountPaise: number;
  currency: 'INR';
  mode: 'live' | 'test';
  status: 'created' | 'paid' | 'failed';
  createdAt: string;
  paidAt?: string;
}

export interface BillingPaymentRecord {
  id: string;
  invoiceId: string;
  orderId: string;
  paymentId: string;
  userId: string;
  userEmail: string;
  userName: string;
  purchaseType: 'subscription' | 'credits';
  planId?: PricingPlanId;
  packId?: string;
  billingCycle?: BillingCycle;
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

export interface UserSubscriptionRecord {
  id: string;
  userId: string;
  userEmail: string;
  planId: PricingPlanId;
  planName?: string;
  billingCycle: BillingCycle;
  status: 'active' | 'cancelled';
  cancelAtPeriodEnd: boolean;
  amountInr: number;
  monthlyCredits: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt?: string;
  lastOrderId?: string;
  lastPaymentId?: string;
}

interface BillingDatabaseState {
  plans: PricingPlanConfig[];
  creditPacks: CreditPackConfig[];
  orders: BillingOrderRecord[];
  payments: BillingPaymentRecord[];
  creditTransactions: CreditTransactionRecord[];
  subscriptions: Record<string, UserSubscriptionRecord>;
  auditLogs: AdminAuditLogEntry[];
  webhookEvents: Array<{
    id: string;
    event: string;
    receivedAt: string;
    orderId?: string;
    paymentId?: string;
    status: string;
  }>;
  updatedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const BILLING_DB_PATH = path.join(DATA_DIR, 'billing-db.json');

const EPHEMERAL_TEST_HMAC_SECRET =
  process.env.RAZORPAY_TEST_SIGNING_SECRET ||
  crypto.createHash('sha256').update(`fvs-razorpay-test-${process.cwd()}`).digest('hex');

const DEFAULT_PLANS: PricingPlanConfig[] = [
  {
    id: 'Free',
    name: 'Free',
    tagline: 'Limited AI credits to explore the platform',
    monthlyPriceInr: 0,
    yearlyPriceInr: 0,
    monthlyCredits: 10000,
    creditExpiryDays: 30,
    discountPercent: 0,
    enabled: true,
    features: [
      'Limited AI Voice & Text-to-Speech credits',
      'Standard 1080p Manhwa & Video previews',
      'Up to 3 active film studio projects',
    ],
    featureAccess: {
      aiVoice: true,
      musicSfx: true,
      aiVideo: false,
      manhwaStudio: true,
      aiFilmMaker: false,
      export4k: false,
    },
  },
  {
    id: 'Starter',
    name: 'Starter',
    tagline: 'Basic AI voice and video for solo creators',
    monthlyPriceInr: 499,
    yearlyPriceInr: 4990,
    monthlyCredits: 30000,
    creditExpiryDays: 30,
    discountPercent: 0,
    enabled: true,
    features: [
      'Basic AI Voice Studio & Music SFX',
      'Image-to-Video & Manhwa chapter animation',
      'Commercial MP3 & 1080p MP4 exports',
    ],
    featureAccess: {
      aiVoice: true,
      musicSfx: true,
      aiVideo: true,
      manhwaStudio: true,
      aiFilmMaker: false,
      export4k: false,
    },
  },
  {
    id: 'Creator',
    name: 'Creator',
    tagline: 'More generation credits and full creative tools',
    monthlyPriceInr: 1499,
    yearlyPriceInr: 14990,
    monthlyCredits: 100000,
    creditExpiryDays: 60,
    discountPercent: 0,
    enabled: true,
    highlighted: true,
    features: [
      '100,000 monthly shared AI generation credits',
      'ElevenLabs neural dubbing & multi-track timeline',
      'YouTube, Instagram & Blogger publishing tools',
    ],
    featureAccess: {
      aiVoice: true,
      musicSfx: true,
      aiVideo: true,
      manhwaStudio: true,
      aiFilmMaker: true,
      export4k: true,
    },
  },
  {
    id: 'Professional',
    name: 'Professional',
    tagline: 'Advanced film, VFX, and 4K production tools',
    monthlyPriceInr: 4999,
    yearlyPriceInr: 49990,
    monthlyCredits: 500000,
    creditExpiryDays: 90,
    discountPercent: 0,
    enabled: true,
    features: [
      '500,000 monthly AI credits + priority GPU queue',
      'Full AI Film Maker + 4K Cinema DCI exports',
      'Pro color grading, subtitles & multi-language ADR',
    ],
    featureAccess: {
      aiVoice: true,
      musicSfx: true,
      aiVideo: true,
      manhwaStudio: true,
      aiFilmMaker: true,
      export4k: true,
    },
  },
  {
    id: 'Enterprise',
    name: 'Enterprise',
    tagline: 'Custom usage, dedicated throughput & team features',
    monthlyPriceInr: 14999,
    yearlyPriceInr: 149990,
    monthlyCredits: 2000000,
    creditExpiryDays: 365,
    discountPercent: 0,
    enabled: true,
    features: [
      '2,000,000 monthly credits across studio seats',
      'Team call sheets, admin quota & API governance',
      'Dedicated Cloud Run scaling & SLA support',
    ],
    featureAccess: {
      aiVoice: true,
      musicSfx: true,
      aiVideo: true,
      manhwaStudio: true,
      aiFilmMaker: true,
      export4k: true,
    },
  },
];

const DEFAULT_CREDIT_PACKS: CreditPackConfig[] = [
  {
    id: 'pack-5k',
    name: '5,000 Studio Credits',
    credits: 5000,
    priceInr: 249,
    discountPercent: 0,
    creditExpiryDays: 365,
    enabled: true,
    bonusLabel: 'Quick Boost',
  },
  {
    id: 'pack-25k',
    name: '25,000 Studio Credits',
    credits: 25000,
    priceInr: 999,
    discountPercent: 0,
    creditExpiryDays: 365,
    enabled: true,
    bonusLabel: 'Save 20%',
  },
  {
    id: 'pack-100k',
    name: '100,000 Studio Credits',
    credits: 100000,
    priceInr: 3499,
    discountPercent: 0,
    creditExpiryDays: 365,
    enabled: true,
    bonusLabel: 'Best Value',
  },
  {
    id: 'pack-500k',
    name: '500,000 Studio Credits',
    credits: 500000,
    priceInr: 14999,
    discountPercent: 0,
    creditExpiryDays: 0,
    enabled: true,
    bonusLabel: 'Production Bundle',
  },
];

function cloneDefaultState(): BillingDatabaseState {
  return {
    plans: JSON.parse(JSON.stringify(DEFAULT_PLANS)),
    creditPacks: JSON.parse(JSON.stringify(DEFAULT_CREDIT_PACKS)),
    orders: [],
    payments: [],
    creditTransactions: [],
    subscriptions: {},
    auditLogs: [],
    webhookEvents: [],
    updatedAt: new Date().toISOString(),
  };
}

function loadBillingDb(): BillingDatabaseState {
  try {
    if (fs.existsSync(BILLING_DB_PATH)) {
      const raw = fs.readFileSync(BILLING_DB_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<BillingDatabaseState>;
      const fallback = cloneDefaultState();
      const loadedPlans =
        Array.isArray(parsed.plans) && parsed.plans.length > 0
          ? parsed.plans.map((p) => {
              const def = DEFAULT_PLANS.find((d) => d.id === p.id);
              return {
                ...(def || {
                  creditExpiryDays: 30,
                  discountPercent: 0,
                  enabled: true,
                  features: ['AI studio generation credits'],
                }),
                ...p,
                enabled: typeof p.enabled === 'boolean' ? p.enabled : true,
                discountPercent: Number.isFinite(Number(p.discountPercent)) ? Number(p.discountPercent) : 0,
                creditExpiryDays: Number.isFinite(Number(p.creditExpiryDays)) ? Number(p.creditExpiryDays) : (def?.creditExpiryDays ?? 30),
                featureAccess: {
                  ...(def?.featureAccess || {
                    aiVoice: true,
                    musicSfx: true,
                    aiVideo: true,
                    manhwaStudio: true,
                    aiFilmMaker: true,
                    export4k: true,
                  }),
                  ...(p.featureAccess || {}),
                },
              } as PricingPlanConfig;
            })
          : fallback.plans;
      const loadedPacks =
        Array.isArray(parsed.creditPacks) && parsed.creditPacks.length > 0
          ? parsed.creditPacks.map((pk) => {
              const def = DEFAULT_CREDIT_PACKS.find((d) => d.id === pk.id);
              return {
                ...(def || {
                  discountPercent: 0,
                  creditExpiryDays: 365,
                  enabled: true,
                }),
                ...pk,
                enabled: typeof pk.enabled === 'boolean' ? pk.enabled : true,
                discountPercent: Number.isFinite(Number(pk.discountPercent)) ? Number(pk.discountPercent) : 0,
                creditExpiryDays: Number.isFinite(Number(pk.creditExpiryDays)) ? Number(pk.creditExpiryDays) : (def?.creditExpiryDays ?? 365),
              } as CreditPackConfig;
            })
          : fallback.creditPacks;
      return {
        plans: loadedPlans,
        creditPacks: loadedPacks,
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        payments: Array.isArray(parsed.payments) ? parsed.payments : [],
        creditTransactions: Array.isArray(parsed.creditTransactions) ? parsed.creditTransactions : [],
        subscriptions:
          parsed.subscriptions && typeof parsed.subscriptions === 'object' ? parsed.subscriptions : {},
        auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
        webhookEvents: Array.isArray(parsed.webhookEvents) ? parsed.webhookEvents : [],
        updatedAt: parsed.updatedAt || fallback.updatedAt,
      };
    }
  } catch {
    // Fallback cleanly on malformed JSON
  }
  return cloneDefaultState();
}

function saveBillingDb(state: BillingDatabaseState) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    state.updatedAt = new Date().toISOString();
    fs.writeFileSync(BILLING_DB_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Unable to persist billing-db.json:', err);
  }
}

export function getRazorpayConfigStatus() {
  const keyId = String(process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || '').trim();
  const webhookSecret = String(process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();
  const isLiveKeysConfigured = Boolean(keyId && keySecret && keyId.startsWith('rzp_'));

  return {
    configured: isLiveKeysConfigured,
    mode: isLiveKeysConfigured ? ('live' as const) : ('test' as const),
    keyId: isLiveKeysConfigured ? keyId : 'rzp_test_fvs_sandbox',
    webhookConfigured: Boolean(webhookSecret),
    supportedMethods: ['upi', 'card', 'netbanking'] as RazorpayPaymentMethod[],
  };
}

function computeExpectedSignature(orderId: string, paymentId: string, mode: 'live' | 'test'): string {
  const liveSecret = String(process.env.RAZORPAY_KEY_SECRET || '').trim();
  const secret = mode === 'live' && liveSecret ? liveSecret : EPHEMERAL_TEST_HMAC_SECRET;
  return crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
}

function safeTimingEqualHex(a: string, b: string): boolean {
  const cleanA = String(a || '').trim();
  const cleanB = String(b || '').trim();
  if (!cleanA || !cleanB || cleanA.length !== cleanB.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(cleanA, 'utf8'), Buffer.from(cleanB, 'utf8'));
  } catch {
    return false;
  }
}

export function computeEffectivePriceInr(basePriceInr: number, discountPercent?: number): number {
  const cleanBase = Math.max(0, Math.round(Number(basePriceInr) || 0));
  if (cleanBase === 0) return 0;
  const pct = Math.max(0, Math.min(90, Number(discountPercent || 0)));
  if (pct <= 0) return cleanBase;
  return Math.max(1, Math.round(cleanBase * (1 - pct / 100)));
}

export function getSanitizedBillingState(userId?: string, includeAll?: boolean) {
  const db = loadBillingDb();
  const status = getRazorpayConfigStatus();
  const cleanUserId = String(userId || '').trim();

  const userPayments = includeAll
    ? db.payments
    : cleanUserId
    ? db.payments.filter((p) => p.userId === cleanUserId)
    : db.payments;

  const userTransactions = includeAll
    ? db.creditTransactions
    : cleanUserId
    ? db.creditTransactions.filter((t) => t.userId === cleanUserId)
    : db.creditTransactions;

  const subscription = cleanUserId ? db.subscriptions[cleanUserId] || null : null;

  return {
    razorpay: status,
    plans: db.plans,
    creditPacks: db.creditPacks,
    payments: userPayments.slice(0, 100),
    creditTransactions: userTransactions.slice(0, 150),
    activeSubscription: subscription,
    allSubscriptions: includeAll ? Object.values(db.subscriptions) : undefined,
    auditLogs: includeAll ? db.auditLogs.slice(0, 100) : undefined,
    updatedAt: db.updatedAt,
  };
}

const PRIMARY_ADMIN_EMAIL = 'zkm.information@gmail.com';

function readFirebaseApiKey(): string {
  try {
    const cfgPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(cfgPath)) {
      const parsed = JSON.parse(fs.readFileSync(cfgPath, 'utf-8')) as { apiKey?: string };
      return String(parsed.apiKey || '').trim();
    }
  } catch {
    // Ignore
  }
  return '';
}

export async function verifyAdminBearerToken(authorizationHeader?: string): Promise<string> {
  const raw = String(authorizationHeader || '').trim();
  const token = raw.startsWith('Bearer ') ? raw.slice(7).trim() : '';
  if (!token) {
    throw new Error('Administrator sign-in token is required to modify pricing.');
  }

  const apiKey = readFirebaseApiKey();
  if (!apiKey) {
    throw new Error('Firebase Web API key missing on server for admin verification.');
  }

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    }
  );
  if (!res.ok) {
    throw new Error('Invalid or expired administrator authentication session.');
  }

  const data = (await res.json()) as {
    users?: Array<{ email?: string; emailVerified?: boolean }>;
  };
  const verifiedUser = data.users?.[0];
  if (
    !verifiedUser ||
    verifiedUser.emailVerified !== true ||
    verifiedUser.email !== PRIMARY_ADMIN_EMAIL
  ) {
    throw new Error('Access denied: Only authorized studio administrators can edit pricing.');
  }

  return verifiedUser.email;
}

export function updateAdminPricingConfig(
  payload: {
    plans?: Array<Partial<PricingPlanConfig> & { id: PricingPlanId }>;
    creditPacks?: Array<Partial<CreditPackConfig> & { id: string }>;
  },
  adminEmail: string = PRIMARY_ADMIN_EMAIL
) {
  const db = loadBillingDb();
  const changeSummaries: string[] = [];

  if (Array.isArray(payload.plans) && payload.plans.length > 0) {
    const prevIds = new Set(db.plans.map((p) => p.id));
    const nextPlans: PricingPlanConfig[] = payload.plans.slice(0, 12).map((incoming, idx) => {
      const existing = db.plans.find((p) => p.id === incoming.id);
      const cleanId = String(incoming.id || `plan_${Date.now()}_${idx}`).trim().slice(0, 48);
      const cleanName = String(incoming.name || existing?.name || 'Custom Plan').trim().slice(0, 48);
      const monthlyPriceInr = Math.max(0, Math.round(Number(incoming.monthlyPriceInr ?? existing?.monthlyPriceInr ?? 0) || 0));
      const yearlyPriceInr = Math.max(0, Math.round(Number(incoming.yearlyPriceInr ?? existing?.yearlyPriceInr ?? 0) || 0));
      const monthlyCredits = Math.max(100, Math.min(5000000, Math.round(Number(incoming.monthlyCredits ?? existing?.monthlyCredits ?? 10000) || 10000)));
      const creditExpiryDays = Math.max(0, Math.min(3650, Math.round(Number(incoming.creditExpiryDays ?? existing?.creditExpiryDays ?? 30) || 0)));
      const discountPercent = Math.max(0, Math.min(90, Math.round(Number(incoming.discountPercent ?? existing?.discountPercent ?? 0) || 0)));
      const enabled = typeof incoming.enabled === 'boolean' ? incoming.enabled : existing?.enabled ?? true;

      const nextFeatureAccess: PlanFeatureAccess = {
        ...(existing?.featureAccess || {
          aiVoice: true,
          musicSfx: true,
          aiVideo: true,
          manhwaStudio: true,
          aiFilmMaker: true,
          export4k: false,
        }),
        ...(incoming.featureAccess || {}),
      };

      if (!existing) {
        changeSummaries.push(`Created plan "${cleanName}" (₹${monthlyPriceInr}/mo, ${monthlyCredits.toLocaleString()} credits)`);
      } else if (
        cleanName !== existing.name ||
        monthlyPriceInr !== existing.monthlyPriceInr ||
        yearlyPriceInr !== existing.yearlyPriceInr ||
        monthlyCredits !== existing.monthlyCredits ||
        creditExpiryDays !== existing.creditExpiryDays ||
        discountPercent !== existing.discountPercent ||
        enabled !== existing.enabled ||
        JSON.stringify(nextFeatureAccess) !== JSON.stringify(existing.featureAccess)
      ) {
        changeSummaries.push(
          `${cleanName} (${enabled ? 'Enabled' : 'Disabled'}): ₹${monthlyPriceInr}/mo, ${discountPercent}% off, ${monthlyCredits.toLocaleString()} credits, ${creditExpiryDays === 0 ? 'No expiry' : `${creditExpiryDays}d expiry`}`
        );
      }

      return {
        id: cleanId,
        name: cleanName,
        tagline:
          typeof incoming.tagline === 'string' && incoming.tagline.trim()
            ? incoming.tagline.trim().slice(0, 140)
            : existing?.tagline || 'Custom studio AI generation plan',
        monthlyPriceInr,
        yearlyPriceInr,
        monthlyCredits,
        creditExpiryDays,
        discountPercent,
        enabled,
        features: Array.isArray(incoming.features)
          ? incoming.features.map((f) => String(f).trim()).filter(Boolean).slice(0, 6)
          : existing?.features || ['AI generation credits across studio tools'],
        featureAccess: nextFeatureAccess,
        highlighted: typeof incoming.highlighted === 'boolean' ? incoming.highlighted : existing?.highlighted,
        isCustomContact: typeof incoming.isCustomContact === 'boolean' ? incoming.isCustomContact : existing?.isCustomContact,
        isCustom: existing ? existing.isCustom : true,
      };
    });

    const nextIds = new Set(nextPlans.map((p) => p.id));
    for (const oldId of prevIds) {
      if (!nextIds.has(oldId)) {
        const removed = db.plans.find((p) => p.id === oldId);
        changeSummaries.push(`Deleted plan "${removed?.name || oldId}"`);
      }
    }
    db.plans = nextPlans;
  }

  if (Array.isArray(payload.creditPacks) && payload.creditPacks.length > 0) {
    const prevPackIds = new Set(db.creditPacks.map((pk) => pk.id));
    const nextPacks: CreditPackConfig[] = payload.creditPacks.slice(0, 16).map((incoming, idx) => {
      const existing = db.creditPacks.find((p) => p.id === incoming.id);
      const cleanId = String(incoming.id || `pack_${Date.now()}_${idx}`).trim().slice(0, 48);
      const cleanName = String(incoming.name || existing?.name || 'Custom Credit Pack').trim().slice(0, 80);
      const nextCredits = Math.max(100, Math.min(5000000, Math.round(Number(incoming.credits ?? existing?.credits ?? 5000) || 5000)));
      const nextPrice = Math.max(1, Math.round(Number(incoming.priceInr ?? existing?.priceInr ?? 199) || 199));
      const discountPercent = Math.max(0, Math.min(90, Math.round(Number(incoming.discountPercent ?? existing?.discountPercent ?? 0) || 0)));
      const creditExpiryDays = Math.max(0, Math.min(3650, Math.round(Number(incoming.creditExpiryDays ?? existing?.creditExpiryDays ?? 365) || 0)));
      const enabled = typeof incoming.enabled === 'boolean' ? incoming.enabled : existing?.enabled ?? true;

      if (!existing) {
        changeSummaries.push(`Created pack "${cleanName}" (${nextCredits.toLocaleString()} credits · ₹${nextPrice})`);
      } else if (
        cleanName !== existing.name ||
        nextCredits !== existing.credits ||
        nextPrice !== existing.priceInr ||
        discountPercent !== existing.discountPercent ||
        creditExpiryDays !== existing.creditExpiryDays ||
        enabled !== existing.enabled
      ) {
        changeSummaries.push(
          `Pack "${cleanName}" (${enabled ? 'Enabled' : 'Disabled'}): ${nextCredits.toLocaleString()} credits for ₹${nextPrice} (${discountPercent}% off)`
        );
      }

      return {
        id: cleanId,
        name: cleanName,
        credits: nextCredits,
        priceInr: nextPrice,
        discountPercent,
        creditExpiryDays,
        enabled,
        bonusLabel:
          typeof incoming.bonusLabel === 'string'
            ? incoming.bonusLabel.trim().slice(0, 40)
            : existing?.bonusLabel || 'Top-Up',
      };
    });

    const nextPackIds = new Set(nextPacks.map((pk) => pk.id));
    for (const oldId of prevPackIds) {
      if (!nextPackIds.has(oldId)) {
        const removed = db.creditPacks.find((pk) => pk.id === oldId);
        changeSummaries.push(`Deleted pack "${removed?.name || oldId}"`);
      }
    }
    db.creditPacks = nextPacks;
  }

  const auditEntry: AdminAuditLogEntry = {
    id: `aud_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
    adminEmail,
    action: 'UPDATE_PRICING_CONFIG',
    summary:
      changeSummaries.length > 0
        ? changeSummaries.join(' | ').slice(0, 400)
        : 'Published updated plan pricing & package configuration',
    createdAt: new Date().toISOString(),
  };
  db.auditLogs.unshift(auditEntry);
  if (db.auditLogs.length > 200) db.auditLogs = db.auditLogs.slice(0, 200);

  saveBillingDb(db);
  return getSanitizedBillingState(undefined, true);
}

export function adjustCustomerCreditsByAdmin(
  input: {
    userId: string;
    userEmail: string;
    mode: 'add' | 'deduct' | 'promo';
    creditsAmount: number;
    reason?: string;
    creditExpiryDays?: number;
  },
  adminEmail: string = PRIMARY_ADMIN_EMAIL
) {
  const userId = String(input.userId || '').trim().slice(0, 128);
  const userEmail = String(input.userEmail || 'customer@studio.local').trim().slice(0, 200);
  const amount = Math.max(1, Math.min(5000000, Math.round(Number(input.creditsAmount) || 0)));
  if (!userId || !amount) {
    throw new Error('Target user ID and valid credit amount are required.');
  }

  const now = new Date();
  const mode = input.mode === 'deduct' ? 'deduct' : input.mode === 'promo' ? 'promo' : 'add';
  const delta = mode === 'deduct' ? -amount : amount;
  const expiryDays = Math.max(0, Math.min(3650, Math.round(Number(input.creditExpiryDays ?? 0) || 0)));
  const expiresAt =
    mode !== 'deduct' && expiryDays > 0
      ? new Date(now.getTime() + expiryDays * 86400000).toISOString()
      : undefined;

  const db = loadBillingDb();
  const txId = `ctx_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const defaultReason =
    mode === 'promo'
      ? `Promotional AI credits grant (${amount.toLocaleString()} credits)`
      : mode === 'deduct'
      ? `Admin credit deduction (-${amount.toLocaleString()} credits)`
      : `Admin manual credit top-up (+${amount.toLocaleString()} credits)`;

  const tx: CreditTransactionRecord = {
    id: txId,
    userId,
    userEmail,
    type: mode === 'promo' ? 'promo_grant' : mode === 'deduct' ? 'admin_deduct' : 'admin_add',
    creditsDelta: delta,
    description: String(input.reason || defaultReason).trim().slice(0, 220) || defaultReason,
    referenceId: txId,
    performedBy: adminEmail,
    expiresAt,
    createdAt: now.toISOString(),
  };

  db.creditTransactions.unshift(tx);
  if (db.creditTransactions.length > 500) db.creditTransactions = db.creditTransactions.slice(0, 500);

  db.auditLogs.unshift({
    id: `aud_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
    adminEmail,
    action: mode === 'promo' ? 'PROMO_CREDIT_GRANT' : mode === 'deduct' ? 'ADMIN_CREDIT_DEDUCT' : 'ADMIN_CREDIT_ADD',
    summary: `${userEmail}: ${delta > 0 ? `+${delta.toLocaleString()}` : delta.toLocaleString()} credits · ${tx.description}`,
    createdAt: now.toISOString(),
  });
  if (db.auditLogs.length > 200) db.auditLogs = db.auditLogs.slice(0, 200);

  saveBillingDb(db);
  return {
    success: true,
    transaction: tx,
    ...getSanitizedBillingState(undefined, true),
  };
}

export function adminUpdateSubscriptionStatus(
  userId: string,
  action: 'cancel' | 'activate',
  adminEmail: string = PRIMARY_ADMIN_EMAIL
) {
  const cleanUid = String(userId || '').trim();
  const db = loadBillingDb();
  const sub = db.subscriptions[cleanUid];
  if (!sub) {
    throw new Error('Subscription record not found for user.');
  }
  const now = new Date();
  if (action === 'cancel') {
    sub.status = 'cancelled';
    sub.cancelAtPeriodEnd = true;
    sub.cancelledAt = now.toISOString();
  } else {
    sub.status = 'active';
    sub.cancelAtPeriodEnd = false;
    sub.cancelledAt = undefined;
  }
  db.subscriptions[cleanUid] = sub;

  db.auditLogs.unshift({
    id: `aud_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
    adminEmail,
    action: action === 'cancel' ? 'ADMIN_CANCEL_SUBSCRIPTION' : 'ADMIN_REACTIVATE_SUBSCRIPTION',
    summary: `${sub.userEmail} (${sub.planId}) marked ${sub.status}`,
    createdAt: now.toISOString(),
  });
  if (db.auditLogs.length > 200) db.auditLogs = db.auditLogs.slice(0, 200);

  saveBillingDb(db);
  return {
    success: true,
    subscription: sub,
    ...getSanitizedBillingState(undefined, true),
  };
}

export async function createPaymentOrder(input: {
  userId: string;
  userEmail: string;
  userName: string;
  purchaseType: 'subscription' | 'credits';
  planId?: PricingPlanId;
  packId?: string;
  billingCycle?: BillingCycle;
}) {
  const db = loadBillingDb();
  const status = getRazorpayConfigStatus();

  const userId = String(input.userId || 'guest_studio_user').trim().slice(0, 128);
  const userEmail = String(input.userEmail || 'creator@filmvideostudio.local').trim().slice(0, 200);
  const userName = String(input.userName || 'Studio Creator').trim().slice(0, 120);

  let itemName = '';
  let amountInr = 0;
  let creditsToGrant = 0;
  let creditExpiryDays = 0;
  let planId: PricingPlanId | undefined;
  let packId: string | undefined;
  let billingCycle: BillingCycle | undefined;

  if (input.purchaseType === 'subscription') {
    const plan = db.plans.find((p) => p.id === input.planId);
    if (!plan) {
      throw new Error('Selected subscription plan was not found.');
    }
    if (plan.enabled === false) {
      throw new Error(`${plan.name} plan is currently disabled by studio administrator.`);
    }
    billingCycle = input.billingCycle === 'yearly' ? 'yearly' : 'monthly';
    planId = plan.id;
    const basePrice = billingCycle === 'yearly' ? plan.yearlyPriceInr : plan.monthlyPriceInr;
    amountInr = computeEffectivePriceInr(basePrice, plan.discountPercent);
    creditsToGrant = plan.monthlyCredits;
    creditExpiryDays = plan.creditExpiryDays || 0;
    itemName = `${plan.name} Plan (${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'})`;

    // Free plan instant activation (no Razorpay payment needed when effective price is 0)
    if (amountInr === 0) {
      const now = new Date();
      const end = new Date(now.getTime() + (billingCycle === 'yearly' ? 365 : 30) * 86400000);
      const sub: UserSubscriptionRecord = {
        id: `sub_${Date.now()}`,
        userId,
        userEmail,
        planId: plan.id,
        planName: plan.name,
        billingCycle,
        status: 'active',
        cancelAtPeriodEnd: false,
        amountInr: 0,
        monthlyCredits: plan.monthlyCredits,
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: end.toISOString(),
      };
      db.subscriptions[userId] = sub;

      const expiresAt =
        creditExpiryDays > 0
          ? new Date(now.getTime() + creditExpiryDays * 86400000).toISOString()
          : undefined;
      db.creditTransactions.unshift({
        id: `ctx_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
        userId,
        userEmail,
        type: 'free_activation',
        creditsDelta: plan.monthlyCredits,
        description: `Activated ${plan.name} (${plan.monthlyCredits.toLocaleString()} credits)`,
        referenceId: sub.id,
        performedBy: 'system',
        expiresAt,
        createdAt: now.toISOString(),
      });
      if (db.creditTransactions.length > 500) db.creditTransactions = db.creditTransactions.slice(0, 500);

      saveBillingDb(db);
      return {
        freeActivation: true,
        subscription: sub,
        grant: {
          purchaseType: 'subscription' as const,
          planId: plan.id,
          planName: plan.name,
          billingCycle,
          creditsToAdd: 0,
          setMonthlyCredits: plan.monthlyCredits,
        },
        ...getSanitizedBillingState(userId),
      };
    }
  } else {
    const pack = db.creditPacks.find((p) => p.id === input.packId);
    if (!pack) {
      throw new Error('Selected credit package was not found.');
    }
    if (pack.enabled === false) {
      throw new Error(`${pack.name} credit package is currently disabled by studio administrator.`);
    }
    packId = pack.id;
    amountInr = computeEffectivePriceInr(pack.priceInr, pack.discountPercent);
    creditsToGrant = pack.credits;
    creditExpiryDays = pack.creditExpiryDays || 0;
    itemName = `${pack.name} (One-Time Purchase)`;
  }

  const amountPaise = Math.round(amountInr * 100);
  const receipt = `fvs_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  let orderId = '';

  if (status.configured) {
    const keyId = String(process.env.RAZORPAY_KEY_ID || '').trim();
    const keySecret = String(process.env.RAZORPAY_KEY_SECRET || '').trim();
    const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt,
        notes: {
          userId,
          userEmail,
          purchaseType: input.purchaseType,
          planId: planId || '',
          packId: packId || '',
          billingCycle: billingCycle || '',
        },
      }),
    });

    if (!rzpRes.ok) {
      const errBody = await rzpRes.text();
      throw new Error(`Razorpay Order API error (${rzpRes.status}): ${errBody}`);
    }
    const rzpOrder = (await rzpRes.json()) as { id: string };
    orderId = rzpOrder.id;
  } else {
    orderId = `order_test_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  const order: BillingOrderRecord = {
    orderId,
    userId,
    userEmail,
    userName,
    purchaseType: input.purchaseType,
    planId,
    packId,
    billingCycle,
    itemName,
    creditsToGrant,
    creditExpiryDays,
    amountInr,
    amountPaise,
    currency: 'INR',
    mode: status.mode,
    status: 'created',
    createdAt: new Date().toISOString(),
  };

  db.orders.unshift(order);
  if (db.orders.length > 300) db.orders = db.orders.slice(0, 300);
  saveBillingDb(db);

  return {
    freeActivation: false,
    order,
    razorpay: status,
  };
}

export function completeTestGatewayCheckout(input: {
  orderId: string;
  method: RazorpayPaymentMethod;
  simulateFailure?: boolean;
}) {
  const status = getRazorpayConfigStatus();
  if (status.configured) {
    throw new Error('Test gateway simulation is disabled while Live Razorpay keys are active.');
  }

  const db = loadBillingDb();
  const order = db.orders.find((o) => o.orderId === input.orderId);
  if (!order) {
    throw new Error('Order not found for test checkout.');
  }
  if (order.mode !== 'test') {
    throw new Error('Cannot complete a live Razorpay order through the test gateway.');
  }

  if (input.simulateFailure) {
    order.status = 'failed';
    saveBillingDb(db);
    return {
      success: false,
      error: {
        code: 'BAD_REQUEST_ERROR',
        description: `Payment declined in Razorpay Test Mode (${input.method.toUpperCase()} authorization failed). No credits were added.`,
      },
    };
  }

  const paymentId = `pay_test_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const signature = computeExpectedSignature(order.orderId, paymentId, 'test');

  return {
    success: true,
    razorpay_order_id: order.orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
    method: input.method,
  };
}

export function verifyRazorpayPayment(input: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  method?: RazorpayPaymentMethod;
}) {
  const orderId = String(input.razorpay_order_id || '').trim();
  const paymentId = String(input.razorpay_payment_id || '').trim();
  const signature = String(input.razorpay_signature || '').trim();

  if (!orderId || !paymentId || !signature) {
    throw new Error('Missing Razorpay verification fields (order_id, payment_id, signature).');
  }

  const db = loadBillingDb();
  const order = db.orders.find((o) => o.orderId === orderId);
  if (!order) {
    throw new Error('Order record not found on server. Payment cannot be verified.');
  }

  // Idempotency check if this exact payment was already verified
  const existingPayment = db.payments.find(
    (p) => p.orderId === orderId && p.paymentId === paymentId && p.status === 'captured'
  );
  if (existingPayment) {
    return {
      verified: true,
      alreadyProcessed: true,
      payment: existingPayment,
      subscription: db.subscriptions[order.userId] || null,
      grant: {
        purchaseType: order.purchaseType,
        planId: order.planId,
        billingCycle: order.billingCycle,
        creditsToAdd: 0,
        setMonthlyCredits: undefined,
      },
      ...getSanitizedBillingState(order.userId),
    };
  }

  if (order.status === 'paid') {
    throw new Error('Order has already been settled with a different payment ID.');
  }

  const expectedSig = computeExpectedSignature(orderId, paymentId, order.mode);
  if (!safeTimingEqualHex(expectedSig, signature)) {
    order.status = 'failed';
    saveBillingDb(db);
    throw new Error('HMAC-SHA256 payment signature verification failed. Credits were not issued.');
  }

  // Signature is cryptographically verified -> fulfill order
  const now = new Date();
  order.status = 'paid';
  order.paidAt = now.toISOString();

  const taxInr = Number((order.amountInr - order.amountInr / 1.18).toFixed(2));
  const subtotalInr = Number((order.amountInr - taxInr).toFixed(2));
  const invoiceId = `INV-FVS-${now.getFullYear()}-${String(db.payments.length + 1001).padStart(4, '0')}`;
  const method: RazorpayPaymentMethod =
    input.method && ['upi', 'card', 'netbanking'].includes(input.method) ? input.method : 'upi';

  const paymentRecord: BillingPaymentRecord = {
    id: `payrec_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
    invoiceId,
    orderId: order.orderId,
    paymentId,
    userId: order.userId,
    userEmail: order.userEmail,
    userName: order.userName,
    purchaseType: order.purchaseType,
    planId: order.planId,
    packId: order.packId,
    billingCycle: order.billingCycle,
    itemName: order.itemName,
    creditsGranted: order.creditsToGrant,
    amountInr: order.amountInr,
    taxInr,
    subtotalInr,
    currency: 'INR',
    method,
    mode: order.mode,
    status: 'captured',
    createdAt: now.toISOString(),
  };

  db.payments.unshift(paymentRecord);
  if (db.payments.length > 500) db.payments = db.payments.slice(0, 500);

  let activeSub: UserSubscriptionRecord | null = db.subscriptions[order.userId] || null;
  if (order.purchaseType === 'subscription' && order.planId) {
    const planObj = db.plans.find((p) => p.id === order.planId);
    const cycle = order.billingCycle || 'monthly';
    const end = new Date(now.getTime() + (cycle === 'yearly' ? 365 : 30) * 86400000);
    activeSub = {
      id: `sub_${Date.now()}`,
      userId: order.userId,
      userEmail: order.userEmail,
      planId: order.planId,
      planName: planObj?.name || order.planId,
      billingCycle: cycle,
      status: 'active',
      cancelAtPeriodEnd: false,
      amountInr: order.amountInr,
      monthlyCredits: order.creditsToGrant,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: end.toISOString(),
      lastOrderId: order.orderId,
      lastPaymentId: paymentId,
    };
    db.subscriptions[order.userId] = activeSub;
  }

  const expiryDays = Number(order.creditExpiryDays || 0);
  const expiresAt =
    expiryDays > 0 ? new Date(now.getTime() + expiryDays * 86400000).toISOString() : undefined;

  db.creditTransactions.unshift({
    id: `ctx_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    userId: order.userId,
    userEmail: order.userEmail,
    type: order.purchaseType === 'subscription' ? 'payment_subscription' : 'payment_credits',
    creditsDelta: order.creditsToGrant,
    description: `${order.itemName} (Verified via Razorpay · ₹${order.amountInr})`,
    referenceId: invoiceId,
    performedBy: `razorpay_${method}`,
    expiresAt,
    createdAt: now.toISOString(),
  });
  if (db.creditTransactions.length > 500) db.creditTransactions = db.creditTransactions.slice(0, 500);

  saveBillingDb(db);

  return {
    verified: true,
    alreadyProcessed: false,
    payment: paymentRecord,
    subscription: activeSub,
    grant: {
      purchaseType: order.purchaseType,
      planId: order.planId,
      billingCycle: order.billingCycle,
      creditsToAdd: order.creditsToGrant,
      setMonthlyCredits: order.purchaseType === 'subscription' ? order.creditsToGrant : undefined,
    },
    ...getSanitizedBillingState(order.userId),
  };
}

export function cancelUserSubscription(userId: string) {
  const cleanUserId = String(userId || '').trim();
  if (!cleanUserId) {
    throw new Error('User ID is required to cancel subscription.');
  }

  const db = loadBillingDb();
  const sub = db.subscriptions[cleanUserId];
  if (!sub) {
    throw new Error('No active subscription found for this account.');
  }

  sub.status = 'cancelled';
  sub.cancelAtPeriodEnd = true;
  sub.cancelledAt = new Date().toISOString();
  db.subscriptions[cleanUserId] = sub;
  saveBillingDb(db);

  return {
    success: true,
    subscription: sub,
    ...getSanitizedBillingState(cleanUserId),
  };
}

export function processRazorpayWebhook(rawBody: string, signatureHeader: string) {
  const webhookSecret = String(process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();
  const secretToUse = webhookSecret || EPHEMERAL_TEST_HMAC_SECRET;

  const expected = crypto.createHmac('sha256', secretToUse).update(rawBody).digest('hex');
  if (!safeTimingEqualHex(expected, signatureHeader)) {
    throw new Error('Invalid Razorpay webhook signature.');
  }

  const eventPayload = JSON.parse(rawBody || '{}') as {
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string;
          method?: string;
          status?: string;
        };
      };
    };
  };

  const eventName = String(eventPayload.event || 'unknown');
  const paymentEntity = eventPayload.payload?.payment?.entity;
  const db = loadBillingDb();

  db.webhookEvents.unshift({
    id: `wh_${Date.now()}`,
    event: eventName,
    receivedAt: new Date().toISOString(),
    orderId: paymentEntity?.order_id,
    paymentId: paymentEntity?.id,
    status: 'verified',
  });
  if (db.webhookEvents.length > 200) db.webhookEvents = db.webhookEvents.slice(0, 200);

  if (eventName === 'payment.captured' && paymentEntity?.order_id && paymentEntity?.id) {
    const order = db.orders.find((o) => o.orderId === paymentEntity.order_id);
    if (order && order.status !== 'paid') {
      saveBillingDb(db);
      const sig = computeExpectedSignature(order.orderId, paymentEntity.id, order.mode);
      const mappedMethod: RazorpayPaymentMethod =
        paymentEntity.method === 'card' || paymentEntity.method === 'netbanking'
          ? paymentEntity.method
          : 'upi';
      verifyRazorpayPayment({
        razorpay_order_id: order.orderId,
        razorpay_payment_id: paymentEntity.id,
        razorpay_signature: sig,
        method: mappedMethod,
      });
      return { ok: true, event: eventName, settledOrderId: order.orderId };
    }
  }

  saveBillingDb(db);
  return { ok: true, event: eventName };
}

export function getInvoiceHtmlById(invoiceId: string): string | null {
  const db = loadBillingDb();
  const cleanId = String(invoiceId || '').trim();
  const payment = db.payments.find((p) => p.invoiceId === cleanId || p.id === cleanId);
  if (!payment) return null;

  const esc = (v: unknown) =>
    String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${esc(payment.invoiceId)} · ZKMAP STUDIO (zkmapstudio.com)</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #111827; background: #f9fafb; margin: 0; padding: 32px; }
    .card { max-width: 720px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #e5e7eb; padding-bottom: 24px; margin-bottom: 24px; }
    .brand-wrap { display: flex; align-items: center; gap: 12px; }
    .brand-logo { height: 48px; width: auto; border-radius: 10px; border: 1px solid #e5e7eb; object-fit: contain; }
    .brand { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
    .muted { color: #6b7280; font-size: 13px; margin-top: 4px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; font-size: 13px; }
    .label { color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px; }
    th { text-align: left; font-size: 12px; color: #6b7280; border-bottom: 1px solid #e5e7eb; padding: 10px 0; }
    td { padding: 14px 0; border-bottom: 1px solid #f3f4f6; }
    .right { text-align: right; font-variant-numeric: tabular-nums; }
    .totals { margin-top: 20px; max-width: 280px; margin-left: auto; font-size: 14px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; color: #4b5563; }
    .totals-final { display: flex; justify-content: space-between; padding-top: 12px; margin-top: 8px; border-top: 2px solid #111827; font-weight: 800; font-size: 16px; color: #111827; }
    .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; display: flex; justify-content: space-between; }
    @media print { body { background: #fff; padding: 0; } .card { border: none; padding: 16px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand-wrap">
        <img src="/images/zkmap-studio-logo.png" alt="ZKMAP STUDIO" class="brand-logo" />
        <div>
          <div class="brand">ZKMAP STUDIO</div>
          <div class="muted">https://zkmapstudio.com · Tax Invoice &amp; Payment Receipt</div>
        </div>
      </div>
      <div style="text-align: right;">
        <div class="badge">PAID · ${esc(payment.mode.toUpperCase())}</div>
        <div class="muted" style="margin-top: 8px;"><strong>${esc(payment.invoiceId)}</strong></div>
        <div class="muted">${esc(new Date(payment.createdAt).toLocaleString())}</div>
      </div>
    </div>

    <div class="grid">
      <div>
        <div class="label">Billed To</div>
        <div><strong>${esc(payment.userName)}</strong></div>
        <div class="muted">${esc(payment.userEmail)}</div>
      </div>
      <div>
        <div class="label">Razorpay Verification</div>
        <div>Order ID: <code>${esc(payment.orderId)}</code></div>
        <div>Payment ID: <code>${esc(payment.paymentId)}</code></div>
        <div>Method: <strong>${esc(payment.method.toUpperCase())}</strong></div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="right">Credits Granted</th>
          <th class="right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${esc(payment.itemName)}</strong>
            <div class="muted">${payment.purchaseType === 'subscription' ? 'Studio Subscription Access' : 'One-Time AI Credit Top-Up'}</div>
          </td>
          <td class="right">+${esc(payment.creditsGranted.toLocaleString())}</td>
          <td class="right">₹${esc(payment.amountInr.toLocaleString('en-IN'))}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <span>Taxable Value</span>
        <span>₹${esc(payment.subtotalInr.toFixed(2))}</span>
      </div>
      <div class="totals-row">
        <span>GST (18% Included)</span>
        <span>₹${esc(payment.taxInr.toFixed(2))}</span>
      </div>
      <div class="totals-final">
        <span>Total Paid (INR)</span>
        <span>₹${esc(payment.amountInr.toLocaleString('en-IN'))}</span>
      </div>
    </div>

    <div class="footer">
      <span>Verified via HMAC-SHA256 Server Signature Check</span>
      <button class="no-print" onclick="window.print()" style="padding:6px 12px;border-radius:6px;border:1px solid #d1d5db;background:#111827;color:#fff;cursor:pointer;">Print / Save PDF</button>
    </div>
  </div>
</body>
</html>`;
}
