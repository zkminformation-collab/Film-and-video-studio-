import React, { useState } from 'react';
import {
  X,
  LogOut,
  Sparkles,
  FolderCheck,
  AlertCircle,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    closeAuthModal,
    firebaseUser,
    account,
    isSigningIn,
    authError,
    clearAuthError,
    signInWithGoogle,
    signOutUser,
  } = useAuth();

  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');

  if (!authModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xl space-y-5 text-neutral-950">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-200 pb-4 gap-3">
          <div className="flex items-start gap-3">
            <img
              src="/images/zkmap-studio-logo.png"
              alt="ZKMAP STUDIO"
              className="h-11 w-auto rounded-lg object-contain border border-neutral-200 shrink-0"
            />
            <div className="space-y-0.5">
              <h2 className="text-base font-bold text-neutral-950 tracking-tight">
                {firebaseUser
                  ? 'ZKMAP STUDIO Account & Cloud Sync'
                  : authTab === 'login'
                  ? 'Log in to ZKMAP STUDIO'
                  : 'Create Your ZKMAP STUDIO Account'}
              </h2>
              <p className="text-xs text-neutral-500">
                {firebaseUser
                  ? 'Your films, voices, and My Library assets are synced in Cloud Firestore.'
                  : authTab === 'login'
                  ? 'Select your Google account below to continue.'
                  : 'Sign up instantly with Google and claim monthly studio credits.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              clearAuthError();
              closeAuthModal();
            }}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 transition-colors shrink-0"
            aria-label="Close account modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {authError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        {firebaseUser && account ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#FAFAFB] border border-neutral-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-neutral-950 truncate">
                  {account.displayName}
                </div>
                <div className="text-xs text-neutral-500 truncate">{account.email}</div>
              </div>
              <span className="text-[11px] font-mono-cinema font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md shrink-0">
                {account.plan}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#FAFAFB] border border-neutral-200 space-y-1">
                <div className="text-neutral-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Credits Available</span>
                </div>
                <div className="text-base font-bold font-mono-cinema text-neutral-950">
                  {account.creditsRemaining.toLocaleString()}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#FAFAFB] border border-neutral-200 space-y-1">
                <div className="text-neutral-500 flex items-center gap-1.5">
                  <FolderCheck className="w-3.5 h-3.5 text-neutral-700" />
                  <span>Role Access</span>
                </div>
                <div className="text-base font-bold font-mono-cinema text-neutral-950 uppercase">
                  {account.role}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={async () => {
                  await signOutUser();
                  closeAuthModal();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-red-50 hover:text-red-700 border border-neutral-200 text-xs font-semibold text-neutral-800 flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
              <button
                type="button"
                onClick={closeAuthModal}
                className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-950 text-white hover:bg-black text-xs font-semibold transition-colors"
              >
                Continue to Studio
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Log In / Sign Up Mode Switcher */}
            <div className="grid grid-cols-2 gap-1 bg-neutral-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setAuthTab('login')}
                className={`py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  authTab === 'login'
                    ? 'bg-white text-neutral-950 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-950'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => setAuthTab('signup')}
                className={`py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  authTab === 'signup'
                    ? 'bg-white text-neutral-950 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-950'
                }`}
              >
                Sign Up (New User)
              </button>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                disabled={isSigningIn}
                onClick={() => void signInWithGoogle()}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-300 font-semibold text-xs flex items-center justify-center gap-2.5 transition-colors disabled:opacity-60"
              >
                <Users className="w-4 h-4 text-neutral-600" />
                <span>
                  {isSigningIn ? 'Connecting to Google…' : 'Continue with Google'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
