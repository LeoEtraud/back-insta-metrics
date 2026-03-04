import nodemailer from "nodemailer";

// ENVIA EMAIL VIA API RESEND (MAIS CONFIÁVEL PARA PRODUÇÃO)
const sendViaResendAPI = async (email: string, code: string): Promise<void> => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY não configurado");
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Insta Metrics <${fromEmail}>`,
      to: [email],
      subject: "Código de Recuperação de Senha - Insta Metrics",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: #fbbf24; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
              .code-box { background: #f3f4f6; border: 2px dashed #fbbf24; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
              .code { font-size: 32px; font-weight: bold; color: #1e293b; letter-spacing: 8px; font-family: 'Courier New', monospace; }
              .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #6b7280; }
              .warning { background: #fef3c7; border-left: 4px solid #fbbf24; padding: 15px; margin: 20px 0; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Insta Metrics</h1>
                <p>Código de Recuperação de Senha</p>
              </div>
              <div class="content">
                <p>Olá,</p>
                <p>Você solicitou a recuperação de senha para sua conta Insta Metrics.</p>
                <div class="code-box">
                  <p style="margin: 0 0 10px 0; color: #6b7280;">Seu código de verificação:</p>
                  <div class="code">${code}</div>
                </div>
                <div class="warning">
                  <strong>⚠️ Importante:</strong>
                  <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>Este código expira em <strong>15 minutos</strong></li>
                    <li>Não compartilhe este código com ninguém</li>
                    <li>Se você não solicitou esta recuperação, ignore este email</li>
                  </ul>
                </div>
                <p>Digite este código na página de recuperação de senha para continuar.</p>
              </div>
              <div class="footer">
                <p>Este é um email automático, por favor não responda.</p>
                <p>&copy; ${new Date().getFullYear()} Insta Metrics. Todos os direitos reservados.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        Insta Metrics - Código de Recuperação de Senha
        
        Olá,
        
        Você solicitou a recuperação de senha para sua conta Insta Metrics.
        
        Seu código de verificação: ${code}
        
        Este código expira em 15 minutos.
        
        Se você não solicitou esta recuperação, ignore este email.
        
        ---
        Este é um email automático, por favor não responda.
        © ${new Date().getFullYear()} Insta Metrics.
      `,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({})) as { message?: string; name?: string; statusCode?: number };
    const errorMsg = errorBody.message || errorBody.name || response.statusText;
    console.error(`❌ [RESEND API] Falha no envio (HTTP ${response.status}):`, JSON.stringify(errorBody));
    if (response.status === 403) {
      console.error(`💡 [RESEND 403] Com "onboarding@resend.dev" você só pode enviar para o e-mail da sua conta Resend. Para enviar para qualquer destinatário: adicione um domínio em https://resend.com/domains e use RESEND_FROM_EMAIL=noreply@seudominio.com`);
    }
    throw new Error(`Resend API error: ${errorMsg}`);
  }

  const data = await response.json() as { id: string };
  console.log(`✅ [RESEND API] Email enviado com sucesso`);
  console.log(`📧 Message ID: ${data.id}`);
};

// VERIFICA SE ESTÁ USANDO RESEND (SERVIÇO DE EMAIL MODERNO E CONFIÁVEL)
const isResendConfigured = (): boolean => {
  const apiKey = process.env.RESEND_API_KEY;
  const isConfigured = !!(apiKey && apiKey.trim().length > 0);
  const hasSmtp = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

  if (isConfigured) {
    console.log(`✅ [RESEND] API Key detectada (prefixo: ${apiKey.substring(0, 3)}...)`);
  } else if (!hasSmtp) {
    console.log(`⚠️  [RESEND] API Key NÃO detectada. Configure RESEND_API_KEY ou EMAIL_* para envio.`);
  }
  // Se hasSmtp: não loga aviso Resend (usuário escolheu SMTP de propósito)

  return isConfigured;
};

