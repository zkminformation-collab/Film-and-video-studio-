import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  OperationType,
  handleFirestoreError,
  safeDocId,
} from '../lib/firebase';
import { FilmProject } from '../types';

export type SubscriptionPlanName = string;

export interface CloudUserAccount {
  uid: string;
  displayName: string;
  email: string;
  role: 'user' | 'admin';
  plan: SubscriptionPlanName;
  creditsRemaining: number;
  creditsUsedThisMonth: number;
  storageUsedMb: number;
  projectsCount: number;
  createdAt?: Timestamp | unknown;
  updatedAt?: Timestamp | unknown;
}

export interface CloudLibraryAsset {
  id: string;
  ownerId: string;
  name: string;
  category: 'footage' | 'audio' | 'sfx' | 'stills' | 'vfx';
  format: string;
  duration: string;
  size: string;
  url: string;
  thumbnail: string;
  provider: string;
  createdAt?: Timestamp | unknown;
  updatedAt?: Timestamp | unknown;
}

export interface CloudUsageLog {
  id: string;
  ownerId: string;
  tool: string;
  provider: string;
  creditsUsed: number;
  summary: string;
  createdAt?: Timestamp | unknown;
}

export const PLAN_CREDIT_MAP: Record<string, number> = {
  Free: 10000,
  Starter: 30000,
  Creator: 100000,
  Professional: 500000,
  Enterprise: 2000000,
  Pro: 500000,
  Scale: 2000000,
  Business: 5000000,
};

const ADMIN_EMAIL = 'zkm.information@gmail.com';

interface AuthContextType {
  firebaseUser: User | null;
  account: CloudUserAccount | null;
  authReady: boolean;
  studioMediaReady: boolean;
  isSigningIn: boolean;
  authError: string | null;
  isAdmin: boolean;
  cloudAssets: CloudLibraryAsset[];
  cloudProjects: Array<{
    id: string;
    ownerId: string;
    title: string;
    genre: string;
    status: FilmProject['status'];
    aspectRatio: string;
    resolution: string;
  }>;
  usageLogs: CloudUsageLog[];
  allUsersAdmin: CloudUserAccount[];
  allUsageAdmin: CloudUsageLog[];
  authModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  clearAuthError: () => void;
  signInWithGoogle: (loginHint?: string) => Promise<boolean>;
  signOutUser: () => Promise<void>;
  updateUserPlan: (plan: SubscriptionPlanName, customCredits?: number) => Promise<void>;
  applyVerifiedBillingUpdate: (opts: {
    plan?: SubscriptionPlanName;
    creditsToAdd?: number;
    setCreditsTo?: number;
    tool: string;
    summary: string;
  }) => Promise<void>;
  consumeCreditsAndLog: (
    tool: string,
    provider: string,
    creditsUsed: number,
    summary: string
  ) => Promise<void>;
  saveLibraryAsset: (input: {
    id?: string;
    name: string;
    category: CloudLibraryAsset['category'];
    format: string;
    duration?: string;
    size?: string;
    url?: string;
    thumbnail?: string;
    provider?: string;
  }) => Promise<string | null>;
  deleteLibraryAsset: (assetId: string) => Promise<void>;
  syncProjectToCloud: (project: FilmProject) => Promise<void>;
  adminUpdateUserAccount: (
    targetUid: string,
    updates: Partial<
      Pick<
        CloudUserAccount,
        'plan' | 'creditsRemaining' | 'role' | 'storageUsedMb'
      >
    >
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function clampString(val: unknown, fallback: string, maxLen: number): string {
  const s = String(val ?? '').trim();
  if (!s) return fallback.slice(0, maxLen);
  return s.slice(0, maxLen);
}

function clampUrl(val: unknown, fallback: string): string {
  const s = String(val ?? '').trim();
  if (!s || s.startsWith('blob:') || s.startsWith('data:')) {
    return fallback.slice(0, 1000);
  }
  return s.slice(0, 1000);
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [account, setAccount] = useState<CloudUserAccount | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [mediaSessionUser, setMediaSessionUser] = useState<string | null>(null);
  const mediaSessionRequest = useRef(Promise.resolve());
  const studioMediaReady = Boolean(firebaseUser && mediaSessionUser === firebaseUser.uid);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [cloudAssets, setCloudAssets] = useState<CloudLibraryAsset[]>([]);
  const [cloudProjects, setCloudProjects] = useState<AuthContextType['cloudProjects']>([]);
  const [usageLogs, setUsageLogs] = useState<CloudUsageLog[]>([]);
  const [allUsersAdmin, setAllUsersAdmin] = useState<CloudUserAccount[]>([]);
  const [allUsageAdmin, setAllUsageAdmin] = useState<CloudUsageLog[]>([]);

  const isAdmin = Boolean(
    firebaseUser?.emailVerified &&
      (firebaseUser.email === ADMIN_EMAIL || account?.role === 'admin')
  );

  useEffect(() => {
    if (!authReady) return;
    let active = true;
    const refresh = () => {
      mediaSessionRequest.current = mediaSessionRequest.current.then(async () => {
        if (!active) return;
        try {
          if (!firebaseUser?.emailVerified) {
            await fetch('/api/studio-media-session', { method: 'DELETE' });
            if (active) setMediaSessionUser(null);
            return;
          }
          const token = await firebaseUser.getIdToken();
          if (!active) return;
          const response = await fetch('/api/studio-media-session', {
            method: 'POST', headers: { Authorization: `Bearer ${token}` },
          });
          if (active) setMediaSessionUser(response.ok ? firebaseUser.uid : null);
        } catch {
          if (active) setMediaSessionUser(null);
        }
      });
    };
    refresh();
    const interval = window.setInterval(refresh, 4 * 60_000);
    const refreshOnFocus = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', refreshOnFocus);
    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshOnFocus);
    };
  }, [authReady, firebaseUser]);

