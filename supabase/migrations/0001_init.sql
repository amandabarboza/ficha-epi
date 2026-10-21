-- Ficha de EPI: modelo inicial.
-- Multi-empresa (tenant), registro de entregas imutável e encadeado por hash.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Empresas clientes e usuários (almoxarifes)
-- ---------------------------------------------------------------------------
create table public.tenants (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  cnpj       text,
  criado_em  timestamptz not null default now()
);

create table public.usuarios (
  id         uuid primary key references auth.users(id) on delete cascade,
  tenant_id  uuid not null references public.tenants(id),
  nome       text not null,
  papel      text not null default 'almoxarife' check (papel in ('admin', 'almoxarife')),
  criado_em  timestamptz not null default now()
);

-- Empresa do usuário logado. Usada em todas as políticas de RLS.
create function public.tenant_atual() returns uuid
language sql stable security definer set search_path = public as $$
  select tenant_id from public.usuarios where id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- Funcionários
-- ---------------------------------------------------------------------------
create table public.funcionarios (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id),
  nome             text not null,
  matricula        text not null,
  funcao           text,
  pin_hash         text,                       -- crypt() do PIN, nunca o PIN
  pin_tentativas   int  not null default 0,
  pin_bloqueado_ate timestamptz,
  ativo            boolean not null default true,
  criado_em        timestamptz not null default now(),
  unique (tenant_id, matricula)
);

-- ---------------------------------------------------------------------------
-- Catálogo de EPIs
-- ---------------------------------------------------------------------------
create table public.epis (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id),
  nome            text not null,
  ca              text not null,
  validade_ca     date not null,
  lote            text,
  estoque         int  not null default 0 check (estoque >= 0),
  estoque_minimo  int  not null default 0,
  ativo           boolean not null default true,
  criado_em       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Entregas (registro legal): só inserção, nunca edição ou exclusão.
-- Uma correção é uma nova linha apontando para a original em corrige_id.
-- ---------------------------------------------------------------------------
create table public.entregas (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references public.tenants(id),
  funcionario_id      uuid not null references public.funcionarios(id),
  epi_id              uuid not null references public.epis(id),
  tipo                text not null check (tipo in ('entrega', 'devolucao', 'troca')),
  quantidade          int  not null check (quantidade > 0),
  -- Cópia do que valia no momento: a ficha não pode mudar se o catálogo mudar.
  epi_nome            text not null,
  ca                  text not null,
  lote                text,
  assinatura          text not null,           -- caminho no Storage (PNG da assinatura)
  foto_path           text,
  almoxarife_id       uuid not null references public.usuarios(id),
  corrige_id          uuid references public.entregas(id),
  observacao          text,
  criado_em           timestamptz not null default now(),   -- hora do servidor
  criado_em_aparelho  timestamptz,                          -- hora do celular (auditoria offline)
  hash_anterior       text,
  hash                text not null
);

create index entregas_funcionario_idx on public.entregas (tenant_id, funcionario_id, criado_em desc);
create index entregas_epi_idx         on public.entregas (tenant_id, epi_id, criado_em desc);

-- Antes de inserir: valida CA, carimba o encadeamento de hash por empresa.
create function public.entregas_antes_insert() returns trigger
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

  -- Dados congelados no registro
  new.epi_nome  := v_epi.nome;
  new.ca        := v_epi.ca;
  new.lote      := coalesce(new.lote, v_epi.lote);
  new.criado_em := now();

  -- Uma empresa por vez na cadeia de hash
  perform pg_advisory_xact_lock(hashtext(new.tenant_id::text));
  select hash into v_ultimo
    from public.entregas where tenant_id = new.tenant_id
    order by criado_em desc, id desc limit 1;

  new.hash_anterior := v_ultimo;
  new.hash := encode(digest(
    coalesce(v_ultimo, '') || '|' || new.id || '|' || new.funcionario_id || '|' || new.epi_id
    || '|' || new.tipo || '|' || new.quantidade || '|' || new.ca || '|' || coalesce(new.lote, '')
    || '|' || new.assinatura || '|' || new.almoxarife_id || '|' || new.criado_em::text,
    'sha256'), 'hex');
  return new;
end $$;

create trigger entregas_antes_insert
  before insert on public.entregas
  for each row execute function public.entregas_antes_insert();

