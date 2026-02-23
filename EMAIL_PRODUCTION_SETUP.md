# Configuração de Email para Produção (Render)

O Gmail SMTP pode ter problemas de conectividade no Render devido a bloqueios de rede ou problemas com IPv6. **Recomendamos usar Resend** para produção, que é mais confiável e rápido.

## 🚀 Solução Recomendada: Resend (API REST)

### Por que Resend?
- ✅ Funciona via API HTTP (não precisa de SMTP)
- ✅ Não tem problemas de conectividade no Render
- ✅ Mais rápido e confiável
- ✅ Grátis até 3.000 emails/mês
- ✅ Não bloqueia conexões como Gmail

### Como Configurar:

1. **Crie uma conta no Resend**:
   - Acesse: https://resend.com
   - Crie uma conta gratuita
   - Vá em "API Keys" e crie uma nova chave

   

2. **Configure no Render**:
   - No painel do Render, vá em **Environment**
   - Adicione as variáveis:
     ```
     RESEND_API_KEY=re_xxxxxxxxxxxxx
     RESEND_FROM_EMAIL=noreply@seudominio.com
     ```
   - **⚠️ Para enviar para qualquer usuário**, você precisa usar um e-mail em um **domínio verificado** no Resend (veja passo 3). O endereço `onboarding@resend.dev` só pode enviar para o **e-mail da sua conta Resend** (modo teste).

3. **Domínio para enviar a qualquer usuário** – você pode usar um domínio pago ou um **domínio gratuito** (veja a seção abaixo).

---

## 🆓 Resend com domínio gratuito (eu.org)

Assim você mantém o Resend (grátis até 3.000 e-mails/mês) e usa um **subdomínio gratuito** para poder enviar para qualquer destinatário, sem pagar domínio.

### Passo 1: Registrar um subdomínio gratuito no eu.org

1. Acesse **https://nic.eu.org** e clique em **Sign-in or sign-up** (ou vá direto em **https://nic.eu.org/arf/**).
2. Crie uma conta (sign-up) e faça login.
3. Solicite um **subdomínio**. Exemplos de nome: `instametrics`, `meuapp`, `leonardo-projetos`. Você receberá um domínio como **`seudominio.eu.org`** (ex.: `instametrics.eu.org`).
4. A aprovação pode levar de algumas horas a alguns dias (eu.org é mantido por voluntários).
5. No painel do eu.org, anote onde você gerencia o **DNS** do seu subdomínio (registros TXT, CNAME, etc.). Você vai precisar adicionar os registros que o Resend mostrar.

### Passo 2: Adicionar o domínio no Resend

