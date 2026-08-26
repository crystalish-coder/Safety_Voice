-- ==============================================================================
-- Safety Voice Board - Initial Database Schema & RLS Policies Migration
-- ==============================================================================

-- 1. Helper function: 관리자 권한 확인 함수
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'ADMIN'
  );
$$;

-- ==============================================================================
-- 2. user_roles 테이블 (관리자 권한 관리)
-- ==============================================================================
create table if not exists public.user_roles (
  user_id uuid primary key,
  role text not null check (role in ('ADMIN', 'USER')),
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

create policy "Users can view their own role or admins can view all"
  on public.user_roles for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Only admins can insert/update/delete roles"
  on public.user_roles for all
  using (public.is_admin());

-- ==============================================================================
-- 3. posts 테이블 (익명 안전 제보 게시글)
-- ==============================================================================
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid(),

  category text not null check (
    category in (
      'HAZARD',
      'IMPROVEMENT',
      'NEAR_MISS',
      'CHEMICAL',
      'PPE',
      'FACILITY',
      'PROCEDURE',
      'OTHER'
    )
  ),
  title text not null check (char_length(title) between 2 and 100),
  content text not null check (char_length(content) between 5 and 5000),

  location text check (location is null or char_length(location) <= 100),
  risk_level text check (
    risk_level is null or risk_level in ('LOW', 'MEDIUM', 'HIGH', 'URGENT')
  ),

  status text not null default 'RECEIVED' check (
    status in ('RECEIVED', 'REVIEWING', 'ACTION', 'DONE')
  ),

  admin_response text,
  admin_response_at timestamptz,

  is_hidden boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 인덱스 생성
create index if not exists idx_posts_created_at on public.posts (created_at desc);
create index if not exists idx_posts_category on public.posts (category);
create index if not exists idx_posts_status on public.posts (status);
create index if not exists idx_posts_author_id on public.posts (author_id);

alter table public.posts enable row level security;

-- Posts RLS Policies:
-- 1) SELECT: 숨겨지지 않은 글은 누구나 열람 가능, 숨겨진 글은 관리자 또는 본인만 열람
create policy "Anyone can read visible posts"
  on public.posts for select
  using (is_hidden = false or public.is_admin() or auth.uid() = author_id);

-- 2) INSERT: 인증된 익명/일반 사용자가 자신의 author_id로만 글 작성 가능
create policy "Authenticated users can insert their own posts"
  on public.posts for insert
  with check (auth.uid() is not null and author_id = auth.uid());

-- 3) UPDATE:
-- 일반 작성자는 본인 글 내용만 수정 가능 (status, admin_response, is_hidden 변경 불가)
-- 관리자는 모든 필드 수정 가능
create policy "Authors can update own post or admins can update anything"
  on public.posts for update
  using (auth.uid() = author_id or public.is_admin())
  with check (
    public.is_admin() or (
      auth.uid() = author_id
      -- 일반 사용자는 상태, 관리자 답변, 숨김 여부를 임의로 변경하지 못하도록 보장
      and status = (select p.status from public.posts p where p.id = posts.id)
      and admin_response is not distinct from (select p.admin_response from public.posts p where p.id = posts.id)
      and is_hidden = (select p.is_hidden from public.posts p where p.id = posts.id)
    )
  );

-- 4) DELETE: 작성자 본인 또는 관리자만 삭제 가능
create policy "Authors or admins can delete posts"
  on public.posts for delete
  using (auth.uid() = author_id or public.is_admin());

-- ==============================================================================
-- 4. sds_documents 테이블 (사내 MSDS / SDS 문서 라이브러리)
-- ==============================================================================
create table if not exists public.sds_documents (
  id uuid primary key default gen_random_uuid(),

  chemical_name text not null,
  cas_number text,

  manufacturer text,
  product_number text,

  revision_date date,
  language text default 'ko',

  file_path text,
  external_url text,

  pubchem_cid bigint,
  verified_cas boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 인덱스 생성
create index if not exists idx_sds_cas_number on public.sds_documents (cas_number);
create index if not exists idx_sds_chemical_name on public.sds_documents (chemical_name);

alter table public.sds_documents enable row level security;

-- SDS RLS Policies:
-- 1) SELECT: 모든 사용자 읽기 허용
create policy "Anyone can read SDS documents"
  on public.sds_documents for select
  using (true);

-- 2) INSERT/UPDATE/DELETE: 관리자만 가능
create policy "Only admins can modify SDS documents"
  on public.sds_documents for all
  using (public.is_admin());

-- ==============================================================================
-- 5. pubchem_cache 테이블 (PubChem 화학정보 7일 캐시)
-- ==============================================================================
create table if not exists public.pubchem_cache (
  cas_number text primary key,
  cid bigint,
  payload jsonb not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists idx_pubchem_cache_expires on public.pubchem_cache (expires_at);

alter table public.pubchem_cache enable row level security;

create policy "Anyone can read pubchem cache"
  on public.pubchem_cache for select
  using (true);

create policy "Service or server can insert and update pubchem cache"
  on public.pubchem_cache for all
  using (true);

-- ==============================================================================
-- 6. Storage Bucket 정책 (sds-documents)
-- ==============================================================================
-- Storage 버킷 등록
insert into storage.buckets (id, name, public)
values ('sds-documents', 'sds-documents', true)
on conflict (id) do update set public = true;

-- Storage RLS 정책
create policy "Public Access to SDS PDF"
  on storage.objects for select
  using (bucket_id = 'sds-documents');

create policy "Admin Upload to SDS PDF"
  on storage.objects for insert
  with check (bucket_id = 'sds-documents' and public.is_admin());

create policy "Admin Delete SDS PDF"
  on storage.objects for delete
  using (bucket_id = 'sds-documents' and public.is_admin());
