# Guia de Debug - Problema de Autenticação

## Logs Adicionados

Adicionei logs extensivos em vários pontos do sistema para ajudar a identificar o problema:

### Frontend (Console do Navegador)
- ✅ Log quando tenta fazer login
- ✅ Log quando recebe token do backend
- ✅ Log quando salva token no localStorage
- ✅ Log quando envia token nas requisições
- ⚠️ Aviso quando token não é encontrado

### Backend (Terminal)
- 🔐 Log quando recebe tentativa de login
- ✅ Log quando usuário é encontrado
- ❌ Log quando usuário não é encontrado ou senha incorreta
- 📦 Log do payload do token
- 🎫 Log do token gerado
- 🛡️ Log no JwtAuthGuard quando verifica autenticação
- 🔍 Log na validação do token JWT
- ✅ Log quando token é validado com sucesso
- ❌ Log quando token é inválido

## Como Usar os Logs

1. **Abra o Console do Navegador** (F12 → Console)
2. **Abra o Terminal do Backend** (onde está rodando `npm run start:dev`)
3. **Tente fazer login**
4. **Observe os logs em ambos os lugares**

## O que Procurar

### Se o login funciona mas depois dá erro:

1. **Verifique se o token está sendo salvo:**
   - No console do navegador, deve aparecer: `💾 Token salvo no localStorage`

2. **Verifique se o token está sendo enviado:**
   - No console do navegador, deve aparecer: `✅ Token encontrado, enviando para: [URL]`
   - Se aparecer `⚠️ Token não encontrado`, o problema é que o token não está sendo salvo

3. **Verifique se o backend está recebendo o token:**
   - No terminal do backend, deve aparecer: `🔑 Authorization header: Bearer [token]...`
   - Se aparecer `NÃO ENCONTRADO`, o token não está sendo enviado

4. **Verifique se o token está sendo validado:**
   - No terminal do backend, deve aparecer: `🔍 Validando token JWT. Payload recebido:`
   - Se aparecer `❌ Token inválido`, há problema na validação

### Se o login não funciona:

1. **Verifique se o usuário existe:**
   - No terminal do backend, deve aparecer: `✅ Usuário encontrado:`
   - Se aparecer `❌ Usuário não encontrado`, o email está errado

2. **Verifique se a senha está correta:**
   - Se aparecer `❌ Senha incorreta`, a senha está errada

3. **Verifique se o tipo do usuário está correto:**
   - O usuário deve ser do tipo `RH` ou `Gestor`
   - Se aparecer `❌ Usuário não tem permissão para login`, o tipo está errado

## Problemas Comuns

### 1. JWT_SECRET não configurado
**Sintoma:** Token não é validado
**Solução:** Criar arquivo `.env` com `JWT_SECRET`

### 2. Token não está sendo salvo
**Sintoma:** `⚠️ Token não encontrado` no console
**Solução:** Verificar se o localStorage está funcionando (não está em modo privado/incógnito)

### 3. Token não está sendo enviado
**Sintoma:** `NÃO ENCONTRADO` no terminal do backend
**Solução:** Verificar se o interceptor está funcionando corretamente

### 4. JWT_SECRET diferente entre assinatura e validação
**Sintoma:** Token é gerado mas não é validado
**Solução:** Garantir que o mesmo `JWT_SECRET` está sendo usado em ambos

## Próximos Passos

Após executar o login e ver os logs, me informe:
1. O que aparece no console do navegador?
2. O que aparece no terminal do backend?
3. Em que ponto o processo falha?



