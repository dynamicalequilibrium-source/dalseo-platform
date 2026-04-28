# 배포 가이드 - Phase 5: 클라우드 배포 및 최종 출시

달서구 사회적경제 지원사업 플랫폼의 프로덕션 배포 절차입니다.

## 📋 배포 체크리스트

- [ ] AWS/Azure 클라우드 계정 생성
- [ ] PostgreSQL 데이터베이스 설정
- [ ] Node.js 런타임 설정
- [ ] 환경 변수 설정
- [ ] SSL/HTTPS 인증서 설정
- [ ] 자동 스크래핑 스케줄 (cron)
- [ ] 모니터링 및 로깅 설정
- [ ] 최종 테스트 및 검증
- [ ] 실제 사용자 공개

---

## 🌐 Step 1: 클라우드 플랫폼 선택

### 옵션 1: AWS (권장)
**장점**: 무료 크레딧, 강력한 성능, 확장성
**비용**: $0-50/월 (초기 프리 티어)

**필요한 서비스:**
- EC2 또는 App Runner (Node.js 앱)
- RDS (PostgreSQL 데이터베이스)
- S3 (스크래핑 로그 저장)
- CloudWatch (모니터링)

### 옵션 2: Azure (대체)
**장점**: 한국 데이터센터 (부산), Microsoft 통합
**비용**: $0-30/월 (초기 크레딧)

**필요한 서비스:**
- App Service (Node.js 앱)
- Azure Database for PostgreSQL
- Blob Storage (로그)
- Application Insights (모니터링)

### 옵션 3: 국내 클라우드 (Naver Cloud, KT Cloud)
**장점**: 한국 기업 지원, 데이터 규제 준수
**비용**: 월정액 또는 종량제

---

## 🔧 Step 2: AWS App Runner 배포 (예시)

### 2-1. 사전 준비

```bash
# AWS CLI 설치
# macOS/Linux: brew install awscli
# Windows: https://aws.amazon.com/cli/

# AWS 계정 설정
aws configure
# AWS Access Key ID: [입력]
# AWS Secret Access Key: [입력]
# Default region: ap-northeast-2 (서울)
# Default output format: json
```

### 2-2. PostgreSQL 데이터베이스 생성

```bash
# AWS RDS 콘솔에서:
1. 데이터베이스 생성
2. PostgreSQL 선택
3. 인스턴스 클래스: db.t3.micro (프리 티어)
4. DB 인스턴스 식별자: dalseo-social-programs
5. 마스터 암호 설정
6. 퍼블릭 액세스 가능: 예 (또는 보안 그룹)
7. 생성 완료

# 연결 정보 메모:
- Endpoint: xxx.rds.amazonaws.com
- Port: 5432
- Database: postgres
- Username: admin
- Password: [설정한 암호]
```

### 2-3. 로컬에서 데이터베이스 마이그레이션

```bash
# PostgreSQL 클라이언트 설치
# Windows: https://www.pgadmin.org/download/pgadmin-4-windows/
# macOS: brew install postgresql
# Linux: apt-get install postgresql-client

# SQLite → PostgreSQL 마이그레이션 스크립트
python scripts/migrate_to_postgres.py \
  --source data/programs.db \
  --target postgresql://admin:password@xxx.rds.amazonaws.com:5432/postgres \
  --create-tables
```

### 2-4. Docker 이미지 생성

```dockerfile
# Dockerfile 생성
FROM node:20-alpine

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm ci --only=production

# 소스 코드 복사
COPY . .

# 빌드
RUN npm run build

# 포트 설정
EXPOSE 3000

# 시작 명령어
CMD ["npm", "start"]
```

```bash
# Docker 이미지 빌드
docker build -t dalseo-platform:latest .

# AWS ECR에 푸시 (선택사항)
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin 123456789.dkr.ecr.ap-northeast-2.amazonaws.com

docker tag dalseo-platform:latest \
  123456789.dkr.ecr.ap-northeast-2.amazonaws.com/dalseo-platform:latest

docker push 123456789.dkr.ecr.ap-northeast-2.amazonaws.com/dalseo-platform:latest
```

