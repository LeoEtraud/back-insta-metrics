# Conexão Instagram – Passo a passo (Valdeci Insights)

Siga esta ordem para concluir a conexão do Insta Metrics com a conta Instagram em produção.

---

## Parte 1: Meta for Developers (app Valdeci Insights)

### Passo 1 – Abrir o app
1. Acesse [developers.facebook.com](https://developers.facebook.com/) e faça login.
2. Em **Meus apps**, clique no app **Valdeci Insights** (ID: use o que aparece no painel).

### Passo 2 – Adicionar o produto Facebook Login
1. No menu lateral esquerdo, clique em **Produtos** (ou **Adicionar produto**).
2. Procure **Facebook Login** e clique em **Configurar** (ou **Configurar** ao lado).
3. Escolha **Web** como plataforma (se perguntado).
4. Vá em **Facebook Login** → **Configurações** (no menu lateral, dentro do produto).

### Passo 3 – Configurar a URL de redirecionamento (OBRIGATÓRIO)
1. Na seção **URIs de redirecionamento do OAuth válidos**, clique em **Adicionar URI**.
2. Adicione **exatamente** esta URL (produção no Render):

   ```
   https://back-insta-metrics.onrender.com/api/auth/meta/callback
   ```

3. **Não** coloque barra no final. **Não** use `http` — use `https`.
4. Clique em **Salvar alterações**.

### Passo 4 – Adicionar o produto Instagram (métricas)
1. No menu lateral, em **Produtos**, veja se já existe **Instagram Graph API** ou **Instagram**.
2. Se não existir: **Adicionar produto** → **Instagram Graph API** (ou **Instagram**) → **Configurar**.
3. Não é necessário configurar nada extra aqui; o Insta Metrics usa as permissões padrão em modo desenvolvimento.

### Passo 5 – Quem pode conectar? (app em “Em desenvolvimento”)
O app está em **Em desenvolvimento**, então só estas pessoas podem usar o Login do Facebook (e conectar o Instagram):

- **Administradores** do app (você já é).
- **Desenvolvedores** do app.
- **Testadores** que você adicionar.

**Para o usuário que vai conectar o Instagram (ex.: valdeci_aluminio / eocc.etraud@outlook.com):**

1. No menu lateral: **Funções** (ou **Roles**).
2. Abra **Testadores**.
3. Clique em **Adicionar testadores**.
4. Digite o **e-mail da conta Facebook** dessa pessoa (a mesma que usa no Facebook/Instagram) ou o nome do perfil e adicione.
5. A pessoa receberá um convite; ela precisa **aceitar** para poder usar o Login.

**Alternativa:** Se quiser que qualquer usuário conecte sem ser testador, você precisará colocar o app **Ao vivo** (Passo 6).

### Passo 6 – (Opcional) Colocar o app “Ao vivo”
Só faça se quiser que qualquer pessoa conecte o Instagram sem ser testadora.

1. **Configurações** → **Básico**.
2. Preencha:
   - **Ícone do app**
   - **URL da Política de Privacidade** (obrigatório para ir ao vivo)
   - **URL dos Termos de Uso** (se o painel exigir)
3. No **topo** da página do app, onde está “Em desenvolvimento”, mude para **Ao vivo** (ou **Alterar modo**).

---

## Parte 2: Backend (Render / .env)

### Passo 7 – Variáveis de ambiente em produção
No **Render** (ou onde o backend está hospedado), nas variáveis de ambiente do serviço **back-insta-metrics**, confira ou defina:

| Variável           | Valor (exemplo produção) |
|--------------------|---------------------------|
| `META_APP_ID`      | ID do app “Valdeci Insights” (em Configurações → Básico) |
| `META_APP_SECRET`  | Chave secreta do app (Configurações → Básico → “Chave secreta do app”) |
| `META_CALLBACK_URL`| `https://back-insta-metrics.onrender.com/api/auth/meta/callback` |
| `FRONTEND_URL`     | URL do seu frontend em produção (ex.: `https://insta-metrics.vercel.app` ou o domínio que você usa) |

- **META_APP_ID:** no painel do app → **Configurações** → **Básico** → “ID do aplicativo”.
- **META_APP_SECRET:** mesmo lugar → “Chave secreta do app” (mostrar e copiar).

A `META_CALLBACK_URL` **deve ser exatamente** a mesma URL que você colocou no Passo 3 (Facebook Login → URIs de redirecionamento).

### Passo 8 – Reiniciar o backend
Depois de salvar as variáveis no Render, faça um **redeploy** ou **restart** do serviço para carregar o novo `.env`.

---

## Parte 3: Testar a conexão

### Passo 9 – Conectar no Insta Metrics
1. Abra o **frontend em produção** (onde está a tela de Configurações).
2. Faça login com o usuário que vai vincular o Instagram (ex.: valdeci_aluminio).
3. Vá em **Configurações** → **Integração Instagram**.
4. Confirme que a conta Instagram é **Profissional** (Business ou Creator) e está **vinculada a uma Página do Facebook** da qual você é admin.
5. Clique em **Conectar Instagram**.
6. Você deve ser redirecionado para o **Facebook**, autorizar o app “Valdeci Insights” e depois voltar para Configurações com a mensagem de sucesso e o @ da conta conectada.

### Se ainda der “Login do Facebook indisponível”
- Confirme que a conta que está logada no Insta Metrics é **testadora** (ou admin/dev) do app “Valdeci Insights” e que **aceitou** o convite.
- Confirme que a **META_CALLBACK_URL** no Render é **idêntica** à URL em Facebook Login → URIs de redirecionamento (incluindo `https`, sem barra no final).
- Veja **Ferramentas** → **Log de erros** no painel da Meta para mensagens específicas.

---

## Resumo da ordem

1. Abrir **Valdeci Insights** no Meta for Developers.  
2. Adicionar **Facebook Login** e configurar **URIs de redirecionamento** com `https://back-insta-metrics.onrender.com/api/auth/meta/callback`.  
3. Adicionar **Instagram Graph API** (ou Instagram).  
4. Adicionar como **Testador** o usuário que vai conectar (ou colocar o app Ao vivo).  
5. Configurar **META_APP_ID**, **META_APP_SECRET**, **META_CALLBACK_URL** e **FRONTEND_URL** no Render.  
6. Fazer **redeploy/restart** do backend.  
7. Em produção, **Configurações** → **Conectar Instagram** e testar.

Quando seguir até o Passo 9 e concluir o teste, a conexão estará fechada.

---

## Se ainda der "Login do Facebook indisponível"

### 1. Conferir o que o backend está usando (produção)
Foi adicionado um endpoint de diagnóstico. **Logado como admin** no Insta Metrics, abra no navegador (ou use o frontend da mesma origem):

```
GET https://back-insta-metrics.onrender.com/api/auth/meta/check
```
(Envie o header `Authorization: Bearer SEU_ACCESS_TOKEN`)

A resposta mostra o `redirectUri` que o backend envia para o Facebook. Esse valor **tem que ser idêntico** ao que está em Meta for Developers → Login do Facebook → Configurações → URIs de redirecionamento (ex.: `https://back-insta-metrics.onrender.com/api/auth/meta/callback` **sem** `x` ou barra no final).

### 2. App em "Em desenvolvimento" – Testador
Se o app "Valdeci Insights" está em **Em desenvolvimento**, a conta do **Facebook** que clica em "Conectar Instagram" precisa ser **Testador** (ou Administrador/Desenvolvedor) do app:

- Meta for Developers → **Valdeci Insights** → **Funções** → **Testadores** → **Adicionar testadores**
- Use o **e-mail da conta Facebook** (não o do Instagram) da pessoa que vai conectar
- A pessoa deve **aceitar o convite** (e-mail ou notificação no Facebook)

Se não for testador, o Facebook mostra "Login do Facebook está indisponível para este app".

### 3. Variáveis no Render
No painel do Render, confira as variáveis do serviço do backend:

- `META_CALLBACK_URL` = `https://back-insta-metrics.onrender.com/api/auth/meta/callback` (sem `x`, sem barra no final)
- `META_APP_ID` = ID do app "Valdeci Insights" (Configurações → Básico)
- `META_APP_SECRET` = Chave secreta do mesmo app

Depois de alterar, faça **Redeploy** do serviço.

### 4. Só uma URI em "URIs de redirecionamento"
No Meta, na lista **URIs de Redirecionamento do OAuth Válidos**, deve existir **apenas** a URL correta. Remova qualquer entrada com `callbackx` ou outra URL antiga.
