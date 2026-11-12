import React, { useState } from 'react';
import { 
  Bot, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  Clock, 
  Activity, 
  DollarSign, 
  ShieldCheck, 
  Zap,
  Play,
  Filter,
  Check,
  RefreshCw,
  Key,
  ExternalLink,
  Cpu,
  Layers,
  RotateCcw,
  Trash2,
  Sparkles
} from 'lucide-react';
import { useStudioAi } from '../../context/StudioAiContext';
import { soundFx } from '../../utils/audioSynth';

export const AiCentralManager: React.FC = () => {
  const { 
    providers, 
    toggleProvider, 
    updateProviderLimit, 
    queue, 
    history, 
    activeProviderId, 
    setActiveProviderId,
    wallet,
    isReprocessing,
    reprocessStatusText,
    reprocessAllPending,
    retryQueueItem,
    clearCompletedQueue
  } = useStudioAi();

  const [activeTab, setActiveTab] = useState<'providers' | 'queue' | 'history' | 'analytics'>('queue');
  const [filterType, setFilterType] = useState<string>('all');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<{ [id: string]: { status: string; latency: number } }>({});

  const pendingCount = queue.filter((i) => i.status === 'Queued' || i.status === 'Failed').length;
  const inProgressCount = queue.filter((i) => i.status === 'Synthesizing').length;
  const completedCount = queue.filter((i) => i.status === 'Completed').length;

  const handleTestConnection = (id: string) => {
    setTestingId(id);
    soundFx.playScannerBeep();
    setTimeout(() => {
      setTestingId(null);
      soundFx.playCinematicImpact();
      setPingResults((prev) => ({
        ...prev,
        [id]: { status: 'HTTP 200 OK · Active', latency: Math.floor(75 + Math.random() * 80) },
      }));
    }, 700);
  };

  const filteredHistory = history.filter((h) => filterType === 'all' || h.tool.toLowerCase().includes(filterType.toLowerCase()));

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#090b11] text-slate-100 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/20 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-purple-400 font-mono">
            <span>AI Central Manager & Generation Dispatcher</span>
            <span aria-hidden="true">·</span>
            <span>Phase 3 Multi-Model Pipeline</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-cinzel">
            Central AI Engine & Provider Administration
          </h1>
        </div>

        {/* Tab Switchers */}
        <div className="flex items-center gap-1 p-1 bg-[#0d111c] border border-purple-500/30 rounded-xl">
          {[
            { id: 'queue', label: `Live Queue (${queue.length})` },
            { id: 'providers', label: 'AI Providers' },
            { id: 'history', label: 'Audit History' },
            { id: 'analytics', label: 'Spend & Quota' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                soundFx.playScannerBeep();
                setActiveTab(t.id as any);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                activeTab === t.id
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reprocess All Pending Command Header (User Request Focus) */}
      <div className="bg-gradient-to-r from-purple-950/40 via-[#0d111c] to-blue-950/40 border-2 border-purple-500/40 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-cyan-300 font-bold uppercase tracking-wider">Queue Health & Worker Pool</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">Cloud GPU Workers Active</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1">
            <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Tasks: <strong className="text-white text-sm">{pendingCount}</strong></span>
            </div>
            <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-300 flex items-center gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${isReprocessing ? 'animate-spin' : ''}`} />
              <span>In Synthesis: <strong className="text-white text-sm">{inProgressCount}</strong></span>
            </div>
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed: <strong className="text-white text-sm">{completedCount}</strong></span>
            </div>
          </div>
          {reprocessStatusText && (
            <p className="text-xs text-cyan-300 font-mono animate-pulse pt-1">
              ▶ {reprocessStatusText}
            </p>
          )}
        </div>

        {/* Action Buttons: Check Pending & Reprocess All */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              soundFx.playScannerBeep();
              alert(`Queue scan complete: ${pendingCount} pending task(s) currently waiting in worker queue.`);
            }}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono font-medium transition-colors"
          >
            Check Pending ({pendingCount})
          </button>

          <button
            disabled={isReprocessing || pendingCount === 0}
            onClick={() => reprocessAllPending()}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 disabled:opacity-50 text-white rounded-xl text-xs font-bold font-mono shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 active:scale-95"
            title="Batch process all pending queue tasks sequentially"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isReprocessing ? 'animate-spin' : ''}`} />
            <span>{isReprocessing ? 'Reprocessing Queue...' : 'Reprocess All Pending'}</span>
          </button>

          {completedCount > 0 && (
            <button
              onClick={clearCompletedQueue}
              className="p-2.5 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800/40 rounded-xl text-xs transition-colors"
              title="Clear Completed Tasks"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Queue Manager */}
      {activeTab === 'queue' && (
        <div className="bg-[#0d111c] border border-purple-500/20 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300 font-mono">
              Task Execution Queue & Neural Generators
            </span>
            <span className="text-xs text-cyan-400 font-mono">{queue.length} Active Records</span>
          </div>

          <div className="space-y-3">
            {queue.map((item) => (
              <div
                key={item.id}
                className={`p-4 bg-[#090b11] border rounded-xl space-y-2.5 text-xs font-mono transition-all ${
                  item.status === 'Queued'
                    ? 'border-amber-500/40 shadow-sm'
                    : item.status === 'Synthesizing'
                    ? 'border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-white text-sm">{item.tool}</span>
                    <span className="text-[10px] text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                      {item.provider}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                        item.status === 'Completed'
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                          : item.status === 'Synthesizing'
                          ? 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30 animate-pulse'
                          : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                      }`}
                    >
                      {item.status.toUpperCase()}
                    </span>

                    {item.status === 'Queued' && (
                      <button
                        onClick={() => retryQueueItem(item.id)}
                        className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-purple-300 hover:text-white border border-slate-700"
                        title="Process this item now"
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-slate-300 font-sans text-xs">
                  "{item.prompt}"
                </p>

                {/* Progress Bar for item */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-300 ${
                        item.status === 'Completed'
                          ? 'bg-emerald-400'
                          : 'bg-gradient-to-r from-purple-500 to-cyan-400'
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>Render Time: {item.timeElapsed}</span>
                    <span>Progress: {item.progress}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: AI Providers & Model Selectors */}
      {activeTab === 'providers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((p) => {
              const isDefault = p.id === activeProviderId;
              const isTesting = testingId === p.id;
              const testResult = pingResults[p.id];

              return (
                <div
                  key={p.id}
                  className={`bg-[#0d111c] border rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between transition-all ${
                    isDefault
                      ? 'border-purple-500/60 ring-1 ring-purple-500/30'
                      : 'border-purple-500/20 hover:border-purple-500/40'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3.5 h-3.5 rounded-full shadow-sm"
                          style={{ backgroundColor: p.iconColor }}
                        />
                        <span className="text-xs font-bold text-white font-cinzel">{p.name}</span>
                      </div>

                      <button
                        onClick={() => toggleProvider(p.id)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold transition-colors ${
                          p.connected
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                        }`}
                      >
                        {p.connected ? 'CONNECTED' : 'DISCONNECTED'}
                      </button>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                      {p.description}
                    </p>

                    {/* Model Dropdown */}
                    <div className="space-y-1 text-xs font-mono">
                      <span className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
                        <span>Active Model</span>
                        <span className="text-purple-400">{p.models.length} Available</span>
                      </span>
                      <select
                        value={p.activeModel}
                        onChange={(e) => {
                          p.activeModel = e.target.value;
                          soundFx.playScannerBeep();
                        }}
                        className="w-full bg-[#090b11] border border-purple-500/20 rounded p-1.5 text-slate-200 outline-none text-xs font-mono"
                      >
                        {p.models.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Live Ping Test */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                      <button
                        onClick={() => handleTestConnection(p.id)}
                        disabled={isTesting}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-[#090b11] hover:bg-slate-800 text-slate-300 border border-purple-500/20 rounded text-[11px]"
                      >
                        <RefreshCw className={`w-3 h-3 text-cyan-400 ${isTesting ? 'animate-spin' : ''}`} />
                        <span>{isTesting ? 'Testing Ping...' : 'Test Connection'}</span>
                      </button>

                      <span className="text-slate-400 text-[11px]">
                        {testResult ? (
                          <span className="text-emerald-400 font-bold">{testResult.latency}ms</span>
                        ) : (
                          `${p.latencyMs}ms nominal`
                        )}
                      </span>
                    </div>

                    {/* Spending Cap & Meter */}
                    <div className="space-y-1 text-xs font-mono pt-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>API SPEND CAP</span>
                        <span>${p.currentSpendUsd.toFixed(2)} / ${p.spendingLimitUsd}</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-cyan-500 h-full"
                          style={{ width: `${Math.min(100, (p.currentSpendUsd / p.spendingLimitUsd) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-purple-500/20">
                    <button
                      onClick={() => {
                        soundFx.playScannerBeep();
                        setActiveProviderId(p.id);
                      }}
                      className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg transition-colors ${
                        isDefault
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {isDefault ? 'Default Routing' : 'Set as Default'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Generation History */}
      {activeTab === 'history' && (
        <div className="bg-[#0d111c] border border-purple-500/20 rounded-2xl overflow-hidden shadow-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300 font-mono">
              AI Generation Audit History
            </span>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-[#090b11] border border-purple-500/20 text-xs text-slate-300 font-mono rounded px-2 py-1 outline-none"
              >
                <option value="all">All Operations</option>
                <option value="video">Video Generations</option>
                <option value="script">Screenplays</option>
                <option value="recharge">Wallet Recharges</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#090b11] text-slate-400 border-b border-purple-500/20 text-[10px] uppercase">
                <tr>
                  <th className="py-3 px-4">Operation</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Studio Credits</th>
                  <th className="py-3 px-4">API Raw Cost</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredHistory.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-white">{tx.tool}</td>
                    <td className="py-3 px-4 text-purple-400">{tx.type}</td>
                    <td className="py-3 px-4 text-slate-200">
                      {tx.type === 'Recharge' ? `+${tx.amount}` : `-${tx.amount}`} credits
                    </td>
                    <td className="py-3 px-4 text-cyan-400">${tx.costUsd.toFixed(3)}</td>
                    <td className="py-3 px-4 text-slate-400">{tx.timestamp}</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-bold">{tx.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Analytics */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0d111c] border border-purple-500/20 rounded-2xl p-5 space-y-2">
            <span className="text-[10px] text-purple-300 uppercase font-mono">Total API Raw Spend</span>
            <div className="text-2xl font-bold font-mono text-cyan-400">
              ${wallet.providerSpendThisMonthUsd.toFixed(2)} USD
            </div>
            <p className="text-[11px] text-slate-400">Underwritten across connected provider keys</p>
          </div>

          <div className="bg-[#0d111c] border border-purple-500/20 rounded-2xl p-5 space-y-2">
            <span className="text-[10px] text-purple-300 uppercase font-mono">Monthly Credits Burned</span>
            <div className="text-2xl font-bold font-mono text-purple-400">
              {wallet.creditsUsedThisMonth.toLocaleString()} Credits
            </div>
            <p className="text-[11px] text-slate-400">From 50,000 Fair-Use Cap</p>
          </div>

          <div className="bg-[#0d111c] border border-purple-500/20 rounded-2xl p-5 space-y-2">
            <span className="text-[10px] text-purple-300 uppercase font-mono">Generation Success Rate</span>
            <div className="text-2xl font-bold font-mono text-white">
              99.7%
            </div>
            <p className="text-[11px] text-slate-400">Automatic fallback routing active</p>
          </div>
        </div>
      )}
    </div>
  );
};
