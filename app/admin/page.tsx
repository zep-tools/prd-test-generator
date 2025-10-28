"use client";

import { useState, useEffect } from "react";
import { PromptTemplate, PromptHistory } from "@/types";
import { 
  getStoredPrompts, 
  savePrompts, 
  PROMPT_STORAGE_KEY,
  addPromptToHistory,
  getPromptHistoryByType,
  deletePromptHistory,
  restorePromptFromHistory
} from "@/lib/prompts";
import { getUsageSummary, resetApiUsage } from "@/lib/api-usage";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"prompts" | "settings">("prompts");
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<string>("");
  const [changeNote, setChangeNote] = useState<string>("");
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [usageSummary, setUsageSummary] = useState<any>(null);
  const [promptHistory, setPromptHistory] = useState<PromptHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<PromptHistory | null>(null);

  const defaultPrompts: PromptTemplate[] = [
    {
      id: "prd_default",
      name: "PRD 생성 기본 템플릿",
      type: "prd_generation",
      content: "당신은 숙련된 제품 관리자입니다. 다음 정보를 바탕으로 상세한 PRD를 작성해주세요...",
      description: "PRD 초안 생성에 사용되는 기본 프롬프트",
      isActive: true,
      version: 1
    },
    {
      id: "test_default",
      name: "테스트 케이스 생성 기본 템플릿",
      type: "test_case_generation",
      content: "당신은 숙련된 QA 엔지니어입니다. 다음 정보를 바탕으로 테스트 케이스를 생성해주세요...",
      description: "테스트 케이스 생성에 사용되는 기본 프롬프트",
      isActive: true,
      version: 1
    },
    {
      id: "chat_default",
      name: "PRD 수정 채팅 템플릿",
      type: "chat_refinement",
      content: "현재 PRD를 다음 요청사항에 맞게 수정해주세요...",
      description: "PRD 대화형 수정에 사용되는 프롬프트",
      isActive: true,
      version: 1
    },
    {
      id: "github_default",
      name: "GitHub PR 분석 템플릿",
      type: "github_pr_analysis",
      content: "당신은 숙련된 시니어 개발자이자 코드 리뷰어입니다. 다음 GitHub PR을 매우 상세하게 분석해주세요...",
      description: "GitHub PR을 상세하게 분석하는 프롬프트",
      isActive: true,
      version: 1
    }
  ];

  useEffect(() => {
    const storedPrompts = getStoredPrompts();
    if (storedPrompts.length > 0) {
      setPrompts(storedPrompts);
    } else {
      setPrompts(defaultPrompts);
      savePrompts(defaultPrompts);
    }
    loadUsageSummary();
  }, []);

  useEffect(() => {
    if (selectedPrompt) {
      const history = getPromptHistoryByType(selectedPrompt.id);
      setPromptHistory(history);
    }
  }, [selectedPrompt]);

  const loadUsageSummary = () => {
    setUsageSummary(getUsageSummary());
  };

  const handleResetUsage = () => {
    if (confirm("API 사용량 데이터를 초기화하시겠습니까?")) {
      resetApiUsage();
      loadUsageSummary();
      alert("사용량 데이터가 초기화되었습니다.");
    }
  };

  const savePrompt = async () => {
    if (!selectedPrompt || !editingPrompt.trim()) return;
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedPrompt = {
        ...selectedPrompt,
        content: editingPrompt,
        version: selectedPrompt.version + 1
      };
      
      // 히스토리에 추가
      addPromptToHistory(updatedPrompt, changeNote);
      
      // 프롬프트 업데이트
      const updatedPrompts = prompts.map(p => 
        p.id === selectedPrompt.id ? updatedPrompt : p
      );
      setPrompts(updatedPrompts);
      savePrompts(updatedPrompts);
      setSelectedPrompt(updatedPrompt);
      
      // 히스토리 새로고침
      const newHistory = getPromptHistoryByType(selectedPrompt.id);
      setPromptHistory(newHistory);
      
      setChangeNote("");
      alert("프롬프트가 저장되었습니다. (버전 " + updatedPrompt.version + ")");
    } catch (error) {
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const restoreFromHistory = (historyItem: PromptHistory) => {
    if (!confirm(`버전 ${historyItem.version}으로 복원하시겠습니까?`)) return;
    
    setEditingPrompt(historyItem.content);
    setChangeNote(`버전 ${historyItem.version}으로 복원`);
    setSelectedHistoryItem(historyItem);
    setShowHistory(false);
  };

  const deleteHistoryItem = (historyId: string) => {
    if (!confirm("이 버전을 삭제하시겠습니까?")) return;
    
    deletePromptHistory(historyId);
    if (selectedPrompt) {
      const newHistory = getPromptHistoryByType(selectedPrompt.id);
      setPromptHistory(newHistory);
    }
  };

  const testPrompt = async () => {
    if (!selectedPrompt || !testInput) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/test-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptTemplate: editingPrompt,
          testInput: testInput,
          promptType: selectedPrompt.type
        })
      });
      const data = await response.json();
      setTestResult(data.result);
    } catch (error) {
      alert("테스트 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            관리자 페이지
          </h1>
          <p className="text-gray-600">시스템 설정 및 프롬프트 관리</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <nav className="flex">
            <button
              onClick={() => setActiveTab("prompts")}
              className={`flex-1 py-4 px-6 text-center font-medium text-sm rounded-l-xl transition-all ${
                activeTab === "prompts"
                  ? "bg-blue-50 text-blue-600 border-b-2 border-blue-500"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                프롬프트 관리
              </div>
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 py-4 px-6 text-center font-medium text-sm rounded-r-xl transition-all ${
                activeTab === "settings"
                  ? "bg-blue-50 text-blue-600 border-b-2 border-blue-500"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                시스템 설정
              </div>
            </button>
          </nav>
        </div>

        {activeTab === "prompts" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h2 className="text-lg font-semibold text-gray-900">프롬프트 템플릿</h2>
                </div>
                <div className="space-y-3">
                  {prompts.map(prompt => (
                    <button
                      key={prompt.id}
                      onClick={() => {
                        setSelectedPrompt(prompt);
                        setEditingPrompt(prompt.content);
                        setShowHistory(false);
                        setChangeNote("");
                      }}
                      className={`w-full text-left p-4 border rounded-xl hover:shadow-sm transition-all ${
                        selectedPrompt?.id === prompt.id 
                          ? "border-blue-300 bg-blue-50 shadow-sm" 
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-medium text-gray-900 mb-1">{prompt.name}</div>
                      <div className="text-sm text-gray-600 mb-2">{prompt.description}</div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                          v{prompt.version}
                        </span>
                        <span className="text-gray-500">{prompt.type.replace('_', ' ')}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              {selectedPrompt ? (
                <div className="space-y-6">
                  {/* 프롬프트 편집 섹션 */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold">프롬프트 편집</h2>
                      <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        버전 히스토리 ({promptHistory.length})
                      </button>
                    </div>

                    {selectedHistoryItem && (
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="text-sm text-yellow-800">
                          버전 {selectedHistoryItem.version}으로 복원됨 
                          <span className="text-xs text-yellow-600 ml-2">
                            ({formatDate(selectedHistoryItem.savedAt)})
                          </span>
                        </div>
                      </div>
                    )}

                    <textarea
                      className="w-full h-64 p-3 border rounded-lg font-mono text-sm"
                      value={editingPrompt}
                      onChange={(e) => setEditingPrompt(e.target.value)}
                    />
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        변경 사항 메모 (선택사항)
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded-lg text-sm"
                        value={changeNote}
                        onChange={(e) => setChangeNote(e.target.value)}
                        placeholder="예: 응답 형식 개선, 더 상세한 분석 추가..."
                      />
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={savePrompt}
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        저장 (v{selectedPrompt.version + 1})
                      </button>
                      <button
                        onClick={() => {
                          setEditingPrompt(selectedPrompt.content);
                          setSelectedHistoryItem(null);
                          setChangeNote("");
                        }}
                        className="px-4 py-2 border rounded-md hover:bg-gray-50"
                      >
                        현재 버전으로 초기화
                      </button>
                    </div>
                  </div>

                  {/* 버전 히스토리 섹션 */}
                  {showHistory && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <h3 className="text-lg font-semibold mb-4">버전 히스토리</h3>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {promptHistory.length > 0 ? (
                          promptHistory.map((history) => (
                            <div
                              key={history.id}
                              className="p-4 border rounded-lg hover:bg-gray-50"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <span className="font-medium text-gray-900">
                                    버전 {history.version}
                                  </span>
                                  <span className="text-sm text-gray-500 ml-2">
                                    {formatDate(history.savedAt)}
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => restoreFromHistory(history)}
                                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                  >
                                    복원
                                  </button>
                                  <button
                                    onClick={() => deleteHistoryItem(history.id)}
                                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                                  >
                                    삭제
                                  </button>
                                </div>
                              </div>
                              {history.changeNote && (
                                <div className="text-sm text-gray-600 italic">
                                  "{history.changeNote}"
                                </div>
                              )}
                              <div className="mt-2">
                                <details className="cursor-pointer">
                                  <summary className="text-sm text-gray-500 hover:text-gray-700">
                                    내용 미리보기
                                  </summary>
                                  <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono overflow-x-auto">
                                    {history.content.substring(0, 300)}...
                                  </div>
                                </details>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-gray-500 py-8">
                            아직 저장된 버전이 없습니다
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 프롬프트 테스트 섹션 */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold mb-4">프롬프트 테스트</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">테스트 입력</label>
                        <textarea
                          className="w-full h-32 p-3 border rounded-lg"
                          value={testInput}
                          onChange={(e) => setTestInput(e.target.value)}
                          placeholder={
                            selectedPrompt.type === "prd_generation"
                              ? "제목: 사용자 대시보드\n목표: 데이터 시각화 개선\n기능: 차트, 필터, 내보내기"
                              : "테스트할 내용을 입력하세요"
                          }
                        />
                      </div>
                      <button
                        onClick={testPrompt}
                        disabled={isLoading || !testInput}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                      >
                        테스트 실행
                      </button>
                      {testResult && (
                        <div>
                          <label className="block text-sm font-medium mb-2">테스트 결과</label>
                          <div className="p-4 bg-gray-50 border rounded-lg">
                            <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
                  <div className="text-center text-gray-500">
                    프롬프트를 선택하여 편집하세요
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">시스템 설정</h2>
              <p className="text-gray-600 mt-2">API 사용량 모니터링 및 시스템 구성</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">API 사용량 통계</h3>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={loadUsageSummary}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    새로고침
                  </button>
                  <button
                    onClick={handleResetUsage}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    초기화
                  </button>
                </div>
              </div>
              
              {usageSummary ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl shadow-sm hover:shadow-md transition-all">
                      <div className="text-2xl font-bold text-blue-700 mb-1">
                        {usageSummary.totalRequests.toLocaleString()}
                      </div>
                      <div className="text-sm font-medium text-blue-600">총 요청 수</div>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl shadow-sm hover:shadow-md transition-all">
                      <div className="text-2xl font-bold text-green-700 mb-1">
                        {usageSummary.totalTokens.toLocaleString()}
                      </div>
                      <div className="text-sm font-medium text-green-600">총 토큰 수</div>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl shadow-sm hover:shadow-md transition-all">
                      <div className="text-2xl font-bold text-purple-700 mb-1">
                        ${usageSummary.totalCost.toFixed(4)}
                      </div>
                      <div className="text-sm font-medium text-purple-600">총 비용</div>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl shadow-sm hover:shadow-md transition-all">
                      <div className="text-2xl font-bold text-yellow-700 mb-1">
                        {Object.values(usageSummary.byService).reduce((sum: number, service: any) => sum + service.errors, 0)}
                      </div>
                      <div className="text-sm font-medium text-yellow-600">오류 수</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-gray-800 mb-4">서비스별 사용량</h4>
                      <div className="space-y-4">
                        {Object.entries(usageSummary.byService).map(([service, data]: [string, any]) => (
                          <div key={service} className="p-4 bg-white rounded-lg border shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-gray-800 capitalize">{service}</span>
                              <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                                {data.requests} 요청
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div className="text-center">
                                <div className="font-bold text-blue-600">{data.tokens.toLocaleString()}</div>
                                <div className="text-gray-500 text-xs">토큰</div>
                              </div>
                              <div className="text-center">
                                <div className="font-bold text-green-600">${data.cost.toFixed(4)}</div>
                                <div className="text-gray-500 text-xs">비용</div>
                              </div>
                              <div className="text-center">
                                <div className="font-bold text-red-600">{data.errors}</div>
                                <div className="text-gray-500 text-xs">오류</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-gray-800 mb-4">기능별 사용량</h4>
                      <div className="space-y-4">
                        {Object.entries(usageSummary.byEndpoint).map(([endpoint, data]: [string, any]) => (
                          <div key={endpoint} className="p-4 bg-white rounded-lg border shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-gray-800">{endpoint.replace(/-/g, ' ')}</span>
                              <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                                {data.requests} 요청
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div className="text-center">
                                <div className="font-bold text-blue-600">{data.tokens.toLocaleString()}</div>
                                <div className="text-gray-500 text-xs">토큰</div>
                              </div>
                              <div className="text-center">
                                <div className="font-bold text-green-600">${data.cost.toFixed(4)}</div>
                                <div className="text-gray-500 text-xs">비용</div>
                              </div>
                              <div className="text-center">
                                <div className="font-bold text-red-600">{data.errors}</div>
                                <div className="text-gray-500 text-xs">오류</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-600 mb-2">아직 API 사용 기록이 없습니다</h3>
                    <p className="text-sm text-gray-500">AI 기능을 사용하시면 여기에 사용량 통계가 표시됩니다</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">모델 설정</h3>
              </div>
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">AI 모델 선택</label>
                    <select className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash (현재 사용중)</option>
                      <option value="gpt-4">GPT-4 Turbo</option>
                      <option value="gpt-3.5">GPT-3.5 Turbo</option>
                      <option value="claude">Claude 3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Temperature (창의성)</label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        defaultValue="70"
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500 font-medium">
                        <span>정확함 (0)</span>
                        <span>창의적 (1)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <label className="block text-sm font-bold text-gray-700 mb-3">최대 토큰 수</label>
                  <input
                    type="number"
                    defaultValue="3000"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="3000"
                  />
                  <p className="text-xs text-gray-500 mt-2">응답에서 생성할 최대 토큰 수를 설정합니다</p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 01-2 2m2-2h.01M9 11h.01M12 3C8.686 3 6 5.686 6 9s2.686 6 6 6c1.416 0 2.71-.492 3.733-1.313L21 19l-1.313-5.267C21.508 11.71 21 10.416 21 9c0-3.314-2.686-6-6-6z" />
                    </svg>
                    <label className="block text-sm font-bold text-yellow-800">API 키 관리</label>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Gemini API Key</label>
                      <input
                        type="password"
                        placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className="w-full p-3 border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">GitHub Token</label>
                      <input
                        type="password"
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className="w-full p-3 border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all bg-white"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-yellow-700 mt-3">⚠️ API 키는 안전하게 관리되며 브라우저에만 저장됩니다</p>
                </div>

                <div className="flex justify-end pt-4">
                  <button className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl font-medium">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    설정 저장
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}