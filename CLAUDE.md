# CLAUDE.md — 프로젝트 가이드

## 개요
이 프로젝트는 달서구 사회적경제 지원사업 통합 플랫폼입니다.
4주 내에 MVP를 출시하는 것이 목표입니다.

## 구현 우선순위

### 높음 (필수)
1. **데이터베이스 스키마** — SQLite 초기화 및 테이블 생성 ✅ **완료**
   - 9개 테이블: programs, verification_tasks, program_enterprise_types, kakao_subscribers, kakao_messages 등
   - `npm run db:init` 로 초기화

2. **기본 검색 + 필터 UI** — Next.js 페이지 작성 ✅ **완료**
   - `/` (홈): 기업 종류 + 지역 필터, 검색, 페이지네이션
   - `/api/programs`: GET 검색 API

3. **직원 검증 대시보드** ✅ **완료**
   - `/verification`: 펜딩 공모사업 리뷰 및 승인/거절
   - `/api/verification-tasks`: GET 리스트, POST 승인/거절

4. **스크래핑 파이프라인** (3개 사이트 파일럿) 🚀 **진행 중**
   - `scripts/scraper/scraper.py`: BeautifulSoup4 + Claude API 분류
   - `config.py`: 3개 정부 사이트 (중소벤처기업부, 행정안전부, 달서구청)
   - 테스트: `scripts/scraper/test_scraper.py` (mock 데이터로 파이프라인 검증)

### 중간 (추천)
5. **카톡 봇** — 새 공모사업 알림 ✅ **완료**
   - 자동 알림 통합 (승인 시)
   - `scripts/kakao_bot.py` + `/api/kakao/notify`
   - 테스트: `npm run kakao:test`

6. **웹사이트 배포** — AWS/Azure 🚀 **진행 예정**

### 낮음 (향후)
7. API 정리 (다른 센터 연동 준비)
8. 뉴스레터, 피드백 시스템
9. AI 추천 엔진

## 기술 결정사항

### 프론트엔드
- **Framework**: Next.js 15
- **Styling**: TailwindCSS
- **State**: React hooks (Redux 불필요)
- **Type Safety**: TypeScript

### 백엔드 (초기)
- **Runtime**: Node.js + Next.js API Routes
- **Database**: SQLite (초기) → PostgreSQL (프로덕션)

### 스크래핑 (별도 프로세스)
- **Language**: Python 3.10+
- **Libraries**: requests, BeautifulSoup4
- **AI**: Claude API (자동 분류)
- **Schedule**: cron (매일 자정)

### 카톡 봇
- **Platform**: 카카오 오픈빌더 (비개발자 친화적)
- **또는**: Python Flask + 카카오 Messaging API

## 기업 분류 (5가지)

각 공모사업은 최소 1개 이상의 기업 종류를 대상으로 명시:

1. **사회적경제기업** — 사회적·환경적 목표 우선 기업 (상위 카테고리)
2. **사회적기업** — 고용취약계층 고용 (정부 인증)
3. **마을기업** — 지역주민 주도 (90% 이상 소유)
4. **협동조합** — 공동 목표 (민주적 운영)
5. **소셜벤처** — 혁신적 문제 해결 (창업기반)

👉 [docs/ENTERPRISE_CLASSIFICATION.md](docs/ENTERPRISE_CLASSIFICATION.md) 참고

## 개발 워크플로우

### 1. Feature 브랜치 만들기
```bash
git checkout -b feat/기능명
```

### 2. 로컬에서 개발 + 테스트
```bash
npm run dev
# http://localhost:3000 에서 테스트
```

### 3. 커밋
```bash
git add .
git commit -m "feat: 기능 설명"
```

### 4. PR + 코드 리뷰
```bash
git push origin feat/기능명
# GitHub/GitLab에서 PR 생성
```

## Testing

### 단위 테스트 (향후)
```bash
npm test
```

### 통합 테스트 (향후)
- 3개 사이트 파일럿 스크래핑 검증
- 직원 대시보드 사용성 테스트

## Deployment

