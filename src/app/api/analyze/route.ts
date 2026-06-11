import OpenAI from 'openai';
import { NextRequest } from 'next/server';
import { AnalysisRequest, AnalysisType, TavilySource } from '@/types';
import { searchNews, searchResearch, searchReviews } from '@/lib/tavily';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `당신은 스타트업·IT 서비스 기업의 기획팀을 지원하는 전문 비즈니스 인사이트 분석가입니다.

역할:
- 시장 트렌드, 경쟁사, 사용자 리뷰, 뉴스 데이터를 종합 분석합니다.
- 분석 결과를 바탕으로 구체적이고 실행 가능한 기획 인사이트를 제공합니다.
- 기획자가 의사결정에 바로 활용할 수 있는 수준의 깊이 있는 분析을 제공합니다.

인용 원칙:
- 제공된 자료(뉴스·리뷰·연구)를 근거로 주장할 때는 반드시 [출처 N] 형식으로 인용하세요.
- 예: "토스는 결제 시장 점유율이 35%에 달합니다 [출처 1]."
- AI 일반 지식에 의존한 주장에는 인용 없이 작성합니다.

원칙:
- 모든 분析은 한국어로 작성합니다.
- 추상적인 조언이 아닌 구체적·실행 가능한 방향을 제시합니다.
- 마크다운 형식으로 가독성 높은 리포트를 작성합니다.
- 데이터/정보가 부족한 경우 업계 일반 지식을 바탕으로 합리적인 추론을 제시합니다.`;

