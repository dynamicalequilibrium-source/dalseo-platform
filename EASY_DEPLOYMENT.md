# 초보자를 위한 쉬운 배포 가이드

**5분 안에 배포하는 방법** - 복잡한 설정 없음! ✨

---

## 🎯 Railway를 선택한 이유

- ✅ GitHub 연동하면 끝 (자동 배포)
- ✅ 클릭만으로 배포 (명령어 불필요)
- ✅ 무료 크레딧 $5/월
- ✅ SQLite 파일 저장 가능
- ✅ Python 스크립트도 실행 가능
- ✅ 환경 변수 관리 간단
- ✅ 로그 확인 쉬움

---

## 📋 준비물

- ✅ GitHub 계정
- ✅ 이 코드 (이미 완성!)
- ✅ ANTHROPIC_API_KEY (claude.ai에서 발급)
- ⏰ 소요 시간: 5분

---

## 🚀 Step 1: GitHub에 코드 올리기

### 1-1. GitHub 로그인
```
https://github.com 에서 로그인
(또는 가입하기)
```

### 1-2. 새 Repository 만들기
```
1. GitHub 홈페이지의 + 아이콘 클릭
2. "New repository" 선택
3. Repository name: dalseo-platform
4. Description: 달서구 사회적경제 지원사업 플랫폼
5. "Create repository" 클릭
```

### 1-3. 로컬에서 코드 push

```bash
# 현재 위치: C:\Users\user\Desktop\workspace

# GitHub와 연결
git remote add origin https://github.com/당신계정/dalseo-platform.git

# 메인 브랜치로 이름 변경
git branch -M main

# 코드 업로드
git push -u origin main
```

**완료!** GitHub에서 모든 파일이 보여야 합니다.

---

## 🎪 Step 2: Railway 계정 만들고 배포하기

### 2-1. Railway 가입
```
https://railway.app
↓
"Sign Up" 클릭
↓
GitHub로 로그인 선택
↓
당신의 GitHub 계정 선택
↓
권한 승인
```

### 2-2. 새 프로젝트 시작
```
Railway 홈페이지
↓
"Start a New Project" 클릭
↓
"Deploy from GitHub" 선택
↓
당신의 GitHub 계정 인증
↓
"dalseo-platform" repository 선택
```

### 2-3. 배포 시작
```
"Deploy" 버튼 클릭
↓
Railway가 자동으로:
  ✓ 코드 다운로드
  ✓ npm install
  ✓ npm run build
  ✓ npm start
↓
몇 초 후 배포 완료!
```

**로그 보기:**
- Railway 대시보드 → "Deployments" → 배포 상세보기
- 초록색 ✓ 체크 = 성공!

---

## 🔐 Step 3: 환경 변수 설정

이 부분이 **매우 중요**합니다!

### 3-1. Railway에서 설정하기

```
Railway 대시보드
→ 당신의 프로젝트 선택
→ "Variables" 탭 클릭
→ "New Variable" 버튼
```

### 3-2. 필수 환경 변수 추가

**다음 4개를 추가합니다:**

```
ANTHROPIC_API_KEY = sk-ant-xxxxx
NODE_ENV = production
DATABASE_URL = file:./data/programs.db
NEXT_PUBLIC_API_URL = https://[당신의-프로젝트-url]
```

**어떻게 입력하나?**

1. "New Variable" 클릭
2. Variable name: `ANTHROPIC_API_KEY`
3. Value: `sk-ant-xxxxx` (실제 키 입력)
4. "Add Variable" 클릭
5. 반복...

**ANTHROPIC_API_KEY 어디서 구하나?**

```
https://console.anthropic.com
↓
왼쪽 메뉴 "API Keys"
↓
"Create Key" 클릭
↓
"sk-ant-" 로 시작하는 키 복사
↓
Railway에 붙여넣기
```

### 3-3. (선택) 카톡 봇 설정

카톡 알림을 사용하려면:

```
KAKAO_REST_API_KEY = [카카오 개발자 센터에서 발급]
KAKAO_USER_ID = [카카오 유저 ID]
```

> 자세한 방법: [KAKAO_BOT_SETUP.md](KAKAO_BOT_SETUP.md)

