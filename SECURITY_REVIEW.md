# Safety Voice Board - 보안 점검 및 검증 보고서 (Security Review)

본 문서는 **Safety Voice Board** 프로젝트에 적용된 보안 정책, 취약점 방어 대책 및 검증 결과를 기록한 보고서입니다.

---

## 1. 익명성 및 식별 정보 보호 (Anonymity & Privacy)

| 점검 항목 | 구현 상태 | 검증 결과 |
| :--- | :---: | :--- |
| **UI 내 식별자 노출 방지** | ✅ 적용 | 사용자 `author_id`, UUID, IP 주소, User-Agent, 브라우저 지문 등이 화면 어디에도 렌더링되지 않도록 차단 |
| **익명 인증 (Anonymous Auth)** | ✅ 적용 | Supabase Anonymous Auth를 활용하여 브라우저 로컬 세션으로만 본인 작성 글 수정/삭제 권한 부여 |
| **로그 및 캐시 개인정보 배제** | ✅ 적용 | `pubchem_cache` 및 서버 API 로그에 사용자 개인정보 또는 게시글 본문 전체를 기록하지 않음 |

---

## 2. 데이터베이스 및 RLS(Row Level Security) 접근 제어

| 테이블명 | RLS 활성화 | 세부 정책 및 검증 |
| :--- | :---: | :--- |
| `public.posts` | ✅ 활성화 | • **SELECT**: `is_hidden = false` 또는 관리자 또는 본인 글만 조회 가능<br>• **INSERT**: 인증된 익명 유저의 `auth.uid() = author_id` 검증<br>• **UPDATE**: 본인 글만 수정 가능하며 `status`, `admin_response`, `is_hidden`은 관리자만 수정 가능하도록 WITH CHECK 조건 적용<br>• **DELETE**: 본인 또는 관리자만 삭제 가능 |
| `public.sds_documents` | ✅ 활성화 | • **SELECT**: 전 구성원 읽기 허용<br>• **INSERT/UPDATE/DELETE**: `is_admin()` 관리자만 허용 |
| `public.user_roles` | ✅ 활성화 | • **SELECT**: 본인 역할 또는 관리자 조회<br>• **CUD**: 관리자 전용 |
| `public.pubchem_cache` | ✅ 활성화 | • 전 구성원 읽기/조회 허용, 7일 후 만료 처리 |
| `storage.objects` (`sds-documents`) | ✅ 활성화 | • **SELECT**: 공개 읽기 허용<br>• **INSERT/DELETE**: `is_admin()` 관리자만 허용 |

---

## 3. 비밀키 및 환경변수 보호 (Secret Isolation)

| 점검 항목 | 상태 | 세부 내용 |
| :--- | :---: | :--- |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ 안전 | `NEXT_PUBLIC_` 접두사를 절대 사용하지 않으며 서버(`lib/supabase/server.ts`)에서만 호출 |
| `.gitignore` 설정 | ✅ 완료 | `.env`, `.env.local`, `.env.production` 등이 Git에 커밋되지 않도록 제외 처리 |
| `.env.example` | ✅ 완료 | 민감 정보 없이 키 이름 템플릿만 제공 |

---

## 4. 입력값 검증 및 XSS / Injection 방어

| 취약점 유형 | 방어 메커니즘 |
| :--- | :--- |
| **XSS (Cross-Site Scripting)** | • `dangerouslySetInnerHTML` 일체 미사용<br>• React 기본 텍스트 이스케이프 및 CSS `whitespace-pre-wrap` 기반 안전한 렌더링 |
| **길이 제한 및 유효성 검증** | • Zod 기반 서버/클라이언트 이중 검증<br>• 제목: 2~100자, 본문: 5~5000자, 위치: 100자 이내<br>• HTML 직접 입력 불허 |
| **CAS Number Injection 방어** | • 정규식 검증(`^\d{2,7}-\d{2}-\d$`) 및 Modulo 10 Check Digit 알고리즘 통과 시에만 외부 API 호출<br>• `encodeURIComponent` 처리로 URL 파라미터 인젝션 방어 |

---

## 5. PubChem 연동 안정성 및 장애 격리 (Failure Isolation)

| 항목 | 구현 내용 |
| :--- | :--- |
| **Rate Limiting** | 인메모리 요청 지연 제어를 통해 PubChem 정책(<= 5 req/sec) 대비 안전한 최대 3.8 req/sec 수준으로 제한 |
| **캐싱 정책** | Supabase `pubchem_cache` 테이블을 통한 7일 TTL 캐싱으로 동일 물질 반복 조회 트래픽 최소화 |
| **Timeout & Retry** | 9초 Timeout (`AbortController`), 429/503 발생 시 Exponential Backoff + Jitter 적용 (최대 2회) |
| **Content-Type 검증** | `application/json` 응답 헤더 사전 검증으로 HTML 오류 페이지 오인 방지 |
| **복수 CID 처리** | 복수 후보 반환 시 임의 확정하지 않고 사용자 선택 인터페이스 제공 |
| **장애 격리 (Fallback)** | PubChem 장애/미응답 시에도 사내 등록 SDS 문서 검색 및 PDF 열람은 중단 없이 정상 작동 |

---

## 6. 결론

모든 보안 점검 항목이 사전에 정의된 `AGENTS.md` 및 `SAFETY_BOARD_ANTIGRAVITY_PLAN.md`의 안전성/익명성 원칙에 완벽히 부합하며, 취약점 없이 안전하게 구현되었습니다.
