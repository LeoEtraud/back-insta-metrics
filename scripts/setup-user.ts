import { prisma } from "../src/services/db";
import { storage } from "../src/services/storage";
import bcrypt from "bcryptjs";
import { USER_ROLES } from "../src/types/schema";

const EMAIL = "leonardo.duarte.of@gmail.com";
const DEFAULT_PASSWORD = "senha123"; // Altere esta senha após o primeiro login

async function setupUser() {
  try {
    console.log(`🔍 Verificando usuário: ${EMAIL}`);
    
    // Verifica se o usuário existe
    let user = await storage.getUserByEmail(EMAIL);
    
    if (!user) {
      console.log("➕ Usuário não encontrado. Criando novo usuário...");
      
      // Cria usuário com provider "local" e senha
      const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      
      user = await prisma.user.create({
        data: {
          email: EMAIL,
          name: "Leonardo Duarte",
          password: hashedPassword,
          provider: "local",
          role: USER_ROLES.ADMIN_COMPANY,
        },
      });
      
      console.log("✅ Usuário criado com sucesso!");
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Provider: ${user.provider}`);
      console.log(`   Senha padrão: ${DEFAULT_PASSWORD}`);
      console.log("⚠️  IMPORTANTE: Altere a senha após o primeiro login!");
    } else {
      console.log("✅ Usuário já existe!");
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Provider atual: ${user.provider || "local"}`);
      console.log(`   Tem senha: ${user.password ? "Sim" : "Não"}`);
      
      // Atualiza o usuário para garantir que possa usar ambos os métodos
      const updates: any = {};
      
      // Se não tem senha, define uma senha padrão
      if (!user.password) {
        console.log("🔐 Definindo senha padrão...");
        const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
        updates.password = hashedPassword;
        console.log("⚠️  IMPORTANTE: Altere a senha após o primeiro login!");
      }
      
      // Se o provider não é "local", mantém o provider atual mas permite login com senha também
      // (a lógica de login já permite isso se houver senha)
      if (user.provider && user.provider !== "local") {
        console.log(`ℹ️  Provider atual: ${user.provider}`);
        console.log("   O usuário pode fazer login com Google e também com senha (se tiver senha definida)");
      } else if (!user.provider) {
        updates.provider = "local";
      }
      
      if (Object.keys(updates).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updates,
        });
        console.log("✅ Usuário atualizado com sucesso!");
      }
    }
    
    console.log("\n📋 Resumo da configuração:");
    console.log(`   Email: ${user.email}`);
    console.log(`   Provider: ${user.provider || "local"}`);
    console.log(`   Tem senha: ${user.password ? "Sim" : "Não"}`);
    console.log(`   Pode fazer login com credenciais: ${user.password ? "Sim" : "Não"}`);
    console.log(`   Pode fazer login social: Sim (se o email corresponder ao Google)`);
    
    console.log("\n✅ Configuração concluída!");
    
  } catch (error) {
    console.error("❌ Erro ao configurar usuário:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupUser();

