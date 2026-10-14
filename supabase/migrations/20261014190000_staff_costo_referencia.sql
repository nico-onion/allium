-- Staff · costo de referencia
--
-- personal.costo_referencia: lo que suele cobrar esa persona por evento
-- (ej. Victor Flor, 250.000).
-- turnos.costo_referencia: foto de esa referencia al momento de asignarla
-- a un evento, para comparar después con lo que efectivamente se acordó
-- (turnos.costo, ej. 200.000) aunque la referencia cambie más adelante.
alter table public.personal
  add column costo_referencia numeric(12, 2) check (costo_referencia >= 0);

alter table public.turnos
  add column costo_referencia numeric(12, 2) check (costo_referencia >= 0);
