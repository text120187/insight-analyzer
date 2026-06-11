import { tavily } from '@tavily/core';

function getClient() {
  if (!process.env.TAVILY_API_KEY) throw new Error('TAVILY_API_KEY가 설정되지 않았습니다.');
  return tavily({ apiKey: process.env.TAVILY_API_KEY });
}

function formatResults(results: { title: string; content: string; url: string }[]): string {
  return results
    .map(r => `[${r.title}]\n${r.content}\n출처: ${r.url}`)
    .join('\n\n---\n\n');
}

export async function searchNews(service: string, domain: string): Promise<string> {
  const client = getClient();
  const res = await client.search(`${service} ${domain} 최신 동향 뉴스`, {
    searchDepth: 'basic',
    topic: 'news',
    maxResults: 6,
    days: 60,
  });
  return formatResults(res.results);
}

export async function searchResearch(service: string, domain: string): Promise<string> {
  const client = getClient();
  const [korean, english] = await Promise.all([
    client.search(`${domain} ${service} 사용자 연구 논문 인사이트`, {
      searchDepth: 'basic',
      maxResults: 3,
    }),
    client.search(`${domain} user research UX study behavior analysis`, {
      searchDepth: 'basic',
      maxResults: 3,
    }),
  ]);
  return formatResults([...korean.results, ...english.results]);
}

export async function searchReviews(service: string): Promise<string> {
  const client = getClient();
  const res = await client.search(`${service} 앱 리뷰 사용자 평가 장단점`, {
    searchDepth: 'basic',
    maxResults: 6,
  });
  return formatResults(res.results);
}
