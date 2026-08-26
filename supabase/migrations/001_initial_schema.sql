-- ==============================================================================
-- Safety Voice Board - Perfect Order DDL (Table First, Then Function & Policies)
-- ==============================================================================

-- 1. user_roles 테이블 먼저 생성 (함수 생성 전에 반드시 존재해야 함)
create table if not exists public.user_roles (
  user_id uuid primary key,
  role text not null check (role in ('ADMIN', 'USER')),
  created_at timestamptz not null default now()
);

-- 2. is_admin 헬퍼 함수 생성 (plpgsql로 안전하게 정의)
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
stable
as $$
begin
  return exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'ADMIN'
  );
end;
$$;

-- 3. user_roles RLS 설정
alter table public.user_roles enable row level security;

drop policy if exists "Users can view their own role or admins can view all" on public.user_roles;
create policy "Users can view their own role or admins can view all"
  on public.user_roles for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Only admins can insert/update/delete roles" on public.user_roles;
create policy "Only admins can insert/update/delete roles"
  on public.user_roles for all
  using (public.is_admin());

-- 4. posts 테이블 생성 (익명 제보 게시판)
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

create index if not exists idx_posts_created_at on public.posts (created_at desc);
create index if not exists idx_posts_category on public.posts (category);
create index if not exists idx_posts_status on public.posts (status);
create index if not exists idx_posts_author_id on public.posts (author_id);

alter table public.posts enable row level security;

drop policy if exists "Anyone can read visible posts" on public.posts;
create policy "Anyone can read visible posts"
  on public.posts for select
  using (is_hidden = false or public.is_admin() or auth.uid() = author_id);

drop policy if exists "Authenticated users can insert their own posts" on public.posts;
create policy "Authenticated users can insert their own posts"
  on public.posts for insert
  with check (auth.uid() is not null and author_id = auth.uid());

drop policy if exists "Authors can update own post or admins can update anything" on public.posts;
create policy "Authors can update own post or admins can update anything"
  on public.posts for update
  using (auth.uid() = author_id or public.is_admin())
  with check (
    public.is_admin() or (
      auth.uid() = author_id
      and status = (select p.status from public.posts p where p.id = posts.id)
      and admin_response is not distinct from (select p.admin_response from public.posts p where p.id = posts.id)
      and is_hidden = (select p.is_hidden from public.posts p where p.id = posts.id)
    )
  );

drop policy if exists "Authors or admins can delete posts" on public.posts;
create policy "Authors or admins can delete posts"
  on public.posts for delete
  using (auth.uid() = author_id or public.is_admin());

-- 5. sds_documents 테이블 생성 (사내 MSDS / SDS)
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

create index if not exists idx_sds_cas_number on public.sds_documents (cas_number);
create index if not exists idx_sds_chemical_name on public.sds_documents (chemical_name);

alter table public.sds_documents enable row level security;

drop policy if exists "Anyone can read SDS documents" on public.sds_documents;
create policy "Anyone can read SDS documents"
  on public.sds_documents for select
  using (true);

drop policy if exists "Only admins can modify SDS documents" on public.sds_documents;
create policy "Only admins can modify SDS documents"
  on public.sds_documents for all
  using (public.is_admin());

-- 6. pubchem_cache 테이블 생성 (PubChem 캐시)
create table if not exists public.pubchem_cache (
  cas_number text primary key,
  cid bigint,
  payload jsonb not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists idx_pubchem_cache_expires on public.pubchem_cache (expires_at);

alter table public.pubchem_cache enable row level security;

drop policy if exists "Anyone can read pubchem cache" on public.pubchem_cache;
create policy "Anyone can read pubchem cache"
  on public.pubchem_cache for select
  using (true);

drop policy if exists "Service or server can insert and update pubchem cache" on public.pubchem_cache;
create policy "Service or server can insert and update pubchem cache"
  on public.pubchem_cache for all
  using (true);

-- 7. Storage 버킷 설정
do $$
begin
  insert into storage.buckets (id, name, public)
  values ('sds-documents', 'sds-documents', true)
  on conflict (id) do update set public = true;
exception when others then null;
end $$;

do $$
begin
  drop policy if exists "Public Access to SDS PDF" on storage.objects;
  create policy "Public Access to SDS PDF"
    on storage.objects for select
    using (bucket_id = 'sds-documents');
exception when others then null;
end $$;
