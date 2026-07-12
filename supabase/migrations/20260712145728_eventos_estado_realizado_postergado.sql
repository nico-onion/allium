-- Renombra el estado "cerrado" a "realizado" y agrega "postergado".
-- Estados finales: cotizado, confirmado, en_curso, realizado, cancelado, postergado.

alter table public.eventos drop constraint eventos_estado_check;

update public.eventos set estado = 'realizado' where estado = 'cerrado';

alter table public.eventos add constraint eventos_estado_check
  check (
    estado in (
      'cotizado', 'confirmado', 'en_curso', 'realizado', 'cancelado', 'postergado'
    )
  );
