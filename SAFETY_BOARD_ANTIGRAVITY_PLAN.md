# Safety Voice Board
## Google Antigravity 개발·배포 작업 명세서

> 목적: 사내 구성원이 신원을 공개하지 않고 안전관리와 관련된 위험요소, 개선 의견, 아차사고, 화학물질/MSDS 관련 의견을 제시할 수 있는 간단한 웹 서비스를 구축한다.  
> 개발 방식: Google Antigravity에 이 문서를 프로젝트 루트에서 읽게 한 뒤 단계적으로 구현한다.  
> 권장 스택: Next.js + TypeScript + Tailwind CSS + Supabase + Vercel

---

# 1. 프로젝트 목표

다음 기능을 가진 간단하고 안정적인 안전관리 웹 서비스를 만든다.

1. 익명 게시판
2. 안전관리 의견 등록
3. 글 조회 / 검색 / 필터링
4. 작성자 본인 글 수정·삭제
5. 관리자 상태 관리
6. MSDS/SDS 검색 탭
7. 관리자 MSDS PDF 등록 및 관리
8. 모바일/PC 반응형 UI
9. 실제 인터넷 배포
10. 기본적인 보안 및 스팸 방지

서비스의 임시 명칭은 아래와 같이 사용한다.

**Safety Voice Board**

향후 이름은 변경 가능하도록 하드코딩하지 말고 설정 파일 또는 상수로 관리한다.

---

# 2. 핵심 설계 원칙

## 2.1 사용자에게는 익명

게시판 화면에는 아래 정보를 노출하지 않는다.

- 이름
- 이메일
- 사번
- 로그인 ID
- IP 주소
- 사용자 UUID
- 브라우저 정보

게시물에는 기본적으로 아래 정도만 표시한다.

- 제목
- 내용
- 카테고리
- 작성일
- 처리상태
- 관리자 답변 또는 처리내용

표시 예:

```text
[위험요소] 실험실 후드 주변 적재물 관련 의견
2026-08-26
상태: 검토중

후드 주변에 박스가 장기간 적재되어 있어
통행 및 비상상황 시 문제가 될 수 있을 것 같습니다.
```

---

# 3. 익명 인증 방식

완전한 무인증 게시판보다 다음 구조를 사용한다.

```text
Browser
   ↓
Supabase Anonymous Auth
   ↓
Anonymous UUID
   ↓
Post 작성
```

사용자는 회원가입이나 이메일 입력을 하지 않는다.

최초 접속 시:

```typescript
supabase.auth.signInAnonymously()
```

방식으로 익명 사용자 UUID를 생성한다.

DB에는 작성자의 UUID를 저장하지만 UI에는 절대 표시하지 않는다.

이를 이용해:

- 작성자는 자신의 게시글 수정 가능
- 작성자는 자신의 게시글 삭제 가능
- 다른 사용자의 글 수정 불가
- 관리자는 전체 관리 가능

하도록 한다.

주의:

브라우저 쿠키/스토리지를 삭제하거나 다른 브라우저를 사용하면 익명 계정을 복구할 수 없다.

따라서 MVP에서는 다음 정책을 사용한다.

```text
익명 작성자 = 동일 브라우저에서만 자신의 게시물 수정/삭제 가능
```

---

# 4. 추천 기술 스택

## Frontend

```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui
Lucide Icons
```

가능하면 Next.js App Router를 사용한다.

---

## Backend / Database

```text
Supabase
```

사용 기능:

```text
PostgreSQL
Anonymous Auth
Row Level Security
Storage
```

---

## Deployment

1차 권장:

```text
Vercel
```

DB:

```text
Supabase Cloud
```

구조:

```text
Internet
   │
   ▼
Vercel
Next.js
   │
   ▼
Supabase
 ├─ Auth
 ├─ PostgreSQL
 └─ Storage
```

---

# 5. 페이지 구조

다음 페이지를 만든다.

```text
/
├── 홈
├── /board
│   ├── 게시글 목록
│   ├── 게시글 상세
│   └── 새 글 작성
│
├── /msds
│   ├── MSDS 목록
│   ├── 검색
│   └── PDF 보기
│
└── /admin
    ├── 관리자 로그인
    ├── 게시글 관리
    └── MSDS 관리
```

상단 Navigation:

```text
Safety Voice
---------------------------------
홈 | 안전 의견 | MSDS | 이용안내
```

관리자 링크는 Footer 또는 별도 URL로 접근하게 한다.

---

# 6. 홈 화면

홈 화면은 복잡하게 만들지 않는다.

구성:

```text
Safety Voice
더 안전한 작업환경을 위한 익명 의견 게시판

[안전 의견 남기기]
[MSDS 검색]

────────────────

현재 접수 현황
접수 12 | 검토중 5 | 조치중 3 | 완료 18

────────────────

최근 안전 의견
```

안내 문구:

```text
이 게시판은 안전관리 개선을 위한 익명 의견 수렴 공간입니다.

개인을 특정할 수 있는 정보,
환자/고객 개인정보,
비밀번호 및 계정정보 등은 입력하지 마십시오.
```

---

# 7. 게시판 기능

## 7.1 게시글 필드

게시글 작성 화면:

```text
카테고리 *
제목 *
내용 *
장소 (선택)
위험도 (선택)
```

카테고리:

```text
위험요소
개선제안
아차사고
화학물질/MSDS
보호구/PPE
설비/시설
작업절차
기타
```

위험도:

```text
낮음
보통
높음
긴급
```

긴급 항목 선택 시 안내:

```text
즉각적인 사고 또는 인명 위험이 있는 상황은
게시판 접수만으로 대응하지 말고
사내 비상연락 체계를 우선 이용하십시오.
```

---

# 8. 게시글 상태

관리자가 상태를 변경할 수 있도록 한다.

```text
RECEIVED
REVIEWING
ACTION
DONE
```

UI 표시:

```text
접수됨
검토중
조치중
완료
```

상태 흐름:

```text
접수됨
   ↓
검토중
   ↓
조치중
   ↓
완료
```

---

# 9. 관리자 답변

관리자는 게시물에 공개 답변을 남길 수 있다.

예:

