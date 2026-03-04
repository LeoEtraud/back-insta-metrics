# Análise do app (App Review) – Valdeci Insights / Insta Metrics

Passo a passo para enviar o app para análise da Meta e conseguir aprovação das permissões.

---

## Permissões que o Insta Metrics realmente usa

O backend do Insta Metrics solicita apenas estas 4 permissões:

| Permissão | Uso no app |
|-----------|------------|
| `pages_show_list` | Listar páginas do Facebook do usuário para encontrar a vinculada ao Instagram |
| `pages_read_engagement` | Ler engajamento da página (necessário para fluxo da Meta) |
| `instagram_basic` | Acessar perfil básico e username da conta Instagram |
| `instagram_manage_insights` | Ler métricas e insights dos posts (curtidas, comentários, alcance etc.) |

Se no painel aparecerem outras (ex.: `instagram_manage_messages`, `instagram_content_publish`, `business_management`), você pode **remover** as que o app não usa para simplificar a análise. Não é obrigatório; a Meta pode aprovar só o que for necessário.

---

## O que fazer antes de enviar

### 1. Configurações básicas do app (Configurações → Básico)

- **Ícone do app:** enviado e dentro das regras da Meta.
- **URL da Política de Privacidade:** link público (ex.: `https://seu-dominio.com/politica-de-privacidade`) explicando como você usa dados do Facebook/Instagram.
- **URL dos Termos de Uso:** se o painel exigir, preencha também.
- **Domínio do app:** domínio do seu frontend (ex.: `insta-metrics.vercel.app` ou seu domínio), sem `https://` nem barra final.

### 2. Casos de uso (Análise do app → Novas solicitações)

Para cada permissão que for enviar:

- Clique em **“Em 1 caso de uso”** (ou no nome da permissão).
- Descreva de forma clara:
  - **O que o app faz:** dashboard de métricas do Instagram para a empresa do usuário.
  - **Como a permissão é usada:** por exemplo, “Usamos `instagram_manage_insights` para exibir no dashboard métricas de posts (curtidas, comentários, alcance) da conta Instagram Profissional vinculada à Página do Facebook do usuário.”
- Se a Meta pedir **vídeo de demonstração** ou **capturas de tela**, grave um fluxo curto: login → Conectar Instagram → tela do dashboard com métricas. Hospede no YouTube (não listado ou público) e cole o link onde for solicitado.
- Siga as **Diretrizes de Uso** de cada permissão (link “Diretrizes de Uso” ao lado).

### 3. Instruções para o revisor (se houver campo)

Em geral a Meta pede:

- **Como testar o app:**  
  “O revisor deve criar uma conta no Insta Metrics (ou usar credenciais de teste se fornecidas), ir em Configurações → Integração Instagram → Conectar Instagram, autorizar com uma conta Facebook que tenha Página e Instagram Profissional vinculados, e em seguida acessar o Dashboard para ver as métricas dos posts.”
- **Credenciais de teste (se solicitado):** e-mail e senha de uma conta de teste que tenha Instagram Business/Creator vinculado a uma Página.

---

## Ordem sugerida

1. **Configurações → Básico:** ícone, política de privacidade, termos (se exigido), domínio.
2. **Análise do app:** para cada permissão em “Novas solicitações”, abrir o caso de uso, preencher descrição e mídia (vídeo/screenshots) conforme as diretrizes.
3. **(Opcional)** Remover da submissão permissões que o Insta Metrics não usa (ícone de lixeira ao lado), para reduzir escopo da análise.
4. Procurar na mesma página o botão **“Enviar para análise”** ou **“Submeter aplicativo”** (pode estar no topo ou no final da lista de solicitações) e clicar.
5. Aguardar o e-mail da Meta (dias ou poucas semanas). Se pedirem mais informações, responda pelo painel ou pelo e-mail indicado.

---

## Depois da aprovação

- O app poderá ser colocado **Ao vivo** (publicado).
- Qualquer usuário que autorizar o app poderá conectar o Instagram, sem precisar ser testador.
- Mantenha a política de privacidade e o funcionamento do app alinhados ao que foi descrito na análise.

Se quiser, na próxima etapa podemos redigir juntos o texto de um caso de uso (por exemplo para `instagram_manage_insights`) ou um rascunho de política de privacidade para o Insta Metrics.