---

## ✅ Step 4: 배포 완료 확인

### 확인 사항

```
1. Railway 대시보드에서 "Deployments" 확인
   → 초록색 ✓ 표시되어야 함

2. 생성된 URL 클릭
   → 브라우저에서 사이트 열림
   → 검색 페이지 보임

3. 주소창:
   https://dalseo-platform-prod-xxx.up.railway.app
```

### 테스트하기

```
1. 홈페이지 접속
   https://dalseo-platform-prod-xxx.up.railway.app

2. 검색창에 아무거나 입력
   → 샘플 데이터 보임 ✓

3. /verification 접속
   https://dalseo-platform-prod-xxx.up.railway.app/verification
   → 검증 대기 중인 공모사업 보임 ✓
```

**축하합니다! 배포 완료! 🎉**

---

## 🔄 다음부터는 더 쉬워집니다

### 코드 업데이트하면 자동 배포

```bash
# 로컬에서 수정
# (파일 수정 후)

git add .
git commit -m "feat: 새 기능 추가"
git push

# 1분 후... Railway가 자동으로 배포! 
# (다시 할 일 없음)
```

### 로그 보기

```
Railway 대시보드
→ "Logs" 탭
→ 실시간으로 서버 로그 확인
```

### 환경 변수 업데이트

```
Railway 대시보드
→ "Variables" 탭
→ 값 수정
→ 저장 (자동으로 재배포)
```

---

## 🚨 문제 해결

### "배포 실패" 에러

**확인 사항:**
1. package.json이 있는가?
2. npm start가 있는가?
3. Node.js 버전 맞는가?

**해결:**
```bash
# 로컬에서 테스트
npm run build
npm start

# 에러 나면 수정 후 다시 push
git add .
git commit -m "fix: 배포 에러 수정"
git push
```

### "앱이 응답하지 않음"

1. Railway 대시보드에서 "Deployments" 확인
2. 빨간색 ✗ 있으면 클릭해서 에러 확인
3. 로그 보기:
   ```
   Railway 대시보드
   → "Logs" 탭
   → ERROR 메시지 찾기
   ```

### "데이터가 없어졌어요"

Railway는 파일 시스템이 재시작될 때 초기화됩니다.
(data/programs.db 파일이 사라짐)

**해결: PostgreSQL 사용**

나중에 필요하면 Railway에서 PostgreSQL 추가 가능:
```
Railway 대시보드
→ "+ Create" 클릭
→ "Postgres" 선택
→ 자동 연동
```

현재는 데모용 SQLite으로 충분합니다.

---

## 💡 팁

### 자신의 도메인 연결하기 (선택)

```
Railway 대시보드
→ "Settings" → "Domains"
→ "Add Domain" 클릭
→ dalseo-programs.kr 입력
→ DNS 설정 (railway가 안내)
```

### GitHub에서 직접 수정

```
GitHub 웹사이트
→ 파일 클릭
→ ✏️ 아이콘 클릭
→ 코드 수정
→ "Commit changes" 클릭

→ Railway가 자동으로 배포!
```

### 백업 받기

```bash
# Railway에서 데이터베이스 다운로드
# (자동 백업 기능 있음)

# 또는 로컬에서:
git clone https://github.com/당신계정/dalseo-platform.git
```

---

## 📞 도움말

**Railway 문서:** https://docs.railway.app
**Next.js 배포:** https://nextjs.org/docs/deployment/railway

---

## 🎯 다음 단계

### 곧 할 일

```
1. ✅ GitHub에 올리기
2. ✅ Railway에 배포하기
3. ✅ 환경 변수 설정하기
4. ⏳ 다른 센터 직원들이 사용해보기
5. ⏳ 피드백 받고 수정하기
   (수정 후 git push하면 자동 배포!)
```

### 나중에 할 일

- PostgreSQL 마이그레이션 (데이터 손실 방지)
- 자신의 도메인 연결
- 모니터링 & 알림 설정
- 정기 백업 설정

---

**5분 만에 완료! 축하합니다! 🎊**

이제 누구나 접속 가능한 온라인 플랫폼을 가지게 되었습니다.

더 궁금한 점이 있으면 언제든지 물어보세요! 💬
