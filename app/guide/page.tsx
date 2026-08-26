import { Shield, Lock, EyeOff, FileText, CheckCircle2, PhoneCall } from "lucide-react";
import Link from "next/link";

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700">
          <Shield className="h-3.5 w-3.5" />
          <span>안전 관리 소통 가이드</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Safety Voice 이용안내</h1>
        <p className="text-sm text-slate-600">
          더 안전한 일터 조성을 위한 익명 제보 절차와 개인정보 보호 방침을 안내해 드립니다.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-900">제보 및 처리 절차</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[
            { step: "01", title: "익명 의견 작성", desc: "회원가입 없이 위험요소, 개선안 등을 자유롭게 등록합니다." },
            { step: "02", title: "안전팀 접수", desc: "안전관리 담당자가 제보 내용을 확인하고 우선순위를 검토합니다." },
            { step: "03", title: "현장 조치 및 개선", desc: "해당 구역 담당 부서와 협력하여 시설 보수 및 절차 개선을 진행합니다." },
            { step: "04", title: "결과 답변 공유", desc: "조치 완료 후 상세 피드백과 향후 예방책을 게시물에 공개 답변합니다." },
          ].map((item) => (
            <div key={item.step} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs font-black text-blue-600">{item.step}</span>
              <h3 className="mt-2 text-sm font-bold text-slate-900">{item.title}</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Security Policies */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Lock className="h-5 w-5 text-emerald-600" />
          <span>완전 익명성 보장 원칙</span>
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs sm:text-sm text-slate-600">
          <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
            <EyeOff className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-slate-900 block mb-1">식별 정보 미수집</strong>
              <span>IP 주소, 로그인 계정, 사번, 기기 고유 식별자 등을 수집하거나 로그에 남기지 않습니다.</span>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-slate-900 block mb-1">작성자 본인 제어</strong>
              <span>작성 시 발급되는 익명 토큰을 통해 제보를 작성한 동일 브라우저에서만 글 수정 및 삭제가 가능합니다.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Call Action */}
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="rounded-xl bg-red-100 p-2.5 text-red-700 shrink-0">
            <PhoneCall className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-red-950">응급/비상 상황 발생 시</h3>
            <p className="mt-0.5 text-xs sm:text-sm text-red-800">
              화재, 유독물질 누출, 감전, 중대 재해 등 초동 대처가 필요한 경우 게시판 접수가 아닌 사내 상황실로 즉시 유선 연락 바랍니다.
            </p>
          </div>
        </div>
        <Link
          href="/board/new"
          className="rounded-xl bg-red-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow hover:bg-red-700 transition whitespace-nowrap"
        >
          의견 작성하러 가기
        </Link>
      </div>
    </div>
  );
}
