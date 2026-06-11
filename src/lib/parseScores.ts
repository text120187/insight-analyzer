export interface Dimension {
  name: string;
  score: number;
}

export interface ScoreItem {
  name: string;
  score: number;
  description: string;
}

export interface ScoreData {
  overall_score: number;
  label: string;
  dimensions: Dimension[];
  strengths: ScoreItem[];
  weaknesses: ScoreItem[];
  opportunities: string[];
  risks: string[];
}

const PATTERN = /<!--\s*INSIGHT_SCORES\s*\n([\s\S]*?)\n?\s*-->/;

export function parseScores(content: string): { scores: ScoreData | null; cleanContent: string } {
  const match = content.match(PATTERN);
  if (!match) return { scores: null, cleanContent: content };
  try {
    const scores = JSON.parse(match[1]) as ScoreData;
    const cleanContent = content.replace(PATTERN, '').trim();
    return { scores, cleanContent };
  } catch {
    return { scores: null, cleanContent: content };
  }
}
