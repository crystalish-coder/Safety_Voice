import { PubChemGhsParsed } from "./types";

/**
 * PUG View JSON의 Section 트리를 재귀적으로 탐색하여 GHS 안전정보를 파싱합니다.
 */
export function parsePugViewGhs(data: any): {
  ghs: PubChemGhsParsed;
  sources: Array<{ name: string; url?: string }>;
} {
  const result: PubChemGhsParsed = {
    signalWords: [],
    pictograms: [],
    hazardStatements: [],
    precautionaryStatements: [],
    hazardClasses: [],
  };

  const sourcesMap = new Map<string, { name: string; url?: string }>();
  const signalWordsSet = new Set<string>();
  const pictogramsMap = new Map<string, { code?: string; name?: string; url?: string }>();
  const hStatementsMap = new Map<string, { code?: string; text: string; source?: string }>();
  const pStatementsMap = new Map<string, { code?: string; text: string; source?: string }>();

  // 최상위 Record 또는 Section 확인
  const root = data?.Record || data;
  if (!root) {
    return { ghs: result, sources: [] };
  }

  // 재귀 탐색 함수
  function traverseSections(sectionList: any[], currentSource: string = "PubChem") {
    if (!Array.isArray(sectionList)) return;

    for (const section of sectionList) {
      const heading = section.TOCHeading || section.Heading || "";

      // Information 배열 확인
      if (Array.isArray(section.Information)) {
        for (const info of section.Information) {
          const infoName = info.Name || "";
          const sourceName = info.ReferenceNumber
            ? `Reference #${info.ReferenceNumber}`
            : currentSource;

          // 1. Signal Word
          if (infoName.includes("Signal") || heading.includes("Signal")) {
            if (info.Value?.StringWithMarkup) {
              for (const item of info.Value.StringWithMarkup) {
                const word = item.String?.trim().toUpperCase();
                if (word && (word === "DANGER" || word === "WARNING")) {
                  signalWordsSet.add(word);
                }
              }
            }
          }

          // 2. Pictograms
          if (infoName.includes("Pictogram") || heading.includes("Pictogram")) {
            if (Array.isArray(info.Value?.StringWithMarkup)) {
              for (const item of info.Value.StringWithMarkup) {
                if (Array.isArray(item.Markup)) {
                  for (const markup of item.Markup) {
                    if (markup.URL) {
                      const url = markup.URL;
                      const codeMatch = url.match(/GHS\d{2}/i) || item.String?.match(/GHS\d{2}/i);
                      const code = codeMatch ? codeMatch[0].toUpperCase() : undefined;
                      const name = item.String?.trim();
                      const key = code || url;
                      if (!pictogramsMap.has(key)) {
                        pictogramsMap.set(key, { code, name, url });
                      }
                    }
                  }
                }
              }
            }
          }

          // 3. Hazard Statements (H-Statements)
          if (infoName.includes("Hazard Statement") || heading.includes("Hazard Statement")) {
            if (Array.isArray(info.Value?.StringWithMarkup)) {
              for (const item of info.Value.StringWithMarkup) {
                const text = item.String?.trim();
                if (text) {
                  const codeMatch = text.match(/H\d{3}[a-zA-Z]*/);
                  const code = codeMatch ? codeMatch[0] : undefined;
                  const key = `${code || ""}-${text}`;
                  if (!hStatementsMap.has(key)) {
                    hStatementsMap.set(key, { code, text, source: sourceName });
                  }
                }
              }
            }
          }

          // 4. Precautionary Statements (P-Statements)
          if (
            infoName.includes("Precautionary Statement") ||
            heading.includes("Precautionary Statement")
          ) {
            if (Array.isArray(info.Value?.StringWithMarkup)) {
              for (const item of info.Value.StringWithMarkup) {
                const text = item.String?.trim();
                if (text) {
                  const codeMatch = text.match(/P\d{3}(?:\+P\d{3})*/);
                  const code = codeMatch ? codeMatch[0] : undefined;
                  const key = `${code || ""}-${text}`;
                  if (!pStatementsMap.has(key)) {
                    pStatementsMap.set(key, { code, text, source: sourceName });
                  }
                }
              }
            }
          }
        }
      }

      // 하위 Section 재귀 호출
      if (Array.isArray(section.Section)) {
        traverseSections(section.Section, currentSource);
      }
    }
  }

  // Reference 매핑 수집
  if (Array.isArray(root.Reference)) {
    for (const ref of root.Reference) {
      if (ref.SourceName) {
        sourcesMap.set(ref.SourceName, {
          name: ref.SourceName,
          url: ref.SourceURL,
        });
      }
    }
  }

  if (Array.isArray(root.Section)) {
    traverseSections(root.Section);
  }

  result.signalWords = Array.from(signalWordsSet);
  result.pictograms = Array.from(pictogramsMap.values());
  result.hazardStatements = Array.from(hStatementsMap.values());
  result.precautionaryStatements = Array.from(pStatementsMap.values());

  return {
    ghs: result,
    sources: Array.from(sourcesMap.values()),
  };
}
