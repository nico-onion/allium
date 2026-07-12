-- Esquema inicial del ERP Allium (Onion): clientes, eventos, menús, recetas,
-- insumos, proveedores, personal y movimientos financieros.

create extension if not exists pgcrypto;

-- Función reutilizable para mantener updated_at al día en cada UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- proveedores
-- ---------------------------------------------------------------------------
create table public.proveedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  contacto text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.proveedores
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- clientes
-- ---------------------------------------------------------------------------
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text,
  email text,
  instagram text,
  notas text,
  creado_en timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- personal
-- ---------------------------------------------------------------------------
create table public.personal (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  rol text not null check (rol in ('cocina', 'mozo', 'logistica')),
  telefono text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.personal
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- insumos
-- ---------------------------------------------------------------------------
create table public.insumos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  unidad text not null,
  costo_unitario numeric(12, 2) not null default 0 check (costo_unitario >= 0),
  stock_actual numeric(12, 2) not null default 0 check (stock_actual >= 0),
  -- si se borra el proveedor, el insumo queda sin proveedor asignado (no se pierde el insumo)
  proveedor_id uuid references public.proveedores (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index insumos_proveedor_id_idx on public.insumos (proveedor_id);

create trigger set_updated_at
  before update on public.insumos
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- recetas
-- ---------------------------------------------------------------------------
create table public.recetas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text,
  porcion_base numeric(12, 2) not null default 1 check (porcion_base > 0),
  costo_estimado numeric(12, 2) check (costo_estimado >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.recetas
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- receta_insumos (insumos que componen una receta)
-- ---------------------------------------------------------------------------
create table public.receta_insumos (
  id uuid primary key default gen_random_uuid(),
  -- si se borra la receta, se borra su lista de insumos (no tiene sentido sin la receta)
  receta_id uuid not null references public.recetas (id) on delete cascade,
  -- no se puede borrar un insumo mientras esté en uso en alguna receta
  insumo_id uuid not null references public.insumos (id) on delete restrict,
  cantidad numeric(12, 3) not null check (cantidad >= 0),
  unidad text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (receta_id, insumo_id)
);

create index receta_insumos_receta_id_idx on public.receta_insumos (receta_id);
create index receta_insumos_insumo_id_idx on public.receta_insumos (insumo_id);

create trigger set_updated_at
  before update on public.receta_insumos
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- eventos
-- ---------------------------------------------------------------------------
create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  -- no se puede borrar un cliente si tiene eventos asociados (protege el historial)
  cliente_id uuid not null references public.clientes (id) on delete restrict,
  nombre text not null,
  tipo text not null check (
    tipo in (
      'cena_pasos', 'asado', 'finger_food', 'combo', 'maridaje', 'pizzas', 'box'
    )
  ),
  fecha timestamptz not null,
  invitados integer not null check (invitados >= 0),
  estado text not null default 'cotizado' check (
    estado in ('cotizado', 'confirmado', 'en_curso', 'cerrado', 'cancelado')
  ),
  ubicacion text,
  precio_total numeric(12, 2) check (precio_total >= 0),
  margen_objetivo numeric(5, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index eventos_cliente_id_idx on public.eventos (cliente_id);
create index eventos_fecha_idx on public.eventos (fecha);

create trigger set_updated_at
  before update on public.eventos
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- menus
-- ---------------------------------------------------------------------------
create table public.menus (
  id uuid primary key default gen_random_uuid(),
  -- si se borra el evento, se borran sus menús (no tienen sentido sin el evento)
  evento_id uuid not null references public.eventos (id) on delete cascade,
  nombre text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index menus_evento_id_idx on public.menus (evento_id);

create trigger set_updated_at
  before update on public.menus
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- menu_items (recetas que componen un menú)
-- ---------------------------------------------------------------------------
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  -- si se borra el menú, se borran sus items
  menu_id uuid not null references public.menus (id) on delete cascade,
  -- no se puede borrar una receta mientras esté en uso en algún menú
  receta_id uuid not null references public.recetas (id) on delete restrict,
  cantidad_porciones integer not null check (cantidad_porciones > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index menu_items_menu_id_idx on public.menu_items (menu_id);
create index menu_items_receta_id_idx on public.menu_items (receta_id);

create trigger set_updated_at
  before update on public.menu_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- turnos (asignación de personal a un evento)
-- ---------------------------------------------------------------------------
create table public.turnos (
  id uuid primary key default gen_random_uuid(),
  -- si se borra el evento, se borran los turnos asignados a ese evento
  evento_id uuid not null references public.eventos (id) on delete cascade,
  -- no se puede borrar a una persona mientras tenga turnos asignados
  personal_id uuid not null references public.personal (id) on delete restrict,
  rol_en_evento text not null,
  confirmado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (evento_id, personal_id)
);

create index turnos_evento_id_idx on public.turnos (evento_id);
create index turnos_personal_id_idx on public.turnos (personal_id);

create trigger set_updated_at
  before update on public.turnos
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- movimientos_financieros
-- ---------------------------------------------------------------------------
create table public.movimientos_financieros (
  id uuid primary key default gen_random_uuid(),
  -- movimiento puede o no estar atado a un evento; si se borra el evento, se conserva
  -- el movimiento (importa para la contabilidad) pero queda sin evento asociado
  evento_id uuid references public.eventos (id) on delete set null,
  tipo text not null check (tipo in ('ingreso', 'egreso')),
  monto numeric(12, 2) not null check (monto >= 0),
  categoria text,
  fecha date not null default current_date,
  origen text not null default 'manual' check (origen in ('BILL', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index movimientos_financieros_evento_id_idx on public.movimientos_financieros (evento_id);
create index movimientos_financieros_fecha_idx on public.movimientos_financieros (fecha);

create trigger set_updated_at
  before update on public.movimientos_financieros
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: acceso completo para usuarios autenticados, nada para
-- anon. Es un ERP de uso interno de un solo usuario, se accede siempre
-- logueado; esto evita que la anon key (pública en el frontend) exponga
-- datos de clientes/finanzas si algo la filtra.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'clientes', 'eventos', 'menus', 'menu_items', 'recetas',
      'receta_insumos', 'insumos', 'proveedores', 'personal', 'turnos',
      'movimientos_financieros'
    ])
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "authenticated_full_access" on public.%I for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end;
$$;
