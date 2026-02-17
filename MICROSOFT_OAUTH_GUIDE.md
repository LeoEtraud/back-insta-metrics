# Guia Passo a Passo - Configuração Microsoft OAuth

## ✅ Compatibilidade com APIs Modernas

**Importante**: Esta implementação já utiliza as APIs modernas e recomendadas pela Microsoft:

- ✅ **Microsoft Graph API** (`https://graph.microsoft.com/v1.0/me`) - API moderna e suportada
- ✅ **Microsoft Identity Platform v2.0** - Endpoints modernos de autenticação
- ✅ **OAuth 2.0 Authorization Code Flow** - Fluxo padrão e seguro

**Não estamos usando**:
- ❌ Azure AD Graph API (descontinuada desde 30/06/2020)
- ❌ ADAL (Azure Active Directory Authentication Library - descontinuada)

A implementação atual está totalmente compatível com as recomendações atuais da Microsoft e não requer migração.

> **Nota**: Embora a Microsoft recomende MSAL (@azure/msal-node) para novos projetos, a implementação atual usando `passport-oauth2` com Microsoft Graph API também é válida e suportada. Se desejar migrar para MSAL no futuro, a biblioteca já está instalada no projeto.

## Passo 1: Acessar o Azure Portal e Criar um Diretório

1. **Acesse o Azure Portal**:
   - Vá para: https://portal.azure.com/
   - Faça login com sua conta Microsoft (pode ser conta pessoal ou corporativa)

2. **⚠️ IMPORTANTE - Se aparecer o erro "A capacidade de criar aplicativos fora de um diretório foi preterida"**:
   
   Isso significa que você precisa de um diretório (tenant) do Azure Active Directory. Você tem **3 opções**:

   ### Opção 1: Criar uma Assinatura Gratuita do Azure (Recomendado)
   
   1. **Acesse**: https://azure.microsoft.com/free/
   2. **Clique em "Iniciar gratuitamente"**
   3. **Faça login** com sua conta Microsoft
   4. **Preencha o formulário**:
      - Nome completo
      - Número de telefone
      - Cartão de crédito (não será cobrado, apenas para verificação)
   5. **Aguarde a criação da conta** (pode levar alguns minutos)
   6. **Após criar a conta**, você terá acesso ao Azure Active Directory
   7. **Volte para o Azure Portal** e tente registrar a aplicação novamente

   ### Opção 2: Microsoft 365 Developer Program (Gratuito)
   
   1. **Acesse**: https://developer.microsoft.com/microsoft-365/dev-program
   2. **Clique em "Join now"** ou "Participar agora"
   3. **Faça login** com sua conta Microsoft
   4. **Preencha o formulário** de inscrição
   5. **Aguarde a aprovação** (geralmente é instantânea)
   6. **Você receberá um ambiente de desenvolvimento** com Azure AD incluído
   7. **Acesse o Azure Portal** e tente registrar a aplicação novamente

   ### Opção 3: Usar Conta Corporativa/Escolar
   
   Se você tem uma conta corporativa ou escolar (@empresa.com, @escola.edu), ela já deve ter um diretório do Azure AD associado:
   
   1. **Faça login no Azure Portal** com sua conta corporativa/escolar
   2. **Se ainda aparecer o erro**, entre em contato com o administrador do Azure AD da sua organização
   3. **Peça permissão** para registrar aplicações

3. **Após ter um diretório do Azure AD**:
   - Você poderá registrar aplicações normalmente
   - O registro de aplicação é **gratuito** e não requer assinatura paga
   - Você terá acesso ao Azure Active Directory

## Passo 2: Registrar uma Aplicação no Azure Active Directory

1. **No Azure Portal, procure por "Azure Active Directory"**:
   - Use a barra de pesquisa no topo e digite "Azure Active Directory"
   - Ou vá para: https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps
   - ⚠️ **Certifique-se de estar no diretório correto** (verifique no canto superior direito)

2. **Clique em "App registrations" (Registros de aplicativo)**:
   - No menu lateral esquerdo, dentro de "Gerenciar"
   - Ou clique diretamente em "App registrations"

3. **Clique em "New registration" (+ Novo registro)**:
   - Botão azul no topo da página
   - ⚠️ **Se aparecer o erro sobre diretório**, volte ao Passo 1 e siga uma das opções para criar/obter um diretório

4. **Preencha o formulário de registro**:
   - **Name (Nome)**: `Insta Metrics` ou `insta-metrics`
     - ⚠️ **IMPORTANTE**: Use apenas letras, números, hífens (-) ou underscores (_)
     - Evite acentos e espaços
   
   - **Supported account types (Tipos de conta suportados)**:
     - Selecione: **"Accounts in any organizational directory and personal Microsoft accounts"**
     - Isso permite login com contas pessoais (@outlook.com, @hotmail.com) e contas corporativas
   
   - **Redirect URI (URI de redirecionamento)**:
     - **Platform**: Selecione "Web"
     - **URI**: `http://localhost:5000/api/auth/microsoft/callback`
     - ⚠️ **ATENÇÃO**: A URL deve ser EXATAMENTE esta (sem barra no final, sem espaços)

