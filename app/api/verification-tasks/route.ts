import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'
import type { VerificationStatus } from '@/lib/types'

const DB_PATH = path.join(process.cwd(), 'data', 'programs.db')

interface VerificationTask {
  id: string
  programId: string
  status: VerificationStatus
  extractedTitle: string
  extractedOrganization: string
  extractedRegion: string
  extractedDescription: string | null
  extractedFundAmount: string | null
  extractedDeadline: string
  sourceUrl: string
  notes: string | null
  verifiedBy: string | null
  verifiedAt: string | null
  createdAt: string
}

interface ListParams {
  status?: VerificationStatus
  limit?: number
  offset?: number
}

function getListParams(request: NextRequest): ListParams {
  const searchParams = request.nextUrl.searchParams
  return {
    status: (searchParams.get('status') as VerificationStatus) || undefined,
    limit: parseInt(searchParams.get('limit') || '20'),
    offset: parseInt(searchParams.get('offset') || '0'),
  }
}

export async function GET(request: NextRequest) {
  try {
    const params = getListParams(request)

    const db = new Database(DB_PATH, { readonly: true })

    try {
      let query = `
        SELECT *
        FROM verification_tasks
        WHERE 1=1
      `
      const bindings: any[] = []

      if (params.status) {
        query += ' AND status = ? '
        bindings.push(params.status)
      }

      query += ' ORDER BY created_at DESC '
      query += ' LIMIT ? OFFSET ? '
      bindings.push(params.limit, params.offset)

      const stmt = db.prepare(query)
      const tasks = stmt.all(...bindings) as any[]

      // 전체 개수
      let countQuery = 'SELECT COUNT(*) as total FROM verification_tasks WHERE 1=1 '
      const countBindings: any[] = []

      if (params.status) {
        countQuery += ' AND status = ? '
        countBindings.push(params.status)
      }

      const countStmt = db.prepare(countQuery)
      const { total } = countStmt.get(...countBindings) as any

      const results: VerificationTask[] = tasks.map(task => ({
        id: task.id,
        programId: task.program_id,
        status: task.status,
        extractedTitle: task.extracted_title,
        extractedOrganization: task.extracted_organization,
        extractedRegion: task.extracted_region,
        extractedDescription: task.extracted_description,
        extractedFundAmount: task.extracted_fund_amount,
        extractedDeadline: task.extracted_deadline,
        sourceUrl: task.source_url,
        notes: task.notes,
        verifiedBy: task.verified_by,
        verifiedAt: task.verified_at,
        createdAt: task.created_at,
      }))

      return NextResponse.json({
        success: true,
        data: results,
        pagination: {
          total,
          limit: params.limit,
          offset: params.offset,
          page: Math.floor(params.offset / params.limit) + 1,
          totalPages: Math.ceil(total / params.limit),
        },
      })
    } finally {
      db.close()
    }
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '조회 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}
