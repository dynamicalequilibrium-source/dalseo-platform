# 달서구 사회적경제 지원사업 통합 플랫폼

사회적경제 기업 대표들을 위한 지원사업 정보 통합 검색 플랫폼입니다.

## 📋 개요

### 문제
- 지원사업 정보가 여러 정부 기관, 지자체 사이트에 분산됨
- 기업 대표들이 검색에 시간을 할애할 여유가 없음
- 마감기한을 놓치거나 자신의 기업에 맞는 지원사업을 발견하지 못함

### 솔루션
- **통합 검색**: 9개 우선순위 사이트에서 자동 수집
- **똑똑한 필터링**: 기업 종류, 지역별로 검색
- **마감기한 표시**: 남은 기간을 한 눈에 확인
- **카톡 알림**: 새 공모사업이 올라오면 자동 알림

## 🚀 빠른 시작

### 개발 환경 설정

```bash
# 1. Node.js 의존성 설치
npm install

# 2. 개발 서버 시작
npm run dev

# 브라우저에서 http://localhost:3000 열기
```

### 프로젝트 구조

```
ecosystem-platform/
├── app/                    # Next.js 앱 라우팅
│   ├── page.tsx           # 메인 페이지 (검색 + 필터)
│   ├── layout.tsx         # 레이아웃 (헤더, 푸터)
│   ├── globals.css        # 전역 스타일
│   └── api/               # API 라우트 (향후)
├── lib/
│   ├── types.ts           # TypeScript 타입 정의
│   ├── db.ts              # 데이터베이스 스키마
│   └── scraper.py         # 웹 스크래핑 (Python)
├── data/
│   └── programs.db        # SQLite 데이터베이스
├── docs/
│   └── ENTERPRISE_CLASSIFICATION.md  # 기업 분류 정의
├── public/                # 정적 파일
└── package.json           # 프로젝트 설정
```

## 🏗️ MVP 기능 (4주 목표)

### Phase 1: 기본틀 (1주)
- [x] Next.js 프로젝트 초기화
- [ ] SQLite 데이터베이스 생성
- [ ] 기본 UI 레이아웃 (검색, 필터)

### Phase 2: 데이터 수집 (2주)
- [ ] 9개 우선순위 사이트 스크래핑 스크립트 (Python)
  - [ ] 중앙부처 (중소벤처기업부, 행정안전부, 기획재정부)
  - [ ] 경상북도 공식 사이트
  - [ ] 달서구 공식 사이트
- [ ] AI 자동 분류 (기업 종류, 지역별)
- [ ] 출처 링크 제공 (직원 검증용)

### Phase 3: 검증 대시보드 (2주)
- [ ] 직원용 검증 UI
  - [ ] 추출된 정보 확인
  - [ ] 원본 링크로 검증
  - [ ] 승인/거절
  - [ ] 메모 추가

### Phase 4: 카톡 알림 (1주)
- [ ] 카카오 오픈빌더 연동
- [ ] 새 공모사업 알림
- [ ] 구독/구독 해제

## 📊 기업 분류 (5가지)

각 공모사업은 다음 5가지 기업 종류 중 하나 이상을 지원 대상으로 명시합니다:

| 분류 | 정의 | 특징 |
|-----|------|------|
| **사회적경제기업** | 사회적·환경적 목표를 우선하는 기업 전체 | 상위 카테고리 |
| **사회적기업** | 고용취약계층에게 일자리를 제공하는 기업 | 정부 인증 필수 |
| **마을기업** | 지역주민 주도로 지역 발전에 기여하는 기업 | 주민 90% 이상 소유 |
| **협동조합** | 공동 목표로 자발적으로 결합한 조직 | 민주적 운영 |
| **소셜벤처** | 혁신으로 사회문제를 해결하는 창업기업 | 창의적 접근 |

👉 상세한 정의와 판단 기준은 [docs/ENTERPRISE_CLASSIFICATION.md](docs/ENTERPRISE_CLASSIFICATION.md) 참고

## 🛠️ 기술 스택

- **Frontend**: Next.js 15 + React 19 + TailwindCSS
- **Backend**: Next.js API Routes (향후 Python FastAPI로 확장)
- **Database**: SQLite (초기) → PostgreSQL (프로덕션)
- **Scraping**: Python (BeautifulSoup, Requests)
- **Bot**: 카카오 오픈빌더 / Python Flask

## 📅 일정

| 주차 | 목표 | 담당 |
|-----|------|------|
| 1주 | 기본틀 완성 | 개발팀 |
| 2주 | 3개 사이트 파일럿 스크래핑 | 개발팀 + 센터 직원 |
| 3주 | 검증 대시보드 + 나머지 6개 사이트 | 개발팀 + 센터 직원 |
| 4주 | 카톡 봇 + 배포 준비 | 개발팀 |

## 🔧 개발 명령어

```bash
# 개발 서버 시작
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm start

# 린트 검사
npm run lint

# 테스트 실행 (향후)
npm test

# 스크래핑 실행 (향후)
npm run scrape
```

## 📝 API 엔드포인트 (계획)

### 프로그램 검색
```
GET /api/programs
Query: search, types[], regions[], sort
```

### 검증 작업 목록
```
GET /api/verification-tasks
Query: status, limit, offset
```

### 카톡 구독
```
POST /api/kakao/subscribe
Body: { userId, uuid }
```

## 🚀 배포

### 초기 (MVP)
- 달서구 사회적경제지원센터 로컬 서버 또는 클라우드 (AWS/Azure)

### 확대 (Phase 2)
- 다른 지역 센터와의 API 연동 준비

## 📞 문의

달서구 사회적경제지원센터
- 주소: 대구광역시 달서구
- 연락처: [센터 번호]

## 📄 라이선스

공개 정보 기반 서비스 (Open Data)
