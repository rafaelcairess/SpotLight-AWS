# Plano de migração do backend SpotLight

## Estado encontrado

O frontend ainda consulta diretamente o Supabase para jogos, localizações, perfis, biblioteca,
reviews, reações, listas, amizades, notificações, comentários, alertas de preço, recomendações e
presença. Supabase Auth fornece os JWTs e Storage mantém avatares. Edge Functions executam login
Steam/Xbox/PSN, sincronizações, busca Steam, enriquecimento de jogos, alertas por e-mail e exclusão
de conta.

As entidades reais identificadas no schema tipado são:

- catálogo: `games`, `game_localizations`, `steam_apps`, `daily_featured`;
- usuários: `profiles`, `user_games`, `user_top_games`;
- conteúdo: `reviews`, `review_reactions`, `user_lists`, `user_list_games`;
- social: `follows`, `friend_requests`, `notifications`, `profile_comments`;
- operação: `price_alerts`, `price_history`, `feedback` e limites de funções.

Relacionamentos explícitos nas migrations ligam usuários ao schema `auth.users`, listas aos seus
itens e comentários aos usuários. Há também RLS, triggers e funções PostgreSQL que precisam ser
inventariados antes de qualquer cutover; copiar somente tabelas não preservaria as regras atuais.

## Fase 1 — Preparar API e acesso PostgreSQL — concluída

- **Objetivo:** estabelecer configuração validada, EF Core/Npgsql, health checks e uma primeira
  leitura real sem mudar o frontend.
- **Riscos:** divergência entre o mapeamento EF e o schema mantido pelo Supabase.
- **Rollback:** desativar a connection string; o frontend continua usando Supabase diretamente.
- **Conclusão:** API compila, testes independem do banco e readiness verifica PostgreSQL quando
  configurado.

## Fase 2 — Preparar o catálogo no Aurora DSQL — concluída em protótipo

- **Objetivo:** validar um banco AWS sem senha e com franquia permanente para as leituras públicas.
- **Implementação:** cluster DSQL de região única em `sa-east-1`, schema compatível e cópia
  idempotente de `games`, `game_localizations` e `daily_featured`.
- **Decisão de custo:** `steam_apps` não é replicada; é um índice operacional bruto e não faz parte
  da experiência publicada.
- **Validação:** 3.457 jogos, 24 localizações e 254 destaques copiados; leitura de Dota 2 e readiness
  executados pela API C# local usando IAM.
- **Rollback:** o frontend continua lendo Supabase e o cluster protótipo pode ser removido.

## Fase 3 — Mover leituras públicas do catálogo — concluída localmente

- **Objetivo:** migrar as consultas públicas do catálogo antes das consultas autenticadas.
- **Riscos:** diferenças de filtros, paginação, RLS e desempenho.
- **Rollback:** retornar cada hook ao cliente Supabase por configuração ou reversão isolada.
- **Conclusão:** leituras escolhidas usam somente contratos HTTP documentados e têm métricas
  comparáveis às consultas antigas.
- **Estado:** detalhe, populares, recentes, promoções paginadas, lotes, busca e destaque diário estão
  disponíveis por configuração. Cada consulta retorna ao Supabase em caso de falha; a busca também
  usa o índice amplo legado quando o catálogo DSQL não encontra resultados.
- **Validação:** os endpoints foram executados contra o protótipo DSQL com o papel somente leitura
  `spotlight_api`; o canário permanece apenas local até a homologação visual e remota.

## Fase 4 — Mover escritas e regras de negócio para API

- **Objetivo:** centralizar biblioteca, reviews, listas e regras de autorização.
- **Riscos:** dupla escrita, perda de garantias hoje implementadas por RLS/triggers e concorrência.
- **Rollback:** interromper novas rotas de escrita e reativar o caminho Supabase anterior.
- **Conclusão:** cada escrita é idempotente quando necessário, auditável e coberta por testes.
- **Estado:** inventário concluído em
  [`docs/private-rules-inventory.md`](../docs/private-rules-inventory.md). O DSQL não suporta RLS,
  triggers ou PL/pgSQL; autorização por usuário e efeitos automáticos serão explícitos na API C#,
  enquanto FKs, checks e índices únicos preservarão a integridade no banco.
