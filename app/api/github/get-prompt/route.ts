import { NextResponse } from "next/server";
import { getGitHubAnalysisPrompt } from "@/lib/prompts";

export async function GET() {
  try {
    const prompt = getGitHubAnalysisPrompt();
    return NextResponse.json({ prompt });
  } catch (error) {
    console.error("Error getting GitHub prompt:", error);
    return NextResponse.json(
      { error: "프롬프트를 가져오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}