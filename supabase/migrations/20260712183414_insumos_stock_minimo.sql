-- Stock mínimo por insumo, para poder alertar cuando el stock actual cae
-- por debajo de lo esperado.

alter table public.insumos
  add column stock_minimo numeric(12, 2) not null default 0 check (stock_minimo >= 0);
