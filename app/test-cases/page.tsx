"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { TestCase } from "@/types";

interface SavedPRD {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface SavedPRAnalysis {
  id: string;
  url: string;
  title: string;
  analyzedAt: string;
}

export default function TestCasesPage() {
  const searchParams = useSearchParams();
  const urlPrdId = searchParams.get("prdId");
  const urlPrAnalysisId = searchParams.get("prAnalysisId");
  
  const [prdId, setPrdId] = useState(urlPrdId || "");
  const [prAnalysisId, setPrAnalysisId] = useState(urlPrAnalysisId || "");
  const [isLoading, setIsLoading] = useState(false);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["functional", "edge_case", "regression"]);
  
  const [savedPRDs, setSavedPRDs] = useState<SavedPRD[]>([]);
  const [savedPRAnalyses, setSavedPRAnalyses] = useState<SavedPRAnalysis[]>([]);
  const [inputMode, setInputMode] = useState<"manual" | "select">("select");

  const testTypes = [
    { value: "functional", label: "기능 테스트", description: "주요 기능이 정상 동작하는지 확인" },
    { value: "edge_case", label: "엣지 케이스", description: "경계값 및 예외 상황 처리 확인" },
    { value: "regression", label: "회귀 테스트", description: "기존 기능이 영향받지 않는지 확인" },
    { value: "integration", label: "통합 테스트", description: "모듈 간 상호작용 확인" },
    { value: "performance", label: "성능 테스트", description: "응답 시간 및 리소스 사용량 확인" }
  ];

  useEffect(() => {
    const savedPRDsData = localStorage.getItem("savedPRDs");
    if (savedPRDsData) {
      try {
        const prds = JSON.parse(savedPRDsData);
        setSavedPRDs(prds);
      } catch (e) {
        console.error("Failed to load saved PRDs:", e);
      }
    }

    const savedPRAnalysesData = localStorage.getItem("savedPRAnalyses");
    if (savedPRAnalysesData) {
      try {
        const analyses = JSON.parse(savedPRAnalysesData);
        setSavedPRAnalyses(analyses);
      } catch (e) {
        console.error("Failed to load saved PR analyses:", e);
      }
    }
  }, []);

