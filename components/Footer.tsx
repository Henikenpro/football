// components/Footer.tsx
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 py-6 text-sm text-slate-600 dark:text-slate-300 flex flex-col md:flex-row justify-between items-center">
        <div>
          © {new Date().getFullYear()} Kết quả Bóng đá VN — Dữ liệu từ <a className="underline" href="https://www.api-football.com" target="_blank" rel="noreferrer">api-football.com</a>
        </div>
        <div className="flex gap-4 mt-3 md:mt-0">
          <Link href="/privacy" className="underline">Chính sách</Link>
          <Link href="/contact" className="underline">Liên hệ</Link>
          <a href="https://github.com" className="underline" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </div>
    </footer>
  );
}