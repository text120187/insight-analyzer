export type AnalysisType = 'trends' | 'competitors' | 'reviews' | 'news';

export interface AnalysisRequest {
  service: string;
  domain: string;
  purpose: string;
  types: AnalysisType[];
  competitors?: string;
  reviews?: string;
  news?: string;
}

export interface Analysis {
  id: string;
  service: string;
  domain: string;
  purpose: string;
  types: AnalysisType[];
  content: string;
  created_at: string;
}

export const ANALYSIS_TYPE_LABELS: Record<AnalysisType, { label: string; icon: string; description: string }> = {
  trends:      { label: '시장 트렌드',    icon: '📊', description: '도메인 내 최신 트렌드와 시사점' },
  competitors: { label: '경쟁사 벤치마킹', icon: '🏆', description: '경쟁사 전략·강약점 분석' },
  reviews:     { label: '앱 리뷰 분석',   icon: '⭐', description: '리뷰 데이터에서 Pain Point 도출' },
  news:        { label: '뉴스 분석',      icon: '📰', description: '뉴스·기사에서 산업 시사점 도출' },
};
