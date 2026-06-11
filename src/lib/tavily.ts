import { tavily } from '@tavily/core';
import type { TavilySource } from '@/types';

function getClient() {
  if (!process.env.TAVILY_API_KEY) throw new Error('TAVILY_API_KEY가 설정되지 않았습니다.');
  return tavily({ apiKey: process.env.TAVILY_API_KEY });
}

interface SearchOutput {
  text: string;
  sources: TavilySource[];
}

let _nextId = 1;
export function resetSourceId() { _nextId = 1; }

function buildOutput(
  results: { title: string; content: string; url: string }[],
  type: TavilySource['type'],
  startId: number
): SearchOutput {
  const sources: TavilySource[] = results.map((r, i) => ({
    id: startId + i,
    title: r.title,
    url: r.url,
    snippet: r.content.slice(0, 200),
    type,
  }));

  const text = sources
    .map(s => `[출처 ${s.id}] ${s.title}\n${results[s.id - startId].content}\n출처: ${s.url}`)
    .join('\n\n---\n\n');

  _nextId = startId + results.length;
  return { text, sources };
}

export async function searchNews(service: string, domain: string, startId = 1): Promise<SearchOutput> {
  const client = getClient();
  const res = await client.search(`${service} ${domain} 최신 동향 뉴스`, {
    searchDepth: 'basic',
    topic: 'news',
    maxResults: 6,
    days: 60,
  });
  return buildOutput(res.results, 'news', startId);
}

export async function searchResearch(service: string, domain: string, startId = 1): Promise<SearchOutput> {
  const client = getClient();
  const [korean, english] = await Promise.all([
    client.search(`${domain} ${service} 사용자 연구 논문 인사이트`, { searchDepth: 'basic', maxResults: 3 }),
    client.search(`${domain} user research UX study behavior analysis`, { searchDepth: 'basic', maxResults: 3 }),
  ]);
  return buildOutput([...korean.results, ...english.results], 'research', startId);
}

export async function searchReviews(service: string, startId = 1): Promise<SearchOutput> {
  const client = getClient();

  const [storeRes, painRes, blogRes] = await Promise.all([
    // 앱스토어·플레이스토어 직접 타겟
    client.search(`${service} app reviews rating`, {
      searchDepth: 'advanced',
      maxResults: 3,
      includeDomains: ['apps.apple.com', 'play.google.com'],
    }).catch(() => ({ results: [] as { title: string; content: string; url: string }[] })),

    // 사용자 불만·개선 요청
    client.search(`${service} 앱 불편한점 개선요청 사용자 후기`, {
      searchDepth: 'advanced',
      maxResults: 3,
    }).catch(() => ({ results: [] as { title: string; content: string; url: string }[] })),

    // 블로그·커뮤니티 사용 후기
    client.search(`${service} 앱 사용 후기 장단점 솔직 리뷰`, {
      searchDepth: 'basic',
      maxResults: 3,
    }).catch(() => ({ results: [] as { title: string; content: string; url: string }[] })),
  ]);

  // URL 중복 제거 후 최대 8개
  const seen = new Set<string>();
  const combined = [...storeRes.results, ...painRes.results, ...blogRes.results]
    .filter(r => {
      if (seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    })
    .slice(0, 8);

  return buildOutput(combined, 'reviews', startId);
}
