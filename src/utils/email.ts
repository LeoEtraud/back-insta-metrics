import nodemailer from "nodemailer";

// CRIA E CONFIGURA O TRANSPORTER DE EMAIL (NODEMAILER) COM AS CREDENCIAIS DAS VARIÁVEIS DE AMBIENTE
const createTransporter = () => {
  // Configuração para desenvolvimento (pode usar Gmail, SendGrid, etc.)
  // Para produção, configure variáveis de ambiente
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

  const config = {
    host: emailHost,
    port: emailPort,
    secure: emailPort === 465,
    auth: {
      user: emailUser.trim(),
      pass: cleanPassword,
    },
    // Configurações adicionais para Gmail
    tls: {
      rejectUnauthorized: false, // Para desenvolvimento
    },
    // Timeouts para evitar travamentos
    connectionTimeout: 10000, // 10 segundos para conectar
    greetingTimeout: 10000, // 10 segundos para greeting
    socketTimeout: 10000, // 10 segundos para socket
    // Pool de conexões
    pool: true,
    maxConnections: 1,
    maxMessages: 3,
  };

  console.log(`📧 Configurando email:`);
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   User: ${config.auth.user}`);
  console.log(`   Secure: ${config.secure}`);

  return nodemailer.createTransport(config);
};

// ENVIA EMAIL COM CÓDIGO DE RECUPERAÇÃO DE SENHA PARA O USUÁRIO - EM DESENVOLVIMENTO EXIBE NO CONSOLE
export const sendPasswordResetCode = async (
  email: string,
  code: string
): Promise<void> => {
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

  const mailOptions = {
    from: `"Insta Metrics" <${process.env.EMAIL_USER}>`,
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
    // A verificação de conexão pode demorar muito em produção
    // Adiciona timeout de 15 segundos para evitar travamentos
    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error("Timeout: envio de email excedeu 15 segundos")), 15000)
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

