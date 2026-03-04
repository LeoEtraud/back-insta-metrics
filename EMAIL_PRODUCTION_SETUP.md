# Configuração de Email para Produção (Render)

O Gmail SMTP pode ter problemas de conectividade no Render devido a bloqueios de rede ou problemas com IPv6. **Recomendamos usar Resend** para produção, que é mais confiável e rápido.

## ⚠️ Recuperação de senha: e-mail não chega?

1. **No Render (Environment)** confira: `RESEND_API_KEY` (começa com `re_`) e `RESEND_FROM_EMAIL`.
2. **Se usar `onboarding@resend.dev`**: o Resend só envia para o **e-mail da sua conta Resend**. Para qualquer outro destinatário você receberá erro 403 e o e-mail não será enviado. **Solução**: verifique um domínio em [resend.com/domains](https://resend.com/domains) e use `RESEND_FROM_EMAIL=noreply@seudominio.com`.
3. **Logs**: ao solicitar recuperação, veja no log do Render se aparece `POST /api/auth/forgot-password`, `📧 Usando Resend API` e `✅ [RESEND API] Email enviado`. Se aparecer `❌ [RESEND API] Falha (HTTP 403)`, é o caso do item 2.

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

## 🆓 Resend com domínio gratuito (ou barato)

Assim você mantém o Resend (grátis até 3.000 e-mails/mês) e usa um **domínio** para poder enviar para qualquer destinatário.

### Opção A: FreeDNS (afraid.org) – subdomínio gratuito e interface que funciona

O [FreeDNS](https://freedns.afraid.org/) oferece subdomínios gratuitos com **controle total de DNS** (TXT, CNAME, MX), necessário para o Resend. A interface é mais moderna que a do eu.org.

1. Acesse **https://freedns.afraid.org/** e crie uma conta (Sign up).
2. Faça login e vá em **Subdomains** (ou **Domains**). Escolha um dos domínios compartilhados disponíveis (ex.: `moooo.com`, `ddns.net`) e registre um subdomínio (ex.: `instametrics.moooo.com`).
3. Na zona DNS do seu subdomínio, você poderá adicionar registros **TXT** e **CNAME**. Use esses campos para colar os valores que o Resend pedir (Passo 2 abaixo).
4. O domínio final será algo como **`instametrics.moooo.com`**. Use no Resend e em `RESEND_FROM_EMAIL=noreply@instametrics.moooo.com`.

### Opção B: eu.org (gratuito, site em HTML puro)

O [eu.org](https://nic.eu.org/) é um serviço antigo (só HTML, sem JavaScript). Use o guia detalhado abaixo.

### Opção C: Domínio pago barato (primeiro ano a partir de ~US$ 1)

Registradores como **Namecheap**, **Porkbun** ou **Cloudflare** vendem domínios (ex.: `.com`, `.xyz`) a preços baixos no primeiro ano. Você adiciona o domínio no Resend e configura os DNS no painel do registrador (TXT, CNAME). É a opção mais estável se você quiser um domínio “sério” (ex.: `instametrics.com`).

---

### Guia passo a passo: eu.org

Siga estes passos no [eu.org](https://nic.eu.org/) (site em HTML puro – use os links indicados).

1. **Criar conta**
   - Acesse **https://nic.eu.org/arf/**.
   - Clique em **Register** (ou em [contact/create](https://nic.eu.org/arf/en/contact/create/)).
   - Preencha o formulário (handle, e-mail, etc.) e envie. Você receberá um **handle** (identificador) e definirá uma senha.
   - Se já tiver conta, faça login com **Your handle** e **Your password** na mesma página.

2. **Escolher o nome do subdomínio**
   - No eu.org você não registra “eu.org” sozinho; escolhe um **subdomínio** dentro de um domínio aberto.
   - Lista de domínios abertos: [opendomains.html](https://nic.eu.org/opendomains.html). Exemplos: **NET.eu.org**, **US.eu.org**.
   - Exemplo: se escolher **NET.eu.org**, seu domínio pode ser **instametrics.net.eu.org** (subdomínio `instametrics` dentro de `net.eu.org`).
   - Anote o nome completo que você quer (ex.: `instametrics.net.eu.org`).

3. **Obter nameservers (DNS)**
   - O eu.org exige que você informe **nameservers** que já estejam (ou que você vá) configurar para esse nome.
   - Opção sugerida pelo eu.org: [GraniteCanyon](http://soa.granitecanyon.com/) (DNS gratuito). Crie lá uma zona para o domínio escolhido (ex.: `instametrics.net.eu.org`) e anote os nameservers (ex.: `ns1.granitecanyon.com`).
   - Outra opção: **Cloudflare** – adicione o site com o nome exato (ex.: `instametrics.net.eu.org`), use os nameservers que o Cloudflare mostrar.

4. **Pedir o domínio no eu.org**
   - Logado em **https://nic.eu.org/arf/**, procure o formulário para **request domain** / **new domain** (menu “Domain” ou “Registration”).
   - Informe o **nome completo** (ex.: `instametrics.net.eu.org`) e os **nameservers** (GraniteCanyon ou Cloudflare).
   - Envie o pedido. A aprovação é feita por voluntários e pode levar **alguns dias**. Você será avisado por e-mail.

5. **Depois da aprovação**
   - No painel de DNS (GraniteCanyon, Cloudflare, etc.), adicione os **registros que o Resend pedir** (Passos 2 e 3 desta seção): TXT (verificação), TXT (SPF), CNAME (DKIM).
   - No **Resend**: [resend.com/domains](https://resend.com/domains) → **Add Domain** → informe seu domínio (ex.: `instametrics.net.eu.org`) → **Verify**.
   - No **Render**: `RESEND_FROM_EMAIL=noreply@instametrics.net.eu.org` (e `RESEND_API_KEY`), depois **redeploy**.

Se o site do eu.org não abrir ou o formulário não aparecer, recarregue ou tente outro navegador; o site é só HTML e às vezes demora.

---

### Passo 1 (resumo): ter um domínio

Use **Opção A (FreeDNS)**, **B (eu.org)** ou **C (pago)**. Anote o domínio (ex.: `seudominio.moooo.com` ou `seudominio.net.eu.org`).

### Passo 2: Adicionar o domínio no Resend

1. No **Resend**: [resend.com/domains](https://resend.com/domains) → **Add Domain**.
2. Informe o domínio que você obteve (ex.: `instametrics.moooo.com` ou `instametrics.eu.org`) e confirme.
3. O Resend vai mostrar uma lista de **registros DNS** para você criar. Em geral são:
   - **TXT** (para verificação) – nome algo como `_resend`, valor algo como `resend-verification=xxxxx`
   - **TXT** (SPF) – nome `@` ou o domínio raiz, valor `v=spf1 include:_spf.resend.com ~all`
   - **CNAME** (DKIM) – nome algo como `resend._domainkey`, valor apontando para `resend._domainkey.resend.com`
4. **Copie exatamente** os nomes e valores que o Resend mostrar (eles podem variar por conta).

### Passo 3: Configurar os registros DNS no seu provedor

1. No painel de **DNS** do seu domínio (FreeDNS, eu.org ou registrador pago), adicione **cada** registro que o Resend pediu:
   - **TXT** (verificação): nome como `_resend`, valor como `resend-verification=xxxxx`.
   - **TXT** (SPF): nome `@` ou raiz do domínio, valor `v=spf1 include:_spf.resend.com ~all`.
   - **CNAME** (DKIM): nome como `resend._domainkey`, destino como `resend._domainkey.resend.com`.
2. (No FreeDNS, valores TXT devem ir entre aspas.)
3. Salve e aguarde a **propagação DNS** (minutos a algumas horas).
4. No Resend, clique em **Verify**. Quando todos os registros forem encontrados, o domínio ficará **Verified**.

### Passo 4: Usar o e-mail do domínio no seu app

1. No **Render** (ou onde estiver o backend), configure:
   ```
   RESEND_API_KEY=re_sua_chave_aqui
   RESEND_FROM_EMAIL=noreply@seudominio
   ```
   Troque `seudominio` pelo domínio que você verificou (ex.: `noreply@instametrics.moooo.com` ou `noreply@instametrics.eu.org`).
2. Faça **redeploy** do serviço.
3. A partir daí, a recuperação de senha poderá ser enviada para **qualquer e-mail**, não só o da sua conta Resend.

### Observações

- **FreeDNS** ([freedns.afraid.org](https://freedns.afraid.org/)): gratuito, suporta TXT e CNAME, interface utilizável.
- **eu.org** ([nic.eu.org](https://nic.eu.org/)): gratuito, mas o site é só HTML, sem JavaScript, e pode parecer quebrado; se não funcionar para você, use FreeDNS ou um domínio pago.
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

### ⚠️ Timeout no Render (Outlook SMTP)

Em hospedagens como o **Render**, a conexão SMTP com o Outlook pode **não completar a tempo** (timeout de 35+ segundos). Se isso acontecer, a opção estável é usar **Resend com domínio verificado** (veja a seção “Resend com domínio gratuito (eu.org)”). Resend usa API HTTP e não sofre com bloqueios de SMTP em cloud.

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

