# 🍔 Casa do Hamburguer

> Projeto fullstack de e-commerce para hamburgueria com autenticação multi-provedor, catálogo dinâmico, carrinho de compras, gestão de pedidos, sistema de recuperação de senha e upload de imagens escalável. Aplicação construída com arquitetura de camadas, validação em múltiplas camadas, segurança OWASP e testes automatizados.

---

## 📌 Sobre o projeto

O Casa do Hamburguer é uma aplicação fullstack moderna que simula um ecossistema completo de hamburgueria online. Desenvolvida com foco em boas práticas de mercado, cobre desde a interface do usuário até a persistência de dados, implementando fluxos reais de e-commerce com segurança, performance e escalabilidade.

### Status atual — **Versão 2.0**

✅ **Autenticação e autorização** completa com múltiplos provedores
✅ **Login social** com Google + Firebase integration
✅ **Recuperação de senha** com envio de email via Resend
✅ **Verificação de email** para novas contas
✅ **Rate limiting** e proteção contra força bruta
✅ Upload de imagens com validação de magic bytes e Cloudinary
✅ Carrinho atrelado ao usuário (persistido no banco)
✅ Sistema completo de pedidos com OrderItems e snapshots
✅ Backend com camadas bem definidas (Controller → Service → Repository)
✅ Testes de integração implementados com Vitest + Supertest
✅ TypeScript em todo o projeto com type-safety
✅ CI-ready com linting, testes e build automatizáveis

---

## ✨ Funcionalidades implementadas

### 🔐 Autenticação e autorização

- ✅ Cadastro local com validação de força de senha
- ✅ Login com Google (OAuth 2.0) + Firebase Admin
- ✅ Autenticação JWT com cookie httpOnly, secure e SameSite
- ✅ Middleware de autenticação e role-based access (admin)
- ✅ Rate limiting em rotas sensíveis (login, cadastro, reset)
- ✅ Recuperação de senha com token único e expiração (30min)
- ✅ Verificação de email para novas contas
- ✅ Logout seguro com limpeza de cookies
- ✅ Persistência de provedor (LOCAL/GOOGLE) por usuário

### 🍔 Catálogo e produtos

- ✅ Listagem de produtos com cache React Query
- ✅ Filtro por categorias: Hamburgueres, Bebidas, Porções
- ✅ Upload múltiplo de imagens com validação server-side
- ✅ Integração Cloudinary com URLs assinadas
- ✅ Entidade `ProductsImage` para metadados de imagens
- ✅ CRUD completo de produtos (apenas admins)
- ✅ Imagem principal e secondary por produto

### 🛒 Carrinho de compras

- ✅ Carrinho persistido no banco, atrelado ao usuário
- ✅ Criação, atualização e remoção de itens
- ✅ Validação de duplicatas (um produto por usuário)
- ✅ Atualização automática de totais
- ✅ Drawer lateral com Zustand para estado global da UI

### 📦 Sistema de Pedidos

- ✅ Entidade `Order` com status: PENDING, PICKED_UP, CANCELLED
- ✅ `OrderItem` com snapshots de nome/preço no momento da compra
- ✅ Garantia de integridade: produtos podem ser deletados, itens permanecem
- ✅ Cálculo de subtotal e total persistidos
- ✅ Índices de banco para consultas rápidas por usuário
- ✅ Interface frontend com filtros de status de pedidos

### 🛠️ Ferramentas de desenvolvimento

- ✅ Testes de integração com Vitest
- ✅ ESLint com plugin de segurança
- ✅ Prisma ERD generator para documentação
- ✅ Husky-ready (pre-commit hooks)
- ✅ CI/CD preparado para deploy

---

## 🛠️ Tecnologias utilizadas

### Frontend

- React 19
- TypeScript
- Vite 8
- Tailwind CSS 4
- React Router DOM 7
- React Hook Form
- Zod
- React Query + Devtools
- Zustand
- Axios
- Sonner
- Chadcn-ui
- lucide-react e react-icons

### Backend

- Node.js
- Express 5
- TypeScript
- tsx
- Prisma ORM
- PostgreSQL
- jose para autenticação JWT
- bcrypt-ts para hash de senhas
- cookie-parser, cors e dotenv
- Zod para validação
- Multer para processar requisições HTTP do tipo multipart/form-data
- file-type para analisar os magic numbers (bytes iniciais do arquivo)
- Cloudinary SDK para armazenamento e serviço de imagens
- Middleware de upload de arquivos com validação de magic bytes, mimetype e tamanho

