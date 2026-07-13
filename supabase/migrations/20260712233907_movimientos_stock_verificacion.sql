-- Verificación de recepción para movimientos de stock tipo "compra": si la
-- cantidad recibida coincidió con lo cargado, o si hubo alguna discrepancia
-- (anotada en nota_verificacion). No aplica a los demás tipos de movimiento.

alter table public.movimientos_stock
  add column verificado boolean not null default false,
  add column nota_verificacion text,
  add constraint movimientos_stock_verificado_solo_compra_check
    check (tipo = 'compra' or verificado = false);
