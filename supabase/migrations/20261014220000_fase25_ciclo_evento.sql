-- Fase 2.5 · Ciclo del evento
--
-- Del presupuesto al cierre: cobros (seña y saldo con comprobante), factura
-- de venta, compras y gastos asociados al evento (ejecutado vs
-- presupuestado), reseña y cierre. Las compras pueden entrar en borrador
-- (desde BILL por WhatsApp): las líneas de la factura que el sistema no
-- reconoce se resuelven una vez a mano y quedan recordadas por proveedor.

-- ---------------------------------------------------------------------------
-- eventos: código, reseña y cierre
-- ---------------------------------------------------------------------------
-- código corto para mencionar el evento en el caption de WhatsApp
-- (formato que ya usa BILL: EV-OCT26-001).
alter table public.eventos
  add column codigo text unique,
  add column resena_enviada_en timestamptz,
  add column cerrado_en timestamptz;

create or replace function public.asignar_codigo_evento()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_prefijo text;
  v_siguiente integer;
begin
  if new.codigo is not null then
    return new;
  end if;

  v_prefijo := 'EV-' ||
    (array['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'])
      [extract(month from new.fecha at time zone 'America/Asuncion')::int] ||
    to_char(new.fecha at time zone 'America/Asuncion', 'YY') || '-';

  select coalesce(max(substring(codigo from length(v_prefijo) + 1)::int), 0) + 1
    into v_siguiente
    from public.eventos
   where codigo like v_prefijo || '%'
     and substring(codigo from length(v_prefijo) + 1) ~ '^[0-9]+$';

  new.codigo := v_prefijo || lpad(v_siguiente::text, 3, '0');
  return new;
end;
$$;

create trigger asignar_codigo_evento
  before insert on public.eventos
  for each row execute function public.asignar_codigo_evento();

-- Eventos existentes: código por orden de fecha dentro de cada mes.
with numerados as (
  select id,
         'EV-' ||
         (array['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'])
           [extract(month from fecha at time zone 'America/Asuncion')::int] ||
         to_char(fecha at time zone 'America/Asuncion', 'YY') || '-' ||
         lpad(row_number() over (
           partition by date_trunc('month', fecha at time zone 'America/Asuncion')
           order by fecha, created_at
         )::text, 3, '0') as codigo
  from public.eventos
  where codigo is null
)
update public.eventos e set codigo = n.codigo from numerados n where e.id = n.id;

-- ---------------------------------------------------------------------------
-- compras: borrador, evento, total y datos de la factura
-- ---------------------------------------------------------------------------
alter table public.compras
  add column estado text not null default 'confirmada'
    check (estado in ('borrador', 'confirmada')),
  add column origen text not null default 'manual' check (origen in ('manual', 'bill')),
  -- si se borra el evento, la compra se conserva sin el vínculo
  add column evento_id uuid references public.eventos (id) on delete set null,
  add column total numeric(14, 2) check (total >= 0),
  -- tal como figura en la factura, aunque no coincida con un proveedor cargado
  add column proveedor_texto text,
  add column ruc_proveedor text,
  add column comprobante_url text,
  add column confirmada_en timestamptz;

create index compras_evento_id_idx on public.compras (evento_id);
create index compras_estado_idx on public.compras (estado);

-- ---------------------------------------------------------------------------
-- compra_lineas: cada renglón de la factura y a dónde va
-- ---------------------------------------------------------------------------
-- destino: 'insumo' → entra al stock y actualiza el costo del insumo;
--          'gasto'  → costo del evento que no va a una receta (carbón, bolsas).
-- Una línea sin destino está pendiente de revisión.
create table public.compra_lineas (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references public.compras (id) on delete cascade,
  orden integer not null default 0,
  descripcion text not null,
  cantidad numeric(12, 3) not null check (cantidad > 0),
  unidad text not null default 'unidad'
    check (unidad in ('kg', 'g', 'l', 'ml', 'unidad', 'docena')),
  -- precio por unidad tal como se pagó (IVA incluido)
  precio_unitario numeric(14, 2) not null check (precio_unitario >= 0),
  subtotal numeric(14, 2) not null check (subtotal >= 0),
  destino text check (destino in ('insumo', 'gasto')),
  insumo_id uuid references public.insumos (id) on delete restrict,
  -- cuántas unidades del insumo trae una unidad de la línea, cuando no son
  -- de la misma dimensión (1 frasco = 0,25 kg). null = conversión directa.
  factor numeric(12, 4) check (factor > 0),
  categoria_gasto text,
  created_at timestamptz not null default now(),
  constraint compra_lineas_destino_coherente_check check (
    destino is null
    or (destino = 'insumo' and insumo_id is not null)
    or (destino = 'gasto' and insumo_id is null)
  )
);

