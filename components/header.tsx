"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  const navItems = [
    { href: "/prd", label: "📝 PRD 생성", color: "blue" },
    { href: "/github", label: "🔍 GitHub PR 분석", color: "purple" },
    { href: "/test-cases", label: "🧪 테스트 케이스", color: "green" },
    { href: "/admin", label: "⚙️ 관리자", color: "orange" }
  ];

  const getActiveStyles = (color: string) => {
    const colorMap = {
      blue: "text-blue-600 bg-blue-50 shadow-sm",
      purple: "text-purple-600 bg-purple-50 shadow-sm", 
      green: "text-green-600 bg-green-50 shadow-sm",
      orange: "text-orange-600 bg-orange-50 shadow-sm"
    };
    return colorMap[color as keyof typeof colorMap];
  };

  const getHoverStyles = (color: string) => {
    const colorMap = {
      blue: "hover:text-blue-600 hover:bg-blue-50",
      purple: "hover:text-purple-600 hover:bg-purple-50",
      green: "hover:text-green-600 hover:bg-green-50", 
      orange: "hover:text-orange-600 hover:bg-orange-50"
    };
    return colorMap[color as keyof typeof colorMap];
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-100">
      <div className="container mx-auto px-3">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="p-1.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg group-hover:shadow-xl transition-all">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PRD Generator
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-0.5">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    isActive(item.href)
                      ? getActiveStyles(item.color)
                      : `text-gray-700 ${getHoverStyles(item.color)}`
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center space-x-3">
            <UserMenu />
            
            <button className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-all">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="px-3 py-1.5 text-xs text-gray-500">
        로딩중...
      </div>
    );
  }

  if (session) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-600">
          {session.user?.email}
        </span>
        <button
          onClick={() => signOut()}
          className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/auth/signin"
      className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
    >
      로그인
    </Link>
  );
}