// components/LeagueSelector.tsx
'use client';
import React, { useEffect, useState } from 'react';
import useLeagues from '@/hooks/useLeagues';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

type LeagueItem = {
  league: { id: number; name: string; logo?: string; season?: number };
  country?: { name?: string };
};

export default function LeagueSelector({ value, includeAll = true }: { value?: number; includeAll?: boolean }) {
  const { leagues, isLoading } = useLeagues();
  const [selected, setSelected] = useState<number | ''>(value ?? '');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setSelected(value ?? '');
  }, [value]);

  const onChange = (v: string) => {
    const sp = new URLSearchParams(Array.from(searchParams?.entries() ?? []));
    if (v === '') {
      sp.delete('league');
    } else {
      sp.set('league', String(v));
    }
    const qs = sp.toString();
    const target = qs ? `${pathname}?${qs}` : pathname;
    setSelected(v === '' ? '' : Number(v));
    router.push(target);
  };

  return (
    <div>
      <label className="sr-only">Chọn giải</label>
      <select
        value={selected as any}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
      >
        {includeAll && <option value="">Tất cả giải</option>}
        {isLoading && <option>Đang tải...</option>}
        {leagues.map((l: LeagueItem) => (
          <option key={l.league.id} value={l.league.id}>
            {l.league.name}{l.country?.name ? ` (${l.country.name})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}