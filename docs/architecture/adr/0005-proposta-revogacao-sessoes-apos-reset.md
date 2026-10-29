# ADR-0005 — Proposta: revogar sessões após redefinição de senha

Data: 28/10/2026. Status: **proposta para decisão do mantenedor; não implementada**.

Referências: RF-04/09/55, RN-AUTH-02/07/14, RN-DTO-06.

## Problema comprovado e limite desta entrega

O JWT atual dura sete dias e não contém uma versão de sessão. Redefinir a senha não
invalida cookies já emitidos. `User.updatedAt` não é substituto: também muda ao editar
avatar/perfil. Invalidar por esse campo criaria uma política não autorizada e imprecisa.

O código desta entrega já rejeita usuários inexistentes/desativados e consulta o
privilégio atual. A revogação de sessões anteriores ao reset permanece pendente.
O requisito de expiração curta de RN-AUTH-02 também diverge dos sete dias atuais;
qualquer alteração de duração precisa ser decidida explicitamente, sem refresh token
automático nesta tarefa.

## Proposta exata, sem aplicação operacional

1. Em `back-end/prisma/schema.prisma`, adicionar a `User`:

   ```prisma
   sessionVersion Int @default(0)
   ```

2. Gerar/revisar uma migration versionada contendo:

   ```sql
   ALTER TABLE "User" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
   ```

   A pasta definitiva da migration será gerada pelo mantenedor. Não foi criada nem
   executada uma migration nesta tarefa. Rever lock/tempo de aplicação e estratégia
   de deploy conforme a versão efetiva do PostgreSQL e o volume de dados.

3. Em `dtos/toJwtPayloadDTO.ts`, incluir `sessionVersion` no DTO de sessão e na
   entrada do mapper. Não incluir no perfil HTTP. Login local e Google assinam a
   versão lida junto da identidade que acabou de ser autenticada.
4. Em `repositories/passwordResetToken.repository.ts`, incrementar
   `sessionVersion: { increment: 1 }` na mesma atualização de `User.password`, dentro
   da transação que consome o token.
5. Em `repositories/user.repository.ts`, selecionar a versão em `findSessionUser`.
   Em `middlewares/authMiddlewares.ts`, exigir uma claim inteira não negativa e
   igualdade com a versão atual. Ausência/divergência retorna 401. Tokens emitidos
   antes da implantação serão recusados, exigindo novo login em todos os dispositivos.
6. Testar: sessão anterior ao reset é recusada, login com senha nova funciona, sessão
   de outro usuário permanece válida, alteração de avatar não revoga sessão, reset
   com rollback não muda versão, login concorrente ao reset não recupera validade
   usando credenciais antigas e claims antigas/ausentes são rejeitadas.

## Decisões e operação do mantenedor

- Aprovar a política de revogação global no reset e o novo login obrigatório no rollout.
- Definir separadamente a duração de JWT, reconciliando RN-AUTH-02. Manter sete dias
  pode ser decisão consciente, mas não deve ser apresentado como expiração curta.
- Gerar Prisma Client, revisar/aplicar migration somente no ambiente autorizado e
  coordenar a publicação do backend. Clientes antigos devem tratar 401 como sessão expirada.
- Decidir eventual revogação global no logout, alteração de senha fora do reset ou
  mudança de privilégio; não estão implicitamente implementadas pela proposta acima.

Não há necessidade demonstrada de refresh tokens, Redis, RLS ou multi-tenancy para
esta correção.
