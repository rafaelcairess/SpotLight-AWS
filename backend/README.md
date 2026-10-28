# Backend do SpotLight

API ASP.NET Core .NET 8 preparada para assumir gradualmente o acesso a dados hoje feito pelo
frontend. Supabase Auth e os serviços atuais continuam ativos durante a transição.

## Estrutura

- `Controllers`: transporte HTTP e respostas `ProblemDetails`.
- `Contracts`: contratos públicos da API.
- `Services`: casos de uso e mapeamento para contratos.
- `Repositories`: consultas isoladas da aplicação.
- `Data`: `SpotLightDbContext`, PostgreSQL e readiness.
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
| `ConnectionStrings:DefaultConnection` | `ConnectionStrings__DefaultConnection`                    | PostgreSQL do Supabase agora ou RDS no futuro                 |
| `Database:Required`                   | `Database__Required`                                      | Faz o startup falhar se a conexão obrigatória estiver ausente |
| `Database:CommandTimeoutSeconds`      | `Database__CommandTimeoutSeconds`                         | Timeout entre 1 e 300 segundos                                |
| `Cors:AllowedOrigins`                 | `Cors__AllowedOrigins__0`, `Cors__AllowedOrigins__1`, ... | Origens exatas autorizadas                                    |
| `SupabaseAuth:Issuer`                 | `SupabaseAuth__Issuer`                                    | Emissor JWT atual                                             |
| `SupabaseAuth:Audience`               | `SupabaseAuth__Audience`                                  | Audiência JWT atual                                           |

Quando não há connection string e `Database:Required=false`, liveness e `/api/me` continuam
funcionando. Endpoints de dados respondem `503` sem revelar configuração. Quando a conexão é
fornecida, o readiness passa a executar `CanConnectAsync` no PostgreSQL.

Nenhuma migration EF é criada ou aplicada automaticamente no startup.

O modelo de publicação da API ainda não foi escolhido. O frontend atual continua estático em
S3/CloudFront e não depende de Docker; a primeira opção a ser avaliada para a API é o caminho
serverless descrito em `docs/aws-migration.md`.

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
