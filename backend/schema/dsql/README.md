# Schemas do Aurora DSQL

## Catálogo público

`001_catalog.sql` é o único arquivo aplicado pelo comando padrão `apply-schema`. Ele contém jogos,
localizações e destaque diário e já foi validado no cluster protótipo.

`002_remove_steam_index.sql` remove o índice bruto `steam_apps` criado durante o primeiro ensaio.

## Shadow schema privado

`010_private_shadow.sql` e `011_private_indexes.sql` são um desenho revisável, não uma migration
ativa. Nenhum workflow ou comando padrão os aplica.

O desenho usa o schema `spotlight_private` e separa:

- usuário interno (`app_users`) de identidades JWT (`user_identities`);
- relações de catálogo por FKs para `public.games`;
- platinas e vitrine em tabelas relacionais;
- constraints estruturais no banco;
- autorização por usuário na API C#, porque DSQL não oferece RLS;
- efeitos automáticos na API, porque DSQL não oferece triggers ou PL/pgSQL.

Os índices secundários ficam em arquivo separado porque `CREATE INDEX ASYNC` devolve um job. Uma
futura ferramenta de aplicação deverá esperar cada job com `sys.wait_for_job` e falhar se o índice
ficar inválido.

A validação local não abre conexão nem altera a AWS:

```powershell
dotnet run --project backend\SpotLight.Database.Tool -- validate-private-schema
```

Ela confirma as 18 tabelas esperadas, os índices assíncronos e a ausência de construções proibidas.

Não aplique estes arquivos ao cluster compartilhado enquanto não existirem:

1. revisão do schema e da matriz de autorização;
2. papel IAM/SQL de runtime com privilégio mínimo;
3. comando de aplicação explícito diferente de `apply-schema`;
4. verificação de schema e índices;
5. plano de remoção do shadow schema sem tocar no catálogo.
