// Gemini API 테스트 스크립트
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
  try {
    const genAI = new GoogleGenerativeAI("AIzaSyDnyyxCWSWiq1iSW5dBENDM8Sv_VaJ-FwA");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "안녕하세요! 간단한 PRD 예시를 만들어주세요.";
    
    console.log("Gemini API 호출 중...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("=== Gemini 응답 ===");
    console.log(text);
    console.log("===================");
    console.log("✅ Gemini API 테스트 성공!");
  } catch (error) {
    console.error("❌ Gemini API 테스트 실패:", error);
  }
}

testGemini();