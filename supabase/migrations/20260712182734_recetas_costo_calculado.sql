-- costo_estimado pasa a calcularse siempre a partir de receta_insumos +
-- insumos.costo_unitario (con conversión de unidades), en vez de cargarse
-- a mano. Se elimina la columna para que no quede un valor manual obsoleto.

alter table public.recetas drop column costo_estimado;
