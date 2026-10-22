-- Fecha as funções para quem não está logado e tira da API as que só servem aos gatilhos.
-- O privilégio de EXECUTE de função de gatilho só é checado ao criar o gatilho, então revogar é seguro.

revoke execute on function public.tenant_atual()                 from public, anon;
revoke execute on function public.definir_pin(uuid, text)        from public, anon;
revoke execute on function public.verificar_pin(uuid, text)      from public, anon;
revoke execute on function public.entregas_antes_insert()        from public, anon, authenticated;
revoke execute on function public.entregas_depois_insert()       from public, anon, authenticated;
revoke execute on function public.entregas_imutavel()            from public, anon, authenticated;

-- Usadas pelo app logado (cada uma já se limita à empresa do usuário).
grant execute on function public.tenant_atual()            to authenticated;
grant execute on function public.definir_pin(uuid, text)   to authenticated;
grant execute on function public.verificar_pin(uuid, text) to authenticated;

alter function public.entregas_imutavel() set search_path = public;
