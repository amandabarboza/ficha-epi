-- Assinaturas ficam num bucket privado, em uma pasta por empresa: <tenant_id>/<arquivo>.png
-- Só leitura e inserção: não há política de update/delete, então o arquivo não muda depois de salvo.

insert into storage.buckets (id, name, public)
values ('assinaturas', 'assinaturas', false)
on conflict (id) do nothing;

create policy assinaturas_ler on storage.objects for select
  using (bucket_id = 'assinaturas' and (storage.foldername(name))[1] = public.tenant_atual()::text);

create policy assinaturas_inserir on storage.objects for insert
  with check (bucket_id = 'assinaturas' and (storage.foldername(name))[1] = public.tenant_atual()::text);
