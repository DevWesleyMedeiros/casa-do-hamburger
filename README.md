# 🍔 Casa do Hamburguer - Projeto Fullstack

> Um projeto fullstack completo que simula um sistema de gerenciamento de hamburgueria com autenticação, catálogo de produtos, carrinho de compras e rastreamento de pedidos. **Desenvolvido como boilerplate educacional com foco em aprendizado prático de tecnologias web modernas.**

---

## 📋 Sobre o Projeto

**Casa do Hamburguer** é uma aplicação fullstack desenvolvida para consolidar conhecimentos em desenvolvimento web moderno, servindo como base (boilerplate) para projetos futuros. O projeto cobre toda a stack moderna de desenvolvimento, desde a camada de apresentação até a camada de persistência de dados.

### 🎯 Objetivos

- ✅ Criar um ambiente de aprendizado prático com tecnologias da indústria
- ✅ Implementar um boilerplate reutilizável para projetos futuros
- ✅ Consolidar boas práticas de arquitetura fullstack
- ✅ Demonstrar conhecimento em padrões de design e segurança web

### 📊 Status

🚧 **Projeto em Desenvolvimento** - Novas funcionalidades e melhorias estão sendo adicionadas continuamente

---

## 🎨 Funcionalidades

### 👤 Autenticação & Autorização

- ✅ Registro de novos usuários com validação de dados
- ✅ Login com geração de JWT tokens
- ✅ Logout com limpeza de cookies
- ✅ Proteção de rotas e endpoints com middleware de autenticação
- ✅ Sistema de permissões com role de administrador

### 🍟 Catálogo de Produtos

- ✅ Listagem de todos os produtos com filtros
- ✅ Filtro por categoria de produtos
- ✅ Busca e classificação de produtos
- ✅ Sistema de administração de produtos (CRUD)
- ✅ Adição/Exclusão de produtos no banco de dados

### 🛒 Carrinho de Compras

- ✅ Adição/Remoção de produtos ao carrinho
- ✅ Atualização de quantidades
- ✅ Cálculo automático de totais
- ✅ Persistência de carrinho em estado global
- ✅ Limpeza do carrinho após checkout

### 📦 Gerenciamento de Pedidos

- ✅ Visualização de histórico de pedidos
- ✅ Cards informativos com status dos pedidos
- ✅ Rastreamento de informações de entrega
- ✅ Interface responsiva para consulta de pedidos

---

## 🛠️ Tecnologias Utilizadas

### 🎯 Frontend

```
├── React 18+              # Framework UI
├── TypeScript             # Tipagem estática
├── Vite                   # Build tool & dev server
├── Tailwind CSS           # Styling utilitário
├── Zustand               # Gerenciamento de estado global
├── React Hook Form       # Gerenciamento de formulários
├── Zod                   # Validação de dados & schemas
├── Axios                 # Cliente HTTP
└── React Router          # Roteamento
```

### 🔧 Backend

```
├── Node.js               # Runtime JavaScript
├── Express               # Framework HTTP
├── Bun                   # Package manager & tooling
├── Prisma                # ORM TypeScript
├── PostgreSQL            # Banco de dados
├── JWT (jose)            # Autenticação com tokens
├── Bcrypt                # Hash de senhas
├── Zod                   # Validação de schemas
└── TypeScript            # Tipagem estática
```

---

## 📚 Aprendizados & Conceitos Implementados

### 🎨 Frontend - Aprendizados

#### Nível: Iniciante

- Componentes funcionais com React Hooks
- Props e composição de componentes
- Renderização condicional e listas

#### Nível: Intermediário

- **Tailwind CSS** 🎨
  - Responsive design com breakpoints
  - Sistema de utility classes
  - Customização de temas e variáveis
  - Dark mode (padrão)

- **Zustand** 🎭
  - Gerenciamento de estado global simplificado
  - Hooks customizados para estado
  - Imutabilidade e otimizações
  - Persistência de dados em localStorage

- **React Hook Form + Zod** 📝
  - Formulários reativos e performáticos
  - Validação de dados em tempo real
  - Tratamento de erros granular
  - Integração cliente-servidor

#### Nível: Avançado

