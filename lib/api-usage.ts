// API 사용량 추적 유틸리티

export interface ApiUsage {
  service: string; // 'gemini' | 'github' | 'openai'
  endpoint: string; // 'prd-generation' | 'pr-analysis' | 'test-cases'
  tokensUsed?: number;
  requestCount: number;
  lastUsed: string;
  errorCount: number;
  totalCost?: number; // 예상 비용 (USD)
}

export interface DailyUsage {
  date: string; // YYYY-MM-DD
  usage: ApiUsage[];
}

export const API_USAGE_STORAGE_KEY = "api_usage_tracking";

// localStorage에서 사용량 데이터 가져오기
export function getApiUsage(): DailyUsage[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(API_USAGE_STORAGE_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// localStorage에 사용량 데이터 저장
export function saveApiUsage(usageData: DailyUsage[]): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(API_USAGE_STORAGE_KEY, JSON.stringify(usageData));
}

// API 사용량 기록
export function trackApiUsage(
  service: string,
  endpoint: string,
  tokensUsed: number = 0,
  isError: boolean = false,
  cost: number = 0
): void {
  if (typeof window === 'undefined') return;
  
  const today = new Date().toISOString().split('T')[0];
  const usageData = getApiUsage();
  
  // 오늘 데이터 찾기 또는 생성
  let todayData = usageData.find(u => u.date === today);
  if (!todayData) {
    todayData = {
      date: today,
      usage: []
    };
    usageData.push(todayData);
  }
  
  // 같은 서비스/엔드포인트 찾기 또는 생성
  let serviceUsage = todayData.usage.find(u => u.service === service && u.endpoint === endpoint);
  if (!serviceUsage) {
    serviceUsage = {
      service,
      endpoint,
      tokensUsed: 0,
      requestCount: 0,
      lastUsed: new Date().toISOString(),
      errorCount: 0,
      totalCost: 0
    };
    todayData.usage.push(serviceUsage);
  }
  
  // 사용량 업데이트
  serviceUsage.requestCount += 1;
  serviceUsage.tokensUsed = (serviceUsage.tokensUsed || 0) + tokensUsed;
  serviceUsage.lastUsed = new Date().toISOString();
  serviceUsage.totalCost = (serviceUsage.totalCost || 0) + cost;
  
  if (isError) {
    serviceUsage.errorCount += 1;
  }
  
  // 최근 30일만 유지
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const filteredData = usageData.filter(u => new Date(u.date) >= thirtyDaysAgo);
  
  saveApiUsage(filteredData);
}

// 토큰 수 추정 (대략적인 계산)
export function estimateTokens(text: string): number {
  // 대략적으로 1 토큰 = 4글자로 계산 (영어 기준)
  // 한글의 경우 더 정확한 계산이 필요하지만 간단한 추정
  return Math.ceil(text.length / 3);
}

// 비용 계산 (Gemini 기준)
export function calculateGeminiCost(tokensUsed: number): number {
  // Gemini 1.5 Flash 가격 기준 (2024년)
  // Input: $0.075 per 1M tokens
  // Output: $0.30 per 1M tokens
  // 간단하게 평균적으로 input:output = 3:1 비율로 가정
  const inputTokens = tokensUsed * 0.75;
  const outputTokens = tokensUsed * 0.25;
  
  const inputCost = (inputTokens / 1000000) * 0.075;
  const outputCost = (outputTokens / 1000000) * 0.30;
  
  return inputCost + outputCost;
}

// GitHub API 비용 (무료 한도 체크용)
export function calculateGithubCost(requestCount: number): number {
  // GitHub API는 시간당 5,000 요청까지 무료
  // 초과시 추가 요금이 있지만 일반적으로는 무료
  return 0;
}

// 전체 사용량 요약
export function getUsageSummary(): {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  byService: Record<string, {
    requests: number;
    tokens: number;
    cost: number;
    errors: number;
  }>;
  byEndpoint: Record<string, {
    requests: number;
    tokens: number;
    cost: number;
    errors: number;
  }>;
} {
  const usageData = getApiUsage();
  const summary = {
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    byService: {} as Record<string, any>,
    byEndpoint: {} as Record<string, any>
  };
  
  usageData.forEach(dailyUsage => {
    dailyUsage.usage.forEach(usage => {
      summary.totalRequests += usage.requestCount;
      summary.totalTokens += usage.tokensUsed || 0;
      summary.totalCost += usage.totalCost || 0;
      
      // 서비스별 집계
      if (!summary.byService[usage.service]) {
        summary.byService[usage.service] = {
          requests: 0,
          tokens: 0,
          cost: 0,
          errors: 0
        };
      }
      summary.byService[usage.service].requests += usage.requestCount;
      summary.byService[usage.service].tokens += usage.tokensUsed || 0;
      summary.byService[usage.service].cost += usage.totalCost || 0;
      summary.byService[usage.service].errors += usage.errorCount;
      
      // 엔드포인트별 집계
      if (!summary.byEndpoint[usage.endpoint]) {
        summary.byEndpoint[usage.endpoint] = {
          requests: 0,
          tokens: 0,
          cost: 0,
          errors: 0
        };
      }
      summary.byEndpoint[usage.endpoint].requests += usage.requestCount;
      summary.byEndpoint[usage.endpoint].tokens += usage.tokensUsed || 0;
      summary.byEndpoint[usage.endpoint].cost += usage.totalCost || 0;
      summary.byEndpoint[usage.endpoint].errors += usage.errorCount;
    });
  });
  
  return summary;
}

// 사용량 데이터 초기화
export function resetApiUsage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(API_USAGE_STORAGE_KEY);
}