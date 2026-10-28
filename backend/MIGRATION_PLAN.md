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

## Fase 1 — Preparar API e acesso PostgreSQL

- **Objetivo:** estabelecer configuração validada, EF Core/Npgsql, health checks e uma primeira
  leitura real sem mudar o frontend.
- **Riscos:** divergência entre o mapeamento EF e o schema mantido pelo Supabase.
- **Rollback:** desativar a connection string; o frontend continua usando Supabase diretamente.
- **Conclusão:** API compila, testes independem do banco e readiness verifica PostgreSQL quando
  configurado.

## Fase 2 — Mover leituras do frontend para API

- **Objetivo:** migrar consultas públicas e depois consultas autenticadas, começando pelo catálogo.
- **Riscos:** diferenças de filtros, paginação, RLS e desempenho.
- **Rollback:** retornar cada hook ao cliente Supabase por configuração ou reversão isolada.
- **Conclusão:** leituras escolhidas usam somente contratos HTTP documentados e têm métricas
  comparáveis às consultas antigas.

## Fase 3 — Mover escritas e regras de negócio para API

- **Objetivo:** centralizar biblioteca, reviews, listas e regras de autorização.
- **Riscos:** dupla escrita, perda de garantias hoje implementadas por RLS/triggers e concorrência.
- **Rollback:** interromper novas rotas de escrita e reativar o caminho Supabase anterior.
- **Conclusão:** cada escrita é idempotente quando necessário, auditável e coberta por testes.

## Fase 4 — Mover Edge Functions para API/Lambda

- **Objetivo:** portar integrações e tarefas assíncronas mantendo contratos e limites atuais.
- **Riscos:** callbacks OAuth, secrets, retries, rate limiting e agendamentos divergirem.
- **Rollback:** manter a função Supabase original ativa até validação paralela do substituto.
- **Conclusão:** cada função substituída possui observabilidade, retries e teste ponta a ponta.

## Fase 5 — Criar RDS PostgreSQL e migrar dados

- **Objetivo:** provisionar o banco alvo e executar ensaios de cópia completos.
- **Riscos:** custo, extensões incompatíveis, downtime e perda de dados.
- **Rollback:** descartar o ensaio e manter Supabase PostgreSQL como origem autoritativa.
- **Conclusão:** schema, dados, funções necessárias e desempenho são validados em ambiente isolado.

## Fase 6 — Fazer cutover do PostgreSQL

- **Objetivo:** promover o RDS a banco principal com janela e plano de sincronização definidos.
- **Riscos:** gravações durante a troca, DNS/conectividade e rollback com dados divergentes.
- **Rollback:** interromper escritas, reconciliar dados e restaurar a connection string anterior.
- **Conclusão:** consistência validada, métricas estáveis e período de observação concluído.

## Fase 7 — Migrar Auth para Cognito

- **Objetivo:** trocar a validação e os fluxos de identidade sem acoplar regras de negócio ao
  provedor.
- **Riscos:** vínculo de identidades Steam/social, IDs de usuário e sessões existentes.
- **Rollback:** aceitar novamente apenas o emissor Supabase e preservar o mapeamento de IDs.
- **Conclusão:** login, recuperação, autorização e migração de identidades passam nos testes.

## Fase 8 — Migrar Storage para S3

- **Objetivo:** mover avatares e futuros objetos para S3 com URLs e permissões controladas.
- **Riscos:** objetos ausentes, URLs antigas, exposição pública e cache.
- **Rollback:** manter leitura no Storage antigo enquanto a cópia permanece íntegra.
- **Conclusão:** inventário e checksums conferem e nenhum upload novo depende do Supabase Storage.

## Fase 9 — Remover dependências restantes do Supabase

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
