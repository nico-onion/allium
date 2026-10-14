-- Fase 2 · Clientes y presupuestos con costo y margen
--
-- * Clientes: tipo (persona / empresa) y origen del contacto.
-- * Parámetros por tipo de evento: margen objetivo (arranca en 50 % para
--   todos) e imprevistos, que se precargan en cada presupuesto.
-- * Presupuestos: margen objetivo e imprevistos propios, y el momento en que
--   el costo quedó congelado (al aceptarse).
-- * Líneas de presupuesto: además de recetas, líneas sin receta (personal,
--   alquiler, logística, bebida...) con su costo; y el costo unitario de cada
--   línea guardado al momento de cotizar.
-- * Eventos: costo cotizado, para comparar después con el costo real.

-- ---------------------------------------------------------------------------
-- clientes
-- ---------------------------------------------------------------------------
alter table public.clientes
  add column tipo text not null default 'persona' check (tipo in ('persona', 'empresa')),
  add column origen text check (
    origen in ('instagram', 'meta_ads', 'whatsapp', 'referido', 'google', 'evento', 'otro')
  );

-- ---------------------------------------------------------------------------
-- parametros_tipo_evento
-- ---------------------------------------------------------------------------
create table public.parametros_tipo_evento (
  tipo text primary key,
  -- margen bruto objetivo sobre el precio sin IVA
  margen_objetivo_pct numeric(5, 2) not null default 50
    check (margen_objetivo_pct >= 0 and margen_objetivo_pct < 100),
  -- colchón de imprevistos sobre el costo de las líneas
  pct_imprevistos numeric(5, 2) not null default 0
    check (pct_imprevistos >= 0 and pct_imprevistos <= 100),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.parametros_tipo_evento
  for each row execute function public.set_updated_at();

-- Todos los tipos conocidos arrancan en 50 %.
insert into public.parametros_tipo_evento (tipo)
select distinct tipo from (
  select unnest(array['cena_pasos', 'asado', 'finger_food', 'combo', 'maridaje', 'pizzas', 'box']) as tipo
  union select tipo from public.eventos
  union select tipo_evento from public.presupuestos
) as tipos
where tipo is not null and trim(tipo) <> ''
on conflict (tipo) do nothing;

-- ---------------------------------------------------------------------------
-- presupuestos
-- ---------------------------------------------------------------------------
alter table public.presupuestos
  add column margen_objetivo_pct numeric(5, 2)
    check (margen_objetivo_pct >= 0 and margen_objetivo_pct < 100),
  add column pct_imprevistos numeric(5, 2) not null default 0
    check (pct_imprevistos >= 0 and pct_imprevistos <= 100),
  -- se completa al pasar a aceptado: desde ahí el costo cotizado no cambia.
  add column costo_congelado_en timestamptz;

-- ---------------------------------------------------------------------------
-- presupuesto_items
-- ---------------------------------------------------------------------------
alter table public.presupuesto_items
  alter column receta_id drop not null,
  add column descripcion text,
  add column categoria text not null default 'comida' check (
    categoria in ('comida', 'bebida', 'personal', 'alquiler', 'logistica', 'decoracion', 'otro')
  ),
  -- costo por unidad al momento de cotizar (receta: costo por porción;
  -- resto: cargado a mano o tomado de la referencia de Staff).
  add column costo_unitario numeric(12, 2) check (costo_unitario >= 0),
  -- si la línea es de personal, quién (opcional).
  add column personal_id uuid references public.personal (id) on delete set null,
  add constraint presupuesto_items_receta_o_descripcion_check
    check (receta_id is not null or nullif(trim(descripcion), '') is not null);

create index presupuesto_items_personal_id_idx on public.presupuesto_items (personal_id);

-- ---------------------------------------------------------------------------
-- eventos
-- ---------------------------------------------------------------------------
-- costo total cotizado (líneas + imprevistos) del presupuesto que lo originó.
alter table public.eventos
  add column costo_cotizado numeric(12, 2) check (costo_cotizado >= 0);

-- ---------------------------------------------------------------------------
-- Row Level Security: solo admins, como el resto del ERP.
-- ---------------------------------------------------------------------------
alter table public.parametros_tipo_evento enable row level security;
create policy "app_admins_full_access" on public.parametros_tipo_evento
  for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());