function buildSectionPrompts(req: AnalysisRequest): string {
  const sections: string[] = [];

  if (req.types.includes('trends')) {
    sections.push(`## 1. 📊 시장 트렌드 분析

### 주요 트렌드 (최소 4개)
각 트렌드마다 아래 형식으로 작성:
- **트렌드명**: 트렌드 설명 (2-3문장)
  - *${req.service}에 대한 시사점*: 구체적인 영향과 기회

### 역트렌드 & 주의사항
현재 트렌드 중 과열되었거나 주의가 필요한 흐름을 짚어주세요.

---`);
  }

  if (req.types.includes('competitors')) {
    const competitorList = req.competitors?.trim()
      ? `\n분析 대상 경쟁사: ${req.competitors}`
      : '';
    sections.push(`## 2. 🏆 경쟁사 벤치마킹${competitorList}

### 경쟁사별 심층 분析
각 경쟁사마다 아래 형식으로 분析:
#### [경쟁사명]
- **핵심 전략**:
- **강점**: (불릿 3개 이상)
- **약점/공백**: (불릿 2개 이상)
- **최근 움직임**:

### 경쟁 구도 요약 및 포지셔닝 기회
${req.service}가 차별화할 수 있는 화이트스페이스를 명확히 제시하세요.

---`);
  }

  if (req.types.includes('reviews')) {
    const reviewData = req.reviews?.trim()
      ? `\n아래 앱 리뷰 데이터를 분析하세요 (출처 번호가 있는 경우 [출처 N] 형식으로 인용하세요):\n\`\`\`\n${req.reviews}\n\`\`\``
      : '\n(구체적인 리뷰 데이터가 없으므로 유사 서비스의 일반적인 Pain Point를 분析합니다.)';
    sections.push(`## 3. ⭐ 앱 리뷰 인사이트${reviewData}

### 주요 Pain Points (빈도·심각도 순)
| 순위 | Pain Point | 빈도 | 심각도 | 개선 방향 |
|-----|-----------|-----|-------|---------|

### 사용자가 칭찬하는 요소
높이 평가받는 기능과 그 이유를 분析하세요.

### 숨겨진 니즈 (Unmet Needs)
리뷰 이면에서 발견되는 명시되지 않은 사용자 욕구를 도출하세요.

---`);
  }

  if (req.types.includes('news')) {
    const newsData = req.news?.trim()
      ? `\n아래 뉴스/자료를 분析하세요 (출처 번호가 있는 경우 [출처 N] 형식으로 인용하세요):\n\`\`\`\n${req.news}\n\`\`\``
      : '\n(뉴스 데이터가 없으므로 해당 산업의 최근 주요 동향을 분析합니다.)';
    sections.push(`## 4. 📰 뉴스 & 산업 동향${newsData}

### 핵심 이슈 및 시사점
각 이슈마다:
- **이슈**: 요약 (관련 출처가 있으면 [출처 N] 표시)
  - *시사점*: ${req.service} 기획에 미치는 영향

### 규제·정책 리스크
대응이 필요한 규제 변화나 정책 리스크를 짚어주세요.

---`);
  }

  if (req.types.includes('research')) {
    const researchData = req.researchData?.trim()
      ? `\n아래 학술/연구 자료를 분析하세요 (출처 번호가 있는 경우 [출처 N] 형식으로 인용하세요):\n\`\`\`\n${req.researchData}\n\`\`\``
      : '\n(자료가 없으므로 해당 도메인의 주요 학술 연구 동향을 바탕으로 분析합니다.)';
    const sectionNum = sections.length + 1;
    sections.push(`## ${sectionNum}. 📚 학술/연구 자료 분析${researchData}

### 핵심 연구 발견사항
주요 연구 결과를 요약하고, 각 발견사항이 ${req.service} 기획에 주는 시사점을 제시하세요.

### 근거 기반 사용자 행동 인사이트
연구에서 도출된 사용자 심리·행동 패턴 중 서비스 설계에 적용할 수 있는 것을 구체적으로 설명하세요.

### 업계 적용 사례 & 벤치마크
해당 연구 결과를 실제 서비스에 적용한 사례나 실험 결과를 제시하세요.

### 기획에 바로 활용할 수 있는 시사점
| 연구 근거 | 적용 아이디어 | 기대 효과 |
|---------|------------|---------|

---`);
  }

  if (req.types.includes('self')) {
    const selfData = req.selfDescription?.trim()
      ? `\n아래 서비스 현황 및 설명을 참고하세요:\n\`\`\`\n${req.selfDescription}\n\`\`\``
      : '\n(별도 서비스 정보가 없으므로 서비스명과 도메인을 바탕으로 분析합니다.)';
    const sectionNum = sections.length + 1;
    sections.push(`## ${sectionNum}. 🔍 자체 서비스 진단${selfData}

### 서비스 핵심 가치 & 현재 포지셔닝
${req.service}가 사용자에게 제공하는 핵심 가치와 현재 시장 내 포지션을 평가하세요.

### 내부 강점 (Strengths)
현재 잘 하고 있는 점을 구체적으로 3개 이상 제시하세요.

### 내부 약점 & 개선 기회 (Weaknesses)
| 약점 | 발생 원인 | 개선 방향 | 우선순위 |
|-----|---------|---------|---------|

### UX / 기능 진단
사용자 경험 흐름상 마찰이 발생하거나 개선 여지가 있는 지점을 단계별로 분析하세요.

### 성장 잠재력 & 미활용 자산
현재 충분히 활용되지 않고 있는 기능, 데이터, 사용자 세그먼트 등을 짚어주세요.

---`);
  }

  if (req.types.includes('ux')) {
    const sectionNum = sections.length + 1;
    const hasImage = !!(req.uxImageBase64 || req.uxUrl);
    sections.push(`## ${sectionNum}. 🖥️ UI/UX 화면 분析

${hasImage ? '첨부된 화면 이미지를 기반으로 아래 항목을 분析하세요.' : '(화면 이미지가 없으므로 서비스명과 도메인을 바탕으로 일반적인 UX 관점에서 분析합니다.)'}

### 첫인상 & 비주얼 계층구조
화면의 첫인상과 시각적 위계가 사용자 목적에 부합하는지 평가하세요.

### 사용성 문제점 (Usability Issues)
| 위치 | 문제 | 심각도 | 개선 방향 |
|-----|-----|-------|---------|

### 인지 부하 (Cognitive Load)
사용자가 화면을 이해하기 위해 처리해야 하는 정보량이 적절한지 평가하세요.

### UX 원칙 적용 검토
Nielsen 10가지 사용성 원칙, Fitts 법칙, Gestalt 원칙 관점에서 평가하세요.

### 개선 제안 TOP 5
우선순위 순으로 구체적인 개선 방향을 제시하세요. 각 항목은 "어디를 → 어떻게 → 왜" 형식으로 작성하세요.

---`);
  }

  return sections.join('\n\n');
}

