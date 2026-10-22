-- A cadeia de hash precisa de uma ordem exata. now() é a hora de início da transação,
-- então duas entregas podem empatar ou chegar fora de ordem. Passa a valer um número
-- sequencial, sorteado só depois da trava por empresa, e a hora real do relógio.

create sequence public.entregas_seq;
alter table public.entregas add column seq bigint unique;
update public.entregas set seq = nextval('public.entregas_seq') where seq is null;  -- tabela vazia na criação
alter table public.entregas alter column seq set not null;

create or replace function public.entregas_antes_insert() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_epi    public.epis;
  v_ultimo text;
begin
  select * into v_epi from public.epis where id = new.epi_id and tenant_id = new.tenant_id;
  if not found then
    raise exception 'EPI não encontrado' using errcode = 'P0002';
  end if;

  if new.tipo in ('entrega', 'troca') then
    if v_epi.validade_ca < current_date then
      raise exception 'CA % vencido em %', v_epi.ca, v_epi.validade_ca using errcode = 'P0001';
    end if;
    if v_epi.estoque < new.quantidade then
      raise exception 'Estoque insuficiente de %', v_epi.nome using errcode = 'P0001';
    end if;
  end if;

  new.epi_nome := v_epi.nome;
  new.ca       := v_epi.ca;
  new.lote     := coalesce(new.lote, v_epi.lote);

  -- Uma entrega por vez em cada empresa; ordem e hora definidas já com a trava.
  perform pg_advisory_xact_lock(hashtext(new.tenant_id::text));
  new.seq       := nextval('public.entregas_seq');
  new.criado_em := clock_timestamp();

  select hash into v_ultimo
    from public.entregas where tenant_id = new.tenant_id
    order by seq desc limit 1;

  new.hash_anterior := v_ultimo;
  new.hash := encode(digest(
    coalesce(v_ultimo, '') || '|' || new.id || '|' || new.funcionario_id || '|' || new.epi_id
    || '|' || new.tipo || '|' || new.quantidade || '|' || new.ca || '|' || coalesce(new.lote, '')
    || '|' || new.assinatura || '|' || new.almoxarife_id || '|' || new.criado_em::text,
    'sha256'), 'hex');
  return new;
end $$;

revoke all on sequence public.entregas_seq from anon, authenticated;
