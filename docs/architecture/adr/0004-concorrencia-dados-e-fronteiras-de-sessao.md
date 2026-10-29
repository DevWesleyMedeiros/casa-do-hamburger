# ADR-0004 — Concorrência, identidade e dados privados

Data: 28/10/2026. Status: implementado no código; validação em PostgreSQL descartável pendente.

Referências: RF-04/05/06/09/32–40/53/54/56/57, RN-AUTH-07/11/13–16,
RN-CART-02/04/06, RN-ORDER-01/04/05/06, RNF-10/14/20, RN-SEC-02.

## Decisões implementadas

- Operações do carrinho, checkout e recuperação de senha adquirem um `SELECT ... FOR UPDATE`
  parametrizado na linha de `User`, dentro de uma transação. Esse ponto de serialização
  existe mesmo quando não há itens/tokens. Após esperar pelo lock, as operações releem
  o estado sob `ReadCommitted`. Não há chamada de rede nem bcrypt dentro do lock.
- A emissão de token invalida os anteriores e cria o novo na mesma transação. O consumo
  usa atualização condicional (`usedAt IS NULL`, expiração futura); senha e consumo fazem
  commit ou rollback juntos. Duas emissões concorrentes deixam somente a última ativa.
  E-mails podem chegar fora de ordem: só o último token persistido continua utilizável.
- O checkout lê o carrinho somente após o lock, cria snapshots/pagamento e limpa o
  carrinho na mesma transação. Toda escrita do carrinho passa pelo mesmo lock. Uma
  adição que ocorre depois do checkout permanece para o pedido seguinte. Dois checkouts
  sem nova adição intermediária geram um pedido. Não se introduz chave de idempotência
  para carrinhos distintos; um novo carrinho entre requisições pode gerar outro pedido.
- A escrita de status compara o estado esperado, validado pela máquina de estados,
  ao estado persistido. Conflito retorna 409, sem sobrescrever a operação vencedora;
  transição inválida já observada continua retornando 422. Só a vencedora notifica.
- O backend verifica a existência, `deletedAt` e o `admin` atual em cada requisição
  autenticada. O privilégio contido no JWT não é autoridade. JWTs continuam em cookie
  httpOnly, com a duração existente de sete dias. Revogação após reset exige a proposta
  separada da ADR-0005, ainda sem implementação.
- O login Google exige Firebase `sign_in_provider=google.com` e e-mail verificado.
  O vínculo existente de `firebaseUid` nunca é substituído por outro UID. Uma conta
  criada pelo Google continua `GOOGLE/password=null`. Uma conta LOCAL associada ao
  Google mantém `LOCAL/password` e passa a admitir ambos os métodos; isso preserva
  RF-53 e evita retirar a recuperação local do titular. Corrige o código anterior que
  trocava `provider` para GOOGLE mantendo um hash local residual. Dados legados não
  são convertidos automaticamente nesta tarefa. Avatar próprio continua prioritário.
- O cache privado tem prefixo comum e separação por usuário e geração de sessão;
  pedidos incluem também o privilégio no identificador. Logout, login e expiração
  cancelam requisições antigas e removem caches privados. Respostas de outra geração
  são rejeitadas antes de atualizar a interface. Rollback otimista confere a geração.
  Falha de logout não apresenta sucesso nem navega como se o cookie tivesse sido removido.

## Limites

O lock exige participação de todos os escritores. SQL direto, scripts administrativos
e novas implementações que o ignorem precisam de revisão. Há custo de uma leitura de
usuário por requisição; não foi acrescentado cache de autorização. Operações do mesmo
usuário esperam umas pelas outras e podem atingir o timeout da transação sob carga.

Testes de concorrência/rollback reais foram preparados em `securityConcurrency.test.ts`.
Mocks e inspeção de código não comprovam o comportamento do PostgreSQL. Consulte o
relatório em `docs/security-audit/correcoes-seguranca-2026-10-28.md` para evidências,
resultados executados e pré-requisitos do mantenedor.

## Fontes técnicas

- [PostgreSQL: bloqueios de linha](https://www.postgresql.org/docs/current/explicit-locking.html)
- [TanStack Query: cancelamento](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)
- [OWASP: proteção CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
