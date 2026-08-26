# Safety Voice Board 🛡️

사내 구성원이 신원을 공개하지 않고 안전관리와 관련된 위험요소, 개선 제안, 아차사고, 시설/작업절차/MSDS 관련 의견을 익명으로 제시하고, 사내 공인 SDS 문서 및 PubChem 화학물질 안전정보를 통합 조회할 수 있는 웹 애플리케이션입니다.

---

## 🌟 핵심 기능

1. **완전한 익명 제보 시스템 (Anonymous Safety Board)**
   - Supabase Anonymous Auth 기반으로 회원가입 없이 익명 세션 발급
   - 화면 및 통신 상에 작성자 UUID, IP, 식별자 노출 원천 차단
   - 작성한 기기(브라우저)에서 본인이 등록한 제보의 수정/삭제 지원
   - 카테고리/위험도 필터링, 실시간 검색, 단계별 처리 현황 트래킹
2. **관리자 포털 (/admin)**
   - 이메일/비밀번호 인증 + `user_roles` 권한 검증
   - 제보 처리 상태 변경 (`접수됨` → `검토중` → `조치중` → `완료`)
   - 관리자 공식 공개 답변 등록 및 부적절 게시물 숨김(`is_hidden`) 처리
3. **MSDS / SDS 통합 라이브러리 & PubChem 연동 (/msds)**
   - **사내 등록 제조사 공인 SDS 문서 열람 (최우선)**
   - **PubChem 자동 연동 (/api/pubchem/lookup)**:
     - CAS 번호 형식 및 Check Digit 검증
     - 2D 화학 구조 이미지 및 분자 물성 (분자식, 분자량, IUPAC, InChIKey)
     - GHS 유해성·위험성 분류 (신호어, GHS01~09 그림문자, H문구, P문구)
     - 복수 CID 후보 선택 인터페이스
     - 7일 DB 캐싱 및 4 req/sec 요청 제한 준수
     - PubChem 장애 시 사내 SDS 정상 동작 격리

---

## 🛠️ 기술 스택

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons
- **Backend / Database**: Supabase (PostgreSQL, Anonymous Auth, RLS, Storage)
- **Validation**: Zod
- **Deployment**: Vercel

---

## 🚀 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.example` 파일을 복사하여 `.env.local`을 생성하고 Supabase 키를 입력합니다:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Database Migration 적용
Supabase SQL Editor에서 다음 파일들을 순서대로 실행합니다:
- `supabase/migrations/001_initial_schema.sql`
- `supabase/seed.sql` (개발용 샘플 데이터)

### 4. 로컬 개발 서버 실행
*(사용 중인 포트를 피해 안전한 포트로 실행)*
```bash
npm run dev -- -p 3000
```

### 5. 빌드 및 검사
```bash
npm run lint
npm run typecheck
npm run build
```

---

## 🔒 보안 및 안전 원칙

- **긴급 안내 고정 명시**: 즉각적인 화재, 누출, 폭발 등 응급상황 시 사내 비상연락망 유선 연락 안내
- **RLS (Row Level Security)**: DB 레벨에서 타인 글 수정 차단 및 관리자 권한 격리
- **공식 SDS 우선**: PubChem 정보는 참고용 보조 정보이며 사내 공인 SDS가 우선됨을 UI에 명시
