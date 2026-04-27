import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'
import type { Program, EnterpriseType, Region } from '@/lib/types'

const DB_PATH = path.join(process.cwd(), 'data', 'programs.db')

interface SearchParams {
  search?: string
  types?: string[]
  regions?: string[]
  limit?: number
  offset?: number
  sort?: 'deadline' | 'created' | 'title'
}

function getSearchParams(request: NextRequest): SearchParams {
  const searchParams = request.nextUrl.searchParams
  return {
    search: searchParams.get('search') || undefined,
    types: searchParams.getAll('types'),
    regions: searchParams.getAll('regions'),
    limit: parseInt(searchParams.get('limit') || '20'),
    offset: parseInt(searchParams.get('offset') || '0'),
    sort: (searchParams.get('sort') as any) || 'deadline',
  }
}

function buildQuery(params: SearchParams): {
  query: string
  bindings: any[]
} {
  let query = `
    SELECT DISTINCT
      p.id, p.title, p.organization, p.region, p.description,
      p.fund_amount, p.deadline, p.url, p.source_website,
      p.created_at, p.updated_at,
      GROUP_CONCAT(pet.enterprise_type, '|') as types
    FROM programs p
    LEFT JOIN program_enterprise_types pet ON p.id = pet.program_id
    WHERE 1=1
  `
  const bindings: any[] = []

  // 검색어
  if (params.search) {
    query += `
      AND (
        p.title LIKE ? OR
        p.organization LIKE ? OR
        p.description LIKE ?
      )
    `
    const searchTerm = `%${params.search}%`
    bindings.push(searchTerm, searchTerm, searchTerm)
  }

  // 기업 종류 필터
  if (params.types && params.types.length > 0) {
    const placeholders = params.types.map(() => '?').join(',')
    query += `AND pet.enterprise_type IN (${placeholders}) `
    bindings.push(...params.types)
  }

  // 지역 필터
  if (params.regions && params.regions.length > 0) {
    const placeholders = params.regions.map(() => '?').join(',')
    query += `AND p.region IN (${placeholders}) `
    bindings.push(...params.regions)
  }

  // 그룹화
  query += 'GROUP BY p.id '

  // 정렬
  switch (params.sort) {
    case 'deadline':
      query += 'ORDER BY p.deadline ASC, p.created_at DESC '
      break
    case 'created':
      query += 'ORDER BY p.created_at DESC '
      break
    case 'title':
      query += 'ORDER BY p.title ASC '
      break
  }

  // 페이지네이션
  query += 'LIMIT ? OFFSET ? '
  bindings.push(params.limit, params.offset)

  return { query, bindings }
}

export async function GET(request: NextRequest) {
  try {
    const params = getSearchParams(request)

    // 데이터베이스 연결
    const db = new Database(DB_PATH, { readonly: true })

    try {
      // 쿼리 구성
      const { query, bindings } = buildQuery(params)

      // 데이터 조회
      const stmt = db.prepare(query)
      const rows = stmt.all(...bindings) as any[]

      // 타입 변환
      const programs: Program[] = rows.map(row => ({
        id: row.id,
        title: row.title,
        organization: row.organization,
        region: row.region as Region,
        description: row.description,
        fundAmount: row.fund_amount,
        deadline: row.deadline,
        url: row.url,
        sourceWebsite: row.source_website,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        targetTypes: row.types
          ? row.types.split('|').filter(Boolean) as EnterpriseType[]
          : [],
      }))

      // 전체 개수 조회
      let countQuery = `
        SELECT COUNT(DISTINCT p.id) as total
        FROM programs p
        LEFT JOIN program_enterprise_types pet ON p.id = pet.program_id
        WHERE 1=1
      `
      let countBindings: any[] = []

      if (params.search) {
        countQuery += `
          AND (
            p.title LIKE ? OR
            p.organization LIKE ? OR
            p.description LIKE ?
          )
        `
        const searchTerm = `%${params.search}%`
        countBindings.push(searchTerm, searchTerm, searchTerm)
      }

      if (params.types && params.types.length > 0) {
        const placeholders = params.types.map(() => '?').join(',')
        countQuery += `AND pet.enterprise_type IN (${placeholders}) `
        countBindings.push(...params.types)
      }

      if (params.regions && params.regions.length > 0) {
        const placeholders = params.regions.map(() => '?').join(',')
        countQuery += `AND p.region IN (${placeholders}) `
        countBindings.push(...params.regions)
      }

      const countStmt = db.prepare(countQuery)
      const { total } = countStmt.get(...countBindings) as any

      return NextResponse.json({
        success: true,
        data: programs,
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
        error: error instanceof Error ? error.message : '검색 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}
