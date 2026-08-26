"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  AlertTriangle,
  FileSearch,
  CheckCircle2,
  Clock,
  Activity,
  ArrowRight,
  ShieldCheck,
  Lock,
  Building2,
  Calendar,
} from "lucide-react";
import { Post, CATEGORY_LABELS, RISK_LABELS, STATUS_LABELS } from "@/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

export default function HomePage() {
  const [counts, setCounts] = useState({
    RECEIVED: 0,
    REVIEWING: 0,
    ACTION: 0,
    DONE: 0,
  });
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .eq("is_hidden", false)
          .order("created_at", { ascending: false });

        if (!error && data) {
          const postList = data as Post[];
          
          // 실시간 상태별 카운트 계산
          const newCounts = {
            RECEIVED: 0,
            REVIEWING: 0,
            ACTION: 0,
            DONE: 0,
          };

          postList.forEach((p) => {
            if (p.status in newCounts) {
              newCounts[p.status]++;
            }
          });

          setCounts(newCounts);
          setRecentPosts(postList.slice(0, 3));
        }
      } catch (err) {
        console.warn("홈 데이터 로드 오류:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const stats = [
    { label: "접수됨", count: counts.RECEIVED, icon: Clock, color: "text-slate-600", bg: "bg-slate-100" },
    { label: "검토중", count: counts.REVIEWING, icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "조치중", count: counts.ACTION, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "조치완료", count: counts.DONE, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <div className="flex flex-col gap-10 pb-16">
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-oncobix-50/60 via-white to-slate-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-oncobix-200 bg-oncobix-100/70 px-4 py-1.5 text-xs font-semibold text-oncobix-700">
              <Lock className="h-3.5 w-3.5 text-oncobix-600" />
              <span>100% 완전 익명 보장 | 신원 식별 정보 일체 미수집</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              <span className="text-oncobix-500">사내 안전 익명 제보 시스템</span>
            </h1>

            <p className="mt-4 max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed">
              온코빅스 연구원 및 임직원의 안전을 위해 위험 요소, 아차사고, 설비 이상, 보호구 부족 등
              안전에 관한 모든 의견을 신원 노출 부담 없이 편안하게 등록해 주세요.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3.5">
              <Link
                href="/board/new"
                className="flex items-center gap-2 rounded-xl bg-oncobix-500 px-6 py-3.5 text-base font-bold text-white shadow-md shadow-oncobix-500/20 transition hover:bg-oncobix-600 active:scale-[0.98]"
              >
                <AlertTriangle className="h-5 w-5" />
                <span>안전 의견 제보하기</span>
              </Link>

              <Link
                href="/msds"
                className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
              >
                <FileSearch className="h-5 w-5 text-oncobix-500" />
                <span>MSDS / SDS 검색</span>
              </Link>
            </div>

            <div className="mt-8 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-xs sm:text-sm text-red-800">
              <ShieldAlert className="h-4 w-4 text-red-600 shrink-0" />
              <span>
                <strong>긴급 상황 안내:</strong> 즉각적인 화재, 폭발, 화학물질 누출, 인명사고는 본 게시판이 아닌 사내 비상연락망으로 즉시 유선 연락바랍니다.
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-oncobix-500" />
              <span>실시간 접수 및 처리 현황</span>
            </h2>
            <Link href="/board" className="text-xs font-semibold text-oncobix-600 hover:text-oncobix-700 flex items-center gap-1">
              전체 보기 <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((item) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium text-slate-500">{item.label}</span>
                    <div className={`rounded-lg p-2 ${item.bg}`}>
                      <IconComponent className={`h-4 w-4 sm:h-5 sm:w-5 ${item.color}`} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      {isLoading ? "-" : item.count}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">건</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-oncobix-500" />
                <span>최근 등록된 안전 의견</span>
              </h2>
              <Link href="/board" className="text-xs font-semibold text-oncobix-600 hover:text-oncobix-700">
                더보기
              </Link>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
                  데이터를 불러오는 중입니다...
                </div>
              ) : recentPosts.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 text-sm">
                  등록된 제보 의견이 없습니다. 첫 번째 안전 의견을 등록해 주세요!
                </div>
              ) : (
                recentPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/board/${post.id}`}
                    className="block rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition hover:border-oncobix-300 hover:shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                            {CATEGORY_LABELS[post.category]}
                          </span>
                          <span
                            className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                              STATUS_LABELS[post.status]?.badgeBg || "bg-slate-100"
                            } ${STATUS_LABELS[post.status]?.color || "text-slate-700"}`}
                          >
                            {STATUS_LABELS[post.status]?.label || post.status}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 line-clamp-1 hover:text-oncobix-600 transition">
                          {post.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {post.content}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">
                        {formatDate(post.created_at)}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-oncobix-100 bg-gradient-to-br from-oncobix-50 to-pink-50/50 p-5">
              <h3 className="text-sm font-bold text-oncobix-950 flex items-center gap-2">
                <Lock className="h-4 w-4 text-oncobix-500" />
                <span>안전한 제보 수칙</span>
              </h3>
              <ul className="mt-3 space-y-2 text-xs text-slate-600 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-oncobix-500 font-bold">•</span>
                  <span>본문 작성 시 본인 또는 타인의 실명, 사번 등 개인정보 기재를 지양해 주세요.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-oncobix-500 font-bold">•</span>
                  <span>작성한 기기(브라우저)에서 본인이 작성한 제보글을 언제든 수정/삭제할 수 있습니다.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-oncobix-500 font-bold">•</span>
                  <span>접수된 제보는 안전관리 담당자가 검토 후 조치 결과를 답변으로 게시합니다.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileSearch className="h-4 w-4 text-oncobix-500" />
                <span>MSDS / SDS 화학물질 검색</span>
              </h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                연구소/사업장 내 취급 중인 화학물질의 CAS 번호 및 물질명을 검색하고 공인 SDS 문서를 확인하세요.
              </p>
              <Link
                href="/msds"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
              >
                <span>화학물질 및 SDS 라이브러리 이동</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
