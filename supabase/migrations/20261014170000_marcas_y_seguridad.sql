-- Fase 1.1 · Marcas por insumo y ajustes de seguridad
--
-- El insumo es genérico ("Mayonesa") y guarda qué marca se usa (Natura) y
-- cuál comprar si esa no está (Hellmann's). Se muestran en recetas, packing
-- list y orden de compra para que quien compra sepa qué llevar.
alter table public.insumos
  add column marca_preferida text,
  add column marca_alternativa text;

-- Alertas del asesor de seguridad de Supabase:
-- 1) Funciones con search_path fijo, para que no puedan resolver nombres de
--    otro esquema.
alter function public.set_updated_at() set search_path = public;
alter function public.recalcular_merma_insumo() set search_path = public;
alter function public.evitar_ciclo_subrecetas() set search_path = public;
alter function public.cerrar_mes_costos(date) set search_path = public;

-- 2) is_app_admin() solo la necesitan los usuarios logueados (la usan las
--    políticas de acceso). Un visitante sin sesión no tiene por qué llamarla.
revoke execute on function public.is_app_admin() from public, anon;
grant execute on function public.is_app_admin() to authenticated, service_role;
