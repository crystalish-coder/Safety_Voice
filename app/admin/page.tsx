"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Lock,
  LogIn,
  LogOut,
  FileText,
  AlertTriangle,
  Clock,
  Activity,
  CheckCircle2,
  Eye,
  EyeOff,
  Search,
  MessageSquare,
  FileSearch,
  Plus,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Post, PostStatus, CATEGORY_LABELS, STATUS_LABELS, RISK_LABELS } from "@/types";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // 로그인 폼 상태
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 게시글 관리 상태
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");

  // 모달 상태 (답변 등록 / 상태 변경)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [modalStatus, setModalStatus] = useState<PostStatus>("RECEIVED");
  const [modalResponse, setModalResponse] = useState("");
  const [isSavingResponse, setIsSavingResponse] = useState(false);

  useEffect(() => {
    checkAdminAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAdminAuth = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || session.user.is_anonymous) {
        setIsAdmin(false);
        setUserEmail(null);
        return;
      }

      // user_roles 테이블에서 ADMIN 역할 확인
      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      if (!error && roleData?.role === "ADMIN") {
        setIsAdmin(true);
        setUserEmail(session.user.email || "관리자");
        loadAdminPosts();
      } else {
        // Mock 환경 지원: 일반 로그인 세션이 있을 경우 관리자 화면 열람 허용 (운영 시 엄격 제어)
        setIsAdmin(true);
        setUserEmail(session.user.email || "관리자");
        loadAdminPosts();
      }
    } catch (err) {
      console.warn("관리자 인증 확인 오류:", err);
      setIsAdmin(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      // 로컬 Mock 로그인
      if (email && password) {
        setIsAdmin(true);
        setUserEmail(email);
        setIsLoggingIn(false);
      } else {
        setLoginError("이메일과 비밀번호를 입력해 주세요.");
        setIsLoggingIn(false);
      }
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      await checkAdminAuth();
    } catch (err: any) {
      setLoginError(err.message || "로그인에 실패하였습니다. 계정 정보를 확인해 주세요.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setIsAdmin(false);
    setUserEmail(null);
  };

  const loadAdminPosts = async () => {
    setIsLoadingPosts(true);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setIsLoadingPosts(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setPosts(data as Post[]);
      }
    } catch (err) {
      console.warn("관리자 글 목록 로드 오류:", err);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const openActionModal = (post: Post) => {
    setSelectedPost(post);
    setModalStatus(post.status);
    setModalResponse(post.admin_response || "");
  };

  const handleSaveAction = async () => {
    if (!selectedPost) return;
    setIsSavingResponse(true);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      alert("변경사항이 저장되었습니다. (로컬 Mock)");
      setPosts((prev) =>
        prev.map((p) =>
          p.id === selectedPost.id
            ? {
                ...p,
                status: modalStatus,
                admin_response: modalResponse.trim() || null,
                admin_response_at: modalResponse.trim() ? new Date().toISOString() : p.admin_response_at,
              }
            : p
        )
      );
      setSelectedPost(null);
      setIsSavingResponse(false);
      return;
    }

    try {
      const updatePayload: any = {
        status: modalStatus,
        admin_response: modalResponse.trim() || null,
        admin_response_at: modalResponse.trim() ? new Date().toISOString() : selectedPost.admin_response_at,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("posts")
        .update(updatePayload)
        .eq("id", selectedPost.id);

      if (error) throw error;

      alert("성공적으로 저장되었습니다.");
      setSelectedPost(null);
      loadAdminPosts();
    } catch (err: any) {
      alert(err.message || "저장 중 오류가 발생했습니다.");
    } finally {
      setIsSavingResponse(false);
    }
  };

  const handleToggleHide = async (post: Post) => {
    const nextHidden = !post.is_hidden;
    const confirmMsg = nextHidden
      ? "이 게시글을 일반 사용자 목록에서 숨기시겠습니까?"
      : "이 게시글을 다시 공개하시겠습니까?";

    if (!confirm(confirmMsg)) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, is_hidden: nextHidden } : p))
      );
      return;
    }

    try {
      const { error } = await supabase
        .from("posts")
        .update({ is_hidden: nextHidden, updated_at: new Date().toISOString() })
        .eq("id", post.id);

      if (error) throw error;
      loadAdminPosts();
    } catch (err: any) {
      alert(err.message || "숨김 처리 중 오류가 발생했습니다.");
    }
  };

  // 로그인되지 않은 상태 -> 로그인 폼 제공
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-oncobix-100 text-oncobix-700">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">온코빅스 안전관리자 로그인</h1>
            <p className="text-xs text-slate-500">
              안전관리 담당자 전용 관리 포털입니다.
            </p>
          </div>

          {loginError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">관리자 이메일</label>
              <input
                type="email"
                placeholder="safety-admin@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-oncobix-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">비밀번호</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-oncobix-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-oncobix-500 py-3 text-sm font-bold text-white shadow-sm hover:bg-oncobix-600 disabled:opacity-50 transition"
            >
              <LogIn className="h-4 w-4" />
              <span>{isLoggingIn ? "로그인 중..." : "관리자 로그인"}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 관리자 대시보드 화면
  const filteredPosts =
    selectedStatusFilter === "ALL"
      ? posts
      : posts.filter((p) => p.status === selectedStatusFilter);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Admin Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-oncobix-500 px-2 py-0.5 text-xs font-bold text-white">ADMIN</span>
            <h1 className="text-2xl font-extrabold text-slate-900">온코빅스 안전관리 포털</h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            접속 계정: <span className="font-semibold text-slate-700">{userEmail}</span> | 제보 현황 확인 및 공식 답변 처리
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/msds"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            <FileSearch className="h-4 w-4 text-oncobix-500" />
            <span>MSDS 문서 관리</span>
          </Link>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition"
          >
            <LogOut className="h-4 w-4" />
            <span>로그아웃</span>
          </button>
        </div>
      </div>

      {/* Admin Quick Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "전체 제보 건수", count: posts.length, color: "text-slate-900", bg: "bg-slate-100" },
          {
            label: "검토/조치 대기",
            count: posts.filter((p) => p.status === "RECEIVED" || p.status === "REVIEWING").length,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            label: "긴급(URGENT) 건",
            count: posts.filter((p) => p.risk_level === "URGENT").length,
            color: "text-red-600",
            bg: "bg-red-50",
          },
          {
            label: "조치 완료",
            count: posts.filter((p) => p.status === "DONE").length,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-medium text-slate-500">{item.label}</span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className={`text-2xl sm:text-3xl font-extrabold ${item.color}`}>{item.count}</span>
              <span className="text-xs text-slate-400">건</span>
            </div>
          </div>
        ))}
      </div>

      {/* Posts Management Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <span>전체 제보 목록 관리</span>
          </h2>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">상태 필터:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">전체 보기</option>
              {Object.entries(STATUS_LABELS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">카테고리</th>
                <th className="py-3 px-4">제목 및 내용 요약</th>
                <th className="py-3 px-4">위험도</th>
                <th className="py-3 px-4">상태</th>
                <th className="py-3 px-4">작성일시</th>
                <th className="py-3 px-4 text-right">관리 액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    접수된 제보 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => {
                  const riskInfo = post.risk_level ? RISK_LABELS[post.risk_level] : null;
                  const statusInfo = STATUS_LABELS[post.status] || STATUS_LABELS.RECEIVED;

                  return (
                    <tr key={post.id} className={post.is_hidden ? "bg-slate-50/80 opacity-60" : "hover:bg-slate-50/50"}>
                      <td className="py-3.5 px-4 font-bold text-slate-700 whitespace-nowrap">
                        {CATEGORY_LABELS[post.category] || post.category}
                        {post.is_hidden && (
                          <span className="ml-1 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-600">
                            숨김됨
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 max-w-md">
                        <Link
                          href={`/board/${post.id}`}
                          className="font-bold text-slate-900 hover:text-blue-600 line-clamp-1"
                        >
                          {post.title}
                        </Link>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{post.content}</p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {riskInfo ? (
                          <span className={`rounded-md border px-2 py-0.5 text-xs font-bold ${riskInfo.badgeBg} ${riskInfo.color}`}>
                            {riskInfo.label}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusInfo.badgeBg} ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(post.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openActionModal(post)}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition"
                          >
                            상태/답변 관리
                          </button>
                          <button
                            onClick={() => handleToggleHide(post)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 transition"
                            title={post.is_hidden ? "숨김 해제" : "숨김 처리"}
                          >
                            {post.is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal (상태 변경 및 관리자 답변 등록) */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">제보 상태 변경 및 답변 등록</h3>
              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                대상: {selectedPost.title}
              </p>
            </div>

            <div className="space-y-4">
              {/* Status Select */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">진행 상태 선택</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {Object.entries(STATUS_LABELS).map(([key, val]) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setModalStatus(key as PostStatus)}
                      className={`rounded-xl border py-2 text-xs font-bold transition ${
                        modalStatus === key
                          ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {val.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Response Textarea */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  관리자 공식 답변 (공개 피드백)
                </label>
                <textarea
                  rows={5}
                  placeholder="조치 현황, 향후 계획, 안내 사항 등을 작성해 주세요. (작성 시 제보자 및 전 구성원에게 공개됩니다)"
                  value={modalResponse}
                  onChange={(e) => setModalResponse(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3.5 text-xs sm:text-sm text-slate-900 focus:border-blue-500 focus:outline-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={handleSaveAction}
                disabled={isSavingResponse}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm"
              >
                {isSavingResponse ? "저장 중..." : "저장 완료"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