---

## 🧱 Arquitetura e estrutura

### Frontend da aplicação

```text
src/
├── components/
├── pages/
├── shared/
│   ├── components/
│   ├── routes/
│   ├── schemas/
│   ├── services/
│   └── stores/
├── hook/
├── styles/
└── types/
```

### Backend da API

```text
src/
├── controllers/
├── middlewares/
├── repositories/
├── routes/
├── schemas/
├── services/
├── config/
└── errors/
```

### 🎯 Padrões e boas práticas adotadas

#### Backend

- **Arquitetura em camadas**: Controllers (roteamento) → Services (regra de negócio) → Repositories (persistência)
- **Tratamento de erros centralizado**: Classe `AppError` + middleware errorHandler
- **Validação em duas camadas**: Zod schemas no frontend *e* backend
- **Tratamento de erros Prisma**: Tradução de erros do banco para erros de aplicação
- **AsyncHandler**: Wrapper para evitar try/catch repetitivo nas rotas
- **Rate limiting**: express-rate-limit para proteger endpoints sensíveis
- **Upload seguro**: Validação de magic bytes, mimetype e tamanho antes de Cloudinary
- **Segurança**: Helmet, CORS configurado, cookies httpOnly/secure

#### Frontend

- **React Query**: Cache e sincronização de dados assíncronos
- **Zustand**: Estado global apenas para UI (não duplicar cache do servidor)
- **Axios Interceptor**: Tratamento automático de tokens e erros
- **React Hook Form + Zod**: Validação de formulários performática
- **React Router**: Proteção de rotas com AuthGate
- **Sonner**: Feedback visual de sucesso/erro
- **TailwindCSS 4**: Utilitários CSS com design system

### 🔒 Segurança implementada (OWASP Top 10)

- ✅ **Injeção**: Prepared statements via Prisma ORM
- ✅ **Autenticação quebrada**: JWT seguro, expiração, refresh pattern
- ✅ **Dados sensíveis expostos**: Variáveis de ambiente, nunca hardcode
- ✅ **XML External Entity (XXE)**: Não usa parser XML inseguro
- ✅ **Acesso controlado**: RBAC (admin vs user), middlewares de proteção
- ✅ **Má configuração de segurança**: Helmet, CORS, cookies seguros
- ✅ **XSS**: React escape automático, validação de inputs
- ✅ **Deserialização insegura**: Nunca usa eval(), serialização segura
- ✅ **Log e monitoramento**: Tratamento de erros, logs estruturados
- ✅ **Upload de arquivos inseguros**: Validação de magic bytes, Cloudinary

### 🧪 Testes e qualidade

#### Testes implementados

- Testes de integração no backend: `googleAuth.test.ts`, `loginLimiter.test.ts`, `passwordReset.test.ts`
- Testes unitários no frontend: API services com `GoogleLogin.test.ts`
- Cobertura configurada com `vitest --coverage`
- Linting: ESLint com regras de segurança (eslint-plugin-security)

#### Comandos de teste

```bash
cd back-end
bun run test              # Todos os testes
bun run test:coverage     # Relatório de cobertura
bun run test:integration  # Apenas testes de integração

cd front-end
bun run test             # Testes frontend
```

### 🏗️ Arquitetura geral do sistema

```mermaid
flowchart TB
    subgraph Frontend[Frontend Layer]
        UI[React 19 + Vite]
        RQ[React Query (Cache)]
        ZST[Zustand (UI State)]
        RT[React Router]
    end
    
    subgraph Backend[Backend Layer]
        CT[Controllers]
        SV[Services (Regras de Negócio)]
        RP[Repositories (Dados)]
        MW[Middlewares]
    end
    
    subgraph Infra[Infraestrutura & Serviços]
        DB[(PostgreSQL + Prisma)]
        CLD[Cloudinary (Imagens)]
        RSM[Resend (Emails)]
        FBA[Firebase Admin (Google OAuth)]
    end
    
    UI --> RQ --> AX[Axios Interceptor] --> CT
    CT --> SV --> RP --> DB
    MW -->|auth, rate-limit, upload| CT
    SV --> CLD
    SV --> RSM
    SV --> FBA
    
    style Frontend fill:#1e40af,color:#fff
    style Backend fill:#065f46,color:#fff
    style Infra fill:#7c2d12,color:#fff
```

### 📊 Modelo de dados — Entidades e relacionamentos

