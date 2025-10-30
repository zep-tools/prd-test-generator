import { Metadata } from "next";

export const metadata: Metadata = {
  title: "GitHub PR 분석 - AI 기반 코드 변경사항 분석 도구",
  description: "GitHub Pull Request를 AI로 자동 분석하여 주요 변경사항, 영향 범위, 잠재적 리스크를 파악하고 테스트 필요 영역을 식별합니다.",
  keywords: ["GitHub", "PR 분석", "코드 리뷰", "변경사항 분석", "CI/CD", "개발 도구"],
  openGraph: {
    title: "GitHub PR 분석 - AI 코드 분석 도구",
    description: "Pull Request를 AI로 자동 분석하여 주요 변경사항과 리스크 파악",
    type: "website",
  },
};

export default function GitHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
