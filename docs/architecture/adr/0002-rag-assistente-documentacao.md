# 0002: Assistente de Documentação com RAG (Retrieval-Augmented Generation)

| Campo | Valor |
|---|---|
| **Status** | 🔵 Proposta |
| **Data** | 25/07/2026 |
| **Decisores** | Wesley (mantenedor) |
| **Relacionado a** | `REGRAS_DE_NEGOCIO.md` (futuro RF a ser registrado após implementação), Seção 15 (Governança) |

---

## Contexto

O projeto Casa do Hambúrguer mantém um documento vivo de regras de negócio
(`REGRAS_DE_NEGOCIO.md`) como fonte única de verdade sobre o comportamento do
sistema. Um visitante do portfólio (recrutador, outro dev, o próprio
mantenedor) hoje não tem forma de fazer perguntas em linguagem natural sobre
o funcionamento do projeto (ex.: *"como funciona o fluxo de pedidos?"*) sem
ler o Markdown inteiro.

Queremos um assistente de chat que responda a essas perguntas **com base no
conteúdo real e atualizado da documentação do projeto**, não em conhecimento
genérico do modelo — evitando respostas plausíveis, porém erradas
(alucinação).

## Decision Drivers

- Resposta deve ser **fundamentada** nos documentos do projeto (`README.md`,
  `REGRAS_DE_NEGOCIO.md`), não em suposições do modelo
- Baixo custo operacional — projeto de portfólio, não produto comercial
- Reaproveitar infraestrutura já existente (Postgres/Neon, Express) sempre
  que possível, evitando novos serviços a manter
- Facilidade de manter a base de conhecimento sincronizada com a
  documentação, que já é versionada e muda com frequência
- Demonstrar competência técnica em integração de IA de forma responsável
  (valor de portfólio)

## Opções Consideradas

| Opção | Descrição | Prós | Contras |
|---|---|---|---|
| **A. RAG com pgvector** *(escolhida)* | Embeddings dos documentos armazenados como vetores no próprio Postgres/Neon; busca por similaridade + prompt aumentado para o LLM | Zero infraestrutura nova; reaproveita stack e conhecimento já existentes; barato | Extensão `pgvector` precisa estar habilitada na instância Neon |
| **B. Vector store dedicado (Pinecone/Weaviate/Qdrant)** | Serviço externo especializado em busca vetorial | Mais performático em escala | Infraestrutura extra a manter/pagar, desnecessária para o volume de um único projeto de portfólio |
| **C. Fine-tuning de um modelo** | Treinar/ajustar um modelo com o conteúdo do projeto | — | Caro, lento para iterar, e a documentação muda com frequência — teria que retreinar a cada mudança. Overkill para o problema |
| **D. Busca por palavra-chave simples (sem embeddings)** | Grep/full-text search no Markdown, sem LLM | Muito simples, sem custo de API | Não entende linguagem natural nem sinônimos; não é o que foi pedido (assistente conversacional) |
| **E. Não implementar** | Manter apenas a documentação estática | Sem esforço | Perde o diferencial de portfólio e a utilidade para quem não quer ler o `.md` inteiro |

## Decisão

Adotar **RAG com `pgvector`** (Opção A): os documentos do projeto são
divididos em chunks semânticos (por seção/heading do Markdown), transformados
em embeddings e armazenados como uma tabela adicional no mesmo banco
Postgres/Neon já usado pela aplicação. Na consulta, o texto da pergunta do
usuário é também transformado em embedding, comparado por similaridade de
cosseno contra os chunks armazenados, e os `top-k` trechos mais relevantes
são injetados no prompt enviado ao modelo (Claude API), que responde
**restrito ao contexto fornecido**.

### Arquitetura proposta

```
REGRAS_DE_NEGOCIO.md / README.md
        │
        ▼
  Ingestão (chunking por heading + geração de embeddings)
        │
        ▼
  pgvector (nova tabela no Postgres/Neon existente)
        │
        ▼  (busca por similaridade no momento da pergunta)
  Top-k chunks relevantes
        │
        ▼
  Prompt aumentado → Claude API (system prompt restrito ao contexto)
        │
        ▼
  POST /assistant/chat → resposta ao usuário
```

### Escopo técnico

- **Vector store**: extensão `pgvector` no Postgres/Neon já existente
- **Embeddings**: modelo de embedding de baixo custo (ex.: `text-embedding-3-small`)
- **Chunking**: por seção Markdown (`##`/`###`, IDs como `RF-XX`/`RN-XXX-YY`), com pequeno overlap para preservar contexto
- **Geração de resposta**: Claude API, com *system prompt* instruindo a
  responder **somente** com base nos trechos recuperados e a admitir quando
  não há informação suficiente
- **Rota**: `POST /assistant/chat`, camada própria (controller/service),
  seguindo a arquitetura em camadas já adotada (RNF-15/RNF-16)
- **Reindexação**: script de ingestão (`rag:ingest`) disparado manualmente
  quando a documentação-fonte muda
- **Proteção**: reaproveitar o rate limiter já usado nas rotas de
  autenticação, aplicado a esta rota, para conter custo de API por abuso

## Consequências

**Positivas**
- Nenhuma infraestrutura nova além de uma extensão no banco já existente
- Resposta sempre rastreável a um trecho real da documentação (reduz
  alucinação, o principal risco de um "chatbot solto")
- Reaproveita 100% da arquitetura em camadas e do padrão de rate limiting já
  estabelecidos no projeto
- Boa demonstração de competência para portfólio: RAG é hoje um padrão de
  mercado relevante em aplicações com IA

**Negativas / Custos assumidos**
- Introduz dependência de uma API externa de LLM/embeddings, com custo
  recorrente por uso (ainda que baixo em volume de portfólio)
- Requer processo manual (por ora) de reingestão quando a documentação muda
  — risco de a base ficar desatualizada se o passo for esquecido
- Qualidade da resposta depende diretamente da qualidade do chunking; textos
  mal segmentados geram recuperação de contexto ruim

## Fora de escopo (explicitamente)

- **Fine-tuning** de qualquer modelo — não é necessário para o problema
  (recuperação de contexto, não aprendizado de novo comportamento)
- Suporte a múltiplos idiomas na primeira versão
- Métricas formais de avaliação de qualidade de RAG (ex.: RAGAS) — podem
  entrar em uma iteração futura, não bloqueiam a primeira versão

## Referências

- `REGRAS_DE_NEGOCIO.md` — fonte primária de conteúdo a ser indexado
- ADR-0001 — Rate Limiting Robusto em Rotas de Autenticação (rate limiter a
  ser reaproveitado na rota `/assistant/chat`)
