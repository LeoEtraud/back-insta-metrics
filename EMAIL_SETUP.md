# Configuração de Email - Recuperação de Senha

Este documento explica como configurar o envio de emails para a funcionalidade de recuperação de senha.

## Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Configuração de Email
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

## Configuração para Gmail

1. **Habilitar Senha de App (Recomendado)**:
   - Acesse: https://myaccount.google.com/apppasswords
   - Gere uma senha de app específica para esta aplicação
   - Use essa senha no `EMAIL_PASS`

2. **Alternativa (Menos Segura)**:
   - Ative "Permitir aplicativos menos seguros" nas configurações da conta Google
   - Use sua senha normal no `EMAIL_PASS`

## Outros Provedores

### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=seu-api-key-do-sendgrid
```

### Outlook/Office 365
```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=seu-email@outlook.com
EMAIL_PASS=sua-senha
```

### Mailtrap (Desenvolvimento/Testes)
```env
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=seu-usuario-mailtrap
EMAIL_PASS=sua-senha-mailtrap
```

## Modo de Desenvolvimento (Sem Configuração)

Se as variáveis de ambiente não estiverem configuradas, o sistema funcionará em modo de desenvolvimento:
- O código será exibido no console do servidor
- Nenhum email real será enviado
- Útil para testes locais

## Testando

1. Configure as variáveis de ambiente
2. Reinicie o servidor
3. Solicite uma recuperação de senha
4. Verifique o console ou sua caixa de entrada

## Segurança

- **Nunca** commite o arquivo `.env` no repositório
- Use senhas de app ao invés de senhas principais
- Em produção, considere usar serviços especializados como SendGrid ou AWS SES

