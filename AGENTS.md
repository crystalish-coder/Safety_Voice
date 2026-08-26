# AGENTS.md
## Safety Voice Board — Antigravity Project Rules

이 파일은 프로젝트 전체에 적용되는 작업 규칙이다.
Google Antigravity 또는 다른 coding agent는 새 작업을 시작하기 전에 반드시 이 파일을 먼저 읽는다.

적용 범위:

```text
project root
└── 모든 하위 디렉터리
```

하위 디렉터리에 별도의 `AGENTS.md`가 존재하지 않는 한 이 파일의 규칙이 전체 코드베이스에 적용된다.

---

# 1. 프로젝트 목적

이 프로젝트는 회사/연구소 구성원이 안전관리와 관련된 위험요소, 개선 제안, 아차사고,
PPE/시설/작업절차/MSDS 관련 의견을 익명으로 제시할 수 있게 하는 웹 애플리케이션이다.

핵심 기능:

```text
Anonymous Safety Board
Admin Review
Status Tracking
MSDS / SDS Library
PubChem CAS Lookup
GHS Information
Production Deployment
```

---

# 2. 절대 우선순위

```text
1. Safety
2. Security
3. Privacy / Anonymity
4. Data correctness
5. Access control
6. Testability
7. Maintainability
8. UX
9. Development speed
```

기능을 빨리 만드는 것보다 안전성, 익명성, 권한 분리, 데이터 정확성이 우선이다.

---

# 3. 작업 시작 규칙

모든 작업 전에 다음을 확인한다.

```text
1. AGENTS.md
2. SAFETY_BOARD_ANTIGRAVITY_PLAN.md
3. IMPLEMENTATION_PLAN.md (존재하는 경우)
4. git status
5. directory structure
6. package.json
7. existing migrations
8. existing tests
```

기존 구현을 확인하지 않고 파일을 덮어쓰지 않는다.
이미 작동하는 구조가 있으면 가능한 한 기존 패턴을 따른다.

---

# 4. 작업 방식

```text
Inspect
   ↓
Plan
   ↓
Implement
   ↓
Test
   ↓
Review
   ↓
Next step
```

대규모 변경 전에는 `IMPLEMENTATION_PLAN.md`를 먼저 업데이트한다.

---

# 5. 파괴적 작업 금지

명시적 이유 없이 다음을 하지 않는다.

```text
rm -rf
git reset --hard
git clean -fd
force push
production DB drop
production table truncate
migration history rewrite
secret 출력
secret commit
RLS disable
admin authorization bypass
```

---

# 6. 기술 스택

```text
Next.js App Router
TypeScript strict mode
Tailwind CSS
shadcn/ui
Supabase
Vercel
```

새 dependency는 필요성이 있을 때만 추가한다.

---

# 7. 익명성 규칙

일반 사용자는 Supabase Anonymous Auth를 사용한다.

UI에 절대 표시하지 않는다.

```text
auth.uid()
anonymous UUID
email
IP address
user-agent
fingerprint
internal database ID
```

---

# 8. 로그 규칙

가능하면 기록:

```text
request type
post ID
error code
duration
HTTP status
```

가능하면 기록하지 않음:

```text
게시글 전체 본문
사용자 입력 전문
anonymous UUID
IP address
auth token
SDS private URL
secret
```

production debug log를 남기지 않는다.

---

# 9. Auth / Admin 규칙

일반 사용자:

```text
Anonymous Auth
```

관리자:

```text
Email/Password Auth
+
user_roles
```

관리자 여부를 이메일 하드코딩으로 판단하지 않는다.
권한은 server-side와 database policy에서 모두 검증한다.

---

# 10. RLS 규칙

모든 public application table은 RLS를 사용한다.

일반 사용자 권한:

```text
SELECT public visible posts
INSERT own post
UPDATE own post의 허용 필드
DELETE own post
```

일반 사용자가 변경하면 안 되는 필드:

```text
status
admin_response
admin_response_at
is_hidden
admin-only metadata
```

UI에서 버튼을 숨기는 것만으로 권한을 보호했다고 판단하지 않는다.
API 직접 호출을 기준으로 테스트한다.

---

# 11. Service Role Key

`SUPABASE_SERVICE_ROLE_KEY`는 server only다.

절대 다음 위치에 포함시키지 않는다.

```text
NEXT_PUBLIC_*
Client Component
browser bundle
console
HTML
API response
git
```

---

# 12. Database 변경 규칙

DB 변경은 항상 migration으로 관리한다.

