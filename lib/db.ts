// Database schema definition for SQLite

export const SCHEMA = `
-- 지원 사업 테이블
CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  region TEXT NOT NULL CHECK (region IN ('달서구', '경상북도', '중앙부처')),
  description TEXT,
  fund_amount TEXT,
  deadline TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  source_website TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  INDEX idx_deadline (deadline),
  INDEX idx_region (region),
  INDEX idx_created_at (created_at)
);

-- 기업 종류별 지원 매핑
CREATE TABLE IF NOT EXISTS program_enterprise_types (
  program_id TEXT NOT NULL,
  enterprise_type TEXT NOT NULL CHECK (
    enterprise_type IN ('사회적경제기업', '사회적기업', '마을기업', '협동조합', '소셜벤처')
  ),
  PRIMARY KEY (program_id, enterprise_type),
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);

-- 검증 작업 테이블 (직원용 대시보드)
CREATE TABLE IF NOT EXISTS verification_tasks (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'verified', 'rejected')),
  extracted_title TEXT NOT NULL,
  extracted_organization TEXT NOT NULL,
  extracted_region TEXT NOT NULL,
  extracted_description TEXT,
  extracted_fund_amount TEXT,
  extracted_deadline TEXT NOT NULL,
  source_url TEXT NOT NULL,
  notes TEXT,
  verified_by TEXT,
  verified_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- 카톡 봇 구독자
CREATE TABLE IF NOT EXISTS kakao_subscribers (
  user_id TEXT PRIMARY KEY,
  uuid TEXT UNIQUE,
  subscribed_at TEXT NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  last_message_sent_at TEXT,
  INDEX idx_is_active (is_active)
);

-- 카톡 봇 메시지 로그
CREATE TABLE IF NOT EXISTS kakao_messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  program_id TEXT,
  message TEXT NOT NULL,
  sent_at TEXT NOT NULL,
  status TEXT CHECK (status IN ('sent', 'failed')),
  FOREIGN KEY (user_id) REFERENCES kakao_subscribers(user_id),
  FOREIGN KEY (program_id) REFERENCES programs(id),
  INDEX idx_sent_at (sent_at)
);
`

// 기업 분류 정의
export const ENTERPRISE_TYPE_DEFINITIONS = {
  '사회적경제기업': {
    label: '사회적경제기업',
    description: '사회적·환경적 목적을 우선으로 하는 기업 전체',
    characteristics: [
      '사회적·환경적 가치 창출을 주요 목표로 함',
      '이윤보다 사회적 목표 우선',
    ],
  },
  '사회적기업': {
    label: '사회적기업',
    description: '고용취약계층에게 사회서비스 또는 일자리를 제공하는 기업',
    characteristics: [
      '고용노동부 인증 필요',
      '최소 일자리 비율 충족 요건',
      '이윤의 일부를 사회에 환원',
    ],
  },
  '마을기업': {
    label: '마을기업',
    description: '지역주민이 주도적으로 만들어 지역 발전에 기여하는 기업',
    characteristics: [
      '지역 주민 주도 운영 (지분 90% 이상)',
      '지역 일자리 및 소득 창출',
      '행정안전부 지원 대상',
    ],
  },
  '협동조합': {
    label: '협동조합',
    description: '공동 목표 달성을 위해 자발적으로 결합한 조직',
    characteristics: [
      '민주적 운영 원칙',
      '조합원의 경제적 이익 증진',
      '상호부조 정신',
    ],
  },
  '소셜벤처': {
    label: '소셜벤처',
    description: '혁신적 아이디어로 사회문제를 해결하는 창업 기업',
    characteristics: [
      '사회 문제 해결을 주요 미션으로 함',
      '창의적·혁신적 접근',
      '확장성 및 성장성 보유',
    ],
  },
}
