-- Cadastro da primeira empresa e do primeiro almoxarife.
-- 1. No painel do Supabase: Authentication > Users > Add user (e-mail e senha do almoxarife).
-- 2. Copie o "User UID" criado e cole abaixo no lugar de <USER_UID>.
-- 3. Rode este arquivo no SQL Editor.

with empresa as (
  insert into public.tenants (nome, cnpj) values ('Nome da empresa cliente', null) returning id
)
insert into public.usuarios (id, tenant_id, nome, papel)
select '<USER_UID>'::uuid, id, 'Nome do almoxarife', 'admin' from empresa;
