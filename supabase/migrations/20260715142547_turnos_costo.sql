-- Cuánto se le paga a esa persona por ese turno/evento — alimenta el costo
-- real de personal en el margen del dashboard, igual que ya pasa con el
-- costo de insumos usados.
alter table public.turnos
  add column costo numeric(12, 2) check (costo >= 0);
