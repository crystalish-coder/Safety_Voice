# Safety Voice Board - 배포 체크리스트 (Deployment Checklist)

본 체크리스트는 Vercel 및 Supabase 프로덕션 환경에 배포하기 전에 확인할 항목들을 정리한 문서입니다.

---

## 1. 배포 전 점검 목록

- [x] **TypeScript 정합성 검사 (`npm run typecheck`)**: 통과 (오류 0건)
- [x] **코드 린트 검사 (`npm run lint`)**: 통과 (경고 및 오류 0건)
- [x] **Next.js 프로덕션 빌드 (`npm run build`)**: 성공
- [x] **익명성 및 보안 정책**:
  - [x] UI 상 `author_id` / UUID 노출 없음
  - [x] `SUPABASE_SERVICE_ROLE_KEY` 클라이언트 번들 격리
  - [x] RLS 마이그레이션 DDL 준비 완료
- [x] **긴급 안전 문구**: 상단/하단/작성 폼에 비상연락 안내 명시 완료
- [x] **MSDS / PubChem 원칙**: 사내 공식 SDS 최우선 배치 및 PubChem 참고정보 명시

---

## 2. Supabase 설정 가이드

1. **Database Migration 적용**:
   - Supabase 대시보드의 **SQL Editor**로 이동합니다.
   - `supabase/migrations/001_initial_schema.sql` 내용을 복사하여 실행합니다.
   - (개발/테스트용) `supabase/seed.sql`을 실행하여 샘플 데이터를 채웁니다.
2. **Anonymous Auth 활성화**:
   - Supabase 대시보드 > **Authentication** > **Providers** > **Anonymous Sign-ins**를 `Enable`로 설정합니다.
3. **Storage 버킷 확인**:
   - **Storage** 메뉴에서 `sds-documents` 버킷이 생성되었는지 확인합니다 (Public 읽기 허용).
4. **관리자 계정 생성**:
   - **Authentication** > **Users**에서 관리자 이메일 계정을 생성합니다.
   - **SQL Editor**에서 해당 사용자에게 관리자 권한을 부여합니다:
     ```sql
     insert into public.user_roles (user_id, role)
     values ('<생성된-USER-UUID>', 'ADMIN');
     ```

---

## 3. Vercel 배포 환경 변수 설정

Vercel 프로젝트 Settings > **Environment Variables**에 다음 값을 등록합니다:

| 환경변수명 | 필수 여부 | 설명 |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | 필수 | Supabase Project URL (`https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 필수 | Supabase Public Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | 필수 | Supabase Service Role Key (서버 전용) |

---

## 4. 로컬 테스트 및 포트 주의사항

> [!NOTE]
> 포트 `8000, 8100, 8200, 8300, 8080, 8082, 8400, 8500, 8650, 8700, 8800, 8091`은 사내 시스템에서 사용 중이므로, 로컬 실행 시 충돌하지 않는 포트(예: `npm run dev -- -p 3000` 또는 `3050`)를 사용합니다.
