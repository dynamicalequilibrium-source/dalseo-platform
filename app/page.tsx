'use client'

import { useState, useEffect } from 'react'
import type { Program } from '@/lib/types'

const ENTERPRISE_TYPES = [
  '사회적경제기업',
  '사회적기업',
  '마을기업',
  '협동조합',
  '소셜벤처',
]

const REGIONS = [
  '달서구',
  '경상북도',
  '중앙부처',
]

interface SearchResult {
  success: boolean
  data: Program[]
  pagination: {
    total: number
    limit: number
    offset: number
    page: number
    totalPages: number
  }
}

export default function Home() {
  const [search, setSearch] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [results, setResults] = useState<Program[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 0 })

  // 마운트 시 초기 검색 실행
  useEffect(() => {
    performSearch()
  }, [])

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const toggleRegion = (region: string) => {
    setSelectedRegions(prev =>
      prev.includes(region)
        ? prev.filter(r => r !== region)
        : [...prev, region]
    )
  }

  const performSearch = async (page: number = 1) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      selectedTypes.forEach(t => params.append('types', t))
      selectedRegions.forEach(r => params.append('regions', r))
      params.append('limit', '20')
      params.append('offset', String((page - 1) * 20))

      const response = await fetch(`/api/programs?${params.toString()}`)
      const data: SearchResult = await response.json()

      if (data.success) {
        setResults(data.data)
        setPagination({
          total: data.pagination.total,
          page: data.pagination.page,
          totalPages: data.pagination.totalPages,
        })
      } else {
        setError('검색 중 오류가 발생했습니다.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(1)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getDaysUntilDeadline = (deadline: string) => {
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const diff = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  return (
    <div className="py-8">
      {/* 검색 폼 */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="mb-6">
          <input
            type="text"
            placeholder="지원사업명, 기관 등으로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 기업 종류 필터 */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">기업 종류</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {ENTERPRISE_TYPES.map(type => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type)}
                  onChange={() => toggleType(type)}
                  className="mr-2"
                />
                <span className="text-sm">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 지역 필터 */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">지원 지역</h3>
          <div className="grid grid-cols-3 gap-3">
            {REGIONS.map(region => (
              <label key={region} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedRegions.includes(region)}
                  onChange={() => toggleRegion(region)}
                  className="mr-2"
                />
                <span className="text-sm">{region}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          검색
        </button>
      </form>

      {/* 결과 영역 */}
      <div className="border-t pt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            검색 결과 ({pagination.total}개)
          </h2>
          {loading && <span className="text-sm text-gray-500">검색 중...</span>}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p className="text-sm text-red-700">❌ {error}</p>
          </div>
        )}

        {results.length === 0 ? (
          <p className="text-gray-500">
            {loading ? '검색 중입니다...' : '검색 결과가 없습니다.'}
          </p>
        ) : (
          <>
            <div className="grid gap-4">
              {results.map(program => {
                const daysLeft = getDaysUntilDeadline(program.deadline)
                const isUrgent = daysLeft <= 7
                const isExpired = daysLeft < 0

                return (
                  <div
                    key={program.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{program.title}</h3>
                        <p className="text-sm text-gray-600">{program.organization}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 mb-2">
                          {program.region}
                        </span>
                        {isExpired ? (
                          <div className="text-red-600 text-sm font-semibold">
                            마감됨
                          </div>
                        ) : (
                          <div className={`text-sm font-semibold ${isUrgent ? 'text-red-600' : 'text-green-600'}`}>
                            {daysLeft}일 남음
                          </div>
                        )}
                      </div>
                    </div>

                    {program.description && (
                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                        {program.description}
                      </p>
                    )}

                    <div className="mb-3 flex flex-wrap gap-2">
                      {program.targetTypes.map(type => (
                        <span
                          key={type}
                          className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                        >
                          {type}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-semibold">지원금:</span>{' '}
                        {program.fundAmount || '미정'}
                      </div>
                      <div>
                        <span className="font-semibold">마감일:</span>{' '}
                        {formatDate(program.deadline)}
                      </div>
                    </div>

                    <a
                      href={program.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                    >
                      공고 보기 ↗
                    </a>
                    <span className="text-xs text-gray-500 ml-2">
                      ({program.sourceWebsite})
                    </span>
                  </div>
                )
              })}
            </div>

            {/* 페이지네이션 */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                  page => (
                    <button
                      key={page}
                      onClick={() => performSearch(page)}
                      className={`px-3 py-1 rounded ${
                        pagination.page === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 안내 메시지 */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-gray-700">
          💡 <strong>팁:</strong> 기업 종류와 지역을 선택하면 해당하는 지원사업만 표시됩니다.
          매일 자정에 새로운 공모사업이 자동으로 추가됩니다.
        </p>
      </div>
    </div>
  )
}