// CRIA TRANSPORTER PARA RESEND (RECOMENDADO PARA PRODUÇÃO)
const createResendTransporter = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }

  // Resend usa API REST, não SMTP tradicional
  // Mas podemos usar nodemailer com transporte customizado ou fazer requisição HTTP direta
  // Por enquanto, vamos usar SMTP do Resend se disponível
  const config = {
    host: "smtp.resend.com",
    port: 465,
    secure: true,
    auth: {
      user: "resend",
      pass: apiKey.trim(),
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  };

  console.log(`📧 Configurando Resend (recomendado para produção):`);
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Secure: ${config.secure}`);

  return nodemailer.createTransport(config);
};

// CRIA E CONFIGURA O TRANSPORTER DE EMAIL (NODEMAILER) COM AS CREDENCIAIS DAS VARIÁVEIS DE AMBIENTE
const createTransporter = () => {
  // Prioriza Resend se estiver configurado (mais confiável para produção)
  if (isResendConfigured()) {
    return createResendTransporter();
  }

  // Fallback para SMTP tradicional (Gmail, SendGrid, etc.)
  const emailUser = process.env.EMAIL_USER || "";
  const emailPass = process.env.EMAIL_PASS || "";
  const emailHost = process.env.EMAIL_HOST || "smtp.gmail.com";
  const emailPort = parseInt(process.env.EMAIL_PORT || "587", 10);

  // Se não houver configuração, retorna null (modo mock)
  if (!emailUser || !emailPass) {
    return null;
  }

  // Remove espaços da senha (caso tenha sido copiada com espaços)
  const cleanPassword = emailPass.trim().replace(/\s+/g, "");

  const config: any = {
    host: emailHost,
    port: emailPort,
    secure: emailPort === 465,
    auth: {
      user: emailUser.trim(),
      pass: cleanPassword,
    },
    // Configurações adicionais para produção
    tls: {
      rejectUnauthorized: false, // Permite conexões mesmo com certificados auto-assinados
      minVersion: "TLSv1.2",
    },
    // Força IPv4 para evitar problemas de conectividade no Render
    // O erro ENETUNREACH geralmente ocorre com IPv6
    family: 4, // Força uso de IPv4 ao invés de IPv6
    // Timeouts maiores para SMTP em cloud (Outlook/Gmail podem demorar do Render)
    connectionTimeout: 25000, // 25 segundos para conectar
    greetingTimeout: 25000,   // 25 segundos para greeting
    socketTimeout: 25000,     // 25 segundos para socket
    // Pool de conexões
    pool: false, // Desabilita pool para evitar problemas de conexão
  };

  console.log(`📧 Configurando SMTP:`);
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   User: ${config.auth.user}`);
  console.log(`   Secure: ${config.secure}`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);

  return nodemailer.createTransport(config);
};

