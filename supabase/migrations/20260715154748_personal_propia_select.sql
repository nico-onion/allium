-- Un usuario Nivel 2 necesita poder leer SU PROPIA fila de personal para
-- que /marcar pueda resolver el vínculo (auth_user_id -> personal.id).
-- Sin esto, la política de solo-admins en personal bloquea esa lectura
-- por completo — y de paso rompe las políticas de marcaciones, que
-- resuelven el mismo vínculo con una subconsulta contra personal sujeta
-- a este mismo RLS.
create policy "personal_propia_select" on public.personal
  for select to authenticated
  using (auth_user_id = auth.uid());
