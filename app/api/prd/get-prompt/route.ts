import { NextResponse } from "next/server";

export async function GET() {
  // Note: 서버 사이드에서는 localStorage 접근 불가
  // 클라이언트에서 직접 lib/prompts.ts의 함수를 사용하도록 변경 필요
  return NextResponse.json({
    message: "Please use client-side prompt fetching"
  });
}