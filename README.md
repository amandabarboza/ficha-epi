# Ficha de EPI

PWA para controle de entrega de EPIs, pensado para uso no celular por quem não está acostumado com sistemas.

## Fluxo de entrega

1. O almoxarife entra no app.
2. Escolhe o funcionário (busca por nome ou matrícula).
3. Escolhe o EPI. Itens com CA vencido ou sem estoque ficam bloqueados.
4. O funcionário digita o PIN pessoal e assina na tela.
5. A entrega é gravada com data e hora, CA, lote e assinatura.

## Estado atual

| Parte | Situação |
|---|---|
| Telas: entrega, pessoas, EPIs, fichas, ficha para imprimir/PDF | Feitas |
| PWA (manifest, ícones, service worker) | Feito |
| Dados | Supabase quando configurado; sem configuração, modo demonstração no navegador (`src/lib/dados.ts`) |
| Banco no Supabase (`supabase/migrations/0001_init.sql`) | Escrito e testado em Postgres local: registro imutável, hash encadeado, PIN com bloqueio, isolamento por empresa |
| Supabase (projeto `ficha-epi`, São Paulo) | Criado, migrações 0001 a 0004 aplicadas e regras testadas no banco |
| App falando com o Supabase (login, dados, assinatura) | Código pronto, falta testar pelo navegador com um usuário real |
| Fila offline com sincronização | Próximo passo |
| Face ID / digital (WebAuthn) para o almoxarife | Próximo passo |
| Foto de evidência (com consentimento LGPD) | Próximo passo |
| Alertas e relatórios por período | Próximo passo |

## Regras do banco

- `entregas` só aceita inserção. `UPDATE`, `DELETE` e `TRUNCATE` são bloqueados por trigger. Correção é um novo registro com `corrige_id`.
- Cada registro guarda o hash do anterior (por empresa), para provar que nada foi alterado.
- A hora é a do servidor. A hora do aparelho vai em `criado_em_aparelho`, para auditoria offline.
- CA vencido e estoque insuficiente são recusados no banco, não só na tela.
- O PIN só existe como hash (`crypt`), com bloqueio de 15 minutos após 5 erros. O hash nunca é legível pelo app.
- Cada usuário só enxerga a própria empresa (RLS).

## Ligar ao Supabase

1. Crie um projeto em supabase.com (região São Paulo).
2. No SQL Editor, rode em ordem os arquivos de `supabase/migrations/` (0001 a 0004).
3. Crie o primeiro usuário e empresa com `supabase/primeiro-acesso.sql`.
4. Copie `.env.example` para `.env.local` e preencha URL e chave `anon` (Project Settings > API).
   Na Vercel, cadastre as mesmas duas variáveis.

## Identidade visual

- Cores, logo e cabeçalho seguem a marca SOL (verde-petróleo `#1a3a3a` e amarelo `#f8a80c`).
- Dados da consultoria impressos no cabeçalho da ficha ficam em `src/lib/consultoria.ts`. Campos vazios não aparecem.
- Ícones: `npm run icons` regera favicon e ícones a partir de `public/marca/sol-simbolo.png`.

## Desenvolvimento

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
npm run icons      # regera favicon e ícones a partir de public/marca/sol-simbolo.png
```

Dados de teste: funcionários com PIN `1234`. O EPI "Óculos de proteção" tem CA vencido de propósito.
