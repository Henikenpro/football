// components/MatchCard.tsx
'use client';
import React, { useState } from 'react';
import { formatDateISO } from '@/utils/formatters/date';

type TeamSimple = { id: number; name: string; logo?: string | null };
type MatchDetailUI = {
  fixture: { id: number; date: string; status: { short: string; elapsed?: number | null }; venue?: { name?: string | null } };
  league?: { id: number; name: string };
  teams: { home: TeamSimple; away: TeamSimple };
  score?: { fulltime?: { home?: number | null; away?: number | null } };
  statistics?: any[];
  lineups?: any[];
  commentary?: string[];
};

export default function MatchCard({ match }: { match: MatchDetailUI }) {
  const [tab, setTab] = useState<'overview' | 'stats' | 'lineups'>('overview');
  const home = match.teams.home;
  const away = match.teams.away;
  const scoreAvailable = match.score?.fulltime?.home != null && match.score?.fulltime?.away != null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500">{match.league?.name}</div>
          <div className="text-xs text-slate-400">{formatDateISO(match.fixture.date, 'HH:mm dd/MM/yyyy')}</div>
        </div>
        <div className="text-sm text-slate-500">{match.fixture.venue?.name ?? ''}</div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-6">
        <div className="flex-1 text-center">
          <img src={home.logo || '/favicon.ico'} alt={home.name} className="mx-auto w-12 h-12 object-contain" />
          <div className="font-medium mt-2">{home.name}</div>
        </div>

        <div className="w-28 text-center">
          {scoreAvailable ? (
            <div className="text-2xl font-bold">
              {match.score!.fulltime!.home} - {match.score!.fulltime!.away}
            </div>
          ) : (
            <div className="text-sm text-slate-500">{match.fixture.status.short}</div>
          )}
          <div className="text-xs text-slate-400 mt-1">{match.fixture.status.elapsed ? `${match.fixture.status.elapsed}'` : ''}</div>
        </div>

        <div className="flex-1 text-center">
          <img src={away.logo || '/favicon.ico'} alt={away.name} className="mx-auto w-12 h-12 object-contain" />
          <div className="font-medium mt-2">{away.name}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
          <button className={`px-3 py-2 ${tab === 'overview' ? 'border-b-2 border-primary' : ''}`} onClick={() => setTab('overview')}>
            Tổng quan
          </button>
          <button className={`px-3 py-2 ${tab === 'stats' ? 'border-b-2 border-primary' : ''}`} onClick={() => setTab('stats')}>
            Thống kê
          </button>
          <button className={`px-3 py-2 ${tab === 'lineups' ? 'border-b-2 border-primary' : ''}`} onClick={() => setTab('lineups')}>
            Đội hình
          </button>
        </div>

        <div className="mt-3">
          {tab === 'overview' && (
            <div className="text-sm text-slate-600 dark:text-slate-300">
              {/* Tóm tắt nhanh */}
              <p>Trạng thái: {match.fixture.status.short}</p>
              <p>SVĐ: {match.fixture.venue?.name ?? 'Không rõ'}</p>
              <p className="mt-2">Nếu bạn cần chi tiết hơn (thống kê, đội hình), chuyển sang tab tương ứng.</p>
            </div>
          )}

          {tab === 'stats' && (
            <div className="text-sm text-slate-600 dark:text-slate-300">
              {match.statistics && match.statistics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {match.statistics.map((s: any, idx: number) => (
                    <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-900 rounded">
                      <div className="text-xs text-slate-400">{s.type}</div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="font-medium">{s.home}</div>
                        <div className="text-xs text-slate-500">vs</div>
                        <div className="font-medium">{s.away}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500">Chưa có dữ liệu thống kê.</div>
              )}
            </div>
          )}

          {tab === 'lineups' && (
            <div className="text-sm text-slate-600 dark:text-slate-300">
              {match.lineups && match.lineups.length > 0 ? (
                match.lineups.map((l: any, idx: number) => (
                  <div key={idx} className="mb-3">
                    <div className="font-medium">{l.team.name} - {l.formation}</div>
                    <div className="text-xs text-slate-500">{(l.startXI || []).map((p: any) => p.player.name).join(', ')}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">Chưa có dữ liệu đội hình.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}