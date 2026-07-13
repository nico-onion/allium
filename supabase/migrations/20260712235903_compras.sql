-- Módulo de compras: agrupa varios movimientos_stock de tipo "compra" bajo
-- una misma cabecera (como una factura real), en vez de cargarlos sueltos
-- desde la ficha de cada insumo.

create table public.compras (
  id uuid primary key default gen_random_uuid(),
  -- si se borra el proveedor, se conserva la compra pero queda sin proveedor.
  proveedor_id uuid references public.proveedores (id) on delete set null,
  fecha date not null default current_date,
  numero_factura text,
  created_at timestamptz not null default now()
);

alter table public.movimientos_stock
  -- no se puede borrar una compra mientras tenga movimientos vinculados.
  add column compra_id uuid references public.compras (id) on delete restrict,
  add constraint movimientos_stock_compra_id_solo_compra_check
    check (tipo = 'compra' or compra_id is null);

create index compras_proveedor_id_idx on public.compras (proveedor_id);
create index movimientos_stock_compra_id_idx on public.movimientos_stock (compra_id);

alter table public.compras enable row level security;
create policy "authenticated_full_access" on public.compras
  for all to authenticated using (true) with check (true);