- TypeScript avançado com tipos complexos
- Consumo de APIs REST com tratamento de erros
- Context API e Provider patterns
- Otimizações de performance (memoization, code splitting)
- Arquitetura de componentes escalável

### 🔧 Backend - Aprendizados

#### Nível: Iniciante

- Criar servidores HTTP com Express
- Routing e middlewares
- Variáveis de ambiente

#### Nível: Intermediário

- **Prisma ORM** 📦
  - Definição de schemas com Prisma Schema Language
  - Geração de Migrations
  - CRUD operations tipadas
  - Relações entre modelos

- **JWT & Autenticação** 🔐
  - Geração e validação de tokens JWT
  - Refresh tokens
  - Proteção de endpoints
  - Gestão segura de credenciais

- **Zod Validation** ✔️
  - Validação de request bodies
  - Coerção de tipos
  - Mensagens de erro customizadas
  - Schemas compostos

#### Nível: Avançado

- Hash seguro de senhas com bcrypt
- Tratamento de erros estruturado com classes customizadas
- Middlewares customizados
- Arquitetura em camadas (Controllers, Services, Repositories)
- Padrões RESTful
- Segurança (CORS, proteção de rotas, validação de dados)

---

## 🏗️ Arquitetura do Projeto

### Estrutura Frontend

```
src/
├── components/          # Componentes reutilizáveis
│   ├── button/         # Botões customizados
│   ├── header/         # Cabeçalho da aplicação
│   ├── products/       # Listagem de produtos
│   ├── cart/           # Carrinho de compras
│   ├── cartItem/       # Item do carrinho
│   ├── cardPedidos/    # Card de pedidos
│   └── input/          # Inputs reutilizáveis
├── pages/              # Páginas da aplicação
│   ├── home/           # Página inicial
│   ├── login/          # Página de login
│   ├── register/       # Página de registro
│   └── pedidos/        # Página de pedidos
├── shared/             # Código compartilhado
│   ├── components/     # Componentes globais
│   ├── context/        # React Context
│   ├── routes/         # Configuração de rotas
│   ├── schemas/        # Schemas Zod
│   ├── services/       # Serviços HTTP
│   ├── stores/         # Zustand stores
│   └── utils/          # Utilitários
├── styles/             # Estilos globais
│   ├── global.css
│   ├── variables.css
│   └── themes/         # Temas (light/dark)
├── types/              # TypeScript types globais
├── App.tsx             # Componente raiz
└── main.tsx            # Ponto de entrada
```

### Estrutura Backend

```
src/
├── controllers/        # Lógica de requisições
│   └── authControllers.ts
├── services/           # Lógica de negócio
│   └── authService.ts
├── repositories/       # Acesso a dados (Prisma)
│   └── userRepositories.ts
├── routes/             # Definição de rotas
│   └── authRoutes.ts
├── middlewares/        # Middlewares Express
│   ├── authMiddlewares.ts
│   ├── validateBody.ts
│   ├── clearAuthCookie.ts
│   ├── requiredAdmin.ts
│   └── errorHandler.ts
├── schemas/            # Schemas Zod para validação
│   └── authSchemas.ts
├── config/             # Configurações
│   └── jwt.ts
├── shared/             # Código compartilhado
│   └── AppError.ts     # Classe de erro customizada
├── db.ts               # Configuração do Prisma
└── server.ts           # Ponto de entrada do servidor
```

### Padrão de Arquitetura

- **MVC com Repositories**: Controllers → Services → Repositories → Prisma
- **Separação de responsabilidades**: Cada camada tem uma função específica
- **Tratamento de erros centralizado**: Middleware global de erros
- **Validação em múltiplas camadas**: Zod + TypeScript

---

## 🚀 Como Iniciar

### Pré-requisitos

- Node.js 18+
- npm, pnpm, yarn ou bun
- PostgreSQL 14+

### Instalação

#### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd casa-do-hamburger
```

#### 2. Frontend Setap

```bash
cd front-end
npm install
# ou
bun install
```

#### 3. Backend Setup

```bash
cd back-end
npm install
# ou
bun install
```

#### 3. Configurar variáveis de ambiente

Crie um arquivo `.env` na pasta `back-end`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/casa-do-hamburger"
JWT_SECRET="sua-chave-secreta-super-segura"
PORT=3001
NODE_ENV="development"
```

