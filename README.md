<div align="center">

# SpotLight

### Sua biblioteca, suas conquistas e sua história gamer em um só perfil.

O SpotLight importa a biblioteca da Steam, reúne jogos de diferentes plataformas
e transforma esses dados em um perfil público feito para descobrir, organizar e compartilhar.

<p>
  <a href="https://spotlight.rafaelcpires.abrdns.com"><img alt="SpotLight online" src="https://img.shields.io/badge/PROJETO-ONLINE-22c55e?style=for-the-badge&logo=amazonwebservices&logoColor=white"></a>
  <a href="https://github.com/rafaelcairess/SpotLight-AWS/actions/workflows/ci.yml"><img alt="Status da CI" src="https://img.shields.io/github/actions/workflow/status/rafaelcairess/SpotLight-AWS/ci.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&label=CI"></a>
  <a href="https://github.com/rafaelcairess/SpotLight-AWS/commits/main"><img alt="Último commit" src="https://img.shields.io/github/last-commit/rafaelcairess/SpotLight-AWS?style=for-the-badge&logo=github&label=LAST%20COMMIT"></a>
</p>

<p>
  <img alt="React 18" src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black">
  <img alt="TypeScript 5" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="Vite 7" src="https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white">
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=flat-square&logo=supabase&logoColor=white">
  <img alt="AWS" src="https://img.shields.io/badge/AWS-S3_%2B_CloudFront-FF9900?style=flat-square&logo=amazonwebservices&logoColor=white">
</p>

