-- Marcación de asistencia para personal Nivel 2 (staff con login vinculado
-- vía personal.auth_user_id). foto_url guarda el PATH del objeto en el
-- bucket "marcaciones" (no una URL pública: el bucket es privado), la app
-- genera una signed URL al momento de mostrarla.

create table public.marcaciones (
  id uuid primary key default gen_random_uuid(),
  -- no se puede borrar a una persona mientras tenga marcaciones (protege el historial)
  personal_id uuid not null references public.personal (id) on delete restrict,
  tipo text not null check (tipo in ('entrada', 'salida')),
  marcado_en timestamptz not null default now(),
  latitud numeric(9, 6),
  longitud numeric(9, 6),
  foto_url text,
  created_at timestamptz not null default now()
);

create index marcaciones_personal_id_idx on public.marcaciones (personal_id);
create index marcaciones_marcado_en_idx on public.marcaciones (marcado_en);

alter table public.marcaciones enable row level security;

-- Nivel 1: acceso completo, igual que el resto de las tablas.
create policy "marcaciones_admin_full_access" on public.marcaciones
  for all to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- Nivel 2: solo puede ver/crear SUS PROPIAS marcaciones (vía el personal_id
-- cuyo auth_user_id sea el usuario logueado). Sin política de update/delete
-- para no-admins: no puede editar ni borrar marcaciones, ni propias ni ajenas.
create policy "marcaciones_propia_select" on public.marcaciones
  for select to authenticated
  using (
    exists (
      select 1 from public.personal
      where personal.id = marcaciones.personal_id
        and personal.auth_user_id = auth.uid()
    )
  );

create policy "marcaciones_propia_insert" on public.marcaciones
  for insert to authenticated
  with check (
    exists (
      select 1 from public.personal
      where personal.id = marcaciones.personal_id
        and personal.auth_user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Storage: bucket privado para las fotos de marcación, un objeto por
-- marcación bajo la carpeta {auth_user_id}/...
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('marcaciones', 'marcaciones', false)
on conflict (id) do nothing;

create policy "marcaciones_storage_propia_carpeta_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'marcaciones'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "marcaciones_storage_admin_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'marcaciones' and public.is_app_admin());
