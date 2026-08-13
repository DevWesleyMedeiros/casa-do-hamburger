# Descrição

<!-- O que este PR muda e por quê. Se for refactor estrutural, deixe claro que não altera regra de negócio. -->

## Tipo de mudança

- [ ] Feature (nova regra de negócio)
- [ ] Fix (correção de comportamento)
- [ ] Refactor (estrutura/arquitetura, sem mudar regra de negócio)
- [ ] Docs (só documentação)
- [ ] Chore (config, dependências, nomenclatura)

## Regras de negócio referenciadas
<!-- RF-XX, RN-XXX-XX, RNF-XX impactados. Se nenhum, justifique por quê. -->

## Checklist

- [ ] `docs/architecture/REGRAS_DE_NEGOCIO.md` foi atualizado (selo 🟡/🔵 → 🟢, ou nova regra registrada) — se não se aplica, marque mesmo assim justificando na descrição
- [ ] Se mudou uma decisão arquitetural relevante, foi criado um ADR em `docs/architecture/adr/`
- [ ] Testes (unit e/ou integração) cobrindo a mudança foram adicionados/atualizados
- [ ] Nenhuma regra 🟢 existente foi quebrada
- [ ] Rodei o agente de code review (`.claude/agents`) e tratei os apontamentos antes de pedir revisão humana
- [ ] Lint e build passam sem warning novo

## Como testar
<!-- Passos manuais, se aplicável — ex.: "logar como ADMIN, criar produto com imagem inválida, confirmar 400" -->