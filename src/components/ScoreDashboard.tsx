'use client';

import { RadarChart } from './RadarChart';
import type { ScoreData } from '@/lib/parseScores';

const COLOR_MAP = {
  text: {
    emerald: 'text-emerald-600',
    indigo:  'text-indigo-600',
    amber:   'text-amber-600',
    rose:    'text-rose-600',
  },
  bg: {
    emerald: 'bg-emerald-50',
    indigo:  'bg-indigo-50',
    amber:   'bg-amber-50',
    rose:    'bg-rose-50',
  },
  border: {
    emerald: 'border-emerald-200',
    indigo:  'border-indigo-200',
    amber:   'border-amber-200',
    rose:    'border-rose-200',
  },
} as const;

type ColorTier = keyof typeof COLOR_MAP.text;

function tier(score: number): ColorTier {
  if (score >= 80) return 'emerald';
  if (score >= 60) return 'indigo';
  if (score >= 40) return 'amber';
  return 'rose';
}

function scoreColor(score: number, type: 'text' | 'bg' | 'border' = 'text') {
  return COLOR_MAP[type][tier(score)];
}

function GradientBar({ score, color }: { score: number; color: 'emerald' | 'rose' | 'indigo' }) {
  const pct = Math.min(100, Math.max(0, score));
  const cls =
    color === 'emerald' ? 'bg-emerald-500' :
    color === 'rose' ? 'bg-rose-400' : 'bg-indigo-500';

  return (
    <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
      <div
        className={`h-full ${cls} rounded-full transition-all duration-700`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function ScoreDashboard({ scores }: { scores: ScoreData }) {
  const { overall_score, label, dimensions, strengths, weaknesses, opportunities, risks } = scores;

  return (
    <div className="space-y-4 mb-8 no-print">
      {/* ── 1. 종합 점수 카드 ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">종합 분석 점수</p>
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          {/* 레이더 차트 */}
          <div className="shrink-0">
            <RadarChart dimensions={dimensions} />
          </div>

          {/* 점수 + 차원별 바 */}
          <div className="flex-1 w-full min-w-0">
            {/* 전체 점수 */}
            <div
              className={`inline-flex items-baseline gap-2 px-4 py-2.5 rounded-xl border mb-6
                ${scoreColor(overall_score, 'bg')} ${scoreColor(overall_score, 'border')}`}
            >
              <span className={`text-5xl font-extrabold tabular-nums ${scoreColor(overall_score, 'text')}`}>
                {overall_score}
              </span>
              <span className={`text-sm font-medium ${scoreColor(overall_score, 'text')}`}>/100</span>
              <span className={`text-sm font-bold ml-2 ${scoreColor(overall_score, 'text')}`}>{label}</span>
            </div>

            {/* 차원별 점수 바 */}
            <div className="space-y-3.5">
              {dimensions.map((d) => (
                <div key={d.name}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-medium text-gray-600">{d.name}</span>
                    <span className={`text-xs font-bold tabular-nums ${scoreColor(d.score, 'text')}`}>
                      {d.score}
                    </span>
                  </div>
                  <GradientBar score={d.score} color="indigo" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. 강점 / 약점 ── */}
      {(strengths.length > 0 || weaknesses.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 강점 */}
          {strengths.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                강점
              </h3>
              <div className="space-y-4">
                {strengths.map((s) => (
                  <div key={s.name}>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-sm font-semibold text-gray-800">{s.name}</span>
                      <span className="text-sm font-bold tabular-nums text-emerald-600 ml-2 shrink-0">
                        {s.score}
                      </span>
                    </div>
                    <GradientBar score={s.score} color="emerald" />
                    {s.description && (
                      <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{s.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 약점 */}
          {weaknesses.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
                개선 필요
              </h3>
              <div className="space-y-4">
                {weaknesses.map((w) => (
                  <div key={w.name}>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-sm font-semibold text-gray-800">{w.name}</span>
                      <span className="text-sm font-bold tabular-nums text-rose-500 ml-2 shrink-0">
                        {w.score}
                      </span>
                    </div>
                    <GradientBar score={w.score} color="rose" />
                    {w.description && (
                      <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{w.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 3. 기회 / 위험 ── */}
      {(opportunities.length > 0 || risks.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {opportunities.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-widest mb-3">핵심 기회</p>
              <ul className="space-y-2.5">
                {opportunities.map((o, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-emerald-900">
                    <span className="text-emerald-500 font-bold shrink-0 mt-px">↗</span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {risks.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-widest mb-3">주요 위험</p>
              <ul className="space-y-2.5">
                {risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                    <span className="text-amber-500 font-bold shrink-0 mt-px">⚠</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
