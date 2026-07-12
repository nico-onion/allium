-- Agrega precio por persona (para calcular precio_total en el frontend, que
-- se mantiene editable para poder sobreescribirlo) y el link a la cotización.

alter table public.eventos
  add column precio_por_persona numeric(12, 2) check (precio_por_persona >= 0),
  add column link_cotizacion text;