```mermaid
erDiagram
    User {
        uuid id PK
        string name
        string email UK
        string password
        boolean admin
        AuthProviders provider
        datetime createdAt
        datetime updatedAt
    }
    
    Products {
        cuid id PK
        string name
        string description
        int price
        string category
        datetime createAt
    }
    
    ProductsImage {
        cuid id PK
        string url
        string key
        string mimeType
        int size
        boolean isPrimary
        string productId FK
    }
    
    CartItem {
        cuid id PK
        string userId FK
        string productId FK
        int quantity
        datetime createdAt
    }
    
    Order {
        cuid id PK
        string userId FK
        OrderStatus status
        int total
        datetime createdAt
    }
    
    OrderItem {
        cuid id PK
        string orderId FK
        string productId FK
        string productName
        int unitPrice
        int quantity
        int subtotal
    }
    
    PasswordResetToken {
        cuid id PK
        string userId FK
        string tokenHash UK
        datetime expiresAt
        datetime usedAt
    }
    
    User ||--o{ CartItem : "possui"
    User ||--o{ Order : "cria"
    User ||--o{ PasswordResetToken : "solicita"
    Products ||--o{ ProductsImage : "tem"
    Products ||--o{ CartItem : "adiciona"
    Products ||--o{ OrderItem : "pertence"
    Order ||--o{ OrderItem : "contém"
```

### 🔄 Fluxo de autenticação e dados

```mermaid
sequenceDiagram
    actor Usuário
    participant Frontend
    participant API
    participant DB
    participant AuthServ
    
    Usuário->>Frontend: Tenta logar (email/senha ou Google)
    Frontend->>API: POST /auth/login ou /google/login
    API->>AuthServ: Valida credenciais / token Google
    AuthServ->>DB: Busca usuário
    DB-->>AuthServ: Retorna dados
    AuthServ->>API: Gera JWT (15d)
    API->>Frontend: Define cookie httpOnly
    Frontend->>API: Requisições autenticadas (Authorization Header + Cookie)
    API->>AuthServ: Valida JWT no middleware
    AuthServ-->>API: Token válido
    API->>DB: Busca dados solicitados
    DB-->>API: Retorna dados
    API-->>Frontend: Resposta JSON
    Frontend-->>Usuário: Renderiza dados
```

### Fluxo principal do usuário

1. O usuário acessa a aplicação e é direcionado para login ou cadastro.
2. Após autenticar-se, o sistema valida o token e libera o acesso às páginas protegidas.
3. O usuário navega pelo catálogo, filtra produtos por categoria e escolhe itens.
4. Os itens selecionados são adicionados ao carrinho e calculados em tempo real.
5. O fluxo de pedidos é preparado para evoluir com dados reais e regras de negócio mais completas.

---

## ▶️ Como executar

### Pré-requisitos

- Node.js 18+
- Bun ou npm
- PostgreSQL rodando localmente

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd casa-do-hamburger
```

### 2. Backend

```bash
cd back-end
bun install
# ou: npm install
```

Crie um arquivo `.env` com as variáveis abaixo:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/casa-do-hamburger"
JWT_SECRET="sua-chave-secreta"
PORT=3001
NODE_ENV="development"

# Cloudinary (Upload de imagens)
CLOUDINARY_CLOUD_NAME="seu-cloud-name"
CLOUDINARY_API_KEY="sua-api-key"
CLOUDINARY_API_SECRET="seu-api-secret"
```

Execute as migrations e inicie o servidor:

```bash
bunx prisma generate
bunx prisma migrate dev
bun run dev
```

### 3. Frontend

```bash
cd ../front-end
bun install
# ou: npm install
bun run dev
```

A aplicação frontend fica disponível em `http://localhost:5173`.

---

## 🔒 Segurança e boas práticas

- Hash de senhas com bcrypt
- Tokens JWT assinados e enviados via cookie
- Validação de entrada com Zod
- Middleware de autenticação e autorização
- Separação de responsabilidades entre camadas
- Uso de variáveis de ambiente para dados sensíveis

---

## 🚧 Próximos passos — Roadmap

### Curto prazo

- [ ] Finalizar fluxo de checkout e criação de pedidos
- [ ] Implementar webhooks para pagamento (Stripe/PIX)
- [ ] Adicionar mais testes de unidade e E2E (Playwright)
- [ ] Deploy em produção (Vercel + Render)

### Médio prazo

