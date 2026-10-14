-- Fase 3 · Inventario
--
-- Todo lo que se compra entra al almacén; cada evento retira lo que usa.
-- El stock se lleva por lotes con fecha de vencimiento, y las salidas
-- consumen primero lo que vence antes. Cada salida guarda el costo al que
-- salió (promedio ponderado del momento), que es el costo real del evento.

-- ---------------------------------------------------------------------------
-- lotes_stock: cada ingreso de un insumo, con su vencimiento
-- ---------------------------------------------------------------------------
create table public.lotes_stock (
  id uuid primary key default gen_random_uuid(),
  insumo_id uuid not null references public.insumos (id) on delete cascade,
  -- de qué renglón de factura vino (null: stock inicial, ajuste o conteo)
  compra_linea_id uuid references public.compra_lineas (id) on delete set null,
  fecha_ingreso date not null default current_date,
  -- null = todavía no se cargó la fecha
  fecha_vencimiento date,
  cantidad_inicial numeric(12, 3) not null check (cantidad_inicial > 0),
  cantidad_restante numeric(12, 3) not null check (cantidad_restante >= 0),
  nota text,
  created_at timestamptz not null default now()
);

create index lotes_stock_insumo_id_idx on public.lotes_stock (insumo_id);
-- los lotes con algo adentro, por vencimiento (alertas y consumo)
create index lotes_stock_disponibles_idx on public.lotes_stock (fecha_vencimiento)
  where cantidad_restante > 0;

alter table public.lotes_stock enable row level security;
create policy "app_admins_full_access" on public.lotes_stock
  for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

-- El stock que ya existe queda como un lote sin fecha, para completar.
insert into public.lotes_stock (insumo_id, cantidad_inicial, cantidad_restante, nota)
select id, stock_actual, stock_actual, 'Stock inicial (Fase 3)'
from public.insumos
where stock_actual > 0;

-- ---------------------------------------------------------------------------
-- compra_lineas: vencimiento de lo comprado (se carga en la revisión)
-- ---------------------------------------------------------------------------
alter table public.compra_lineas add column fecha_vencimiento date;

-- ---------------------------------------------------------------------------
-- movimientos_stock: costo al que salió cada cosa
-- ---------------------------------------------------------------------------
-- costo por unidad del insumo al momento del movimiento (con IVA). En las
-- salidas a un evento es lo que suma al ejecutado.
alter table public.movimientos_stock add column costo_unitario numeric(14, 4);