5. **Clique em "Register" (Registrar)**
   - Aguarde alguns segundos enquanto a aplicação é criada

## Passo 3: Copiar o Client ID (Application ID)

1. **Após o registro, você será redirecionado para a página "Overview" da aplicação**

2. **Localize a seção "Essentials"**:
   - Você verá várias informações importantes

3. **Copie o "Application (client) ID"**:
   - Este é o seu `MICROSOFT_CLIENT_ID`
   - ⚠️ **Anote este valor!** Você precisará dele no próximo passo

## Passo 4: Criar um Client Secret

1. **No menu lateral esquerdo da aplicação**, clique em:
   - "Certificates & secrets" (Certificados e segredos)
   - Ou "Certificados e segredos" em português

2. **Na seção "Client secrets"**, clique em:
   - "New client secret" (Novo segredo do cliente)
   - Ou "Novo segredo do cliente"

3. **Preencha o formulário**:
   - **Description (Descrição)**: `Insta Metrics Backend Secret`
   - **Expires (Expira em)**: Escolha "24 months" (24 meses) ou o período desejado
     - ⚠️ **IMPORTANTE**: Anote a data de expiração! Você precisará criar um novo secret antes que expire

4. **Clique em "Add" (Adicionar)**

5. **⚠️ ATENÇÃO CRÍTICA**: 
   - Uma janela mostrará o **"Value" (Valor)** do secret
   - **Este valor só aparece UMA VEZ!**
   - **COPIE IMEDIATAMENTE** antes de fechar a janela
   - Este é o seu `MICROSOFT_CLIENT_SECRET`
   - Se você perder este valor, precisará criar um novo secret

6. **Anote o valor em um local seguro** (você não conseguirá vê-lo novamente)

## Passo 5: Configurar Permissões da API (OBRIGATÓRIO)

⚠️ **IMPORTANTE**: Este passo é **OBRIGATÓRIO** para que a autenticação funcione corretamente!

1. **No menu lateral esquerdo**, clique em:
   - "API permissions" (Permissões de API)
   - Ou "Permissões de API"

