#!/usr/bin/env python3
"""
스크래퍼 테스트 (mock 데이터 사용)
실제 웹 스크래핑 전에 파이프라인을 검증합니다.
"""

import json
from typing import List, Dict, Any
from scraper import ProgramScraper


def get_mock_programs() -> List[Dict[str, Any]]:
    """
    Mock 프로그램 데이터 반환
    실제 스크래핑 대신 테스트용 데이터 사용
    """
    return [
        {
            'title': '2026년 사회적기업 인증 및 고용창출 지원사업',
            'organization': '고용노동부',
            'region': '중앙부처',
            'description': '고용취약계층의 일자리 창출을 위해 사회적기업을 육성하는 정부 지원사업',
            'deadline': '2026-06-30',
            'url': 'https://www.moel.go.kr/program/001',
            'source_website': '테스트 (고용노동부)',
            'site_key': 'test',
            'default_types': ['사회적기업', '사회적경제기업'],
        },
        {
            'title': '마을기업 공동마케팅 지원 프로그램',
            'organization': '행정안전부',
            'region': '경상북도',
            'description': '지역주민이 주도하는 마을기업의 판매 촉진과 마케팅을 지원합니다.',
            'deadline': '2026-05-31',
            'url': 'https://www.mois.go.kr/program/002',
            'source_website': '테스트 (행정안전부)',
            'site_key': 'test',
            'default_types': ['마을기업', '사회적경제기업'],
        },
        {
            'title': '달서구 청년사회적기업 창업 지원금',
            'organization': '달서구청',
            'region': '달서구',
            'description': '청년층의 사회적기업 창업을 장려하고 초기 운영을 지원하는 프로그램',
            'deadline': '2026-04-30',
            'url': 'https://www.dalseo.daegu.kr/program/003',
            'source_website': '테스트 (달서구청)',
            'site_key': 'test',
            'default_types': ['사회적경제기업'],
        },
    ]


def test_scraper_pipeline():
    """스크래퍼 파이프라인 테스트"""
    print("\n" + "=" * 60)
    print("🧪 스크래퍼 파이프라인 테스트")
    print("=" * 60)

    scraper = ProgramScraper()
    mock_programs = get_mock_programs()

    print(f"\n📋 Mock 프로그램 {len(mock_programs)}개 로드됨")

    # 1. 각 프로그램을 AI로 분류
    print("\n🤖 AI 분류 테스트 중...\n")
    classified_programs = []

    for idx, program in enumerate(mock_programs, 1):
        print(f"[{idx}/{len(mock_programs)}] {program.get('title')}")

        try:
            classified = scraper.classify_with_ai(program)
            classified_programs.append(classified)

            # 분류 결과 출력
            print(f"  ✓ 유효성: {classified.get('is_valid')}")
            print(f"  ✓ 신뢰도: {classified.get('confidence', 0):.2f}")
            print(f"  ✓ 기업 종류: {', '.join(classified.get('enterprise_types', []))}")
            print(f"  ✓ 마감일: {classified.get('deadline')}")
            print()

        except Exception as e:
            print(f"  ❌ 오류: {str(e)}\n")

    # 2. 분류 결과 요약
    print("=" * 60)
    print("📊 분류 결과 요약")
    print("=" * 60)

    valid_count = sum(1 for p in classified_programs if p.get('is_valid'))
    avg_confidence = sum(p.get('confidence', 0) for p in classified_programs) / len(classified_programs) if classified_programs else 0

    print(f"총 프로그램: {len(classified_programs)}개")
    print(f"유효한 프로그램: {valid_count}개")
    print(f"평균 신뢰도: {avg_confidence:.2f}")

    # 3. 데이터베이스 저장 테스트
    print("\n💾 데이터베이스 저장 테스트 중...")
    saved = scraper.save_to_database(classified_programs)
    print(f"✓ {saved}개 프로그램이 verification_tasks에 저장됨")

    print("\n" + "=" * 60)
    print("✅ 테스트 완료!")
    print("=" * 60)
    print("\n검증 대시보드 확인:")
    print("  http://localhost:3000/verification")
    print("\n실제 웹 스크래핑 실행:")
    print("  npm run scrape")
    print("=" * 60 + "\n")


if __name__ == '__main__':
    test_scraper_pipeline()
