# Migração progressiva do SpotLight para AWS

## Objetivo e estado atual

O SpotLight original continua publicado na Vercel e conectado ao projeto Supabase
existente. Este repositório preserva o histórico da aplicação e prepara uma migração
por camadas, sem interromper a demonstração estável.

```text
Versão estável                 Fase 1 preparada neste repositório

Usuário                       Usuário
  ↓                             ↓
Vercel                        CloudFront (a criar)
  ↓                             ↓
React/Vite                    S3 privado (a criar)
  ↓                             ↓
Supabase                      React/Vite
                                ↓
                              Supabase atual
```

Nenhum recurso AWS e nenhuma Edge Function foram implantados nesta fase. O backend
ASP.NET Core e seu Dockerfile permanecem no código para etapas futuras, mas Docker não
é necessário para servir os arquivos estáticos produzidos pelo Vite.

## Build estático

Use Node.js 20 e configure as variáveis públicas em `.env.local`, que não deve ser
versionado:

```dotenv
VITE_SITE_URL=http://localhost:8080
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
substitua `VITE_SITE_URL` pelo domínio fornecido pelo CloudFront e gere o build novamente.

## Próxima aula: S3 e CloudFront

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
8. Enviar o conteúdo de `dist/` ao bucket e testar primeiro pelo domínio CloudFront.

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

O código das Edge Functions aceita uma lista exata e configurável de origens. Quando o
domínio CloudFront existir, configure no Supabase sem remover a origem da Vercel:

```dotenv
PUBLIC_SITE_URL=https://spot-light-xi.vercel.app
ALLOWED_SITE_ORIGINS=https://spot-light-xi.vercel.app,https://SEU_DOMINIO.cloudfront.net
```

Também inclua o domínio CloudFront em **Authentication → URL Configuration → Redirect
URLs**. `PUBLIC_SITE_URL` continua sendo o fallback principal; `ALLOWED_SITE_ORIGINS`
permite que login Steam, Xbox, PSN e chamadas CORS retornem para qualquer um dos dois
frontends. As funções só devem ser implantadas depois dessa configuração e de uma revisão
do diff.

Checklist funcional para a publicação futura:

- abrir `/`, `/game/123`, `/u/usuario` e atualizar cada rota diretamente;
- entrar com e-mail/senha e Google;
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
7. Docker, ECR e ECS/Fargate somente para workloads de backend que justifiquem containers.
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
