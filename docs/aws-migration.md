# SpotLight na AWS

## Objetivo e estado atual

O frontend oficial do SpotLight está publicado na AWS e continua conectado ao projeto
Supabase existente. Este repositório preserva o histórico da aplicação e prepara a
migração futura do backend por camadas.

```text
Usuário
  ↓
spotlight.rafaelcpires.abrdns.com
  ↓
CloudFront
  ↓
S3
  ↓
React/Vite
  ↓
Supabase atual
```

A aplicação está disponível em `https://spotlight.rafaelcpires.abrdns.com`. A API
ASP.NET Core permanece no código como base da migração gradual, mas ainda não faz parte
do ambiente publicado. Seu modelo de execução será definido somente quando o backend
começar a receber tráfego; o frontend estático não depende de contêineres.

## Build estático

Use Node.js 20 e configure as variáveis públicas em `.env.local`, que não deve ser
versionado:

```dotenv
VITE_SITE_URL=https://spotlight.rafaelcpires.abrdns.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_API_URL=
```

`VITE_SITE_URL` define canonical, Open Graph e demais URLs públicas. A URL e a chave
publicável do Supabase são entregues ao navegador por definição; nunca use uma chave
`service_role` em variável `VITE_*`.

```powershell
npm ci
npm run build
```

O resultado fica em `dist/` e contém somente arquivos estáticos. Antes da publicação,
use `VITE_SITE_URL=https://spotlight.rafaelcpires.abrdns.com` e gere o build novamente.

## Referência da configuração S3 e CloudFront

A infraestrutura abaixo já está publicada e não será alterada nesta correção de
autenticação. O checklist permanece como referência para auditoria e reconstrução futura.

1. Criar alertas no AWS Budgets antes dos recursos, por exemplo US$ 5 e US$ 10.
2. Criar um bucket S3 com Block Public Access habilitado; não ativar website hosting.
3. Criar uma distribuição CloudFront usando o endpoint REST do bucket como origem.
4. Criar uma Origin Access Control (OAC) e aplicar ao bucket apenas a policy gerada para
   a distribuição.
5. Definir `index.html` como Default Root Object.
6. Associar uma CloudFront Function no evento Viewer Request usando
   `infra/cloudfront/spa-rewrite.js`. Ela envia rotas sem extensão, como `/game/123` e
   `/u/usuario`, para `/index.html`, mas preserva caminhos de assets como
   `/assets/app.js` para que arquivos inexistentes continuem retornando erro real.
7. Criar uma Response Headers Policy com os headers abaixo e associá-la ao behavior.
8. Enviar o conteúdo de `dist/` ao bucket e testar pelo domínio oficial.

Headers mínimos da política:

