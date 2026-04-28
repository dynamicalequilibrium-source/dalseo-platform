# 정부 지원사업 스크래퍼 설정 가이드

실제 정부 웹사이트에서 지원사업 정보를 수집하고 AI로 자동 분류합니다.

## 📋 타겟 웹사이트

| 사이트 | URL | 대상 |
|--------|-----|------|
| **기업마당** (정부 통합포털) | https://www.bizinfo.go.kr | 모든 정부 지원사업 |
| **한국사회적기업진흥원** | https://www.socialenterprise.or.kr | 사회적기업, 사회적경제 |
| **대구시 달서구청** | https://www.daegu.go.kr | 지역 지원사업 |

## 🔧 사전 요구사항

- Python 3.10 이상
- Node.js (npm)
- Claude API 키 (anthropic.com에서 발급)

## 📝 Step 1: 환경 설정

### 1-1. Python 패키지 설치

```bash
# Windows PowerShell / Command Prompt
cd C:\Users\user\Desktop\workspace
python -m pip install requests beautifulsoup4 lxml anthropic python-dotenv

# macOS / Linux
pip install requests beautifulsoup4 lxml anthropic python-dotenv
```

### 1-2. API 키 설정

```bash
# .env 파일 생성
copy .env.example .env

# .env 파일을 텍스트 에디터로 열어서 다음을 입력:
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
```

`sk-ant-` 로 시작하는 실제 API 키를 [https://console.anthropic.com](https://console.anthropic.com)에서 얻을 수 있습니다.

## 🧪 Step 2: 파이프라인 테스트 (Mock 데이터)

API 키 없이 파이프라인을 검증할 수 있습니다:

```bash
# Mock 데이터로 테스트 (권장: 먼저 이것을 실행하세요)
python scripts/scraper/test_scraper.py
```

**예상 결과:**
```
============================================================
🧪 스크래퍼 파이프라인 테스트
============================================================

📋 Mock 프로그램 3개 로드됨

🤖 AI 분류 테스트 중...

[1/3] 2026년 사회적기업 인증 및 고용창출 지원사업
  ✓ 유효성: True
  ✓ 신뢰도: 0.95
  ✓ 기업 종류: 사회적기업, 사회적경제기업
  ✓ 마감일: 2026-06-30

[2/3] 마을기업 공동마케팅 지원 프로그램
  ✓ 유효성: True
  ...

============================================================
✅ 테스트 완료!
============================================================
```

## 🌐 Step 3: 실제 웹사이트에서 스크래핑

API 키 설정 후 실제 정부 웹사이트에서 데이터를 수집합니다:

```bash
# 방법 1: npm 스크립트
npm run scrape

# 방법 2: 직접 실행
python scripts/scraper/scraper.py
```

### 예상 진행 과정

```
============================================================
달서구 지원사업 스크래핑 파이프라인 시작
============================================================

스크래핑 시작: 기업마당 (정부 지원사업 통합)
  ✓ 10개 프로그램 추출됨

스크래핑 시작: 한국사회적기업진흥원
  ✓ 8개 프로그램 추출됨

스크래핑 시작: 대구시 달서구청
  ✓ 5개 프로그램 추출됨

AI 분류 시작...

[1/23] 2026년 사회적기업 지원사업
  ✓ 유효성: True
  ✓ 신뢰도: 0.92
  ...

총 23개 프로그램 추출됨
✓ 18개 프로그램이 검증 대기 상태로 저장됨

============================================================
스크래핑 완료: 18개 프로그램 저장됨
검증 대시보드에서 확인하세요: http://localhost:3000/verification
============================================================
```

## 📊 Step 4: 검증 대시보드에서 확인

```bash
# 1. 개발 서버 시작
npm run dev

# 2. 브라우저에서 다음 주소로 이동
http://localhost:3000/verification
```

스크래핑된 프로그램들이 "검증 대기" 상태로 표시됩니다.
직원이 각 프로그램을 검토하고 승인하면 검색 페이지에 추가됩니다.

## 🔄 자동 스크래핑 설정 (선택사항)

매일 자정에 자동으로 스크래핑하도록 설정할 수 있습니다.

### Windows: Task Scheduler
```powershell
# PowerShell(관리자 권한)에서 실행

$action = New-ScheduledTaskAction -Execute "python" -Argument "C:\Users\user\Desktop\workspace\scripts\scraper\scraper.py"
$trigger = New-ScheduledTaskTrigger -Daily -At 00:00
Register-ScheduledTask -TaskName "DalseoScraper" -Action $action -Trigger $trigger -RunLevel Highest
```

### macOS / Linux: Cron
```bash
# crontab 편집
crontab -e

# 다음 줄 추가 (매일 자정 실행)
0 0 * * * cd /path/to/workspace && npm run scrape >> logs/scrape.log 2>&1
```

## 📈 성능 및 비용

### API 사용량
- 한 번 실행당 약 20-30개 프로그램 분류
- Claude API 비용: ~$0.01 ~ $0.03 (Sonnet 3.5 기준)

### 실행 시간
- Mock 테스트: ~2초
- 실제 웹 스크래핑: ~30-60초 (3개 사이트)
- AI 분류: ~30-60초 (20-30개 프로그램)

## 🔍 CSS 선택자 최적화

웹사이트 레이아웃이 변경되면 `scripts/scraper/config.py`의 선택자를 업데이트해야 합니다.

### 선택자 찾기 방법

1. Chrome 개발자 도구 열기 (F12)
2. Element Inspector 활성화 (Ctrl+Shift+C)
3. 원하는 요소(제목, 기한 등) 클릭
4. 표시된 HTML의 클래스/ID 확인
5. `config.py`의 선택자 업데이트

**예시:**
```python
"selector": {
    "container": ".program-list tr",      # 각 프로그램을 감싸는 요소
    "title": "td.program-name a",         # 프로그램 제목
    "organization": "td.organization",    # 실시 기관
    "deadline": "td.deadline-date",       # 마감일
    "link": "a",                          # 원본 링크
}
```

## 📚 문서

- [scraper.py 소스코드 분석](scripts/scraper/README.md)
- [기업 분류 정의](docs/ENTERPRISE_CLASSIFICATION.md)
- [프로젝트 가이드](CLAUDE.md)

## 🆘 문제 해결

### "프로그램을 찾을 수 없습니다" 경고
→ 웹사이트 레이아웃이 변경되었을 가능성
→ `config.py`의 CSS 선택자 업데이트 필요

### "API 요청 실패" 오류
→ 인터넷 연결 확인
→ 웹사이트의 접근 제한 확인
→ Timeout 값 증가 (config.py `SCRAPER_TIMEOUT`)

### "유효하지 않은 JSON 응답"
→ Claude API 키 확인
→ 네트워크 연결 상태 확인
→ API 율 제한 확인 (console.anthropic.com)

## 💡 팁

1. **테스트 우선**: 항상 `test_scraper.py`로 파이프라인을 테스트한 후 실제 스크래핑 실행
2. **로깅**: 실행 결과는 콘솔에 상세하게 로깅되므로 문제 진단에 도움
3. **점진적 확대**: 한 번에 1개 사이트씩 테스트한 후 추가
4. **API 비용**: Mock 테스트에서는 API를 호출하지 않으므로 무료

## 🎯 다음 단계

1. ✅ 이 가이드에 따라 `test_scraper.py` 실행
2. ✅ 검증 대시보드에서 결과 확인
3. ✅ API 키 설정 후 실제 스크래핑 실행
4. ✅ 더 많은 정부 웹사이트 추가 (필요시)
5. ✅ 자동 스크래핑 설정 (선택사항)
