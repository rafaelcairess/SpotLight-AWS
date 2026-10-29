# Backend do SpotLight

API ASP.NET Core .NET 10 preparada para assumir gradualmente o acesso a dados hoje feito pelo
frontend. O catálogo já possui um protótipo validado no Aurora DSQL; Supabase Auth e os serviços
de usuário continuam ativos durante a transição.

## Estrutura

- `Controllers`: transporte HTTP e respostas `ProblemDetails`.
- `Contracts`: contratos públicos da API.
- `Services`: casos de uso e mapeamento para contratos.
- `Repositories`: consultas isoladas da aplicação.
- `Data`: `SpotLightDbContext`, PostgreSQL/Aurora DSQL e readiness.
- `Entities`: mapeamentos mínimos de tabelas reais.
- `Authentication`: validação JWT atual e abstração `ICurrentUser`.
- `Configuration`: opções validadas e tratamento global de erros.

O primeiro fluxo de dados é `GET /api/games/{appId}`. Ele demonstra
Controller → Service → Repository → DbContext usando a tabela real `public.games`, sem substituir
ainda as chamadas do frontend.

## Endpoints

- `GET /api/health`: diagnóstico simples e compatível com a versão anterior.
- `GET /health/live`: confirma que o processo ASP.NET está respondendo.
- `GET /health/ready`: verifica as dependências configuradas, incluindo PostgreSQL.
- `GET /health`: alias de readiness para compatibilidade.
- `GET /api/me`: retorna a identidade validada pelo JWT atual.
- `GET /api/games/{appId}`: primeira leitura PostgreSQL preparada para migração gradual.

Swagger/OpenAPI fica disponível apenas em `Development`.

## Configuração

Use configuração do ASP.NET Core ou variáveis de ambiente. Nunca versione credenciais.

| Configuração                          | Variável de ambiente                                      | Uso                                                           |
| ------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `Database:Provider`                   | `Database__Provider`                                      | `PostgreSql` ou `AuroraDsql`                                  |
| `ConnectionStrings:DefaultConnection` | `ConnectionStrings__DefaultConnection`                    | Usada somente com `PostgreSql`                                |
| `Database:Required`                   | `Database__Required`                                      | Faz o startup falhar se a conexão obrigatória estiver ausente |
| `Database:CommandTimeoutSeconds`      | `Database__CommandTimeoutSeconds`                         | Timeout entre 1 e 300 segundos                                |
| `Database:AuroraDsqlEndpoint`         | `Database__AuroraDsqlEndpoint`                            | Endpoint do cluster, sem usuário ou senha                     |
| `Database:AuroraDsqlUser`             | `Database__AuroraDsqlUser`                                | Papel SQL, normalmente `spotlight_api`                        |
| `Database:AuroraDsqlOccMaxRetries`    | `Database__AuroraDsqlOccMaxRetries`                       | Retentativas de conflitos OCC, de 0 a 10                      |
| `Cors:AllowedOrigins`                 | `Cors__AllowedOrigins__0`, `Cors__AllowedOrigins__1`, ... | Origens exatas autorizadas                                    |
| `SupabaseAuth:Issuer`                 | `SupabaseAuth__Issuer`                                    | Emissor JWT atual                                             |
| `SupabaseAuth:Audience`               | `SupabaseAuth__Audience`                                  | Audiência JWT atual                                           |

Quando não há connection string e `Database:Required=false`, liveness e `/api/me` continuam
funcionando. Endpoints de dados respondem `503` sem revelar configuração. Quando a conexão é
fornecida, o readiness executa uma consulta real no provedor selecionado. O DSQL usa o conector
oficial da AWS, autenticação IAM e pooling; não existe senha de banco na configuração.

Nenhuma migration EF é criada ou aplicada automaticamente no startup.

O site não depende da publicação desta API. Para manter o portfólio com custo zero ou muito baixo,
a API continua executável localmente e validada pela CI. Uma implantação pública opcional em AWS
Lambda Function URL com Aurora DSQL está definida em `infra/api/template.yaml`; ela elimina API
Gateway, RDS, VPC e NAT e não é executada automaticamente. O desenvolvimento local usa Kestrel e
não depende de Docker.

## Catálogo no Aurora DSQL

O schema compatível fica em `backend/schema/dsql`. Arrays PostgreSQL do catálogo são armazenados
como `jsonb` no DSQL e convertidos pelo `SpotLightDbContext`; o modelo HTTP continua igual. O índice
bruto `steam_apps` não é replicado porque não atende páginas nem endpoints e consumiria a franquia
gratuita sem benefício.

```powershell
dotnet run --project backend\SpotLight.Database.Tool -- apply-schema --endpoint <endpoint>
dotnet run --project backend\SpotLight.Database.Tool -- verify-schema --endpoint <endpoint>
dotnet run --project backend\SpotLight.Database.Tool -- copy-catalog --endpoint <endpoint>
dotnet run --project backend\SpotLight.Database.Tool -- grant-reader --endpoint <endpoint> --iam-arn <arn>
dotnet run --project backend\SpotLight.Database.Tool -- verify-reader --endpoint <endpoint> --user spotlight_api
```

`copy-catalog` exige `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` (ou os argumentos equivalentes) e
acessa somente as tabelas públicas `games`, `game_localizations` e `daily_featured`. A origem
Supabase permanece autoritativa até o canário remoto ser aprovado.

`grant-reader` deve ser executado com uma identidade autorizada para `dsql:DbConnectAdmin`. Ele
cria o papel `spotlight_api`, associa o ARN IAM informado e concede `SELECT` apenas nas tabelas do
catálogo. A aplicação usa `dsql:DbConnect`; o acesso administrativo não faz parte do runtime.

## Desenvolvimento local

```powershell
dotnet restore backend\SpotLight.sln
dotnet run --project backend\SpotLight.Api --urls http://localhost:5080
```

## Validação

```powershell
dotnet restore backend\SpotLight.sln
dotnet format backend\SpotLight.sln --verify-no-changes
dotnet build backend\SpotLight.sln --configuration Release
dotnet test backend\SpotLight.sln --configuration Release
```

Veja [MIGRATION_PLAN.md](MIGRATION_PLAN.md) para as fases de transição.
