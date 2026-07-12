-- Aplica el mismo criterio de unidad fija que insumos.unidad a
-- receta_insumos.unidad, para que la suma del packing list no se rompa por
-- inconsistencias de texto libre.

update public.receta_insumos set unidad = lower(trim(unidad));

alter table public.receta_insumos
  add constraint receta_insumos_unidad_check
  check (unidad in ('kg', 'g', 'l', 'ml', 'unidad', 'docena'));
