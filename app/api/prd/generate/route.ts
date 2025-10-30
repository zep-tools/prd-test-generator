import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PRDInput } from "@/types";

const DEFAULT_PRD_PROMPT = `당신은 숙련된 제품 관리자입니다. 다음 정보를 바탕으로 읽기 쉽고 체계적인 PRD(제품 요구사항 문서)를 작성해주세요.

**프로젝트 정보:**
- 제목: {title}
- 목표: {objectives}
- 주요 기능: {features}
- 타겟 사용자: {targetAudience}
- 제약사항: {constraints}

**중요 작성 지침:**
1. 마크다운 문법을 정확히 사용하세요
2. 각 섹션 사이에 충분한 공백(빈 줄)을 추가하세요
3. 중요한 내용은 **굵은 글씨**로 강조하세요
4. 리스트는 깔끔하게 정리하고 들여쓰기를 활용하세요
5. 표(Table)를 활용하여 정보를 시각적으로 정리하세요
6. 코드블록, 인용구 등을 적절히 활용하세요

다음 형식으로 PRD를 작성해주세요:

---

# 📋 제품 요구사항 문서 (PRD)

**프로젝트명:** {title}  
**작성일:** ${new Date().toLocaleDateString('ko-KR')}  
**버전:** 1.0

---

## 📌 Executive Summary

> 이 섹션에서는 프로젝트의 핵심을 **한 문단**으로 명확하게 요약하세요.
> 경영진이 빠르게 이해할 수 있도록 핵심 가치와 예상 임팩트를 포함하세요.

---

## 1. 🎯 프로젝트 개요

### 1.1 배경 및 목적

**배경:**
- 현재 상황과 문제점을 구체적으로 설명
- 왜 이 프로젝트가 필요한지 명확히 제시

**목적:**
- {objectives}를 바탕으로 구체적인 목적 작성
- 달성하고자 하는 핵심 가치 명시

### 1.2 제품 비전

> "사용자에게 어떤 가치를 제공할 것인가?"

- **단기 목표 (3개월):** 
- **중기 목표 (6개월):** 
- **장기 목표 (1년):** 

---

## 2. 📊 목표 및 성공 지표

### 2.1 비즈니스 목표

| 구분 | 목표 | 측정 방법 | 목표치 |
|------|------|-----------|--------|
| **정량적 목표** | | | |
| **정성적 목표** | | | |

### 2.2 핵심 성과 지표 (KPIs)

- **📈 사용자 지표**
  - DAU (일일 활성 사용자)
  - MAU (월간 활성 사용자)
  - 리텐션율

- **💰 비즈니스 지표**
  - 수익 증가율
  - 비용 절감률
  - ROI

---

## 3. 👥 사용자 분석

### 3.1 타겟 사용자

**주요 타겟:** {targetAudience}

#### 페르소나 1
- **이름/역할:** 
- **니즈:** 
- **페인포인트:** 
- **기대사항:** 

### 3.2 사용자 여정 (User Journey)

\`\`\`
[인지] → [관심] → [사용] → [습관화] → [공유]
\`\`\`

각 단계별 상세 설명...

---

## 4. 🔧 기능 요구사항

### 4.1 핵심 기능 (MVP)

{features}를 바탕으로 다음과 같이 구체화:

#### ✅ 기능 1: [기능명]
- **설명:** 상세한 기능 설명
- **사용자 스토리:** As a [user], I want to [action] so that [benefit]
- **수용 기준:**
  - [ ] 기준 1
  - [ ] 기준 2
  - [ ] 기준 3

#### ✅ 기능 2: [기능명]
(동일한 형식으로 작성)

### 4.2 추가 기능 (Nice to Have)

| 우선순위 | 기능명 | 설명 | 예상 공수 |
|----------|--------|------|-----------|
| P1 | | | |
| P2 | | | |
| P3 | | | |

---

## 5. 💻 기술 요구사항

### 5.1 성능 요구사항

- **응답 시간:** < 200ms (95 percentile)
- **동시 접속자:** 10,000명 이상
- **가용성:** 99.9% SLA

### 5.2 보안 요구사항

- ✅ HTTPS 암호화
- ✅ 사용자 인증/인가
- ✅ 데이터 암호화
- ✅ GDPR 준수

### 5.3 호환성

- **브라우저:** Chrome, Safari, Firefox, Edge (최신 2개 버전)
- **디바이스:** Desktop, Tablet, Mobile
- **OS:** Windows, macOS, iOS, Android

---

## 6. ⚠️ 제약사항 및 리스크

### 6.1 제약사항

**기술적 제약:**
{constraints}

**비즈니스 제약:**
- 예산:
- 일정:
- 리소스:

### 6.2 리스크 분석

| 리스크 | 발생 가능성 | 영향도 | 대응 방안 |
|--------|------------|--------|-----------|
| | 높음/중간/낮음 | 높음/중간/낮음 | |

---

## 7. 📅 일정 및 마일스톤

### 7.1 프로젝트 타임라인

\`\`\`
Phase 1: 기획 및 설계 (2주)
├── 요구사항 분석
├── 기술 설계
└── UI/UX 디자인

Phase 2: 개발 (6주)
├── Sprint 1: 핵심 기능 개발
├── Sprint 2: 추가 기능 개발
└── Sprint 3: 통합 및 최적화

Phase 3: 테스트 및 배포 (2주)
├── QA 테스트
├── UAT
└── 프로덕션 배포
\`\`\`

### 7.2 주요 마일스톤

- **M1:** 프로토타입 완성 (2주차)
- **M2:** MVP 개발 완료 (8주차)
- **M3:** 정식 출시 (10주차)

---

## 8. 📚 부록

### 8.1 용어 정의

| 용어 | 설명 |
|------|------|
| MVP | Minimum Viable Product (최소 기능 제품) |
| KPI | Key Performance Indicator (핵심 성과 지표) |
| UAT | User Acceptance Testing (사용자 수용 테스트) |

### 8.2 참고 자료

- 📎 [관련 문서 링크]
- 📎 [디자인 목업]
- 📎 [기술 스펙]

---

*이 문서는 지속적으로 업데이트됩니다.*`;

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    console.log("=== RAW Request Data ===");
    console.log("Full request data:", JSON.stringify(requestData, null, 2));
    
    const { customPrompt, ...prdInput } = requestData;
    const body: PRDInput = prdInput;
    
    console.log("=== Parsed PRD Input ===");
    console.log("Title:", body.title);
    console.log("Objectives:", body.objectives);
    console.log("Features:", body.features);
    console.log("Target Audience:", body.targetAudience);
    console.log("Constraints:", body.constraints);
    console.log("Custom Prompt length:", customPrompt ? customPrompt.length : "No custom prompt");
    
    let text = "";
    
    // API 키 확인 (함수 상단에서 한 번만 선언)
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const hasGeminiKey = geminiApiKey && geminiApiKey !== "your-gemini-api-key";
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const hasOpenAIKey = openaiApiKey && openaiApiKey !== "your-openai-api-key";

    // API 키가 없는 경우 명확한 에러 메시지 반환
    if (!hasGeminiKey && !hasOpenAIKey) {
      console.error("No AI API keys configured");
      return NextResponse.json(
        {
          error: "AI API 키가 설정되지 않았습니다",
          details: "GEMINI_API_KEY 또는 OPENAI_API_KEY를 .env.local 파일에 설정해주세요."
        },
        { status: 400 }
      );
    }

    if (hasGeminiKey) {
      // Gemini API 사용
      try {
        // 커스텀 프롬프트가 있으면 사용, 없으면 기본 프롬프트 사용
        // 단, 커스텀 프롬프트에 placeholder가 없으면 기본 프롬프트 사용
        let promptTemplate = customPrompt || DEFAULT_PRD_PROMPT;
        
        // 프롬프트에 필수 placeholder가 있는지 확인
        const hasPlaceholders = promptTemplate.includes("{title}") && 
                              promptTemplate.includes("{objectives}") && 
                              promptTemplate.includes("{features}");
        
        if (customPrompt && !hasPlaceholders) {
          console.log("WARNING: Custom prompt doesn't have required placeholders, using default");
          promptTemplate = DEFAULT_PRD_PROMPT;
        }
        
        console.log("=== Using Prompt Template ===");
        console.log("Template type:", customPrompt && hasPlaceholders ? "Custom" : "Default");
        console.log("Has placeholders:", hasPlaceholders);
        console.log("Template first 500 chars:", promptTemplate.substring(0, 500));
        
        // 프롬프트 생성 - replaceAll 사용하여 모든 placeholder 치환
        const prompt = promptTemplate
          .replaceAll("{title}", body.title || "")
          .replaceAll("{objectives}", body.objectives || "")
          .replaceAll("{features}", body.features?.filter(f => f).join(", ") || "")
          .replaceAll("{targetAudience}", body.targetAudience || "")
          .replaceAll("{constraints}", body.constraints || "없음");

        console.log("=== Final Prompt After Replacement ===");
        console.log("Prompt length:", prompt.length);
        console.log("First 500 chars of final prompt:", prompt.substring(0, 500));

        // Gemini 초기화 및 PRD 생성
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ 
          model: "gemini-1.5-flash",
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        });
        
        // 마크다운 형식 강조를 위한 추가 지시사항
        const enhancedPrompt = prompt + "\n\n**반드시 위의 템플릿 형식을 따르고, 마크다운 문법(헤더, 굵은 글씨, 표, 리스트, 코드블록 등)을 적극 활용하여 가독성 높은 문서를 작성하세요. 이모지를 적절히 사용하여 시각적으로 구분하기 쉽게 만드세요.**";
        
        // Retry logic for 503 errors
        let retries = 3;
        let lastError = null;
        
        while (retries > 0) {
          try {
            const result = await model.generateContent(enhancedPrompt);
            const response = await result.response;
            text = response.text();
            break; // Success, exit loop
          } catch (error: any) {
            lastError = error;
            console.log(`Gemini API error in PRD generation (${retries} retries left):`, error.message);
            
            // Check if it's a 503 overload error
            if (error.message?.includes("503") || error.message?.includes("overloaded")) {
              retries--;
              if (retries > 0) {
                // Wait before retry (exponential backoff)
                const waitTime = (4 - retries) * 2000; // 2s, 4s, 6s
                console.log(`Waiting ${waitTime}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
              }
            }
            
            // If not a 503 error or no retries left, throw the error
            throw error;
          }
        }
        
        if (!text && lastError) {
          throw lastError;
        }
        
        console.log("=== Gemini API Response ===");
        console.log("Response length:", text.length);
        console.log("First 200 chars:", text.substring(0, 200));
      } catch (aiError: any) {
        console.error("Gemini API Error:", aiError);

        // 구체적인 에러 메시지 반환
        let errorMessage = "Gemini API 호출 중 오류가 발생했습니다";

        if (aiError.message?.includes("API key")) {
          errorMessage = "Gemini API 키가 유효하지 않습니다. .env.local 파일의 GEMINI_API_KEY를 확인해주세요.";
        } else if (aiError.message?.includes("quota") || aiError.message?.includes("limit")) {
          errorMessage = "Gemini API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
        } else if (aiError.message?.includes("503") || aiError.message?.includes("overloaded")) {
          errorMessage = "Gemini API 서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.";
        } else if (aiError.message) {
          errorMessage = `Gemini API 오류: ${aiError.message}`;
        }

        return NextResponse.json(
          { error: errorMessage },
          { status: 500 }
        );
      }
    } else {
      // OpenAI API 사용 여부 확인
      if (hasOpenAIKey) {
        // OpenAI API 사용
        try {
          console.log("=== Using OpenAI API ===");
          let promptTemplate = customPrompt || DEFAULT_PRD_PROMPT;
          
          // 프롬프트에 필수 placeholder가 있는지 확인
          const hasPlaceholders = promptTemplate.includes("{title}") && 
                                promptTemplate.includes("{objectives}") && 
                                promptTemplate.includes("{features}");
          
          if (customPrompt && !hasPlaceholders) {
            console.log("WARNING: Custom prompt doesn't have required placeholders, using default");
            promptTemplate = DEFAULT_PRD_PROMPT;
          }
          
          const prompt = promptTemplate
            .replaceAll("{title}", body.title || "")
            .replaceAll("{objectives}", body.objectives || "")
            .replaceAll("{features}", body.features?.filter(f => f).join(", ") || "")
            .replaceAll("{targetAudience}", body.targetAudience || "")
            .replaceAll("{constraints}", body.constraints || "없음");
          
          console.log("OpenAI prompt first 500 chars:", prompt.substring(0, 500));

          const result = await generateText({
            model: openai("gpt-4-turbo-preview"),
            prompt: prompt,
            temperature: 0.7,
            maxTokens: 3000,
          });
          text = result.text;
        } catch (aiError: any) {
          console.error("OpenAI API Error:", aiError);

          // 구체적인 에러 메시지 반환
          let errorMessage = "OpenAI API 호출 중 오류가 발생했습니다";

          if (aiError.message?.includes("API key") || aiError.message?.includes("Incorrect API")) {
            errorMessage = "OpenAI API 키가 유효하지 않습니다. .env.local 파일의 OPENAI_API_KEY를 확인해주세요.";
          } else if (aiError.message?.includes("quota") || aiError.message?.includes("limit") || aiError.message?.includes("insufficient_quota")) {
            errorMessage = "OpenAI API 사용량 한도를 초과했습니다. 크레딧을 충전하거나 잠시 후 다시 시도해주세요.";
          } else if (aiError.message?.includes("rate_limit")) {
            errorMessage = "OpenAI API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
          } else if (aiError.message) {
            errorMessage = `OpenAI API 오류: ${aiError.message}`;
          }

          return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
          );
        }
      }
    }

    // 실제로는 DB에 저장
    const prdId = `prd_${Date.now()}`;
    
    // AI Provider 확인 (이미 위에서 선언된 변수 재사용)
    let aiProvider = "mock";
    if (hasGeminiKey) {
      aiProvider = "gemini";
    } else if (hasOpenAIKey) {
      aiProvider = "openai";
    }
    
    console.log("=== Response Info ===");
    console.log("AI Provider:", aiProvider);
    console.log("Content length:", text.length);
    console.log("PRD ID:", prdId);
    
    return NextResponse.json({
      id: prdId,
      content: text,
      status: "draft",
      createdAt: new Date().toISOString(),
      aiProvider: aiProvider
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