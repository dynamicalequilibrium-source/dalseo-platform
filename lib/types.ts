// 기업 종류
export type EnterpriseType =
  | '사회적경제기업'
  | '사회적기업'
  | '마을기업'
  | '협동조합'
  | '소셜벤처'

// 지역
export type Region = '달서구' | '경상북도' | '중앙부처'

// 지원 사업
export interface Program {
  id: string
  title: string
  organization: string
  region: Region
  targetTypes: EnterpriseType[]
  description: string
  fundAmount: string | null
  deadline: string // YYYY-MM-DD
  url: string // 원본 공고 링크
  sourceWebsite: string // 어느 사이트에서 긁어왔는가
  createdAt: string // 언제 데이터베이스에 추가됐는가
  updatedAt: string
}

// 검증 상태
export type VerificationStatus = 'pending' | 'verified' | 'rejected'

// 직원용 검증 항목
export interface VerificationTask {
  id: string
  programId: string
  program: Program
  status: VerificationStatus
  extractedData: {
    title: string
    organization: string
    region: Region
    targetTypes: EnterpriseType[]
    description: string
    fundAmount: string | null
    deadline: string
  }
  sourceUrl: string
  notes: string | null
  verifiedBy: string | null
  verifiedAt: string | null
  createdAt: string
}

// 카톡 봇 메시지
export interface KakaoMessage {
  text: string
  buttons?: Array<{
    title: string
    value: string
  }>
}
