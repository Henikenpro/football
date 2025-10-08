'use client';
import React, { useState, useRef, useEffect } from 'react';
import { debounce } from '@/utils/debounce';
import { useRouter } from 'next/navigation';

type TeamItem = {
  team: { id: number; name: string; logo?: string };
};

export default function SearchBar({ placeholder = 'Tìm đội bóng...' }: { placeholder?: string }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (!inputRef.current) return;
      if (!(e.target instanceof Node) || !inputRef.current.contains(e.target)) {
        // close dropdown if clicked outside
        setOpen(false);
      }
    };
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, []);

  const doSearch = debounce(async (val: string) => {
    if (!val || val.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const url = `/api/football/teams?search=${encodeURIComponent(val)}`;
      const res = await fetch(url);
      if (!res.ok) {
        setResults([]);
        setLoading(false);
        return;
      }
      const json = await res.json();
      const items: TeamItem[] = (json.response || []).slice(0, 10).map((r: any) => ({ team: r.team || r }));
      setResults(items);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
      setOpen(true);
    }
  }, 300);

  useEffect(() => {
    if (q.trim().length >= 2) {
      doSearch(q.trim());
    } else {
      setResults([]);
      setOpen(false);
    }
    return () => {
      (doSearch as any).cancel?.();
    };
  }, [q]);

  return (
    <div className="relative" ref={inputRef}>
      <input
        className="w-full md:w-72 px-3 py-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
        placeholder={placeholder}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => q.length >= 2 && setOpen(true)}
        aria-label="Tìm đội bóng"
      />
      {open && (
        <div className="absolute z-40 mt-1 w-full md:w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-lg">
          {loading ? (
            <div className="p-3 text-sm text-slate-500">Đang tìm...</div>
          ) : results.length === 0 ? (
            <div className="p-3 text-sm text-slate-500">Không tìm thấy</div>
          ) : (
            <ul>
              {results.map((r, idx) => (
                <li
                  key={r.team.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
                  onClick={() => {
                    setOpen(false);
                    setQ('');
                    router.push(`/doi-bong/${r.team.id}`);
                  }}
                >
                  <img src={r.team.logo || '/favicon.ico'} alt={r.team.name} className="w-6 h-6 object-contain" />
                  <div className="text-sm">{r.team.name}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}