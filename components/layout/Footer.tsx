import Link from "next/link";
import { ShieldAlert, Shield, Lock } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      {/* Emergency Alert Banner */}
      <div className="bg-red-950/80 border-b border-red-900/50 py-3.5 px-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-red-200 leading-relaxed">
            <strong className="font-bold text-white block sm:inline mr-1">긴급 안전 안내:</strong>
            즉각적인 화재, 누출, 폭발, 인명 위험 또는 응급상황은 이 게시판이 아닌{" "}
            <span className="font-bold text-red-300 underline underline-offset-2">사내 비상연락 체계(상황실/안전관리자)</span>를
            우선 이용하십시오.
          </div>
        </div>
      </div>

      {/* Main Footer Info */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Service Info */}
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-base mb-2">
              <Shield className="h-5 w-5 text-blue-400" />
              <span>Safety Voice Board</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              더 안전하고 건강한 연구 및 작업 환경을 만들기 위해 구성원 누구나 익명으로 위험 요소와 개선 제안을 공유하는 소통 창구입니다.
            </p>
          </div>

          {/* Privacy & Anonymity Commitment */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-2 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-emerald-400" /> 익명성 및 개인정보 보호 원칙
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              본 시스템은 개인 식별 정보(이름, 사번, IP 등)를 수집하거나 게시물과 연계하여 저장하지 않습니다. 안심하고 솔직한 의견을 제시해 주시기 바랍니다.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-2 md:items-end">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-1">Quick Links</span>
            <div className="flex flex-wrap gap-4 text-xs text-slate-400">
              <Link href="/board" className="hover:text-white transition">안전 의견 목록</Link>
              <Link href="/msds" className="hover:text-white transition">MSDS / SDS 검색</Link>
              <Link href="/guide" className="hover:text-white transition">이용 가이드</Link>
              <Link href="/admin" className="text-slate-500 hover:text-slate-300 transition">관리자 전용</Link>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Safety Voice Board. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
