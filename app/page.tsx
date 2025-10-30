import { Metadata } from "next";

export const metadata: Metadata = {
  title: "PRD & Test Case Generator - AI 기반 개발 도구",
  description: "AI를 활용한 자동화된 PRD 작성 및 테스트 케이스 생성으로 개발 효율성을 극대화하세요. Gemini AI를 활용한 문서 자동화 도구.",
  keywords: ["PRD 생성", "테스트 케이스 생성", "AI 도구", "개발 도구", "문서 자동화", "Gemini AI"],
  openGraph: {
    title: "PRD & Test Case Generator",
    description: "AI를 활용한 자동화된 PRD 작성 및 테스트 케이스 생성 도구",
    type: "website",
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-3 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium mb-6">
            🚀 AI 기반 개발 도구
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-5 leading-tight">
            PRD & Test Case
            <span className="text-blue-600"> Generator</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            AI를 활용한 자동화된 PRD 작성 및 테스트 케이스 생성으로
            <br />개발 효율성을 극대화하세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/prd" 
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              지금 시작하기 →
            </a>
            <a 
              href="/admin" 
              className="border-2 border-blue-200 text-blue-700 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200"
            >
              관리자 페이지
            </a>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="container mx-auto px-3 py-12">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">
          강력한 기능들
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          <a href="/prd" className="group bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-5">
              <span className="text-white text-lg font-bold">📝</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
              PRD 생성기
            </h3>
            <p className="text-gray-600 leading-relaxed">
              간단한 입력만으로 표준화된 PRD를 자동 생성하고 대화형으로 수정할 수 있습니다
            </p>
            <div className="mt-4 text-blue-600 font-semibold flex items-center">
              시작하기 <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </a>

          <a href="/github" className="group bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-5">
              <span className="text-white text-lg font-bold">🔍</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
              GitHub PR 분석
            </h3>
            <p className="text-gray-600 leading-relaxed">
              PR의 코드 변경점을 자동으로 분석하여 요구사항과 연계합니다
            </p>
            <div className="mt-4 text-purple-600 font-semibold flex items-center">
              분석하기 <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </a>

          <a href="/test-cases" className="group bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-5">
              <span className="text-white text-lg font-bold">🧪</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
              테스트 케이스 생성
            </h3>
            <p className="text-gray-600 leading-relaxed">
              PRD와 코드를 기반으로 포괄적인 테스트 케이스를 자동으로 생성합니다
            </p>
            <div className="mt-4 text-green-600 font-semibold flex items-center">
              생성하기 <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gradient-to-r from-gray-50 to-blue-50 py-16">
        <div className="container mx-auto px-3">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">
              왜 우리 도구를 선택해야 할까요?
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-5">
                <div className="flex items-start space-x-3">
                  <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold text-sm">✨</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">AI 기반 PRD 초안 자동 생성</h3>
                    <p className="text-gray-600">몇 분 만에 완성도 높은 PRD 초안을 생성합니다</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 font-bold text-sm">💬</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">대화형 PRD 수정 및 보완</h3>
                    <p className="text-gray-600">실시간으로 내용을 수정하고 개선할 수 있습니다</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 font-bold text-sm">🔗</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">GitHub PR 코드 변경점 분석</h3>
                    <p className="text-gray-600">코드 변경 사항을 자동으로 분석하여 문서화합니다</p>
                  </div>
                </div>
              </div>
              <div className="space-y-5">
                <div className="flex items-start space-x-3">
                  <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 font-bold text-sm">🧪</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">자동화된 테스트 케이스 생성</h3>
                    <p className="text-gray-600">체계적이고 포괄적인 테스트 시나리오를 제공합니다</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-7 h-7 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-pink-600 font-bold text-sm">⚙️</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">프롬프트 템플릿 커스터마이징</h3>
                    <p className="text-gray-600">팀의 요구사항에 맞게 프롬프트를 맞춤 설정할 수 있습니다</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-600 font-bold text-sm">📊</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">관리자 페이지를 통한 상세 설정</h3>
                    <p className="text-gray-600">API 사용량 모니터링과 시스템 설정을 관리합니다</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-3 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-5">
            지금 바로 시작해보세요
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            개발 프로세스를 혁신하고 팀의 생산성을 향상시킬 준비가 되셨나요?
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a 
              href="/prd" 
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              PRD 생성하기
            </a>
            <a 
              href="/github" 
              className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              PR 분석하기
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
