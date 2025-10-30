import { Metadata } from "next";

export const metadata: Metadata = {
  title: "관리자 페이지 - AI 프롬프트 & 사용량 관리",
  description: "AI 프롬프트 템플릿을 커스터마이징하고 API 사용량과 비용을 모니터링하세요. PRD, GitHub, 테스트 케이스 생성 프롬프트를 팀에 맞게 최적화할 수 있습니다.",
  keywords: ["관리자", "프롬프트 관리", "API 모니터링", "사용량 추적", "커스터마이징"],
  openGraph: {
    title: "관리자 페이지 - 프롬프트 & 사용량 관리",
    description: "AI 프롬프트 커스터마이징 및 API 사용량 모니터링",
    type: "website",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
