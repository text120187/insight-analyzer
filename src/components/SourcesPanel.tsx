'use client';

import { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import type { TavilySource } from '@/types';

const TYPE_LABEL: Record<TavilySource['type'], { label: string; color: string }> = {
  news:     { label: '뉴스',   color: 'bg-blue-50 text-blue-700 border-blue-200' },
  research: { label: '연구',   color: 'bg-purple-50 text-purple-700 border-purple-200' },
  reviews:  { label: '리뷰',   color: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export function SourcesPanel({ sources }: { sources: TavilySource[] }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggleExpand = (id: number) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-8 border border-gray-200 rounded-2xl overflow-hidden">
      {/* 헤더 - 항상 보임 */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-4 h-4 text-gray-500" />
          <span className="font-semibold text-gray-700 text-sm">참고 자료</span>
          <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
            {sources.length}건
          </span>
          <span className="text-xs text-gray-400 hidden sm:inline">
            · AI가 분석에 활용한 실제 웹 자료입니다
          </span>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-gray-400" />
          : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {/* 출처 목록 */}
      {open && (
        <div className="divide-y divide-gray-100">
          {sources.map(src => (
            <div key={src.id} className="px-6 py-4 bg-white hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                {/* 번호 */}
                <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center mt-0.5">
                  {src.id}
                </span>

                <div className="flex-1 min-w-0">
                  {/* 제목 + 타입 배지 */}
                  <div className="flex items-start gap-2 flex-wrap mb-1">
                    <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${TYPE_LABEL[src.type].color}`}>
                      {TYPE_LABEL[src.type].label}
                    </span>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-gray-800 hover:text-indigo-600 transition-colors line-clamp-2 leading-snug"
                    >
                      {src.title}
                    </a>
                  </div>

                  {/* 요약 + 펼치기 */}
                  {src.snippet && (
                    <div className="mb-1.5">
                      <p className={`text-xs text-gray-500 leading-relaxed ${expanded.has(src.id) ? '' : 'line-clamp-2'}`}>
                        {expanded.has(src.id) && src.content ? src.content : src.snippet}
                      </p>
                      {src.content && src.content.length > 200 && (
                        <button
                          onClick={() => toggleExpand(src.id)}
                          className="text-xs text-indigo-500 hover:text-indigo-700 mt-0.5"
                        >
                          {expanded.has(src.id) ? '접기 ▲' : '더 보기 ▼'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* URL */}
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span className="truncate max-w-xs">{src.url}</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
