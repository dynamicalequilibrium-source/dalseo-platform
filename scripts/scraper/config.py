"""
웹 스크래핑 설정
3개 정부 사이트에서 지원사업 정보 수집
"""

SCRAPE_SITES = [
    {
        "name": "기업마당 (정부 지원사업 통합)",
        "key": "bizinfo",
        "url": "https://www.bizinfo.go.kr/web/lay1/bbs/S1T121C128/ls.do?cate=&mult_itm_seq=",
        "selector": {
            "container": ".tbL",
            "title": "td:nth-child(2) > a",
            "organization": "td:nth-child(3)",
            "description": "td:nth-child(2) > .ellipsis",
            "deadline": "td:nth-child(4)",
            "link": "td:nth-child(2) > a",
        },
        "region": "중앙부처",
        "enterprise_types": ["사회적경제기업", "소셜벤처", "사회적기업"],
    },
    {
        "name": "한국사회적기업진흥원",
        "key": "socialenterprise",
        "url": "https://www.socialenterprise.or.kr/homepage/community/notice.do",
        "selector": {
            "container": "tr.tbCm",
            "title": "td.tit > a",
            "organization": "td:nth-child(2)",
            "description": "td.tit > a",
            "deadline": "td:nth-child(3)",
            "link": "td.tit > a",
        },
        "region": "중앙부처",
        "enterprise_types": ["사회적기업", "사회적경제기업"],
    },
    {
        "name": "대구시 달서구청",
        "key": "dalseo_gu",
        "url": "https://www.daegu.go.kr/index.do?menu_id=00000119",
        "selector": {
            "container": ".list-item",
            "title": ".txt-ellipsis",
            "organization": ".category",
            "description": ".list-txt",
            "deadline": ".date",
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
