import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'
import type { VerificationStatus, EnterpriseType, Region } from '@/lib/types'

const DB_PATH = path.join(process.cwd(), 'data', 'programs.db')

interface VerifyRequest {
  status: VerificationStatus
  verifiedBy?: string
  notes?: string
  enterpriseTypes?: EnterpriseType[]
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id
    const body: VerifyRequest = await request.json()

    if (!body.status || !['pending', 'verified', 'rejected'].includes(body.status)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 상태입니다.' },
        { status: 400 }
      )
    }

    const db = new Database(DB_PATH)

    try {
      const transaction = db.transaction(() => {
        // 1. 검증 작업 조회
        const getTask = db.prepare('SELECT * FROM verification_tasks WHERE id = ?')
        const task = getTask.get(taskId) as any

        if (!task) {
          throw new Error('검증 작업을 찾을 수 없습니다.')
        }

        // 2. 검증 작업 상태 업데이트
        const updateTask = db.prepare(`
          UPDATE verification_tasks
          SET status = ?, verified_by = ?, notes = ?, verified_at = ?
          WHERE id = ?
        `)

        const now = new Date().toISOString()
        updateTask.run(
          body.status,
          body.verifiedBy || null,
          body.notes || null,
          body.status === 'verified' ? now : null,
          taskId
        )

        // 3. 승인 시 programs 테이블에 데이터 삽입
        if (body.status === 'verified') {
          const insertProgram = db.prepare(`
            INSERT OR REPLACE INTO programs (
              id, title, organization, region, description,
              fund_amount, deadline, url, source_website, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)

          insertProgram.run(
            task.program_id,
            task.extracted_title,
            task.extracted_organization,
            task.extracted_region,
            task.extracted_description,
            task.extracted_fund_amount,
            task.extracted_deadline,
            task.source_url,
            '직원 검증', // 출처 마킹
            now,
            now
          )

          // 4. 기업 종류 매핑 (제공된 경우)
          if (body.enterpriseTypes && body.enterpriseTypes.length > 0) {
            const deleteTypes = db.prepare(
              'DELETE FROM program_enterprise_types WHERE program_id = ?'
            )
            deleteTypes.run(task.program_id)

            const insertType = db.prepare(`
              INSERT INTO program_enterprise_types (program_id, enterprise_type)
              VALUES (?, ?)
            `)

            body.enterpriseTypes.forEach(type => {
              insertType.run(task.program_id, type)
            })
          }
        }
      })

      transaction()

      return NextResponse.json({
        success: true,
        message:
          body.status === 'verified'
            ? '검증 완료되었습니다.'
            : '거절되었습니다.',
      })
    } finally {
      db.close()
    }
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}