[**Acessar o SpotLight**](https://spotlight.rafaelcpires.abrdns.com) ·
[Ver funcionalidades](#principais-funcionalidades) ·
[Conhecer a arquitetura](#arquitetura) ·
[Explorar a documentação](#documentação)

<br>

<a href="https://spotlight.rafaelcpires.abrdns.com">
  <img src="docs/screenshots/explorar.webp" alt="Página Explorar do SpotLight com jogos em destaque, coleções e rankings" width="100%">
</a>

</div>

## O problema que o SpotLight resolve

Steam, Xbox e PlayStation guardam partes diferentes da nossa vida nos games. Para lembrar o que jogamos, quanto tempo investimos ou quais títulos completamos, normalmente precisamos consultar vários perfis.

O **SpotLight** reúne essa história em um só lugar. Além da biblioteca pessoal, a aplicação oferece perfis públicos, busca, rankings, promoções, reviews e recomendações para ajudar cada usuário a encontrar o próximo jogo.

> [!NOTE]
> A sincronização automática da Steam está disponível. Jogos e conquistas de Xbox e PlayStation podem ser cadastrados manualmente enquanto as integrações oficiais continuam em desenvolvimento.

## Principais funcionalidades

<table>
  <tr>
    <td width="33%" valign="top">
      <strong>Biblioteca unificada</strong><br>
      Jogos, horas, status, favoritos, plataformas e títulos concluídos em uma única coleção.
    </td>
    <td width="33%" valign="top">
      <strong>Perfil público</strong><br>
      Avatar, bio, jogo favorito, vitrines e biblioteca em uma página compartilhável.
    </td>
    <td width="33%" valign="top">
      <strong>Descoberta</strong><br>
      Busca, coleções, promoções, rankings e dados atualizados da Steam.
    </td>
  </tr>
  <tr>
    <td width="33%" valign="top">
      <strong>Comunidade</strong><br>
      Amigos, comentários, reviews e listas públicas.
    </td>
    <td width="33%" valign="top">
      <strong>Personalização</strong><br>
      Privacidade por perfil e jogo, horas manuais e identificação de plataforma.
    </td>
    <td width="33%" valign="top">
      <strong>Alertas e idiomas</strong><br>
      Avisos de preço e interface em português, inglês e espanhol.
    </td>
  </tr>
</table>

## Produto em funcionamento

<table>
  <tr>
    <td width="50%" valign="top">
      <a href="https://spotlight.rafaelcpires.abrdns.com/u/aeb"><img src="docs/screenshots/perfil-publico.webp" alt="Perfil público do SpotLight" width="100%"></a>
      <p align="center"><strong>Perfil gamer compartilhável</strong></p>
    </td>
    <td width="50%" valign="top">
      <a href="https://spotlight.rafaelcpires.abrdns.com/top"><img src="docs/screenshots/top-games.webp" alt="Ranking Top Games do SpotLight" width="100%"></a>
      <p align="center"><strong>Rankings da comunidade</strong></p>
    </td>
  </tr>
  <tr>
    <td colspan="2" valign="top">
      <img src="docs/screenshots/mais-jogados.webp" alt="Jogos mais jogados no SpotLight" width="100%">
      <p align="center"><strong>Descoberta baseada em dados da Steam</strong></p>
    </td>
  </tr>
</table>

## Arquitetura

```text
Usuário
   │
   ▼
React + TypeScript
   │
   ├── build estático ──────────────► Amazon S3 + CloudFront
   │
   ├── Supabase Auth
   ├── PostgreSQL + Row Level Security
   ├── Storage
   └── Edge Functions (Deno)
              │
              └── Steam Web API e serviços externos
```

O frontend é organizado por domínios de negócio. Hooks reutilizáveis concentram o acesso a dados, enquanto o TanStack Query coordena cache, mutations e invalidações. Operações que dependem de segredos são executadas em Edge Functions, nunca no navegador.

| Camada | Tecnologias | Decisão principal |
| --- | --- | --- |
| Frontend | React 18, TypeScript, Vite e React Router | SPA tipada com build estático |
| Interface | Tailwind CSS, shadcn/ui e Radix UI | Componentes consistentes e acessíveis |
| Dados | TanStack Query, Supabase e PostgreSQL | Cache no cliente e segurança por RLS |
| Backend atual | Edge Functions com Deno | Segredos e integrações fora do navegador |
| Qualidade | Vitest, ESLint, Prettier e TypeScript | Validação automática em cada mudança |
| Entrega | Amazon S3, CloudFront, ACM e GitHub Actions | Deploy estático com CDN e domínio HTTPS |

Uma API em **ASP.NET Core 8** está sendo desenvolvida como base para uma migração gradual do backend. Ela possui health check, autenticação JWT/JWKS e testes automatizados, mas ainda não faz parte do ambiente de produção.

## Segurança e qualidade

- **Row Level Security:** políticas do PostgreSQL isolam os dados de cada usuário.
- **Segredos no servidor:** tokens administrativos e chaves de integração ficam fora do bundle.
- **Autenticação protegida:** nonce, cookies HttpOnly e validação explícita de redirects.
- **Rate limiting:** operações sensíveis possuem limites persistentes.
- **CI:** formatação, lint, tipos, testes, build e dependências são verificados automaticamente.

Consulte a [política de segurança](./SECURITY.md) para conhecer as versões suportadas e o processo de reporte responsável.

## Executar localmente

<details>
<summary><strong>Configuração para desenvolvimento</strong></summary>

<br>

```bash
git clone https://github.com/rafaelcairess/SpotLight-AWS.git
cd SpotLight-AWS
npm install
npm run dev
```

Use `.env.example` como referência para a configuração local. Antes de enviar alterações, execute:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

</details>

## Documentação

- [Arquitetura e organização do código](./docs/ARCHITECTURE.md)
- [Plano de migração para AWS](./docs/aws-migration.md)
- [API ASP.NET Core](./backend/README.md)
- [Guia de contribuição](./CONTRIBUTING.md)
- [Política de segurança](./SECURITY.md)

## Autor

Desenvolvido por **[Rafael Caires Pires](https://github.com/rafaelcairess)**.

[LinkedIn](https://www.linkedin.com/in/rafael-caires-pires-58225b238) ·
[Projeto online](https://spotlight.rafaelcpires.abrdns.com) ·
[Issues](https://github.com/rafaelcairess/SpotLight-AWS/issues)

<div align="center">

Se o SpotLight chamou sua atenção, deixe uma ⭐.

</div>
