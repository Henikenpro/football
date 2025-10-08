'use client';
import React from 'react';
import { format } from 'date-fns';

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function DatePicker({ value, onChange, min, max }: { value?: string; onChange: (date: string) => void; min?: string; max?: string }) {
  const today = toInputDate(new Date());
  const v = value ?? today;

  return (
    <div>
      <label className="sr-only">Chọn ngày</label>
      <input
        type="date"
        value={v}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
      />
    </div>
  );
}