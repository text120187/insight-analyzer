'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Copy, Check, FileDown, Share2, AlertCircle } from 'lucide-react';
import { AnalysisContent } from '@/components/AnalysisContent';
import { ANALYSIS_TYPE_LABELS } from '@/types';
import { exportPdf } from '@/lib/exportPdf';
import type { Analysis } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/analyses/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('분석을 찾을 수 없습니다.');
        return r.json();
      })
      .then(setAnalysis)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopy = async () => {
    if (!analysis) return;
    try {
      await navigator.clipboard.writeText(analysis.content);
    } catch {
      const el = document.createElement('textarea');
      el.value = analysis.content;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareUrl = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement('textarea');
      el.value = url;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!reportRef.current || pdfLoading) return;
    setPdfLoading(true);
    try {
      const filename = analysis ? `${analysis.service}_기획인사이트_분석리포트.pdf` : '기획인사이트_분석리포트.pdf';
      await exportPdf(reportRef.current, filename);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(`PDF 오류: ${msg}`);
      console.error(e);
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
          <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-4 bg-gray-100 rounded" style={{ width: `${70 + i * 5}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">분석을 불러올 수 없습니다</p>
            <p className="text-sm text-red-600 mt-1">{error || '알 수 없는 오류'}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-3 text-sm text-red-700 underline"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const ago = formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true, locale: ko });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* 뒤로가기 + 액션 버튼 — 인쇄 시 숨김 */}
      <div className="no-print flex items-center justify-between mb-6">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          분석 목록
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShareUrl}
            className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            title="URL 복사"
          >
            {urlCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{urlCopied ? '복사됨' : '공유'}</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? '복사됨' : '복사'}</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={pdfLoading}
            className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileDown className={`w-3.5 h-3.5 ${pdfLoading ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline">{pdfLoading ? '생성 중...' : 'PDF 저장'}</span>
          </button>
        </div>
      </div>

      {/* PDF 추출 영역: 제목 + 내용 */}
      <div ref={reportRef}>
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {analysis.domain}
            </span>
            <span className="text-xs text-gray-400">{ago}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{analysis.service} 분석 리포트</h1>
          <p className="text-sm text-gray-500 mt-1">{analysis.purpose}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {analysis.types.map(t => (
              <span key={t} className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                {ANALYSIS_TYPE_LABELS[t].icon} {ANALYSIS_TYPE_LABELS[t].label}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
          <AnalysisContent content={analysis.content} />
        </div>
      </div>
    </div>
  );
}
