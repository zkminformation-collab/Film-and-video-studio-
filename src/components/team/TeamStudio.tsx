import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  Printer, 
  CheckCircle2, 
  MessageSquare, 
  Send, 
  Phone, 
  Mail,
  ShieldCheck
} from 'lucide-react';
import { TeamMember, CallSheet, FilmProject } from '../../types';
import { INITIAL_TEAM, INITIAL_CALL_SHEET } from '../../data/initialData';
import { soundFx } from '../../utils/audioSynth';

interface TeamStudioProps {
  activeFilm: FilmProject;
}

interface ReviewComment {
  id: string;
  author: string;
  role: string;
  timecode: string;
  text: string;
  timestamp: string;
}

export const TeamStudio: React.FC<TeamStudioProps> = ({ activeFilm }) => {
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM);
  const [callSheet, setCallSheet] = useState<CallSheet>(INITIAL_CALL_SHEET);
  const [newComment, setNewComment] = useState('');
  const [commentTimecode, setCommentTimecode] = useState('00:00:08:14');

  const [comments, setComments] = useState<ReviewComment[]>([
    {
      id: 'c-1',
      author: 'Elena Rostova',
      role: 'Director',
      timecode: '00:00:04:12',
      text: 'Lens flare on the basalt obelisk is stunning, but let us trim 8 frames from the head of Take 3.',
      timestamp: '1 hour ago',
    },
    {
      id: 'c-2',
      author: 'Marcus Sterling',
      role: 'DP',
      timecode: '00:00:08:14',
      text: 'Matched color temperature at 5600K. The cyan rim light in the visor reflects cleanly.',
      timestamp: '30 mins ago',
    },
  ]);

  const handleToggleStatus = (memberId: string) => {
    soundFx.playScannerBeep();
    setTeam((prev) =>
      prev.map((m) => {
        if (m.id !== memberId) return m;
        const nextStatus = m.status === 'Confirmed' ? 'On Set' : m.status === 'On Set' ? 'Wrapped' : 'Confirmed';
        return { ...m, status: nextStatus };
      })
    );
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    soundFx.playShutterSound();
    const comment: ReviewComment = {
      id: `c-${Date.now()}`,
      author: 'Elena Rostova (You)',
      role: 'Director',
      timecode: commentTimecode,
      text: newComment.trim(),
      timestamp: 'Just now',
    };
    setComments((prev) => [comment, ...prev]);
    setNewComment('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-950 text-slate-100 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-mono-cinema">
            <span>Production Team Collaboration</span>
            <span aria-hidden="true">·</span>
            <span>Digital Call Sheet Dispatch</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-cinzel">
            Cast, Crew & Daily Call Sheet
          </h1>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Official Call Sheet</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Printable Official Call Sheet Card (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono-cinema block">
            Official Production Call Sheet (Day {callSheet.dayNumber} of {callSheet.totalDays})
          </span>

          <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-6 space-y-5 shadow-2xl font-mono-cinema text-xs">
            {/* Call Sheet Top Header */}
            <div className="border-b-2 border-slate-700 pb-3 flex justify-between items-baseline">
              <div>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                  FEATURE PRODUCTION
                </span>
                <span className="text-lg font-bold text-white font-cinzel">
                  {callSheet.projectName}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">{callSheet.date}</span>
                <span className="text-amber-400 font-bold text-sm">{callSheet.callTime}</span>
              </div>
            </div>

            {/* Location & Safety */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-sans font-bold">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Shooting Stage Location</span>
                </div>
                <div className="text-slate-200 mt-1 font-sans text-xs">
                  {callSheet.location}
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-sans font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Medical & Trauma Unit</span>
                </div>
                <div className="text-slate-200 mt-1 font-sans text-xs">
                  {callSheet.nearestHospital}
                </div>
              </div>
            </div>

            {/* Scheduled Scenes Today */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">
                Scheduled Scenes on Call
              </span>
              <div className="divide-y divide-slate-800 bg-slate-950 border border-slate-800 rounded overflow-hidden">
                {callSheet.scenesToShoot.map((scene, i) => (
                  <div key={i} className="p-2.5 text-slate-300 font-sans text-xs flex items-center justify-between">
                    <span>{scene}</span>
                    <span className="text-amber-400 font-mono text-[11px]">SOUND SYNC</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Crew Call Roster */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">
                Department Call Roster
              </span>
              <div className="divide-y divide-slate-800 bg-slate-950 border border-slate-800 rounded overflow-hidden">
                {team.map((member) => (
                  <div key={member.id} className="p-2.5 flex items-center justify-between font-sans text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-full object-cover border border-slate-700"
                      />
                      <div>
                        <div className="font-semibold text-white">{member.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{member.role}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-300">{member.callTime}</span>
                      <button
                        onClick={() => handleToggleStatus(member.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                          member.status === 'On Set'
                            ? 'bg-emerald-500 text-slate-950'
                            : member.status === 'Wrapped'
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {member.status.toUpperCase()}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Timecode-Stamped Director Notes & Review Feed (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono-cinema block">
            Timecode-Pinned Review Notes
          </span>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            {/* Add Review Note Form */}
            <form onSubmit={handleAddComment} className="space-y-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase font-mono-cinema">Pin Timecode:</span>
                <input
                  type="text"
                  value={commentTimecode}
                  onChange={(e) => setCommentTimecode(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-amber-400 font-mono font-bold w-28 outline-none"
                />
              </div>

              <textarea
                rows={2}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Leave director feedback or editorial note..."
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500 resize-none"
              />

              <button
                type="submit"
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded transition-colors flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post Review Note</span>
              </button>
            </form>

            {/* Comments List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{c.author}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({c.role})</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                      {c.timecode}
                    </span>
                  </div>

                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {c.text}
                  </p>

                  <div className="text-[10px] text-slate-500 font-mono text-right">
                    {c.timestamp}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
