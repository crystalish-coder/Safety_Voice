"use client";

import { useState, useEffect } from "react";
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
import msdsData from "@/lib/data/msds_data.json";

// 780종 사내 시약 및 MSDS 엑셀 기본 데이터 로드
const FALLBACK_SDS: SdsDocument[] = msdsData as unknown as SdsDocument[];

export default function MsdsSearchPage() {
  const [query, setQuery] = useState("");
  const [internalSdsList, setInternalSdsList] = useState<SdsDocument[]>(FALLBACK_SDS);
  const [filteredSds, setFilteredSds] = useState<SdsDocument[]>(FALLBACK_SDS);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // PubChem 상태
  const [pubchemData, setPubchemData] = useState<PubChemLookupResult | null>(null);
  const [pubchemCandidates, setPubchemCandidates] = useState<Array<{ cid: number; title: string }> | null>(null);
  const [pubchemLoading, setPubchemLoading] = useState(false);
  const [pubchemError, setPubchemError] = useState<string | null>(null);

  useEffect(() => {
    loadInternalSds();
  }, []);

  const loadInternalSds = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      const { data, error } = await supabase.from("sds_documents").select("*");
      if (!error && data && data.length > 0) {
        setInternalSdsList(data as SdsDocument[]);
        setFilteredSds(data as SdsDocument[]);
      }
    } catch (err) {
      console.warn("내부 SDS 로드 오류:", err);
    }
  };

  const handleSearch = async (searchTarget?: string) => {
    const targetQuery = (searchTarget !== undefined ? searchTarget : query).trim();
    setCurrentPage(1);

    if (!targetQuery) {
      setFilteredSds(internalSdsList);
      setPubchemData(null);
      setPubchemCandidates(null);
      setPubchemError(null);
      return;
    }

    // 1. 사내 등록 SDS 필터링 (CAS 번호, 물질명, 제조사, 제품번호)
    const lower = targetQuery.toLowerCase();
    const matchedSds = internalSdsList.filter((sds) => {
      const matchCas = sds.cas_number?.toLowerCase().includes(lower);
      const matchName = sds.chemical_name.toLowerCase().includes(lower);
      const matchMfr = sds.manufacturer?.toLowerCase().includes(lower);
      const matchProd = sds.product_number?.toLowerCase().includes(lower);
      return matchCas || matchName || matchMfr || matchProd;
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
        setPubchemError("CAS 번호(예: 288-88-0, 67-64-1)를 검색창에 입력하시거나 아래 목록의 CAS 번호를 클릭하시면 PubChem 2D 구조 및 GHS 유해위험 정보를 확인할 수 있습니다.");
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

  const totalPages = Math.max(1, Math.ceil(filteredSds.length / itemsPerPage));
  const displayedSds = filteredSds.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header */}
      <div className="border-b border-slate-200 pb-5 space-y-2">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <FileSearch className="h-6 w-6 text-oncobix-500" />
          <span>MSDS / SDS 화학물질 통합 라이브러리</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          온코빅스 사내 등록 시약 780종 및 제조사 공인 SDS, PubChem GHS 화학안전 정보를 한 곳에서 조회합니다.
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
              placeholder="CAS 번호 (예: 288-88-0, 51688-75-6), 시약명 또는 품목코드 검색..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-sm text-slate-900 focus:border-oncobix-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={pubchemLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-oncobix-500 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-oncobix-600 disabled:opacity-50 transition"
          >
            {pubchemLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span>통합 검색</span>
          </button>
        </form>

        {/* Quick Search Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">빠른 검색 예시:</span>
          {[
            { label: "1,2,4-Triazole (288-88-0)", cas: "288-88-0" },
            { label: "Acetone (67-64-1)", cas: "67-64-1" },
            { label: "Methanol (67-56-1)", cas: "67-56-1" },
            { label: "1-Bromo-3-nitrobenzene (585-79-5)", cas: "585-79-5" },
          ].map((item) => (
            <button
              key={item.cas}
              type="button"
              onClick={() => {
                setQuery(item.cas);
                handleSearch(item.cas);
              }}
              className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 font-mono font-medium hover:bg-oncobix-50 hover:text-oncobix-700 transition"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Priority 1: 사내 등록 공식 제조사 SDS (안전관리 최우선) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-oncobix-500" />
            <h2 className="text-lg font-bold text-slate-900">1. 온코빅스 사내 등록 시약 및 공식 SDS</h2>
            <span className="rounded-full bg-oncobix-50 border border-oncobix-200 px-2.5 py-0.5 text-[11px] font-bold text-oncobix-700">
              우선 적용 문서
            </span>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            검색 결과: <strong className="text-oncobix-600 font-bold">{filteredSds.length}건</strong> (전체 {internalSdsList.length}종 중)
          </div>
        </div>

        {filteredSds.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
            일치하는 시약 또는 공식 SDS 문서가 없습니다. (검색어를 변경해 보세요)
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayedSds.map((sds) => (
                <div
                  key={sds.id}
                  className="rounded-2xl border border-oncobix-100 bg-white p-5 shadow-sm space-y-3 hover:border-oncobix-300 transition flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base line-clamp-2" title={sds.chemical_name}>
                        {sds.chemical_name}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {sds.cas_number && (
                        <button
                          type="button"
                          onClick={() => {
                            setQuery(sds.cas_number || "");
                            handleSearch(sds.cas_number || "");
                          }}
                          className="rounded-lg bg-oncobix-50 border border-oncobix-200 px-2 py-0.5 font-mono text-xs font-bold text-oncobix-700 hover:bg-oncobix-100 transition"
                          title="클릭 시 PubChem 화학구조 및 GHS 조회"
                        >
                          CAS {sds.cas_number}
                        </button>
                      )}
                      {sds.product_number && (
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                          품번: {sds.product_number}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>제조/공급사: <strong>{sds.manufacturer || "미지정"}</strong></span>
                      </div>
                      {sds.revision_date && (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span>개정일자: {formatDate(sds.revision_date)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    {sds.file_path ? (
                      <button
                        onClick={() => alert("사내 Storage PDF 열람 모달을 호출합니다.")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-oncobix-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-oncobix-600 transition"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>공식 SDS PDF 보기</span>
                      </button>
                    ) : sds.external_url ? (
                      <a
                        href={sds.external_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-oncobix-700 hover:bg-slate-100 transition"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>제조사 SDS 링크</span>
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">등록된 문서 파일 없음</span>
                    )}

                    {sds.cas_number && (
                      <button
                        type="button"
                        onClick={() => {
                          setQuery(sds.cas_number || "");
                          handleSearch(sds.cas_number || "");
                        }}
                        className="text-xs text-oncobix-600 hover:underline font-semibold"
                      >
                        PubChem 연동 →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  이전
                </button>
                <span className="text-xs text-slate-600 px-2 font-medium">
                  {currentPage} / {totalPages} 페이지
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  다음
                </button>
              </div>
            )}
          </>
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

        {/* Hard Rule Notice: PubChem is auxiliary */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-2.5">
          <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>안내:</strong> PubChem 정보는 공공 데이터베이스 기반 참고용 정보이며 공식 SDS의 대체물이 아닙니다.
            실제 취급 및 작업 시에는 사내 승인된 제조사 SDS 문서를 우선 확인하십시오.
          </span>
        </div>

        {/* Loading State */}
        {pubchemLoading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-oncobix-500" />
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
                  className="flex items-center justify-between rounded-xl border border-blue-200 bg-white p-3.5 text-left text-xs font-bold text-slate-800 hover:border-oncobix-500 hover:shadow-sm transition"
                >
                  <div>
                    <div className="font-extrabold text-blue-900">{cand.title}</div>
                    <div className="text-slate-400 font-mono mt-0.5">PubChem CID: {cand.cid}</div>
                  </div>
                  <span className="text-oncobix-600 font-bold">선택 →</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PubChem Data Display */}
        {pubchemData && !pubchemLoading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-8">
            {/* Header / Basic Info */}
            <div className="flex flex-col md:flex-row gap-6 items-start justify-between border-b border-slate-100 pb-6">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                    CID: {pubchemData.cid}
                  </span>
                  <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-slate-700">
                    CAS: {pubchemData.casNumber}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  {pubchemData.title || "화학물질명 정보 없음"}
                </h3>
                {pubchemData.iupacName && (
                  <p className="text-xs sm:text-sm text-slate-500 font-mono leading-relaxed">
                    IUPAC: {pubchemData.iupacName}
                  </p>
                )}
              </div>

              {/* 2D Structure Image */}
              {pubchemData.structureImageUrl && (
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-inner shrink-0 self-center md:self-start">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pubchemData.structureImageUrl}
                    alt={`${pubchemData.title} 2D Structure`}
                    className="h-36 w-36 object-contain"
                    loading="lazy"
                  />
                  <div className="text-[10px] text-center text-slate-400 mt-1">2D 분자 구조</div>
                </div>
              )}
            </div>

            {/* Properties Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FlaskConical className="h-3.5 w-3.5 text-oncobix-500" />
                <span>주요 분자 물성 정보</span>
              </h4>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                  <span className="text-xs text-slate-500">분자식 (Formula)</span>
                  <p className="mt-1 text-sm font-bold font-mono text-slate-900">
                    {pubchemData.molecularFormula || "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                  <span className="text-xs text-slate-500">분자량 (Mol. Weight)</span>
                  <p className="mt-1 text-sm font-bold font-mono text-slate-900">
                    {pubchemData.molecularWeight ? `${pubchemData.molecularWeight} g/mol` : "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                  <span className="text-xs text-slate-500">InChIKey</span>
                  <p className="mt-1 text-xs font-mono text-slate-700 truncate" title={pubchemData.inchiKey || ""}>
                    {pubchemData.inchiKey || "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                  <span className="text-xs text-slate-500">SMILES</span>
                  <p className="mt-1 text-xs font-mono text-slate-700 truncate" title={pubchemData.canonicalSmiles || ""}>
                    {pubchemData.canonicalSmiles || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* GHS Classification Section */}
            <div className="space-y-5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span>GHS 유해위험성 분류 정보 (PubChem Classification)</span>
                </h4>
                {pubchemData.ghs.signalWords.length > 0 && (
                  <span
                    className={`rounded-full px-3 py-0.5 text-xs font-extrabold ${
                      pubchemData.ghs.signalWords.includes("Danger") || pubchemData.ghs.signalWords.includes("위험")
                        ? "bg-red-100 text-red-700 border border-red-200"
                        : "bg-amber-100 text-amber-700 border border-amber-200"
                    }`}
                  >
                    신호어: {pubchemData.ghs.signalWords.join(", ")}
                  </span>
                )}
              </div>

              {/* Pictograms */}
              {pubchemData.ghs.pictograms.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-500">GHS 그림문자 (픽토그램)</span>
                  <div className="flex flex-wrap gap-3">
                    {pubchemData.ghs.pictograms.map((pic, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center rounded-2xl border border-slate-200 bg-slate-50/50 p-3 w-28 text-center shadow-sm"
                      >
                        {pic.url && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={pic.url} alt={pic.name || "GHS Pictogram"} className="h-12 w-12 object-contain" />
                        )}
                        <span className="mt-2 text-[11px] font-bold text-slate-800">{pic.code || "GHS"}</span>
                        <span className="text-[10px] text-slate-500 leading-tight line-clamp-1">{pic.name || ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                  PubChem에서 해당 물질의 GHS 그림문자를 확인하지 못했습니다. (제조사 공인 SDS 문서를 확인하십시오)
                </div>
              )}

              {/* Hazard Statements (H Codes) */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500">유해·위험 문구 (Hazard Statements)</span>
                {pubchemData.ghs.hazardStatements.length > 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1.5 max-h-48 overflow-y-auto">
                    {pubchemData.ghs.hazardStatements.map((h, i) => (
                      <div key={i} className="text-xs text-slate-700 flex items-start gap-2">
                        {h.code && (
                          <span className="rounded bg-red-100 text-red-700 px-1.5 py-0.2 font-mono font-bold text-[10px] shrink-0 mt-0.5">
                            {h.code}
                          </span>
                        )}
                        <span>{h.text}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                    유해·위험 문구 정보가 없습니다. (제조사 SDS 확인 필요)
                  </div>
                )}
              </div>

              {/* Precautionary Statements (P Codes) */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500">예방조치 문구 (Precautionary Statements)</span>
                {pubchemData.ghs.precautionaryStatements.length > 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1.5 max-h-48 overflow-y-auto">
                    {pubchemData.ghs.precautionaryStatements.map((p, i) => (
                      <div key={i} className="text-xs text-slate-700 flex items-start gap-2">
                        {p.code && (
                          <span className="rounded bg-blue-100 text-blue-700 px-1.5 py-0.2 font-mono font-bold text-[10px] shrink-0 mt-0.5">
                            {p.code}
                          </span>
                        )}
                        <span>{p.text}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                    예방조치 문구 정보가 없습니다. (제조사 SDS 확인 필요)
                  </div>
                )}
              </div>

              {/* Provenance Sources */}
              {pubchemData.sources.length > 0 && (
                <div className="pt-2 text-[11px] text-slate-400">
                  정보 출처 (Provenance): {pubchemData.sources.map((s) => s.name).join(", ")}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
