import {
  PubChemCidResponse,
  PubChemPropertyResponse,
} from "./types";
import { parsePugViewGhs } from "./parser";

const PUBCHEM_REST_BASE = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";
const PUBCHEM_VIEW_BASE = "https://pubchem.ncbi.nlm.nih.gov/rest/pug_view";
const TIMEOUT_MS = 9000;
const MAX_RETRIES = 2;

// 간단한 인메모리 요청 인터벌 관리 (<= 4 requests/sec 목표)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 260; // 약 3.8 req/sec

async function rateLimitDelay() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    await new Promise((res) => setTimeout(res, MIN_REQUEST_INTERVAL_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

/**
 * 안전한 Fetch 래퍼 (Timeout, 429/503 Backoff Retry, Content-Type 검증)
 */
async function fetchWithRetry(url: string, retryCount = 0): Promise<any> {
  await rateLimitDelay();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    clearTimeout(timeoutId);

    // 429 (Rate Limit) 또는 503 (Service Unavailable) 시 Backoff 재시도
    if ((res.status === 429 || res.status === 503) && retryCount < MAX_RETRIES) {
      const backoff = (retryCount + 1) * 600 + Math.random() * 200;
      await new Promise((r) => setTimeout(r, backoff));
      return fetchWithRetry(url, retryCount + 1);
    }

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`PubChem API Error: HTTP ${res.status}`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error(`PubChem API Error: Expected JSON but received ${contentType}`);
    }

    return await res.json();
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err.name === "AbortError") {
      throw new Error("PubChem API 요청 시간이 초과되었습니다 (Timeout).");
    }

    if (retryCount < MAX_RETRIES && (err.message?.includes("fetch") || err.message?.includes("network"))) {
      const backoff = (retryCount + 1) * 800;
      await new Promise((r) => setTimeout(r, backoff));
      return fetchWithRetry(url, retryCount + 1);
    }

    throw err;
  }
}

/**
 * 1. CAS 번호로 CID 목록 조회
 */
export async function getCidsByCas(cas: string): Promise<number[]> {
  const url = `${PUBCHEM_REST_BASE}/compound/identifier/${encodeURIComponent(
    cas
  )}/cids/JSON?identifier_type=CAS`;

  let data: PubChemCidResponse | null = null;
  try {
    data = await fetchWithRetry(url);
  } catch {
    // 1차 실패 시 name fallback 시도
  }

  if (!data?.IdentifierList?.CID || data.IdentifierList.CID.length === 0) {
    const fallbackUrl = `${PUBCHEM_REST_BASE}/compound/name/${encodeURIComponent(
      cas
    )}/cids/JSON`;
    try {
      data = await fetchWithRetry(fallbackUrl);
    } catch {
      return [];
    }
  }

  return data?.IdentifierList?.CID || [];
}

/**
 * 2. CID로 기본 물성 정보 조회
 */
export async function getPropertiesByCid(cid: number) {
  const props =
    "Title,IUPACName,MolecularFormula,MolecularWeight,CanonicalSMILES,IsomericSMILES,InChI,InChIKey";
  const url = `${PUBCHEM_REST_BASE}/compound/cid/${cid}/property/${props}/JSON`;

  const data: PubChemPropertyResponse | null = await fetchWithRetry(url);
  return data?.PropertyTable?.Properties?.[0] || null;
}

/**
 * 3. 복수 CID 후보 요약 정보 조회
 */
export async function getMultipleCandidatesSummary(cids: number[]) {
  const targetCids = cids.slice(0, 5); // 최대 5개 후보
  const url = `${PUBCHEM_REST_BASE}/compound/cid/${targetCids.join(",")}/property/Title,MolecularFormula/JSON`;

  try {
    const data: PubChemPropertyResponse | null = await fetchWithRetry(url);
    if (!data?.PropertyTable?.Properties) return [];
    return data.PropertyTable.Properties.map((p) => ({
      cid: p.CID,
      title: p.Title || `CID ${p.CID}`,
      molecularFormula: p.MolecularFormula,
    }));
  } catch {
    return targetCids.map((cid) => ({ cid, title: `PubChem CID ${cid}` }));
  }
}

/**
 * 4. CID로 PUG View GHS 정보 조회
 */
export async function getGhsByCid(cid: number) {
  const url = `${PUBCHEM_VIEW_BASE}/data/compound/${cid}/JSON?heading=GHS%20Classification`;

  try {
    const data = await fetchWithRetry(url);
    if (!data) return null;
    return parsePugViewGhs(data);
  } catch (err) {
    console.warn(`CID ${cid} GHS 조회 실패:`, err);
    return null;
  }
}
