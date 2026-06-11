'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Sparkles, X } from 'lucide-react';
import { AnalysisCard } from '@/components/AnalysisCard';
import type { Analysis } from '@/types';

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  function handleDelete(id: string) {
    setAnalyses(prev => prev.filter(a => a.id !== id));
  }

  useEffect(() => {
    fetch('/api/analyses')
      .then(r => r.json())
      .then(data => Array.isArray(data) ? setAnalyses(data) : setAnalyses([]))
      .catch(() => setAnalyses([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = query.trim()
    ? analyses.filter(a =>
        a.service.toLowerCase().includes(query.toLowerCase()) ||
        a.domain.toLowerCase().includes(query.toLowerCase()) ||
        a.purpose.toLowerCase().includes(query.toLowerCase())
      )
    : analyses;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">분석 히스토리</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? '불러오는 중...' : `총 ${analyses.length}개의 분석`}
          </p>
        </div>
        <Link
          href="/new"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          새 분석
        </Link>
      </div>

      {/* 검색 */}
      {!loading && analyses.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="서비스명, 도메인, 목적으로 검색..."
            className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* 목록 */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : analyses.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-16 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-4">아직 분석 결과가 없습니다.</p>
          <Link
            href="/new"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            첫 분석 시작하기
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <p className="text-gray-500">
            <span className="font-medium text-gray-700">&ldquo;{query}&rdquo;</span>에 대한 검색 결과가 없습니다.
          </p>
          <button onClick={() => setQuery('')} className="mt-3 text-sm text-indigo-600 hover:underline">
            검색 초기화
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(a => (
            <AnalysisCard key={a.id} analysis={a} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