  // Monitor Auth State
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setAccount(null);
        setCloudAssets([]);
        setCloudProjects([]);
        setUsageLogs([]);
        setAllUsersAdmin([]);
        setAllUsageAdmin([]);
        setAuthReady(true);
        return;
      }

      if (!user.emailVerified) {
        setAuthReady(true);
        return;
      }

      const uid = safeDocId(user.uid);
      const userRef = doc(db, 'users', uid);

      try {
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          const initialRole = user.email === ADMIN_EMAIL ? 'admin' : 'user';
          const initialProfile: CloudUserAccount = {
            uid,
            displayName: clampString(user.displayName || user.email?.split('@')[0], 'Studio Creator', 120),
            email: clampString(user.email, 'creator@studio.local', 200),
            role: initialRole,
            plan: initialRole === 'admin' ? 'Pro' : 'Free',
            creditsRemaining: initialRole === 'admin' ? PLAN_CREDIT_MAP.Pro : PLAN_CREDIT_MAP.Free,
            creditsUsedThisMonth: 0,
            storageUsedMb: 120,
            projectsCount: 2,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userRef, initialProfile);
        }
      } catch (err) {
        try {
          handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
        } catch (wrapped) {
          setAuthError(wrapped instanceof Error ? wrapped.message : 'Unable to initialize profile');
        }
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsub();
  }, []);

  // Live Listeners scoped strictly to verified authenticated user
  useEffect(() => {
    if (!authReady || !firebaseUser || !firebaseUser.emailVerified) return;

    const uid = safeDocId(firebaseUser.uid);

    const unsubUser = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (snap.exists()) {
          setAccount(snap.data() as CloudUserAccount);
        }
      },
      (err) => {
        console.warn('User profile listener warning:', err.message);
      }
    );

    const assetsQuery = query(
      collection(db, 'library_assets'),
      where('ownerId', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const unsubAssets = onSnapshot(
      assetsQuery,
      (snap) => {
        setCloudAssets(snap.docs.map((d) => d.data() as CloudLibraryAsset));
      },
      (err) => {
        console.warn('Library assets listener warning:', err.message);
      }
    );

    const projectsQuery = query(
      collection(db, 'projects'),
      where('ownerId', '==', uid),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );
    const unsubProjects = onSnapshot(
      projectsQuery,
      (snap) => {
        setCloudProjects(snap.docs.map((d) => d.data() as AuthContextType['cloudProjects'][number]));
      },
      (err) => {
        console.warn('Projects listener warning:', err.message);
      }
    );

    const logsQuery = query(
      collection(db, 'usage_logs'),
      where('ownerId', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(40)
    );
    const unsubLogs = onSnapshot(
      logsQuery,
      (snap) => {
        setUsageLogs(snap.docs.map((d) => d.data() as CloudUsageLog));
      },
      (err) => {
        console.warn('Usage logs listener warning:', err.message);
      }
    );

    return () => {
      unsubUser();
      unsubAssets();
      unsubProjects();
      unsubLogs();
    };
  }, [authReady, firebaseUser]);

  // Admin listeners (only active when verified primary admin is signed in)
  useEffect(() => {
    if (!authReady || !firebaseUser || !firebaseUser.emailVerified) return;
    if (firebaseUser.email !== ADMIN_EMAIL) return;

    const unsubAllUsers = onSnapshot(
      query(collection(db, 'users'), limit(100)),
      (snap) => {
        setAllUsersAdmin(snap.docs.map((d) => d.data() as CloudUserAccount));
      },
      (err) => {
        console.warn('Admin users query warning:', err.message);
      }
    );

    const unsubAllLogs = onSnapshot(
      query(collection(db, 'usage_logs'), orderBy('createdAt', 'desc'), limit(100)),
      (snap) => {
        setAllUsageAdmin(snap.docs.map((d) => d.data() as CloudUsageLog));
      },
      (err) => {
        console.warn('Admin usage query warning:', err.message);
      }
    );

    return () => {
      unsubAllUsers();
      unsubAllLogs();
    };
  }, [authReady, firebaseUser]);

  const signInWithGoogle = async (loginHint?: string): Promise<boolean> => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      if (loginHint) {
        googleProvider.setCustomParameters({
          prompt: 'select_account',
          login_hint: loginHint,
        });
      } else {
        googleProvider.setCustomParameters({ prompt: 'select_account' });
      }
      await signInWithPopup(auth, googleProvider);
      setAuthModalOpen(false);
      return true;
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setAuthError('Google sign-in popup was closed before finishing.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('Popup was blocked by browser settings. Please allow popups for this studio.');
      } else if (code === 'auth/unauthorized-domain') {
        setAuthError(
          `Domain ${window.location.hostname} must be listed under Firebase Console -> Authentication -> Settings -> Authorized domains.`
        );
      } else {
        setAuthError(err?.message || 'Sign-in failed. Please try again.');
      }
      return false;
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  const updateUserPlan = async (plan: SubscriptionPlanName, customCredits?: number) => {
    if (!firebaseUser || !account) {
      setAuthModalOpen(true);
      return;
    }
    const uid = safeDocId(firebaseUser.uid);
    const nextCredits = Math.min(5000000, Math.max(0, customCredits ?? PLAN_CREDIT_MAP[plan] ?? 10000));
    try {
      await updateDoc(doc(db, 'users', uid), {
        plan: clampString(plan, 'Free', 64),
        creditsRemaining: nextCredits,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const applyVerifiedBillingUpdate: AuthContextType['applyVerifiedBillingUpdate'] = async ({
    plan,
    creditsToAdd = 0,
    setCreditsTo,
    tool,
    summary,
  }) => {
    if (!firebaseUser || !firebaseUser.emailVerified || !account) return;
    const uid = safeDocId(firebaseUser.uid);
    const currentCredits = account.creditsRemaining || 0;
    const nextCredits =
      typeof setCreditsTo === 'number'
        ? Math.min(5000000, Math.max(currentCredits, setCreditsTo))
        : Math.min(5000000, currentCredits + Math.max(0, Math.round(creditsToAdd)));
    const logId = safeDocId(`paylog_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);

    try {
      await updateDoc(doc(db, 'users', uid), {
        ...(plan ? { plan } : {}),
        creditsRemaining: nextCredits,
        updatedAt: serverTimestamp(),
      });

      await setDoc(doc(db, 'usage_logs', logId), {
        id: logId,
        ownerId: uid,
        tool: clampString(tool, 'Razorpay Billing', 80),
        provider: 'Razorpay Verified',
        creditsUsed: 0,
        summary: clampString(summary, 'Verified billing credit update', 240),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
    }
  };

  const consumeCreditsAndLog = async (
    tool: string,
    provider: string,
    creditsUsed: number,
    summary: string
  ) => {
    if (!firebaseUser || !firebaseUser.emailVerified || !account) return;
    const uid = safeDocId(firebaseUser.uid);
    const safeCredits = Math.max(0, Math.min(1000000, Math.round(creditsUsed)));
    const logId = safeDocId(`log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);

    try {
      await setDoc(doc(db, 'usage_logs', logId), {
        id: logId,
        ownerId: uid,
        tool: clampString(tool, 'Studio Engine', 80),
        provider: clampString(provider, 'CineFlow Studio', 80),
        creditsUsed: safeCredits,
        summary: clampString(summary, 'Generation run completed', 240),
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'users', uid), {
        creditsRemaining: Math.max(0, (account.creditsRemaining || 0) - safeCredits),
        creditsUsedThisMonth: Math.min(5000000, (account.creditsUsedThisMonth || 0) + safeCredits),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `usage_logs/${logId}`);
    }
  };

  const saveLibraryAsset: AuthContextType['saveLibraryAsset'] = async (input) => {
    if (!firebaseUser || !firebaseUser.emailVerified) return null;
    const uid = safeDocId(firebaseUser.uid);
    const assetId = safeDocId(input.id || `asset_${Date.now()}`);
    const payload = {
      id: assetId,
      ownerId: uid,
      name: clampString(input.name, 'Untitled Studio Asset', 180),
      category: input.category,
      format: clampString(input.format, 'WAV', 40),
      duration: clampString(input.duration || '00:08', '00:08', 32),
      size: clampString(input.size || '2.4 MB', '2.4 MB', 32),
      url: clampUrl(input.url, '/assets/images/hero_studio_suite_1794901010340.jpg'),
      thumbnail: clampUrl(input.thumbnail, '/assets/images/hero_studio_suite_1794901010340.jpg'),
      provider: clampString(input.provider || 'Studio Synthesis', 'Studio Synthesis', 80),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    try {
      await setDoc(doc(db, 'library_assets', assetId), payload);
      return assetId;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `library_assets/${assetId}`);
    }
  };

  const deleteLibraryAsset = async (assetId: string) => {
    if (!firebaseUser || !firebaseUser.emailVerified) return;
    const safeId = safeDocId(assetId);
    try {
      await deleteDoc(doc(db, 'library_assets', safeId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `library_assets/${safeId}`);
    }
  };

  const syncProjectToCloud = async (project: FilmProject) => {
    if (!firebaseUser || !firebaseUser.emailVerified) return;
    const uid = safeDocId(firebaseUser.uid);
    const projectId = safeDocId(project.id);
    const allowedStatuses: FilmProject['status'][] = [
      'Development',
      'Pre-Production',
      'Production',
      'Post-Production',
      'Completed',
    ];
    const validStatus = allowedStatuses.includes(project.status) ? project.status : 'Pre-Production';
    const ref = doc(db, 'projects', projectId);

    try {
      const existing = await getDoc(ref);
      if (existing.exists()) {
        await updateDoc(ref, {
          title: clampString(project.title, 'Untitled Film', 160),
          genre: clampString(project.genre, 'Drama', 80),
          status: validStatus,
          aspectRatio: clampString(project.aspectRatio, '2.39:1', 16),
          resolution: clampString(project.resolution, '4K DCI', 32),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          id: projectId,
          ownerId: uid,
          title: clampString(project.title, 'Untitled Film', 160),
          genre: clampString(project.genre, 'Drama', 80),
          status: validStatus,
          aspectRatio: clampString(project.aspectRatio, '2.39:1', 16),
          resolution: clampString(project.resolution, '4K DCI', 32),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `projects/${projectId}`);
    }
  };

  const adminUpdateUserAccount: AuthContextType['adminUpdateUserAccount'] = async (
    targetUid,
    updates
  ) => {
    if (!isAdmin) return;
    const cleanUid = safeDocId(targetUid);
    try {
      await updateDoc(doc(db, 'users', cleanUid), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${cleanUid}`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        account,
        authReady,
        studioMediaReady,
        isSigningIn,
        authError,
        isAdmin,
        cloudAssets,
        cloudProjects,
        usageLogs,
        allUsersAdmin,
        allUsageAdmin,
        authModalOpen,
        openAuthModal: () => setAuthModalOpen(true),
        closeAuthModal: () => setAuthModalOpen(false),
        clearAuthError: () => setAuthError(null),
        signInWithGoogle,
        signOutUser,
        updateUserPlan,
        applyVerifiedBillingUpdate,
        consumeCreditsAndLog,
        saveLibraryAsset,
        deleteLibraryAsset,
        syncProjectToCloud,
        adminUpdateUserAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
