"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Lock,
  Save,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  PostCategory,
  RiskLevel,
  CATEGORY_LABELS,
  RISK_LABELS,
} from "@/types";
import { postUpdateSchema } from "@/lib/validation/schemas";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getOrCreateAnonymousUserId } from "@/lib/supabase/anonUser";

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [category, setCategory] = useState<PostCategory>("HAZARD");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [riskLevel, setRiskLevel] = useState<RiskLevel | "">("MEDIUM");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPost() {
      setIsLoading(true);
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUserId = await getOrCreateAnonymousUserId();
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .eq("id", postId)
          .single();

        if (error || !data) {
          throw new Error("게시글을 불러올 수 없습니다.");
        }

        // 작성자 본인 확인
        if (currentUserId && data.author_id !== currentUserId) {
          alert("본인이 작성한 글만 수정할 수 있습니다.");
          router.push(`/board/${postId}`);
          return;
        }

        setCategory(data.category);
        setTitle(data.title);
        setContent(data.content);
        setLocation(data.location || "");
        setRiskLevel(data.risk_level || "MEDIUM");
      } catch (err: any) {
        console.warn("데이터 로드 오류:", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (postId) {
      loadPost();
    }
  }, [postId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const validation = postUpdateSchema.safeParse({
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
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      alert("수정되었습니다. (로컬 Mock)");
      router.push(`/board/${postId}`);
      return;
    }

    try {
      const { error } = await supabase
        .from("posts")
        .update({
          category,
          title: title.trim(),
          content: content.trim(),
          location: location.trim() || null,
          risk_level: riskLevel || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId);

      if (error) throw error;
      alert("성공적으로 수정되었습니다.");
      router.push(`/board/${postId}`);
    } catch (err: any) {
      setServerError(err.message || "수정 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-slate-400">
        게시글 정보를 불러오는 중입니다...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div>
        <Link
          href={`/board/${postId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>의견 상세 화면으로 돌아가기</span>
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 mb-2">
            <Lock className="h-3 w-3" />
            <span>작성자 본인 수정 모드</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">안전 의견 수정</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            제보 내용 중 수정할 사항을 변경 후 저장해 주세요.
          </p>
        </div>

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
            <label className="block text-xs font-bold text-slate-700">위험도 수준</label>
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
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">발생 위치 / 구역</label>
            <input
              type="text"
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
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
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={5000}
              className="w-full rounded-xl border border-slate-200 p-4 text-sm text-slate-900 focus:border-blue-500 focus:outline-none leading-relaxed"
            />
            {errors.content && <p className="text-xs text-red-600 font-medium">{errors.content}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href={`/board/${postId}`}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition active:scale-[0.98]"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? "저장 중..." : "수정 사항 저장"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
