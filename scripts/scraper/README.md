# 달서구 지원사업 웹 스크래핑 파일럿

3개 정부 사이트에서 지원사업 정보를 자동으로 수집하고 AI로 분류하여 검증 대시보드에 전달합니다.

## 설정

### 1. Python 환경 준비

```bash
# Python 3.10+ 필요
python --version  # Python 3.10 이상 확인

# 가상환경 생성 (선택사항)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 2. 의존성 설치

```bash
pip install -r scripts/scraper/requirements.txt
```

### 3. 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env  # 또는 수동으로 생성

# .env 파일에 Claude API 키 추가
ANTHROPIC_API_KEY=sk-ant-...
```

## 사용

### 수동 스크래핑

```bash
cd scripts/scraper
python scraper.py
```

### npm 스크립트로 실행

```bash
npm run scrape
```

### cron으로 자동 실행 (Linux/Mac)

```bash
# 매일 자정에 실행
0 0 * * * cd /path/to/workspace && npm run scrape >> logs/scrape.log 2>&1
```

## 설정 파일 (`config.py`)

### SCRAPE_SITES

3개 웹사이트 설정:

| 사이트 | 키 | URL | 지역 | 기업 종류 |
|--------|-----|-----|------|---------|
| 중소벤처기업부 | `smba` | 소셜벤처 공고 | 중앙부처 | 소셜벤처, 사회적경제기업 |
| 행정안전부 | `mois` | 마을기업 공고 | 중앙부처 | 마을기업, 사회적경제기업 |
| 달서구청 | `dalseo_gu` | 지역 지원사업 | 달서구 | 사회적경제기업 |

각 사이트별로 CSS 선택자를 설정하여 원하는 정보를 추출합니다:
- `container`: 각 프로그램을 감싸는 엘리먼트
- `title`: 프로그램 제목
- `organization`: 실시 기관
- `description`: 프로그램 설명
- `deadline`: 모집 마감일
- `link`: 원본 공고 링크

## 파이프라인 흐름

```
1. 웹 스크래핑 (BeautifulSoup4)
   ↓
2. 정보 추출 (CSS 선택자)
   ↓
3. AI 분류 (Claude API)
   - 유효성 검증
   - 기업 종류 자동 분류
   - 마감일 표준화
   ↓
4. 데이터베이스 저장 (verification_tasks)
   ↓
5. 직원 검증 대시보드에서 리뷰
```

## AI 분류 프롬프트

Claude API를 사용하여 각 프로그램을 분류합니다:

- **is_valid**: 유효한 사회적경제 지원사업인지 여부
- **confidence**: 분류 신뢰도 (0.0 ~ 1.0)
- **title_corrected**: 제목 수정 (필요시)
- **deadline_standardized**: YYYY-MM-DD 형식 마감일
- **fund_amount**: 지원금액
- **enterprise_types**: 대상 기업 종류
- **reason**: 분류 이유

## 결과 확인

스크래핑이 완료되면 검증 대시보드에서 확인할 수 있습니다:

```
http://localhost:3000/verification
```

검증 대기 중인 프로그램들이 표시되며, 직원이 승인하면 검색 페이지에 추가됩니다.

## 로깅

스크래핑 과정은 상세하게 로깅됩니다:

- `BRANCH: master` - 현재 git 브랜치
- `스크래핑 시작: {사이트명}` - 사이트별 시작 알림
- `{개수}개 프로그램 추출됨` - 추출 결과
- `저장됨: {제목}` - 개별 저장 결과

## 주의사항

1. **robots.txt 준수**: 웹사이트의 robots.txt를 확인하고 준수하세요
2. **Rate Limiting**: 요청 간에 적절한 지연을 두어 서버 부하를 줄이세요
3. **선택자 검증**: 웹사이트 레이아웃 변경 시 CSS 선택자를 업데이트해야 합니다
4. **AI 비용**: Claude API 호출 비용이 발생합니다
5. **Timeout**: 네트워크 문제 시 timeout 값을 조정하세요

## 문제 해결

### "프로그램을 찾을 수 없습니다" 경고

웹사이트의 HTML 구조가 변경되었을 수 있습니다:

1. 브라우저에서 해당 사이트를 열기
2. 개발자 도구(F12)로 프로그램 요소 검사
3. CSS 선택자 확인 및 `config.py` 업데이트

### "AI 응답 JSON 파싱 실패" 오류

Claude API 응답이 유효한 JSON이 아닐 수 있습니다:

1. API 키 확인
2. 프롬프트 수정 (필요시)
3. 모델 버전 확인

### 데이터베이스 저장 실패

1. 데이터베이스가 잠겨있는지 확인 (Node.js 프로세스가 실행 중일 수 있음)
2. 데이터베이스 권한 확인
3. 디스크 공간 확인

## 성능 최적화

- 병렬 스크래핑: `asyncio`나 `concurrent.futures` 사용
- 캐싱: 같은 사이트 여러 번 방문 시 캐시 활용
- 배치 처리: AI 분류 시 배치 크기 조정

## 향후 개선사항

- [ ] JavaScript 렌더링 (Puppeteer/Selenium)
- [ ] 프록시 지원
- [ ] 중복 제거 로직
- [ ] 스크래핑 통계 및 대시보드
- [ ] 실패 시 재시도 로직
- [ ] 병렬 스크래핑
