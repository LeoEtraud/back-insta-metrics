# Guia Passo a Passo - Configuração Google OAuth

## Passo 1: Criar Projeto no Google Cloud

1. **Na tela atual que você está vendo:**
   - ⚠️ **IMPORTANTE**: O nome "Insta Métricas" está com erro porque contém acentos e espaços
   - **Altere o nome para**: `insta-metrics` ou `instaMetrics` (sem acentos, espaços ou caracteres especiais)
   - Use apenas: letras, números, hífens (-) ou underscores (_)

2. **Clique em "Criar"** após corrigir o nome

3. Aguarde a criação do projeto (pode levar alguns segundos)

## Passo 2: Habilitar a API OAuth

1. **No menu lateral esquerdo**, clique em:
   - "APIs e serviços" > "Biblioteca" (ou "APIs & Services" > "Library")

2. **Na barra de pesquisa**, digite: `Google+ API` ou `Google Identity`

3. **Selecione**: "Google+ API" ou "Google Identity Services API"

4. **Clique em "Ativar"** ou "Enable"

## Passo 3: Configurar Tela de Consentimento OAuth

1. **No menu lateral**, vá para:
   - "APIs e serviços" > "Tela de consentimento OAuth" (ou "OAuth consent screen")

2. **Escolha o tipo de usuário:**
   - Se for para uso pessoal/teste: "Externo" (External)
   - Se for para organização: "Interno" (Internal)

3. **Preencha as informações:**
   - **Nome do aplicativo**: Insta Metrics
   - **Email de suporte do usuário**: Seu email
   - **Logo do aplicativo**: (opcional) Faça upload de um logo
   - **Domínio do aplicativo**: (opcional para desenvolvimento)
   - **Email de contato do desenvolvedor**: Seu email

4. **Clique em "Salvar e continuar"**

5. **Escopos** (Scopes):
   - Clique em "Adicionar ou remover escopos"
   - Selecione:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
   - Clique em "Atualizar" e depois "Salvar e continuar"

6. **Usuários de teste** (se escolheu "Externo"):
   - Adicione seu email como usuário de teste
   - Clique em "Salvar e continuar"

7. **Resumo**: Revise e clique em "Voltar ao painel"

## Passo 4: Criar Credenciais OAuth

1. **No menu lateral**, vá para:
   - "APIs e serviços" > "Credenciais" (ou "Credentials")

2. **Clique em "Criar credenciais"** (botão azul no topo)

3. **Selecione**: "ID do cliente OAuth" (OAuth client ID)

4. **Tipo de aplicativo**: Selecione "Aplicativo da Web" (Web application)

5. **Nome**: Insta Metrics Backend

6. **Origens JavaScript autorizadas**:
   ```
   http://localhost:5000
   ```
   (Adicione uma por vez clicando em "+ Adicionar URI")

7. **URIs de redirecionamento autorizados**:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
   (Adicione uma por vez clicando em "+ Adicionar URI")

8. **Clique em "Criar"**

9. **IMPORTANTE**: Uma janela popup aparecerá com:
   - **ID do cliente** (Client ID) - Copie este valor!
   - **Segredo do cliente** (Client secret) - Copie este valor!

   ⚠️ **ATENÇÃO**: O segredo do cliente só aparece UMA VEZ. Anote imediatamente!

## Passo 5: Configurar Variáveis de Ambiente

1. **Abra o arquivo `.env`** no diretório `back-insta-metrics`

2. **Adicione as seguintes variáveis**:

```env
# Google OAuth
GOOGLE_CLIENT_ID=seu-client-id-aqui
GOOGLE_CLIENT_SECRET=seu-client-secret-aqui
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

3. **Substitua**:
   - `seu-client-id-aqui` pelo ID do cliente que você copiou
   - `seu-client-secret-aqui` pelo segredo do cliente que você copiou

## Passo 6: Testar a Configuração

1. **Reinicie o servidor backend**:
   ```bash
   cd back-insta-metrics
   npm run dev
   ```

2. **Inicie o frontend** (em outro terminal):
   ```bash
   cd front-insta-metrics
   npm run dev
   ```

3. **Acesse**: http://localhost:3000/login

4. **Clique no botão "Google"**

5. **Você deve ser redirecionado para**:
   - Tela de login do Google
   - Após login, autorização do aplicativo
   - Redirecionamento de volta para o dashboard

## Troubleshooting

### Erro: "redirect_uri_mismatch"
- Verifique se a URI de callback no Google Cloud está EXATAMENTE igual:
  - `http://localhost:5000/api/auth/google/callback`
- Certifique-se de que não há espaços ou caracteres extras

### Erro: "invalid_client"
- Verifique se o Client ID e Client Secret estão corretos no `.env`
- Certifique-se de que não há espaços extras nas variáveis

### Erro: "access_denied"
- Verifique se você adicionou seu email como usuário de teste (se o app está em modo de teste)
- Verifique se os escopos estão configurados corretamente

### O botão não redireciona
- Verifique se o servidor backend está rodando na porta 5000
- Verifique se a URL no frontend está correta

## Para Produção

Quando for para produção, você precisará:

1. **Adicionar URLs de produção no Google Cloud**:
   - Origens JavaScript: `https://seu-dominio.com`
   - URIs de redirecionamento: `https://seu-dominio.com/api/auth/google/callback`

2. **Atualizar o `.env`**:
   ```env
   GOOGLE_CALLBACK_URL=https://seu-dominio.com/api/auth/google/callback
   FRONTEND_URL=https://seu-dominio.com
   ```

3. **Publicar o aplicativo** (se estiver em modo de teste):
   - Vá para "Tela de consentimento OAuth"
   - Clique em "Publicar aplicativo"

