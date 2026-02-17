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
     RESEND_FROM_EMAIL=onboarding@resend.dev
     ```
   - **✅ Você NÃO precisa de domínio próprio!** O Resend oferece `onboarding@resend.dev` gratuitamente para testes e produção
   - **Opcional**: Se tiver um domínio próprio, pode verificá-lo no Resend e usar `noreply@seudominio.com`

3. **Usar Domínio Próprio (Opcional - NÃO é necessário)**:
   - Se você tiver um domínio próprio (comprado em registradores como Namecheap, GoDaddy, etc.)
   - No Resend, vá em "Domains"
   - Adicione seu domínio
   - Configure os registros DNS conforme instruções
   - Após verificado, use: `RESEND_FROM_EMAIL=noreply@seudominio.com`
   - **Nota**: O Resend NÃO oferece domínios gratuitos, mas você pode usar `onboarding@resend.dev` sem precisar de domínio próprio

## 📧 Solução Alternativa: Gmail SMTP (Pode ter problemas)

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

- ❌ **Resend NÃO oferece domínios gratuitos**
- ✅ **Mas você pode usar `onboarding@resend.dev` GRATUITAMENTE** sem precisar de domínio próprio
- ✅ **Funciona perfeitamente para produção** - não é apenas para testes
- 🔄 **Opcional**: Se você já tiver um domínio próprio (comprado em outro lugar), pode verificá-lo no Resend para usar emails personalizados

### 🎯 Configuração Mínima (Sem Domínio Próprio):

```
RESEND_API_KEY=re_sua_chave_aqui
RESEND_FROM_EMAIL=onboarding@resend.dev
```

Isso é tudo que você precisa! Funciona imediatamente sem precisar configurar DNS ou verificar domínios.