create index compra_lineas_compra_id_idx on public.compra_lineas (compra_id);
create index compra_lineas_insumo_id_idx on public.compra_lineas (insumo_id);

-- ---------------------------------------------------------------------------
-- alias_compras: cómo se llama cada cosa en la factura de cada proveedor
-- ---------------------------------------------------------------------------
-- clave_proveedor: el RUC si la factura lo trae, si no el nombre en minúsculas.
-- descripcion_normalizada: la descripción en minúsculas, sin tildes ni
-- espacios repetidos.
create table public.alias_compras (
  id uuid primary key default gen_random_uuid(),
  clave_proveedor text not null,
  descripcion_normalizada text not null,
  destino text not null check (destino in ('insumo', 'gasto')),
  insumo_id uuid references public.insumos (id) on delete cascade,
  categoria_gasto text,
  -- igual que compra_lineas.factor; null = conversión directa de unidades.
  factor numeric(12, 4) check (factor > 0),
  created_at timestamptz not null default now(),
  unique (clave_proveedor, descripcion_normalizada),
  constraint alias_compras_destino_coherente_check check (
    (destino = 'insumo' and insumo_id is not null)
    or (destino = 'gasto' and insumo_id is null)
  )
);

-- ---------------------------------------------------------------------------
-- gastos_evento: costos del evento que no son insumos de receta
-- ---------------------------------------------------------------------------
create table public.gastos_evento (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id) on delete cascade,
  fecha date not null default current_date,
  categoria text not null check (
    categoria in ('mercaderia', 'descartables', 'combustible', 'mano_obra', 'transporte', 'alquiler', 'imprevisto', 'otro')
  ),
  descripcion text not null,
  monto numeric(14, 2) not null check (monto >= 0),
  -- si viene de una línea de factura, se borra con ella
  compra_linea_id uuid unique references public.compra_lineas (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index gastos_evento_evento_id_idx on public.gastos_evento (evento_id);

-- ---------------------------------------------------------------------------
-- cobros: seña, saldo y otros pagos del cliente
-- ---------------------------------------------------------------------------
create table public.cobros (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id) on delete restrict,
  tipo text not null check (tipo in ('sena', 'saldo', 'otro')),
  monto numeric(14, 2) not null check (monto > 0),
  fecha date not null default current_date,
  medio text not null default 'transferencia'
    check (medio in ('transferencia', 'efectivo', 'tarjeta', 'qr', 'otro')),
  comprobante text,
  nota text,
  created_at timestamptz not null default now()
);

create index cobros_evento_id_idx on public.cobros (evento_id);

-- ---------------------------------------------------------------------------
-- facturas_venta: factura contable emitida al cliente
-- ---------------------------------------------------------------------------
create table public.facturas_venta (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id) on delete restrict,
  numero text not null unique,
  fecha date not null default current_date,
  monto numeric(14, 2) not null check (monto > 0),
  created_at timestamptz not null default now()
);

create index facturas_venta_evento_id_idx on public.facturas_venta (evento_id);

-- ---------------------------------------------------------------------------
-- Row Level Security: solo admins, como el resto del ERP.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  for t in
    select unnest(array['compra_lineas', 'alias_compras', 'gastos_evento', 'cobros', 'facturas_venta'])
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "app_admins_full_access" on public.%I for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin())',
      t
    );
  end loop;
end;
$$;
