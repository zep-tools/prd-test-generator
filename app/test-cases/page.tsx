import { Suspense } from "react";
import TestCasesTable from "./TestCasesTable";

export default function TestCasesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-5">🧪</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">로딩 중...</h3>
        </div>
      </div>
    }>
      <TestCasesTable />
    </Suspense>
  );
}