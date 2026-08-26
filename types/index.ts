export type PostCategory =
  | "HAZARD"
  | "IMPROVEMENT"
  | "NEAR_MISS"
  | "CHEMICAL"
  | "PPE"
  | "FACILITY"
  | "PROCEDURE"
  | "OTHER";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type PostStatus = "RECEIVED" | "REVIEWING" | "ACTION" | "DONE";

export interface Post {
  id: string;
  author_id: string;
  category: PostCategory;
  title: string;
  content: string;
  location: string | null;
  risk_level: RiskLevel | null;
  status: PostStatus;
  admin_response: string | null;
  admin_response_at: string | null;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostCreateInput {
  category: PostCategory;
  title: string;
  content: string;
  location?: string | null;
  risk_level?: RiskLevel | null;
}

export interface PostUpdateInput {
  category?: PostCategory;
  title?: string;
  content?: string;
  location?: string | null;
  risk_level?: RiskLevel | null;
}

export interface SdsDocument {
  id: string;
  chemical_name: string;
  cas_number: string | null;
  manufacturer: string | null;
  product_number: string | null;
  revision_date: string | null;
  language: string | null;
  file_path: string | null;
  external_url: string | null;
  pubchem_cid: number | null;
  verified_cas: boolean;
  created_at: string;
  updated_at: string;
}

export interface PubChemLookupResult {
  casNumber: string;
  cid: number;
  title: string | null;
  iupacName: string | null;
  molecularFormula: string | null;
  molecularWeight: string | null;
  canonicalSmiles: string | null;
  isomericSmiles: string | null;
  inchi: string | null;
  inchiKey: string | null;
  structureImageUrl: string;
  ghs: {
    signalWords: string[];
    pictograms: Array<{
      code?: string;
      name?: string;
      url?: string;
    }>;
    hazardStatements: Array<{
      code?: string;
      text: string;
      source?: string;
    }>;
    precautionaryStatements: Array<{
      code?: string;
      text: string;
      source?: string;
    }>;
    hazardClasses: Array<{
      name: string;
      category?: string;
      source?: string;
    }>;
  };
  sources: Array<{
    name: string;
    url?: string;
  }>;
  multipleCandidates?: Array<{
    cid: number;
    title: string;
    molecularFormula?: string;
  }>;
  fetchedAt: string;
}

export interface UserRole {
  user_id: string;
  role: "ADMIN" | "USER";
  created_at?: string;
}

export const CATEGORY_LABELS: Record<PostCategory, string> = {
  HAZARD: "위험요소",
  IMPROVEMENT: "개선제안",
  NEAR_MISS: "아차사고",
  CHEMICAL: "화학물질/MSDS",
  PPE: "보호구/PPE",
  FACILITY: "설비/시설",
  PROCEDURE: "작업절차",
  OTHER: "기타",
};

export const RISK_LABELS: Record<RiskLevel, { label: string; color: string; badgeBg: string }> = {
  LOW: { label: "낮음", color: "text-emerald-700", badgeBg: "bg-emerald-50 border-emerald-200" },
  MEDIUM: { label: "보통", color: "text-blue-700", badgeBg: "bg-blue-50 border-blue-200" },
  HIGH: { label: "높음", color: "text-amber-700", badgeBg: "bg-amber-50 border-amber-200" },
  URGENT: { label: "긴급", color: "text-red-700", badgeBg: "bg-red-50 border-red-200" },
};

export const STATUS_LABELS: Record<PostStatus, { label: string; color: string; badgeBg: string; step: number }> = {
  RECEIVED: { label: "접수됨", color: "text-slate-700", badgeBg: "bg-slate-100 border-slate-300", step: 1 },
  REVIEWING: { label: "검토중", color: "text-indigo-700", badgeBg: "bg-indigo-50 border-indigo-200", step: 2 },
  ACTION: { label: "조치중", color: "text-amber-700", badgeBg: "bg-amber-50 border-amber-200", step: 3 },
  DONE: { label: "완료", color: "text-emerald-700", badgeBg: "bg-emerald-50 border-emerald-200", step: 4 },
};
