'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Copy, Check, FileDown, Share2, AlertCircle, RefreshCw,
} from 'lucide-react';
import { AnalysisContent } from '@/components/AnalysisContent';
import { ScoreDashboard } from '@/components/ScoreDashboard';
import { ANALYSIS_TYPE_LABELS } from '@/types';
import { exportPdf } from '@/lib/exportPdf';
import { parseScores } from '@/lib/parseScores';
import { SourcesPanel } from '@/components/SourcesPanel';
import type { Analysis } from '@/types';
import type { ScoreData } from '@/lib/parseScores';
import type { TavilySource } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [scores, setScores] = useState<ScoreData | null>(null);
  const [sources, setSources] = useState<TavilySource[]>([]);
  const [cleanContent, setCleanContent] = useState('');
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
      .then((data: Analysis) => {
        setAnalysis(data);
        const { scores: parsedScores, cleanContent: clean } = parseScores(data.content);
        setScores(parsedScores);
        setSources((data as { sources?: TavilySource[] }).sources ?? []);
        setCleanContent(clean);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopy = async () => {
    if (!analysis) return;
    const text = cleanContent || analysis.content;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
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

  const handleReanalyze = () => {
    if (!analysis) return;
    const params = new URLSearchParams({
      service: analysis.service,
      domain: analysis.domain,
      purpose: analysis.purpose,
      types: analysis.types.join(','),
    });
    router.push(`/new?${params.toString()}`);
  };

  const handleDownload = async () => {
    if (!reportRef.current || pdfLoading) return;
    setPdfLoading(true);
    try {
      const filename = analysis
        ? `${analysis.service}_기획인사이트_분석리포트.pdf`
        : '기획인사이트_분석리포트.pdf';
      const content = cleanContent || (analysis?.content ?? '');
      await exportPdf(reportRef.current, filename, content);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(`PDF 오류: ${msg}`);
    } finally {
      setPdfLoading(false);
    }
  };

  /* ── 로딩 ── */
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-gray-200 rounded w-40" />
          <div className="h-8 bg-gray-200 rounded w-1/2 mt-4" />
          <div className="h-48 bg-gray-100 rounded-2xl mt-6" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-40 bg-gray-100 rounded-2xl" />
            <div className="h-40 bg-gray-100 rounded-2xl" />
          </div>
          <div className="h-64 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  /* ── 에러 ── */
  if (error || !analysis) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">분석을 불러올 수 없습니다</p>
            <p className="text-sm text-red-600 mt-1">{error || '알 수 없는 오류'}</p>
            <button onClick={() => router.push('/')} className="mt-3 text-sm text-red-700 underline">
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const ago = formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true, locale: ko });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* ── 상단 네비 + 액션 ── */}
      <div className="no-print flex items-center justify-between mb-8">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          분석 목록
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReanalyze}
            className="flex items-center gap-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 rounded-xl transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">수정 후 재분석</span>
          </button>
          <button
            onClick={handleShareUrl}
            title="URL 복사"
            className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 px-3.5 py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {urlCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{urlCopied ? '복사됨' : '공유'}</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 px-3.5 py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? '복사됨' : '복사'}</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={pdfLoading}
            className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 px-3.5 py-2 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileDown className={`w-3.5 h-3.5 ${pdfLoading ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline">{pdfLoading ? '생성 중...' : 'PDF'}</span>
          </button>
        </div>
      </div>

      {/* ── 헤더 ── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
            {analysis.domain}
          </span>
          <span className="text-xs text-gray-400">{ago}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
          {analysis.service}
          <span className="text-gray-400 font-normal"> 분석 리포트</span>
        </h1>
        <p className="text-sm text-gray-500 mt-2 mb-3">{analysis.purpose}</p>
        <div className="flex flex-wrap gap-1.5">
          {analysis.types.map(t => (
            <span
              key={t}
              className="text-xs text-gray-600 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full"
            >
              {ANALYSIS_TYPE_LABELS[t].icon} {ANALYSIS_TYPE_LABELS[t].label}
            </span>
          ))}
        </div>
      </div>

      {/* ── 점수 대시보드 (화면용) ── */}
      {scores && <ScoreDashboard scores={scores} />}

      {/* ── PDF 추출 영역: 본문 전용 ── */}
      <div ref={reportRef}>
        {/* PDF용 헤더 (인쇄 시에만 보임) */}
        <div className="print-only hidden">
          <h1 className="text-xl font-bold">{analysis.service} 분석 리포트</h1>
          <p className="text-sm text-gray-500">{analysis.domain} · {analysis.purpose}</p>
          <div className="flex flex-wrap gap-1 mt-1 mb-4">
            {analysis.types.map(t => (
              <span key={t} className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                {ANALYSIS_TYPE_LABELS[t].icon} {ANALYSIS_TYPE_LABELS[t].label}
              </span>
            ))}
          </div>
        </div>

        {/* 본문 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">상세 분석</h2>
          <AnalysisContent content={cleanContent || analysis.content} />
        </div>
      <SourcesPanel sources={sources} />
      </div>
    </div>
  );
}