```text
supabase/migrations/
```

Dashboard 수동 변경만 하고 migration을 남기지 않는 방식은 금지한다.

---

# 13. 게시판 입력 규칙

입력은 plain text를 기본으로 한다.
사용자 HTML은 허용하지 않는다.

```text
title <= 100
content <= 5000
location <= 100
```

서버에서도 반드시 validation한다.

---

# 14. 긴급 안전 문구

게시글 작성 화면에 반드시 표시한다.

```text
즉각적인 화재, 누출, 폭발, 인명 위험 또는 응급상황은
이 게시판이 아닌 사내 비상연락 체계를 우선 이용하십시오.
```

이 문구를 제거하거나 눈에 띄지 않게 변경하지 않는다.

---

# 15. SDS / MSDS 정보 우선순위

```text
1. 사내 승인/등록 제조사 SDS
2. 제조사 원문 링크
3. PubChem 참고정보
```

PubChem 정보를 공식 SDS의 대체물로 표현하지 않는다.

UI에는 다음 의미의 안내를 유지한다.

```text
PubChem 정보는 참고용입니다.
실제 취급 및 작업 시 등록된 제조사 SDS를 우선 확인하십시오.
```

---

# 16. PubChem API

공식 public service를 사용한다.

```text
PUG REST
PUG View
```

목적:

```text
CAS → CID
molecular properties
2D structure
GHS annotations
```

---

# 17. CAS validation

CAS 입력은 먼저:

```text
normalize
regex validation
check digit validation
```

을 수행한다.

CAS → CID:

```text
/rest/pug/compound/identifier/{CAS}/cids/JSON?identifier_type=CAS
```

fallback:

```text
/rest/pug/compound/name/{CAS}/cids/JSON
```

PubChem CAS coverage가 완전하지 않음을 전제로 한다.

---

# 18. 복수 CID 처리

하나의 CAS에 여러 CID가 반환되면 절대 `cids[0]`을 자동 확정하지 않는다.

후보별로:

```text
CID
Title
Formula
Structure
```

를 보여주고 확인 후 선택한다.

---

# 19. PubChem properties

가능하면 한 번의 property request로 가져온다.

```text
Title
IUPACName
MolecularFormula
MolecularWeight
CanonicalSMILES
IsomericSMILES
InChI
InChIKey
```

원본 JSON을 UI 전체에 퍼뜨리지 말고 normalized type으로 변환한다.

---

# 20. Structure image

```text
/rest/pug/compound/cid/{CID}/PNG?image_size=400x400
```

이미지 로딩 실패가 페이지 전체 오류가 되지 않게 한다.

---

# 21. GHS parser

PUG View의 `GHS Classification` annotation을 사용한다.

중첩 `Section`을 재귀적으로 탐색하여:

```text
Signal Word
GHS Pictogram
Hazard Statement
Precautionary Statement
Hazard Class
Category
Source
```

를 추출한다.

고정 array index 기반 parser는 피한다.

---

# 22. GHS 데이터 없음

절대 다음처럼 해석하지 않는다.

```text
No GHS data → Safe
No pictogram → Non-hazardous
No H statement → No hazard
```

대신:

```text
PubChem에서 해당 안전정보를 확인하지 못했습니다.
제조사 SDS를 확인하십시오.
```

라고 표시한다.

---

# 23. GHS source provenance

PubChem annotation source를 보존한다.
상충되는 source가 있으면 임의로 한 값을 선택하지 않는다.

기본 화면은 중복을 정리할 수 있지만 상세보기에서는 source별 원 정보를 확인 가능하게 한다.

---

# 24. PubChem rate limit

PubChem 공식 사용 정책을 준수한다.

```text
절대 5 requests/sec를 초과하도록 설계하지 않는다.
내부 목표 <= 4 outbound requests/sec
```

동일 CAS 반복 조회는 cache를 사용한다.

---

# 25. PubChem cache

Supabase `pubchem_cache`를 사용한다.

```text
TTL = 7 days
key = normalized CAS number
```

cache에 사용자 개인정보를 넣지 않는다.

---

# 26. Timeout / retry

timeout:

```text
8~10 seconds
```

retry 허용:

```text
429
503
temporary network error
```

max retry:

```text
2
```

exponential backoff + jitter를 사용한다.
일반 4xx 입력 오류는 반복 재시도하지 않는다.

---

# 27. PubChem failure isolation

PubChem 장애가 있어도 다음은 계속 동작해야 한다.

```text
Internal SDS search
SDS PDF view
Manufacturer metadata
```

