-- Tipo de almacenamiento del insumo (seco / refrigerado), opcional para no
-- romper insumos ya cargados sin este dato.
alter table public.insumos
  add column tipo_almacenamiento text check (tipo_almacenamiento in ('seco', 'refrigerado'));