### 2-5. App Runner 배포

```bash
# AWS 콘솔:
1. App Runner 서비스 생성
2. 리포지토리: ECR (위에서 푸시한 이미지)
3. 배포 설정: 자동 배포
4. 환경 변수 설정:
   - DATABASE_URL=postgresql://admin:pass@xxx.rds.amazonaws.com/postgres
   - ANTHROPIC_API_KEY=sk-ant-xxx
   - KAKAO_REST_API_KEY=xxx
   - KAKAO_USER_ID=xxx
   - NODE_ENV=production

5. 배포!

# 결과:
- 공개 URL: https://xxx.ap-northeast-2.awsapprunner.com
```

---

## 🔐 Step 3: HTTPS 및 SSL 인증서 설정

### 3-1. AWS Certificate Manager 사용

```bash
# AWS 콘솔:
1. ACM (AWS Certificate Manager) 열기
2. 인증서 요청
3. 도메인명: dalseo-social-programs.kr (또는 직접 구매)
4. DNS 검증 선택
5. CNAME 레코드 추가 (Route53 또는 DNS 제공자)
6. 검증 완료
7. App Runner에 연결
```

### 3-2. Route53 도메인 설정

```bash
# Route53 콘솔:
1. Hosted zone 생성: dalseo-social-programs.kr
2. A 레코드 추가:
   - Name: dalseo-social-programs.kr
   - Type: A (또는 ALIAS)
   - Value: App Runner 공개 URL
3. 저장

# 결과: https://dalseo-social-programs.kr 에서 접속 가능
```

---

## ⏰ Step 4: 자동 스크래핑 스케줄 설정

### 4-1. AWS Lambda + EventBridge (권장)

```python
# lambda_scraper.py - AWS Lambda 함수
import json
import subprocess
import os

def lambda_handler(event, context):
    """매일 자정에 스크래핑 실행"""
    
    # 환경 변수 설정
    os.environ['ANTHROPIC_API_KEY'] = os.getenv('ANTHROPIC_API_KEY')
    
    # 스크래핑 실행
    result = subprocess.run(
        ['python', '/opt/python/scripts/scraper/scraper.py'],
        capture_output=True,
        text=True
    )
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Scraping completed',
            'output': result.stdout,
            'error': result.stderr if result.returncode != 0 else None
        })
    }
```

**AWS 콘솔에서 설정:**
```
1. Lambda 함수 생성: dalseo-scraper
2. 런타임: Python 3.11
3. 코드: lambda_scraper.py 복사
4. 레이어 추가: pandas, requests, beautifulsoup4 등
5. 환경 변수: ANTHROPIC_API_KEY 설정
6. 메모리: 512MB, 타임아웃: 5분

EventBridge 규칙:
1. 규칙 생성: scrape-daily
2. 일정: cron(0 0 * * ? *) # 매일 자정 (UTC)
3. 대상: Lambda 함수 (dalseo-scraper)
4. 활성화!
```

### 4-2. EC2 Cron 작업 (대체)

```bash
# EC2 인스턴스에 접속
ssh ec2-user@xxx.amazonaws.com

# crontab 설정
crontab -e

# 추가:
0 0 * * * cd /home/ec2-user/workspace && npm run scrape >> /var/log/scraper.log 2>&1
```

---

## 📊 Step 5: 모니터링 및 로깅

### 5-1. CloudWatch (AWS)

```bash
# CloudWatch 콘솔:
1. 로그 그룹 생성: /aws/apprunner/dalseo-platform
2. App Runner에 연결
3. 로그 쿼리:
   fields @timestamp, @message
   | filter @message like /ERROR/ or /WARN/
   | stats count() by @message
```

### 5-2. 알람 설정

```bash
# CloudWatch 알람:
1. 지표 선택: ApplicationRunnerApplicationCPUUtilization
2. 임계값: 80%
3. 작업: SNS 알림 (이메일로 발송)

# 또는:
1. 로그 그룹 선택
2. 메트릭 필터: ERROR
3. 임계값: 1개 이상
4. 알람 생성
```

---

