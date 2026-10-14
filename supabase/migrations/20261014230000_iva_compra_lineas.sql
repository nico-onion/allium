-- Tasa de IVA de cada renglón de una factura de compra: exenta (0), 5 % o
-- 10 %, como la discrimina la factura. El subtotal sigue siendo con IVA
-- incluido; la tasa permite separar el IVA (crédito fiscal cuando la factura
-- sale a nombre de Allium). Los renglones ya cargados quedan en 10 %.
alter table public.compra_lineas
  add column tasa_iva smallint not null default 10 check (tasa_iva in (0, 5, 10));
