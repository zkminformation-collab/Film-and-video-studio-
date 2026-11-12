import React from 'react';
import { 
  AlertCircle, 
  Coins, 
  DollarSign, 
  Film, 
  Clock, 
  CheckCircle2, 
  X, 
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useStudioAi } from '../../context/StudioAiContext';

export const CostApprovalModal: React.FC = () => {
  const { costApprovalModal, closeCostApproval, confirmCostApproval, wallet } = useStudioAi();

  if (!costApprovalModal) return null;

  const isUnlimited = wallet.plan === 'Unlimited';
  const hasEnough = isUnlimited || wallet.balance >= costApprovalModal.estimatedCredits;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-purple-500/50 rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-cinzel">
                AI Generation Cost Estimation
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {costApprovalModal.operationName}
              </p>
            </div>
          </div>

          <button
            onClick={closeCostApproval}
            className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Breakdown Specs */}
        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          {costApprovalModal.scenesCount !== undefined && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">Scenes in Job</span>
              <span className="text-white font-bold text-sm">{costApprovalModal.scenesCount} Scenes</span>
            </div>
          )}

          {costApprovalModal.durationSec !== undefined && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">Total Duration</span>
              <span className="text-white font-bold text-sm">{costApprovalModal.durationSec} Seconds</span>
            </div>
          )}

          {costApprovalModal.resolution && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">Master Quality</span>
              <span className="text-cyan-400 font-bold text-sm">{costApprovalModal.resolution}</span>
            </div>
          )}

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block">Active Plan</span>
            <span className="text-purple-400 font-bold text-sm">{wallet.plan} Plan</span>
          </div>
        </div>

        {/* Cost Matrix Calculation */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              Studio Credits Deducted:
            </span>
            <span className="text-white font-bold text-sm">
              {isUnlimited ? '0 Credits (Unlimited Pass)' : `${costApprovalModal.estimatedCredits} Credits`}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Est. Provider Raw API Cost:
            </span>
            <span className="text-emerald-400 font-bold">
              ${costApprovalModal.estimatedFinancialCostUsd.toFixed(3)} USD
            </span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
            <span className="text-slate-400">Your Current Balance:</span>
            <span className={`font-bold ${hasEnough ? 'text-white' : 'text-rose-400'}`}>
              {isUnlimited ? 'Unlimited Active' : `${wallet.balance.toLocaleString()} Credits`}
            </span>
          </div>
        </div>

        {/* Fair use or Balance notice */}
        {isUnlimited ? (
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-start gap-2.5 text-xs text-purple-300">
            <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Unlimited Studio Generation Active:</strong> Zero studio credits deducted. Covered under Fair-Use Policy up to 50,000 monthly credit equivalents.
            </p>
          </div>
        ) : !hasEnough ? (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Insufficient credit balance. Please recharge or upgrade to Creator or Unlimited plan to execute this generation.
            </p>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={closeCostApproval}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={confirmCostApproval}
            disabled={!hasEnough}
            className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve & Start Generation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
