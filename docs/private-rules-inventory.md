# Inventário de regras privadas

Estado reconstruído a partir das migrations, hooks e Edge Functions em 29/10/2026. Este documento
é uma especificação de migração: ele não autoriza copiar dados privados nem habilitar escritas no
Aurora DSQL.

## Conclusão arquitetural

As regras atuais não estão somente no frontend. Elas são aplicadas por uma combinação de:

- JWT e usuários do Supabase Auth;
- políticas RLS por linha e grants por coluna;
- funções e triggers PostgreSQL;
- constraints e índices únicos;
- Edge Functions com `service_role`;
- validações de apresentação no React.

O Aurora DSQL é adequado para o catálogo e pode guardar os dados privados, mas não executa o
modelo de segurança atual sem mudanças. A documentação vigente da AWS informa que o DSQL ainda
[não suporta RLS](https://docs.aws.amazon.com/aurora-dsql/latest/userguide/create-view.html),
[não suporta triggers e PL/pgSQL](https://docs.aws.amazon.com/aurora-dsql/latest/userguide/working-with-postgresql-compatibility-migration-guide.html).
Chaves estrangeiras já são suportadas e devem ser usadas para integridade referencial.

Consequências obrigatórias:

1. O navegador nunca receberá credenciais de banco nem acesso direto às tabelas privadas.
2. Toda leitura e escrita privada passará pela API C#.
3. O identificador do ator virá exclusivamente do JWT validado por `ICurrentUser`; IDs enviados no
   corpo ou na URL são apenas alvos, nunca prova de identidade.
4. A API terá um papel IAM/SQL próprio, sem DDL e sem permissão para alterar o catálogo público.
5. Regras hoje executadas por triggers virarão serviços transacionais explícitos e testados.
6. Constraints, índices únicos e FKs permanecerão no DSQL como segunda barreira.
7. Conflitos OCC exigirão retry da transação completa, com operações idempotentes.

## Fontes de identidade e autoridade

| Fonte atual               | Regra efetiva                            | Destino durante a transição                                                          |
| ------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------ |
| Supabase Auth `sub`       | UUID imutável do usuário                 | Continuará aceito pela API C# antes da migração para Cognito                         |
| JWT `role=authenticated`  | Sessão autenticada                       | Política `AuthenticatedUser` já implementada na API                                  |
| `app_metadata.role=admin` | Autoridade administrativa protegida      | Deve ganhar claim/política C# própria; nunca ler `profiles.is_admin` como autoridade |
| `user_metadata`           | Dados controláveis pelo usuário          | Nunca usar para autorização                                                          |
| OAuth Steam/Xbox/PSN      | Vincula identidade e dados de plataforma | Somente callbacks/serviços privilegiados podem alterar IDs e fatos importados        |

O schema privado no DSQL precisará de uma tabela de principais locais, usando o UUID atual como
chave. Ela substituirá as FKs para `auth.users`, que existe somente no Supabase, e preservará os IDs
para uma futura troca de emissor.

## Matriz de dados e regras

### Perfil e presença

| Recurso    | Leitura                                                      | Escrita e invariantes                                         | Efeitos/limites                                                            |
| ---------- | ------------------------------------------------------------ | ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `profiles` | próprio; público; amigos quando `profile_visibility=friends` | próprio edita somente campos permitidos; conteúdo normalizado | `is_admin` e identidades de plataforma são do servidor                     |
| presença   | segue a visibilidade do perfil                               | próprio altera status e heartbeat                             | `invisible` sempre aparece offline; heartbeat expira em três minutos       |
| avatar     | URL pública sem permitir enumeração do bucket                | arquivo no caminho do dono, extensão e MIME seguros           | exclusão de conta remove os objetos explicitamente                         |
| progresso  | calculado apenas sobre linhas visíveis ao solicitante        | sem escrita direta                                            | agrega biblioteca, concluídos, platinas, reviews, amigos e até 2.000 horas |

Username é normalizado para minúsculas e aceita 3–20 caracteres `[a-z0-9_]`; nome de exibição tem
até 50 caracteres e bio até 300. Avatar alterado pelo usuário deve apontar para sua pasta no bucket
ou para um host Steam autorizado.

### Biblioteca e vitrines

| Recurso             | Leitura                                      | Escrita e invariantes                         | Efeitos/limites                                      |
| ------------------- | -------------------------------------------- | --------------------------------------------- | ---------------------------------------------------- |
| `user_games`        | dono; terceiros conforme perfil e biblioteca | dono altera status e campos manuais           | fatos importados, origem e atividade são do servidor |
| `user_top_games`    | vitrine conforme visibilidade do perfil      | somente dono mantém seleção e ordem           | jogo privado não aparece a terceiros                 |
| favorito e platinas | derivados de perfil + biblioteca             | favorito precisa existir na biblioteca        | alterações invalidam vitrines e progresso            |
| atividade recente   | segue visibilidade da biblioteca             | timestamps de plataforma são fatos importados | horas e datas importadas nunca vêm do navegador      |

Jogos `is_private` não podem aparecer a terceiros. `is_hidden` é uma preferência adicional da
experiência e precisa continuar filtrado nas telas públicas.

### Conteúdo e coleções

| Recurso            | Leitura                                                   | Escrita e invariantes                                          | Efeitos/limites                                              |
| ------------------ | --------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------ |
| `reviews`          | próprio; terceiros conforme perfil e `reviews_visibility` | autor cria, edita e exclui; autor/jogo/data imutáveis          | conteúdo 1–1.000; nota 0–5; 1/min, 20/dia; edição 30/min     |
| `review_reactions` | somente se a review também for visível                    | dono cria/altera/remove; autor/review/data imutáveis           | 60 criações/min e enum de reação                             |
| `user_lists`       | dono ou lista pública                                     | dono cria/edita/remove; nome 1–60; descrição até 200           | máximo 100 listas; criação 30/h                              |
| `user_list_games`  | segue lista e privacidade do jogo                         | somente dono; `app_id > 0`; nota até 500                       | máximo 1.000/lista; 120 adições/min; par único               |
| `profile_comments` | segue visibilidade do perfil                              | público/amigos/desabilitado; autor edita; autor ou dono remove | não comentar no próprio perfil; 2/min, 50/dia; edição 30/min |

Uma review de jogo privado não aparece a terceiros, e suas reações também não. O mesmo jogo deve
ser removido da projeção de listas públicas.

> [!WARNING]
> A política SQL atual de inserção de comentário verifica `comments_permission`, mas não repete
> `profile_visibility`. A UI normalmente impede chegar a um perfil invisível, porém uma chamada
> direta que conheça o UUID ainda pode tentar comentar. A política C# fecha essa lacuna exigindo as
> duas condições. De modo semelhante, `is_hidden` é filtro de UI/hook e não uma política restritiva
> no banco; a API o trata como invisível nas projeções normais e só o retorna ao dono por endpoint
> explícito.

### Grafo social e notificações

| Recurso           | Leitura                       | Escrita e invariantes                                   | Efeitos/limites                                      |
| ----------------- | ----------------------------- | ------------------------------------------------------- | ---------------------------------------------------- |
| `follows`         | somente os dois participantes | seguidor cria/remove; sem autorreferência               | 30/min e 500/dia; par único                          |
| `friend_requests` | somente os dois participantes | remetente cria `pending`; destinatário aceita ou recusa | 10/min e 100/dia; um pedido ativo por par            |
| `notifications`   | somente destinatário          | cliente altera apenas `read_at` ou remove; não cria     | pedido e aceite geram notificação na mesma transação |

A amizade é uma máquina de estados. O cliente não escolhe o estado inicial, timestamps, remetente
ou destinatário de uma atualização.

### Operação e tarefas privilegiadas

| Recurso              | Regra atual                                             | Requisito para C# / AWS                                      |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------ |
| `price_alerts`       | dono lista, cria/reativa e desativa; usuário/jogo único | endpoints autenticados e worker de preço/e-mail separado     |
| `feedback`           | autenticado envia; dono e admin leem                    | mensagem 1–4.000; 5/h e 20/dia; admin vem de claim protegida |
| exclusão de conta    | próprio ou admin; limpa banco, avatar e Auth            | saga privilegiada, auditável e idempotente                   |
| OAuth Steam/Xbox/PSN | callbacks vinculam identidades e importam fatos         | segredos somente no servidor; estado e redirect validados    |
| sincronizações       | service role ou usuário validado conforme operação      | separar comandos do usuário de jobs internos                 |
| enriquecimento Steam | autenticado e limitado                                  | operação idempotente; catálogo separado de dados privados    |

## Regras que não podem ser perdidas

Estas condições bloqueiam qualquer cutover:

- perfil privado não pode ser descoberto por busca, review, lista, favorito, platina ou comentário;
- jogo privado não pode vazar por review, reação, lista pública ou Top Games;
- dono, autor, relações e timestamps imutáveis não vêm do payload;
- `is_admin`, IDs/tokens de plataforma, horas importadas e origem são campos do servidor;
- amizade possui transições válidas; follow e amizade não aceitam autorreferência;
- notificações sociais são atômicas com a ação que as originou;
- quotas são persistentes e não dependem de `localStorage`;
- exclusão de conta inclui objetos e Auth, não apenas linhas do banco;
- troca de conta no mesmo navegador limpa todo cache privado.

## Desenho C# proposto

Não criar um repositório CRUD genérico para dados privados. Cada caso de uso deve carregar o ator e
expressar a política no nome e na assinatura:

```text
HTTP Controller
  → CurrentUser (sub e claims já validados)
  → Policy/Use Case (owner, friend, visibility, admin)
  → Repository com filtro obrigatório de ator/alvo
  → transação DSQL + constraints
  → resposta sem campos internos ou segredos
```

Separações mínimas:

- `ProfileVisibilityPolicy`: perfil, biblioteca, reviews, comentários e vitrines;
- `LibraryService`: campos manuais versus fatos de plataforma;
- `ReviewService` e `ListService`: validação, propriedade e quotas;
- `SocialGraphService`: follows, máquina de amizade e notificações atômicas;
- `RateLimitService`: janela persistente e chave por usuário/ação;
- `AccountDeletionService`: saga privilegiada e idempotente;
- `PlatformIntegrationService`: OAuth, tokens e sincronizações fora dos controllers comuns.

Endpoints públicos usarão DTOs de projeção. `ProfileResponse` não deve expor `is_admin`, tokens,
e-mail ou campos de sincronização que não façam parte da tela.

## Ordem segura de migração

### Etapa A — Contratos e testes de política

1. Criar testes matriciais para anônimo, dono, amigo, terceiro autenticado e admin.
2. Cobrir perfil público/amigos/privado e jogos normal/oculto/privado.
3. Formalizar transições e erros estáveis antes de criar endpoints.

### Etapa B — Shadow schema privado

1. Criar tabela local de principais e tabelas privadas com FKs, checks e índices únicos.
2. Criar papel runtime separado do `spotlight_api`, com escrita apenas no schema privado.
3. Copiar dados para shadow sem tráfego, reconciliando contagens e referências.
4. Não copiar tokens de plataforma sem criptografia e rotação definidas.

### Etapa C — Leituras privadas em canário

1. Migrar perfil próprio e projeção pública de perfil.
2. Migrar biblioteca e vitrines respeitando a mesma política de visibilidade.
3. Migrar reviews/listas públicas somente depois dos testes de não vazamento.
4. Manter fallback somente para leituras; nunca executar escrita dupla silenciosa.

### Etapa D — Escritas de menor acoplamento

1. Perfil editável e preferências.
2. Biblioteca manual e listas.
3. Reviews, reações e comentários com quotas persistentes.

### Etapa E — Social e integrações

1. Follows, amizade e notificações atômicas.
2. Alertas e workers.
3. OAuth, sincronizações e exclusão de conta.

Auth migra para Cognito e avatares para S3 somente depois da estabilização dos dados e casos de uso.

## Critérios para iniciar implementação

- testes de política aprovados antes do primeiro endpoint privado;
- schema DSQL privado revisado sem dependência de RLS, trigger ou PL/pgSQL;
- papel IAM/SQL de escrita com privilégio mínimo e sem DDL;
- logs de auditoria sem conteúdo sensível;
- estratégia de idempotência e retry para cada transação com efeitos;
- plano de rollback por capacidade, sem escrita dupla implícita;
- nenhuma mudança de produção antes da revisão local.
