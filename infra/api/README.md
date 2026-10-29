# Infraestrutura opcional da API

Esta stack é um alvo de homologação, não uma dependência do site. O SpotLight publicado continua
estático em S3/CloudFront e conectado ao Supabase; manter este template no repositório não cria
recursos. Um cluster DSQL protótipo foi criado manualmente para validar schema e dados, mas a stack
completa ainda não foi publicada.

Se uma URL pública para a API C# for necessária, a stack executa ASP.NET Core em uma Lambda
Function URL. A mesma aplicação continua rodando localmente com Kestrel; o adaptador AWS só assume
o servidor quando o processo está no Lambda.

## Decisões de homologação

- Nenhum recurso é provisionado automaticamente em `push`.
- Function URL em vez de API Gateway, sem cobrança adicional pelo endpoint.
- `arm64`, 512 MB, timeout de 15 segundos e concorrência reservada em 2.
- CORS restrito à origem informada.
- Apenas logs de warning, retidos por 7 dias; X-Ray fica desativado.
- Aurora DSQL de região única, sem RDS, VPC, NAT ou senha de banco.
- Conexão pelo papel IAM da Lambda, restrita ao ARN do cluster criado pela stack.
- Supabase Auth permanece como emissor dos JWTs durante a migração.
- O Supabase continua como origem autoritativa e caminho de rollback nesta fase.

Não crie RDS, RDS Proxy, VPC, NAT Gateway, ALB, ECS ou App Runner nesta fase. Além de serem
desnecessários para o portfólio, alguns desses recursos geram cobrança enquanto ociosos. A
migração dos dados privados continua exigindo portar RLS, triggers e funções para regras C# antes
de qualquer cutover.

## Pré-requisitos

- .NET 10 SDK;
- AWS SAM CLI;
- credenciais AWS com permissão para CloudFormation, Lambda, CloudWatch, DSQL e IAM.

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

Informe uma origem exata em `AllowedOrigin` e o issuer HTTPS do Supabase em
`SupabaseAuthIssuer`. Não coloque chaves no repositório. O endpoint DSQL é injetado diretamente
pelo CloudFormation e a autenticação usa o papel IAM gerado para a função.

Após o deploy, valide `/health/live`, `/health/ready`, `/api/games/{appId}` e `/api/me` antes de
configurar qualquer tráfego do frontend.

## Deploy pelo GitHub

O workflow manual `.github/workflows/api-staging.yml` exige um environment protegido chamado
`staging` com:

| Tipo     | Nome                      | Conteúdo                                   |
| -------- | ------------------------- | ------------------------------------------ |
| Secret   | `AWS_API_DEPLOY_ROLE_ARN` | Role OIDC autorizada a publicar a stack    |
| Variable | `SUPABASE_AUTH_ISSUER`    | Issuer HTTPS do projeto Supabase           |
| Variable | `API_ALLOWED_ORIGIN`      | Origem exata do frontend                   |
| Variable | `SUPABASE_AUTH_AUDIENCE`  | Audiência JWT, normalmente `authenticated` |

O workflow não roda em `push`; alguém precisa iniciá-lo pela aba Actions e aprovar o environment.
Se a API pública não for necessária, não crie o environment e não execute o workflow. O cluster
DSQL protótipo pode ser consultado localmente usando IAM; Lambda e Function URL só serão criadas
quando o workflow manual for aprovado.

## Protótipo atual

O protótipo em `sa-east-1` usa as tags `Project=SpotLight`, `Environment=prototype` e
`Workload=catalog`, sem proteção contra exclusão. O schema contém somente `games`,
`game_localizations` e `daily_featured`. Para localizar o recurso sem gravar identificadores no
repositório:

```powershell
aws dsql list-clusters --region sa-east-1
```

Antes de publicar a API, substitua o acesso temporário `admin` por um papel SQL de leitura ligado
ao papel IAM da Lambda e troque `dsql:DbConnectAdmin` por `dsql:DbConnect`.
