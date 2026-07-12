-- Orden de compra interna: una foto congelada del packing list de un evento
-- al momento de confirmarlo (o de regenerarla a mano). No se recalcula sola
-- si el menú cambia después.

create table public.ordenes_compra (
  id uuid primary key default gen_random_uuid(),
  -- un evento tiene a lo sumo una orden "vigente"; regenerar la reemplaza,
  -- no crea una nueva fila.
  evento_id uuid not null unique references public.eventos (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.ordenes_compra
  for each row execute function public.set_updated_at();

create table public.orden_compra_items (
  id uuid primary key default gen_random_uuid(),
  -- son el detalle de una orden puntual: si se borra la orden, se borran con ella.
  orden_compra_id uuid not null references public.ordenes_compra (id) on delete cascade,
  -- no se puede borrar un insumo mientras quede referenciado en una orden histórica
  insumo_id uuid not null references public.insumos (id) on delete restrict,
  cantidad numeric(12, 3) not null check (cantidad >= 0),
  unidad text not null check (unidad in ('kg', 'g', 'l', 'ml', 'unidad', 'docena')),
  created_at timestamptz not null default now()
);

create index orden_compra_items_orden_compra_id_idx on public.orden_compra_items (orden_compra_id);
create index orden_compra_items_insumo_id_idx on public.orden_compra_items (insumo_id);

alter table public.ordenes_compra enable row level security;
create policy "authenticated_full_access" on public.ordenes_compra
  for all to authenticated using (true) with check (true);

alter table public.orden_compra_items enable row level security;
create policy "authenticated_full_access" on public.orden_compra_items
  for all to authenticated using (true) with check (true);
