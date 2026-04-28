#!/usr/bin/env python3
"""
달서구 지원사업 카톡 봇
승인된 새 공모사업을 직원들에게 자동 알림
"""

import os
import sys
import logging
import sqlite3
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path

import requests
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class KakaoBotError(Exception):
    """카톡 봇 관련 에러"""
    pass


class KakaoBot:
    """카카오톡 봇 - 새 공모사업 알림"""

    def __init__(self):
        """초기화"""
        self.api_key = os.getenv('KAKAO_REST_API_KEY')
        self.user_id = os.getenv('KAKAO_USER_ID')

        if not self.api_key:
            logger.warning("KAKAO_REST_API_KEY 없음 - 시뮬레이션 모드")
        if not self.user_id:
            logger.warning("KAKAO_USER_ID 없음 - 시뮬레이션 모드")

        self.base_url = "https://kapi.kakao.com/v2/api/talk/memo/default/send"

    def send_message(self, message: str) -> bool:
        """
        카톡으로 메시지 전송

        Args:
            message: 전송할 메시지

        Returns:
            성공 여부
        """
        if not self.api_key:
            logger.info(f"[시뮬레이션] 카톡 메시지: {message[:100]}")
            return True

        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/x-www-form-urlencoded",
            }

            data = {
                "template_object": message,
            }

            response = requests.post(self.base_url, headers=headers, json=data, timeout=10)

            if response.status_code == 200:
                logger.info("✓ 카톡 메시지 전송 성공")
                return True
            else:
                logger.error(f"카톡 전송 실패: {response.status_code}")
                return False

        except Exception as e:
            logger.error(f"카톡 전송 중 오류: {str(e)}")
            return False

    def format_program_message(self, program: Dict[str, Any]) -> str:
        """
        프로그램 정보를 카톡 메시지로 포맷

        Args:
            program: 프로그램 정보

        Returns:
            포맷된 메시지
        """
        title = program.get('title', 'N/A')
        org = program.get('organization', 'N/A')
        region = program.get('region', 'N/A')
        fund = program.get('fund_amount', '미정')
        deadline = program.get('deadline', 'N/A')
        url = program.get('url', '')

        message = f"""
🎉 새 공모사업 승인됨

📌 {title}

📋 기본 정보
• 기관: {org}
• 지역: {region}
• 지원금: {fund}
• 마감일: {deadline}

🔗 상세 정보: {url}

✅ 검색 페이지에서 확인하세요
http://localhost:3000
"""
        return message.strip()

    def notify_new_programs(self, limit: int = 10) -> int:
        """
        최근 승인된 프로그램 알림

        Args:
            limit: 최대 알림 개수

        Returns:
            알림 보낸 개수
        """
        logger.info("새 공모사업 알림 확인 중...")

        try:
            db_path = Path(__file__).parent.parent.parent / "data" / "programs.db"
            conn = sqlite3.connect(str(db_path))
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            # 최근 승인된 프로그램 조회
            cursor.execute("""
                SELECT *
                FROM programs
                WHERE created_at >= datetime('now', '-1 day')
                AND source_website = '직원 검증'
                ORDER BY created_at DESC
                LIMIT ?
            """, (limit,))

            programs = cursor.fetchall()
            conn.close()

            if not programs:
                logger.info("새 프로그램 없음")
                return 0

            logger.info(f"{len(programs)}개 프로그램 알림 준비")

            sent_count = 0
            for program in programs:
                program_dict = dict(program)
                message = self.format_program_message(program_dict)

                if self.send_message(message):
                    sent_count += 1

            return sent_count

        except Exception as e:
            logger.error(f"알림 조회 중 오류: {str(e)}")
            return 0

    def subscribe_user(self, user_id: str, name: str, email: str) -> bool:
        """
        사용자 구독 등록

        Args:
            user_id: 사용자 ID (카톡 user_id)
            name: 사용자명
            email: 이메일

        Returns:
            성공 여부
        """
        try:
            db_path = Path(__file__).parent.parent.parent / "data" / "programs.db"
            conn = sqlite3.connect(str(db_path))
            cursor = conn.cursor()

            cursor.execute("""
                INSERT INTO kakao_subscribers (user_id, name, email, subscribed_at)
                VALUES (?, ?, ?, ?)
            """, (user_id, name, email, datetime.utcnow().isoformat()))

            conn.commit()
            conn.close()

            logger.info(f"✓ 사용자 구독 등록: {name} ({email})")
            return True

        except sqlite3.IntegrityError:
            logger.warning(f"이미 등록된 사용자: {user_id}")
            return False
        except Exception as e:
            logger.error(f"구독 등록 실패: {str(e)}")
            return False


def main():
    """메인 함수"""
    try:
        bot = KakaoBot()

        if len(sys.argv) > 1:
            if sys.argv[1] == "notify":
                # 새 프로그램 알림
                sent = bot.notify_new_programs()
                logger.info(f"{sent}개 프로그램 알림 완료")

            elif sys.argv[1] == "test":
                # 테스트 메시지
                test_program = {
                    'title': '[테스트] 2026년 사회적기업 지원사업',
                    'organization': '고용노동부',
                    'region': '중앙부처',
                    'fund_amount': '최대 5천만원',
                    'deadline': '2026-06-30',
                    'url': 'https://example.com/test-program',
                }
                message = bot.format_program_message(test_program)
                logger.info(f"테스트 메시지:\n{message}")
                bot.send_message(message)

        else:
            # 기본: 새 프로그램 알림
            sent = bot.notify_new_programs()
            logger.info(f"완료: {sent}개 프로그램 알림")

    except KeyboardInterrupt:
        logger.info("사용자에 의해 중단됨")
        sys.exit(0)
    except Exception as e:
        logger.error(f"예상치 못한 오류: {str(e)}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()
