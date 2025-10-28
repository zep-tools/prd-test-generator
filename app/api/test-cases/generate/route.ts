import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const TEST_CASE_PROMPT = `당신은 숙련된 QA 엔지니어입니다. 다음 정보를 바탕으로 최소 10개 이상의 상세한 테스트 케이스를 생성해주세요.

{context}

요청된 테스트 유형: {testTypes}

**중요: 반드시 10개 이상의 테스트 케이스를 생성하세요!**

각 테스트 케이스는 다음 형식으로 작성해주세요:

테스트 케이스 1:
제목: [명확하고 구체적인 테스트 제목]
유형: [functional/edge_case/regression/integration/performance 중 하나]
설명: [테스트의 목적과 범위 설명]
테스트 단계:
1. [동작]: [구체적인 동작 설명] | [예상 결과]: [해당 단계의 예상 결과]
2. [동작]: [구체적인 동작 설명] | [예상 결과]: [해당 단계의 예상 결과]
3. [동작]: [구체적인 동작 설명] | [예상 결과]: [해당 단계의 예상 결과]
최종 예상 결과: [전체 테스트의 최종 예상 결과]

---

테스트 케이스 2:
제목: [명확하고 구체적인 테스트 제목]
유형: [functional/edge_case/regression/integration/performance 중 하나]
설명: [테스트의 목적과 범위 설명]
테스트 단계:
1. [동작]: [구체적인 동작 설명] | [예상 결과]: [해당 단계의 예상 결과]
2. [동작]: [구체적인 동작 설명] | [예상 결과]: [해당 단계의 예상 결과]
3. [동작]: [구체적인 동작 설명] | [예상 결과]: [해당 단계의 예상 결과]
최종 예상 결과: [전체 테스트의 최종 예상 결과]

---

(10개 이상 계속...)

다음 사항을 고려하여 테스트 케이스를 작성해주세요:
1. 정상 경로(Happy Path) 테스트 - 3개 이상
2. 경계값 및 예외 상황 테스트 - 3개 이상
3. 에러 처리 및 복구 시나리오 - 2개 이상
4. 성능 및 부하 테스트 - 1개 이상
5. 보안 관련 테스트 - 1개 이상

**주어진 PRD와 PR 분석 내용을 반드시 참고하여 관련된 테스트 케이스를 생성하세요!**`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prdContent = "", prAnalysisContent = "", figmaInfo = "", testTypes = ["functional"], customPrompt } = body;

    console.log("Test case generation request:", {
      hasPRD: !!prdContent,
      hasPRAnalysis: !!prAnalysisContent,
      hasFigmaInfo: !!figmaInfo,
      testTypes,
      hasCustomPrompt: !!customPrompt
    });

    let context = "";

    // PRD 내용이 있으면 추가
    if (prdContent) {
      context += "=== PRD 내용 ===\n";
      context += prdContent + "\n\n";
    }

    // PR 분석 내용이 있으면 추가
    if (prAnalysisContent) {
      context += "=== PR 분석 내용 ===\n";
      context += prAnalysisContent + "\n\n";
    }

    // Figma 디자인 정보가 있으면 추가
    if (figmaInfo) {
      context += "=== Figma 디자인 정보 ===\n";
      context += figmaInfo + "\n\n";
    }

    if (!context) {
      context = "일반적인 웹 애플리케이션 기능";
    }
    
    // 커스텀 프롬프트가 있으면 사용, 없으면 기본 프롬프트 사용
    let promptTemplate = customPrompt || TEST_CASE_PROMPT;
    
    // 프롬프트에 필수 placeholder가 있는지 확인
    const hasPlaceholders = promptTemplate.includes("{context}") && 
                          promptTemplate.includes("{testTypes}");
    
    if (customPrompt && !hasPlaceholders) {
      console.log("WARNING: Custom prompt doesn't have required placeholders, using default");
      promptTemplate = TEST_CASE_PROMPT;
    }
    
    // replaceAll 사용하여 모든 placeholder 치환
    const prompt = promptTemplate
      .replaceAll("{context}", context)
      .replaceAll("{testTypes}", testTypes.join(", "));
    
    console.log("=== Test Case Generation ===");
    console.log("Context length:", context.length);
    console.log("Test types:", testTypes);
    console.log("Prompt length:", prompt.length);
    
    // Gemini API 키 확인
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set");
      return NextResponse.json(
        { error: "API 키가 설정되지 않았습니다" },
        { status: 500 }
      );
    }
    
    // Gemini API 사용 with retry logic
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    });
    
    // 추가 지시사항 포함
    const enhancedPrompt = prompt + "\n\n**반드시 최소 10개 이상의 테스트 케이스를 생성하고, 제공된 PRD와 PR 분석 내용과 직접적으로 관련된 테스트를 작성하세요.**";
    
    let text = "";
    let retries = 3;
    let lastError = null;
    
    // Retry logic for 503 errors
    while (retries > 0) {
      try {
        const result = await model.generateContent(enhancedPrompt);
        text = result.response.text();
        break; // Success, exit loop
      } catch (error: any) {
        lastError = error;
        console.log(`Gemini API error (${retries} retries left):`, error.message);
        
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
    
    // 텍스트 파싱하여 구조화된 테스트 케이스로 변환
    const testCases = parseTestCases(text);
    
    return NextResponse.json({
      testCases,
      rawText: text
    });
    
  } catch (error: any) {
    console.error("Error generating test cases:", error);
    
    // 구체적인 에러 메시지 반환
    let errorMessage = "테스트 케이스 생성 중 오류가 발생했습니다";
    
    if (error.message?.includes("API key")) {
      errorMessage = "Gemini API 키가 유효하지 않습니다";
    } else if (error.message?.includes("quota")) {
      errorMessage = "API 사용량 한도를 초과했습니다";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

function parseTestCases(text: string) {
  const testCases = [];
  const caseBlocks = text.split(/테스트 케이스 \d+:|---/).filter(block => block.trim());
  
  for (const block of caseBlocks) {
    if (!block.includes("제목:")) continue;
    
    const lines = block.trim().split('\n');
    const testCase: any = {
      title: "",
      type: "functional",
      description: "",
      steps: [],
      expectedResult: ""
    };
    
    let currentSection = "";
    let stepsText = [];
    let inStepsSection = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith("제목:")) {
        testCase.title = trimmedLine.replace("제목:", "").trim();
      } else if (trimmedLine.startsWith("유형:")) {
        const type = trimmedLine.replace("유형:", "").trim().toLowerCase();
        if (["functional", "edge_case", "regression", "integration", "performance"].includes(type)) {
          testCase.type = type;
        }
      } else if (trimmedLine.startsWith("설명:")) {
        testCase.description = trimmedLine.replace("설명:", "").trim();
      } else if (trimmedLine.startsWith("테스트 단계:") || trimmedLine === "테스트 단계:") {
        inStepsSection = true;
      } else if (trimmedLine.startsWith("최종 예상 결과:")) {
        testCase.expectedResult = trimmedLine.replace("최종 예상 결과:", "").trim();
        inStepsSection = false;
      } else if (inStepsSection && trimmedLine) {
        stepsText.push(trimmedLine);
      }
    }
    
    // 테스트 단계 파싱
    for (const stepLine of stepsText) {
      // 형식 1: [동작]: ... | [예상 결과]: ...
      let match = stepLine.match(/^\d+\.\s*\[동작\]:\s*(.*?)\s*\|\s*\[예상 결과\]:\s*(.*)/);
      
      if (!match) {
        // 형식 2: 숫자. ... | ...
        match = stepLine.match(/^\d+\.\s*(.*?)\s*\|\s*(.*)/);
      }
      
      if (match) {
        testCase.steps.push({
          action: match[1].trim(),
          expectedResult: match[2].trim()
        });
      }
    }
    
    if (testCase.title && testCase.steps.length > 0) {
      testCase.id = `tc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      testCases.push(testCase);
    }
  }
  
  // 파싱 실패 시 기본 테스트 케이스 생성
  if (testCases.length === 0) {
    // Mock 데이터 반환 (개발용)
    const mockTestCases = [
      {
        id: `tc_${Date.now()}_1`,
        title: "사용자 로그인 기능 테스트",
        type: "functional",
        description: "사용자가 정상적으로 로그인할 수 있는지 확인",
        steps: [
          {
            action: "로그인 페이지 접속",
            expectedResult: "로그인 폼이 표시됨"
          },
          {
            action: "유효한 이메일과 비밀번호 입력",
            expectedResult: "입력 필드에 값이 정상적으로 입력됨"
          },
          {
            action: "로그인 버튼 클릭",
            expectedResult: "로그인 처리 중 로딩 표시"
          }
        ],
        expectedResult: "로그인 성공 후 대시보드로 이동"
      },
      {
        id: `tc_${Date.now()}_2`,
        title: "잘못된 비밀번호 입력 시 에러 처리",
        type: "edge_case",
        description: "잘못된 비밀번호 입력 시 적절한 에러 메시지 표시 확인",
        steps: [
          {
            action: "로그인 페이지 접속",
            expectedResult: "로그인 폼이 표시됨"
          },
          {
            action: "유효한 이메일과 잘못된 비밀번호 입력",
            expectedResult: "입력 필드에 값이 입력됨"
          },
          {
            action: "로그인 버튼 클릭",
            expectedResult: "에러 메시지 표시"
          }
        ],
        expectedResult: "비밀번호가 일치하지 않습니다 메시지 표시"
      }
    ];
    
    return mockTestCases;
  }
  
  return testCases;
}