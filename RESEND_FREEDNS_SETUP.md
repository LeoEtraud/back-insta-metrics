# Configuração Resend + FreeDNS (afraid.org)

Guia passo a passo para usar um subdomínio gratuito do FreeDNS com o Resend e enviar e-mails de recuperação de senha para qualquer destinatário.

---

## Passo 1: Criar conta no FreeDNS

1. Acesse **https://freedns.afraid.org/**
2. Clique em **Sign up Free**
3. Preencha o formulário e crie sua conta
4. Faça login

---

## Passo 2: Escolher domínio e criar subdomínio

1. Vá em **Domains** ou **Subdomains** no menu
2. Clique em **Registry** para ver domínios disponíveis
3. Escolha um domínio **public** (ex.: `mooo.com`, `crabdance.com`, `ddns.net`)
4. Clique no nome do domínio para criar seu subdomínio
5. Crie o subdomínio **instametrics** (ou outro nome disponível)
6. Seu domínio será: **instametrics.mooo.com** (ou instametrics.crabdance.com, etc.)

**Importante:** Anote o domínio exato. Exemplo: `instametrics.mooo.com`

---

## Passo 3: Adicionar domínio no Resend

1. Acesse **https://resend.com/domains**
2. Clique em **Add Domain**
3. Digite seu domínio: `instametrics.mooo.com`
4. Escolha a região (ex.: São Paulo - sa-east-1)
5. Resend mostrará os registros DNS necessários (DKIM, MX, SPF)
6. **Copie os valores exatos** de cada registro (use o ícone de copiar)

---

## Passo 4: Adicionar registros DNS no FreeDNS

No FreeDNS, você precisa criar registros para subdomínios do seu domínio. Para `instametrics.mooo.com`, os hosts serão:

- `resend._domainkey.instametrics` → registros DKIM
- `send.instametrics` → MX e TXT (SPF)

Vá em **Subdomains** e adicione cada registro:

### 4.1 – Registro DKIM (TXT)

| Campo       | Valor                                                       |
|-------------|-------------------------------------------------------------|
| **Type**    | TXT                                                         |
| **Subdomain** | `resend._domainkey.instametrics`                          |
| **Domain**  | mooo.com                                                    |
| **Destination** | Cole a chave do Resend (com aspas, ex.: `"p=MIGfMA0GCSqG..."`) |

### 4.2 – Registro MX (envio de e-mail)

| Campo       | Valor                                                       |
|-------------|-------------------------------------------------------------|
| **Type**    | MX                                                          |
| **Subdomain** | `send.instametrics`                                       |
| **Domain**  | mooo.com                                                    |
| **Destination** | O servidor que o Resend mostrar (ex.: `10 feedback-smtp.sa-east-1.amazonses.com` - Prioridade 10, espaço, depois o hostname) |

No FreeDNS, o formato do MX costuma ser: `prioridade destino` (ex.: `10 feedback-smtp.sa-east-1.amazonses.com`)

### 4.3 – Registro SPF (TXT)

| Campo       | Valor                                                       |
|-------------|-------------------------------------------------------------|
| **Type**    | TXT                                                         |
| **Subdomain** | `send.instametrics`                                       |
| **Domain**  | mooo.com                                                    |
| **Destination** | `"v=spf1 include:amazonses.com ~all"` (copie exatamente do Resend, com aspas) |

---

## Passo 5: Verificar no Resend

1. Aguarde 5–30 minutos para propagação DNS
2. No Resend, clique em **Verify** no domínio
3. Quando o status mudar para **Verified**, está pronto

---

## Passo 6: Configurar no Render

No painel do Render, em **Environment**, adicione ou edite:

```
RESEND_API_KEY=re_sua_chave_aqui
RESEND_FROM_EMAIL=noreply@instametrics.mooo.com
```

(substitua `instametrics.mooo.com` pelo domínio que você criou)

Depois faça **Redeploy** do serviço.

---

## Resumo dos hosts no FreeDNS

Se seu domínio for **instametrics.mooo.com** (subdomínio de mooo.com):

| Registro | Subdomain no FreeDNS        | Resultado                           |
|----------|-----------------------------|-------------------------------------|
| DKIM     | resend._domainkey.instametrics | resend._domainkey.instametrics.mooo.com |
| MX       | send.instametrics           | send.instametrics.mooo.com          |
| SPF      | send.instametrics           | send.instametrics.mooo.com          |

**Nota:** O campo "Subdomain" no FreeDNS aceita nomes compostos. Use exatamente como acima, substituindo `instametrics` se tiver usado outro nome e `mooo.com` se tiver escolhido outro domínio do registry.

---

## Troubleshooting

- **Registro não encontrado:** Confira se o "Subdomain" está correto (com pontos)
- **Valores não batem:** Copie novamente do Resend e confira aspas no TXT
- **Propagação lenta:** Use [mxtoolbox.com](https://mxtoolbox.com) para testar: `dig TXT resend._domainkey.instametrics.mooo.com`
