import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

/**
 * 새 공모사업 승인 시 카톡 알림 발송
 * POST /api/kakao/notify
 *
 * 요청 본문:
 * {
 *   "program_id": "prog-xxx",
 *   "title": "2026년 사회적기업 지원사업",
 *   ...
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Python 스크립트로 카톡 알림 발송 (백그라운드)
    const scriptPath = path.join(process.cwd(), 'scripts', 'kakao_bot.py')

    // 비동기로 Python 스크립트 실행 (응답 대기 없음)
    spawn('python', [scriptPath, 'notify'], {
      detached: true,
      stdio: 'ignore',
    }).unref()

    return NextResponse.json({
      success: true,
      message: '카톡 알림이 발송됩니다.',
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알림 발송 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}

/**
 * 카톡 봇 상태 확인
 * GET /api/kakao/notify
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    status: 'ready',
    message: '카톡 봇이 준비되었습니다.',
    features: [
      '새 공모사업 자동 알림',
      '승인/거절 상태 업데이트',
      '마감일 임박 알림',
    ],
  })
}
