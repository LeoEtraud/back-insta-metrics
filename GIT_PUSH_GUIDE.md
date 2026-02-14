# Guia para Fazer Push no GitHub

## Problema de Autenticação

O commit foi feito com sucesso, mas o push falhou por falta de credenciais.

## Soluções

### Opção 1: Personal Access Token (Recomendado)

1. **Criar um Personal Access Token no GitHub:**
   - Acesse: https://github.com/settings/tokens
   - Clique em "Generate new token" → "Generate new token (classic)"
   - Dê um nome (ex: "Vercel Deploy")
   - Selecione escopos: `repo` (acesso completo aos repositórios)
   - Clique em "Generate token"
   - **COPIE O TOKEN** (você só verá uma vez!)

2. **Fazer push usando o token:**
   ```bash
   git push https://SEU_TOKEN@github.com/LeoEtraud/back-insta-metrics.git main
   ```
   Ou configure o Git para usar o token:
   ```bash
   git config --global credential.helper store
   git push
   # Quando pedir credenciais:
   # Username: LeoEtraud
   # Password: SEU_TOKEN (não sua senha!)
   ```

### Opção 2: GitHub CLI

```bash
# Instalar GitHub CLI (se não tiver)
# Ubuntu/Debian:
sudo apt install gh

# Autenticar
gh auth login

# Fazer push
git push
```

### Opção 3: Configurar SSH (Mais Seguro)

1. **Gerar chave SSH (se não tiver):**
   ```bash
   ssh-keygen -t ed25519 -C "seu-email@example.com"
   ```

2. **Adicionar chave ao ssh-agent:**
   ```bash
   eval "$(ssh-agent -s)"
   ssh-add ~/.ssh/id_ed25519
   ```

3. **Copiar chave pública:**
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```

4. **Adicionar no GitHub:**
   - Acesse: https://github.com/settings/keys
   - Clique em "New SSH key"
   - Cole a chave pública
   - Salve

5. **Mudar remote para SSH:**
   ```bash
   git remote set-url origin git@github.com:LeoEtraud/back-insta-metrics.git
   git push
   ```

## Status Atual

✅ **Commit feito com sucesso:**
- Commit: `1f51527` - "Configure Vercel serverless deployment"
- Arquivos adicionados:
  - `api/index.ts`
  - `vercel.json`
  - `VERCEL_DEPLOY.md`
  - Modificações em `src/routes/index.ts`, `src/services/db.ts`, `package.json`

⏳ **Aguardando push para o GitHub**

## Após o Push

O Vercel detectará automaticamente as mudanças e fará um novo deploy com as configurações serverless.

