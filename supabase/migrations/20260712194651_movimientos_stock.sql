-- Historial de movimientos de stock por insumo: automáticos (uso_evento,
-- generados al reconciliar el cierre de un evento) y manuales (compra,
-- ajuste, merma).

create table public.movimientos_stock (
  id uuid primary key default gen_random_uuid(),
  -- no se puede borrar un insumo mientras tenga movimientos históricos
  insumo_id uuid not null references public.insumos (id) on delete restrict,
  tipo text not null check (tipo in ('compra', 'uso_evento', 'ajuste', 'merma')),
  -- positiva para entradas (compra), negativa para salidas (uso_evento,
  -- merma); ajuste puede ser cualquier signo.
  cantidad numeric(12, 3) not null check (
    (tipo = 'compra' and cantidad > 0)
    or (tipo in ('uso_evento', 'merma') and cantidad < 0)
    or (tipo = 'ajuste')
  ),
  unidad text not null check (unidad in ('kg', 'g', 'l', 'ml', 'unidad', 'docena')),
  -- solo se completa cuando el movimiento viene de un cierre de evento; si
  -- se borra el evento, se conserva el movimiento (importa para el
  -- historial de stock) pero queda sin evento asociado.
  evento_id uuid references public.eventos (id) on delete set null,
  nota text,
  created_at timestamptz not null default now()
);

create index movimientos_stock_insumo_id_idx on public.movimientos_stock (insumo_id);
create index movimientos_stock_evento_id_idx on public.movimientos_stock (evento_id);

alter table public.movimientos_stock enable row level security;
create policy "authenticated_full_access" on public.movimientos_stock
  for all to authenticated using (true) with check (true);
