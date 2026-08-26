"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Search,
  Filter,
  Building2,
  Calendar,
  ChevronRight,
  PlusCircle,
  Clock,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import {
  Post,
  PostCategory,
  PostStatus,
  RiskLevel,
  CATEGORY_LABELS,
  RISK_LABELS,
  STATUS_LABELS,
} from "@/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

// 초기 기본값 빈 배열 (실제 등록된 데이터만 표시)
const FALLBACK_POSTS: Post[] = [];

export default function BoardPage() {
  const [posts, setPosts] = useState<Post[]>(FALLBACK_POSTS);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedRisk, setSelectedRisk] = useState<string>("ALL");

  useEffect(() => {
    async function fetchPosts() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .eq("is_hidden", false)
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          setPosts(data as Post[]);
        }
      } catch (err) {
        console.warn("DB 데이터 조회 대기(Fallback 유지):", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPosts();
  }, []);

  // 필터링 및 검색 로직
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // 카테고리 필터
      if (selectedCategory !== "ALL" && post.category !== selectedCategory) {
        return false;
      }
      // 상태 필터
      if (selectedStatus !== "ALL" && post.status !== selectedStatus) {
        return false;
      }
      // 위험도 필터
      if (selectedRisk !== "ALL" && post.risk_level !== selectedRisk) {
        return false;
      }
      // 검색어 (제목, 내용, 장소)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = post.title.toLowerCase().includes(query);
        const matchContent = post.content.toLowerCase().includes(query);
        const matchLocation = post.location?.toLowerCase().includes(query);
        if (!matchTitle && !matchContent && !matchLocation) {
          return false;
        }
      }
      return true;
    });
  }, [posts, selectedCategory, selectedStatus, selectedRisk, searchQuery]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("ALL");
    setSelectedStatus("ALL");
    setSelectedRisk("ALL");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
            <span>안전 의견 익명 게시판</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            사내 안전 위험요소 및 개선 제안을 익명으로 확인하고 처리 상황을 추적할 수 있습니다.
          </p>
        </div>

        <Link
          href="/board/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 active:scale-[0.98] transition"
        >
          <PlusCircle className="h-4 w-4" />
          <span>새 안전 의견 작성</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="제목, 내용 또는 발생 위치 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium mr-1">
            <Filter className="h-3.5 w-3.5" />
            <span>필터:</span>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">전체 카테고리</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">전체 처리상태</option>
            {Object.entries(STATUS_LABELS).map(([key, val]) => (
              <option key={key} value={key}>
                {val.label}
              </option>
            ))}
          </select>

          {/* Risk Level Filter */}
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">전체 위험도</option>
            {Object.entries(RISK_LABELS).map(([key, val]) => (
              <option key={key} value={key}>
                위험도: {val.label}
              </option>
            ))}
          </select>

          {(selectedCategory !== "ALL" || selectedStatus !== "ALL" || selectedRisk !== "ALL" || searchQuery) && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition ml-auto"
            >
              <RotateCcw className="h-3 w-3" />
              <span>초기화</span>
            </button>
          )}
        </div>
      </div>

      {/* Post List Table / Cards */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400">
            게시글을 불러오는 중입니다...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-slate-400" />
            <h3 className="mt-2 text-sm font-bold text-slate-700">해당 조건의 의견이 없습니다</h3>
            <p className="mt-1 text-xs text-slate-500">필터 조건을 변경하거나 새로운 의견을 등록해 주세요.</p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const riskInfo = post.risk_level ? RISK_LABELS[post.risk_level] : null;
            const statusInfo = STATUS_LABELS[post.status] || STATUS_LABELS.RECEIVED;

            return (
              <Link
                key={post.id}
                href={`/board/${post.id}`}
                className="group block rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition hover:border-blue-400 hover:shadow-md"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Main Content */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-700">
                        {CATEGORY_LABELS[post.category] || post.category}
                      </span>
                      {riskInfo && (
                        <span className={`rounded-md border px-2 py-0.5 font-bold ${riskInfo.badgeBg} ${riskInfo.color}`}>
                          위험도: {riskInfo.label}
                        </span>
                      )}
                      <span className="text-slate-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.created_at)}
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
                      {post.title}
                    </h2>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {post.content}
                    </p>

                    {post.location && (
                      <div className="flex items-center gap-1 text-xs text-slate-500 pt-0.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>{post.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Status & Arrow */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusInfo.badgeBg} ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
