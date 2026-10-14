-- Fase 1 · Costos en vivo
--
-- Cada insumo pasa a tener dos costos:
--   costo_unitario  = costo VIVO, promedio ponderado que se recalcula con
--                     cada compra (lo usan recetas, presupuestos y el panel).
--   costo_contable  = costo congelado en el último cierre mensual (lo usan
--                     los reportes del mes).
-- Además: merma por insumo medida con pruebas de rendimiento, sub-recetas
-- dentro de recetas, % de varios y precio de venta por receta, e historial
-- de cada cambio de costo.

-- ---------------------------------------------------------------------------
-- insumos: merma y costo contable
-- ---------------------------------------------------------------------------
-- merma_pct null = todavía no medida ("pendiente"); 0 = medida y sin merma
-- (productos secos o envasados). Se recalcula sola a partir de rendimientos.
alter table public.insumos
  add column merma_pct numeric(5, 2) check (merma_pct >= 0 and merma_pct < 100),
  add column costo_contable numeric(12, 2) not null default 0 check (costo_contable >= 0);

-- Arranque: el costo contable empieza igual al costo vivo actual.
update public.insumos set costo_contable = costo_unitario;

-- ---------------------------------------------------------------------------
-- rendimientos: pruebas de merma por insumo (Calculadora de mermas)
-- ---------------------------------------------------------------------------
-- Los tres pesos van en la misma unidad (la que se haya usado en la balanza);
-- solo importan las proporciones.
create table public.rendimientos (
  id uuid primary key default gen_random_uuid(),
  -- si se borra el insumo, sus pruebas no tienen sentido
  insumo_id uuid not null references public.insumos (id) on delete cascade,
  fecha date not null default current_date,
  peso_inicial numeric(12, 3) not null check (peso_inicial > 0),
  peso_perdida numeric(12, 3) not null check (peso_perdida >= 0),
  peso_aprovechado numeric(12, 3) not null default 0 check (peso_aprovechado >= 0),
  nota text,
  created_at timestamptz not null default now(),
  constraint rendimientos_pesos_coherentes_check
    check (peso_perdida <= peso_inicial and peso_aprovechado <= peso_perdida)
);

create index rendimientos_insumo_id_idx on public.rendimientos (insumo_id);

-- merma_pct del insumo = promedio de (pérdida − aprovechado) ÷ inicial de
-- todas sus pruebas. Si se borra la última prueba vuelve a null
-- (pendiente). Un 0 cargado a mano en un insumo sin pruebas no se toca.
create or replace function public.recalcular_merma_insumo()
returns trigger
language plpgsql
as $$
declare
  v_insumo uuid := coalesce(new.insumo_id, old.insumo_id);
  v_merma numeric;
begin
  select round(avg((peso_perdida - peso_aprovechado) / peso_inicial) * 100, 2)
    into v_merma
    from public.rendimientos
   where insumo_id = v_insumo;

  update public.insumos set merma_pct = v_merma where id = v_insumo;

  -- Si una prueba cambió de insumo, recalcular también el anterior.
  if tg_op = 'UPDATE' and old.insumo_id <> new.insumo_id then
    select round(avg((peso_perdida - peso_aprovechado) / peso_inicial) * 100, 2)
      into v_merma
      from public.rendimientos
     where insumo_id = old.insumo_id;
    update public.insumos set merma_pct = v_merma where id = old.insumo_id;
  end if;

  return null;
end;
$$;

create trigger recalcular_merma_insumo
  after insert or update or delete on public.rendimientos
  for each row execute function public.recalcular_merma_insumo();

-- ---------------------------------------------------------------------------
-- recetas: sub-recetas, % de varios y precio de venta
-- ---------------------------------------------------------------------------
-- es_subreceta: se usa dentro de otras recetas (Marinado, Emulsión). En ese
-- caso porcion_base es lo que rinde la receta, expresado en
-- rendimiento_unidad (ej. 380 ml).
-- pct_varios: lo que se usa sin medir (aceite de plancha, sal de cocción,
-- film), como % sobre el costo de insumos de la receta.
-- precio_venta: precio por porción al público, IVA incluido.
alter table public.recetas
  add column es_subreceta boolean not null default false,
  add column rendimiento_unidad text check (
    rendimiento_unidad in ('kg', 'g', 'l', 'ml', 'unidad', 'docena')
  ),
  add column pct_varios numeric(5, 2) not null default 0
    check (pct_varios >= 0 and pct_varios <= 100),
  add column precio_venta numeric(12, 2) check (precio_venta >= 0),
  add constraint recetas_subreceta_con_unidad_check
    check (not es_subreceta or rendimiento_unidad is not null);

