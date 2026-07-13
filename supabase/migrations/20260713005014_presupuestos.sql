-- Módulo de Cotizaciones (presupuestos): la cotización existe como entidad
-- propia, previa al evento. El evento recién se crea si el cliente acepta
-- (ver eventos.link_cotizacion, que queda obsoleto para presupuestos nuevos
-- pero se conserva para no romper eventos históricos).

create table public.presupuestos (
  id uuid primary key default gen_random_uuid(),
  numero integer generated always as identity (start with 1),
  -- si se borra el cliente, se conserva el presupuesto pero queda sin cliente.
  cliente_id uuid references public.clientes (id) on delete set null,
  fecha_emision date not null default current_date,
  validez_dias integer not null default 7 check (validez_dias > 0),
  tipo_evento text not null,
  fecha_evento date,
  horario text,
  lugar_direccion text,
  cantidad_personas integer check (cantidad_personas > 0),
  incluye text,
  no_incluye text not null default
    '• Mozos: Gs. 280.000 por mozo.
• Bebidas. Solicitar presupuesto.
• Alquileres: Mobiliarios para eventos (mesas, sillas, servilletas, deco y otros). Solicitar presupuesto.',
  estado text not null default 'enviado' check (
    estado in ('enviado', 'aceptado', 'aceptado_con_cambios', 'en_evaluacion', 'rechazado')
  ),
  -- se completa cuando se genera el evento a partir de este presupuesto.
  -- si se borra el evento, el presupuesto queda sin evento asociado (no se pierde el historial de la cotización).
  evento_id uuid references public.eventos (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index presupuestos_numero_idx on public.presupuestos (numero);
create index presupuestos_cliente_id_idx on public.presupuestos (cliente_id);
create index presupuestos_evento_id_idx on public.presupuestos (evento_id);

create trigger set_updated_at
  before update on public.presupuestos
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- presupuesto_items (recetas cotizadas dentro de un presupuesto)
-- ---------------------------------------------------------------------------
create table public.presupuesto_items (
  id uuid primary key default gen_random_uuid(),
  -- si se borra el presupuesto, se borran sus items.
  presupuesto_id uuid not null references public.presupuestos (id) on delete cascade,
  -- no se puede borrar una receta mientras esté cotizada en algún presupuesto.
  receta_id uuid not null references public.recetas (id) on delete restrict,
  cantidad numeric(12, 2) not null check (cantidad > 0),
  -- precio a cobrar al cliente: independiente del costo interno de la receta.
  precio_unitario numeric(12, 2) not null default 0 check (precio_unitario >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index presupuesto_items_presupuesto_id_idx on public.presupuesto_items (presupuesto_id);
create index presupuesto_items_receta_id_idx on public.presupuesto_items (receta_id);

create trigger set_updated_at
  before update on public.presupuesto_items
  for each row execute function public.set_updated_at();

alter table public.presupuestos enable row level security;
create policy "authenticated_full_access" on public.presupuestos
  for all to authenticated using (true) with check (true);

alter table public.presupuesto_items enable row level security;
create policy "authenticated_full_access" on public.presupuesto_items
  for all to authenticated using (true) with check (true);
