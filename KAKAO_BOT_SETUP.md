# 카톡 봇 설정 가이드

승인된 새 공모사업을 직원들에게 자동으로 카톡으로 알립니다.

## 📱 기능

- ✅ **자동 알림**: 새 공모사업 승인 시 즉시 카톡 발송
- ✅ **정보 요약**: 제목, 기관, 지역, 지원금, 마감일 포함
- ✅ **원본 링크**: 공고 원본 페이지로 직접 이동
- ✅ **배경 처리**: 비동기로 동작하여 사용자 경험 방해 없음

## 🔧 사전 요구사항

1. **카카오 계정**
2. **카카오 비즈니스 앱** 또는 **카카오 오픈빌더**
3. **REST API 키**
4. **사용자 ID (User ID)**

## 📋 Step 1: 카카오 REST API 키 발급

### 1-1. 카카오 개발자 센터 접속
```
https://developers.kakao.com/
```

### 1-2. 앱 생성
1. "내 애플리케이션" → "앱 추가"
2. 앱 이름: "달서구 지원사업 알림"
3. 사업자명: 입력 후 저장

### 1-3. REST API 키 확인
앱 설정 → "앱 키" → "REST API 키" 복사

예: `0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p`

### 1-4. 카카오톡 메시지 API 활성화
```
앱 설정 → "동의항목" → "카카오톡 메시지 전송" 활성화
```

## 📍 Step 2: 사용자 ID (User ID) 확인

### 방법 1: 카카오톡 사용자 정보 조회
```bash
# 카카오 개발자 센터에서 REST API 테스트
curl -X GET "https://kapi.kakao.com/v2/user/me" \
  -H "Authorization: Bearer {YOUR_ACCESS_TOKEN}"
```

응답에서 `id` 값이 User ID입니다.
예: `123456789`

### 방법 2: 카카오 오픈빌더에서 확인
```
카카오 오픈빌더 → 메시지 → 내 정보 → User ID 복사
```

## 🔐 Step 3: 환경 변수 설정

```bash
# .env 파일 편집
vim .env

# 다음 추가:
KAKAO_REST_API_KEY=your-rest-api-key-here
KAKAO_USER_ID=your-user-id-here
```

**예시:**
```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
KAKAO_REST_API_KEY=0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p
KAKAO_USER_ID=123456789
```

## 🧪 Step 4: 카톡 봇 테스트

### 4-1. 테스트 메시지 발송
```bash
python scripts/kakao_bot.py test
```

**예상 출력:**
```
2026-04-28 15:30:45 - __main__ - INFO - 테스트 메시지:
🎉 새 공모사업 승인됨

📌 [테스트] 2026년 사회적기업 지원사업

📋 기본 정보
• 기관: 고용노동부
• 지역: 중앙부처
• 지원금: 최대 5천만원
• 마감일: 2026-06-30

🔗 상세 정보: https://example.com/test-program

✅ 검색 페이지에서 확인하세요
http://localhost:3000
```

### 4-2. 새 공모사업 알림 발송
```bash
# 최근 24시간 내 승인된 프로그램 알림
python scripts/kakao_bot.py notify
```

## 🔄 자동 통합 (개발 서버에서)

개발 서버가 실행 중일 때:

```bash
npm run dev
```

검증 대시보드에서 프로그램을 승인하면 자동으로 카톡 알림이 발송됩니다.

### 흐름:
```
1. 직원이 /verification에서 프로그램 승인 버튼 클릭
   ↓
2. POST /api/verification-tasks/[id] 호출
   ↓
3. 데이터베이스에 승인 기록
   ↓
4. POST /api/kakao/notify 비동기 호출
   ↓
5. Python 스크립트 실행
   ↓
6. 카톡 메시지 발송 ✅
```

## 📊 봇 상태 확인

```bash
# 카톡 봇 API 상태 확인
curl http://localhost:3000/api/kakao/notify
```

**응답:**
```json
{
  "success": true,
  "status": "ready",
  "message": "카톡 봇이 준비되었습니다.",
  "features": [
    "새 공모사업 자동 알림",
    "승인/거절 상태 업데이트",
    "마감일 임박 알림"
  ]
}
```

## 🎯 고급 설정

### 그룹 채팅에 발송

현재: 개인 카톡으로 발송 (1:1)

그룹 채팅으로 변경하려면:
1. 카카오 오픈빌더에서 그룹 채팅 ID 설정
2. `kakao_bot.py`의 `send_message()` 메서드 수정
3. API 엔드포인트를 그룹 채팅용으로 변경

### 자동 스케줄 (매일 자정)

```bash
# crontab 편집
crontab -e

# 추가:
0 0 * * * cd /path/to/workspace && python scripts/kakao_bot.py notify
```

### 마감일 임박 알림 (예정)

```python
# scripts/kakao_bot.py에 추가 가능
def notify_deadline_approaching(days: int = 7) -> int:
    """마감일이 N일 남은 프로그램 알림"""
    # TODO: 구현
```

## 🆘 문제 해결

### "카톡 메시지 전송 실패"
```
원인: KAKAO_REST_API_KEY가 잘못되었거나 만료됨
해결: 카카오 개발자 센터에서 새 키 발급 후 .env 업데이트
```

### "401 Unauthorized"
```
원인: API 키가 유효하지 않거나 토큰 만료
해결:
1. 카카오 개발자 센터에서 앱 상태 확인
2. "카카오톡 메시지 전송" 동의항목 활성화 확인
3. 새 키 발급
```

### "봇이 응답하지 않음"
```
원인: .env 파일에 KAKAO_REST_API_KEY가 설정되지 않음
해결: .env 파일 확인 및 재설정 후 서버 재시작
```

## 📞 카카오 지원

- **공식 문서**: https://developers.kakao.com/docs
- **카카오 API**: https://kapi.kakao.com
- **개발자 커뮤니티**: https://devtalk.kakao.com

## 🔔 향후 기능

- [ ] 마감일 임박 알림 (D-7일)
- [ ] 기업 종류별 맞춤 알림
- [ ] 지역별 맞춤 알림
- [ ] 거절된 프로그램 알림
- [ ] 주간 요약 리포트
- [ ] 카톡 봇과의 상호작용 (버튼 클릭으로 검증 상태 변경)

---

**팁**: 시뮬레이션 모드에서 테스트한 후 실제 카카오 API 키를 설정하세요!
