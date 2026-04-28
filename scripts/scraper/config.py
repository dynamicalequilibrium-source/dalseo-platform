"""
웹 스크래핑 설정
3개 정부 사이트에서 지원사업 정보 수집
"""

SCRAPE_SITES = [
    {
        "name": "중소벤처기업부",
        "key": "smba",
        "url": "https://www.ks.go.kr/support",  # 예: 중소벤처기업부 지원사업 페이지
        "selector": {
            "container": ".program-item",      # 각 프로그램 컨테이너
            "title": ".program-title",
            "organization": ".org-name",
            "description": ".program-desc",
            "deadline": ".deadline",
            "link": "a",
        },
        "region": "중앙부처",
        "enterprise_types": ["소셜벤처", "사회적경제기업"],
    },
    {
        "name": "행정안전부",
        "key": "mois",
        "url": "https://www.mois.go.kr/frt/bbs/type010/commonSelectBoardList.do",  # 행정안전부 지원사업
        "selector": {
            "container": ".board-item",
            "title": ".board-title",
            "organization": ".org-info",
            "description": ".board-content",
            "deadline": ".deadline-date",
            "link": "a",
        },
        "region": "중앙부처",
        "enterprise_types": ["마을기업", "사회적경제기업"],
    },
    {
        "name": "달서구청",
        "key": "dalseo_gu",
        "url": "https://www.dalseo.daegu.kr/html/kor/contents/news/sub05_01_list.html",  # 달서구 지원사업
        "selector": {
            "container": ".list-item",
            "title": ".news-title",
            "organization": ".org-name",
            "description": ".list-desc",
            "deadline": ".deadline",
            "link": "a",
        },
        "region": "달서구",
        "enterprise_types": ["사회적경제기업"],
    },
]

# Claude API 설정
CLAUDE_MODEL = "claude-3-5-sonnet-20241022"

# 데이터베이스 경로
DB_PATH = "data/programs.db"

# 로깅 설정
LOG_LEVEL = "INFO"
