import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function POST(request: NextRequest) {
  try {
    const { prdId, message } = await request.json();
    
    // 실제로는 DB에서 PRD 내용을 가져와야 함
    // 여기서는 시뮬레이션
    const currentPrd = "현재 PRD 내용..."; // DB에서 가져온 내용
    
    const prompt = `현재 PRD:
${currentPrd}

사용자 요청: ${message}

위 요청에 따라 PRD를 수정하거나 답변해주세요. 
수정이 필요한 경우 수정된 전체 PRD를 제공하고,
단순 질문인 경우 답변만 제공해주세요.`;

    const { text } = await generateText({
      model: openai("gpt-4-turbo-preview"),
      prompt: prompt,
      temperature: 0.7,
      maxTokens: 2000,
    });
    
    // 응답이 PRD 수정인지 단순 답변인지 판단
    const isUpdatedPrd = text.includes("## ") || text.includes("### ");
    
    return NextResponse.json({
      response: isUpdatedPrd ? "PRD가 업데이트되었습니다." : text,
      updatedPrd: isUpdatedPrd ? text : null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error in PRD chat:", error);
    return NextResponse.json(
      { error: "채팅 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}