function buildPrompt(req: AnalysisRequest): string {
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  const typeLabels: Record<AnalysisType, string> = {
    trends: '시장 트렌드', competitors: '경쟁사 벤치마킹', reviews: '앱 리뷰', news: '뉴스 분析', self: '자체 서비스 진단', research: '학술/연구 자료', ux: 'UI/UX 화면 분析',
  };

  return `# 기획 인사이트 분析 요청

| 항목 | 내용 |
|-----|-----|
| 서비스/제품 | **${req.service}** |
| 도메인/카테고리 | ${req.domain} |
| 分析 목적 | ${req.purpose} |
| 分析 유형 | ${req.types.map(t => typeLabels[t]).join(', ')} |
| 分析 기준일 | ${today} |

---

다음 구조에 따라 종합 기획 인사이트 리포트를 작성해 주세요.
제공된 자료(뉴스·리뷰·연구)를 근거로 주장할 때 반드시 [출처 N] 형식으로 인용하세요.

## 📋 分析 개요

**${req.service}**의 현황과 分析 맥락을 2-3문장으로 요약하고, 이번 分析이 답해야 할 핵심 질문을 제시하세요.

---

${buildSectionPrompts(req)}

## 5. 💡 종합 인사이트

### 핵심 발견사항 TOP 5
전체 分析을 통해 도출한 가장 중요한 5가지 발견사항을 번호 매겨 제시하세요. 각 항목은 2-3문장으로 근거(출처 포함)를 설명하세요.

### 기회 매트릭스
| 기회 | 시장 매력도 | 실행 가능성 | 우선순위 |
|-----|-----------|-----------|---------|

### 위협 및 대응 전략
주요 위협 요소와 각각의 대응 전략을 구체적으로 제시하세요.

---

## 6. 🎯 개선 방향 우선순위

| 순위 | 개선 방향 | 기대 효과 | 난이도 | 일정 |
|-----|----------|---------|-------|-----|
| 1 | | | 낮음/중간/높음 | 단기/중기/장기 |

최소 7개 이상의 구체적인 개선 방향을 제시하세요.

---

## 7. ⚡ 실행 로드맵

### 즉시 실행 (1개월 이내)
- [ ] 구체적인 실행 항목 (담당 조직, 예상 공수 포함)

### 단기 과제 (1~3개월)
- [ ] 구체적인 실행 항목

### 중기 과제 (3~6개월)
- [ ] 구체적인 실행 항목

### 장기 과제 (6개월 이상)
- [ ] 구체적인 실행 항목

---

*分析 기준일: ${today} · AI 분析 결과로 내부 검토 후 활용을 권장합니다.*

---

${req.types.includes('self') ? `**[시스템 지시]** 위 분析이 완전히 끝난 직후, 아래 형식의 JSON 점수 블록을 **반드시** 정확히 이 형식 그대로 출력하세요. 자체 서비스 진단 결과를 바탕으로 각 수치를 채워 넣으세요. 형식을 절대 바꾸지 마세요.

<!-- INSIGHT_SCORES
{
  "overall_score": <자체 서비스 진단 결과를 종합한 0-100 정수>,
  "label": "<매우 낮음|낮음|보통|양호|우수|매우 우수 중 정확히 하나>",
  "overall_reasoning": "<종합 점수 산정 이유를 2문장 이내로>",
  "dimensions": [
    {"name": "시장 경쟁력", "score": <0-100 정수>, "reasoning": "<이 점수를 준 핵심 근거 1문장>"},
    {"name": "사용자 경험", "score": <0-100 정수>, "reasoning": "<이 점수를 준 핵심 근거 1문장>"},
    {"name": "성장 잠재력", "score": <0-100 정수>, "reasoning": "<이 점수를 준 핵심 근거 1문장>"},
    {"name": "실행 가능성", "score": <0-100 정수>, "reasoning": "<이 점수를 준 핵심 근거 1문장>"},
    {"name": "혁신성", "score": <0-100 정수>, "reasoning": "<이 점수를 준 핵심 근거 1문장>"}
  ],
  "strengths": [
    {"name": "<강점명 6자 이내>", "score": <60-100 정수>, "description": "<30자 이내 한 줄>", "reasoning": "<이 강점이 분析에서 확인된 구체적 근거 1문장>"}
  ],
  "weaknesses": [
    {"name": "<약점명 6자 이내>", "score": <0-50 정수>, "description": "<30자 이내 한 줄>", "reasoning": "<이 약점이 分析에서 확인된 구체적 근거 1문장>"}
  ],
  "opportunities": ["<기회1 20자 이내>", "<기회2>", "<기회3>"],
  "risks": ["<위험1 20자 이내>", "<위험2>"]
}
-->` : ''}`;
}

