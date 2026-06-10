import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronRight } from 'lucide-react';
import { Analysis, ANALYSIS_TYPE_LABELS } from '@/types';

export function AnalysisCard({ analysis }: { analysis: Pick<Analysis, 'id' | 'service' | 'domain' | 'purpose' | 'types' | 'created_at'> }) {
  const ago = formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true, locale: ko });

  return (
    <Link
      href={`/analysis/${analysis.id}`}
      className="group block bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {analysis.domain}
            </span>
            <span className="text-xs text-gray-400">{ago}</span>
          </div>
          <h3 className="font-semibold text-gray-900 truncate">{analysis.service}</h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-1">{analysis.purpose}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors mt-1 shrink-0" />
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {analysis.types.map(t => (
          <span key={t} className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
            {ANALYSIS_TYPE_LABELS[t].icon} {ANALYSIS_TYPE_LABELS[t].label}
          </span>
        ))}
      </div>
    </Link>
  );
}