2. **Verifique as permissões padrão**:
   - Você deve ver algumas permissões já configuradas:
     - `openid` (OpenID Connect sign-in)
     - `profile` (View users' basic profile)
     - `email` (View users' email address)
   - Essas são permissões básicas do OpenID Connect

3. **Adicione a permissão User.Read (OBRIGATÓRIO)**:
   - Clique em "Add a permission" (Adicionar uma permissão) ou "+ Adicionar uma permissão"
   - Na janela que abrir, selecione "Microsoft Graph"
   - Selecione "Delegated permissions" (Permissões delegadas)
   - Na lista de permissões, procure por "User.Read" ou "Read user profile"
   - Marque a caixa ao lado de "User.Read"
   - Clique em "Add permissions" (Adicionar permissões)

4. **Verifique se a permissão foi adicionada**:
   - Você deve ver "User.Read" na lista de permissões
   - O status deve mostrar "Not granted for [seu-tenant]" ou "Não concedida para [seu-tenant]"
   - Isso é normal - a permissão será concedida quando o usuário fizer login pela primeira vez

5. **⚠️ IMPORTANTE - Consentimento do Usuário**:
   - **Conta pessoal Microsoft**: O consentimento será solicitado automaticamente na primeira vez que o usuário fizer login
   - **Conta organizacional**: Pode ser necessário aprovação do administrador se a política da organização exigir
   - O usuário precisará clicar em "Accept" (Aceitar) na tela de consentimento

6. **Se você quiser que todos os usuários do seu tenant possam usar sem consentimento individual**:
   - Clique em "Grant admin consent for [seu-tenant]" (Conceder consentimento de administrador)
   - Isso só funciona se você for administrador do tenant
   - Isso é opcional - o consentimento individual também funciona

## Passo 6: Configurar Autenticação (Verificar Redirect URIs)

1. **No menu lateral esquerdo**, clique em:
   - "Authentication" (Autenticação)
   - Ou "Autenticação"

2. **Verifique a seção "Platform configurations"**:
   - Você deve ver a plataforma "Web" que você criou no Passo 2
   - Verifique se a Redirect URI está correta: `http://localhost:5000/api/auth/microsoft/callback`

3. **Na seção "Implicit grant and hybrid flows"**:
   - ✅ Marque "ID tokens" (Tokens de ID)
   - Isso permite que a aplicação receba tokens de ID do Azure AD

4. **Clique em "Save" (Salvar)** se fez alguma alteração

## Passo 7: Configurar Variáveis de Ambiente

1. **Abra o arquivo `.env`** no diretório `back-insta-metrics`

2. **Adicione as seguintes variáveis**:

```env
# Microsoft OAuth
MICROSOFT_CLIENT_ID=seu-application-client-id-aqui
MICROSOFT_CLIENT_SECRET=seu-client-secret-value-aqui
MICROSOFT_CALLBACK_URL=http://localhost:5000/api/auth/microsoft/callback

# Frontend URL (já deve existir)
FRONTEND_URL=http://localhost:3000
```

3. **Substitua**:
   - `seu-application-client-id-aqui` pelo Application (client) ID que você copiou no Passo 3
   - `seu-client-secret-value-aqui` pelo Value do Client Secret que você copiou no Passo 4

4. **⚠️ IMPORTANTE**:
   - Não adicione espaços antes ou depois do `=`
   - Não coloque aspas ao redor dos valores
   - Certifique-se de que não há espaços extras

## Passo 8: Testar a Configuração

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

4. **Clique no botão "Microsoft"**

5. **Você deve ser redirecionado para**:
   - Tela de login da Microsoft
   - Após login, autorização do aplicativo (se necessário)
   - Redirecionamento de volta para o dashboard

## Troubleshooting

### Erro: "A capacidade de criar aplicativos fora de um diretório foi preterida"

**Causa**: Você não tem um diretório (tenant) do Azure Active Directory associado à sua conta.

**Solução**: Você precisa criar ou obter um diretório do Azure AD. Siga uma das opções abaixo:

#### Solução 1: Criar Assinatura Gratuita do Azure (Mais Rápido - Recomendado)

1. **Acesse**: https://azure.microsoft.com/free/
2. **Clique em "Iniciar gratuitamente"** ou "Start free"
3. **Faça login** com sua conta Microsoft
4. **Preencha o formulário**:
   - Nome completo
   - Número de telefone (para verificação)
   - Cartão de crédito (não será cobrado, apenas para verificação de identidade)
   - Aceite os termos
5. **Aguarde a criação da conta** (pode levar 2-5 minutos)
6. **Após criar**, você terá:
   - ✅ 12 meses de serviços gratuitos
   - ✅ Crédito de $200 USD para usar em 30 dias
   - ✅ Acesso ao Azure Active Directory (gratuito)
7. **Volte para o Azure Portal** e tente registrar a aplicação novamente

**Vantagens**:
- Processo rápido (5-10 minutos)
- Crédito gratuito para testar outros serviços
- Acesso completo ao Azure AD

#### Solução 2: Microsoft 365 Developer Program (Gratuito)

1. **Acesse**: https://developer.microsoft.com/microsoft-365/dev-program
2. **Clique em "Join now"** ou "Participar agora"
3. **Faça login** com sua conta Microsoft
4. **Preencha o formulário**:
   - País/região
   - Empresa (pode ser pessoal)
   - Interesse principal
5. **Aguarde a aprovação** (geralmente instantânea)
6. **Você receberá**:
   - ✅ Ambiente de desenvolvimento do Microsoft 365
   - ✅ Azure AD incluído
   - ✅ Licenças do Office 365 para desenvolvimento
7. **Acesse o Azure Portal** e tente registrar a aplicação novamente

**Vantagens**:
- Totalmente gratuito
- Sem necessidade de cartão de crédito
- Ambiente de desenvolvimento completo

#### Solução 3: Usar Conta Corporativa/Escolar

Se você tem uma conta corporativa (@empresa.com) ou escolar (@escola.edu):

1. **Faça login no Azure Portal** com essa conta
2. **Se ainda aparecer o erro**, entre em contato com o administrador do Azure AD
3. **Peça permissão** para registrar aplicações no diretório da organização

**Nota**: Após obter um diretório, o registro de aplicações é **gratuito** e não requer assinatura paga.

### Erro: "redirect_uri_mismatch" ou "AADSTS50011"
- **Causa**: A Redirect URI no Azure não corresponde exatamente à URL configurada
- **Solução**:
  - Verifique no Azure Portal > Authentication > Redirect URIs
  - Certifique-se de que está exatamente: `http://localhost:5000/api/auth/microsoft/callback`
  - Sem barra no final, sem espaços, sem diferença de maiúsculas/minúsculas
  - Clique em "Save" após verificar

### Erro: "AADSTS7000215" ou "invalid_client"
- **Causa**: Client ID ou Client Secret incorretos
- **Solução**:
  - Verifique se o `MICROSOFT_CLIENT_ID` no `.env` está correto
  - Verifique se o `MICROSOFT_CLIENT_SECRET` no `.env` está correto
  - Certifique-se de que não há espaços extras nas variáveis
  - Se o secret expirou, crie um novo no Azure Portal

### Erro: "AADSTS65001" - Usuário não consentiu
- **Causa**: O usuário precisa consentir com as permissões da aplicação
- **Solução**:
  - Isso é normal na primeira vez
  - O usuário deve clicar em "Accept" (Aceitar) na tela de consentimento
  - Se estiver usando conta organizacional, pode precisar de aprovação do administrador

### Erro: 403 Forbidden ao buscar informações do usuário

- **Causa**: A aplicação não tem a permissão `User.Read` configurada ou o usuário não consentiu com as permissões
- **Solução**:
  1. **Verifique as permissões no Azure Portal**:
     - Vá para sua aplicação > "API permissions" (Permissões de API)
     - Certifique-se de que `User.Read` está na lista de permissões
     - Se não estiver, adicione seguindo o Passo 5 do guia
  2. **Verifique o consentimento**:
     - Na primeira vez, o usuário precisa clicar em "Accept" (Aceitar) na tela de consentimento
     - Se estiver usando conta organizacional, pode precisar de aprovação do administrador
  3. **Tente novamente**:
     - Faça logout e login novamente
     - Certifique-se de aceitar todas as permissões solicitadas

### Erro: "Email não encontrado no perfil da Microsoft"
- **Causa**: A conta Microsoft não tem email associado ou as permissões não foram concedidas
- **Solução**:
  - Verifique se a conta Microsoft tem um email válido
  - Verifique se as permissões `email` e `User.Read` estão configuradas no Azure Portal
  - Tente fazer logout e login novamente

### O botão não redireciona
- **Causa**: Servidor backend não está rodando ou URL incorreta
- **Solução**:
  - Verifique se o servidor backend está rodando na porta 5000
  - Verifique se a URL no frontend está correta: `getApiUrl("/api/auth/microsoft")`
  - Verifique os logs do backend para erros

### Erro: "Usuário não cadastrado"
- **Causa**: O email da conta Microsoft não está cadastrado no sistema
- **Solução**:
  - Você precisa cadastrar o usuário primeiro usando o formulário de registro
  - Após cadastrar, você pode usar o login social com Microsoft

## Para Produção

Quando for para produção, você precisará:

1. **Adicionar Redirect URI de produção no Azure Portal**:
   - Vá para Authentication > Redirect URIs
   - Adicione: `https://seu-dominio.com/api/auth/microsoft/callback`
   - Clique em "Save"

2. **Atualizar o `.env`**:
   ```env
   MICROSOFT_CALLBACK_URL=https://seu-dominio.com/api/auth/microsoft/callback
   FRONTEND_URL=https://seu-dominio.com
   ```

3. **Considerações de segurança**:
   - Use HTTPS em produção
   - Mantenha o Client Secret seguro (nunca commite no repositório)
   - Configure um Client Secret com expiração adequada
   - Revise regularmente as permissões OAuth concedidas

4. **Renovação do Client Secret**:
   - ⚠️ **IMPORTANTE**: Client Secrets expiram!
   - Antes da expiração, crie um novo secret no Azure Portal
   - Atualize o `MICROSOFT_CLIENT_SECRET` no `.env` de produção
   - Reinicie o servidor

## Recursos Adicionais

- **Documentação oficial do Microsoft Identity Platform**: https://docs.microsoft.com/en-us/azure/active-directory/develop/
- **Azure Portal**: https://portal.azure.com/
- **Microsoft Graph API**: https://docs.microsoft.com/en-us/graph/overview
- **Migração de ADAL para MSAL**: https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-node-migration

## Nota sobre MSAL

A Microsoft recomenda usar **MSAL (Microsoft Authentication Library)** para novos projetos. Embora nossa implementação atual usando `passport-oauth2` com Microsoft Graph API seja válida e suportada, você pode considerar migrar para MSAL no futuro.

A biblioteca `@azure/msal-node` já está instalada no projeto. Se desejar migrar:

1. **Vantagens do MSAL**:
   - Biblioteca oficial da Microsoft
   - Suporte ativo e atualizações regulares
   - Melhor integração com recursos avançados do Azure AD
   - Cache de tokens automático
   - Suporte a múltiplos fluxos de autenticação

2. **Implementação atual**:
   - ✅ Usa Microsoft Graph API (moderna)
   - ✅ Usa Microsoft Identity Platform v2.0 (moderna)
   - ✅ Compatível com recomendações atuais
   - ✅ Funcional e estável

A migração para MSAL é **opcional** e pode ser feita no futuro se você precisar de recursos avançados que o MSAL oferece.

