-- Niveles de acceso del ERP:
--   Nivel 1 "Control total" (app_admins): acceso completo a todo, como
--   hasta ahora.
--   Nivel 2 "Staffing": usuario logueado que NO está en app_admins — por
--   ahora no tiene ningún permiso sobre estas tablas. La sección de
--   marcación para Nivel 2 se construye en un paso aparte, sobre tablas
--   nuevas con sus propias políticas.
--
-- Reemplaza el modelo anterior ("cualquier usuario autenticado tiene
-- acceso completo") por "solo los usuarios en app_admins tienen acceso
-- completo" en todas las tablas existentes.

create table public.app_admins (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;

-- Chequeo reutilizable desde las políticas de todas las demás tablas.
-- security definer + search_path fijo: corre con los privilegios de quien
-- definió la función, así puede leer app_admins sin depender de (ni quedar
-- atrapada en) la propia política RLS de esa tabla.
create or replace function public.is_app_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.app_admins where auth_user_id = auth.uid()
  );
$$;

-- app_admins no se gestiona desde la API: sin políticas de insert/update/
-- delete, así que ni siquiera un admin puede modificarla vía PostgREST —
-- se hace a mano desde el SQL Editor (bypassea RLS al correr como
-- superusuario). Un admin sí puede verse a sí mismo en la lista.
create policy "app_admins_select_self" on public.app_admins
  for select to authenticated using (public.is_app_admin());

-- Reemplaza "authenticated_full_access" por acceso solo para admins en
-- todas las tablas existentes del ERP.
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'clientes', 'eventos', 'menus', 'menu_items', 'recetas',
      'receta_insumos', 'insumos', 'proveedores', 'personal', 'turnos',
      'movimientos_financieros', 'ordenes_compra', 'orden_compra_items',
      'movimientos_stock', 'compras', 'presupuestos', 'presupuesto_items'
    ])
  loop
    execute format(
      'drop policy if exists "authenticated_full_access" on public.%I', t
    );
    execute format(
      'create policy "app_admins_full_access" on public.%I for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin())',
      t
    );
  end loop;
end;
$$;

-- Vincula un registro de personal con su cuenta de login (Nivel 2), cuando
-- la tenga. Un login corresponde a lo sumo una persona del staff.
alter table public.personal
  add column auth_user_id uuid unique references auth.users (id) on delete set null;
