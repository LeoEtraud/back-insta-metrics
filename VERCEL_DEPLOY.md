# Deploy no Vercel - Backend

## Configuração

O backend está configurado para funcionar no Vercel como serverless functions.

### Arquivos importantes:

1. **`vercel.json`** - Configuração do Vercel
2. **`api/index.ts`** - Entry point para serverless functions
3. **`package.json`** - Script `vercel-build` para gerar Prisma Client

### Variáveis de Ambiente Necessárias:

Configure no painel do Vercel:

- `DATABASE_URL` - URL de conexão do PostgreSQL
- `ACCESS_TOKEN_SECRET` - Secret para JWT access token
- `REFRESH_TOKEN_SECRET` - Secret para JWT refresh token
- `FRONTEND_URL` - URL do frontend (para CORS)
- `GOOGLE_CLIENT_ID` - (Opcional) Client ID do Google OAuth
- `GOOGLE_CLIENT_SECRET` - (Opcional) Client Secret do Google OAuth
- `GOOGLE_CALLBACK_URL` - (Opcional) Callback URL do Google OAuth
- `MICROSOFT_CLIENT_ID` - (Opcional) Client ID do Microsoft OAuth
- `MICROSOFT_CLIENT_SECRET` - (Opcional) Client Secret do Microsoft OAuth
- `MICROSOFT_CALLBACK_URL` - (Opcional) Callback URL do Microsoft OAuth
- `EMAIL_USER` - (Opcional) Email para envio de recuperação de senha
- `EMAIL_PASS` - (Opcional) Senha do email
- `EMAIL_HOST` - (Opcional) Host SMTP
- `EMAIL_PORT` - (Opcional) Porta SMTP

### Build Process:

1. O Vercel executa `npm run vercel-build` que gera o Prisma Client
2. O Vercel compila o `api/index.ts` usando `@vercel/node`
3. Todas as rotas são direcionadas para `api/index.ts`

### Notas:

- O Prisma Client é gerado durante o build
- O app Express é exportado como handler serverless
- As rotas funcionam normalmente através do Express
- Certifique-se de que o banco de dados está acessível do Vercel

