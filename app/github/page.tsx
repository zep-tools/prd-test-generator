"use client";

import { useState, useEffect } from "react";
import { GitHubPRData } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SavedPRAnalysis {
  id: string;
  url: string;
  title: string;
  prData: GitHubPRData;
  analysis: string;
  analyzedAt: string;
}

export default function GitHubPage() {
  const [prUrl, setPrUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [prData, setPrData] = useState<GitHubPRData | null>(null);
  const [analysis, setAnalysis] = useState<string>("");
  const [savedAnalyses, setSavedAnalyses] = useState<SavedPRAnalysis[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("savedPRAnalyses");
    if (saved) {
      setSavedAnalyses(JSON.parse(saved));
    }
  }, []);

  const savePRAnalysis = (prData: GitHubPRData, analysis: string) => {
    const newAnalysis: SavedPRAnalysis = {
      id: `pr_${Date.now()}`,
      url: prUrl,
      title: prData.title,
      prData: prData,
      analysis: analysis,
      analyzedAt: new Date().toISOString()
    };
    
    const updatedAnalyses = [newAnalysis, ...savedAnalyses];
    setSavedAnalyses(updatedAnalyses);
    localStorage.setItem("savedPRAnalyses", JSON.stringify(updatedAnalyses));
    setCurrentAnalysisId(newAnalysis.id);
  };

  const loadAnalysis = (saved: SavedPRAnalysis) => {
    setPrUrl(saved.url);
    setPrData(saved.prData);
    setAnalysis(saved.analysis);
    setCurrentAnalysisId(saved.id);
    setShowHistory(false);
  };

  const deleteAnalysis = (id: string) => {
    const updatedAnalyses = savedAnalyses.filter(a => a.id !== id);
    setSavedAnalyses(updatedAnalyses);
    localStorage.setItem("savedPRAnalyses", JSON.stringify(updatedAnalyses));
    
    if (currentAnalysisId === id) {
      setPrData(null);
      setAnalysis("");
      setCurrentAnalysisId(null);
    }
  };

  const analyzePR = async () => {
    if (!prUrl.trim()) {
      alert("GitHub PR URL을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const promptResponse = await fetch("/api/github/get-prompt");
      const { prompt } = await promptResponse.json();
      
      const response = await fetch("/api/github/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url: prUrl,
          customPrompt: prompt 
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "PR 분석 실패");
      }
      
      setPrData(data.prData);
      setAnalysis(data.analysis);
      savePRAnalysis(data.prData, data.analysis);

      if (typeof window !== 'undefined') {
        const { trackApiUsage, estimateTokens, calculateGeminiCost, calculateGithubCost } = await import("@/lib/api-usage");
        
        trackApiUsage("github", "pr-analysis", 0, !response.ok, calculateGithubCost(1));
        
        const geminiTokens = estimateTokens(prompt + JSON.stringify(data.prData));
        const geminiCost = calculateGeminiCost(geminiTokens);
        trackApiUsage("gemini", "pr-analysis", geminiTokens, !response.ok, geminiCost);
      }
    } catch (error: any) {
      console.error("Error analyzing PR:", error);
      alert(error.message || "PR 분석 중 오류가 발생했습니다.");
      
      if (typeof window !== 'undefined') {
        const { trackApiUsage } = await import("@/lib/api-usage");
        trackApiUsage("github", "pr-analysis", 0, true, 0);
        trackApiUsage("gemini", "pr-analysis", 0, true, 0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const exportAnalysis = () => {
    if (!prData || !analysis) return;
    
    const content = `# GitHub PR 분석 결과

## PR 정보
- **제목**: ${prData.title}
- **URL**: ${prUrl}
- **작성자**: ${prData.author}
- **상태**: ${prData.state}
- **브랜치**: ${prData.base} ← ${prData.head}

## 분석 내용

${analysis}

---
*분석 일시: ${new Date().toLocaleString('ko-KR')}*
`;
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pr-analysis-${Date.now()}.md`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            GitHub PR <span className="text-purple-600">분석기</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            GitHub Pull Request를 AI로 분석하여 코드 변경사항과 요구사항을 자동으로 문서화하세요
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left Side - Input Form */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">PR 분석</h2>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2"
                  >
                    📚 저장된 분석 ({savedAnalyses.length})
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      GitHub PR URL *
                    </label>
                    <input
                      type="url"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      value={prUrl}
                      onChange={(e) => setPrUrl(e.target.value)}
                      placeholder="https://github.com/owner/repo/pull/123"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      분석할 GitHub Pull Request의 URL을 입력하세요
                    </p>
                  </div>

                  <button
                    onClick={analyzePR}
                    disabled={isLoading || !prUrl.trim()}
                    className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold text-base hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 shadow-lg"
                  >
                    {isLoading ? "분석 중..." : "🔍 PR 분석하기"}
                  </button>

                  {/* Example URLs */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">예시 URL:</h3>
                    <div className="space-y-1">
                      <button
                        onClick={() => setPrUrl("https://github.com/vercel/next.js/pull/12345")}
                        className="block w-full text-left text-xs text-blue-600 hover:text-blue-800 truncate"
                      >
                        https://github.com/vercel/next.js/pull/12345
                      </button>
                      <button
                        onClick={() => setPrUrl("https://github.com/facebook/react/pull/67890")}
                        className="block w-full text-left text-xs text-blue-600 hover:text-blue-800 truncate"
                      >
                        https://github.com/facebook/react/pull/67890
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* History Panel */}
              {showHistory && (
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">저장된 분석 목록</h3>
                  {savedAnalyses.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">저장된 분석이 없습니다.</p>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {savedAnalyses.map((saved) => (
                        <div key={saved.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{saved.title}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(saved.analyzedAt).toLocaleString('ko-KR')}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => loadAnalysis(saved)}
                              className="px-3 py-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-all text-sm font-medium"
                            >
                              불러오기
                            </button>
                            <button
                              onClick={() => deleteAnalysis(saved.id)}
                              className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all text-sm font-medium"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Side - Analysis Results */}
            <div className="lg:sticky lg:top-8">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 min-h-[600px] flex flex-col">
                {prData && analysis ? (
                  <>
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                      <h2 className="text-xl font-bold text-gray-900">분석 결과</h2>
                      <div className="flex gap-2">
                        <button
                          onClick={exportAnalysis}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium"
                        >
                          📁 내보내기
                        </button>
                        <a
                          href={`/test-cases?prAnalysisId=${currentAnalysisId}`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
                        >
                          🧪 테스트 케이스 생성
                        </a>
                      </div>
                    </div>

                    {/* PR Info */}
                    <div className="p-6 border-b border-gray-200 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">PR 정보</h3>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">제목:</span> {prData.title}</p>
                            <p><span className="font-medium">작성자:</span> {prData.author}</p>
                            <p><span className="font-medium">상태:</span> 
                              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                                prData.state === 'open' ? 'bg-green-100 text-green-800' :
                                prData.state === 'merged' ? 'bg-purple-100 text-purple-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {prData.state}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">브랜치 정보</h3>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Base:</span> {prData.base}</p>
                            <p><span className="font-medium">Head:</span> {prData.head}</p>
                            <p><span className="font-medium">변경 파일:</span> {prData.files?.length || 0}개</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 p-6 overflow-y-auto">
                      <div className="prose prose-purple max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {analysis}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-12">
                    <div className="text-center">
                      <div className="text-5xl mb-5">🔍</div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        PR을 분석해보세요
                      </h3>
                      <p className="text-gray-600">
                        GitHub PR URL을 입력하고 'PR 분석하기' 버튼을 클릭하세요
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