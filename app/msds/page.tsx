"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  FileSearch,
  FileText,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Info,
  Building,
  Calendar,
  Layers,
  FlaskConical,
  Atom,
  RefreshCw,
} from "lucide-react";
import { SdsDocument, PubChemLookupResult } from "@/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isValidCasFormat, isValidCasCheckDigit } from "@/lib/pubchem/cas";
import { formatDate } from "@/lib/utils";

// Mock Fallback SDS Data
const FALLBACK_SDS: SdsDocument[] = [
  {
    id: "sds-1",
    chemical_name: "Acetone (아세톤)",
    cas_number: "67-64-1",
    manufacturer: "Sigma-Aldrich",
    product_number: "650501",
    revision_date: "2026-01-10",
    language: "ko",
    file_path: null,
    external_url: "https://www.sigmaaldrich.com",
    pubchem_cid: 180,
    verified_cas: true,
    created_at: "2026-01-10T00:00:00Z",
    updated_at: "2026-01-10T00:00:00Z",
  },
  {
    id: "sds-2",
    chemical_name: "Methanol (메탄올)",
    cas_number: "67-56-1",
    manufacturer: "TCI",
    product_number: "M0040",
    revision_date: "2025-11-03",
    language: "ko",
    file_path: null,
    external_url: "https://www.tcichemicals.com",
    pubchem_cid: 887,
    verified_cas: true,
    created_at: "2025-11-03T00:00:00Z",
    updated_at: "2025-11-03T00:00:00Z",
  },
  {
    id: "sds-3",
    chemical_name: "Acetonitrile (아세토니트릴)",
    cas_number: "75-05-8",
    manufacturer: "Merck",
    product_number: "100030",
    revision_date: "2025-08-15",
    language: "ko",
    file_path: null,
    external_url: "https://www.merckmillipore.com",
    pubchem_cid: 6342,
    verified_cas: true,
    created_at: "2025-08-15T00:00:00Z",
    updated_at: "2025-08-15T00:00:00Z",
  },
  {
    id: "sds-4",
    chemical_name: "Dichloromethane (디클로로메탄)",
    cas_number: "75-09-2",
    manufacturer: "Sigma-Aldrich",
    product_number: "270997",
    revision_date: "2025-12-01",
    language: "ko",
    file_path: null,
    external_url: "https://www.sigmaaldrich.com",
    pubchem_cid: 6344,
    verified_cas: true,
    created_at: "2025-12-01T00:00:00Z",
    updated_at: "2025-12-01T00:00:00Z",
  },
];