#### 4. Migrations do banco de dados

```bash
npx prisma migrate dev
```

#### 5. Iniciar o backend

```bash
npm run dev
# ou
bun run dev
```

#### 6. Iniciar o frontend

```bash
npm run dev
# ou
bun run dev
```

A aplicação estará disponível em `http://localhost:5173`

---

## 📖 Fluxo de Desenvolvimento

### Autenticação

1. Usuário se registra → Dados validados com Zod
2. Senha é hashada com bcrypt
3. Usuário faz login → JWT gerado e armazenado em cookie
4. Token é incluído em requisições subsequentes
5. Middleware valida o token em rotas protegidas

### Carrinho & Checkout

1. Produtos são filtrados e exibidos
2. Usuário adiciona produtos ao carrinho (Zustand)
3. Estado do carrinho é sincronizado com o servidor
4. Checkout gera um pedido no banco de dados
5. Carrinho é limpo após sucesso

### Gerenciamento de Produtos (Admin)

1. Apenas usuários com role `admin` podem acessar
2. CRUD completo de produtos
3. Validação com Zod antes de persistir
4. Categoria de produto é gerenciada

---

## 🔒 Segurança Implementada

- ✅ Hash de senhas com bcrypt
- ✅ JWT tokens com expiração
- ✅ Validação de dados com Zod
- ✅ Proteção de rotas autenticadas
- ✅ Middleware CORS configurado
- ✅ Tratamento seguro de erros (sem exposição de detalhes internos)
- ✅ Cookies httpOnly para tokens
- ✅ Autorização baseada em roles (admin)

---

## 📦 Dependências Principais

### Frontend

- `react` - Interface de usuário
- `typescript` - Tipagem
- `zustand` - Estado global
- `react-hook-form` - Formulários
- `zod` - Validação
- `axios` - HTTP client
- `tailwindcss` - Styling

### Backend

- `express` - Framework HTTP
- `prisma` - ORM
- `postgresql` - Banco de dados
- `jose` - JWT
- `zod` - Validação
- `bcryptjs` - Hash de senhas

---

## 🎓 Próximos Passos & Melhorias Planejadas

- [ ] Implementação de testes unitários e E2E
- [ ] Melhorias no UX/UI com animações e no responsivo
- [ ] Sistema de avaliações e comentários
- [ ] Notificações em tempo real com WebSocket
- [ ] Dashboard administrativo completo
- [ ] Melhorias em performance e SEO
- [ ] Implementação de login com o Google auth e Firebase
- [ ] Deploy em produção (Vercel + Railway)
- [ ] Documentação da API com Swagger

---

## 📝 Padrões & Convenções

### Commits

- `feat:` Novas funcionalidades
- `fix:` Correções de bugs
- `docs:` Documentação
- `style:` Formatação de código
- `refactor:` Refatoração
- `test:` Testes

---

## 📸 Screenshots das principais telas do projeto

Algumas imagens do projeto aqui para documentar telas importantes: formulário de login, registro e home.

![Login screenshot](front-end/public/screenshots/logIn-screen.png)

![Register screenshot](front-end/public/screenshots/signUp-screen.png)

![Register screenshot](front-end/public/screenshots/sigUp-fomr(popover).png)

![Register screenshot](front-end/public/screenshots/password-strenght-meter(weak-pass).png)

![Register screenshot](front-end/public/screenshots/password-strenght(medium-pass).png)

![Register screenshot](front-end/public/screenshots/password-strenght-meter(strong-pass).png)

![Home logout screenshot](front-end/public/screenshots/logout-homepage.png)

![Home login e admin role screenshot](front-end/public/screenshots/login-homepage.png)

![Home login com admin role e Cart screenshot](front-end/public/screenshots/login-homepage-with-admin-role_cart.png)

![Home login com admin role e Cart screenshot](front-end/public/screenshots/cardPedidos.png)

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

**Obrigado por visitar! Se este projeto foi útil, considere deixar uma ⭐**
