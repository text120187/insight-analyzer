export type AnalysisType = 'trends' | 'competitors' | 'reviews' | 'news' | 'self' | 'research' | 'ux';

export interface TavilySource {
  id: number;
  title: string;
  url: string;
  snippet: string;
  content?: string;
  type: 'news' | 'research' | 'reviews';
}

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
  uxUrl?: string;
  uxImageBase64?: string;
  customerResearch?: string;
  appReviewData?: string;
  vocData?: string;
}

export interface Analysis {
  id: string;
  service: string;
  domain: string;
  purpose: string;
  types: AnalysisType[];
  content: string;
  sources: TavilySource[];
  created_at: string;
}

export const ANALYSIS_TYPE_LABELS: Record<AnalysisType, { label: string; icon: string; description: string }> = {
  trends:      { label: '시장 트렌드',    icon: '📊', description: '도메인 내 최신 트렌드와 시사점' },
  competitors: { label: '경쟁사 벤치마킹', icon: '🏆', description: '경쟁사 전략·강약점 분석' },
  reviews:     { label: '리뷰 분析',   icon: '⭐', description: '리뷰·VOC 데이터에서 Pain Point 도출' },
  news:        { label: '뉴스 분석',      icon: '📰', description: '뉴스·기사에서 산업 시사점 도출' },
  self:        { label: '자체 서비스 진단', icon: '🔍', description: '우리 서비스 강약점·개선 방향 분석' },
  research:    { label: '학술/연구 자료',  icon: '📚', description: '논문·리포트에서 근거 기반 인사이트 도출' },
  ux:         { label: 'UI/UX 화면 분석',  icon: '🖥️', description: '화면 캡처·URL로 사용성 검증' },
};
