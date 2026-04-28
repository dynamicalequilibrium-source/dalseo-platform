#!/usr/bin/env python3
"""
달서구 지원사업 웹 스크래핑 파일럿
3개 정부 사이트에서 지원사업 정보 수집 및 AI 자동 분류
"""

import os
import sys
import json
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
import uuid
import time
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from anthropic import Anthropic
import sqlite3

# .env.local 파일 로드
env_path = Path(__file__).parent.parent.parent / '.env.local'
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                os.environ[key] = value

# 설정 임포트
from config import SCRAPE_SITES, CLAUDE_MODEL, DB_PATH, LOG_LEVEL

# 로깅 설정
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 재시도 설정
MAX_RETRIES = 3
RETRY_DELAY = 2  # 초


class ScraperError(Exception):
    """스크래핑 관련 에러"""
    pass


class ProgramScraper:
    """지원사업 웹 스크래핑 및 AI 분류"""

    def __init__(self):
        """초기화"""
        self.client = Anthropic()
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })

    def scrape_site(self, site_config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        개별 사이트 스크래핑 (재시도 로직 포함)

        Args:
            site_config: 사이트 설정 정보

        Returns:
            추출된 프로그램 정보 리스트
        """
        logger.info(f"🔄 스크래핑 시작: {site_config['name']}")

        for attempt in range(MAX_RETRIES):
            try:
                response = self.session.get(
                    site_config['url'],
                    timeout=15,
                    allow_redirects=True
                )
                response.raise_for_status()
                response.encoding = 'utf-8'

                soup = BeautifulSoup(response.content, 'html.parser')

                # 컨테이너 선택자로 각 프로그램 찾기
                containers = soup.select(site_config['selector'].get('container', '.program-item'))

                if not containers:
                    logger.warning(f"{site_config['name']}: 프로그램을 찾을 수 없습니다 (선택자: {site_config['selector']['container']})")
                    containers = soup.find_all('a', limit=10)

                programs = []
                for idx, container in enumerate(containers[:20]):  # 최대 20개 처리
                    try:
                        program = self._extract_program_info(container, site_config)
                        if program:
                            programs.append(program)
                    except Exception as e:
                        logger.debug(f"{site_config['name']} - 항목 {idx} 추출 실패: {str(e)}")

                logger.info(f"✅ {site_config['name']}: {len(programs)}개 프로그램 추출됨")
                return programs

            except requests.Timeout:
                logger.warning(f"⏱️  {site_config['name']} - 타임아웃 ({attempt+1}/{MAX_RETRIES})")
                if attempt < MAX_RETRIES - 1:
                    time.sleep(RETRY_DELAY * (attempt + 1))
                    continue
                return []

            except requests.RequestException as e:
                logger.warning(f"🔗 {site_config['name']} - 요청 실패: {str(e)} ({attempt+1}/{MAX_RETRIES})")
                if attempt < MAX_RETRIES - 1:
                    time.sleep(RETRY_DELAY * (attempt + 1))
                    continue
                return []

            except Exception as e:
                logger.error(f"❌ {site_config['name']} - 스크래핑 실패: {str(e)}")
                return []

        return []

    def _extract_program_info(self, container, site_config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        HTML 엘리먼트에서 프로그램 정보 추출 (강화된 검증)

        Args:
            container: BeautifulSoup 엘리먼트
            site_config: 사이트 설정

        Returns:
            추출된 프로그램 정보 또는 None
        """
        selectors = site_config['selector']

        # 제목 추출 및 검증
        title_elem = container.select_one(selectors.get('title', 'h3'))
        if not title_elem:
            title_elem = container
        title = (title_elem.get_text(strip=True) if title_elem else '').strip()

        # 제목 필터링: 너무 짧거나 공지사항 메타 정보는 제외
        if not title or len(title) < 5:
            return None

        # 불용어 제거
        if any(word in title.lower() for word in ['공지', '새소식', '최신소식', '알림', '안내']):
            if len(title) < 20:  # 짧고 공지성 제목은 건너뜀
                return None

        # 링크 추출
        link_elem = container.find('a')
        if not link_elem:
            link_elem = container.select_one(selectors.get('link', 'a'))

        url = ''
        if link_elem and link_elem.get('href'):
            url = link_elem['href'].strip()
            # URL 정규화
            if url and not url.startswith('http'):
                url = urljoin(site_config['url'], url)
            # 유효한 URL만 유지
            if not url.startswith('http'):
                url = ''

        # 설명 추출
        desc_elem = container.select_one(selectors.get('description', '.desc'))
        description = (desc_elem.get_text(strip=True) if desc_elem else '').strip()
        description = description[:500] if description else None  # 최대 500자

        # 마감일 추출 및 정규화
        deadline_elem = container.select_one(selectors.get('deadline', '.deadline'))
        deadline = (deadline_elem.get_text(strip=True) if deadline_elem else '').strip()

        # 기관명 추출
        org_elem = container.select_one(selectors.get('organization', '.org'))
        organization = (org_elem.get_text(strip=True) if org_elem else site_config['name']).strip()

        # 데이터 검증: 최소 필수 정보 확인
        if not title or not organization:
            return None

        return {
            'title': title,
            'organization': organization,
            'region': site_config['region'],
            'description': description,
            'deadline': deadline,
            'url': url,
            'source_website': f"스크래핑 ({site_config['name']})",
            'site_key': site_config['key'],
            'default_types': site_config.get('enterprise_types', []),
        }

    def classify_with_ai(self, program: Dict[str, Any]) -> Dict[str, Any]:
        """
        Claude API를 사용하여 프로그램 정보 검증 및 분류

        Args:
            program: 추출된 프로그램 정보

        Returns:
            AI 분류 결과가 추가된 프로그램 정보
        """
        prompt = f"""
당신은 한국의 사회적경제 지원사업 분류 전문가입니다.
다음 웹사이트에서 추출한 지원사업 정보를 검토하고 분류해주세요.

웹사이트: {program.get('source_website', 'Unknown')}
제목: {program.get('title', 'N/A')}
기관: {program.get('organization', 'N/A')}
지역: {program.get('region', 'N/A')}
설명: {program.get('description', 'N/A')}
마감일: {program.get('deadline', 'N/A')}

다음을 JSON 형식으로 반환하세요:
{{
  "is_valid": true/false,  // 유효한 사회적경제 지원사업인지
  "confidence": 0.0-1.0,    // 확신도 (0: 낮음, 1: 높음)
  "title_corrected": "제목 (필요시 수정)",
  "deadline_standardized": "YYYY-MM-DD 형식",
  "fund_amount": "지원금액 또는 null",
  "enterprise_types": ["사회적경제기업", "사회적기업", "마을기업", "협동조합", "소셜벤처"],  // 해당하는 타입만 선택
  "reason": "분류 이유 (50자 이내)"
}}

반드시 유효한 JSON만 반환하세요. 설명 없이 JSON 객체만.
"""

        try:
            response = self.client.messages.create(
                model=CLAUDE_MODEL,
                max_tokens=500,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            response_text = response.content[0].text.strip()

            # JSON 파싱
            classification = json.loads(response_text)

            # 결과 병합
            return {
                **program,
                'is_valid': classification.get('is_valid', True),
                'confidence': classification.get('confidence', 0.5),
                'title': classification.get('title_corrected', program.get('title')),
                'deadline': classification.get('deadline_standardized', program.get('deadline')),
                'fund_amount': classification.get('fund_amount'),
                'enterprise_types': classification.get('enterprise_types', program.get('default_types', [])),
            }

        except json.JSONDecodeError as e:
            logger.warning(f"AI 응답 JSON 파싱 실패: {str(e)}")
            return {
                **program,
                'is_valid': True,
                'confidence': 0.3,
                'enterprise_types': program.get('default_types', []),
            }
        except Exception as e:
            logger.error(f"AI 분류 중 오류: {str(e)}")
            return {
                **program,
                'is_valid': True,
                'confidence': 0.0,
                'enterprise_types': program.get('default_types', []),
            }

    def _is_duplicate(self, conn: sqlite3.Connection, program: Dict[str, Any]) -> bool:
        """
        중복 프로그램 확인 (제목 + 기관 + 마감일로 판단)

        Args:
            conn: SQLite 연결
            program: 프로그램 정보

        Returns:
            중복 여부
        """
        cursor = conn.cursor()
        cursor.execute("""
            SELECT COUNT(*) FROM verification_tasks
            WHERE extracted_title = ?
            AND extracted_organization = ?
            AND extracted_deadline = ?
        """, (
            program.get('title'),
            program.get('organization'),
            program.get('deadline')
        ))
        return cursor.fetchone()[0] > 0

    def save_to_database(self, programs: List[Dict[str, Any]]) -> int:
        """
        분류된 프로그램을 verification_tasks 테이블에 저장 (중복 제거)

        Args:
            programs: 처리된 프로그램 리스트

        Returns:
            저장된 프로그램 수
        """
        logger.info(f"💾 데이터베이스에 {len(programs)}개 프로그램 저장 중...")

        try:
            db_path = Path(__file__).parent.parent.parent / DB_PATH
            conn = sqlite3.connect(str(db_path))
            cursor = conn.cursor()

            saved_count = 0
            skipped_count = 0

            for idx, program in enumerate(programs, 1):
                if not program.get('is_valid'):
                    logger.debug(f"⏭️  [{idx}/{len(programs)}] 유효하지 않음: {program.get('title')}")
                    skipped_count += 1
                    continue

                try:
                    # 중복 확인
                    if self._is_duplicate(conn, program):
                        logger.debug(f"🔄 [{idx}/{len(programs)}] 중복: {program.get('title')}")
                        skipped_count += 1
                        continue

                    # 프로그램 ID 생성
                    program_id = f"prog-scraped-{uuid.uuid4().hex[:12]}"
                    task_id = f"vt-scraped-{uuid.uuid4().hex[:12]}"

                    # verification_tasks에 삽입
                    cursor.execute("""
                        INSERT INTO verification_tasks (
                            id, program_id, status,
                            extracted_title, extracted_organization, extracted_region,
                            extracted_description, extracted_fund_amount, extracted_deadline,
                            source_url, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        task_id,
                        program_id,
                        'pending',
                        program.get('title'),
                        program.get('organization'),
                        program.get('region'),
                        program.get('description'),
                        program.get('fund_amount'),
                        program.get('deadline'),
                        program.get('url'),
                        datetime.utcnow().isoformat() + 'Z',
                    ))

                    saved_count += 1
                    confidence = program.get('confidence', 0)
                    logger.info(f"✅ [{idx}/{len(programs)}] 저장: {program.get('title')} (신뢰도: {confidence:.1%})")

                except sqlite3.IntegrityError as e:
                    logger.debug(f"⚠️  [{idx}/{len(programs)}] 제약 조건 위반: {str(e)}")
                    skipped_count += 1
                except Exception as e:
                    logger.error(f"❌ [{idx}/{len(programs)}] 저장 실패: {str(e)}")

            conn.commit()
            conn.close()

            logger.info("=" * 60)
            logger.info(f"✅ 저장: {saved_count}개 | ⏭️  건너뜀: {skipped_count}개")
            logger.info("=" * 60)
            return saved_count

        except Exception as e:
            logger.error(f"❌ 데이터베이스 저장 중 오류: {str(e)}")
            return 0

    def run(self):
        """전체 스크래핑 파이프라인 실행 (개선된 버전)"""
        logger.info("=" * 60)
        logger.info("🚀 달서구 지원사업 스크래핑 파이프라인 시작")
        logger.info(f"⏰ 시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 60)

        start_time = time.time()
        all_programs = []

        # 1️⃣  다중 사이트에서 스크래핑
        logger.info(f"\n📡 Phase 1: {len(SCRAPE_SITES)}개 사이트에서 스크래핑 시작")
        for idx, site_config in enumerate(SCRAPE_SITES, 1):
            logger.info(f"[{idx}/{len(SCRAPE_SITES)}] {site_config['name']}")
            programs = self.scrape_site(site_config)
            all_programs.extend(programs)
            time.sleep(1)  # 사이트 부하 방지

        logger.info(f"\n📊 Phase 1 결과: 총 {len(all_programs)}개 프로그램 추출됨")

        if not all_programs:
            logger.warning("⚠️  추출된 프로그램이 없습니다.")
            return

        # 2️⃣  AI로 각 프로그램 분류 및 검증
        logger.info(f"\n🤖 Phase 2: AI 분류 시작 ({len(all_programs)}개 항목)")
        classified_programs = []

        for idx, program in enumerate(all_programs, 1):
            logger.info(f"[{idx}/{len(all_programs)}] 분류 중: {program.get('title', 'Unknown')[:50]}")
            classified = self.classify_with_ai(program)
            classified_programs.append(classified)
            time.sleep(0.5)  # API 요청 분산

        # 3️⃣  데이터베이스에 저장
        logger.info(f"\n💾 Phase 3: 데이터베이스 저장 시작")
        saved = self.save_to_database(classified_programs)

        # 완료 보고
        elapsed = time.time() - start_time
        logger.info("\n" + "=" * 60)
        logger.info(f"✅ 스크래핑 완료!")
        logger.info(f"📈 결과: {saved}개 프로그램 저장됨")
        logger.info(f"⏱️  소요 시간: {elapsed:.1f}초")
        logger.info(f"🔗 검증 대시보드: http://localhost:3000/verification")
        logger.info("=" * 60 + "\n")


def main():
    """메인 함수"""
    try:
        scraper = ProgramScraper()
        scraper.run()
    except KeyboardInterrupt:
        logger.info("사용자에 의해 중단됨")
        sys.exit(0)
    except Exception as e:
        logger.error(f"예상치 못한 오류: {str(e)}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()
