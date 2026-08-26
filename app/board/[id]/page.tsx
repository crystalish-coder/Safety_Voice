"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Building2,
  Lock,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  Activity,
  AlertTriangle,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import {
  Post,
  CATEGORY_LABELS,
  RISK_LABELS,
  STATUS_LABELS,
  PostStatus,
} from "@/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/utils";

// Mock Fallback
const FALLBACK_POST: Post = {
  id: "sample-1",
  author_id: "00000000-0000-0000-0000-000000000001",
  category: "HAZARD",
  title: "실험실 후드 주변 적재물 및 배기 저하 관련 의견",
  content:
    "3층 유기합성실 302호 후드 주변에 빈 시약 박스가 과도하게 적재되어 있어 유사시 대피 및 배기 환기에 지장을 줄 수 있습니다.\n\n정기 수거 조치 및 적재 금지 표시 부착을 요청드립니다.",
  location: "3층 합성실 302호",
  risk_level: "MEDIUM",
  status: "REVIEWING",
  admin_response:
    "해당 구역의 적재 박스를 확인하였으며 환경안전 담당자가 금일 오후 폐기물 수거 업체와 함께 정리할 예정입니다. 향후 안전 통로 확보를 위한 라인 마킹도 병행하겠습니다.",
  admin_response_at: "2026-08-25T14:00:00Z",
  is_hidden: false,
  created_at: "2026-08-25T09:30:00Z",
  updated_at: "2026-08-25T14:00:00Z",
};

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadPost() {
      setIsLoading(true);
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        setPost(FALLBACK_POST);
        setIsLoading(false);
        return;
      }

      try {
        // 세션 유저 ID 확인 (작성자 본인 판별용)
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUserId(session.user.id);
        }

        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .eq("id", postId)
          .single();

        if (error || !data) {
          setPost(FALLBACK_POST);
        } else {
          setPost(data as Post);
        }
      } catch (err) {
        console.warn("DB 데이터 조회 대기:", err);
        setPost(FALLBACK_POST);
      } finally {
        setIsLoading(false);
      }
    }

    if (postId) {
      loadPost();
    }
  }, [postId]);

  const handleDelete = async () => {
    if (!confirm("정말 이 의견을 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.")) {
      return;
    }

    setIsDeleting(true);
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      alert("삭제되었습니다. (로컬 Mock)");
      router.push("/board");
      return;
    }

    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
      alert("게시글이 삭제되었습니다.");
      router.push("/board");
    } catch (err: any) {
      alert(err.message || "삭제 권한이 없거나 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-slate-400">
        게시글 정보를 불러오는 중입니다...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-slate-400" />
        <h2 className="mt-3 text-lg font-bold text-slate-700">게시글을 찾을 수 없습니다</h2>
        <Link href="/board" className="mt-4 inline-block text-sm font-semibold text-blue-600">
          게시판 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const isAuthor = currentUserId && post.author_id === currentUserId;
  const riskInfo = post.risk_level ? RISK_LABELS[post.risk_level] : null;
  const statusInfo = STATUS_LABELS[post.status] || STATUS_LABELS.RECEIVED;

  const statusSteps: Array<{ key: PostStatus; label: string; icon: any }> = [
    { key: "RECEIVED", label: "접수됨", icon: Clock },
    { key: "REVIEWING", label: "검토중", icon: Activity },
    { key: "ACTION", label: "조치중", icon: AlertTriangle },
    { key: "DONE", label: "완료", icon: CheckCircle2 },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Top Navigation & Action Buttons */}
      <div className="flex items-center justify-between">
        <Link
          href="/board"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>게시판 목록으로 돌아가기</span>
        </Link>

        {/* Author Actions (Only visible if the viewer is the author) */}
        {isAuthor && (
          <div className="flex items-center gap-2">
            <Link
              href={`/board/${post.id}/edit`}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <Edit className="h-3.5 w-3.5" />
              <span>수정</span>
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{isDeleting ? "삭제 중..." : "삭제"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Post Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        {/* Header Badges */}
        <div className="space-y-3 border-b border-slate-100 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                {CATEGORY_LABELS[post.category] || post.category}
              </span>
              {riskInfo && (
                <span className={`rounded-md border px-2.5 py-1 text-xs font-bold ${riskInfo.badgeBg} ${riskInfo.color}`}>
                  위험도: {riskInfo.label}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDateTime(post.created_at)}</span>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
            {post.title}
          </h1>

          {post.location && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Building2 className="h-4 w-4 text-slate-400" />
              <span>발생 구역: {post.location}</span>
            </div>
          )}
        </div>

        {/* Status Progress Flow */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700">조치 진행 상태</span>
            <span className={`rounded-full border px-3 py-0.5 text-xs font-bold ${statusInfo.badgeBg} ${statusInfo.color}`}>
              현재: {statusInfo.label}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {statusSteps.map((step, idx) => {
              const currentStepNum = STATUS_LABELS[post.status]?.step || 1;
              const isPastOrCurrent = idx + 1 <= currentStepNum;
              const isCurrent = idx + 1 === currentStepNum;
              const StepIcon = step.icon;

              return (
                <div
                  key={step.key}
                  className={`flex flex-col items-center justify-center rounded-xl p-2.5 text-center transition ${
                    isCurrent
                      ? "bg-blue-600 text-white font-bold shadow-sm"
                      : isPastOrCurrent
                      ? "bg-blue-50 text-blue-800 font-semibold"
                      : "bg-white text-slate-400 border border-slate-200"
                  }`}
                >
                  <StepIcon className="h-4 w-4 mb-1" />
                  <span className="text-xs">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">제보 내용</h2>
          <div className="rounded-xl bg-white text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>
        </div>

        {/* Admin Response Box (if present) */}
        {post.admin_response ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                <span>안전관리팀 공식 답변</span>
              </div>
              {post.admin_response_at && (
                <span className="text-xs text-blue-700/80">
                  {formatDateTime(post.admin_response_at)}
                </span>
              )}
            </div>
            <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap bg-white/80 rounded-xl p-4 border border-blue-100">
              {post.admin_response}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
            안전관리팀에서 내용을 확인 및 검토 중입니다. 조치 사항이 등록되면 이곳에 표시됩니다.
          </div>
        )}

        {/* Footer Note */}
        <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Lock className="h-3.5 w-3.5 text-emerald-600" /> 익명 제보 건 (작성자 신원 비공개)
          </span>
          {isAuthor && <span className="text-blue-600 font-semibold">내 작성 글</span>}
        </div>
      </div>
    </div>
  );
}
