'use client'

import { useState, useEffect } from 'react'
import type { VerificationStatus, EnterpriseType } from '@/lib/types'

const ENTERPRISE_TYPES: EnterpriseType[] = [
  '사회적경제기업',
  '사회적기업',
  '마을기업',
  '협동조합',
  '소셜벤처',
]

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

interface ListResponse {
  success: boolean
  data: VerificationTask[]
  pagination: {
    total: number
    page: number
    totalPages: number
  }
}

export default function VerificationPage() {
  const [tasks, setTasks] = useState<VerificationTask[]>([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<VerificationStatus>('pending')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedTypes, setSelectedTypes] = useState<Record<string, EnterpriseType[]>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})

  useEffect(() => {
    loadTasks()
  }, [status, page])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/verification-tasks?status=${status}&limit=10&offset=${(page - 1) * 10}`
      )
      const data: ListResponse = await response.json()
      if (data.success) {
        setTasks(data.data)
        setTotalPages(data.pagination.totalPages)
        // 각 작업별로 선택된 타입 초기화
        const typeMap: Record<string, EnterpriseType[]> = {}
        data.data.forEach(task => {
          typeMap[task.id] = ['사회적경제기업']
        })
        setSelectedTypes(typeMap)
      }
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (
    taskId: string,
    verifyStatus: VerificationStatus,
    verifiedBy: string = '센터 직원'
  ) => {
    setProcessingId(taskId)
    try {
      const response = await fetch(`/api/verification-tasks/${taskId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: verifyStatus,
          verifiedBy,
          notes: notes[taskId] || null,
          enterpriseTypes: verifyStatus === 'verified' ? selectedTypes[taskId] : undefined,
        }),
      })

      const data = await response.json()
      if (data.success) {
        alert(data.message)
        await loadTasks()
        setExpandedId(null)
        setNotes(prev => ({ ...prev, [taskId]: '' }))
      } else {
        alert('오류: ' + data.error)
      }
    } catch (error) {
      console.error('Failed to verify:', error)
      alert('처리 중 오류가 발생했습니다.')
    } finally {
      setProcessingId(null)
    }
  }

  const toggleType = (taskId: string, type: EnterpriseType) => {
    setSelectedTypes(prev => {
      const current = prev[taskId] || []
      if (current.includes(type)) {
        return {
          ...prev,
          [taskId]: current.filter(t => t !== type),
        }
      } else {
        return {
          ...prev,
          [taskId]: [...current, type],
        }
      }
    })
  }

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-6">검증 대시보드</h1>
      <p className="text-gray-600 mb-6">
        AI가 추출한 지원사업 정보를 검증하고 승인합니다.
      </p>

      {/* 상태 탭 */}
      <div className="mb-6 flex gap-2">
        {(['pending', 'verified', 'rejected'] as const).map(s => (
          <button
            key={s}
            onClick={() => {
              setStatus(s)
              setPage(1)
            }}
            className={`px-4 py-2 rounded ${
              status === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {s === 'pending' && '검증 대기'}
            {s === 'verified' && '승인됨'}
            {s === 'rejected' && '거절됨'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">검색 중...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {status === 'pending' ? '검증 대기 중인 항목이 없습니다.' : '항목이 없습니다.'}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {tasks.map(task => (
              <div
                key={task.id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* 요약 행 */}
                <button
                  onClick={() =>
                    setExpandedId(expandedId === task.id ? null : task.id)
                  }
                  className="w-full p-4 bg-gray-50 hover:bg-gray-100 flex justify-between items-center"
                >
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold">{task.extractedTitle}</h3>
                    <p className="text-sm text-gray-600">
                      {task.extractedOrganization} · {task.extractedRegion}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                      {status === 'pending' && '대기 중'}
                      {status === 'verified' && '✓ 승인'}
                      {status === 'rejected' && '✗ 거절'}
                    </span>
                  </div>
                </button>

                {/* 상세 정보 */}
                {expandedId === task.id && (
                  <div className="p-4 border-t border-gray-200 bg-white space-y-4">
                    {/* 추출된 정보 */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold mb-3 text-blue-900">AI 추출 정보</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-semibold text-gray-700">제목:</span>{' '}
                          {task.extractedTitle}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">기관:</span>{' '}
                          {task.extractedOrganization}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">지역:</span>{' '}
                          {task.extractedRegion}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">설명:</span>{' '}
                          {task.extractedDescription || '(없음)'}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">지원금:</span>{' '}
                          {task.extractedFundAmount || '(미정)'}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">마감일:</span>{' '}
                          {task.extractedDeadline}
                        </div>
                      </div>
                    </div>

                    {/* 원본 링크 (직원이 클릭해서 확인) */}
                    <div>
                      <a
                        href={task.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        🔗 원본 공고 링크에서 확인
                      </a>
                    </div>

                    {/* 기업 종류 선택 (승인 시에만) */}
                    {status === 'pending' && (
                      <div>
                        <label className="font-semibold text-sm mb-2 block">
                          기업 종류 선택:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {ENTERPRISE_TYPES.map(type => (
                            <label key={type} className="flex items-center text-sm">
                              <input
                                type="checkbox"
                                checked={
                                  selectedTypes[task.id]?.includes(type) || false
                                }
                                onChange={() => toggleType(task.id, type)}
                                className="mr-2"
                              />
                              {type}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 메모 */}
                    <div>
                      <label className="font-semibold text-sm mb-2 block">메모:</label>
                      <textarea
                        value={notes[task.id] || ''}
                        onChange={e =>
                          setNotes(prev => ({ ...prev, [task.id]: e.target.value }))
                        }
                        placeholder="검증 결과나 수정 사항을 메모해주세요."
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                        rows={3}
                      />
                    </div>

                    {/* 액션 버튼 */}
                    {status === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleVerify(task.id, 'verified')}
                          disabled={processingId === task.id}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                        >
                          {processingId === task.id ? '처리 중...' : '✓ 승인'}
                        </button>
                        <button
                          onClick={() => handleVerify(task.id, 'rejected')}
                          disabled={processingId === task.id}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
                        >
                          {processingId === task.id ? '처리 중...' : '✗ 거절'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded ${
                    page === p
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* 안내 */}
      <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-sm text-yellow-800">
          💡 <strong>검증 방법:</strong> 각 항목을 클릭하여 AI가 추출한 정보를 확인하고,
          원본 공고 링크에서 검증한 후 승인/거절 버튼을 클릭하세요.
          기업 종류를 선택하여 승인하면 검색 페이지에 즉시 나타납니다.
        </p>
      </div>
    </div>
  )
}
