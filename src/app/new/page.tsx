'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles, ChevronDown, ChevronUp, AlertCircle,
  TrendingUp, Users, Star, Newspaper, FileDown, Copy, Check
} from 'lucide-react';
import { AnalysisContent } from '@/components/AnalysisContent';
import type { AnalysisRequest, AnalysisType } from '@/types';
import { ANALYSIS_TYPE_LABELS } from '@/types';
import { exportPdf } from '@/lib/exportPdf';

type Phase = 'form' | 'analyzing' | 'done' | 'error';

const DOMAIN_EXAMPLES = [
  '커머스', '피트니스/헬스케어', '금융/핀테크', '교육/에듀테크',
  '여행/모빌리티', '음식배달', '부동산', '콘텐츠/미디어', '게임', '소셜/커뮤니티',
];

const OPTIONAL_FIELDS: { key: keyof AnalysisRequest; type: AnalysisType; label: string; placeholder: string }[] = [
  {
    key: 'competitors',
    type: 'competitors',
    label: '경쟁사 목록',
    placeholder: '예: 카카오페이, 토스, 네이버페이 (쉼표로 구분)',
  },
  {
    key: 'reviews',
    type: 'reviews',
    label: '앱 리뷰 데이터',
    placeholder: '구글 플레이 / 앱스토어 리뷰 텍스트를 붙여넣기하세요.\n여러 리뷰를 줄바꿈으로 구분합니다.',
  },
  {
    key: 'news',
    type: 'news',
    label: '뉴스 / 참고 자료',
    placeholder: '분석에 활용할 뉴스 기사나 리포트 내용을 붙여넣기하세요.',
  },
  {
    key: 'selfDescription',
    type: 'self',
    label: '서비스 현황 / 기능 설명',
    placeholder: '현재 서비스 구성, 주요 기능, 알려진 문제점 등을 자유롭게 적어주세요.\n예: 현재 온보딩 이탈률이 높고, 결제 플로우가 3단계인데 이를 줄이고 싶습니다.',
  },
  {
    key: 'researchData',
    type: 'research',
    label: '학술/연구 자료',
    placeholder: '분석에 활용할 논문 요약, 리포트, 연구 결과 등을 붙여넣기하세요.\n비워두면 해당 도메인의 주요 연구 동향을 바탕으로 분석합니다.',
  },
];

