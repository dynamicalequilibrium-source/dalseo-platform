import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '달서구 사회적경제 지원사업 플랫폼',
  description: '사회적경제 기업을 위한 지원사업 통합 검색 플랫폼',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <header className="bg-blue-600 text-white p-4">
          <h1 className="text-2xl font-bold">달서구 사회적경제 지원사업</h1>
          <p className="text-sm mt-1">지원사업 통합 검색 플랫폼</p>
        </header>
        <main className="max-w-6xl mx-auto p-4">
          {children}
        </main>
        <footer className="bg-gray-100 text-center p-4 mt-8">
          <p className="text-sm text-gray-600">
            © 2026 달서구 사회적경제지원센터
          </p>
        </footer>
      </body>
    </html>
  )
}