// ENVIA EMAIL COM CÓDIGO DE RECUPERAÇÃO DE SENHA PARA O USUÁRIO - EM DESENVOLVIMENTO EXIBE NO CONSOLE
export const sendPasswordResetCode = async (
  email: string,
  code: string
): Promise<void> => {
  // Prioriza Resend API se estiver configurado (mais confiável para produção)
  if (isResendConfigured()) {
    try {
      console.log(`📧 Usando Resend API para envio de email`);
      await sendViaResendAPI(email, code);
      return;
    } catch (error: any) {
      console.error(`❌ [RESEND API ERROR] Falha ao enviar via Resend API: ${error.message}`);
      console.error(`💡 Tentando fallback para SMTP...`);
      // Continua para tentar SMTP como fallback
    }
  }

  const transporter = createTransporter();

  if (!transporter) {
    // Modo desenvolvimento - exibe código no console de forma destacada
    console.log("\n" + "=".repeat(80));
    console.log("🔧 MODO DESENVOLVIMENTO - Email não configurado");
    console.log("=".repeat(80));
    console.log(`📧 Email destinatário: ${email}`);
    console.log(`🔑 Código de recuperação: ${code}`);
    console.log(`⏰ Validade: 15 minutos`);
    console.log("\n💡 Para receber emails reais, configure as variáveis de ambiente:");
    console.log("   EMAIL_USER=seu-email@gmail.com");
    console.log("   EMAIL_PASS=sua-senha-de-app");
    console.log("   EMAIL_HOST=smtp.gmail.com");
    console.log("   EMAIL_PORT=587");
    console.log("=".repeat(80) + "\n");
    return;
  }

  // Define o remetente baseado no serviço usado
  const fromEmail = isResendConfigured() 
    ? (process.env.RESEND_FROM_EMAIL || process.env.EMAIL_USER || "noreply@resend.dev")
    : process.env.EMAIL_USER;

  const mailOptions = {
    from: `"Insta Metrics" <${fromEmail}>`,
    to: email,
    subject: "Código de Recuperação de Senha - Insta Metrics",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
              color: #fbbf24;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #ffffff;
              padding: 30px;
              border: 1px solid #e5e7eb;
              border-top: none;
            }
            .code-box {
              background: #f3f4f6;
              border: 2px dashed #fbbf24;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .code {
              font-size: 32px;
              font-weight: bold;
              color: #1e293b;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
            }
            .footer {
              background: #f9fafb;
              padding: 20px;
              text-align: center;
              border-radius: 0 0 10px 10px;
              font-size: 12px;
              color: #6b7280;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #fbbf24;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Insta Metrics</h1>
              <p>Código de Recuperação de Senha</p>
            </div>
            <div class="content">
              <p>Olá,</p>
              <p>Você solicitou a recuperação de senha para sua conta Insta Metrics.</p>
              
              <div class="code-box">
                <p style="margin: 0 0 10px 0; color: #6b7280;">Seu código de verificação:</p>
                <div class="code">${code}</div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>Este código expira em <strong>15 minutos</strong></li>
                  <li>Não compartilhe este código com ninguém</li>
                  <li>Se você não solicitou esta recuperação, ignore este email</li>
                </ul>
              </div>
              
              <p>Digite este código na página de recuperação de senha para continuar.</p>
            </div>
            <div class="footer">
              <p>Este é um email automático, por favor não responda.</p>
              <p>&copy; ${new Date().getFullYear()} Insta Metrics. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Insta Metrics - Código de Recuperação de Senha
      
      Olá,
      
      Você solicitou a recuperação de senha para sua conta Insta Metrics.
      
      Seu código de verificação: ${code}
      
      Este código expira em 15 minutos.
      
      Se você não solicitou esta recuperação, ignore este email.
      
      ---
      Este é um email automático, por favor não responda.
      © ${new Date().getFullYear()} Insta Metrics.
    `,
  };

  try {
    // Envia email diretamente sem verificar conexão primeiro (mais rápido)
    // Em cloud (ex.: Render), SMTP para Outlook/Gmail pode demorar; timeout generoso
    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutMs = 35000; // 35 segundos (conexão + envio)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: envio de email excedeu ${timeoutMs / 1000} segundos`)), timeoutMs)
    );

    const info = await Promise.race([sendPromise, timeoutPromise]);
    
    console.log(`✅ [EMAIL] Código de recuperação enviado para ${email}`);
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📬 Response: ${info.response}`);
  } catch (error: any) {
    console.error("\n❌ [EMAIL ERROR] Falha ao enviar email");
    console.error(`📧 Destinatário: ${email}`);
    console.error(`🔑 Código gerado: ${code}`);
    console.error(`\nDetalhes do erro:`);
    console.error(`- Mensagem: ${error.message}`);
    console.error(`- Código: ${error.code || "N/A"}`);
    console.error(`- Comando: ${error.command || "N/A"}`);
    console.error(`- Response: ${error.response || "N/A"}`);
    
    if (error.code === "EAUTH") {
      console.error("\n⚠️  Erro de autenticação!");
      console.error("Verifique se:");
      console.error("1. EMAIL_USER está correto");
      console.error("2. EMAIL_PASS é uma senha de app válida (não a senha normal)");
      console.error("3. A senha de app foi gerada corretamente no Google");
    }
    
    if (error.code === "ECONNECTION" || error.code === "ETIMEDOUT") {
      console.error("\n⚠️  Erro de conexão!");
      console.error("Verifique se:");
      console.error("1. EMAIL_HOST está correto (smtp.gmail.com)");
      console.error("2. EMAIL_PORT está correto (587)");
      console.error("3. Sua conexão com a internet está funcionando");
    }
    
    throw new Error(`Falha ao enviar email: ${error.message}`);
  }
};

