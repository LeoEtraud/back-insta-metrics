# Configuração Meta (Facebook) – Integração Instagram

Este guia ajuda a resolver o erro **"O Login do Facebook está indisponível para este app no momento"** ao conectar a conta do Instagram no Insta Metrics.

## Variáveis de ambiente

No `.env` do backend, configure:

```env
META_APP_ID=seu-app-id
META_APP_SECRET=seu-app-secret
META_CALLBACK_URL=https://seu-backend.com/api/auth/meta/callback

# URL do frontend (para redirecionar após o OAuth)
FRONTEND_URL=https://seu-frontend.com
```

Em desenvolvimento local:

```env
META_CALLBACK_URL=http://localhost:5000/api/auth/meta/callback
FRONTEND_URL=http://localhost:3000
```

---

## Por que o erro "Login do Facebook indisponível" aparece?

Geralmente é por uma destas razões:

1. **App em modo Desenvolvimento** – só testadores podem usar o Login.
2. **Produto "Facebook Login"** não adicionado ou mal configurado.
3. **URL de redirecionamento** diferente da configurada no painel da Meta.
4. **App não está "Ao vivo"** (para uso por qualquer usuário).

Siga os passos abaixo no [Meta for Developers](https://developers.facebook.com/).

---

## 1. Criar / usar um app no Meta for Developers

1. Acesse [developers.facebook.com](https://developers.facebook.com/) e entre com sua conta Facebook.
2. **Meus apps** → **Criar app** (ou escolha o app já usado pelo Insta Metrics).
3. Tipo: **Negócios** (Business) é o mais adequado para Instagram Business/Creator.

---

## 2. Adicionar o produto "Facebook Login"

1. No app, no menu lateral: **Produtos** → **Facebook Login** → **Configurações** (ou **Configurar**).
2. Em **Configurações do Facebook Login**:
   - **URIs de redirecionamento do OAuth válidos**: adicione **exatamente** a mesma URL que está em `META_CALLBACK_URL` no `.env`.
     - Exemplo local: `http://localhost:5000/api/auth/meta/callback`
     - Exemplo produção: `https://seu-dominio-backend.com/api/auth/meta/callback`
   - Não use barra no final (`/`) se no `.env` não tiver.
3. Salve as alterações.

---

## 3. Adicionar o produto "Instagram Graph API" (e permissões)

Para ler dados do Instagram (métricas, insights):

1. **Produtos** → adicione **Instagram Graph API** (ou **Instagram**, conforme o painel).
2. Em **Permissões e recursos** (ou **App Review**), verifique as permissões que o Insta Metrics usa:
   - `pages_show_list`
   - `pages_read_engagement`
   - `instagram_basic`
   - `instagram_manage_insights`

Se o app estiver em **Desenvolvimento**, essas permissões funcionam só para **roles de teste** (veja passo 4).

---

## 4. Modo Desenvolvimento vs Ao vivo

### Se o app está em **Desenvolvimento**

- Apenas **administradores, desenvolvedores e testadores** do app podem usar o Login do Facebook.
- Para você ou seu cliente poderem conectar o Instagram:
  - **Opção A:** Adicionar cada pessoa como **Testador**:
    - **Funções** → **Testadores** → **Adicionar testadores** e informe o Facebook (e-mail ou perfil) da pessoa que vai conectar o Instagram.
  - **Opção B:** Colocar o app **Ao vivo** (e, para algumas permissões, passar pela App Review da Meta).

### Para colocar o app **Ao vivo**

1. No painel do app: **Configurações** → **Básico**.
2. Preencha **Ícone do app**, **URL da Política de Privacidade**, **URL dos Termos de Uso** (se exigido).
3. No topo da página do app, altere o modo de **Desenvolvimento** para **Ao vivo**.

Assim, qualquer usuário que autorizar o app poderá usar o Login (respeitando permissões aprovadas na revisão).

---

## 5. Conferir configurações básicas do app

Em **Configurações** → **Básico**:

- **ID do app** → deve ser o mesmo que `META_APP_ID` no `.env`.
- **Chave secreta do app** → `META_APP_SECRET` (nunca exponha no frontend).
- **Domínios do app** (se aplicável): use o domínio do seu frontend (ex.: `seu-dominio.com`), sem `https://` nem barra final.

---

## 6. Checklist rápido

- [ ] Produto **Facebook Login** adicionado e **URIs de redirecionamento** iguais a `META_CALLBACK_URL`.
- [ ] Produto **Instagram** / **Instagram Graph API** adicionado.
- [ ] Em **Desenvolvimento**: usuário que conecta o Instagram está como **Testador** (ou admin/dev) do app.
- [ ] Em **Ao vivo**: app com configurações básicas preenchidas e modo "Ao vivo" ativado.
- [ ] `.env` com `META_APP_ID`, `META_APP_SECRET` e `META_CALLBACK_URL` corretos e backend reiniciado após mudanças.

---

## 7. Testando

1. Reinicie o backend após alterar o `.env`.
2. No frontend, vá em **Configurações** → **Integração Instagram** → **Conectar Instagram**.
3. Você deve ser redirecionado para o Facebook, autorizar o app e depois voltar para as configurações com a conta Instagram conectada.

Se o erro continuar, confira no painel da Meta a aba **Ferramentas** → **Log de erros** para ver mensagens específicas do Login.