export default function MsdsSearchPage() {
  const [query, setQuery] = useState("67-64-1");
  const [internalSdsList, setInternalSdsList] = useState<SdsDocument[]>(FALLBACK_SDS);
  const [filteredSds, setFilteredSds] = useState<SdsDocument[]>([]);

  // PubChem 상태
  const [pubchemData, setPubchemData] = useState<PubChemLookupResult | null>(null);
  const [pubchemCandidates, setPubchemCandidates] = useState<Array<{ cid: number; title: string }> | null>(null);
  const [pubchemLoading, setPubchemLoading] = useState(false);
  const [pubchemError, setPubchemError] = useState<string | null>(null);

  useEffect(() => {
    loadInternalSds();
    // 초기 로드 시 기본 아세톤(67-64-1) 검색 수행
    handleSearch("67-64-1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInternalSds = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      const { data, error } = await supabase.from("sds_documents").select("*");
      if (!error && data && data.length > 0) {
        setInternalSdsList(data as SdsDocument[]);
      }
    } catch (err) {
      console.warn("내부 SDS 로드 오류:", err);
    }
  };

  const handleSearch = async (searchTarget?: string) => {
    const targetQuery = (searchTarget !== undefined ? searchTarget : query).trim();
    if (!targetQuery) return;

    // 1. 사내 등록 SDS 필터링 (CAS 번호 또는 물질명 또는 제조사)
    const lower = targetQuery.toLowerCase();
    const matchedSds = internalSdsList.filter((sds) => {
      const matchCas = sds.cas_number?.toLowerCase().includes(lower);
      const matchName = sds.chemical_name.toLowerCase().includes(lower);
      const matchMfr = sds.manufacturer?.toLowerCase().includes(lower);
      return matchCas || matchName || matchMfr;
    });
    setFilteredSds(matchedSds);

    // 2. CAS 번호 형태인 경우 PubChem API 자동 연동 조회
    const isCas = isValidCasFormat(targetQuery);
    if (isCas) {
      if (!isValidCasCheckDigit(targetQuery)) {
        setPubchemError("유효하지 않은 CAS 체크 디지트입니다. CAS 번호를 다시 확인해 주세요.");
        setPubchemData(null);
        setPubchemCandidates(null);
        return;
      }

      fetchPubChem(targetQuery);
    } else {
      // CAS 번호가 아닌 경우 사내 SDS 일치 항목 중 CAS 번호가 있으면 해당 CAS로 PubChem 조회
      if (matchedSds.length > 0 && matchedSds[0].cas_number) {
        fetchPubChem(matchedSds[0].cas_number);
      } else {
        setPubchemData(null);
        setPubchemCandidates(null);
        setPubchemError("CAS 번호(예: 67-64-1)를 입력하시면 PubChem 화학물질 정보 및 GHS 정보를 확인할 수 있습니다.");
      }
    }
  };

  const fetchPubChem = async (cas: string, specificCid?: number) => {
    setPubchemLoading(true);
    setPubchemError(null);
    setPubchemCandidates(null);

    try {
      const url = specificCid
        ? `/api/pubchem/lookup?cas=${encodeURIComponent(cas)}&cid=${specificCid}`
        : `/api/pubchem/lookup?cas=${encodeURIComponent(cas)}`;

      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) {
        if (json.notFound) {
          setPubchemError("PubChem에서 해당 CAS 번호의 구조 정보를 찾지 못했습니다. 사내 등록 SDS 문서를 확인해 주세요.");
        } else {
          setPubchemError(json.error || "PubChem 정보를 불러오는 중 오류가 발생했습니다.");
        }
        setPubchemData(null);
        return;
      }

      // 복수 CID 후보가 반환된 경우
      if (json.hasMultipleCids && json.candidates) {
        setPubchemCandidates(json.candidates);
        setPubchemData(null);
        return;
      }

      setPubchemData(json as PubChemLookupResult);
    } catch (err: any) {
      console.warn("PubChem 조회 실패:", err);
      setPubchemError("PubChem 정보를 일시적으로 불러오지 못했습니다. 등록된 사내 SDS 문서는 정상적으로 이용할 수 있습니다.");
      setPubchemData(null);
    } finally {
      setPubchemLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header */}
      <div className="border-b border-slate-200 pb-5 space-y-2">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <FileSearch className="h-6 w-6 text-blue-600" />
          <span>MSDS / SDS 화학물질 통합 라이브러리</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          사내 등록 제조사 공인 SDS 문서 및 PubChem GHS 화학안전 정보를 한 곳에서 조회합니다.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="CAS 번호 (예: 67-64-1, 67-56-1) 또는 화학물질명 검색..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={pubchemLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {pubchemLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span>통합 검색</span>
          </button>
        </form>

        {/* Quick Search Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">빠른 검색 예시:</span>
          {[
            { label: "Acetone (67-64-1)", cas: "67-64-1" },
            { label: "Methanol (67-56-1)", cas: "67-56-1" },
            { label: "Acetonitrile (75-05-8)", cas: "75-05-8" },
            { label: "Dichloromethane (75-09-2)", cas: "75-09-2" },
          ].map((item) => (
            <button
              key={item.cas}
              type="button"
              onClick={() => {
                setQuery(item.cas);
                handleSearch(item.cas);
              }}
              className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 font-mono font-medium hover:bg-blue-50 hover:text-blue-700 transition"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Priority 1: 사내 등록 공식 제조사 SDS (안전관리 최우선) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">1. 사내 등록 제조사 공식 SDS</h2>
            <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
              우선 적용 문서
            </span>
          </div>
        </div>

        {filteredSds.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
            사내 DB에 등록된 공식 SDS 문서가 없습니다. (관리자 등록 필요)
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSds.map((sds) => (
              <div
                key={sds.id}
                className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm space-y-3 hover:border-blue-300 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 text-base line-clamp-1">{sds.chemical_name}</h3>
                  {sds.cas_number && (
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">
                      CAS {sds.cas_number}
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-slate-400" />
                    <span>제조사: {sds.manufacturer || "미지정"}</span>
                  </div>
                  {sds.product_number && <div>제품번호: {sds.product_number}</div>}
                  {sds.revision_date && (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>개정일자: {formatDate(sds.revision_date)}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  {sds.file_path ? (
                    <button
                      onClick={() => alert("사내 Storage PDF 열람 모달을 호출합니다.")}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>공식 SDS PDF 보기</span>
                    </button>
                  ) : sds.external_url ? (
                    <a
                      href={sds.external_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-slate-100 transition"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>제조사 SDS 링크</span>
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">등록된 문서 파일 없음</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Priority 2: PubChem 화학정보 및 GHS 정보 (보조 참고용) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div className="flex items-center gap-2">
            <Atom className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">2. PubChem 화학물질 및 GHS 정보</h2>
            <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
              참고용 보조 정보
            </span>
          </div>
        </div>

        {/* Important Warning Notice */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
          <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>안내:</strong> PubChem 정보는 공공 데이터베이스 기반 참고용 정보이며 공식 SDS의 대체물이 아닙니다.
            실제 취급 및 작업 시에는 사내 승인된 제조사 SDS 문서를 우선 확인하십시오.
          </span>
        </div>

        {/* Loading State */}
        {pubchemLoading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
            <span>PubChem API로부터 화학물질 구조 및 GHS 정보를 조회 중입니다...</span>
          </div>
        )}

        {/* Error / Warning State */}
        {pubchemError && !pubchemLoading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-2">
            <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
            <p className="text-xs sm:text-sm text-slate-600 font-medium">{pubchemError}</p>
          </div>
        )}

        {/* Multiple CID Candidates Selection */}
        {pubchemCandidates && !pubchemLoading && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 space-y-4">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
              <Layers className="h-4 w-4 text-blue-600" />
              <span>복수의 PubChem 구조 후보가 검색되었습니다. 일치하는 구조를 선택해 주세요.</span>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {pubchemCandidates.map((cand) => (
                <button
                  key={cand.cid}
                  onClick={() => fetchPubChem(query, cand.cid)}
                  className="flex items-center justify-between rounded-xl border border-blue-200 bg-white p-3.5 text-left text-xs font-bold text-slate-800 hover:border-blue-500 hover:shadow-sm transition"
                >
                  <div>
                    <div className="font-extrabold text-blue-900">{cand.title}</div>
                    <div className="text-slate-400 font-mono mt-0.5">PubChem CID: {cand.cid}</div>
                  </div>
                  <span className="rounded bg-blue-50 px-2 py-1 text-[11px] text-blue-700">선택</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Single CID Data Presentation */}
        {pubchemData && !pubchemLoading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-8">
            {/* Chemical Header & Structure Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Left 2D Structure Image */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="relative h-48 w-48 overflow-hidden rounded-xl bg-white shadow-inner flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pubchemData.structureImageUrl}
                    alt={pubchemData.title || "2D Structure"}
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="mt-2 text-[11px] font-medium text-slate-400">2D Chemical Structure</span>
              </div>

              {/* Right Molecular Properties */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <span className="text-xs font-mono font-bold text-blue-600">PubChem CID: {pubchemData.cid}</span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">{pubchemData.title || "Unknown"}</h3>
                  {pubchemData.iupacName && (
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{pubchemData.iupacName}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <span className="text-slate-400 font-medium">분자식 (Formula)</span>
                    <p className="font-bold text-slate-900 mt-0.5 font-mono">{pubchemData.molecularFormula || "-"}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <span className="text-slate-400 font-medium">분자량 (Molecular Weight)</span>
                    <p className="font-bold text-slate-900 mt-0.5 font-mono">
                      {pubchemData.molecularWeight ? `${pubchemData.molecularWeight} g/mol` : "-"}
                    </p>
                  </div>
                  <div className="col-span-2 rounded-xl bg-slate-50 p-3">
                    <span className="text-slate-400 font-medium">InChIKey</span>
                    <p className="font-mono text-slate-700 break-all mt-0.5 text-[11px]">
                      {pubchemData.inchiKey || "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* GHS Safety Classification Block */}
            <div className="space-y-5 border-t border-slate-100 pt-6">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <span>GHS 유해성·위험성 분류 (PubChem PUG View)</span>
                </h4>

                {/* Signal Word Badge */}
                {pubchemData.ghs.signalWords.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    {pubchemData.ghs.signalWords.map((word) => (
                      <span
                        key={word}
                        className={`rounded-lg px-3 py-1 text-xs font-black tracking-wider uppercase ${
                          word === "DANGER"
                            ? "bg-red-600 text-white"
                            : "bg-amber-500 text-white"
                        }`}
                      >
                        신호어: {word}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Pictograms */}
              {pubchemData.ghs.pictograms.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700">GHS 그림문자 (Pictograms)</span>
                  <div className="flex flex-wrap gap-3">
                    {pubchemData.ghs.pictograms.map((pic, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm text-center"
                      >
                        {pic.url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={pic.url} alt={pic.name || "GHS"} className="h-12 w-12 object-contain mb-1" />
                        ) : (
                          <div className="h-12 w-12 flex items-center justify-center font-bold text-red-600 border border-red-200 rounded">
                            {pic.code}
                          </div>
                        )}
                        <span className="text-[10px] font-bold text-slate-700 max-w-[80px] truncate">
                          {pic.name || pic.code || "GHS"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                  PubChem에서 GHS 그림문자 정보를 확인하지 못했습니다. (제조사 공식 SDS 확인 필요)
                </div>
              )}

              {/* Hazard Statements (H문구) */}
              {pubchemData.ghs.hazardStatements.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700">유해·위험 문구 (Hazard Statements)</span>
                  <div className="rounded-xl border border-red-100 bg-red-50/40 p-4 space-y-1.5">
                    {pubchemData.ghs.hazardStatements.map((h, idx) => (
                      <div key={idx} className="text-xs text-red-950 flex items-start gap-2">
                        {h.code && (
                          <span className="font-mono font-bold text-red-700 shrink-0">{h.code}</span>
                        )}
                        <span className="leading-relaxed">{h.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Precautionary Statements (P문구) */}
              {pubchemData.ghs.precautionaryStatements.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700">예방조치 문구 (Precautionary Statements)</span>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 max-h-48 overflow-y-auto space-y-1.5">
                    {pubchemData.ghs.precautionaryStatements.map((p, idx) => (
                      <div key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                        {p.code && (
                          <span className="font-mono font-bold text-blue-700 shrink-0">{p.code}</span>
                        )}
                        <span className="leading-relaxed">{p.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Source Provenance */}
              {pubchemData.sources.length > 0 && (
                <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  <span>출처 (Annotation Sources):</span>
                  {pubchemData.sources.slice(0, 4).map((s, idx) => (
                    <span key={idx} className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">
                      {s.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