- [ ] Dashboard de admin com analytics
- [ ] Sistema de avaliações de produtos
- [ ] Cupons de desconto e promoções
- [ ] Notificações em tempo real (Socket.io)

### Longo prazo

- [ ] Módulo de gestão de estoque
- [ ] Integração com sistemas de entrega
- [ ] App mobile (React Native)

---

## 📈 Performance e otimizações

- **React Query**: Caching de dados, deduplicação de requisições
- **Bundle analysis**: Vite com tree shaking, código dividido por rotas
- **Imagens**: Upload otimizado para WebP, Cloudinary auto-otimização
- **Banco de dados**: Índices em todas as foreign keys, consultas otimizadas
- **Server**: Streaming de responses, compressão gzip

---

## 📋 Regras de negócio implementadas

1. Apenas administradores podem criar, editar e deletar produtos
2. Tokens de reset de senha são single-use e expiram em 30 minutos
3. Um usuário não pode adicionar o mesmo produto duas vezes no carrinho
4. Itens de pedido permanecem mesmo que o produto seja deletado (snapshot)
5. Emails de login social são únicos, não podem duplicar contas locais
6. Upload de imagens só aceita formatos: JPG, PNG, WebP (validação server-side)

---

## 📝 Convenções de desenvolvimento

- `feat:` para novas funcionalidades
- `fix:` para correções
- `docs:` para documentação
- `refactor:` para refatorações
- `style:` para ajustes visuais ou de formatação
- `test:` para testes

---

## 📸 Galeria de telas

Abaixo estão algumas telas representativas da experiência atual da aplicação, organizadas por contexto de uso.

### Autenticação

| Tela               | Visual                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------- |
| Login              | ![Tela de login](front-end/public/screenshots/logIn-screen.png)                         |
| Cadastro           | ![Tela de cadastro](front-end/public/screenshots/signUp-screen.png)                     |
| Validação de senha | ![Senha forte](<front-end/public/screenshots/password-strenght-meter(strong-pass).png>) |
| Esqueceu a senha? | ![Esqueceu senha](<front-end/public/screenshots/forgot-password-screen.png>) |

| Reset Password Token | ![Reset Password Token](<front-end/public/screenshots/reset-password-token.png>) |
| Reset Password Token | ![Reset Password Token](<front-end/public/screenshots/reset-password-screen.png>) |

### Catálogo e experiência principal

| Tela                                                | Visual                                                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Home sem autenticação                               | ![Home pública](front-end/public/screenshots/logout-homepage.png)                           |
| Home com usuário autenticado                        | ![Home autenticada](front-end/public/screenshots/admin-login-homepage.png)                        |
| Carrinho em uso                                     | ![Carrinho com itens](front-end/public/screenshots/login-homepage-with-admin-role_cart.png) |
| Janela de adcionar produto                          | ![Adiciona Produtos](front-end/public/screenshots/add-product-modal.png)                    |
| Tratamento de erros na janela de adicionar produtos | ![Validações inputs](<front-end/public/screenshots/add-product-modal(with_validation).png>) |

### Pedidos e administração

| Tela                    | Visual                                                                      |
| ----------------------- | --------------------------------------------------------------------------- |
| Gestão de pedidos       | ![Pedidos](front-end/public/screenshots/cardPedidos.png)                    |
| Sugestão de senha forte | ![Popover de senha](<front-end/public/screenshots/sigUp-fomr(popover).png>) |

### Nomeação

- **Componentes React**: PascalCase (`Header.tsx`)
- **Funções/Variáveis**: camelCase (`handleLogout`)
- **Constantes**: UPPER_SNAKE_CASE (`ICON_CONFIG`)
- **Tipos/Interfaces**: PascalCase (`CartItemsProps`) & (`ProductsInterface`)

---

## 🤝 Contribuindo

Este é um projeto de aprendizado pessoal. Sinta-se à vontade para:

- Forkar e adaptar para seus próprios projetos
- Sugerir melhorias via issues
- Compartilhar seus aprendizados

---

## 📄 Licença

Este projeto é aberto para fins educacionais. Sinta-se livre para usar como base para seus próprios projetos.

---

## 💡 Recursos de Aprendizado Utilizados

- [Documentação React](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express Guide](https://expressjs.com/)
- [Zod Documentation](https://zod.dev)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)

---

## 👨‍💻 Autor

Desenvolvido como projeto de aprendizado fullstack | 2026

---

Obrigado por visitar! Se este projeto foi útil, considere deixar uma ⭐