-- Depois de inserir: movimenta o estoque (o estoque é saldo, o registro legal é a entrega).
create function public.entregas_depois_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.epis
     set estoque = estoque + case when new.tipo = 'devolucao' then new.quantidade else -new.quantidade end
   where id = new.epi_id;
  return new;
end $$;

create trigger entregas_depois_insert
  after insert on public.entregas
  for each row execute function public.entregas_depois_insert();

-- Imutabilidade: bloqueia UPDATE e DELETE, inclusive para o dono do banco.
create function public.entregas_imutavel() returns trigger
language plpgsql as $$
begin
  raise exception 'Registros de entrega não podem ser alterados ou apagados. Crie um novo registro de correção.'
    using errcode = 'P0001';
end $$;

create trigger entregas_sem_update
  before update or delete on public.entregas
  for each row execute function public.entregas_imutavel();

create trigger entregas_sem_truncate
  before truncate on public.entregas
  for each statement execute function public.entregas_imutavel();

-- ---------------------------------------------------------------------------
-- PIN do funcionário: verificação com bloqueio por tentativas erradas
-- ---------------------------------------------------------------------------
create function public.definir_pin(p_funcionario uuid, p_pin text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if p_pin !~ '^[0-9]{4,6}$' then
    raise exception 'O PIN deve ter de 4 a 6 números';
  end if;
  update public.funcionarios
     set pin_hash = crypt(p_pin, gen_salt('bf')), pin_tentativas = 0, pin_bloqueado_ate = null
   where id = p_funcionario and tenant_id = public.tenant_atual();
  if not found then raise exception 'Funcionário não encontrado'; end if;
end $$;

create function public.verificar_pin(p_funcionario uuid, p_pin text) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare
  f public.funcionarios;
  ok boolean;
begin
  select * into f from public.funcionarios
   where id = p_funcionario and tenant_id = public.tenant_atual() for update;
  if not found or f.pin_hash is null then return false; end if;

  if f.pin_bloqueado_ate is not null and f.pin_bloqueado_ate > now() then
    raise exception 'PIN bloqueado. Peça ao almoxarife para redefinir.' using errcode = 'P0001';
  end if;

  ok := f.pin_hash = crypt(p_pin, f.pin_hash);
  if ok then
    update public.funcionarios set pin_tentativas = 0, pin_bloqueado_ate = null where id = f.id;
  else
    update public.funcionarios
       set pin_tentativas = pin_tentativas + 1,
           pin_bloqueado_ate = case when pin_tentativas + 1 >= 5 then now() + interval '15 minutes' end
     where id = f.id;
  end if;
  return ok;
end $$;

-- ---------------------------------------------------------------------------
-- Segurança por linha: cada usuário só enxerga a própria empresa
-- ---------------------------------------------------------------------------
alter table public.tenants      enable row level security;
alter table public.usuarios     enable row level security;
alter table public.funcionarios enable row level security;
alter table public.epis         enable row level security;
alter table public.entregas     enable row level security;

create policy tenants_ler on public.tenants for select using (id = public.tenant_atual());
create policy usuarios_ler on public.usuarios for select using (tenant_id = public.tenant_atual());

create policy funcionarios_tudo on public.funcionarios
  for all using (tenant_id = public.tenant_atual()) with check (tenant_id = public.tenant_atual());

create policy epis_tudo on public.epis
  for all using (tenant_id = public.tenant_atual()) with check (tenant_id = public.tenant_atual());

-- Entregas: só leitura e inserção. Não existe política de update/delete.
create policy entregas_ler on public.entregas for select using (tenant_id = public.tenant_atual());
create policy entregas_inserir on public.entregas for insert
  with check (tenant_id = public.tenant_atual() and almoxarife_id = auth.uid());

-- Permissões de tabela. No Supabase, anon/authenticated recebem acesso total por padrão,
-- e um revoke de coluna não vale enquanto existir o grant da tabela inteira.
-- Por isso: tira tudo e devolve só o necessário.
revoke all on public.funcionarios from anon, authenticated;
grant select (id, tenant_id, nome, matricula, funcao, pin_tentativas, pin_bloqueado_ate, ativo, criado_em)
  on public.funcionarios to authenticated;                      -- pin_hash nunca sai para o app
grant insert (tenant_id, nome, matricula, funcao) on public.funcionarios to authenticated;
grant update (nome, matricula, funcao, ativo) on public.funcionarios to authenticated;

revoke all on public.entregas from anon, authenticated;
grant select, insert on public.entregas to authenticated;       -- sem update, delete ou truncate
