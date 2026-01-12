# 🏖️ Sistema de Gestão de Férias

Sistema completo para gerenciamento de colaboradores e solicitações de férias, com interface web moderna e API RESTful.

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Arquitetura do Sistema](#-arquitetura-do-sistema)
- [Instalação e Configuração](#-instalação-e-configuração)
  - [Pré-requisitos](#pré-requisitos)
  - [Backend](#-backend)
  - [Frontend](#-frontend)
- [Uso do Sistema](#-uso-do-sistema)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [API Documentation](#-api-documentation)

---

## 🎯 Visão Geral

O **Sistema de Gestão de Férias** é uma aplicação web completa desenvolvida para facilitar o gerenciamento de colaboradores, cargos, setores e solicitações de férias dentro de uma empresa. O sistema possui três níveis de acesso: **RH**, **Gestor** e **Funcionário**, cada um com permissões específicas.

---

## ✨ Funcionalidades

### 👤 RH (Recursos Humanos)
- ✅ Visualizar todos os colaboradores da empresa
- ✅ Adicionar, editar e remover colaboradores
- ✅ Gerenciar cargos e setores
- ✅ Visualizar todas as solicitações de férias
- ✅ Aprovar ou reprovar solicitações de férias
- ✅ Adicionar observações ao reprovar férias
- ✅ Upload e gerenciamento de avatar pessoal
- ✅ Filtrar colaboradores por nome, setor, cargo ou status de férias

### 👔 Gestor
- ✅ Visualizar equipe subordinada
- ✅ Criar solicitações de férias para colaboradores da equipe
- ✅ Visualizar status das solicitações de férias da equipe
- ✅ Upload e gerenciamento de avatar pessoal

### 👨‍💼 Funcionário
- Subordinados aos gestores
- Não possuem acesso direto ao sistema (login)
- Suas férias são solicitadas pelos gestores

### 🔐 Autenticação e Segurança
- Sistema de autenticação JWT (JSON Web Token)
- Senhas criptografadas com bcrypt
- Guards de proteção de rotas por role (RH/Gestor)
- Interceptor HTTP para anexar token automaticamente
- Migração automática de senhas em texto plano para hash

---

## 🛠️ Tecnologias Utilizadas

### Backend
| Tecnologia | Versão | Descrição |
|-----------|--------|-----------|
| **Node.js** | - | Runtime JavaScript |
| **NestJS** | ^11.0.1 | Framework progressivo para Node.js |
| **TypeScript** | ^5.7.3 | Superset tipado do JavaScript |
| **Prisma** | 5.19.1 | ORM moderno para Node.js e TypeScript |
| **@prisma/client** | 5.19.1 | Cliente Prisma para acesso ao banco |
| **PostgreSQL** | - | Banco de dados relacional |
| **JWT** | - | Autenticação via tokens |
| **bcrypt** | ^6.0.0 | Criptografia de senhas |
| **Swagger** | ^11.2.3 | Documentação automática da API |
| **Multer** | - | Upload de arquivos (avatares) |

### Frontend
| Tecnologia | Versão | Descrição |
|-----------|--------|-----------|
| **Angular** | ^20.3.0 | Framework web moderno |
| **TypeScript** | ~5.8.2 | Linguagem tipada |
| **RxJS** | ^7.8.2 | Programação reativa |
| **TailwindCSS** | latest | Framework CSS utility-first |
| **Angular Router** | ^20.3.7 | Sistema de rotas |
| **Angular Forms** | ^20.3.7 | Formulários reativos |

---

## 🏗️ Arquitetura do Sistema

### Backend (NestJS)
```
backend-ferias/
├── src/
│   ├── auth/              # Autenticação e JWT
│   ├── users/             # Gerenciamento de usuários
│   ├── vacation-requests/ # Solicitações de férias
│   ├── cargos/           # Gerenciamento de cargos
│   ├── setores/          # Gerenciamento de setores
│   ├── avatars/          # Upload de avatares
│   ├── prisma/           # Configuração do Prisma ORM
│   └── common/           # Guardas, decorators e utilitários
└── prisma/
    ├── schema.prisma     # Schema do banco de dados
    └── seed.ts           # Dados iniciais
```

### Frontend (Angular)
```
frontend/
└── src/
    ├── components/
    │   ├── login/              # Tela de login
    │   ├── rh-dashboard/       # Dashboard do RH
    │   ├── manager-dashboard/  # Dashboard do Gestor
    │   ├── vacation-request/   # Formulário de solicitação
    │   └── shared/            # Componentes compartilhados
    ├── services/
    │   ├── auth.service.ts    # Serviço de autenticação
    │   └── data.service.ts    # Serviço de dados
    ├── guards/
    │   └── auth.guard.ts      # Guard de autenticação
    ├── interceptors/
    │   └── auth.interceptor.ts # Interceptor HTTP
    └── models/
        └── user.model.ts      # Modelos de dados
```

### Banco de Dados (PostgreSQL)
```
Tabelas:
├── User         # Usuários (RH, Gestor, Funcionário)
├── Setor        # Setores da empresa
├── Cargo        # Cargos disponíveis
├── Ferias       # Solicitações de férias
└── Avatar       # Avatares dos usuários
```

---

## 🚀 Instalação e Configuração

### Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior) - [Download](https://nodejs.org/)
- **PostgreSQL** (versão 14 ou superior) - [Download](https://www.postgresql.org/download/)
- **npm** ou **yarn** (gerenciador de pacotes)
- **Git** - [Download](https://git-scm.com/)

### 📦 Backend

#### 1. Navegue até a pasta do backend
```bash
cd backend-ferias
```

#### 2. Instale as dependências
```bash
npm install
```

#### 3. Instale o Prisma (versão 5.19.1)

> ⚠️ **IMPORTANTE**: Este projeto utiliza o Prisma na versão 5.19.1. Sempre use esta versão específica.

**3.1. Instalar o Prisma CLI (Dependência de Desenvolvimento)**
```bash
npm install prisma@5.19.1 --save-dev
```

**3.2. Instalar o Prisma Client (Dependência de Produção)**
```bash
npm install @prisma/client@5.19.1
```

> 💡 **Nota**: Sempre utilize estes comandos ao configurar o projeto pela primeira vez ou ao reinstalar as dependências do Prisma.

#### 4. Configure o banco de dados

Crie um banco de dados PostgreSQL:
```sql
CREATE DATABASE "projeto-ferias";
```

#### 5. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz da pasta `backend-ferias`:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/projeto-ferias?schema=public"
JWT_SECRET="sua-chave-secreta-jwt-super-segura-aqui-mude-em-producao"
JWT_EXPIRES_IN="1d"
```

> ⚠️ **IMPORTANTE**: 
> - Substitua `SUA_SENHA` pela senha do seu PostgreSQL
> - Em produção, use uma chave JWT_SECRET forte e segura
> - Nunca compartilhe sua chave JWT_SECRET

#### 6. Execute as migrations do Prisma
```bash
npx prisma migrate dev
```

#### 7. Gere o Prisma Client
```bash
npx prisma generate
```

#### 8. Popule o banco de dados com dados iniciais
```bash
npm run prisma:seed
```

Este comando criará:
- **Setores**: RH, TI, Financeiro, Comercial
- **Cargos**: Gestor, Desenvolvedor, Analista, RH
- **Usuários**:
  - RH: `maria.rh@empresa.com` / senha: `rh123`
  - Gestor TI: `joao.gestor@empresa.com` / senha: `gestor123`
  - Gestor Financeiro: `carlos.gestor@empresa.com` / senha: `gestor123`
  - Funcionários: Ana Costa e Bruno Lima

#### 9. Inicie o servidor backend
```bash
# Modo desenvolvimento (com hot-reload)
npm run start:dev

# Modo produção
npm run build
npm run start:prod
```

O backend estará rodando em: **http://localhost:3000**

#### 10. Acesse a documentação da API (Swagger)
Abra seu navegador em: **http://localhost:3000/api-docs**

---

### 🎨 Frontend

#### 1. Navegue até a pasta do frontend
```bash
cd frontend
```

#### 2. Instale as dependências
```bash
npm install
```

#### 3. Configure a URL da API (opcional)

Se o backend estiver rodando em uma porta diferente, edite o arquivo `src/services/auth.service.ts` e `src/services/data.service.ts`:

```typescript
const API_URL = 'http://localhost:3000'; // Altere se necessário
```

#### 4. Inicie o servidor frontend
```bash
npm run dev
```

O frontend estará rodando em: **http://localhost:4200**

#### 5. Acesse o sistema
Abra seu navegador em: **http://localhost:4200**

---

## 👥 Uso do Sistema

### Login

Acesse `http://localhost:4200` e faça login com uma das contas criadas pelo seed:

**Usuário RH:**
- Email: `maria.rh@empresa.com`
- Senha: `rh123`

**Gestor TI:**
- Email: `joao.gestor@empresa.com`
- Senha: `gestor123`

**Gestor Financeiro:**
- Email: `carlos.gestor@empresa.com`
- Senha: `gestor123`

### Fluxo de Trabalho

1. **RH** cria colaboradores e atribui gestores
2. **Gestor** visualiza sua equipe e solicita férias para funcionários
3. **RH** visualiza todas as solicitações pendentes
4. **RH** aprova ou reprova as solicitações
5. **Gestor** visualiza o status das solicitações de sua equipe

---

## 📁 Estrutura do Projeto

```
projeto_ferias/
├── backend-ferias/          # API Backend (NestJS)
│   ├── src/                # Código-fonte
│   ├── prisma/             # Schema e migrations
│   ├── uploads/            # Arquivos enviados (avatares)
│   ├── dist/               # Build de produção
│   ├── package.json        # Dependências do backend
│   ├── .env               # Variáveis de ambiente (criar)
│   └── README.md          # Documentação do backend
│
├── frontend/               # Interface Web (Angular)
│   ├── src/               # Código-fonte
│   │   ├── components/    # Componentes Angular
│   │   ├── services/      # Serviços
│   │   ├── guards/        # Guards de rota
│   │   ├── interceptors/  # Interceptors HTTP
│   │   └── models/        # Modelos TypeScript
│   ├── package.json       # Dependências do frontend
│   └── README.md         # Documentação do frontend
│
└── README.md             # Este arquivo (documentação geral)
```

---

## 📚 API Documentation

A documentação completa da API está disponível via **Swagger** após iniciar o backend:

**URL:** http://localhost:3000/api-docs

### Principais Endpoints

#### Autenticação
- `POST /auth/login` - Login de usuário

#### Usuários
- `GET /users` - Listar usuários (RH)
- `POST /users` - Criar usuário (RH)
- `PATCH /users/:id` - Atualizar usuário (RH)
- `DELETE /users/:id` - Deletar usuário (RH)

#### Solicitações de Férias
- `POST /vacation-requests` - Criar solicitação (Gestor)
- `GET /vacation-requests` - Listar todas (RH)
- `GET /vacation-requests/my-team` - Listar da equipe (Gestor)
- `PATCH /vacation-requests/:id/status` - Aprovar/Reprovar (RH)

#### Cargos
- `GET /cargos` - Listar cargos
- `POST /cargos` - Criar cargo (RH)
- `PATCH /cargos/:id` - Atualizar cargo (RH)
- `DELETE /cargos/:id` - Deletar cargo (RH)

#### Setores
- `GET /setores` - Listar setores
- `POST /setores` - Criar setor (RH)
- `PATCH /setores/:id` - Atualizar setor (RH)
- `DELETE /setores/:id` - Deletar setor (RH)

#### Avatares
- `POST /avatars/upload` - Upload de avatar
- `PATCH /avatars/update` - Atualizar avatar
- `GET /avatars/me` - Obter avatar atual
- `DELETE /avatars/delete` - Deletar avatar

---

## 🔒 Segurança

- ✅ Senhas criptografadas com bcrypt
- ✅ Autenticação JWT com expiração de 1 dia
- ✅ Guards de autorização por role (RH/Gestor)
- ✅ Validação de dados em todos os endpoints
- ✅ CORS configurado para localhost:4200
- ✅ Upload de arquivos com validação de tipo e tamanho

---

## 🎨 Recursos Visuais

- Interface moderna e responsiva com TailwindCSS
- Sistema de notificações (sucesso/erro)
- Modais para confirmação de ações
- Upload de avatar com preview
- Filtros e pesquisa em tempo real
- Animações e transições suaves

---

## 🐛 Troubleshooting

### Backend não inicia
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no arquivo `.env`
- Certifique-se de que está usando Prisma 5.19.1
- Execute `npx prisma generate` novamente

### Frontend não conecta ao backend
- Verifique se o backend está rodando na porta 3000
- Confirme a configuração de CORS no backend
- Verifique a URL da API nos serviços do frontend

### Erro de autenticação
- Verifique se o JWT_SECRET está configurado
- Limpe o localStorage do navegador
- Faça login novamente

### Erro ao fazer upload de avatar
- Verifique se a pasta `uploads/avatars` existe
- Confirme as permissões de escrita na pasta
- Verifique o tamanho do arquivo (máximo 5MB)

### Erro com Prisma
- **Versão incompatível**: Certifique-se de usar Prisma 5.19.1
  ```bash
  npm install prisma@5.19.1 --save-dev
  npm install @prisma/client@5.19.1
  ```
- **Erro de migração**: Execute `npx prisma migrate reset` (⚠️ apaga todos os dados)
- **Erro de geração**: Execute `npx prisma generate`
- **Schema desatualizado**: Execute `npx prisma db push`

---

## 📝 Scripts Úteis

### Backend
```bash
npm run start:dev      # Iniciar em desenvolvimento
npm run build          # Build de produção
npm run start:prod     # Iniciar em produção
npm run prisma:migrate # Executar migrations
npm run prisma:seed    # Popular banco de dados
npm run test          # Executar testes
npm run lint          # Verificar código
```

### Frontend
```bash
npm run dev       # Iniciar em desenvolvimento
npm run build     # Build de produção
npm run preview   # Preview do build
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é de uso privado (UNLICENSED).

---

## 👨‍💻 Desenvolvedor

Desenvolvido com ❤️ para facilitar a gestão de férias empresariais.

---

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- Documentação do Swagger: http://localhost:3000/api-docs
- Arquivo `ENV_SETUP.md` na pasta backend
- Arquivo `DEBUG_AUTH.md` na raiz do projeto

---

**Última atualização:** Janeiro 2026

