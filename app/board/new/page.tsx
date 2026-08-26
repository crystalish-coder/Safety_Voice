"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  ArrowLeft,
  Lock,
  Send,
  AlertTriangle,
  Info,
  CheckCircle2,
} from "lucide-react";
import {
  PostCategory,
  RiskLevel,
  CATEGORY_LABELS,
  RISK_LABELS,
} from "@/types";
import { postCreateSchema } from "@/lib/validation/schemas";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getOrCreateAnonymousUserId } from "@/lib/supabase/anonUser";

export default function NewPostPage() {
  const router = useRouter();

  const [category, setCategory] = useState<PostCategory>("HAZARD");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [riskLevel, setRiskLevel] = useState<RiskLevel | "">("MEDIUM");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    // 1. Zod 유효성 검증
    const validation = postCreateSchema.safeParse({
      category,
      title,
      content,
      location: location.trim() ? location : null,
      risk_level: riskLevel ? riskLevel : null,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        // Supabase 환경변수 미설정 시 mock fallback 알림
        alert("안전 의견이 성공적으로 접수되었습니다. (로컬 Mock 모드)");
        router.push("/board");
        return;
      }

      const authorId = await getOrCreateAnonymousUserId();

      const { data, error } = await supabase
        .from("posts")
        .insert({
          author_id: authorId,
          category,
          title: title.trim(),
          content: content.trim(),
          location: location.trim() || null,
          risk_level: riskLevel || null,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      router.push(`/board/${data.id}`);
    } catch (err: any) {
      console.error("게시글 등록 실패:", err);
      setServerError(err.message || "의견 등록 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href="/board"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>게시판 목록으로 돌아가기</span>
        </Link>
      </div>

      {/* Emergency Warning Banner (Fixed & High Priority) */}
      <div className="rounded-2xl border border-red-300 bg-red-50 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-red-900 leading-relaxed">
            <strong className="font-bold block sm:inline mr-1 text-red-950">즉각적인 위험 시 주의사항:</strong>
            화재, 독성 화학물질 누출, 인명사고 또는 폭발 등의 응급상황은 본 게시판 접수만으로 대응하지 마시고{" "}
            <span className="font-bold underline underline-offset-2">사내 비상연락 체계(상황실 유선)</span>를 즉시 이용하십시오.
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 mb-2">
            <Lock className="h-3 w-3" />
            <span>100% 완전 익명 등록</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">새 안전 의견 작성</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            사내 안전에 관한 개선안, 위험 요소, 아차사고를 자유롭게 제보해 주세요.
          </p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              카테고리 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setCategory(key as PostCategory)}
                  className={`rounded-xl border py-2.5 px-3 text-xs font-semibold transition ${
                    category === key
                      ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {errors.category && <p className="text-xs text-red-600 font-medium">{errors.category}</p>}
          </div>

          {/* Risk Level */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              위험도 수준 (선택)
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Object.entries(RISK_LABELS).map(([key, info]) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setRiskLevel(key as RiskLevel)}
                  className={`rounded-xl border py-2.5 px-3 text-xs font-semibold transition ${
                    riskLevel === key
                      ? `${info.badgeBg} ${info.color} border-current shadow-sm`
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {info.label}
                </button>
              ))}
            </div>
            {riskLevel === "URGENT" && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1 mt-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                긴급 건은 사내 안전관리자에게 유선으로도 병행 제보해 주시기 바랍니다.
              </p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              발생 위치 / 구역 (선택)
            </label>
            <input
              type="text"
              placeholder="예: 3층 유기합성실 302호 후드 주변"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={100}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
            />
            {errors.location && <p className="text-xs text-red-600 font-medium">{errors.location}</p>}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-700">
                제목 <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-slate-400">{title.length} / 100자</span>
            </div>
            <input
              type="text"
              placeholder="위험 요소 또는 개선 의견의 핵심을 입력해 주세요 (최대 100자)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
            />
            {errors.title && <p className="text-xs text-red-600 font-medium">{errors.title}</p>}
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-700">
                상세 내용 <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-slate-400">{content.length} / 5000자</span>
            </div>
            <textarea
              rows={6}
              placeholder="상황, 발생 일시, 위험 요인, 개선 요청 사항 등을 자유롭게 작성해 주세요. (개인 식별 정보는 입력하지 마십시오)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={5000}
              className="w-full rounded-xl border border-slate-200 p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none leading-relaxed"
            />
            {errors.content && <p className="text-xs text-red-600 font-medium">{errors.content}</p>}
          </div>

          {/* Privacy Guidance */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Info className="h-4 w-4 text-blue-600" />
              <span>개인정보 보호 안내</span>
            </div>
            <p>
              개인을 특정할 수 있는 본인 또는 타인의 이름, 사번, 연락처는 본문에 기재하지 마십시오.
              본 작성 건은 익명으로 안전관리 담당 부서에 전달됩니다.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/board"
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition active:scale-[0.98]"
            >
              <Send className="h-4 w-4" />
              <span>{isSubmitting ? "접수 중..." : "익명 의견 접수하기"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