표시 예:

```text
PubChem 정보를 일시적으로 불러오지 못했습니다.
등록된 SDS 문서는 계속 이용할 수 있습니다.
```

---

# 28. Server-side PubChem rule

PubChem JSON 호출은 기본적으로 서버에서 처리한다.

```text
GET /api/pubchem/lookup?cas=...
```

권장 파일:

```text
app/api/pubchem/lookup/route.ts
lib/pubchem/client.ts
lib/pubchem/parser.ts
lib/pubchem/cas.ts
lib/pubchem/types.ts
```

Route Handler가 validation, rate limit, cache, fetch, normalize, error mapping을 담당한다.

---

# 29. External SDS crawling

제조사 사이트의 SDS를 자동으로 무단 크롤링하지 않는다.

MVP:

```text
관리자 PDF 등록
external_url
PubChem public API
```

새 외부 연동 전에 API/Terms/Rate limit/License/policy를 확인한다.

---

# 30. 외부 API 오류 처리

반드시 처리:

```text
timeout
429
503
HTML error page
invalid JSON
empty response
schema mismatch
multiple matches
not found
```

`response.ok`만 확인하고 곧바로 `response.json()`하지 않는다.
Content-Type도 확인한다.

---

# 31. 입력 보안

```text
Zod
length limit
enum validation
CAS validation
plain text
parameterized DB query
safe URL construction
```

사용자 문자열을 URL path에 그대로 concatenate하지 않는다.

---

# 32. XSS

`dangerouslySetInnerHTML`을 피한다.
사용자 입력은 React text rendering을 기본으로 한다.

---

# 33. SDS Storage

bucket:

```text
sds-documents
```

권한:

```text
user: read only
admin: upload/update/delete
```

파일명은 UUID 기반으로 저장하고 원본 파일명은 metadata로 관리한다.

---

# 34. PDF upload

관리자만 가능하다.

최소 검증:

```text
.pdf extension
application/pdf MIME
file size limit
safe generated storage path
```

---

# 35. UI / Accessibility

목표:

```text
simple
fast
trustworthy
mobile-friendly
accessible
```

색상만으로 위험도를 전달하지 않는다.

최소:

```text
semantic HTML
form label
keyboard navigation
focus state
aria-label
contrast
```

---

# 36. Testing

새 기능에는 관련 test를 추가한다.

특히:

```text
CAS validation
CAS check digit
PubChem parser
multiple CID
GHS missing
429
503
invalid JSON
cache hit
RLS
admin authorization
```

외부 PubChem API는 자동 test에서 반복 호출하지 않고 fixture/mock을 사용한다.
실제 endpoint는 smoke test에서만 제한적으로 호출한다.

---

# 37. 필수 검증 명령

Phase 완료 시 가능한 범위에서:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

를 실행한다.

실패한 상태를 성공으로 보고하지 않는다.

---

# 38. Environment variables

`.env.example`에는 key 이름만 넣는다.

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

PubChem은 일반적으로 API key가 필요하지 않으므로 가짜 `PUBCHEM_API_KEY`를 만들지 않는다.

---

# 39. Git 규칙

commit 금지:

```text
.env.local
.env.production
secret
token
service role key
temporary dump
large debug files
```

기존 사용자 변경을 임의로 revert하지 않는다.

---

# 40. 완료 보고

작업 완료 시 반드시 다음을 요약한다.

```text
Changed files
Implemented behavior
Database migrations
Security impact
Tests executed
Build result
Known limitations
Next recommended step
```

실행하지 않은 테스트를 실행했다고 쓰지 않는다.

---

# 41. Hard Rules

```text
NEVER expose anonymous identity in UI
NEVER expose service role key
NEVER disable RLS to make a feature work
NEVER rely only on client-side authorization
NEVER treat PubChem as the official workplace SDS
NEVER interpret missing PubChem GHS data as safe
NEVER silently pick CID[0] when multiple CIDs are returned
NEVER scrape external SDS sites without an approved integration
NEVER skip validation because input "looks safe"
NEVER claim tests passed without executing them
NEVER deploy with known authorization failures
```

---

# 42. 새 세션 시작 지침

```text
Read AGENTS.md first.

Then read SAFETY_BOARD_ANTIGRAVITY_PLAN.md.

Inspect the existing project before changing code.

Protect anonymity, RLS, admin authorization,
SDS precedence, PubChem rate limits,
and GHS uncertainty as hard requirements.

Implement the smallest safe change,
test it, then continue.
```
