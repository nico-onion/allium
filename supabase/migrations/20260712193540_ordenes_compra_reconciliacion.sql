-- Soporte para reconciliar la orden de compra al cerrar un evento: cuánto
-- se usó realmente de cada insumo (vs. lo pedido) y si esa orden ya se
-- reconcilió contra el stock.

alter table public.orden_compra_items
  add column cantidad_usada numeric(12, 3) check (cantidad_usada >= 0);

alter table public.ordenes_compra
  add column reconciliado boolean not null default false,
  add column reconciliado_en timestamptz;