  const generateTestCases = async () => {
    // PRD와 PR 분석 모두 선택사항
    // 최소 하나의 테스트 유형만 선택되면 테스트 케이스 생성 가능
    if (selectedTypes.length === 0) {
      alert("최소 하나 이상의 테스트 유형을 선택해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      let prdContent = "";
      let prAnalysisContent = "";

      if (prdId) {
        const prd = savedPRDs.find(p => p.id === prdId);
        if (prd) {
          prdContent = prd.content;
        }
      }

      if (prAnalysisId) {
        const analysis = savedPRAnalyses.find(a => a.id === prAnalysisId);
        if (analysis) {
          prAnalysisContent = (analysis as any).analysis || "";
        }
      }

      const { getTestCasePrompt } = await import("@/lib/prompts");
      const customPrompt = getTestCasePrompt();
      
      const response = await fetch("/api/test-cases/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prdContent,
          prAnalysisContent,
          testTypes: selectedTypes,
          customPrompt
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "테스트 케이스 생성 실패");
      }

      setTestCases(data.testCases);
      
      if (typeof window !== 'undefined') {
        const { trackApiUsage, estimateTokens, calculateGeminiCost } = await import("@/lib/api-usage");
        const promptTokens = estimateTokens(customPrompt + prdContent + prAnalysisContent);
        const responseTokens = estimateTokens(JSON.stringify(data.testCases));
        const totalTokens = promptTokens + responseTokens;
        const cost = calculateGeminiCost(totalTokens);
        
        trackApiUsage("gemini", "test-cases", totalTokens, !response.ok, cost);
      }
    } catch (error: any) {
      console.error("Error generating test cases:", error);
      alert(error.message || "테스트 케이스 생성 중 오류가 발생했습니다.");
      
      if (typeof window !== 'undefined') {
        const { trackApiUsage } = await import("@/lib/api-usage");
        trackApiUsage("gemini", "test-cases", 0, true, 0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const exportTestCases = () => {
    const content = testCases.map(tc => {
      const steps = tc.steps.map((step, idx) => 
        `  ${idx + 1}. ${step.action}\n     예상 결과: ${step.expectedResult}`
      ).join('\n');
      
      return `## ${tc.title}
유형: ${tc.type}
설명: ${tc.description}

### 테스트 단계:
${steps}

### 최종 예상 결과:
${tc.expectedResult}
`;
    }).join('\n---\n\n');

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-cases-${Date.now()}.md`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            테스트 케이스 <span className="text-green-600">생성기</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            PRD와 PR 분석을 기반으로 포괄적이고 체계적인 테스트 케이스를 자동으로 생성하세요
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left Side - Input Form */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-5">입력 정보</h2>
                
                {/* Input Mode Toggle */}
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setInputMode("select")}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      inputMode === "select" 
                        ? "bg-green-600 text-white shadow-md" 
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    목록에서 선택
                  </button>
                  <button
                    onClick={() => setInputMode("manual")}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      inputMode === "manual" 
                        ? "bg-green-600 text-white shadow-md" 
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    ID 직접 입력
                  </button>
                </div>

                <div className="space-y-6">
                  {inputMode === "select" ? (
                    <>
                      {/* PRD Selection */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          PRD 선택 (선택사항)
                          {urlPrdId && <span className="ml-2 text-xs text-green-600">✓ 자동 선택됨</span>}
                        </label>
                        <select
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                          value={prdId}
                          onChange={(e) => setPrdId(e.target.value)}
                        >
                          <option value="">PRD를 선택하세요</option>
                          {savedPRDs.map((prd) => (
                            <option key={prd.id} value={prd.id}>
                              {prd.title} - {new Date(prd.createdAt).toLocaleString('ko-KR')}
                            </option>
                          ))}
                        </select>
                        {prdId && (
                          <p className="text-xs text-gray-500 mt-1">선택된 ID: {prdId}</p>
                        )}
                      </div>

                      {/* PR Analysis Selection */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          PR 분석 선택 (선택사항)
                          {urlPrAnalysisId && <span className="ml-2 text-xs text-green-600">✓ 자동 선택됨</span>}
                        </label>
                        <select
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                          value={prAnalysisId}
                          onChange={(e) => setPrAnalysisId(e.target.value)}
                        >
                          <option value="">PR 분석을 선택하세요</option>
                          {savedPRAnalyses.map((analysis) => (
                            <option key={analysis.id} value={analysis.id}>
                              {analysis.title} - {new Date(analysis.analyzedAt).toLocaleString('ko-KR')}
                            </option>
                          ))}
                        </select>
                        {prAnalysisId && (
                          <p className="text-xs text-gray-500 mt-1">선택된 ID: {prAnalysisId}</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Manual ID Input */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          PRD ID (선택사항)
                          {urlPrdId && <span className="ml-2 text-xs text-green-600">✓ 자동 입력됨</span>}
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                          value={prdId}
                          onChange={(e) => setPrdId(e.target.value)}
                          placeholder="예: prd_1234567890"
                        />
                        <p className="text-xs text-gray-500 mt-1">PRD 생성 페이지에서 생성된 ID를 입력하세요</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          PR 분석 ID (선택사항)
                          {urlPrAnalysisId && <span className="ml-2 text-xs text-green-600">✓ 자동 입력됨</span>}
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                          value={prAnalysisId}
                          onChange={(e) => setPrAnalysisId(e.target.value)}
                          placeholder="예: pr_1234567890"
                        />
                        <p className="text-xs text-gray-500 mt-1">GitHub PR 분석 페이지에서 생성된 ID를 입력하세요</p>
                      </div>
                    </>
                  )}

                  {/* No Data Warning */}
                  {inputMode === "select" && savedPRDs.length === 0 && savedPRAnalyses.length === 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <p className="text-sm text-yellow-800">
                        저장된 PRD나 PR 분석이 없습니다. 먼저 PRD를 생성하거나 PR을 분석해주세요.
                      </p>
                    </div>
                  )}

                  {/* Test Type Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">테스트 유형 선택</label>
                    <div className="space-y-3">
                      {testTypes.map(type => (
                        <label key={type.value} className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-all">
                          <input
                            type="checkbox"
                            className="mt-1 w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            checked={selectedTypes.includes(type.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTypes([...selectedTypes, type.value]);
                              } else {
                                setSelectedTypes(selectedTypes.filter(t => t !== type.value));
                              }
                            }}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{type.label}</div>
                            <div className="text-sm text-gray-500">{type.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={generateTestCases}
                    disabled={isLoading || selectedTypes.length === 0}
                    className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-base hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 shadow-lg"
                  >
                    {isLoading ? "생성 중..." : "🧪 테스트 케이스 생성"}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side - Generated Test Cases */}
            <div className="lg:sticky lg:top-8">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 min-h-[600px] flex flex-col">
                {testCases.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                      <h2 className="text-xl font-bold text-gray-900">생성된 테스트 케이스 ({testCases.length}개)</h2>
                      <button
                        onClick={exportTestCases}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium"
                      >
                        📁 Markdown으로 내보내기
                      </button>
                    </div>
                    
                    <div className="flex-1 p-6 overflow-y-auto">
                      <div className="space-y-6">
                        {testCases.map((testCase, index) => (
                          <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                            <div className="flex items-start justify-between mb-4">
                              <h3 className="text-lg font-bold text-gray-900 flex-1">{testCase.title}</h3>
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                testCase.type === 'functional' ? 'bg-blue-100 text-blue-700' :
                                testCase.type === 'edge_case' ? 'bg-yellow-100 text-yellow-700' :
                                testCase.type === 'regression' ? 'bg-purple-100 text-purple-700' :
                                testCase.type === 'integration' ? 'bg-green-100 text-green-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                {testTypes.find(t => t.value === testCase.type)?.label}
                              </span>
                            </div>

                            <p className="text-gray-600 mb-4">{testCase.description}</p>

                            <div className="mb-4">
                              <h4 className="font-semibold text-gray-900 mb-3">테스트 단계:</h4>
                              <ol className="space-y-3">
                                {testCase.steps.map((step, stepIndex) => (
                                  <li key={stepIndex} className="flex gap-3">
                                    <span className="flex-shrink-0 w-7 h-7 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-medium">
                                      {stepIndex + 1}
                                    </span>
                                    <div className="flex-1">
                                      <div className="font-medium text-sm text-gray-900 mb-1">{step.action}</div>
                                      <div className="text-sm text-gray-600">
                                        <span className="font-medium">예상 결과:</span> {step.expectedResult}
                                      </div>
                                    </div>
                                  </li>
                                ))}
                              </ol>
                            </div>

                            <div className="bg-white border border-gray-200 p-4 rounded-lg">
                              <h4 className="font-semibold text-sm text-gray-900 mb-2">최종 예상 결과:</h4>
                              <p className="text-sm text-gray-700">{testCase.expectedResult}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-12">
                    <div className="text-center">
                      <div className="text-5xl mb-5">🧪</div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        테스트 케이스를 생성해보세요
                      </h3>
                      <p className="text-gray-600">
                        PRD나 PR 분석을 선택하고 '테스트 케이스 생성' 버튼을 클릭하세요
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}