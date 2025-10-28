import { NextRequest, NextResponse } from "next/server";
import {
  extractFigmaFileKey,
  fetchFigmaFile,
  parseFigmaDesign,
  formatFigmaInfoForPrompt,
} from "@/lib/figma";

export async function POST(request: NextRequest) {
  try {
    const { figmaUrl } = await request.json();

    if (!figmaUrl) {
      return NextResponse.json(
        { error: "Figma URL이 필요합니다." },
        { status: 400 }
      );
    }

    // Extract file key from URL
    const fileKey = extractFigmaFileKey(figmaUrl);
    if (!fileKey) {
      return NextResponse.json(
        { error: "유효하지 않은 Figma URL입니다. 예: https://www.figma.com/file/..." },
        { status: 400 }
      );
    }

    // Get Figma access token from environment
    const accessToken = process.env.FIGMA_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Figma 액세스 토큰이 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    console.log("=== Fetching Figma File ===");
    console.log("File Key:", fileKey);

    // Fetch Figma file data
    const fileData = await fetchFigmaFile(fileKey, accessToken);

    console.log("File Name:", fileData.name);
    console.log("Last Modified:", fileData.lastModified);

    // Parse design information
    const designInfo = parseFigmaDesign(fileData);

    console.log("Screens found:", designInfo.screens.length);
    console.log("Components found:", designInfo.components.length);

    // Format for AI prompt
    const formattedInfo = formatFigmaInfoForPrompt(designInfo);

    return NextResponse.json({
      success: true,
      fileKey,
      fileName: fileData.name,
      designInfo,
      formattedInfo,
    });
  } catch (error: any) {
    console.error("Error fetching Figma file:", error);

    return NextResponse.json(
      {
        error: error.message || "Figma 파일을 가져오는 중 오류가 발생했습니다.",
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