-- ---------------------------------------------------------------------------
-- receta_subrecetas: sub-recetas que componen una receta
-- ---------------------------------------------------------------------------
create table public.receta_subrecetas (
  id uuid primary key default gen_random_uuid(),
  -- si se borra la receta, se borra su lista de sub-recetas
  receta_id uuid not null references public.recetas (id) on delete cascade,
  -- no se puede borrar una sub-receta mientras esté en uso
  subreceta_id uuid not null references public.recetas (id) on delete restrict,
  cantidad numeric(12, 3) not null check (cantidad > 0),
  unidad text not null check (unidad in ('kg', 'g', 'l', 'ml', 'unidad', 'docena')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (receta_id, subreceta_id),
  constraint receta_subrecetas_no_si_misma_check check (receta_id <> subreceta_id)
);

create index receta_subrecetas_receta_id_idx on public.receta_subrecetas (receta_id);
create index receta_subrecetas_subreceta_id_idx on public.receta_subrecetas (subreceta_id);

create trigger set_updated_at
  before update on public.receta_subrecetas
  for each row execute function public.set_updated_at();

-- Evita ciclos (A usa B y B usa A, directa o indirectamente), que harían
-- infinito el cálculo de costos.
create or replace function public.evitar_ciclo_subrecetas()
returns trigger
language plpgsql
as $$
begin
  if exists (
    with recursive descendientes(id) as (
      select new.subreceta_id
      union
      select rs.subreceta_id
        from public.receta_subrecetas rs
        join descendientes d on rs.receta_id = d.id
    )
    select 1 from descendientes where id = new.receta_id
  ) then
    raise exception 'La sub-receta crearía un ciclo: una receta no puede contenerse a sí misma.';
  end if;
  return new;
end;
$$;

create trigger evitar_ciclo_subrecetas
  before insert or update on public.receta_subrecetas
  for each row execute function public.evitar_ciclo_subrecetas();

-- ---------------------------------------------------------------------------
-- costo_historial: cada cambio del costo vivo de un insumo
-- ---------------------------------------------------------------------------
create table public.costo_historial (
  id uuid primary key default gen_random_uuid(),
  insumo_id uuid not null references public.insumos (id) on delete cascade,
  costo_anterior numeric(12, 2) not null,
  costo_nuevo numeric(12, 2) not null,
  origen text not null check (origen in ('compra', 'manual')),
  -- si se borra la compra, se conserva el historial sin el vínculo
  compra_id uuid references public.compras (id) on delete set null,
  created_at timestamptz not null default now()
);

create index costo_historial_insumo_id_idx on public.costo_historial (insumo_id, created_at desc);

-- ---------------------------------------------------------------------------
-- cierres_mensuales: congelan el costo contable de cada insumo
-- ---------------------------------------------------------------------------
create table public.cierres_mensuales (
  id uuid primary key default gen_random_uuid(),
  -- primer día del mes cerrado
  periodo date not null unique check (extract(day from periodo) = 1),
  cerrado_en timestamptz not null default now()
);

create table public.cierre_insumos (
  cierre_id uuid not null references public.cierres_mensuales (id) on delete cascade,
  insumo_id uuid not null references public.insumos (id) on delete cascade,
  costo_contable numeric(12, 2) not null,
  primary key (cierre_id, insumo_id)
);

-- Cierra un mes en una sola transacción: copia el costo vivo de cada insumo
-- a costo_contable y guarda la foto en cierre_insumos. Un mes ya cerrado no
-- se puede volver a cerrar.
create or replace function public.cerrar_mes_costos(p_periodo date)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_periodo date := date_trunc('month', p_periodo)::date;
  v_cierre uuid;
begin
  if not public.is_app_admin() then
    raise exception 'Solo un administrador puede cerrar el mes.';
  end if;

  if exists (select 1 from public.cierres_mensuales where periodo = v_periodo) then
    raise exception 'El mes % ya está cerrado.', to_char(v_periodo, 'MM/YYYY');
  end if;

  insert into public.cierres_mensuales (periodo) values (v_periodo)
  returning id into v_cierre;

  insert into public.cierre_insumos (cierre_id, insumo_id, costo_contable)
  select v_cierre, id, costo_unitario from public.insumos;

  update public.insumos set costo_contable = costo_unitario;

  return v_cierre;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security: mismo criterio que el resto del ERP (solo admins).
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'rendimientos', 'receta_subrecetas', 'costo_historial',
      'cierres_mensuales', 'cierre_insumos'
    ])
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "app_admins_full_access" on public.%I for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin())',
      t
    );
  end loop;
end;
$$;

grant execute on function public.cerrar_mes_costos(date) to authenticated;