```text
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; manifest-src 'self'; worker-src 'self' blob:; upgrade-insecure-requests
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

Use cache longo e `immutable` para `assets/*`, pois os nomes possuem hash. Para
`index.html`, use cache curto ou `no-cache`, evitando que novas versões apontem para
assets antigos. A automação de upload e invalidação será feita somente na fase de CI/CD.

## Compatibilidade com o Supabase

O código das Edge Functions aceita uma lista exata e configurável de origens. Em
produção, configure somente o domínio oficial:

```dotenv
PUBLIC_SITE_URL=https://spotlight.rafaelcpires.abrdns.com
ALLOWED_SITE_ORIGINS=https://spotlight.rafaelcpires.abrdns.com
ALLOW_LOCAL_REDIRECTS=false
```

`PUBLIC_SITE_URL` é a origem principal; `ALLOWED_SITE_ORIGINS` permite que login Steam,
Xbox, PSN e chamadas CORS retornem somente para o frontend oficial. A ausência de
`SITE_URL` e `PUBLIC_SITE_URL` é tratada como erro de configuração, sem fallback embutido.

### Autenticação e redirects

Mantenha `https://spotlight.rafaelcpires.abrdns.com` como **Site URL** em
**Authentication → URL Configuration** e confirme estas **Redirect URLs** exatas:

```text
https://spotlight.rafaelcpires.abrdns.com/
https://spotlight.rafaelcpires.abrdns.com/?auth_mode=reset
```

O frontend calcula o retorno usando `window.location.origin`, enquanto o servidor exige
correspondência exata com a allowlist. Confirmação de
cadastro, Google e logins de plataforma retornam para `/`; recuperação de senha retorna
para `/?auth_mode=reset`. Depois que o cliente Supabase consome a sessão, o React Router
navega internamente para `/auth?mode=reset`. Assim o callback não depende de abrir
diretamente a rota `/auth`, que ainda retorna 403 sem o rewrite SPA no CloudFront.

Nos templates **Confirm signup** e **Reset password**, use `{{ .ConfirmationURL }}` e não
monte links com `{{ .SiteURL }}` ou um domínio fixo. Em caso de cadastro concluído sem
recebimento do e-mail, verifique primeiro **Authentication → Users** e **Auth Logs**: o
Supabase pode ocultar que um endereço já existe e não reenviar a confirmação. Para um
endereço realmente novo, confira SMTP, destinatários autorizados, rate limits e spam.

O Steam OpenID usa `SUPABASE_URL` para montar uma URL pública HTTPS estável em
`return_to` e `realm`. O nonce continua vinculado ao cookie seguro de curta duração.
Alterar um arquivo em `_shared` não atualiza automaticamente as funções já publicadas;
todas as funções que importam os helpers compartilhados precisam ser republicadas.

Checklist funcional para a publicação futura:

- abrir `/`, `/game/123`, `/u/usuario` e atualizar cada rota diretamente;
- cadastrar com um endereço novo, confirmar pela raiz e entrar com e-mail/senha;
- recuperar senha pela raiz e concluir a navegação interna para `/auth?mode=reset`;
- entrar com Google no domínio oficial;
- validar os retornos de Steam, Xbox e PSN;
- consultar jogos, sincronizar horas e excluir uma conta de teste;
- confirmar que uma origem não cadastrada não recebe `Access-Control-Allow-Origin`;
- verificar no navegador que nenhum segredo privado aparece nos arquivos de `dist/`.

## Fases posteriores

1. Domínio e HTTPS com Route 53 e ACM, se houver domínio próprio.
2. CI/CD com GitHub Actions, sync para S3 e invalidação do CloudFront.
3. Backend serverless com API Gateway, Lambda e CloudWatch.
4. Avaliação da migração de Supabase Auth para Cognito.
5. Avaliação de PostgreSQL para RDS ou Aurora PostgreSQL.
6. Migração de arquivos do Supabase Storage para S3.
7. Avaliação de contêineres somente se algum workload futuro não se adequar ao modelo serverless.
8. Terraform depois que a arquitetura manual estiver compreendida e validada.

Evite nesta fase NAT Gateway, ALB, EC2 permanente, RDS e serviços executados 24 horas.
Além de não serem necessários para o frontend estático, eles podem gerar cobrança mesmo
com pouco ou nenhum tráfego. Ao encerrar um laboratório futuro, remova distribuição,
OAC, policy e bucket somente depois de confirmar que os arquivos não precisam ser
preservados.

Referências oficiais para a aula prática:

- [Restringir o acesso a uma origem S3 com OAC](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [Criar e associar Response Headers Policies](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/creating-response-headers-policies.html)
- [Reescrever URLs com CloudFront Functions](https://aws.amazon.com/blogs/networking-and-content-delivery/implementing-default-directory-indexes-in-amazon-s3-backed-amazon-cloudfront-origins-using-cloudfront-functions/)
- [Cache em camadas para aplicações SPA](https://aws.amazon.com/blogs/networking-and-content-delivery/host-single-page-applications-spa-with-tiered-ttls-on-cloudfront-and-s3/)
