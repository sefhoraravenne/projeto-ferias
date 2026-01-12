# Configuração do Ambiente

## Arquivo .env

Crie um arquivo `.env` na raiz do projeto `backend-ferias` com o seguinte conteúdo:

```env
DATABASE_URL="postgresql://postgres:1104@localhost:5432/projeto-ferias?schema=public"
JWT_SECRET="sua-chave-secreta-jwt-super-segura-aqui-mude-em-producao"
JWT_EXPIRES_IN="1d"
```

**IMPORTANTE**: 
- O arquivo `.env` já está no `.gitignore` e não será commitado
- Em produção, use uma chave JWT_SECRET forte e segura
- Nunca compartilhe sua chave JWT_SECRET

## Como criar o arquivo

1. Na raiz do projeto `backend-ferias`, crie um arquivo chamado `.env`
2. Cole o conteúdo acima
3. Reinicie o servidor backend



