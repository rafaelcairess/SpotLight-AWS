# Infraestrutura opcional da API

Esta stack é um alvo de demonstração, não uma dependência do site. O SpotLight publicado continua
estático em S3/CloudFront e conectado ao Supabase; manter este template no repositório não cria
recursos nem gera cobrança.

Se uma URL pública para a API C# for necessária, a stack executa ASP.NET Core em uma Lambda
Function URL. A mesma aplicação continua rodando localmente com Kestrel; o adaptador AWS só assume
o servidor quando o processo está no Lambda.

## Decisões de homologação

- Nenhum recurso é provisionado automaticamente em `push`.
- Function URL em vez de API Gateway, sem cobrança adicional pelo endpoint.
- `arm64`, 512 MB, timeout de 15 segundos e concorrência reservada em 2.
- CORS restrito à origem informada.
- Apenas logs de warning, retidos por 7 dias; X-Ray fica desativado.
- Connection string em um `SecureString` Standard do Parameter Store.
- Supabase Auth permanece como emissor dos JWTs durante a migração.
- O PostgreSQL do Supabase continua como origem autoritativa nesta fase.

Não crie RDS, RDS Proxy, VPC, NAT Gateway, ALB, ECS ou App Runner nesta fase. Além de serem
desnecessários para o portfólio, alguns desses recursos geram cobrança enquanto ociosos. A
migração futura do banco continua exigindo inventário de RLS, triggers, funções, extensões e
ensaios de cópia antes de qualquer decisão.

## Pré-requisitos

- .NET 10 SDK;
- AWS SAM CLI;
- credenciais AWS com permissão para CloudFormation, Lambda, CloudWatch, SSM e IAM;
- parâmetro `SecureString` Standard no Parameter Store com a connection string do pooler Supabase.

## Validar e compilar

```powershell
sam validate --lint --template-file infra/api/template.yaml
sam build --template-file infra/api/template.yaml
```

## Primeiro deploy de homologação

O primeiro deploy deve ser guiado para revisar os recursos e salvar parâmetros fora do Git:

```powershell
sam deploy --guided --template-file .aws-sam/build/template.yaml
```

Informe uma origem exata em `AllowedOrigin`, o issuer HTTPS do Supabase em `SupabaseAuthIssuer` e
o nome do parâmetro em `DatabaseParameterName`. Não coloque connection strings ou chaves no
repositório.

Após o deploy, valide `/health/live`, `/health/ready`, `/api/games/{appId}` e `/api/me` antes de
configurar qualquer tráfego do frontend.

## Deploy pelo GitHub

O workflow manual `.github/workflows/api-staging.yml` exige um environment protegido chamado
`staging` com:

| Tipo     | Nome                          | Conteúdo                                   |
| -------- | ----------------------------- | ------------------------------------------ |
| Secret   | `AWS_API_DEPLOY_ROLE_ARN`     | Role OIDC autorizada a publicar a stack    |
| Variable | `API_DATABASE_PARAMETER_NAME` | Nome do SecureString Standard              |
| Variable | `SUPABASE_AUTH_ISSUER`        | Issuer HTTPS do projeto Supabase           |
| Variable | `API_ALLOWED_ORIGIN`          | Origem exata do frontend                   |
| Variable | `SUPABASE_AUTH_AUDIENCE`      | Audiência JWT, normalmente `authenticated` |

O workflow não roda em `push`; alguém precisa iniciá-lo pela aba Actions e aprovar o environment.
Se a API pública não for necessária, não crie o environment e não execute o workflow: a API
continua demonstrável por testes e execução local, com custo AWS zero.