```text
관리자 답변

해당 사항을 확인하였습니다.
후드 주변 적재물을 금일 정리하였으며,
향후 해당 구역에 적재 금지 표시를 추가할 예정입니다.
```

관리자 답변 필드:

```text
admin_response
admin_response_at
```

---

# 10. 게시판 검색

검색 대상:

```text
제목
본문
카테고리
장소
```

필터:

```text
카테고리
처리상태
위험도
작성기간
```

정렬:

```text
최신순
오래된순
```

MVP에서는 페이지당 20개 표시.

---

# 11. 데이터베이스 설계

## posts

```sql
create table public.posts (
  id uuid primary key default gen_random_uuid(),

  author_id uuid not null,

  category text not null,
  title text not null,
  content text not null,

  location text,
  risk_level text,

  status text not null default 'RECEIVED',

  admin_response text,
  admin_response_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

category check constraint를 추가한다.

허용값:

```text
HAZARD
IMPROVEMENT
NEAR_MISS
CHEMICAL
PPE
FACILITY
PROCEDURE
OTHER
```

risk_level:

```text
LOW
MEDIUM
HIGH
URGENT
```

status:

```text
RECEIVED
REVIEWING
ACTION
DONE
```

---

# 12. MSDS 테이블

MSDS는 실제로는 SDS라는 명칭이 더 일반적이므로
UI에서는 사용자 친숙성을 위해 다음과 같이 표기한다.

```text
MSDS / SDS
```

DB:

```sql
create table public.sds_documents (
  id uuid primary key default gen_random_uuid(),

  chemical_name text not null,
  cas_number text,

  manufacturer text,
  product_number text,

  revision_date date,
  language text default 'ko',

  file_path text,
  external_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

# 13. MSDS 문서 저장

Supabase Storage bucket:

```text
sds-documents
```

관리자만 업로드/삭제 가능.

사용자는 읽기만 가능.

파일명은 원본명을 그대로 사용하지 말고 안전하게 변경한다.

예:

```text
{uuid}.pdf
```

DB에는 실제 표시용 메타데이터를 별도로 저장한다.

---

# 14. MSDS 탭 UI

검색창:

```text
물질명 또는 CAS No. 검색
```

예:

```text
Acetone
67-64-1
Methanol
67-56-1
```

검색 결과:

| 물질명 | CAS No. | 제조사 | 개정일 | 문서 |
|---|---|---|---|---|
| Acetone | 67-64-1 | Sigma-Aldrich | 2026-01-10 | PDF |
| Methanol | 67-56-1 | TCI | 2025-11-03 | PDF |

버튼:

```text
[MSDS 보기]
```

클릭 시 새 탭 또는 내부 PDF Viewer에서 표시.

---

# 15. MSDS / PubChem 자동 연동 설계

MSDS 탭은 **사내 등록 SDS**와 **PubChem 자동 화학정보**를 한 화면에서 결합한다.

중요 원칙:

```text
사내/제조사 SDS = 작업 및 안전관리의 우선 문서
PubChem 정보 = 참고용 보조 정보
```

PubChem의 CAS 매핑과 GHS 데이터가 없거나 서로 다른 출처에서 상충할 수 있으므로,
PubChem 결과만으로 특정 물질의 안전성을 확정하지 않는다.

---

## 15.1 검색 UX

검색창 기본 placeholder:

```text
CAS No. 입력 (예: 67-64-1)
```

추가로 물질명 검색도 지원할 수 있지만,
1차 자동조회 흐름의 기본 key는 CAS Number로 한다.

사용자가 CAS를 입력하면:

```text
CAS 입력
   ↓
형식 + check digit 검증
   ↓
내부 SDS DB 검색
   ↓
PubChem CAS → CID 조회
   ↓
CID가 1개이면 자동 선택
   ↓
기본 물성 조회
   ↓
2D 구조 이미지 조회
   ↓
GHS Classification 조회
   ↓
통합 결과 화면
```

CID가 여러 개면 임의로 첫 번째 CID를 선택하지 않는다.

대신:

```text
PubChem에서 복수의 후보 구조가 검색되었습니다.
구조/물질명을 확인해 선택하십시오.
```

메시지와 함께 후보를 보여준다.

---

## 15.2 CAS 형식 검증

CAS Number는 서버와 클라이언트에서 모두 검증한다.

형식 예:

```text
67-64-1
50-78-2
7732-18-5
```

정규식 예:

```text
^\d{2,7}-\d{2}-\d$
```

형식 검증 외에 CAS check digit도 검증한다.

검증 실패 시 PubChem 요청을 보내지 않는다.

표시:

```text
유효한 CAS 번호 형식이 아닙니다.
```

---

## 15.3 PubChem API 사용

PubChem 연동은 두 계층을 사용한다.

### A. PUG REST

용도:

```text
CAS → PubChem CID
기본 물성
2D structure image
```

CAS → CID의 1차 요청:

```text
https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/identifier/{CAS}/cids/JSON?identifier_type=CAS
```

fallback:

```text
https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{CAS}/cids/JSON
```

기본 properties:

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

예시 endpoint pattern:

```text
https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{CID}/property/Title,IUPACName,MolecularFormula,MolecularWeight,CanonicalSMILES,IsomericSMILES,InChI,InChIKey/JSON
```

2D structure:

```text
https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{CID}/PNG?image_size=400x400
```

---

### B. PUG View

용도:

```text
GHS Classification
Signal word
Hazard statements
Precautionary statements
Pictograms
Hazard class/category
Data source
```

endpoint pattern:

```text
https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/{CID}/JSON?heading=GHS%20Classification
```

PUG View JSON의 `Section` 구조가 중첩될 수 있으므로
heading 이름을 하드코딩한 고정-depth parser를 만들지 않는다.

재귀적으로 Section을 순회해서 필요한 값을 추출한다.

---

## 15.4 PubChem 서버 API 구조

브라우저에서 PubChem JSON API를 직접 호출하지 않는다.

Next.js Route Handler:

```text
GET /api/pubchem/lookup?cas=67-64-1
```

파일 예:

```text
app/api/pubchem/lookup/route.ts
lib/pubchem/client.ts
lib/pubchem/parser.ts
lib/pubchem/cas.ts
lib/pubchem/types.ts
```

역할:

```text
route.ts
  - 입력 validation
  - cache 확인
  - client 호출
  - response normalization

client.ts
  - PUG REST
  - PUG View
  - timeout
  - retry
  - HTTP error handling

parser.ts
  - GHS JSON recursive parsing
  - pictogram extraction
  - H/P statement extraction
  - source provenance 유지

cas.ts
  - CAS normalization
  - regex validation
  - check digit validation
```

---

## 15.5 API 응답 타입

애플리케이션 내부에서는 PubChem 원본 JSON을 UI에서 직접 사용하지 않는다.

normalized type 예:

```typescript
type PubChemLookupResult = {
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

  fetchedAt: string;
};
```

---

## 15.6 MSDS 화면 레이아웃

CAS 검색 후 다음 순서로 표시한다.

```text
────────────────────────────────
MSDS / SDS 검색
[ 67-64-1                 ] [검색]
────────────────────────────────

Acetone
CAS 67-64-1
PubChem CID 180

┌──────────────────┐
│                  │
│   2D Structure   │
│                  │
└──────────────────┘

Molecular Formula   C3H6O
Molecular Weight    58.08
IUPAC Name          propan-2-one

────────────────────────────────
GHS 정보 (PubChem 참고정보)

[ GHS02 ] [ GHS07 ]

Signal Word
DANGER

Hazard Statements
H225 Highly flammable liquid and vapour
H319 Causes serious eye irritation
...

────────────────────────────────
사내 등록 SDS

Sigma-Aldrich
Revision: 2026-01-10
[공식 SDS PDF 보기]

TCI
Revision: 2025-11-03
[공식 SDS PDF 보기]
────────────────────────────────
```

실제 UI에서는 **사내 등록 SDS 영역을 PubChem 정보보다 위에 배치하는 방식도 허용**한다.
안전관리 운영상 공식 문서 접근성이 최우선이다.

---

## 15.7 GHS pictogram

PubChem이 반환하는 pictogram URL이 있으면 해당 URL을 사용한다.

UI 내부에서는 다음 code도 인식 가능하도록 한다.

```text
GHS01 Exploding Bomb
GHS02 Flame
GHS03 Flame Over Circle
GHS04 Gas Cylinder
GHS05 Corrosion
GHS06 Skull and Crossbones
GHS07 Exclamation Mark
GHS08 Health Hazard
GHS09 Environment
```

pictogram이 없다는 이유만으로:

```text
비위험 물질
안전함
```

이라고 표시하지 않는다.

대신:

```text
PubChem에서 GHS pictogram 정보를 확인하지 못했습니다.
등록된 제조사 SDS를 확인하십시오.
```

라고 표시한다.

---

## 15.8 GHS 정보의 출처 처리

PubChem GHS는 여러 외부 source의 annotation을 포함할 수 있다.

따라서 parser에서 source 정보를 삭제하지 않는다.

상충되는 데이터가 있으면 하나로 강제 병합하지 말고:

```text
출처별 GHS 정보
```

를 펼쳐볼 수 있도록 한다.

기본 화면은 중복 H/P statement를 정리해 보여주되,
상세 화면에서 원 출처를 확인할 수 있게 한다.

---

## 15.9 PubChem CAS 주의사항

PubChem의 CAS 정보는 외부 기관이 제공한 synonym/annotation을 기반으로 하며,
PubChem이 CAS Registry Number의 권위 기관은 아니다.

따라서 다음 규칙을 지킨다.

```text
1. PubChem CAS → CID 결과가 없을 수 있다.
2. 복수 CID 결과를 자동 확정하지 않는다.
3. CAS 검색 실패를 "물질 없음"으로 해석하지 않는다.
4. PubChem 결과와 사내 SDS가 충돌하면 사내에서 승인된 SDS를 우선한다.
5. 화면에 "PubChem 참고정보"임을 명시한다.
```

---

## 15.10 PubChem 요청 제한

PubChem PUG REST / PUG View는 공유 서비스이므로 과도한 요청을 보내지 않는다.

애플리케이션 규칙:

```text
PubChem outbound request <= 5 requests/sec
```

실제 구현 목표는 여유를 두어:

```text
최대 4 requests/sec
```

수준으로 제한한다.

한 번의 신규 CAS 검색에서 가능한 요청 수를 최소화한다.

예:

```text
1. CAS → CID
2. properties
3. GHS
4. structure image
```

동일 CAS 재검색은 cache를 우선 사용한다.

---

## 15.11 PubChem cache

Supabase에 cache table을 추가한다.

```sql
create table public.pubchem_cache (
  cas_number text primary key,
  cid bigint,
  payload jsonb not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null
);
```

권장 TTL:

```text
7 days
```

조회 순서:

```text
CAS Search
   ↓
Cache exists & not expired?
   ├─ YES → return cache
   └─ NO
        ↓
      PubChem API
        ↓
      Normalize
        ↓
      Cache update
        ↓
      Return
```

`pubchem_cache`에 사용자 개인정보를 저장하지 않는다.

---

## 15.12 timeout / retry

PubChem 요청 timeout:

```text
8~10 seconds
```

재시도:

```text
429
503
network temporary failure
```

에 한해 제한적으로 수행한다.

예:

```text
1차 실패
250~500 ms backoff

2차 실패
1~2 sec backoff

최대 2회 재시도
```

4xx 입력 오류는 반복 재시도하지 않는다.

PubChem이 일시적으로 unavailable한 경우에도
내부 SDS 검색은 계속 동작해야 한다.

표시:

```text
PubChem 정보를 일시적으로 불러오지 못했습니다.
등록된 SDS 문서는 정상적으로 이용할 수 있습니다.
```

---

## 15.13 sds_documents 확장

기존 table에 다음 field 추가를 고려한다.

```sql
alter table public.sds_documents
  add column pubchem_cid bigint,
  add column verified_cas boolean not null default false;
```

의미:

```text
pubchem_cid
관리자가 해당 제조사 SDS와 PubChem 구조의 연결을 확인한 경우 저장

verified_cas
관리자가 CAS와 SDS의 대응을 확인했는지 여부
```

CAS Number 자체는 unique로 만들지 않는다.

동일 CAS에 여러 제조사의 SDS가 존재할 수 있다.

---

## 15.14 MSDS 검색 우선순위 업데이트

최종 검색 흐름:

```text
CAS Number
   │
   ├── Internal SDS DB
   │       ├─ Manufacturer
   │       ├─ Revision
   │       └─ PDF
   │
   └── PubChem
           ├─ CID
           ├─ Structure
           ├─ Molecular properties
           └─ GHS annotations
```

화면에서 중요도:

```text
1. 사내 승인/등록 SDS
2. 제조사 SDS link
3. PubChem 참고 화학정보
```

---

## 15.15 PubChem 기능 실패 시 graceful degradation

다음 상황을 각각 처리한다.

### 잘못된 CAS

```text
유효한 CAS 번호를 입력하십시오.
```

### PubChem CID 없음

```text
PubChem에서 해당 CAS의 구조를 확인하지 못했습니다.
사내 등록 SDS 결과를 확인하십시오.
```

### 복수 CID

```text
복수의 PubChem 구조 후보가 있습니다.
구조와 물질명을 확인해 선택하십시오.
```

### GHS 없음

```text
PubChem에 GHS 정보가 없거나 충분하지 않습니다.
제조사 SDS를 확인하십시오.
```

### PubChem 장애

```text
PubChem 연결이 일시적으로 원활하지 않습니다.
등록된 SDS 문서는 계속 이용할 수 있습니다.
```

어떤 경우에도:

```text
GHS 데이터 없음 = 안전함
```

으로 처리해서는 안 된다.

---

# 16. RLS 보안 정책

Supabase의 모든 public 테이블에 RLS를 활성화한다.

```sql
alter table public.posts enable row level security;
alter table public.sds_documents enable row level security;
```

게시판 기본 정책:

### SELECT

모든 정상 사용자:

```text
게시글 조회 가능
```

### INSERT

익명 인증된 사용자:

```text
자신의 author_id로만 게시글 생성 가능
```

개념:

```sql
author_id = auth.uid()
```

### UPDATE

일반 작성자:

```text
author_id = auth.uid()
```

인 경우에만 자신의 글 수정 가능.

단 다음 필드는 일반 사용자가 수정하지 못하게 한다.

```text
status
admin_response
admin_response_at
```

관리자만 수정 가능.

### DELETE

작성자 또는 관리자만 가능.

---

# 17. 관리자 인증

관리자 계정은 Anonymous Auth를 사용하지 않는다.

Supabase Email/Password Auth를 사용한다.

예:

```text
safety-admin@company.local
```

실제 이메일은 환경 설정에 맞게 입력한다.

admin 판별은 클라이언트 코드에 이메일을 하드코딩하지 않는다.

권장 구조:

```text
profiles
```

또는

```text
user_roles
```

테이블을 사용한다.

예:

```sql
create table public.user_roles (
  user_id uuid primary key,
  role text not null
);
```

role:

```text
ADMIN
```

---

# 18. 관리자 화면

URL:

```text
/admin
```

메뉴:

```text
Dashboard
게시글 관리
MSDS 관리
```

Dashboard:

```text
오늘 접수
미처리
긴급
완료
```

게시글 관리:

```text
검색
카테고리 필터
상태 필터
위험도 필터
```

관리자가 할 수 있는 기능:

```text
게시글 조회
상태 변경
관리자 답변
부적절 게시물 숨김
게시물 삭제
```

---

# 19. 삭제보다 숨김 우선

관리자가 게시글을 제거해야 하는 경우
가능하면 실제 DELETE보다 soft delete를 사용한다.

posts에 추가:

```sql
is_hidden boolean not null default false
```

관리자는:

```text
숨김
복구
```

가 가능하도록 한다.

일반 게시판에서는:

```text
is_hidden = false
```

만 표시한다.

---

# 20. 개인정보 최소화

애플리케이션 DB에는 다음 정보를 저장하지 않는다.

```text
사용자 이름
전화번호
이메일
사번
IP 주소
브라우저 fingerprint
위치정보
```

작성 화면에 안내:

```text
개인을 특정할 수 있는 이름, 사번, 전화번호 등은
본문에 입력하지 마십시오.
```

---

# 21. 입력 보안

다음 방어를 구현한다.

```text
XSS 방지
HTML sanitize
SQL injection 방지
CSRF 고려
Rate Limiting
입력 길이 제한
```

권장 제한:

```text
제목: 100자
내용: 5000자
장소: 100자
```

HTML 직접 입력은 허용하지 않는다.

Markdown도 MVP에서는 사용하지 않는다.

plain text 기반으로 한다.

---

# 22. 스팸 방지

MVP:

```text
동일 사용자 게시글 생성
1분당 최대 3개
```

가능하면 서버에서 제한한다.

추가 옵션:

```text
Cloudflare Turnstile
```

또는 CAPTCHA를 향후 적용 가능하게 만든다.

---

# 23. 첨부파일 정책

1차 MVP에서는 게시판 첨부파일 기능을 제외한다.

이유:

```text
개인정보 포함 이미지
EXIF 위치정보
악성 파일
Storage 비용
관리 부담
```

향후 사진 첨부를 추가한다면:

```text
JPEG/PNG/WebP만 허용
최대 5 MB
EXIF 제거
악성 파일 검사
```

를 적용한다.

MSDS PDF 업로드는 관리자만 가능하다.

---

# 24. UI 스타일

목표:

```text
단순
신뢰감
안전관리 시스템 느낌
모바일 친화적
```

색상 예:

```text
Primary: Navy / Blue
Success: Green
Warning: Amber
Danger: Red
Background: White / Light Gray
```

과도한 애니메이션은 사용하지 않는다.

---

# 25. 모바일 대응

반응형 필수.

지원 목표:

```text
Desktop
Tablet
Mobile
```

모바일에서는 게시판 테이블을 카드 UI로 전환한다.

---

# 26. 접근성

최소한 아래를 적용한다.

```text
label 연결
keyboard navigation
focus state
aria-label
색상 이외의 상태 표시
충분한 contrast
```

---

# 27. 프로젝트 구조

Antigravity는 가능한 아래 구조로 생성한다.

```text
safety-voice-board/
│
├── app/
│   ├── page.tsx
│   │
│   ├── board/
│   │   ├── page.tsx
│   │   ├── new/
│   │   │   └── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   │
│   ├── msds/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   │
│   └── admin/
│       ├── page.tsx
│       ├── posts/
│       └── msds/
│
├── components/
│   ├── layout/
│   ├── board/
│   ├── msds/
│   └── admin/
│
├── lib/
│   ├── supabase/
│   ├── validation/
│   └── utils/
│
├── types/
│
├── supabase/
│   ├── migrations/
│   └── seed.sql
│
├── public/
│
├── .env.example
├── README.md
└── package.json
```

---

# 28. 환경변수

`.env.local`

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

SUPABASE_SERVICE_ROLE_KEY=
```

주의:

```text
SUPABASE_SERVICE_ROLE_KEY
```

는 절대 Client Component에 전달하지 않는다.

Git에도 commit하지 않는다.

`.gitignore` 확인 필수.

---

# 29. TypeScript 타입

최소 타입:

```typescript
type PostCategory =
  | "HAZARD"
  | "IMPROVEMENT"
  | "NEAR_MISS"
  | "CHEMICAL"
  | "PPE"
  | "FACILITY"
  | "PROCEDURE"
  | "OTHER";

type RiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

type PostStatus =
  | "RECEIVED"
  | "REVIEWING"
  | "ACTION"
  | "DONE";
```

---

# 30. Validation

Zod 사용 권장.

예:

```text
title:
min 2
max 100

content:
min 5
max 5000

location:
max 100
```

서버와 클라이언트 모두 검증한다.

---

# 31. 테스트

최소 다음 테스트를 수행한다.

## 익명 인증

```text
[ ] 첫 방문 시 anonymous user 생성
[ ] 새로고침 후 동일 사용자 유지
```

## 게시글

```text
[ ] 게시글 작성
[ ] 게시글 목록 조회
[ ] 게시글 상세 조회
[ ] 자신의 게시글 수정
[ ] 자신의 게시글 삭제
[ ] 타인의 게시글 수정 차단
```

## 관리자

```text
[ ] 일반 사용자는 /admin 관리 기능 사용 불가
[ ] 관리자는 전체 게시글 조회 가능
[ ] 상태 변경 가능
[ ] 관리자 답변 등록 가능
```

## MSDS

```text
[ ] 관리자 PDF 업로드
[ ] CAS 검색
[ ] 물질명 검색
[ ] PDF 열람
[ ] 관리자 PDF 삭제
```

## Security

```text
[ ] service role key가 browser bundle에 포함되지 않음
[ ] RLS 활성화 확인
[ ] 타인 post update API 차단
[ ] 타인 post delete API 차단
```

---

# 32. Seed 데이터

개발용 게시글:

```text
1.
카테고리: HAZARD
제목: 실험실 후드 주변 적재물 관련 의견
위험도: MEDIUM
상태: REVIEWING

2.
카테고리: PPE
제목: 보호안경 추가 비치 요청
위험도: LOW
상태: RECEIVED

3.
카테고리: NEAR_MISS
제목: 이동 중 시약 운반 카트 흔들림
위험도: HIGH
상태: ACTION
```

MSDS:

```text
Acetone
CAS 67-64-1

Methanol
CAS 67-56-1

Acetonitrile
CAS 75-05-8

Dichloromethane
CAS 75-09-2
```

테스트 데이터만 생성하고 실제 SDS PDF를 임의 생성하지 않는다.

---

# 33. 개발 단계

Antigravity는 한 번에 모든 기능을 구현하지 말고 아래 순서로 진행한다.

---

## Phase 1 — 프로젝트 생성

목표:

```text
Next.js
TypeScript
Tailwind
shadcn/ui
```

설치.

확인:

```bash
npm run dev
npm run lint
npm run build
```

모두 통과해야 다음 단계로 진행.

---

## Phase 2 — Supabase 연결

구현:

```text
Supabase client
Server client
Anonymous Auth
환경변수
```

아직 게시판 구현하지 않는다.

Anonymous session이 정상 생성되는지 확인한다.

---

## Phase 3 — Database

생성:

```text
posts
sds_documents
user_roles
```

RLS 적용.

Migration SQL 파일로 관리한다.

Supabase Dashboard에서 수동 생성만 하지 말고
반드시 migration 파일을 저장한다.

---

## Phase 4 — 게시판

구현:

```text
목록
상세
작성
수정
삭제
검색
필터
```

---

## Phase 5 — 관리자

구현:

```text
관리자 로그인
상태 변경
관리자 답변
게시글 숨김
```

---

## Phase 6 — MSDS

구현:

```text
MSDS 목록
검색
관리자 등록
PDF upload
PDF viewer
```

---

## Phase 7 — 보안

검증:

```text
RLS
Role
Rate limit
Input validation
XSS
Secret exposure
```

---

## Phase 8 — 테스트

수행:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

없는 script는 프로젝트 상황에 맞게 만든다.

---

## Phase 9 — 배포

Vercel 배포.

Production 환경변수 설정.

Supabase URL / key 확인.

배포 이후 production smoke test 수행.

---

# 34. Antigravity Master Prompt

아래 내용을 Antigravity에게 입력한다.

```text
프로젝트 루트에 있는 SAFETY_BOARD_ANTIGRAVITY_PLAN.md를 먼저 전체적으로 읽어라.

이 프로젝트는 회사 구성원이 안전관리 의견을 익명으로 작성하는
Safety Voice Board 웹 애플리케이션이다.

중요 원칙:

1. Next.js + TypeScript 기반으로 구현한다.
2. Supabase를 Database/Auth/Storage로 사용한다.
3. 일반 사용자는 회원가입 없이 Supabase Anonymous Auth를 사용한다.
4. UI에는 사용자 UUID 또는 개인 식별 정보를 노출하지 않는다.
5. 게시글 작성자는 자신의 글만 수정/삭제할 수 있어야 한다.
6. 관리자는 상태 변경과 관리자 답변을 할 수 있어야 한다.
7. 모든 public database table은 RLS를 사용한다.
8. MSDS/SDS PDF는 관리자만 업로드/삭제할 수 있다.
9. service role key를 client에 노출하지 않는다.
10. 배포는 Vercel을 기본으로 한다.

작업을 시작하기 전에 현재 디렉터리와 기존 파일을 먼저 분석하라.

그 다음 IMPLEMENTATION_PLAN.md를 작성하라.

계획에는 다음을 포함하라.

- architecture
- directory structure
- database schema
- RLS policies
- page structure
- implementation phases
- test plan
- deployment plan

계획을 만든 뒤 코딩을 시작하되 반드시 Phase 단위로 작업하라.

각 Phase 완료 후:

- lint
- type check
- relevant tests
- build

를 수행하고 오류가 있으면 수정한 뒤 다음 단계로 진행하라.

중요:
보안이나 권한 관련 내용을 추측해서 구현하지 말고
Supabase의 현재 공식 권장방식을 확인한 후 적용하라.

불필요하게 복잡한 기능은 추가하지 말고
우선 배포 가능한 MVP 완성을 목표로 한다.
```

---

# 35. Antigravity Phase 1 Prompt

```text
SAFETY_BOARD_ANTIGRAVITY_PLAN.md를 기준으로 Phase 1만 진행하라.

목표:
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- 기본 Layout
- Header
- Footer
- Home mock UI

아직 Supabase와 Database는 연결하지 마라.

완료 후:
npm run lint
npm run build

를 실행하고 결과를 보고하라.

UI는 PC와 모바일 모두 정상적으로 보여야 한다.
```

---

# 36. Antigravity Phase 2 Prompt

```text
Phase 2를 진행하라.

Supabase를 프로젝트에 연결하고 Anonymous Auth만 구현한다.

요구사항:

- browser client
- server client
- environment variables
- anonymous sign-in
- session persistence
- error handling

DB 게시판 기능은 아직 구현하지 마라.

첫 방문 시 anonymous auth가 생성되고,
새로고침 후 동일 session이 유지되는지 검증하라.

secret 또는 service role key가 client bundle에 포함되지 않는지 확인하라.
```

---

# 37. Antigravity Phase 3 Prompt

```text
Phase 3를 진행하라.

Supabase migration을 이용해서 다음 table을 생성하라.

- posts
- sds_documents
- user_roles

SAFETY_BOARD_ANTIGRAVITY_PLAN.md의 schema를 기준으로 구현하되
필요한 constraint와 index를 추가하라.

모든 public table에 RLS를 활성화하라.

특히 posts는:

- authenticated anonymous user가 작성 가능
- author_id는 auth.uid()와 같아야 함
- 작성자는 자신의 글만 수정/삭제 가능
- 관리자만 status와 admin_response 변경 가능

하도록 한다.

RLS 정책을 테스트하고
타인 게시글 update/delete가 실제로 차단되는 것을 검증하라.
```

---

# 38. Antigravity Phase 4 Prompt

```text
Phase 4를 진행하라.

익명 안전 의견 게시판을 구현한다.

페이지:

/board
/board/new
/board/[id]

기능:

- 목록
- 상세
- 작성
- 수정
- 삭제
- 검색
- 카테고리 필터
- 상태 필터
- 위험도 표시
- pagination

사용자 식별정보는 UI에 표시하지 않는다.

긴급 위험도 선택 시
즉각적인 위험은 사내 비상연락 체계를 우선 이용해야 한다는
안내 문구를 명확히 표시한다.

완료 후 전체 기능을 직접 테스트하라.
```

---

# 39. Antigravity Phase 5 Prompt

```text
Phase 5를 진행하라.

관리자 기능을 구현한다.

URL:
/admin

관리자는 Supabase email/password 계정을 사용한다.

권한은 이메일 하드코딩이 아니라 user_roles를 이용한다.

관리자 기능:

- 전체 게시글 검색
- 상태 변경
- 관리자 답변
- 게시글 숨김
- 숨김 복구

일반 사용자가 관리자 API를 직접 호출해도 차단되도록
DB/RLS와 server authorization 두 단계에서 검증하라.
```

---

# 40. Antigravity Phase 6 Prompt

```text
Phase 6를 진행하라.

MSDS / SDS + PubChem 연동 기능을 구현한다.

반드시 프로젝트 루트의 AGENTS.md와
SAFETY_BOARD_ANTIGRAVITY_PLAN.md를 먼저 읽고 규칙을 적용하라.

사용자 페이지:
/msds

검색:
- cas_number 우선
- chemical_name
- manufacturer

기능 1 — 내부 SDS:
- CAS 검색
- 물질명 검색
- 제조사 검색
- PDF 열람
- 제조사/개정일 표시

기능 2 — PubChem:
CAS를 입력하면 서버 Route Handler를 통해 다음을 자동 조회한다.

1. CAS format/check digit validation
2. CAS → PubChem CID
3. Title / IUPAC Name
4. Molecular Formula
5. Molecular Weight
6. Canonical/Isomeric SMILES
7. InChI / InChIKey
8. 2D structure image
9. GHS Classification
10. Signal word
11. GHS pictograms
12. Hazard statements
13. Precautionary statements
14. Hazard class/category
15. annotation source

PUG REST와 PUG View의 현재 공식 문서를 확인한 후 구현하라.

PubChem JSON 요청을 Client Component에서 직접 수행하지 말고
/api/pubchem/lookup Route Handler를 사용하라.

권장 파일:
- app/api/pubchem/lookup/route.ts
- lib/pubchem/client.ts
- lib/pubchem/parser.ts
- lib/pubchem/cas.ts
- lib/pubchem/types.ts

복수 CID가 반환되면 첫 번째 CID를 자동 선택하지 말고
사용자가 후보를 확인할 수 있게 처리하라.

PubChem 결과가 없거나 GHS가 없다고 해서
"안전한 물질"이라고 표시하지 마라.

사내/제조사 SDS가 안전관리상 우선 문서임을
UI에 명확하게 표시하라.

PubChem 요청은 cache를 적용하고
5 requests/sec 제한을 넘지 않도록 구현하라.
가능하면 실제 outbound target을 4 requests/sec 이하로 둔다.

Supabase에 pubchem_cache table을 migration으로 추가하고
기본 TTL은 7일로 한다.

PubChem 429/503/network temporary failure에는
제한적 exponential backoff를 적용한다.
PubChem 장애가 발생해도 내부 SDS 검색은 정상 동작해야 한다.

관리자:
- PDF 업로드
- metadata 등록
- 수정
- 삭제
- CAS 확인 여부 관리
- 필요하면 PubChem CID 수동 연결

Supabase Storage bucket:
sds-documents

일반 사용자는 SDS를 읽기만 가능하고
관리자만 upload/delete 가능해야 한다.

PDF는 브라우저에서 안전하게 열 수 있게 구현한다.

외부 제조사 사이트를 자동 크롤링하지 않는다.
external_url 필드는 유지한다.

완료 후 아래 CAS로 smoke test를 수행한다.

- 67-64-1
- 67-56-1
- 75-05-8
- 75-09-2

검증:
- valid CAS
- invalid CAS
- PubChem not found
- multiple CID handling
- GHS missing
- PubChem 503 simulation
- cache hit
- internal SDS fallback

완료 후 lint, typecheck, test, build를 실행하라.
```

---

# 41. Antigravity Phase 7 Prompt

```text
Phase 7 보안 점검을 진행하라.

다음을 하나씩 공격 관점에서 검증하라.

1. 다른 사용자 게시글 수정
2. 다른 사용자 게시글 삭제
3. 일반 사용자의 status 변경
4. 일반 사용자의 admin_response 변경
5. 일반 사용자의 SDS upload
6. 일반 사용자의 SDS delete
7. service role key browser 노출
8. XSS 입력
9. 과도한 요청
10. 비정상적으로 긴 입력
11. PubChem API parameter injection
12. invalid CAS flood
13. PubChem 429/503 처리
14. cache poisoning 가능성
15. PubChem HTML/error response를 JSON으로 오인하지 않는지

발견한 문제는 수정하고
SECURITY_REVIEW.md를 생성해서
문제 / 수정 / 검증 결과를 기록하라.
```

---

# 42. Antigravity Phase 8 Prompt

```text
프로덕션 배포 전 최종 검증을 진행하라.

다음 명령이 모두 통과해야 한다.

npm run lint
npm run typecheck
npm run test
npm run build

실패하는 항목은 원인을 분석해서 수정한다.

추가로 다음 사용자 flow를 검증하라.

Anonymous User:
접속
→ 게시판
→ 글 작성
→ 상세보기
→ 수정
→ 삭제

Admin:
로그인
→ 게시글 조회
→ 상태 변경
→ 답변 등록

MSDS:
검색
→ 결과
→ PDF 열람

완료 후 DEPLOYMENT_CHECKLIST.md를 생성하라.
```

---

# 43. Antigravity Phase 9 Prompt

```text
Vercel production deployment를 준비하라.

확인:

- production environment variables
- Supabase redirect/config
- build
- database migration
- RLS
- storage policies

배포 후 production URL에서 smoke test를 실행하라.

검증 항목:

1. Home
2. Board
3. Anonymous post
4. Edit own post
5. Admin login
6. Admin response
7. MSDS search
8. PDF view
9. Mobile responsive UI

배포 완료 후:

- production URL
- 필요한 environment variables 목록
- Supabase 설정
- 남아 있는 제한사항

을 DEPLOYMENT_REPORT.md에 기록하라.
```

---

# 44. MVP 완료 기준

다음 조건을 모두 만족하면 MVP 완료로 판단한다.

```text
[ ] 사용자 회원가입 없음
[ ] Anonymous Auth 작동
[ ] 게시글 작성 가능
[ ] 게시글 목록 조회
[ ] 자신의 게시글 수정/삭제
[ ] 타인의 글 수정/삭제 차단
[ ] 관리자 로그인
[ ] 관리자 상태 변경
[ ] 관리자 답변
[ ] MSDS 검색
[ ] 관리자 MSDS 업로드
[ ] PDF 열람
[ ] Mobile UI
[ ] RLS 적용
[ ] Secrets 보호
[ ] Production build 성공
[ ] Vercel 배포 성공
```

---

# 45. 2차 개발 후보

MVP 안정화 이후 추가를 고려한다.

## Priority A

```text
게시글 사진 첨부
QR Code 접속
새 게시글 관리자 알림
긴급 의견 관리자 알림
처리상태 통계
```

## Priority B

```text
GHS pictogram
H/P Statement
PubChem 연동
SDS revision 알림
CAS 자동완성
```

## Priority C

```text
AI 기반 게시글 카테고리 분류
위험도 추천
유사 안전사고 검색
월간 안전 이슈 요약
관리자 Dashboard analytics
```

AI 기능은 MVP에는 넣지 않는다.

---

# 46. 권장 운영 방식

현장 또는 실험실에 QR 코드를 붙여서 접속성을 높인다.

예:

```text
안전 관련 의견이 있으신가요?

QR Code

익명으로 의견 남기기
```

게시글 상태가 업데이트되면 구성원이

```text
접수됨
검토중
조치중
완료
```

흐름을 볼 수 있도록 하여
단순 제보함이 아니라 실제 개선과 연결되는 시스템으로 운영한다.

---

# 47. MSDS 운영 권장 방식

관리자는 SDS를 등록할 때 최소 다음 정보를 입력한다.

```text
Chemical Name
CAS Number
Manufacturer
Product Number
Revision Date
Language
PDF
```

동일 CAS의 여러 제조사 문서가 존재할 수 있으므로
CAS Number를 unique key로 만들지 않는다.

예:

```text
Acetone
CAS 67-64-1
Sigma-Aldrich

Acetone
CAS 67-64-1
TCI

Acetone
CAS 67-64-1
Merck
```

모두 별도 문서로 관리 가능해야 한다.

---

# 48. 중요한 안전 운영 원칙

이 시스템은 사고 대응 시스템 자체를 대체하지 않는다.

게시판 상단 또는 작성 화면에 다음 메시지를 항상 표시한다.

```text
즉각적인 화재, 누출, 폭발, 인명 위험 또는
응급상황은 이 게시판이 아닌
사내 비상연락 체계를 우선 이용하십시오.
```

게시판은 주로:

```text
위험요소 발견
아차사고
안전 개선안
시설 개선
PPE
작업절차
MSDS 관련 의견
```

을 수집하기 위한 용도로 사용한다.

---

# 49. 프로젝트 최종 목표 구조

```text
                  ┌───────────────────┐
                  │     사용자        │
                  │   PC / Mobile     │
                  └─────────┬─────────┘
                            │
                            ▼
                  ┌───────────────────┐
                  │      Vercel       │
                  │ Next.js Frontend  │
                  └─────────┬─────────┘
                            │
                            ▼
                  ┌───────────────────┐
                  │     Supabase      │
                  │                   │
                  │ Auth              │
                  │ ├ Anonymous User  │
                  │ └ Admin           │
                  │                   │
                  │ PostgreSQL        │
                  │ ├ posts           │
                  │ ├ sds_documents   │
                  │ └ user_roles      │
                  │                   │
                  │ Storage           │
                  │ └ SDS PDF         │
                  └───────────────────┘
```

---

# 50. Antigravity에 처음 전달할 문장

가장 처음에는 아래처럼 요청한다.

```text
현재 프로젝트를 Safety Voice Board라는
익명 안전관리 의견 게시판으로 개발하려고 한다.

프로젝트 루트의
SAFETY_BOARD_ANTIGRAVITY_PLAN.md
문서를 전체적으로 읽고 요구사항을 분석해라.

바로 코딩부터 시작하지 말고
먼저 현재 프로젝트 상태를 확인한 다음
IMPLEMENTATION_PLAN.md를 작성해라.

그 후 문서의 Phase 1부터 순서대로 구현하라.

각 Phase가 끝날 때마다 lint, typecheck, test, build 중
해당 단계에서 가능한 검증을 수행하고
오류가 없는 상태에서 다음 단계로 진행하라.

특히 Anonymous Auth, RLS, 관리자 권한,
SDS Storage 권한과 secret key 노출 방지를
가장 중요하게 다뤄라.

최종 목표는 실제 Vercel에 배포할 수 있는 MVP이다.
```

---

# 51. 참고 문서

구현 시 Antigravity가 아래 공식 문서를 우선 확인하도록 한다.

- Supabase Row Level Security  
  https://supabase.com/docs/guides/database/postgres/row-level-security

- Supabase Anonymous Sign-ins  
  https://supabase.com/docs/guides/auth/auth-anonymous

- Supabase Auth  
  https://supabase.com/docs/guides/auth

- Next.js Documentation  
  https://nextjs.org/docs

- Vercel Documentation  
  https://vercel.com/docs

- PubChem PUG REST  
  https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest

- PubChem PUG REST Tutorial  
  https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest-tutorial

- PubChem PUG View  
  https://pubchem.ncbi.nlm.nih.gov/docs/pug-view

- PubChem Imaging Services  
  https://pubchem.ncbi.nlm.nih.gov/docs/imaging-services

- PubChem GHS Classification Summary  
  https://pubchem.ncbi.nlm.nih.gov/ghs/

- PubChem CAS 안내  
  https://pubchem.ncbi.nlm.nih.gov/docs/about

- Google Antigravity 관련 Google Codelab  
  https://codelabs.developers.google.com/build-deploy-embed-agy-agents-cli

---

# 52. 최종 권장 MVP 범위

처음부터 너무 많은 기능을 넣지 않는다.

**1차 배포에 반드시 포함**

```text
익명 로그인
게시판
관리자 답변
처리 상태
MSDS 검색
SDS PDF 등록
PubChem CAS → CID 조회
PubChem 2D 구조 표시
PubChem GHS pictogram / H·P statement 표시
PubChem cache / 장애 fallback
RLS
Vercel 배포
```

**1차 배포에서 제외**

```text
댓글
좋아요
실시간 채팅
사진 첨부
AI 분석
외부 제조사 SDS 자동 크롤링
PubChem 정보만으로 SDS 대체
Push Notification
복잡한 통계
```

이 범위가 가장 빠르고 안정적으로 배포 가능한 형태다.


---

# 53. AGENTS.md 적용 규칙

프로젝트 루트에는 반드시 별도 `AGENTS.md` 파일을 둔다.

Antigravity는 모든 작업을 시작하기 전에:

```text
1. AGENTS.md
2. SAFETY_BOARD_ANTIGRAVITY_PLAN.md
3. 현재 프로젝트 파일
```

순서로 확인한다.

규칙 충돌 시 우선순위:

```text
보안/안전 요구사항
    ↓
AGENTS.md
    ↓
SAFETY_BOARD_ANTIGRAVITY_PLAN.md
    ↓
IMPLEMENTATION_PLAN.md
    ↓
개별 작업 편의
```

특히 다음은 절대 위반하지 않는다.

```text
- UI에 익명 사용자 식별정보 노출 금지
- service role key client 노출 금지
- RLS 우회 금지
- PubChem 결과를 공식 SDS처럼 표현 금지
- PubChem 데이터 없음 = 안전 판정 금지
- 복수 CID를 임의로 첫 번째 구조로 확정 금지
- 외부 SDS 사이트 무단 크롤링 금지
- 테스트 실패 상태로 다음 Phase 진행 금지
```

---

# 54. 업데이트된 MSDS MVP 완료 기준

```text
[ ] CAS format validation
[ ] CAS check digit validation
[ ] Internal SDS search
[ ] PubChem CAS → CID
[ ] Multiple CID handling
[ ] PubChem molecular properties
[ ] PubChem 2D structure
[ ] PubChem GHS parser
[ ] Signal word
[ ] GHS pictograms
[ ] H statements
[ ] P statements
[ ] GHS source provenance
[ ] PubChem 7-day cache
[ ] PubChem rate limiting
[ ] 429/503 retry
[ ] PubChem failure에서도 내부 SDS 사용 가능
[ ] PubChem 참고정보 / 공식 SDS 구분
```
