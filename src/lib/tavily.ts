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
  const res = await client.search(`${service} 앱 리뷰 사용자 평가 장단점`, {
    searchDepth: 'basic',
    maxResults: 6,
  });
  return buildOutput(res.results, 'reviews', startId);
}
