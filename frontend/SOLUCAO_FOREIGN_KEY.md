# 🔧 Solução: Erro de Foreign Key Constraint

## Problema

O erro `Foreign key constraint failed` ocorre quando tentamos criar um usuário com:
- `setorId` que não existe na tabela `Setor`
- `cargoId` que não existe na tabela `Cargo`
- `gestorId` que não existe na tabela `User`

## Causa

O frontend está enviando IDs que não existem no banco de dados, ou o banco não foi populado corretamente.

## Solução Passo a Passo

### 1. Verificar se o banco está populado

```cmd
cd backend-ferias
npm run prisma:seed
```

### 2. Verificar dados no banco

No pgAdmin4, execute:

```sql
-- Verificar setores
SELECT * FROM "Setor";

-- Verificar cargos
SELECT * FROM "Cargo";

-- Verificar gestores disponíveis
SELECT id, nome, tipo FROM "User" WHERE tipo IN ('Gestor', 'RH');
```

### 3. Garantir que o frontend envia IDs válidos

O frontend deve usar os IDs retornados pelos endpoints:
- `GET /setores` - retorna setores com IDs
- `GET /cargos` - retorna cargos com IDs
- `GET /users/gestores` - retorna gestores com IDs

### 4. Adicionar validações no backend

O backend deve validar se os IDs existem antes de criar o usuário.

