"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileSearch,
  Plus,
  Trash2,
  ExternalLink,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Building,
} from "lucide-react";
import { SdsDocument } from "@/types";
import { sdsCreateSchema } from "@/lib/validation/schemas";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

// Mock Fallback
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
    external_url: null,
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
    external_url: null,
    pubchem_cid: 887,
    verified_cas: true,
    created_at: "2025-11-03T00:00:00Z",
    updated_at: "2025-11-03T00:00:00Z",
  },
];

export default function AdminMsdsPage() {
  const [sdsList, setSdsList] = useState<SdsDocument[]>(FALLBACK_SDS);
  const [isLoading, setIsLoading] = useState(false);

  // 등록 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chemicalName, setChemicalName] = useState("");
  const [casNumber, setCasNumber] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [productNumber, setProductNumber] = useState("");
  const [revisionDate, setRevisionDate] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadSdsList();
  }, []);

  const loadSdsList = async () => {
    setIsLoading(true);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("sds_documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setSdsList(data as SdsDocument[]);
      }
    } catch (err) {
      console.warn("SDS 목록 조회 오류:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSds = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const validation = sdsCreateSchema.safeParse({
      chemical_name: chemicalName,
      cas_number: casNumber ? casNumber : null,
      manufacturer: manufacturer ? manufacturer : null,
      product_number: productNumber ? productNumber : null,
      revision_date: revisionDate ? revisionDate : null,
      external_url: externalUrl ? externalUrl : null,
      language: "ko",
      verified_cas: !!casNumber,
    });

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    const supabase = getSupabaseBrowserClient();

    let uploadedFilePath: string | null = null;

    try {
      // 1. PDF 파일 업로드 (선택된 경우)
      if (selectedFile && supabase) {
        const fileExt = selectedFile.name.split(".").pop()?.toLowerCase();
        if (fileExt !== "pdf") {
          throw new Error("PDF 형식의 파일만 업로드할 수 있습니다.");
        }

        const fileName = `${crypto.randomUUID()}.pdf`;
        const { error: uploadErr } = await supabase.storage
          .from("sds-documents")
          .upload(fileName, selectedFile, {
            contentType: "application/pdf",
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadErr) {
          console.warn("PDF 업로드 오류:", uploadErr);
        } else {
          uploadedFilePath = fileName;
        }
      }

      // 2. DB 저장
      if (supabase) {
        const { error: insertErr } = await supabase
          .from("sds_documents")
          .insert({
            chemical_name: chemicalName.trim(),
            cas_number: casNumber.trim() || null,
            manufacturer: manufacturer.trim() || null,
            product_number: productNumber.trim() || null,
            revision_date: revisionDate || null,
            external_url: externalUrl.trim() || null,
            file_path: uploadedFilePath,
            language: "ko",
            verified_cas: !!casNumber.trim(),
          });

        if (insertErr) throw insertErr;
      } else {
        // 로컬 mock 추가
        const mockNew: SdsDocument = {
          id: `sds-${Date.now()}`,
          chemical_name: chemicalName.trim(),
          cas_number: casNumber.trim() || null,
          manufacturer: manufacturer.trim() || null,
          product_number: productNumber.trim() || null,
          revision_date: revisionDate || null,
          language: "ko",
          file_path: null,
          external_url: externalUrl.trim() || null,
          pubchem_cid: null,
          verified_cas: !!casNumber.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setSdsList([mockNew, ...sdsList]);
      }

      alert("MSDS/SDS 문서가 성공적으로 등록되었습니다.");
      setIsModalOpen(false);
      resetForm();
      loadSdsList();
    } catch (err: any) {
      alert(err.message || "등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, filePath: string | null) => {
    if (!confirm("이 MSDS 문서를 삭제하시겠습니까?")) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setSdsList(sdsList.filter((item) => item.id !== id));
      return;
    }

    try {
      if (filePath) {
        await supabase.storage.from("sds-documents").remove([filePath]);
      }
      const { error } = await supabase.from("sds_documents").delete().eq("id", id);
      if (error) throw error;
      loadSdsList();
    } catch (err: any) {
      alert(err.message || "삭제 중 오류가 발생했습니다.");
    }
  };

  const resetForm = () => {
    setChemicalName("");
    setCasNumber("");
    setManufacturer("");
    setProductNumber("");
    setRevisionDate("");
    setExternalUrl("");
    setSelectedFile(null);
    setFormErrors({});
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>대시보드로 돌아가기</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileSearch className="h-6 w-6 text-blue-600" />
            <span>사내 MSDS / SDS 문서 관리</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            제조사 공식 SDS PDF 등록, CAS 번호 매핑 및 개정 이력을 관리합니다.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>신규 SDS 문서 등록</span>
        </button>
      </div>

      {/* SDS Document Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">등록된 공식 SDS 문서 ({sdsList.length}건)</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">물질명</th>
                <th className="py-3 px-4">CAS 번호</th>
                <th className="py-3 px-4">제조사</th>
                <th className="py-3 px-4">품번</th>
                <th className="py-3 px-4">개정일</th>
                <th className="py-3 px-4">첨부 문서</th>
                <th className="py-3 px-4 text-right">삭제</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sdsList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    등록된 SDS 문서가 없습니다.
                  </td>
                </tr>
              ) : (
                sdsList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{item.chemical_name}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-700">
                      {item.cas_number || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{item.manufacturer || "-"}</td>
                    <td className="py-3.5 px-4 text-slate-500">{item.product_number || "-"}</td>
                    <td className="py-3.5 px-4 text-slate-500">{item.revision_date || "-"}</td>
                    <td className="py-3.5 px-4">
                      {item.file_path ? (
                        <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                          <FileText className="h-3 w-3" /> PDF 파일
                        </span>
                      ) : item.external_url ? (
                        <a
                          href={item.external_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" /> 링크
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(item.id, item.file_path)}
                        className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 transition"
                        title="문서 삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SDS Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">신규 공식 SDS 문서 등록</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                사내 취급 화학물질의 제조사 승인 SDS 문서를 업로드합니다.
              </p>
            </div>

            <form onSubmit={handleCreateSds} className="space-y-4">
              {/* Chemical Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  물질명 (화학물질 명칭) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="예: Acetone (아세톤)"
                  value={chemicalName}
                  onChange={(e) => setChemicalName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none"
                />
                {formErrors.chemical_name && (
                  <p className="text-xs text-red-600 font-medium">{formErrors.chemical_name}</p>
                )}
              </div>

              {/* CAS Number */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  CAS 번호 (선택 / Check Digit 자동 검증)
                </label>
                <input
                  type="text"
                  placeholder="예: 67-64-1"
                  value={casNumber}
                  onChange={(e) => setCasNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm font-mono focus:border-blue-500 focus:outline-none"
                />
                {formErrors.cas_number && (
                  <p className="text-xs text-red-600 font-medium">{formErrors.cas_number}</p>
                )}
              </div>

              {/* Manufacturer & Product Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">제조사 / 공급업체</label>
                  <input
                    type="text"
                    placeholder="예: Sigma-Aldrich, TCI, Merck"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">제품 번호 (Cat No.)</label>
                  <input
                    type="text"
                    placeholder="예: 650501"
                    value={productNumber}
                    onChange={(e) => setProductNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Revision Date & External URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">개정일 (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={revisionDate}
                    onChange={(e) => setRevisionDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">제조사 공식 SDS 웹 링크</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none"
                  />
                  {formErrors.external_url && (
                    <p className="text-xs text-red-600 font-medium">{formErrors.external_url}</p>
                  )}
                </div>
              </div>

              {/* PDF File Upload */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  SDS PDF 문서 파일 업로드
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-[11px] text-slate-400">PDF 파일만 업로드 가능하며, 최대 10MB까지 권장합니다.</p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                >
                  {isSubmitting ? "업로드 중..." : "문서 저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
