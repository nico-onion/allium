-- Restringe insumos.unidad a un set fijo de opciones para evitar
-- inconsistencias (kg vs Kg vs kilos) que romperían la suma del packing list.

update public.insumos set unidad = lower(trim(unidad));

alter table public.insumos
  add constraint insumos_unidad_check
  check (unidad in ('kg', 'g', 'l', 'ml', 'unidad', 'docena'));
