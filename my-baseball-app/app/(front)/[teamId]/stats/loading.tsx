"use client";

import FrontMenu from "../components/FrontMenu";
import { LoadingIndicator } from "@/components/LoadingSkeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <FrontMenu teamName="読み込み中..." teamId="" />
      <main className="pt-40 md:pt-48">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-12">
          <LoadingIndicator />
        </div>
      </main>
    </div>
  );
}
