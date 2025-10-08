// components/Header.tsx
'use client';
import Link from 'next/link';
import React from 'react';

export default function Header() {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">VB</div>
          <div>
            <div className="font-semibold">Kết quả Bóng đá VN</div>
            <div className="text-xs text-muted-foreground">Lịch thi đấu • Kết quả • Dự đoán</div>
          </div>
        </Link>

        <nav aria-label="Main navigation" className="hidden md:flex gap-4">
          <Link href="/" className="px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800">Trang chủ</Link>
          <Link href="/lich-thi-dau" className="px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800">Lịch thi đấu</Link>
          <Link href="/ket-qua" className="px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800">Kết quả</Link>
          <Link href="/keo-nha-cai" className="px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800">Kèo Nhà Cái</Link>
          <Link href="/du-doan" className="px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800">Dự đoán</Link>
          <Link href="/bang-xep-hang" className="px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800">Bảng xếp hạng</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/du-doan" className="px-3 py-2 bg-primary text-white rounded">Dự đoán</Link>
        </div>
      </div>
    </header>
  );
}