"use client";

import { useState, useEffect } from "react";
import { PRDInput } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SavedPRD {
  id: string;
  title: string;
  content: string;
  input: PRDInput;
  createdAt: string;
  aiProvider?: string;
}

export default function PRDPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [prdContent, setPrdContent] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [currentPrdId, setCurrentPrdId] = useState<string | null>(null);
  const [savedPRDs, setSavedPRDs] = useState<SavedPRD[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  
  const [formData, setFormData] = useState<PRDInput>({
    title: "",
    objectives: "",
    features: [""],
    targetAudience: "",
    constraints: ""
  });

  // 컴포넌트 마운트 시 저장된 PRD 목록 불러오기
  useEffect(() => {
    const saved = localStorage.getItem("savedPRDs");
    if (saved) {
      setSavedPRDs(JSON.parse(saved));
    }
  }, []);

  // PRD 저장 함수
  const savePRD = (data: any) => {
    const newPRD: SavedPRD = {
      id: data.id,
      title: formData.title,
      content: data.content,
      input: formData,
      createdAt: data.createdAt,
      aiProvider: data.aiProvider
    };
    
    const updatedPRDs = [newPRD, ...savedPRDs];
    setSavedPRDs(updatedPRDs);
    localStorage.setItem("savedPRDs", JSON.stringify(updatedPRDs));
  };

  // 저장된 PRD 불러오기
  const loadPRD = (prd: SavedPRD) => {
    setFormData(prd.input);
    setPrdContent(prd.content);
    setCurrentPrdId(prd.id);
    setShowHistory(false);
    setChatMessages([]);
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, ""]
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const deletePRD = (id: string) => {
    const updatedPRDs = savedPRDs.filter(p => p.id !== id);
    setSavedPRDs(updatedPRDs);
    localStorage.setItem("savedPRDs", JSON.stringify(updatedPRDs));
    
    if (currentPrdId === id) {
      setPrdContent("");
      setChatMessages([]);
      setCurrentPrdId(null);
    }
  };

  const generatePRD = async () => {
    if (!formData.title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const { getPRDPrompt } = await import("@/lib/prompts");
      const customPrompt = getPRDPrompt();
      
      const response = await fetch("/api/prd/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          customPrompt
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "PRD 생성 실패");
      }

      setPrdContent(data.content);
      setChatMessages([]);
      setCurrentPrdId(data.id);
      savePRD(data);

      if (typeof window !== 'undefined') {
        const { trackApiUsage, estimateTokens, calculateGeminiCost } = await import("@/lib/api-usage");
        const promptTokens = estimateTokens(customPrompt + JSON.stringify(formData));
        const responseTokens = estimateTokens(data.content || "");
        const totalTokens = promptTokens + responseTokens;
        const cost = calculateGeminiCost(totalTokens);
        
        trackApiUsage("gemini", "prd-generation", totalTokens, !response.ok, cost);
      }
    } catch (error: any) {
      console.error("Error generating PRD:", error);
      alert(error.message || "PRD 생성 중 오류가 발생했습니다.");
      
      if (typeof window !== 'undefined') {
        const { trackApiUsage } = await import("@/lib/api-usage");
        trackApiUsage("gemini", "prd-generation", 0, true, 0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sendChatMessage = async (message: string) => {
    if (!currentPrdId || !message.trim()) return;
    
    const newMessages = [...chatMessages, { role: "user", content: message }];
    setChatMessages(newMessages);
    
    try {
      const response = await fetch("/api/prd/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prdId: currentPrdId,
          message: message
        })
      });
      
      const data = await response.json();
      setChatMessages([...newMessages, { role: "assistant", content: data.response }]);
      if (data.updatedPrd) {
        setPrdContent(data.updatedPrd);
      }
    } catch (error) {
      console.error("Error sending chat message:", error);
    }
  };

  const exportPRD = () => {
    const blob = new Blob([prdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.title || 'PRD'}-${Date.now()}.md`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-3 py-6">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            PRD <span className="text-blue-600">생성기</span>
          </h1>
          <p className="text-base text-gray-600 max-w-xl mx-auto">
            AI를 활용하여 체계적이고 완성도 높은 PRD를 자동으로 생성하세요
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Side - Input Form */}
            <div className="space-y-5">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-gray-900">프로젝트 정보</h2>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                  >
                    📚 저장된 PRD ({savedPRDs.length})
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      프로젝트 제목 *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="예: AI 기반 코드 리뷰 도구"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      프로젝트 목표
                    </label>
                    <textarea
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      rows={3}
                      value={formData.objectives}
                      onChange={(e) => setFormData(prev => ({ ...prev, objectives: e.target.value }))}
                      placeholder="이 프로젝트가 달성하고자 하는 주요 목표를 작성하세요..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      주요 기능
                    </label>
                    <div className="space-y-2.5">
                      {formData.features.map((feature, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            value={feature}
                            onChange={(e) => updateFeature(index, e.target.value)}
                            placeholder={`기능 ${index + 1}`}
                          />
                          {formData.features.length > 1 && (
                            <button
                              onClick={() => removeFeature(index)}
                              className="px-2.5 py-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={addFeature}
                        className="w-full py-2.5 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 transition-all font-medium"
                      >
                        + 기능 추가
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      대상 사용자
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={formData.targetAudience}
                      onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                      placeholder="예: 소프트웨어 개발팀, QA 엔지니어"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      제약사항 및 고려사항
                    </label>
                    <textarea
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      rows={2.5}
                      value={formData.constraints}
                      onChange={(e) => setFormData(prev => ({ ...prev, constraints: e.target.value }))}
                      placeholder="기술적 제약사항, 예산, 일정 등을 작성하세요..."
                    />
                  </div>

                  <button
                    onClick={generatePRD}
                    disabled={isLoading || !formData.title.trim()}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 shadow-lg"
                  >
                    {isLoading ? "PRD 생성 중..." : "🚀 PRD 생성하기"}
                  </button>
                </div>
              </div>

              {/* History Panel */}
              {showHistory && (
                <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
                  <h3 className="text-base font-bold text-gray-900 mb-3">저장된 PRD 목록</h3>
                  {savedPRDs.length === 0 ? (
                    <p className="text-gray-500 text-center py-6">저장된 PRD가 없습니다.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-56 overflow-y-auto">
                      {savedPRDs.map((prd) => (
                        <div key={prd.id} className="flex items-center justify-between p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate text-sm">{prd.title}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(prd.createdAt).toLocaleString('ko-KR')}
                            </div>
                          </div>
                          <div className="flex gap-1.5 ml-3">
                            <button
                              onClick={() => loadPRD(prd)}
                              className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-all text-xs font-medium"
                            >
                              불러오기
                            </button>
                            <button
                              onClick={() => deletePRD(prd.id)}
                              className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-all text-xs font-medium"
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

            {/* Right Side - Generated PRD */}
            <div className="lg:sticky lg:top-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 min-h-[500px] flex flex-col">
                {prdContent ? (
                  <>
                    <div className="flex items-center justify-between p-5 border-b border-gray-200">
                      <h2 className="text-lg font-bold text-gray-900">생성된 PRD</h2>
                      <div className="flex gap-1.5">
                        <button
                          onClick={exportPRD}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium text-sm"
                        >
                          📁 내보내기
                        </button>
                        <a
                          href={`/test-cases?prdId=${currentPrdId}`}
                          className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium text-sm"
                        >
                          🧪 테스트 케이스 생성
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex-1 p-5 overflow-y-auto">
                      <div className="prose prose-blue max-w-none prose-sm">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {prdContent}
                        </ReactMarkdown>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                      <div className="text-xs font-medium text-gray-700 mb-2">빠른 개선:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "사용자 스토리",
                          "기술 요구사항", 
                          "성공 지표",
                          "리스크 분석"
                        ].map((section) => (
                          <button
                            key={section}
                            onClick={() => sendChatMessage(`"${section}" 섹션을 개선해주세요.`)}
                            disabled={isLoading}
                            className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all text-xs font-medium disabled:opacity-50"
                          >
                            {section} 개선
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-10">
                    <div className="text-center">
                      <div className="text-4xl mb-4">📝</div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        PRD를 생성해보세요
                      </h3>
                      <p className="text-gray-600 text-sm">
                        왼쪽 폼을 작성하고 'PRD 생성하기' 버튼을 클릭하세요
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Messages */}
              {chatMessages.length > 0 && (
                <div className="mt-5 bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
                  <h3 className="text-base font-bold text-gray-900 mb-3">개선 기록</h3>
                  <div className="space-y-3 max-h-56 overflow-y-auto">
                    {chatMessages.map((message, index) => (
                      <div key={index} className={`flex gap-2.5 ${message.role === 'user' ? 'justify-end' : ''}`}>
                        <div className={`max-w-[80%] p-2.5 rounded-xl ${
                          message.role === 'user' 
                            ? 'bg-blue-100 text-blue-900 ml-auto' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <div className="text-xs font-medium mb-1">
                            {message.role === 'user' ? '사용자' : 'AI'}
                          </div>
                          <div className="text-xs">{message.content}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}