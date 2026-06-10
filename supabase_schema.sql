-- 기획 인사이트 분석 결과 저장
CREATE TABLE analyses (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  service    TEXT        NOT NULL,
  domain     TEXT        NOT NULL,
  purpose    TEXT        NOT NULL,
  types      TEXT[]      NOT NULL,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_write" ON analyses FOR ALL USING (true) WITH CHECK (true);

-- 최신 분석 빠른 조회를 위한 인덱스
CREATE INDEX idx_analyses_created_at ON analyses (created_at DESC);
