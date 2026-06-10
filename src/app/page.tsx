'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Sparkles, TrendingUp, Users, Star, Newspaper } from 'lucide-react';
import { AnalysisCard } from '@/components/AnalysisCard';
import type { Analysis } from '@/types';

const FEATURES = [
  { icon: TrendingUp, label: '시장 트렌드',    desc: '도메인 내 최신 트렌드와 시사점 자동 도출' },
  { icon: Users,      label: '경쟁사 벤치마킹', desc: '경쟁사 전략·강약점 심층 분석' },
  { icon: Star,       label: '앱 리뷰 분석',   desc: '리뷰 데이터에서 Pain Point·니즈 발굴' },
  { icon: Newspaper,  label: '뉴스 시사점',    desc: '뉴스·기사에서 산업 변화 신호 포착' },
];

export default function HomePage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analyses')
      .then(r => r.json())
      .then(data => Array.isArray(data) ? setAnalyses(data) : setAnalyses([]))
      .catch(() => setAnalyses([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          AI 기반 기획 인사이트 도구
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          기획에 필요한 인사이트를<br className="sm:hidden" /> 한 번에
        </h1>
        <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto">
          트렌드·경쟁사·앱 리뷰·뉴스를 AI가 종합 분석하여<br />
          개선 방향과 실행 과제를 자동으로 도출합니다.
        </p>
        <Link
          href="/new"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl text-base font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          <Plus className="w-5 h-5" />
          새 분석 시작하기
        </Link>
      </div>

      {/* 기능 소개 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-14">
        {FEATURES.map(({ icon: Icon, label, desc }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mb-3">
              <Icon className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="font-medium text-gray-900 text-sm mb-1">{label}</p>
            <p className="text-xs text-gray-500 leading-snug">{desc}</p>
          </div>
        ))}
      </div>

      {/* 최근 분석 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">최근 분석</h2>
          {analyses.length > 0 && (
            <span className="text-sm text-gray-500">{analyses.length}개</span>
          )}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-full" />
              </div>
            ))}
          </div>
        ) : analyses.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
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
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {analyses.map(a => (
              <AnalysisCard key={a.id} analysis={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
