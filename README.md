# 🍔 Casa do Hamburguer

> Projeto fullstack de uma hamburgueria com autenticação, catálogo de produtos, carrinho de compras e páginas de pedidos. A aplicação foi evoluída para um fluxo mais realista de e-commerce, com validação de formulários, estado assíncrono e integração entre frontend e backend.

---

## 📌 Sobre o projeto

O Casa do Hamburguer é uma aplicação fullstack desenvolvida para praticar e consolidar conceitos de desenvolvimento web moderno. O projeto cobre desde a interface até a camada de persistência, com foco em autenticação, consumo de API, validação de dados e organização por camadas.

### Status atual

✅ Frontend e backend integrados
✅ Autenticação baseada em cookie + JWT
✅ Catálogo de produtos com filtros por categoria
✅ Carrinho de compras com listagem, remoção e alteração de quantidade
✅ Páginas de login, cadastro e pedidos
✅ Estrutura backend organizada com controllers, services e repositories

---

## ✨ Funcionalidades implementadas

### 🔐 Autenticação e autorização

- Cadastro de usuários com validação de dados via Zod
- Login com autenticação JWT e armazenamento em cookie httpOnly
- Logout com limpeza do cookie de sessão
- Middleware de autenticação para rotas protegidas
- Proteção de rotas de administrador para operações sensíveis
- Gate de autenticação no frontend para controlar acesso às páginas

### 🍔 Catálogo de produtos

- Listagem de produtos vindos do backend
- Filtro por categoria (Hamburguer, Bebidas e Porções)
- Interface de cards com nome, descrição, imagem e preço
- Endpoint de listagem de produtos consumido no frontend via React Query

### 🛒 Carrinho de compras

- Lista de itens do carrinho carregada pelo backend
- Adição, remoção e atualização de quantidade de itens
- Cálculo automático do valor total
- Drawer lateral para visualização do carrinho

### 📦 Pedidos

- Página de pedidos com filtros visuais por status
- Estrutura preparada para evoluir para dados reais vindos da API

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

### Padrões adotados

- Organização em camadas no backend: controllers → services → repositories
- Validação de dados no frontend e no backend
- Uso de React Query para estados assíncronos e cache de dados
- Uso de Zustand para estado local de UI, como controle do carrinho
- Tratamento de erros centralizado no backend

### Arquitetura em camadas

A aplicação foi estruturada para separar claramente responsabilidades entre apresentação, regras de negócio e persistência de dados:

```mermaid
flowchart LR
  U[Usuário] --> FE[Frontend React + Vite]
  FE --> API[Backend Express + TypeScript]
  API --> DB[(PostgreSQL + Prisma)]
  API --> AUTH[(JWT + Cookie httpOnly)]
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

## 🚧 Próximos passos

- Implementar testes automatizados no frontend e backend
- Expandir o fluxo de pedidos com integração real ao banco
- Melhorar a experiência de admin com gestão completa de produtos
- Adicionar mais feedbacks de UX e tratamento de estados de erro
- Evoluir o deploy para ambiente de produção

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

| Tela | Visual |
| --- | --- |
| Login | ![Tela de login](front-end/public/screenshots/logIn-screen.png) |
| Cadastro | ![Tela de cadastro](front-end/public/screenshots/signUp-screen.png) |
| Validação de senha | ![Senha forte](front-end/public/screenshots/password-strenght-meter(strong-pass).png) |

### Catálogo e experiência principal

| Tela | Visual |
| --- | --- |
| Home sem autenticação | ![Home pública](front-end/public/screenshots/logout-homepage.png) |
| Home com usuário autenticado | ![Home autenticada](front-end/public/screenshots/login-homepage.png) |
| Carrinho em uso | ![Carrinho com itens](front-end/public/screenshots/login-homepage-with-admin-role_cart.png) |

### Pedidos e administração

| Tela | Visual |
| --- | --- |
| Gestão de pedidos | ![Pedidos](front-end/public/screenshots/cardPedidos.png) |
| Sugestão de senha forte | ![Popover de senha](front-end/public/screenshots/sigUp-fomr(popover).png) |

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
