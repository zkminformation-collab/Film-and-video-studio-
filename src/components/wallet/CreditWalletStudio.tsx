import React, { useState } from 'react';
import { 
  Coins, 
  DollarSign, 
  CreditCard, 
  ShieldCheck, 
  Check, 
  Sparkles, 
  Zap, 
  ArrowUpRight, 
  RefreshCw,
  AlertCircle,
  Calculator,
  Film,
  Clock,
  Radio,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { useStudioAi } from '../../context/StudioAiContext';
import { soundFx } from '../../utils/audioSynth';

export const CreditWalletStudio: React.FC = () => {
  const { wallet, updateWalletPlan, rechargeCredits, history } = useStudioAi();

  const isUnlimited = wallet.plan === 'Unlimited';

  // Interactive 20-Minute Film Cost Calculator State
  const [calcScenes, setCalcScenes] = useState<number>(100);
  const [calcDurationMin, setCalcDurationMin] = useState<number>(20);
  const [calcResolution, setCalcResolution] = useState<'1080p' | '4K DCI'>('4K DCI');
  const [calcVoiceMinutes, setCalcVoiceMinutes] = useState<number>(16);
  const [calcMusicTracks, setCalcMusicTracks] = useState<number>(6);

  // Compute Cost Estimates
  const creditPerShot = calcResolution === '4K DCI' ? 30 : 15;
  const totalVideoCredits = calcScenes * creditPerShot;
  const voiceCredits = calcVoiceMinutes * 20;
  const musicCredits = calcMusicTracks * 40;
  const totalCreditsNeeded = totalVideoCredits + voiceCredits + musicCredits;

  // Real 3rd-party provider USD API costs (Runway/Sora + ElevenLabs + Suno)
  const providerVideoUsd = calcScenes * (calcResolution === '4K DCI' ? 0.35 : 0.20);
  const providerVoiceUsd = calcVoiceMinutes * 0.15;
  const providerMusicUsd = calcMusicTracks * 0.40;
  const totalProviderUsd = providerVideoUsd + providerVoiceUsd + providerMusicUsd;

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#090b11] text-slate-100 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/20 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-purple-400 font-mono">
            <span>Central Credit Wallet & Financial Manager</span>
            <span aria-hidden="true">·</span>
            <span>Section 3 Fair-Use Governance</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-cinzel">
            AI Studio Credit Wallet & Plan Manager
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Current Plan:</span>
          <span className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-mono font-bold text-xs shadow-md shadow-purple-600/30">
            {wallet.plan.toUpperCase()} PASS
          </span>
        </div>
      </div>

      {/* Main Balance Hero Card */}
      <div className="bg-gradient-to-r from-[#0d111c] via-purple-950/40 to-[#0d111c] border-2 border-purple-500/40 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-[10px] text-purple-300 uppercase font-mono font-bold tracking-wider">
            Available Studio Generation Balance
          </span>
          <div className="text-4xl md:text-5xl font-extrabold font-mono text-white flex items-center justify-center md:justify-start gap-3">
            <Coins className="w-10 h-10 text-amber-400" />
            <span>{isUnlimited ? 'UNLIMITED' : wallet.balance.toLocaleString()}</span>
            <span className="text-lg font-normal text-slate-400">Credits</span>
          </div>
          <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
            {isUnlimited
              ? 'Zero studio credit deductions on all AI generation tools. Subject to external AI provider limits and 50,000 monthly fair-use policy.'
              : 'Studio credits power all Video, Screenplay, Voice, Character and VFX operations.'}
          </p>
        </div>

        {/* Quick Recharge Packs */}
        <div className="bg-[#090b11] border border-purple-500/30 rounded-2xl p-4 space-y-2.5 w-full md:w-80 shrink-0">
          <span className="text-[10px] text-purple-300 uppercase font-mono block">Instant Top-Up Pack</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => rechargeCredits(1000, 10.0)}
              className="py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-center font-bold text-slate-200 transition-colors"
            >
              +1,000 ($10)
            </button>
            <button
              onClick={() => rechargeCredits(5000, 45.0)}
              className="py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl text-xs font-mono text-center font-bold shadow-md shadow-purple-600/30 transition-all"
            >
              +5,000 ($45)
            </button>
          </div>
        </div>
      </div>

      {/* 20-Minute Film Cost Calculator */}
      <div className="bg-[#0d111c] border border-purple-500/30 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-500/20 pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white font-cinzel">
              Interactive 20-Minute Film Cost Calculator
            </h2>
          </div>
          <span className="text-xs text-purple-300 font-mono">
            Full Production Budget Breakdown
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            {/* Scene Count Slider */}
            <div className="space-y-1.5 bg-[#090b11] p-3 rounded-xl border border-purple-500/20">
              <div className="flex justify-between text-slate-300">
                <span>Scene / Shot Count:</span>
                <span className="text-cyan-400 font-bold">{calcScenes} Shots</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="5"
                value={calcScenes}
                onChange={(e) => setCalcScenes(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
              <span className="text-[10px] text-slate-500">Typical 20-min film: ~80-120 shots</span>
            </div>

            {/* Target Duration Slider */}
            <div className="space-y-1.5 bg-[#090b11] p-3 rounded-xl border border-purple-500/20">
              <div className="flex justify-between text-slate-300">
                <span>Target Runtime:</span>
                <span className="text-purple-400 font-bold">{calcDurationMin} Minutes</span>
              </div>
              <input
                type="range"
                min="1"
                max="60"
                step="1"
                value={calcDurationMin}
                onChange={(e) => setCalcDurationMin(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
              <span className="text-[10px] text-slate-500">Short film, pilot episode, or showcase</span>
            </div>

            {/* AI Resolution Selector */}
            <div className="space-y-1.5 bg-[#090b11] p-3 rounded-xl border border-purple-500/20">
              <div className="flex justify-between text-slate-300">
                <span>Generation Resolution:</span>
                <span className="text-emerald-400 font-bold">{calcResolution}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => setCalcResolution('1080p')}
                  className={`py-1.5 rounded-lg text-xs font-bold ${
                    calcResolution === '1080p' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  1080p HD
                </button>
                <button
                  onClick={() => setCalcResolution('4K DCI')}
                  className={`py-1.5 rounded-lg text-xs font-bold ${
                    calcResolution === '4K DCI' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  4K Cinema DCI
                </button>
              </div>
            </div>

            {/* Voiceover Minutes */}
            <div className="space-y-1.5 bg-[#090b11] p-3 rounded-xl border border-purple-500/20">
              <div className="flex justify-between text-slate-300">
                <span>Dialogue / VO Duration:</span>
                <span className="text-cyan-400 font-bold">{calcVoiceMinutes} Min</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="2"
                value={calcVoiceMinutes}
                onChange={(e) => setCalcVoiceMinutes(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <span className="text-[10px] text-slate-500">ElevenLabs neural voice clone speech</span>
            </div>
          </div>

          {/* Cost Summary Box */}
          <div className="bg-[#090b11] border-2 border-purple-500/40 rounded-2xl p-5 flex flex-col justify-between space-y-4 font-mono text-xs shadow-inner">
            <div className="space-y-3">
              <span className="text-[11px] text-purple-300 uppercase font-bold tracking-wider block">
                Estimated Production Cost
              </span>

              <div className="space-y-2 border-b border-slate-800 pb-3">
                <div className="flex justify-between text-slate-400">
                  <span>Video Shots ({calcScenes}x):</span>
                  <span className="text-white">{totalVideoCredits.toLocaleString()} Credits</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Dialogue Audio ({calcVoiceMinutes}m):</span>
                  <span className="text-white">{voiceCredits} Credits</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Soundtrack & Foley:</span>
                  <span className="text-white">{musicCredits} Credits</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-1">
                <span className="text-slate-300 font-bold">Standard Credits:</span>
                <span className="text-lg font-extrabold text-amber-400">
                  {totalCreditsNeeded.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-baseline text-slate-400">
                <span>Raw Provider API Cost:</span>
                <span className="text-cyan-400 font-bold">${totalProviderUsd.toFixed(2)} USD</span>
              </div>
            </div>

            <div className="p-3 bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/50 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Unlimited Pass Plan: $0 Credits</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-snug">
                Under the $99/mo Unlimited Studio Plan, all {totalCreditsNeeded.toLocaleString()} credits are covered by your membership!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Plans Matrix */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono">
          Studio Subscription Tiers & Unlimited Options
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Free Tier */}
          <div className="bg-[#0d111c] border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white font-cinzel">Free Plan</h3>
              <div className="text-xl font-bold font-mono text-white">$0 <span className="text-xs text-slate-500 font-normal">/ mo</span></div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> 250 Monthly Credits</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Standard 1080p Video</li>
              </ul>
            </div>
            <button
              onClick={() => updateWalletPlan('Free')}
              className={`w-full py-2.5 rounded-xl text-xs font-mono font-bold border transition-colors ${
                wallet.plan === 'Free' ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-[#090b11] text-slate-300 hover:bg-slate-800'
              }`}
            >
              {wallet.plan === 'Free' ? 'Current Plan' : 'Select Free'}
            </button>
          </div>

          {/* Creator Tier */}
          <div className="bg-[#0d111c] border border-purple-500/20 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white font-cinzel">Creator</h3>
              <div className="text-xl font-bold font-mono text-white">$19 <span className="text-xs text-slate-500 font-normal">/ mo</span></div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> 2,500 Monthly Credits</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> 4K Video Generation</li>
              </ul>
            </div>
            <button
              onClick={() => updateWalletPlan('Creator')}
              className={`w-full py-2.5 rounded-xl text-xs font-mono font-bold transition-all ${
                wallet.plan === 'Creator' ? 'bg-purple-600 text-white' : 'bg-[#090b11] text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {wallet.plan === 'Creator' ? 'Current Plan' : 'Select Creator'}
            </button>
          </div>

          {/* Unlimited Tier */}
          <div className="bg-[#0d111c] border-2 border-purple-500 rounded-2xl p-5 space-y-3 flex flex-col justify-between relative shadow-xl shadow-purple-500/20">
            <span className="absolute -top-3 right-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full font-mono shadow">
              UNLIMITED PASS
            </span>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white font-cinzel">Unlimited Studio</h3>
              <div className="text-xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-cyan-300">$99 <span className="text-xs text-slate-500 font-normal">/ mo</span></div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Unlimited Studio Generations</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> 50,000 Credit Fair-Use Protection</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Priority Worker GPU Queue</li>
              </ul>
            </div>
            <button
              onClick={() => updateWalletPlan('Unlimited')}
              className={`w-full py-2.5 rounded-xl text-xs font-mono font-bold shadow-lg transition-all ${
                wallet.plan === 'Unlimited' ? 'bg-purple-600 text-white shadow-purple-600/30' : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
              }`}
            >
              {wallet.plan === 'Unlimited' ? 'Active Plan' : 'Upgrade to Unlimited'}
            </button>
          </div>

          {/* Enterprise Tier */}
          <div className="bg-[#0d111c] border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white font-cinzel">Enterprise</h3>
              <div className="text-xl font-bold font-mono text-white">Custom <span className="text-xs text-slate-500 font-normal">SLA</span></div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Dedicated Soundstage Nodes</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Custom Provider Keys & Billing</li>
              </ul>
            </div>
            <button
              onClick={() => updateWalletPlan('Enterprise')}
              className={`w-full py-2.5 rounded-xl text-xs font-mono font-bold border transition-colors ${
                wallet.plan === 'Enterprise' ? 'bg-slate-800 text-slate-400' : 'bg-[#090b11] text-slate-300 hover:bg-slate-800 border-slate-800'
              }`}
            >
              {wallet.plan === 'Enterprise' ? 'Current Plan' : 'Contact SLA'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