export async function POST(req: NextRequest) {
  const body: AnalysisRequest = await req.json();

  if (!process.env.OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY가 설정되지 않았습니다.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        const enriched = { ...body };
        const allSources: TavilySource[] = [];
        let nextId = 1;

        if (process.env.TAVILY_API_KEY) {
          if (enriched.types.includes('news') && !enriched.news?.trim()) {
            send({ status: '최신 뉴스 검색 중...' });
            try {
              const out = await searchNews(enriched.service, enriched.domain, nextId);
              enriched.news = out.text;
              allSources.push(...out.sources);
              nextId += out.sources.length;
            } catch {}
          }
          if (enriched.types.includes('research') && !enriched.researchData?.trim()) {
            send({ status: '학술/연구 자료 검색 중...' });
            try {
              const out = await searchResearch(enriched.service, enriched.domain, nextId);
              enriched.researchData = out.text;
              allSources.push(...out.sources);
              nextId += out.sources.length;
            } catch {}
          }
          if (enriched.types.includes('reviews') && !enriched.reviews?.trim()) {
            send({ status: '앱 리뷰 검색 중...' });
            try {
              const out = await searchReviews(enriched.service, nextId);
              enriched.reviews = out.text;
              allSources.push(...out.sources);
              nextId += out.sources.length;
            } catch {}
          }
        }

        // URL → 스크린샷 (Microlink 무료 API)
        let uxScreenshotUrl: string | null = null;
        if (enriched.types.includes('ux') && enriched.uxUrl && !enriched.uxImageBase64) {
          try {
            send({ status: 'URL 화면 캡처 중...' });
            const mlRes = await fetch(
              `https://api.microlink.io/?url=${encodeURIComponent(enriched.uxUrl)}&screenshot=true&meta=false&embed=screenshot.url`
            );
            const mlJson = await mlRes.json();
            uxScreenshotUrl = mlJson?.data?.screenshot?.url ?? null;
          } catch {}
        }

        send({ status: 'AI 分析 시작...' });

        const stream = await openai.chat.completions.create({
          model: 'gpt-4o',
          max_tokens: 10000,
          stream: true,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: (() => {
                const textPart = { type: 'text' as const, text: buildPrompt(enriched) };
                if (enriched.types.includes('ux')) {
                  if (enriched.uxImageBase64) {
                    const mime = enriched.uxImageBase64.startsWith('/9j') ? 'image/jpeg' : 'image/png';
                    return [
                      { type: 'image_url' as const, image_url: { url: `data:${mime};base64,${enriched.uxImageBase64}`, detail: 'high' as const } },
                      textPart,
                    ];
                  } else if (uxScreenshotUrl) {
                    return [
                      { type: 'image_url' as const, image_url: { url: uxScreenshotUrl, detail: 'high' as const } },
                      textPart,
                    ];
                  }
                }
                return buildPrompt(enriched);
              })(),
            },
          ],
        });

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? '';
          if (text) send({ text });
        }

        // 출처 목록 전송
        if (allSources.length > 0) {
          send({ sources: allSources });
        }

        send({ done: true });
      } catch (e) {
        send({ error: String(e) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
