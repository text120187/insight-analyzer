export type AnalysisType = 'trends' | 'competitors' | 'reviews' | 'news' | 'self' | 'research';

export interface AnalysisRequest {
  service: string;
  domain: string;
  purpose: string;
  types: AnalysisType[];
  competitors?: string;
  reviews?: string;
  news?: string;
  selfDescription?: string;
  researchData?: string;
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
  self:        { label: '자체 서비스 진단', icon: '🔍', description: '우리 서비스 강약점·개선 방향 분석' },
  research:    { label: '학술/연구 자료',  icon: '📚', description: '논문·리포트에서 근거 기반 인사이트 도출' },
};