1. No **Resend**: [resend.com/domains](https://resend.com/domains) → **Add Domain**.
2. Informe o domínio que você obteve no eu.org (ex.: `instametrics.eu.org`) e confirme.
3. O Resend vai mostrar uma lista de **registros DNS** para você criar. Em geral são:
   - **TXT** (para verificação) – nome algo como `_resend`, valor algo como `resend-verification=xxxxx`
   - **TXT** (SPF) – nome `@` ou o domínio raiz, valor `v=spf1 include:_spf.resend.com ~all`
   - **CNAME** (DKIM) – nome algo como `resend._domainkey`, valor apontando para `resend._domainkey.resend.com`
4. **Copie exatamente** os nomes e valores que o Resend mostrar (eles podem variar por conta).

### Passo 3: Configurar os registros DNS no eu.org

1. No painel do **eu.org** (área de DNS do seu subdomínio), adicione **cada** registro que o Resend pediu:
   - Para **TXT**: crie um registro TXT com o nome e o valor indicados pelo Resend. (Se o eu.org pedir só o “subdomínio”, use o que o Resend mostrar sem o sufixo `.seudominio.eu.org`.)
   - Para **CNAME**: crie um CNAME com o nome e o destino que o Resend indicar.
2. Salve e aguarde a **propagação DNS** (de alguns minutos a algumas horas).
3. No Resend, use o botão **Verify** (ou “Verificar”) no domínio. Quando todos os registros forem encontrados, o domínio ficará **Verified**.

### Passo 4: Usar o e-mail do domínio no seu app

1. No **Render** (ou onde estiver o backend), configure:
   ```
   RESEND_API_KEY=re_sua_chave_aqui
   RESEND_FROM_EMAIL=noreply@seudominio.eu.org
   ```
   Troque `seudominio.eu.org` pelo domínio que você registrou e verificou (ex.: `noreply@instametrics.eu.org`).
2. Faça **redeploy** do serviço.
3. A partir daí, a recuperação de senha poderá ser enviada para **qualquer e-mail**, não só o da sua conta Resend.

### Observações

- **eu.org** é gratuito e permite que você gerencie DNS (TXT, CNAME, etc.), necessário para o Resend.
- Se o eu.org demorar para aprovar o subdomínio, você pode procurar outras opções de subdomínio gratuito com DNS (por exemplo, alguns serviços “free DNS” ou “dynamic DNS” que permitem TXT/CNAME).
- **Só para teste** (sem domínio): com `onboarding@resend.dev`, o Resend aceita envio **apenas** para o e-mail da sua conta Resend. Qualquer outro destinatário retorna **403**.

---

## 📧 Outlook / Microsoft 365 SMTP (alternativa gratuita, sem domínio)

Funciona com conta **Outlook.com** ou **Microsoft 365** (ex.: `@outlook.com`, `@hotmail.com`, `@live.com`). Não exige domínio próprio e você pode enviar para **qualquer destinatário**. Em muitos casos funciona melhor que Gmail em hospedagens como o Render.

### Configuração no Render (ou no seu .env)

No **Environment** do seu serviço, defina **apenas** estas variáveis (não use `RESEND_API_KEY` para que o app use SMTP):

```
EMAIL_USER=seu-email@outlook.com
EMAIL_PASS=xxxx-xxxx-xxxx-xxxx
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
```

Substitua:
- `seu-email@outlook.com` pelo seu e-mail Microsoft (ex.: `leocc_etraud@outlook.com`).
- `EMAIL_PASS` pela **senha de app** (veja abaixo).

### Como gerar a senha de app (Microsoft)

1. Acesse **https://account.microsoft.com/security** e faça login na sua conta Microsoft.
2. Ative a **verificação em duas etapas** (obrigatório para senhas de app):  
   **Segurança** → **Opções de segurança** → **Verificação em duas etapas** → ativar.
3. Volte em **Opções de segurança** e abra **Senhas de app** (ou acesse direto: **https://account.live.com/proofs/AppPassword**).
4. Clique em **Criar uma nova senha de app**. Dê um nome (ex.: "Insta Metrics") e confirme.
5. A Microsoft exibirá uma **senha de 16 caracteres** (às vezes em blocos tipo `xxxx-xxxx-xxxx-xxxx`). **Copie e guarde** – ela não será mostrada de novo.
6. Use essa senha exatamente no `EMAIL_PASS` (pode colar com ou sem os hífens).

### Observações

- **Conta pessoal** (Outlook.com, Hotmail): use `EMAIL_HOST=smtp-mail.outlook.com` e `EMAIL_PORT=587`.
- **Conta Microsoft 365 / Exchange corporativa**: em alguns casos o administrador precisa permitir SMTP ou usar **smtp.office365.com** e porta **587**; confirme com a documentação da sua organização.
- Para o backend usar **Outlook em vez do Resend**, não defina `RESEND_API_KEY` no Environment (ou remova essa variável) e faça **redeploy**.
- Se aparecer erro de autenticação (EAUTH), confira se a verificação em duas etapas está ativa e se está usando a **senha de app**, não a senha normal da conta.

---

## 📧 Gmail SMTP (pode ter problemas no Render)

Se preferir usar Gmail, configure no Render:

```
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app-do-google
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

### ⚠️ Problemas Comuns com Gmail no Render:
- **ENETUNREACH**: Render pode bloquear conexões SMTP
- **Timeout**: Conexões podem demorar muito
- **IPv6**: Problemas com resolução de DNS

### Como Gerar Senha de App do Google:
1. Acesse: https://myaccount.google.com/apppasswords
2. Selecione "Mail" e "Other (Custom name)"
3. Digite "Insta Metrics"
4. Copie a senha gerada (16 caracteres)
5. Use essa senha no `EMAIL_PASS`

## 🔧 Troubleshooting – Não estou recebendo o e-mail

Se o código de recuperação não chega na caixa de entrada:

1. **Confirme as variáveis no Render**
   - No painel do serviço → **Environment**: deve existir `RESEND_API_KEY` (começa com `re_`) e `RESEND_FROM_EMAIL` (ex.: `onboarding@resend.dev`).
   - Após alterar variáveis, faça **redeploy** para carregar as novas env.

2. **Veja os logs do Render**
   - Após solicitar “Esqueci minha senha”, abra **Logs** do serviço no Render.
   - Se estiver usando Resend corretamente, deve aparecer:
     - `📧 ✅ Usando Resend API para envio de email`
     - `✅ [RESEND API] Email enviado com sucesso` e um **Message ID**.
   - Se aparecer `❌ [RESEND API] Falha no envio (HTTP ...)` ou `RESEND API ERROR`, o problema é na API (chave inválida, domínio não verificado, etc.).

3. **Painel do Resend**
   - Acesse [resend.com](https://resend.com) → **Emails**.
   - Verifique se o e-mail aparece como enviado e o status (entregue, bounce, etc.).
   - Se não aparecer nenhum envio, a requisição não está chegando ao Resend (env vars ou rede).

4. **Caixa de spam e e-mail de teste**
   - Confira a pasta de **spam/lixo eletrônico** do destinatário.
   - Teste primeiro com o **mesmo e-mail** que você usou para criar a conta no Resend (evita bloqueios de domínio em teste).

5. **Erro 403: "You can only send testing emails to your own email address"**
   - Isso acontece quando você usa `from: onboarding@resend.dev` e envia para um e-mail **diferente** do e-mail da sua conta Resend.
   - **Solução**: verifique um domínio no Resend (passo 3 acima) e use `RESEND_FROM_EMAIL=noreply@seudominio.com`. Depois disso você pode enviar para qualquer destinatário.

## 🔍 Verificando se Está Funcionando

Após configurar, verifique os logs do Render ao solicitar recuperação de senha:

**Com Resend (sucesso)**:
```
📧 Usando Resend API para envio de email
✅ [RESEND API] Email enviado com sucesso
📧 Message ID: xxxxx
```

**Com Gmail SMTP (pode falhar)**:
```
📧 Configurando SMTP:
   Host: smtp.gmail.com
   Port: 587
✅ [EMAIL] Código de recuperação enviado para...
```

**Erro comum (Gmail bloqueado)**:
```
❌ [EMAIL ERROR] Falha ao enviar email
- Código: ESOCKET
- Mensagem: connect ENETUNREACH
```

## 💡 Recomendação Final

**Use Resend para produção**. É gratuito, confiável e não tem os problemas de conectividade do Gmail SMTP em serviços como Render.

### 📌 Resumo sobre Domínios:

- Com **`onboarding@resend.dev`**: você só pode enviar para o **e-mail da sua conta Resend**. Qualquer outro destinatário → **403**.
- Para **produção** (enviar para qualquer usuário): é **obrigatório** verificar um domínio no Resend e usar um `from` nesse domínio (ex.: `noreply@seudominio.com`).
- **Sem pagar domínio**: use um subdomínio gratuito (ex.: **eu.org** – veja a seção “Resend com domínio gratuito (eu.org)” acima), configure os DNS no eu.org e verifique o domínio no Resend.

### 🎯 Configuração para produção (com usuários reais):

```
RESEND_API_KEY=re_sua_chave_aqui
RESEND_FROM_EMAIL=noreply@seudominio.com
```

(O domínio do e-mail acima deve estar verificado em [resend.com/domains](https://resend.com/domains).)

