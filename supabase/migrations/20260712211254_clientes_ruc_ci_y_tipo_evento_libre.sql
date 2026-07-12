-- RUC/CI del cliente, texto libre y opcional.
alter table public.clientes add column ruc_ci text;

-- eventos.tipo pasa a ser texto libre: se puede elegir uno ya usado o
-- escribir uno nuevo desde el formulario, en vez de estar limitado a la
-- lista fija original.
alter table public.eventos drop constraint eventos_tipo_check;
