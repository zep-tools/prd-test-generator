import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function POST(request: NextRequest) {
  try {
    const { promptTemplate, testInput, promptType } = await request.json();
    
    // 테스트 입력을 프롬프트 템플릿에 적용
    let finalPrompt = promptTemplate;
    
    // 간단한 변수 치환 (실제로는 더 복잡한 로직 필요)
    if (promptType === "prd_generation") {
      const inputLines = testInput.split('\n');
      inputLines.forEach(line => {
        const [key, value] = line.split(':').map(s => s.trim());
        if (key && value) {
          finalPrompt = finalPrompt.replace(`{${key.toLowerCase()}}`, value);
        }
      });
    } else {
      finalPrompt = finalPrompt.replace("{input}", testInput);
    }
    
    // AI 모델로 테스트 실행
    const { text } = await generateText({
      model: openai("gpt-4-turbo-preview"),
      prompt: finalPrompt,
      temperature: 0.7,
      maxTokens: 1500,
    });
    
    return NextResponse.json({
      result: text,
      promptUsed: finalPrompt
    });
    
  } catch (error) {
    console.error("Error testing prompt:", error);
    return NextResponse.json(
      { error: "프롬프트 테스트 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}