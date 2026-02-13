# Configuração de OAuth - Google e Microsoft

Este documento explica como configurar o login social com Google e Microsoft.

## Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Microsoft OAuth
MICROSOFT_CLIENT_ID=seu-microsoft-client-id
MICROSOFT_CLIENT_SECRET=seu-microsoft-client-secret
MICROSOFT_CALLBACK_URL=http://localhost:5000/api/auth/microsoft/callback

# Frontend URL (para redirecionamento após OAuth)
FRONTEND_URL=http://localhost:3000
```

## Configuração do Google OAuth

1. **Acesse o Google Cloud Console**:
   - Vá para: https://console.cloud.google.com/
   - Crie um novo projeto ou selecione um existente

2. **Habilite a API OAuth**:
   - Vá para "APIs & Services" > "Library"
   - Procure por "Google+ API" e habilite

3. **Crie credenciais OAuth**:
   - Vá para "APIs & Services" > "Credentials"
   - Clique em "Create Credentials" > "OAuth client ID"
   - Escolha "Web application"
   - Configure:
     - **Name**: Insta Metrics
     - **Authorized JavaScript origins**: `http://localhost:5000`
     - **Authorized redirect URIs**: `http://localhost:5000/api/auth/google/callback`

4. **Copie as credenciais**:
   - Client ID → `GOOGLE_CLIENT_ID`
   - Client Secret → `GOOGLE_CLIENT_SECRET`

## Configuração do Microsoft OAuth

1. **Acesse o Azure Portal**:
   - Vá para: https://portal.azure.com/
   - Entre com sua conta Microsoft

2. **Registre uma aplicação**:
   - Vá para "Azure Active Directory" > "App registrations"
   - Clique em "New registration"
   - Configure:
     - **Name**: Insta Metrics
     - **Supported account types**: Accounts in any organizational directory and personal Microsoft accounts
     - **Redirect URI**: 
       - Type: Web
       - URI: `http://localhost:5000/api/auth/microsoft/callback`

3. **Configure autenticação**:
   - Na página da aplicação, vá para "Authentication"
   - Adicione a redirect URI se necessário
   - Em "Implicit grant and hybrid flows", marque "ID tokens"

4. **Crie um Client Secret**:
   - Vá para "Certificates & secrets"
   - Clique em "New client secret"
   - Copie o valor (só aparece uma vez!)

5. **Copie as credenciais**:
   - Application (client) ID → `MICROSOFT_CLIENT_ID`
   - Client secret value → `MICROSOFT_CLIENT_SECRET`

## URLs de Produção

Para produção, atualize as URLs de callback:

```env
# Produção
GOOGLE_CALLBACK_URL=https://seu-dominio.com/api/auth/google/callback
MICROSOFT_CALLBACK_URL=https://seu-dominio.com/api/auth/microsoft/callback
FRONTEND_URL=https://seu-dominio.com
```

E atualize as configurações nos portais do Google e Microsoft com as URLs de produção.

## Testando

1. Configure todas as variáveis de ambiente
2. Reinicie o servidor
3. Clique em "Google" ou "Microsoft" na página de login
4. Faça login com sua conta
5. Você será redirecionado de volta para o dashboard

## Segurança

- **Nunca** commite o arquivo `.env` no repositório
- Use variáveis de ambiente diferentes para desenvolvimento e produção
- Mantenha os client secrets seguros
- Revise regularmente as permissões OAuth concedidas