## 🔄 Step 6: 데이터베이스 백업 설정

### 6-1. RDS 자동 백업

```bash
# AWS RDS 콘솔:
1. DB 인스턴스 선택
2. 수정
3. 백업 보관 기간: 30일
4. 백업 윈도우: UTC 02:00-03:00 (한국 오전 11시)
5. 저장
```

### 6-2. S3로 주간 내보내기

```bash
# RDS 스냅샷 → S3 내보내기
aws rds start-export-task \
  --export-task-identifier dalseo-backup-$(date +%Y%m%d) \
  --source-arn arn:aws:rds:ap-northeast-2:123456789:db:dalseo-social-programs \
  --s3-bucket-name dalseo-backups \
  --s3-prefix monthly/ \
  --iam-role-arn arn:aws:iam::123456789:role/ExportRole
```

---

## 🧪 Step 7: 프로덕션 테스트

### 7-1. 통합 테스트

```bash
# 배포된 사이트에서 테스트
https://dalseo-social-programs.kr/

# 테스트 항목:
☐ 홈페이지 로드
☐ 검색 기능 (필터 포함)
☐ 검증 대시보드
☐ 프로그램 승인 → 검색에 표시
☐ 카톡 알림 발송 (테스트용)
☐ 데이터베이스 조회 성능
```

### 7-2. 성능 테스트

```bash
# 부하 테스트 (Apache Bench)
ab -n 1000 -c 10 https://dalseo-social-programs.kr/

# 결과:
- 응답 시간: < 500ms
- 에러율: 0%
- 동시 연결: 10
```

### 7-3. 보안 테스트

```bash
# SSL/TLS 검증
curl -I https://dalseo-social-programs.kr/

# 결과: HTTP/2 200 OK, 자격증명서 유효

# OWASP 보안 점검
# https://owasp.org/www-project-top-ten/
```

---

## 📢 Step 8: 공개 및 홍보

### 8-1. 최종 검증

```bash
# 센터 직원 검증 (UAT)
- 5명 이상의 직원이 실제 사용
- 피드백 수집 (1주)
- 개선사항 적용
- 최종 승인
```

### 8-2. 공개 배포

```bash
# 공개 시작:
1. 달서구청 웹사이트에 링크 추가
2. 담당자 이메일로 사용 가이드 발송
3. 직원 교육 세션
4. 공식 공개 공지
```

### 8-3. 운영 핸드북

준비할 문서:
- **사용자 가이드**: 직원을 위한 사용 방법
- **관리자 가이드**: 시스템 관리 및 유지보수
- **문제 해결 가이드**: 자주 발생하는 문제와 해결법
- **API 문서**: 향후 다른 센터 연동을 위한 API 명세

---

## 💡 운영 팁

### 정기 점검
- **매주**: 스크래핑 로그 확인
- **매월**: 데이터베이스 백업 확인
- **분기별**: 보안 업데이트 적용
- **반년마다**: 성능 최적화 리뷰

### 스케일링
```
예상 사용자: 50-100명 (달서구 직원)
데이터 규모: 월 50-100개 프로그램
피크 시간: 업무 시간 (09:00-18:00)

마이그레이션 경로:
- 초기: App Runner + RDS t3.micro
- 성장: t3.small → t3.medium
- 확장: Aurora PostgreSQL, CloudFront CDN
```

---

## 🎯 예상 비용 (월)

| 항목 | 비용 | 비고 |
|------|------|------|
| App Runner | $5-10 | 변수 비용 |
| RDS PostgreSQL | $15-20 | t3.micro |
| NAT Gateway | $30 | 선택사항 |
| CloudWatch | <$1 | 모니터링 |
| 데이터 전송 | <$5 | 백업 등 |
| **총계** | **$50-70** | 프리 티어 활용 시 더 저렴 |

---

## 📞 지원 및 연락처

- **기술 문제**: 개발 팀 이메일
- **사용자 문제**: 센터 담당자
- **AWS 지원**: AWS Support (유료 플랜)

---

**다음 단계**: 센터와 협의하여 클라우드 플랫폼 선택 후 배포 시작!