### 개발 환경
- 로컬 `npm run dev`
- http://localhost:3000

### 스테이징 (향후)
- 클라우드 (AWS/Azure)
- 센터 직원이 접근 가능한 URL

### 프로덕션 (4주 후)
- 공개 배포
- HTTPS 필수
- 자동 스크래핑 (cron)

## 알려진 제약사항

### 데이터 검증
- AI가 100% 정확하지 않음 → 직원 검증 필수
- 출처 링크 제공 → 검증 시간 1-2분 단축

### 스크래핑
- 웹사이트 레이아웃 변경 → 매년 모니터링 필요
- 일부 사이트는 JavaScript 렌더링 필요 → Puppeteer 사용

### 카톡 봇
- 카카오 오픈빌더 학습곡선 낮음 (비개발자 친화)
- 또는 간단한 Python Flask로 구현 가능

## Communication

### 진행 상황 보고
- 매주 목요일 센터와 체크인
- 스크래핑 파일럿 결과 공유
- 검증 대시보드 피드백 수집

### 문제 해결
- 데이터 스키마 변경 필요 → 센터와 논의
- 기업 분류 모호한 경우 → 기업 분류 정의 문서 업데이트
- 스크래핑 실패 → 수동으로 원본 URL 추가

## 현재 진행 상황 (2026-04-28)

### ✅ 완료된 작업
- Phase 1: 데이터베이스 스키마 (SQLite 9개 테이블)
- Phase 2: 검색 UI + API (프로그램 검색, 필터, 페이지네이션)
- Phase 3A: 직원 검증 대시보드 (AI 추출 정보 승인/거절)
- Phase 3B 준비: 스크래핑 파이프라인 인프라

### 🚀 진행 중
- Python 스크래핑 파이프라인 구축
  - `scripts/scraper/scraper.py`: 웹 스크래핑 + AI 분류
  - `scripts/scraper/test_scraper.py`: Mock 데이터로 파이프라인 검증
  - 실행: `npm run scrape` (또는 `python scripts/scraper/scraper.py`)

### 📋 다음 작업 (우선순위)

1. **스크래핑 파이프라인 통합** ✅ **완료**
   - ✓ Python 환경 설정 (scripts/setup-scraper.sh)
   - ✓ Mock 데이터로 파이프라인 테스트 (scripts/scraper/test_scraper.py)
   - ✓ 실제 정부 사이트 URLs 설정 (3개)
   - ⏳ 선택자 미세조정 (필요시 반복)

2. **카톡 봇 구현** ✅ **완료**
   - ✓ Python 카톡 봇 (scripts/kakao_bot.py)
   - ✓ 승인 시 자동 알림 통합
   - ✓ REST API 엔드포인트 (/api/kakao/notify)
   - ⏳ 환경변수 설정 필요 (KAKAO_REST_API_KEY, KAKAO_USER_ID)

3. **배포 준비** (2-3일) 🚀 **다음**
   - AWS/Azure 클라우드 선택 및 설정
   - PostgreSQL 마이그레이션 (SQLite → PG)
   - HTTPS 인증서 설정
   - 자동 스크래핑 스케줄 (cron)

4. **최종 테스트 및 출시** (2-3일)
   - 전체 파이프라인 통합 테스트
   - 센터 직원 검증 및 피드백
   - 성능 최적화 및 버그 수정
   - MVP 공개 배포

## 기술 명령어

```bash
# 개발 환경
npm run dev                 # 로컬 서버 시작 (http://localhost:3000)
npm run build              # 프로덕션 빌드
npm run start              # 프로덕션 서버 시작

# 데이터베이스
npm run db:init            # 데이터베이스 초기화 및 샘플 데이터 추가

# 스크래핑
bash scripts/setup-scraper.sh    # Python 환경 설정
python scripts/scraper/test_scraper.py   # 파이프라인 테스트
npm run scrape             # 실제 스크래핑 실행

# Git
git log --oneline          # 커밋 이력 확인
git status                 # 현재 상태 확인
```

문제가 있으면 언제든 물어보세요!
