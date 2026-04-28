#!/bin/bash
# 스크래핑 환경 설정 스크립트

set -e

echo "=========================================="
echo "달서구 지원사업 스크래핑 환경 설정"
echo "=========================================="

# Python 버전 확인
echo "Python 버전 확인..."
python --version || {
  echo "❌ Python 3.10+ 필요합니다"
  exit 1
}

# 가상환경 생성 (선택)
if [ ! -d "venv" ]; then
  echo ""
  echo "가상환경을 생성하시겠습니까? (권장)"
  read -p "y/n (기본값: y): " create_venv
  if [ "$create_venv" != "n" ]; then
    echo "가상환경 생성 중..."
    python -m venv venv
    echo "✓ 가상환경 생성 완료"

    # 가상환경 활성화
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
      source venv/Scripts/activate
    else
      source venv/bin/activate
    fi
  fi
fi

# 필요한 패키지 설치
echo ""
echo "Python 패키지 설치 중..."
pip install -r scripts/scraper/requirements.txt

# .env 파일 확인
echo ""
if [ ! -f ".env" ]; then
  echo ".env 파일이 없습니다."
  echo ".env.example을 복사합니다..."
  cp .env.example .env

  echo "❗ .env 파일을 수정하여 ANTHROPIC_API_KEY를 입력하세요"
else
  echo "✓ .env 파일 존재"
fi

echo ""
echo "=========================================="
echo "✅ 설정 완료!"
echo "=========================================="
echo ""
echo "다음 명령으로 스크래핑을 실행하세요:"
echo "  npm run scrape"
echo ""
echo "또는 직접 실행:"
echo "  python scripts/scraper/scraper.py"
echo ""
