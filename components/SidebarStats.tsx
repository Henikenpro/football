// components/SidebarStats.tsx
import React from 'react';

type Summary = {
  totalMatches: number;
  totalGoals: number;
  homeWins: number;
  awayWins: number;
  draws: number;
};

export default function SidebarStats({ date, summary }: { date: string; summary: Summary }) {
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow">
        <h3 className="font-medium mb-2">Số liệu thống kê ngày {date}</h3>
        <div className="text-sm space-y-1 text-slate-600 dark:text-slate-300">
          <div className="flex justify-between"><span>Tổng số trận</span><span className="font-semibold">{summary.totalMatches}</span></div>
          <div className="flex justify-between"><span>Tổng số bàn thắng</span><span className="font-semibold">{summary.totalGoals}</span></div>
          <div className="flex justify-between"><span>Đội thắng (sân nhà)</span><span className="font-semibold">{summary.homeWins}</span></div>
          <div className="flex justify-between"><span>Đội thắng (sân khách)</span><span className="font-semibold">{summary.awayWins}</span></div>
          <div className="flex justify-between"><span>Hòa</span><span className="font-semibold">{summary.draws}</span></div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow">
        <h3 className="font-medium mb-2">Người ghi bàn hàng đầu</h3>
        <p className="text-sm text-slate-500">Dữ liệu cầu thủ ghi bàn cần endpoint riêng. Bạn có thể gọi API players/topscorers hoặc players?season=&league= và xử lý.</p>
        <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
          {/* Placeholder: nếu bạn thêm dữ liệu topScorers thì render ở đây */}
          <li className="text-slate-400">Chưa có dữ liệu</li>
        </ul>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow">
        <h3 className="font-medium mb-2">Biểu mẫu đội (ví dụ)</h3>
        <p className="text-sm text-slate-500">Hiển thị biểu đồ form đội — có thể lấy bằng cách gọi fixtures từng đội.</p>
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <div className="text-sm">Man City</div>
            <div className="ml-auto flex gap-1">
              <span className="px-1 py-0.5 rounded bg-green-500 text-white text-xs">W</span>
              <span className="px-1 py-0.5 rounded bg-green-500 text-white text-xs">W</span>
              <span className="px-1 py-0.5 rounded bg-slate-200 text-xs">D</span>
              <span className="px-1 py-0.5 rounded bg-red-500 text-white text-xs">L</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="text-sm">Liverpool</div>
            <div className="ml-auto flex gap-1">
              <span className="px-1 py-0.5 rounded bg-green-500 text-white text-xs">W</span>
              <span className="px-1 py-0.5 rounded bg-green-500 text-white text-xs">W</span>
              <span className="px-1 py-0.5 rounded bg-green-500 text-white text-xs">W</span>
              <span className="px-1 py-0.5 rounded bg-slate-200 text-xs">D</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}