'use client'

import { useState } from 'react'

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

export default function Home() {
  const [search, setSearch] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [results, setResults] = useState([])

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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: API 호출 구현
    console.log({
      search,
      selectedTypes,
      selectedRegions,
    })
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
        <h2 className="text-xl font-bold mb-4">검색 결과</h2>
        {results.length === 0 ? (
          <p className="text-gray-500">검색 결과가 없습니다. (현재 더미 상태)</p>
        ) : (
          <div className="grid gap-4">
            {/* 결과 아이템이 여기에 들어갈 예정 */}
          </div>
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
