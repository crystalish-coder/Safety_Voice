/**
 * CAS Registry Number 검증 및 정규화 유틸리티
 * 
 * 형식: [2~7자리 숫자]-[2자리 숫자]-[1자리 체크디지트]
 * 체크디지트 계산법:
 *  - 체크디지트를 제외한 숫자열(오른쪽부터 1, 2, 3, ... 가중치 부여)
 *  - 각 자리 숫자 * 가중치의 합을 10으로 나눈 나머지(modulo 10)가 체크디지트와 일치해야 함.
 */

export function normalizeCas(cas: string): string {
  return cas.trim().replace(/\s+/g, "");
}

export function isValidCasFormat(cas: string): boolean {
  const normalized = normalizeCas(cas);
  const casRegex = /^\d{2,7}-\d{2}-\d$/;
  return casRegex.test(normalized);
}

export function isValidCasCheckDigit(cas: string): boolean {
  const normalized = normalizeCas(cas);
  if (!isValidCasFormat(normalized)) {
    return false;
  }

  const parts = normalized.split("-");
  if (parts.length !== 3) return false;

  const digits = (parts[0] + parts[1]).split("").map(Number);
  const checkDigit = Number(parts[2]);

  let sum = 0;
  const len = digits.length;

  for (let i = 0; i < len; i++) {
    // 가장 오른쪽 숫자부터 가중치 1, 2, 3...
    const weight = len - i;
    sum += digits[i] * weight;
  }

  return sum % 10 === checkDigit;
}

export function validateCasNumber(cas: string): { isValid: boolean; error?: string; normalized: string } {
  const normalized = normalizeCas(cas);
  if (!normalized) {
    return { isValid: false, error: "CAS 번호를 입력해 주세요.", normalized };
  }
  if (!isValidCasFormat(normalized)) {
    return { isValid: false, error: "유효한 CAS 번호 형식이 아닙니다. (예: 67-64-1)", normalized };
  }
  if (!isValidCasCheckDigit(normalized)) {
    return { isValid: false, error: "CAS 체크 디지트가 일치하지 않는 유효하지 않은 번호입니다.", normalized };
  }
  return { isValid: true, normalized };
}
