'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Plus, History } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-gray-900 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <span className="hidden sm:block">기획 인사이트 분석</span>
          <span className="sm:hidden">인사이트</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              pathname === '/'
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">분석 히스토리</span>
          </Link>

          <Link
            href="/new"
            className="flex items-center gap-1.5 bg-indigo-600 text-white px-3.5 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            새 분석
          </Link>
        </div>
      </div>
    </nav>
  );
}
