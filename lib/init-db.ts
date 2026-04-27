import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { SCHEMA_STATEMENTS, ENTERPRISE_TYPE_DEFINITIONS } from './db'

const DATA_DIR = path.join(process.cwd(), 'data')
const DB_PATH = path.join(DATA_DIR, 'programs.db')

export function initializeDatabase() {
  // data 폴더 생성
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    console.log(`✓ Created ${DATA_DIR}`)
  }

  // 데이터베이스 열기 (없으면 생성)
  const db = new Database(DB_PATH)
  console.log(`✓ Database file: ${DB_PATH}`)

  // 스키마 실행 (각 문을 개별적으로 실행)
  try {
    for (const statement of SCHEMA_STATEMENTS) {
      db.exec(statement)
    }
    console.log('✓ Database tables created')
  } catch (error) {
    if ((error as any).message.includes('already exists')) {
      console.log('✓ Database tables already exist')
    } else {
      throw error
    }
  }

  // 기업 분류 기본 데이터 확인 (로깅용)
  console.log('✓ Enterprise types defined:')
  Object.entries(ENTERPRISE_TYPE_DEFINITIONS).forEach(([key, value]) => {
    console.log(`  - ${key}: ${value.description}`)
  })

  // 더미 데이터 삽입 (테스트용)
  const existingPrograms = db.prepare('SELECT COUNT(*) as count FROM programs').get() as any
  if (existingPrograms.count === 0) {
    console.log('\n📝 Inserting sample programs...')

    const programs = [
      {
        id: 'prog-001',
        title: '2026년 사회적기업 고용창출 지원사업',
        organization: '고용노동부',
        region: '중앙부처',
        description: '고용취약계층의 일자리 창출을 위한 지원사업',
        fund_amount: '최대 5천만원',
        deadline: '2026-06-30',
        url: 'https://example.com/prog-001',
        source_website: '고용노동부',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'prog-002',
        title: '2026년 마을기업 공모사업',
        organization: '행정안전부',
        region: '경상북도',
        description: '지역주민 주도의 마을기업 육성',
        fund_amount: '최대 1억원',
        deadline: '2026-05-31',
        url: 'https://example.com/prog-002',
        source_website: '행정안전부',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'prog-003',
        title: '달서구 사회적경제 기업 경영지원사업',
        organization: '달서구청',
        region: '달서구',
        description: '달서구 지역 사회적경제 기업의 경영 지원',
        fund_amount: '최대 3천만원',
        deadline: '2026-04-30',
        url: 'https://example.com/prog-003',
        source_website: '달서구청',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]

    const insertProgram = db.prepare(`
      INSERT INTO programs (
        id, title, organization, region, description,
        fund_amount, deadline, url, source_website, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const insertType = db.prepare(`
      INSERT INTO program_enterprise_types (program_id, enterprise_type)
      VALUES (?, ?)
    `)

    const transaction = db.transaction((programs: any[]) => {
      programs.forEach(prog => {
        insertProgram.run(
          prog.id, prog.title, prog.organization, prog.region, prog.description,
          prog.fund_amount, prog.deadline, prog.url, prog.source_website,
          prog.created_at, prog.updated_at
        )
      })
    })

    transaction(programs)
    console.log(`✓ Inserted ${programs.length} sample programs`)

    // 기업 종류 매핑
    const mappings = [
      { progId: 'prog-001', types: ['사회적경제기업', '사회적기업'] },
      { progId: 'prog-002', types: ['사회적경제기업', '마을기업'] },
      { progId: 'prog-003', types: ['사회적경제기업'] },
    ]

    mappings.forEach(mapping => {
      mapping.types.forEach(type => {
        insertType.run(mapping.progId, type)
      })
    })
    console.log(`✓ Mapped enterprise types`)
  }

  db.close()
  console.log('\n✅ Database initialization complete!')
}

// CLI에서 직접 실행 가능하도록
if (require.main === module) {
  initializeDatabase()
}

export default initializeDatabase
