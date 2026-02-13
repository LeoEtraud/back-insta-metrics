import nodemailer from "nodemailer";

// Configuração do transporter de email
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

  return nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailPort === 465,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
};

export const sendPasswordResetCode = async (
  email: string,
  code: string
): Promise<void> => {
  const transporter = createTransporter();

  if (!transporter) {
    // Modo desenvolvimento - apenas log
    console.log("=".repeat(60));
    console.log(`[EMAIL MOCK] Código de recuperação de senha`);
    console.log(`Para: ${email}`);
    console.log(`Código: ${code}`);
    console.log(`Validade: 15 minutos`);
    console.log("=".repeat(60));
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
    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Código de recuperação enviado para ${email}`);
  } catch (error) {
    console.error(`[EMAIL ERROR] Falha ao enviar email para ${email}:`, error);
    throw new Error("Falha ao enviar email de recuperação");
  }
};

