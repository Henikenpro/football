'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navItems = [
    { href: '/truc-tiep', label: 'Tỉ số trực tiếp' },
    { href: '/lich-thi-dau', label: 'Lịch thi đấu' },
    { href: '/ket-qua', label: 'Kết quả' },
    // { href: '/keo-nha-cai', label: 'Kèo Nhà Cái' },
    // { href: '/du-doan', label: 'Dự đoán' },
  ];

  const leagues = [ 
    { href: '/giai-dau/ligue-1', label: 'Ligue 1' },
    { href: '/giai-dau/la-liga', label: 'LaLiga' },
    { href: '/giai-dau/v-league', label: 'V-League' },
    { href: '/giai-dau/europa-league', label: 'Europa League' },
    { href: '/giai-dau/serie-a', label: 'Serie A' },
    { href: '/giai-dau/ngoai-hang-anh', label: 'Ngoại Hạng Anh' },
    { href: '/giai-dau/bundesliga', label: 'Bundesliga' },
    { href: '/giai-dau/champions-league', label: 'Champions League' },
    { href: '/giai-dau/europa-conference', label: 'Europa Conference' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold shadow-md">
            VB
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-white">
              Kết quả Bóng đá
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Lịch thi đấu • Kết quả • Dự đoán
            </div>
          </div>
        </Link>

        {/* Navigation desktop */}
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-green-500 text-white shadow-md'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-green-50 dark:hover:bg-slate-800 hover:text-green-600'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="relative group">
            <button className="px-4 py-2 text-sm font-medium dark:text-slate-300 hover:text-green-600">
              Giải đấu ▾
            </button>
            <div className="absolute w-96 -left-64 top-full hidden group-hover:grid grid-cols-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-3 gap-1">
              {leagues.map((lg) => (
                <Link
                  key={lg.href}
                  href={lg.href}
                  className="px-2 py-1 text-sm rounded hover:bg-green-50 dark:hover:bg-slate-800 hover:text-green-600"
                >
                  {lg.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 space-y-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-green-500 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-green-50 dark:hover:bg-slate-800 hover:text-green-600'
                }`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
          <div>
            <div className=" text-sm px-3 dark:text-slate-300 font-semibold mb-2">
              Giải đấu
            </div>
            <div className="grid grid-cols-2 px-2 gap-1">
              {leagues.map((lg) => (
                <Link
                  key={lg.href}
                  href={lg.href}
                  className="px-2 py-1 text-sm rounded hover:bg-green-50 dark:hover:bg-slate-800 hover:text-green-600"
                  onClick={() => setOpen(false)}
                >
                  {lg.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