export default function NewAnalysisPage() {
  const router = useRouter();
  const resultRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<Phase>('form');
  const [content, setContent] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const [form, setForm] = useState<AnalysisRequest>({
    service: '',
    domain: '',
    purpose: '',
    types: ['trends', 'competitors'],
    competitors: '',
    reviews: '',
    news: '',
    selfDescription: '',
    researchData: '',
  });

  const toggleType = (t: AnalysisType) => {
    setForm(prev => ({
      ...prev,
      types: prev.types.includes(t) ? prev.types.filter(x => x !== t) : [...prev.types, t],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.service.trim() || !form.domain.trim() || !form.purpose.trim()) return;
    if (form.types.length === 0) return;

    setPhase('analyzing');
    setContent('');
    setStatusMessage('');
    let fullContent = '';

    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok || !res.body) throw new Error('분석 요청 실패');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.error) throw new Error(data.error);
            if (data.status) setStatusMessage(data.status);
            if (data.text) {
              setStatusMessage('');
              fullContent += data.text;
              setContent(fullContent);
            }
            if (data.done) {
              // 분석 완료 후 Supabase에 저장
              const saveRes = await fetch('/api/analyses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, content: fullContent }),
              });
              if (saveRes.ok) {
                const saved = await saveRes.json();
                setSavedId(saved.id);
                router.replace(`/analysis/${saved.id}`);
              }
              setPhase('done');
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== 'Unexpected end of JSON input') {
              throw parseErr;
            }
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류');
      setPhase('error');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      const el = document.createElement('textarea');
      el.value = content;
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

  const handleDownload = async () => {
    if (!resultRef.current || pdfLoading) return;
    setPdfLoading(true);
    try {
      await exportPdf(resultRef.current, `기획인사이트_분석리포트.pdf`, content);
    } catch (e) {
      alert('PDF 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error(e);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* 분석 입력 폼 */}
      {(phase === 'form' || phase === 'error') && (
        <div>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">무엇을 분석할까요?</h1>
            <p className="text-gray-500">분석하려는 서비스와 목적을 입력하면 AI가 종합 리포트를 작성합니다.</p>
          </div>

          {phase === 'error' && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">분석 중 오류가 발생했습니다</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">기본 정보</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  서비스 / 제품명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.service}
                  onChange={e => setForm(p => ({ ...p, service: e.target.value }))}
                  placeholder="예: 토스, 배달의민족, 쏘카..."
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  도메인 / 카테고리 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.domain}
                  onChange={e => setForm(p => ({ ...p, domain: e.target.value }))}
                  placeholder="예: 핀테크, 음식배달, 헬스케어..."
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {DOMAIN_EXAMPLES.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, domain: d }))}
                      className="text-xs text-gray-500 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 px-2.5 py-1 rounded-full transition-colors"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  분석 목적 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.purpose}
                  onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))}
                  placeholder="예: 다음 분기 UX 개선 방향 수립을 위해 경쟁사와 사용자 니즈를 파악하고 싶습니다."
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  rows={3}
                  required
                />
              </div>
            </div>

            {/* 분석 유형 선택 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="font-semibold text-gray-900 mb-4">
                분석 유형 <span className="text-red-500">*</span>
                <span className="text-xs font-normal text-gray-400 ml-2">최소 1개 선택</span>
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(ANALYSIS_TYPE_LABELS) as AnalysisType[]).map(t => {
                  const { label, icon, description } = ANALYSIS_TYPE_LABELS[t];
                  const checked = form.types.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleType(t)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        checked
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 bg-white hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{icon}</span>
                        <span className={`font-medium text-sm ${checked ? 'text-indigo-700' : 'text-gray-800'}`}>
                          {label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 선택 입력 (체크된 유형에 따라 표시) */}
            {OPTIONAL_FIELDS.filter(f => form.types.includes(f.type)).length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
                <h2 className="font-semibold text-gray-900">참고 데이터 <span className="text-gray-400 text-xs font-normal">(선택)</span></h2>
                {OPTIONAL_FIELDS.filter(f => form.types.includes(f.type)).map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                    <textarea
                      value={(form[f.key] as string) ?? ''}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                      rows={4}
                    />
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={!form.service || !form.domain || !form.purpose || form.types.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3.5 rounded-xl font-semibold text-base hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
            >
              <Sparkles className="w-5 h-5" />
              AI 인사이트 분석 시작
            </button>
          </form>
        </div>
      )}

      {/* 스트리밍 분석 결과 */}
      {(phase === 'analyzing' || phase === 'done') && (
        <div ref={resultRef}>
          {/* 액션 버튼 — 인쇄 시 숨김 */}
          {phase === 'done' && (
            <div className="no-print flex items-center justify-end gap-2 mb-4">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '복사됨' : '복사'}
              </button>
              <button
                onClick={handleDownload}
                disabled={pdfLoading}
                className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileDown className={`w-3.5 h-3.5 ${pdfLoading ? 'animate-bounce' : ''}`} />
                {pdfLoading ? '생성 중...' : 'PDF 저장'}
              </button>
            </div>
          )}

          {/* 인쇄 영역: 제목 + 내용 */}
          <div>
            <div className="mb-6">
              <h1 className="text-xl font-bold text-gray-900">{form.service} 분석 리포트</h1>
              <p className="text-sm text-gray-500 mt-0.5">{form.domain} · {form.purpose}</p>
            </div>

            {phase === 'analyzing' && !content && (
              <div className="flex items-center gap-3 text-indigo-600 mb-6">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">
                  {statusMessage || 'AI가 분석 중입니다...'}
                </span>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
              <AnalysisContent content={content} streaming={phase === 'analyzing'} />
            </div>
          </div>

          {phase === 'done' && savedId && (
            <div className="no-print mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm font-medium text-green-800">분석 완료! 자동 저장되었습니다.</p>
              <p className="text-xs text-green-600 mt-0.5 font-mono break-all">{window.location.href}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
