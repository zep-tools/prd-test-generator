import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PRDInput } from "@/types";

const DEFAULT_PRD_PROMPT = `당신은 숙련된 제품 관리자입니다. 다음 정보를 바탕으로 상세한 PRD(제품 요구사항 문서)를 작성해주세요.

제목: {title}
목표: {objectives}
주요 기능: {features}
타겟 사용자: {targetAudience}
제약사항: {constraints}

다음 형식으로 PRD를 작성해주세요:

## 1. 개요
### 1.1 제품 비전
### 1.2 핵심 가치

## 2. 목표 및 성공 지표
### 2.1 비즈니스 목표
### 2.2 성공 지표 (KPIs)

## 3. 사용자 스토리
### 3.1 주요 사용자 페르소나
### 3.2 사용자 시나리오

## 4. 기능 요구사항
### 4.1 필수 기능 (MVP)
### 4.2 추가 기능

## 5. 비기능 요구사항
### 5.1 성능 요구사항
### 5.2 보안 요구사항
### 5.3 사용성 요구사항

## 6. 제약사항 및 리스크
### 6.1 기술적 제약사항
### 6.2 비즈니스 제약사항
### 6.3 주요 리스크 및 대응 방안

## 7. 일정 및 마일스톤
### 7.1 개발 단계
### 7.2 주요 마일스톤

## 8. 부록
### 8.1 용어 정의
### 8.2 참고 자료`;

export async function POST(request: NextRequest) {
  try {
    const { customPrompt, ...prdInput } = await request.json();
    const body: PRDInput = prdInput;
    
    let text = "";
    
    // Gemini API 키 확인
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const hasGeminiKey = geminiApiKey && geminiApiKey !== "your-gemini-api-key";
    
    if (hasGeminiKey) {
      // Gemini API 사용
      try {
        // 커스텀 프롬프트가 있으면 사용, 없으면 기본 프롬프트 사용
        const promptTemplate = customPrompt || DEFAULT_PRD_PROMPT;
        
        // 프롬프트 생성
        const prompt = promptTemplate
          .replace("{title}", body.title)
          .replace("{objectives}", body.objectives)
          .replace("{features}", body.features.filter(f => f).join(", "))
          .replace("{targetAudience}", body.targetAudience)
          .replace("{constraints}", body.constraints || "없음");

        console.log("=== Gemini API Request ===");
        console.log("Input:", body);
        console.log("Prompt length:", prompt.length);
        console.log("First 200 chars of prompt:", prompt.substring(0, 200));

        // Gemini 초기화 및 PRD 생성
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        text = response.text();
        
        console.log("=== Gemini API Response ===");
        console.log("Response length:", text.length);
        console.log("First 200 chars:", text.substring(0, 200));
      } catch (aiError) {
        console.error("Gemini API Error:", aiError);
        // API 호출 실패 시 Mock 데이터로 대체
        text = generateMockPRD(body);
      }
    } else {
      // OpenAI API 키 확인
      const openaiApiKey = process.env.OPENAI_API_KEY;
      const hasOpenAIKey = openaiApiKey && openaiApiKey !== "your-openai-api-key";
      
      if (hasOpenAIKey) {
        // OpenAI API 사용
        try {
          const prompt = DEFAULT_PRD_PROMPT
            .replace("{title}", body.title)
            .replace("{objectives}", body.objectives)
            .replace("{features}", body.features.filter(f => f).join(", "))
            .replace("{targetAudience}", body.targetAudience)
            .replace("{constraints}", body.constraints || "없음");

          const result = await generateText({
            model: openai("gpt-4-turbo-preview"),
            prompt: prompt,
            temperature: 0.7,
            maxTokens: 3000,
          });
          text = result.text;
        } catch (aiError) {
          console.error("OpenAI API Error:", aiError);
          text = generateMockPRD(body);
        }
      } else {
        // Mock 모드: API 키가 없을 때
        text = generateMockPRD(body);
      }
    }

    // 실제로는 DB에 저장
    const prdId = `prd_${Date.now()}`;
    
    return NextResponse.json({
      id: prdId,
      content: text,
      status: "draft",
      createdAt: new Date().toISOString(),
      aiProvider: hasGeminiKey ? "gemini" : "mock"
    });
  } catch (error) {
    console.error("Error generating PRD:", error);
    return NextResponse.json(
      { error: "PRD 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

function generateMockPRD(input: PRDInput): string {
  return `## 1. 개요
### 1.1 제품 비전
${input.title}는 ${input.targetAudience}를 위한 혁신적인 솔루션입니다.

### 1.2 핵심 가치
- 사용자 중심의 직관적인 인터페이스
- 높은 성능과 안정성
- 확장 가능한 아키텍처

## 2. 목표 및 성공 지표
### 2.1 비즈니스 목표
${input.objectives}

### 2.2 성공 지표 (KPIs)
- 사용자 만족도 90% 이상
- 일일 활성 사용자(DAU) 10,000명 달성
- 평균 세션 시간 15분 이상

## 3. 사용자 스토리
### 3.1 주요 사용자 페르소나
**타겟 사용자**: ${input.targetAudience}

### 3.2 사용자 시나리오
사용자는 다음과 같은 작업을 수행할 수 있어야 합니다:
${input.features.filter(f => f).map((f, i) => `${i + 1}. ${f}`).join('\n')}

## 4. 기능 요구사항
### 4.1 필수 기능 (MVP)
${input.features.filter(f => f).map((f, i) => `- **기능 ${i + 1}**: ${f}`).join('\n')}

### 4.2 추가 기능
- 고급 분석 대시보드
- 다국어 지원
- 모바일 앱 연동

## 5. 비기능 요구사항
### 5.1 성능 요구사항
- 페이지 로딩 시간 3초 이내
- 동시 사용자 1,000명 이상 지원
- 99.9% 가용성

### 5.2 보안 요구사항
- HTTPS 암호화 통신
- OAuth 2.0 인증
- GDPR 준수

### 5.3 사용성 요구사항
- 반응형 웹 디자인
- 웹 접근성 WCAG 2.1 Level AA 준수
- 직관적인 네비게이션

## 6. 제약사항 및 리스크
### 6.1 기술적 제약사항
${input.constraints || "특별한 제약사항 없음"}

### 6.2 비즈니스 제약사항
- 개발 기간: 3개월
- 예산: 제한적

### 6.3 주요 리스크 및 대응 방안
- **리스크 1**: 기술적 복잡도 → 단계적 구현
- **리스크 2**: 사용자 채택률 → 베타 테스트 진행

## 7. 일정 및 마일스톤
### 7.1 개발 단계
- **Phase 1** (4주): 기획 및 설계
- **Phase 2** (8주): 개발 및 구현
- **Phase 3** (4주): 테스트 및 배포

### 7.2 주요 마일스톤
- M1: 프로토타입 완성
- M2: MVP 출시
- M3: 정식 버전 출시

## 8. 부록
### 8.1 용어 정의
- MVP: Minimum Viable Product (최소 기능 제품)
- KPI: Key Performance Indicator (핵심 성과 지표)

### 8.2 참고 자료
- 시장 조사 보고서
- 경쟁사 분석 자료

---
*이 문서는 Mock 데이터로 생성되었습니다. 실제 AI API를 사용하려면 .env.local 파일에 유효한 OPENAI_API_KEY를 설정하세요.*`;
}