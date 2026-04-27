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
  const existingTasks = db.prepare('SELECT COUNT(*) as count FROM verification_tasks').get() as any

  if (existingPrograms.count === 0 || existingTasks.count === 0) {
    console.log('\n📝 Inserting sample data...')

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

  // 검증 작업 샘플 데이터
  const existingVerificationTasks = db.prepare('SELECT COUNT(*) as count FROM verification_tasks').get() as any
  if ((existingVerificationTasks as any).count === 0) {
    console.log('\n📝 Inserting sample verification tasks...')

    // 검증용 programs 먼저 삽입
    const pendingPrograms = [
      {
        id: 'prog-pending-001',
        title: '(검증 대기) 2026년 소셜벤처 지원사업',
        organization: '중소벤처기업부',
        region: '중앙부처',
        description: '혁신적 아이디어로 사회문제를 해결하는 창업기업 지원',
        fund_amount: '최대 1억원',
        deadline: '2026-07-31',
        url: 'https://example.com/sv-program',
        source_website: '스크래핑 (검증 대기)',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'prog-pending-002',
        title: '(검증 대기) 경북 협동조합 경영지원사업',
        organization: '경상북도',
        region: '경상북도',
        description: '협동조합의 경영 역량 강화 및 네트워킹 지원',
        fund_amount: '최대 5천만원',
        deadline: '2026-06-15',
        url: 'https://example.com/coop-program',
        source_website: '스크래핑 (검증 대기)',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'prog-pending-003',
        title: '(검증 대기) 달서구 청년 사회적기업 창업 지원',
        organization: '달서구청',
        region: '달서구',
        description: '청년 창업자의 사회적기업 설립 및 초기 운영 지원',
        fund_amount: '최대 2천만원',
        deadline: '2026-05-15',
        url: 'https://example.com/youth-program',
        source_website: '스크래핑 (검증 대기)',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]

    const insertProgramForVerification = db.prepare(`
      INSERT OR IGNORE INTO programs (
        id, title, organization, region, description,
        fund_amount, deadline, url, source_website, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    pendingPrograms.forEach(prog => {
      insertProgramForVerification.run(
        prog.id, prog.title, prog.organization, prog.region, prog.description,
        prog.fund_amount, prog.deadline, prog.url, prog.source_website,
        prog.created_at, prog.updated_at
      )
    })

    const verificationTasks = [
      {
        id: 'vt-001',
        program_id: 'prog-pending-001',
        status: 'pending',
        extracted_title: '2026년 소셜벤처 지원사업',
        extracted_organization: '중소벤처기업부',
        extracted_region: '중앙부처',
        extracted_description: '혁신적 아이디어로 사회문제를 해결하는 창업기업 지원',
        extracted_fund_amount: '최대 1억원',
        extracted_deadline: '2026-07-31',
        source_url: 'https://example.com/sv-program',
        created_at: new Date().toISOString(),
      },
      {
        id: 'vt-002',
        program_id: 'prog-pending-002',
        status: 'pending',
        extracted_title: '경북 협동조합 경영지원사업',
        extracted_organization: '경상북도',
        extracted_region: '경상북도',
        extracted_description: '협동조합의 경영 역량 강화 및 네트워킹 지원',
        extracted_fund_amount: '최대 5천만원',
        extracted_deadline: '2026-06-15',
        source_url: 'https://example.com/coop-program',
        created_at: new Date().toISOString(),
      },
      {
        id: 'vt-003',
        program_id: 'prog-pending-003',
        status: 'pending',
        extracted_title: '달서구 청년 사회적기업 창업 지원',
        extracted_organization: '달서구청',
        extracted_region: '달서구',
        extracted_description: '청년 창업자의 사회적기업 설립 및 초기 운영 지원',
        extracted_fund_amount: '최대 2천만원',
        extracted_deadline: '2026-05-15',
        source_url: 'https://example.com/youth-program',
        created_at: new Date().toISOString(),
      },
    ]

    const insertVerificationTask = db.prepare(`
      INSERT INTO verification_tasks (
        id, program_id, status, extracted_title, extracted_organization,
        extracted_region, extracted_description, extracted_fund_amount,
        extracted_deadline, source_url, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    verificationTasks.forEach(task => {
      insertVerificationTask.run(
        task.id, task.program_id, task.status, task.extracted_title,
        task.extracted_organization, task.extracted_region,
        task.extracted_description, task.extracted_fund_amount,
        task.extracted_deadline, task.source_url, task.created_at
      )
    })

    console.log(`✓ Inserted ${verificationTasks.length} sample verification tasks`)
  }

  db.close()
  console.log('\n✅ Database initialization complete!')
}

// CLI에서 직접 실행 가능하도록
if (require.main === module) {
  initializeDatabase()
}

export default initializeDatabase
