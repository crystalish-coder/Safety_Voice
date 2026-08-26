import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnonymousAuthInit from "@/components/auth/AnonymousAuthInit";

export const metadata: Metadata = {
  title: "ONCOBIX Safety Voice | 온코빅스 사내 안전 익명 제보",
  description: "온코빅스 사내 안전관리 위험요소, 개선 제안, 아차사고 및 MSDS/SDS 화학물질 정보를 공유하고 확인하는 익명 웹 서비스",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased selection:bg-blue-500 selection:text-white">
        <AnonymousAuthInit />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
