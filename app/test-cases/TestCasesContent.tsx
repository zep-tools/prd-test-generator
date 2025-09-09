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

export default function TestCasesContent() {
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
        console.error("Failed to parse saved PRDs");
      }
    }
    
    const savedAnalysesData = localStorage.getItem("savedPRAnalyses");
    if (savedAnalysesData) {
      try {
        const analyses = JSON.parse(savedAnalysesData);
        setSavedPRAnalyses(analyses);
      } catch (e) {
        console.error("Failed to parse saved analyses");
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
                          {savedPRDs.map(prd => (
                            <option key={prd.id} value={prd.id}>
                              {prd.title} ({new Date(prd.createdAt).toLocaleDateString()})
                            </option>
                          ))}
                        </select>
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
                          {savedPRAnalyses.map(analysis => (
                            <option key={analysis.id} value={analysis.id}>
                              {analysis.title} ({new Date(analysis.analyzedAt).toLocaleDateString()})
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Manual Input */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          PRD ID (선택사항)
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                          value={prdId}
                          onChange={(e) => setPrdId(e.target.value)}
                          placeholder="PRD ID를 입력하세요"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          PR 분석 ID (선택사항)
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                          value={prAnalysisId}
                          onChange={(e) => setPrAnalysisId(e.target.value)}
                          placeholder="PR 분석 ID를 입력하세요"
                        />
                      </div>
                    </>
                  )}

                  {/* Test Types Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      테스트 유형 선택
                    </label>
                    <div className="space-y-3">
                      {testTypes.map(type => (
                        <label key={type.value} className="flex items-start p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-all">
                          <input
                            type="checkbox"
                            className="mt-1 mr-3 w-4 h-4 text-green-600 rounded focus:ring-green-500"
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
                            <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={generateTestCases}
                    disabled={isLoading}
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                      isLoading 
                        ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl"
                    }`}
                  >
                    {isLoading ? "테스트 케이스 생성 중..." : "테스트 케이스 생성"}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side - Generated Test Cases */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-gray-900">생성된 테스트 케이스</h2>
                  {testCases.length > 0 && (
                    <button
                      onClick={exportTestCases}
                      className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-all"
                    >
                      내보내기
                    </button>
                  )}
                </div>

                {testCases.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <p className="text-gray-500 mb-2">아직 생성된 테스트 케이스가 없습니다</p>
                    <p className="text-xs text-gray-400">왼쪽에서 옵션을 선택하고 생성 버튼을 클릭하세요</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {testCases.map((testCase, index) => (
                      <div key={testCase.id || index} className="border border-gray-200 rounded-xl p-5 hover:border-green-300 transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-bold text-gray-900 flex-1">{testCase.title}</h3>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            testCase.type === 'functional' ? 'bg-blue-100 text-blue-700' :
                            testCase.type === 'edge_case' ? 'bg-orange-100 text-orange-700' :
                            testCase.type === 'regression' ? 'bg-purple-100 text-purple-700' :
                            testCase.type === 'integration' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {testCase.type}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-4">{testCase.description}</p>
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm text-gray-700">테스트 단계:</h4>
                          {testCase.steps.map((step, stepIndex) => (
                            <div key={stepIndex} className="pl-4 text-sm">
                              <div className="text-gray-700">
                                <span className="font-medium">{stepIndex + 1}.</span> {step.action}
                              </div>
                              <div className="text-gray-500 pl-4 mt-1">
                                → {step.expectedResult}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <h4 className="font-semibold text-sm text-gray-700 mb-1">최종 예상 결과:</h4>
                          <p className="text-sm text-gray-600">{testCase.expectedResult}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info Card */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <h3 className="font-bold text-green-900 mb-2">💡 테스트 케이스 생성 팁</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• PRD와 PR 분석을 함께 사용하면 더 정확한 테스트 케이스를 생성할 수 있습니다</li>
                  <li>• 테스트 유형을 적절히 선택하여 필요한 범위를 커버하세요</li>
                  <li>• 생성된 테스트 케이스는 수정 및 보완이 가능합니다</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}