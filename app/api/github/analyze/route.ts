import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "octokit";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGitHubAnalysisPrompt } from "@/lib/prompts";

export async function POST(request: NextRequest) {
  try {
    const { url, customPrompt } = await request.json();
    
    // URL 파싱 (예: https://github.com/owner/repo/pull/123)
    const urlParts = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
    if (!urlParts) {
      return NextResponse.json(
        { error: "유효하지 않은 GitHub PR URL입니다" },
        { status: 400 }
      );
    }
    
    const [, owner, repo, prNumber] = urlParts;
    
    // GitHub API 클라이언트 초기화
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
    
    // PR 정보 가져오기
    let pr;
    try {
      const response = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: parseInt(prNumber)
      });
      pr = response.data;
    } catch (error: any) {
      console.error("GitHub API Error:", error);
      if (error.status === 404) {
        return NextResponse.json(
          { error: `PR을 찾을 수 없습니다. URL을 확인해주세요.\n- Private 저장소인 경우 GitHub 토큰에 'repo' 권한이 필요합니다.\n- URL 형식: https://github.com/owner/repo/pull/123` },
          { status: 404 }
        );
      } else if (error.status === 401) {
        return NextResponse.json(
          { error: "GitHub 토큰이 유효하지 않습니다. 토큰을 확인해주세요." },
          { status: 401 }
        );
      } else {
        return NextResponse.json(
          { error: `GitHub API 오류: ${error.message}` },
          { status: 500 }
        );
      }
    }
    
    // 커밋 정보 가져오기
    const { data: commits } = await octokit.rest.pulls.listCommits({
      owner,
      repo,
      pull_number: parseInt(prNumber)
    });
    
    // 변경된 파일 정보 가져오기
    const { data: files } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: parseInt(prNumber),
      per_page: 100
    });
    
    // 주요 변경사항 요약
    const fileChanges = files.map(file => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes
    }));
    
    // AI를 통한 코드 분석
    let analysis = "";
    
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey && geminiApiKey !== "your-gemini-api-key") {
      try {
        // 관리자 페이지에서 설정한 프롬프트 가져오기 (우선순위: customPrompt > 관리자 설정 > 기본값)
        let promptTemplate = customPrompt || getGitHubAnalysisPrompt();
        
        // 프롬프트의 변수 치환 (replaceAll 사용)
        const analysisPrompt = promptTemplate
          .replaceAll('{title}', pr.title)
          .replaceAll('{description}', pr.body || "설명 없음")
          .replaceAll('{filesCount}', files.length.toString())
          .replaceAll('{fileChanges}', fileChanges.map(f => `- ${f.filename}: +${f.additions} -${f.deletions} (${f.status})`).join('\n'))
          .replaceAll('{commits}', commits.map(c => `- ${c.commit.message}`).join('\n'));
        
        console.log("=== GitHub PR Analysis ===");
        console.log("Using prompt from:", customPrompt ? "Custom" : "Admin Settings");
        console.log("Prompt template length:", promptTemplate.length);
        console.log("First 200 chars:", promptTemplate.substring(0, 200));

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
        
        // Retry logic for 503 errors
        let retries = 3;
        let lastError = null;
        
        while (retries > 0) {
          try {
            const result = await model.generateContent(analysisPrompt);
            const response = await result.response;
            analysis = response.text();
            break; // Success, exit loop
          } catch (error: any) {
            lastError = error;
            console.log(`Gemini API error in PR analysis (${retries} retries left):`, error.message);
            
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
        
        if (!analysis && lastError) {
          throw lastError;
        }
      } catch (aiError) {
        console.error("Gemini API Error:", aiError);
        analysis = `## PR 분석 결과 (Mock)

### 1. 주요 변경사항 요약
- ${files.length}개 파일 변경
- 추가: ${pr.additions}줄, 삭제: ${pr.deletions}줄
- 주요 변경 파일: ${fileChanges.slice(0, 3).map(f => f.filename).join(', ')}

### 2. 영향받는 기능/모듈
${fileChanges.slice(0, 5).map(f => `- ${f.filename}`).join('\n')}

### 3. 잠재적 리스크
- 변경 규모: ${pr.additions + pr.deletions > 500 ? '대규모 변경으로 충분한 테스트 필요' : '중소규모 변경'}
- 파일 수: ${files.length > 10 ? '다수 파일 변경으로 영향 범위 확인 필요' : '적절한 범위'}

### 4. 테스트가 필요한 영역
${fileChanges.filter(f => f.status !== 'removed').slice(0, 5).map(f => `- ${f.filename}`).join('\n')}

### 5. 코드 품질 개선 제안
- 코드 리뷰 진행 필요
- 단위 테스트 추가 권장
- 문서화 업데이트 확인`;
      }
    } else {
      // Mock 분석 결과
      analysis = `## PR 분석 결과 (Mock)

### 1. 주요 변경사항 요약
- ${files.length}개 파일 변경
- 추가: ${pr.additions}줄, 삭제: ${pr.deletions}줄
- 주요 변경 파일: ${fileChanges.slice(0, 3).map(f => f.filename).join(', ')}

### 2. 영향받는 기능/모듈
${fileChanges.slice(0, 5).map(f => `- ${f.filename}`).join('\n')}

### 3. 잠재적 리스크
- 변경 규모: ${pr.additions + pr.deletions > 500 ? '대규모 변경으로 충분한 테스트 필요' : '중소규모 변경'}
- 파일 수: ${files.length > 10 ? '다수 파일 변경으로 영향 범위 확인 필요' : '적절한 범위'}

### 4. 테스트가 필요한 영역
${fileChanges.filter(f => f.status !== 'removed').slice(0, 5).map(f => `- ${f.filename}`).join('\n')}

### 5. 코드 품질 개선 제안
- 코드 리뷰 진행 필요
- 단위 테스트 추가 권장
- 문서화 업데이트 확인`;
    }
    
    // PR 데이터 구조화
    const prData = {
      url,
      owner,
      repo,
      prNumber: parseInt(prNumber),
      title: pr.title,
      description: pr.body,
      diff: `${files.length} files changed, +${pr.additions} -${pr.deletions}`,
      commits: commits.map(c => ({
        sha: c.sha,
        message: c.commit.message,
        author: c.commit.author?.name || "Unknown"
      })),
      files: fileChanges,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at
    };
    
    return NextResponse.json({
      prData,
      analysis
    });
    
  } catch (error) {
    console.error("Error analyzing PR:", error);
    return NextResponse.json(
      { error: "PR 분석 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}