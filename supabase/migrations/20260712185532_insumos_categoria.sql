-- Categoría libre para agrupar insumos en el dashboard (ej: Carnes,
-- Verduras, Lácteos, Bebidas, Secos). Texto libre, igual que recetas.categoria.

alter table public.insumos add column categoria text;