- **Estado da implementação:** as matrizes de autorização cobrem perfil, biblioteca, reviews,
  comentários, jogos privados/ocultos, autoridade administrativa e transições sociais. O shadow
  schema privado com 18 tabelas e índices separados está versionado, mas não é aplicado por nenhum
  comando padrão ou workflow.
- **Próximo passo:** criar um validador explícito do shadow schema e revisar o modelo de quotas e
  idempotência antes de considerar um ensaio em schema descartável. Nenhum dado privado será
  copiado e nenhum papel de escrita será liberado nessa revisão.

## Fase 5 — Mover Edge Functions para API/Lambda

- **Objetivo:** portar integrações e tarefas assíncronas mantendo contratos e limites atuais.
- **Riscos:** callbacks OAuth, secrets, retries, rate limiting e agendamentos divergirem.
- **Rollback:** manter a função Supabase original ativa até validação paralela do substituto.
- **Conclusão:** cada função substituída possui observabilidade, retries e teste ponta a ponta.

## Fase 6 — Migrar dados privados para DSQL

- **Objetivo:** portar perfis, biblioteca, reviews, listas e social após mover RLS/triggers para C#.
- **Riscos:** autorização incompleta, diferenças de SQL, concorrência OCC e perda de dados.
- **Rollback:** descartar o ensaio e manter Supabase como origem autoritativa.
- **Conclusão:** schema, dados, regras C# e desempenho são validados em ambiente isolado.

## Fase 7 — Fazer cutover do banco

- **Objetivo:** promover o DSQL a banco principal com janela e plano de sincronização definidos.
- **Riscos:** gravações durante a troca, DNS/conectividade e rollback com dados divergentes.
- **Rollback:** interromper escritas, reconciliar dados e restaurar a connection string anterior.
- **Conclusão:** consistência validada, métricas estáveis e período de observação concluído.

## Fase 8 — Migrar Auth para Cognito

- **Objetivo:** trocar a validação e os fluxos de identidade sem acoplar regras de negócio ao
  provedor.
- **Riscos:** vínculo de identidades Steam/social, IDs de usuário e sessões existentes.
- **Rollback:** aceitar novamente apenas o emissor Supabase e preservar o mapeamento de IDs.
- **Conclusão:** login, recuperação, autorização e migração de identidades passam nos testes.

## Fase 9 — Migrar Storage para S3

- **Objetivo:** mover avatares e futuros objetos para S3 com URLs e permissões controladas.
- **Riscos:** objetos ausentes, URLs antigas, exposição pública e cache.
- **Rollback:** manter leitura no Storage antigo enquanto a cópia permanece íntegra.
- **Conclusão:** inventário e checksums conferem e nenhum upload novo depende do Supabase Storage.

## Fase 10 — Remover dependências restantes do Supabase

- **Objetivo:** retirar SDK, configurações, funções e recursos que não são mais utilizados.
- **Riscos:** dependência pouco visível ou tarefa agendada ainda ativa.
- **Rollback:** conservar recursos em modo somente leitura durante uma janela de segurança.
- **Conclusão:** busca no código, tráfego e logs confirmam ausência de uso antes da limpeza final.

## Regras transversais

- Migrar uma capacidade por vez, com contratos e observabilidade antes do tráfego real.
- Nunca usar EF migrations automaticamente contra o banco de produção.
- Preservar IDs de usuário ou manter uma tabela explícita de correspondência entre provedores.
- Tratar RLS, triggers, funções, extensões e jobs como parte do sistema, não apenas o schema SQL.
- Medir conexões e usar pooling/proxy adequado antes de escalar qualquer ambiente de execução.
