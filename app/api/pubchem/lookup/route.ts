import { NextRequest, NextResponse } from "next/server";
import { validateCasNumber } from "@/lib/pubchem/cas";
import {
  getCidsByCas,
  getPropertiesByCid,
  getGhsByCid,
  getMultipleCandidatesSummary,
} from "@/lib/pubchem/client";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { PubChemLookupResult } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const casParam = searchParams.get("cas");
  const selectedCidParam = searchParams.get("cid");

  if (!casParam) {
    return NextResponse.json(
      { error: "CAS 번호가 제공되지 않았습니다." },
      { status: 400 }
    );
  }

  // 1. CAS 번호 형식 및 Check Digit 검증
  const casValidation = validateCasNumber(casParam);
  if (!casValidation.isValid) {
    return NextResponse.json(
      { error: casValidation.error || "유효하지 않은 CAS 번호입니다." },
      { status: 400 }
    );
  }

  const normalizedCas = casValidation.normalized;
  const supabase = getSupabaseServiceClient();

  // 2. Supabase 캐시 확인 (특정 cid 지정이 아닌 경우 기본 캐시 확인)
  if (!selectedCidParam && supabase) {
    try {
      const { data: cached } = await supabase
        .from("pubchem_cache")
        .select("payload, expires_at")
        .eq("cas_number", normalizedCas)
        .single();

      if (cached && new Date(cached.expires_at) > new Date()) {
        return NextResponse.json(cached.payload);
      }
    } catch {
      // 캐시 테이블 없거나 조회 실패 시 API 직접 조회 진행
    }
  }

  try {
    let targetCid: number | null = selectedCidParam ? Number(selectedCidParam) : null;
    let multipleCandidates: Array<{ cid: number; title: string; molecularFormula?: string }> | undefined;

    // 3. CID 결정 (미지정 시 CAS -> CIDs 조회)
    if (!targetCid) {
      const cids = await getCidsByCas(normalizedCas);

      if (cids.length === 0) {
        return NextResponse.json(
          {
            error: "PubChem에서 해당 CAS 번호에 일치하는 화학물질 구조를 찾지 못했습니다.",
            casNumber: normalizedCas,
            notFound: true,
          },
          { status: 404 }
        );
      }

      if (cids.length > 1) {
        // 복수 후보가 존재하는 경우 자동 확정하지 않고 후보군 반환
        const candidates = await getMultipleCandidatesSummary(cids);
        return NextResponse.json({
          casNumber: normalizedCas,
          hasMultipleCids: true,
          candidates,
          message: "복수의 PubChem 구조 후보가 검색되었습니다. 아래 목록에서 선택해 주세요.",
        });
      }

      targetCid = cids[0];
    }

    // 4. 단일 CID에 대한 물성 및 GHS 상세 정보 조회
    const [properties, ghsData] = await Promise.all([
      getPropertiesByCid(targetCid),
      getGhsByCid(targetCid),
    ]);

    const result: PubChemLookupResult = {
      casNumber: normalizedCas,
      cid: targetCid,
      title: properties?.Title || null,
      iupacName: properties?.IUPACName || null,
      molecularFormula: properties?.MolecularFormula || null,
      molecularWeight: properties?.MolecularWeight ? String(properties.MolecularWeight) : null,
      canonicalSmiles: properties?.CanonicalSMILES || null,
      isomericSmiles: properties?.IsomericSMILES || null,
      inchi: properties?.InChI || null,
      inchiKey: properties?.InChIKey || null,
      structureImageUrl: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${targetCid}/PNG?image_size=400x400`,
      ghs: ghsData?.ghs || {
        signalWords: [],
        pictograms: [],
        hazardStatements: [],
        precautionaryStatements: [],
        hazardClasses: [],
      },
      sources: ghsData?.sources || [],
      fetchedAt: new Date().toISOString(),
    };

    // 5. 캐시 저장 (7일 TTL)
    if (supabase) {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      try {
        await supabase.from("pubchem_cache").upsert({
          cas_number: normalizedCas,
          cid: targetCid,
          payload: result,
          fetched_at: new Date().toISOString(),
          expires_at: expiresAt,
        });
      } catch (cacheErr) {
        console.warn("PubChem 캐시 저장 실패(계속 진행):", cacheErr);
      }
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("PubChem lookup error:", err);
    return NextResponse.json(
      {
        error: err.message || "PubChem 정보를 조회하는 중 오류가 발생했습니다.",
        casNumber: normalizedCas,
      },
      { status: 502 }
    );
  }
}
