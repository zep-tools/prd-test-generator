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

interface SavedTestCase {
  id: string;
  title: string;
  testCases: TestCase[];
  prdId?: string;
  prAnalysisId?: string;
  createdAt: string;
  testTypes: string[];
}

export default function TestCasesTable() {
  const searchParams = useSearchParams();
  const urlPrdId = searchParams.get("prdId");
  const urlPrAnalysisId = searchParams.get("prAnalysisId");
  
  const [prdId, setPrdId] = useState(urlPrdId || "");
  const [prAnalysisId, setPrAnalysisId] = useState(urlPrAnalysisId || "");
  const [figmaUrl, setFigmaUrl] = useState("");
  const [figmaInfo, setFigmaInfo] = useState("");
  const [isFetchingFigma, setIsFetchingFigma] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["functional", "edge_case", "regression"]);
  
  const [savedPRDs, setSavedPRDs] = useState<SavedPRD[]>([]);
  const [savedPRAnalyses, setSavedPRAnalyses] = useState<SavedPRAnalysis[]>([]);
  const [savedTestCases, setSavedTestCases] = useState<SavedTestCase[]>([]);
  const [inputMode, setInputMode] = useState<"manual" | "select">("select");
  const [showHistory, setShowHistory] = useState(false);
  const [currentTestCaseId, setCurrentTestCaseId] = useState<string | null>(null);
  const [testCaseTitle, setTestCaseTitle] = useState("");

  const testTypes = [
    { value: "functional", label: "기능 테스트", description: "주요 기능이 정상 동작하는지 확인" },
    { value: "edge_case", label: "엣지 케이스", description: "경계값 및 예외 상황 처리 확인" },
    { value: "regression", label: "회귀 테스트", description: "기존 기능이 영향받지 않는지 확인" },
    { value: "integration", label: "통합 테스트", description: "모듈 간 상호작용 확인" },
    { value: "performance", label: "성능 테스트", description: "응답 시간 및 리소스 사용량 확인" }
  ];

  const testTypeLabels: { [key: string]: string } = {
    functional: "기능",
    edge_case: "엣지",
    regression: "회귀",
    integration: "통합",
    performance: "성능"
  };

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

    const savedTestCasesData = localStorage.getItem("savedTestCases");
    if (savedTestCasesData) {
      try {
        const testCases = JSON.parse(savedTestCasesData);
        setSavedTestCases(testCases);
      } catch (e) {
        console.error("Failed to parse saved test cases");
      }
    }
  }, []);

  const saveTestCases = () => {
    if (!testCaseTitle.trim()) {
      alert("테스트 케이스 제목을 입력해주세요.");
      return;
    }

    const newSavedTestCase: SavedTestCase = {
      id: `tc_${Date.now()}`,
      title: testCaseTitle,
      testCases: testCases,
      prdId: prdId || undefined,
      prAnalysisId: prAnalysisId || undefined,
      createdAt: new Date().toISOString(),
      testTypes: selectedTypes
    };

    const updatedTestCases = [newSavedTestCase, ...savedTestCases];
    setSavedTestCases(updatedTestCases);
    localStorage.setItem("savedTestCases", JSON.stringify(updatedTestCases));
    setCurrentTestCaseId(newSavedTestCase.id);
    alert("테스트 케이스가 저장되었습니다!");
  };

  const loadTestCase = (saved: SavedTestCase) => {
    setTestCases(saved.testCases);
    setPrdId(saved.prdId || "");
    setPrAnalysisId(saved.prAnalysisId || "");
    setSelectedTypes(saved.testTypes);
    setCurrentTestCaseId(saved.id);
    setTestCaseTitle(saved.title);
    setShowHistory(false);
  };

  const deleteTestCase = (id: string) => {
    const updatedTestCases = savedTestCases.filter(tc => tc.id !== id);
    setSavedTestCases(updatedTestCases);
    localStorage.setItem("savedTestCases", JSON.stringify(updatedTestCases));

    if (currentTestCaseId === id) {
      setTestCases([]);
      setCurrentTestCaseId(null);
      setTestCaseTitle("");
    }
  };

  const fetchFigmaData = async () => {
    if (!figmaUrl.trim()) {
      alert("Figma URL을 입력해주세요.");
      return;
    }

    setIsFetchingFigma(true);
    try {
      const response = await fetch("/api/figma/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ figmaUrl })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Figma 파일을 가져오는데 실패했습니다.");
      }

      setFigmaInfo(data.formattedInfo);
      alert(`Figma 파일 "${data.fileName}"을(를) 불러왔습니다!`);
    } catch (error: any) {
      console.error("Error fetching Figma:", error);
      alert(error.message || "Figma 파일을 가져오는 중 오류가 발생했습니다.");
    } finally {
      setIsFetchingFigma(false);
    }
  };

  const generateTestCases = async () => {
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
          figmaInfo,
          testTypes: selectedTypes,
          customPrompt
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        // More specific error messages
        let errorMessage = data.error || "테스트 케이스 생성 실패";
        
        if (errorMessage.includes("overloaded") || errorMessage.includes("503")) {
          errorMessage = "서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.";
        } else if (errorMessage.includes("API key")) {
          errorMessage = "API 키가 유효하지 않습니다. 관리자에게 문의하세요.";
        } else if (errorMessage.includes("quota")) {
          errorMessage = "API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
        }
        
        throw new Error(errorMessage);
      }

      setTestCases(data.testCases);
      
      // 자동으로 제목 생성
      const prdTitle = prdId ? savedPRDs.find(p => p.id === prdId)?.title : "";
      const prTitle = prAnalysisId ? savedPRAnalyses.find(a => a.id === prAnalysisId)?.title : "";
      const autoTitle = `${prdTitle || prTitle || "테스트"} - ${new Date().toLocaleDateString()}`;
      setTestCaseTitle(autoTitle);
      
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
    // 테이블 형식의 마크다운 생성
    let content = `# 테스트 케이스 문서\n\n`;
    content += `**생성일:** ${new Date().toLocaleDateString('ko-KR')}\n`;
    content += `**제목:** ${testCaseTitle || '테스트 케이스'}\n\n`;
    
    // 테이블 헤더
    content += `| 테스트 Depth1 | 테스트 Depth2 | 테스트 Depth3 | 기대결과 |\n`;
    content += `|--------------|--------------|--------------|----------|\n`;
    
    // 테스트 케이스를 테이블 형식으로 변환
    testCases.forEach(tc => {
      const type = testTypeLabels[tc.type] || tc.type;
      
      if (tc.steps.length === 0) {
        content += `| ${tc.title} | ${type} | - | ${tc.expectedResult} |\n`;
      } else {
        tc.steps.forEach((step, idx) => {
          if (idx === 0) {
            content += `| ${tc.title} | ${step.action} | ${type} | ${step.expectedResult} |\n`;
          } else {
            content += `| | ${step.action} | | ${step.expectedResult} |\n`;
          }
        });
        // 최종 예상 결과 추가
        content += `| | **최종 결과** | | **${tc.expectedResult}** |\n`;
      }
    });

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-cases-${Date.now()}.md`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-3 py-6">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            테스트 케이스 <span className="text-green-600">생성기</span>
          </h1>
          <p className="text-base text-gray-600 max-w-xl mx-auto">
            PRD와 PR 분석을 기반으로 체계적인 테스트 케이스를 자동으로 생성하세요
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Side - Input Form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-gray-900">입력 정보</h2>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-green-600 hover:text-green-700 font-medium text-sm"
                  >
                    📚 저장 목록 ({savedTestCases.length})
                  </button>
                </div>

                {showHistory ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {savedTestCases.length === 0 ? (
                      <p className="text-gray-500 text-center py-6 text-sm">저장된 테스트 케이스가 없습니다.</p>
                    ) : (
                      savedTestCases.map((saved) => (
                        <div key={saved.id} className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate text-sm">{saved.title}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(saved.createdAt).toLocaleString('ko-KR')}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                테스트 {saved.testCases.length}개
                              </div>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <button
                                onClick={() => loadTestCase(saved)}
                                className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-medium"
                              >
                                불러오기
                              </button>
                              <button
                                onClick={() => deleteTestCase(saved.id)}
                                className="px-2 py-1 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium"
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <button
                      onClick={() => setShowHistory(false)}
                      className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium"
                    >
                      닫기
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Input Mode Toggle */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setInputMode("select")}
                        className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
                          inputMode === "select" 
                            ? "bg-green-600 text-white" 
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        목록에서 선택
                      </button>
                      <button
                        onClick={() => setInputMode("manual")}
                        className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
                          inputMode === "manual" 
                            ? "bg-green-600 text-white" 
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        ID 직접 입력
                      </button>
                    </div>

                    {inputMode === "select" ? (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            PRD 선택 (선택사항)
                          </label>
                          <select
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                            value={prdId}
                            onChange={(e) => setPrdId(e.target.value)}
                          >
                            <option value="">선택하세요</option>
                            {savedPRDs.map(prd => (
                              <option key={prd.id} value={prd.id}>
                                {prd.title.substring(0, 30)}...
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            PR 분석 선택 (선택사항)
                          </label>
                          <select
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                            value={prAnalysisId}
                            onChange={(e) => setPrAnalysisId(e.target.value)}
                          >
                            <option value="">선택하세요</option>
                            {savedPRAnalyses.map(analysis => (
                              <option key={analysis.id} value={analysis.id}>
                                {analysis.title.substring(0, 30)}...
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Figma 디자인 (선택사항)
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                              value={figmaUrl}
                              onChange={(e) => setFigmaUrl(e.target.value)}
                              placeholder="https://www.figma.com/file/..."
                            />
                            <button
                              onClick={fetchFigmaData}
                              disabled={isFetchingFigma || !figmaUrl.trim()}
                              className="px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                            >
                              {isFetchingFigma ? "불러오는 중..." : "불러오기"}
                            </button>
                          </div>
                          {figmaInfo && (
                            <div className="mt-2 text-xs text-green-600 bg-green-50 p-2 rounded-lg">
                              ✓ Figma 디자인 정보가 로드되었습니다
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            PRD ID
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                            value={prdId}
                            onChange={(e) => setPrdId(e.target.value)}
                            placeholder="PRD ID 입력"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            PR 분석 ID
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                            value={prAnalysisId}
                            onChange={(e) => setPrAnalysisId(e.target.value)}
                            placeholder="PR 분석 ID 입력"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Figma 디자인 (선택사항)
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                              value={figmaUrl}
                              onChange={(e) => setFigmaUrl(e.target.value)}
                              placeholder="https://www.figma.com/file/..."
                            />
                            <button
                              onClick={fetchFigmaData}
                              disabled={isFetchingFigma || !figmaUrl.trim()}
                              className="px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                            >
                              {isFetchingFigma ? "불러오는 중..." : "불러오기"}
                            </button>
                          </div>
                          {figmaInfo && (
                            <div className="mt-2 text-xs text-green-600 bg-green-50 p-2 rounded-lg">
                              ✓ Figma 디자인 정보가 로드되었습니다
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Test Types Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        테스트 유형 선택
                      </label>
                      <div className="space-y-2">
                        {testTypes.map(type => (
                          <label key={type.value} className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              className="mr-2 text-green-600 rounded focus:ring-green-500"
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
                              <div className="text-sm font-medium text-gray-900">{type.label}</div>
                              <div className="text-xs text-gray-500">{type.description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={generateTestCases}
                      disabled={isLoading}
                      className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 shadow-lg text-sm"
                    >
                      {isLoading ? "테스트 케이스 생성 중..." : "🚀 테스트 케이스 생성"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Generated Test Cases Table */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-gray-900">생성된 테스트 케이스</h2>
                  {testCases.length > 0 && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="테스트 케이스 제목"
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                        value={testCaseTitle}
                        onChange={(e) => setTestCaseTitle(e.target.value)}
                      />
                      <button
                        onClick={saveTestCases}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-sm"
                      >
                        💾 저장
                      </button>
                      <button
                        onClick={exportTestCases}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium text-sm"
                      >
                        📁 내보내기
                      </button>
                    </div>
                  )}
                </div>

                {testCases.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-4xl mb-4">🧪</div>
                    <p className="text-gray-500 mb-2">아직 생성된 테스트 케이스가 없습니다</p>
                    <p className="text-xs text-gray-400">왼쪽에서 옵션을 선택하고 생성 버튼을 클릭하세요</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">테스트 Depth1</th>
                          <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">테스트 Depth2</th>
                          <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">테스트 Depth3</th>
                          <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">기대결과</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testCases.map((tc, tcIndex) => {
                          const typeLabel = testTypeLabels[tc.type] || tc.type;
                          
                          if (tc.steps.length === 0) {
                            return (
                              <tr key={tc.id || tcIndex} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-4 py-2 text-sm">{tc.title}</td>
                                <td className="border border-gray-300 px-4 py-2 text-sm">{typeLabel}</td>
                                <td className="border border-gray-300 px-4 py-2 text-sm">-</td>
                                <td className="border border-gray-300 px-4 py-2 text-sm">{tc.expectedResult}</td>
                              </tr>
                            );
                          }
                          
                          return (
                            <React.Fragment key={tc.id || tcIndex}>
                              {tc.steps.map((step, stepIndex) => (
                                <tr key={`${tc.id}-${stepIndex}`} className="hover:bg-gray-50">
                                  <td className="border border-gray-300 px-4 py-2 text-sm">
                                    {stepIndex === 0 ? tc.title : ""}
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2 text-sm">{step.action}</td>
                                  <td className="border border-gray-300 px-4 py-2 text-sm">
                                    {stepIndex === 0 ? typeLabel : ""}
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2 text-sm">{step.expectedResult}</td>
                                </tr>
                              ))}
                              <tr key={`${tc.id}-final`} className="bg-gray-50">
                                <td className="border border-gray-300 px-4 py-2 text-sm"></td>
                                <td className="border border-gray-300 px-4 py-2 text-sm font-semibold">최종 결과</td>
                                <td className="border border-gray-300 px-4 py-2 text-sm"></td>
                                <td className="border border-gray-300 px-4 py-2 text-sm font-semibold">{tc.expectedResult}</td>
                              </tr>
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Info Card */}
              <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                <h3 className="font-bold text-green-900 mb-2 text-sm">💡 테스트 케이스 생성 팁</h3>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• PRD와 PR 분석을 함께 사용하면 더 정확한 테스트 케이스를 생성할 수 있습니다</li>
                  <li>• 테스트 유형을 적절히 선택하여 필요한 범위를 커버하세요</li>
                  <li>• 생성된 테스트 케이스는 저장하여 나중에 다시 확인할 수 있습니다</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}