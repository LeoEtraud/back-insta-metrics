import { prisma } from "../src/services/db";
import { storage } from "../src/services/storage";
import bcrypt from "bcryptjs";
import { USER_ROLES } from "../src/types/schema";

const EMAIL = "leonardo.duarte.of@gmail.com";
const PASSWORD = "123456";
const USER_NAME = "Leonardo Duarte";
const COMPANY_NAME = "Insta Metrics";

async function setupUser() {
  try {
    console.log(`🔍 Verificando usuário: ${EMAIL}`);
    
    // Verifica se o usuário existe
    let user = await storage.getUserByEmail(EMAIL);
    
    if (!user) {
      console.log("➕ Usuário não encontrado. Criando novo usuário...");
      
      // Cria ou busca uma company
      let company = await prisma.company.findFirst({
        where: { name: COMPANY_NAME },
      });
      
      if (!company) {
        console.log(`🏢 Criando company: ${COMPANY_NAME}`);
        company = await prisma.company.create({
          data: { name: COMPANY_NAME },
        });
        console.log(`✅ Company criada com ID: ${company.id}`);
      } else {
        console.log(`✅ Company já existe com ID: ${company.id}`);
      }
      
      // Cria usuário com provider "local" e senha
      const hashedPassword = await bcrypt.hash(PASSWORD, 10);
      
      user = await prisma.user.create({
        data: {
          email: EMAIL,
          name: USER_NAME,
          password: hashedPassword,
          provider: "local",
          role: USER_ROLES.ADMIN_COMPANY,
          companyId: company.id,
        },
      });
      
      console.log("✅ Usuário criado com sucesso!");
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Nome: ${user.name}`);
      console.log(`   Provider: ${user.provider}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Company ID: ${user.companyId}`);
      console.log(`   Company: ${company.name}`);
      console.log(`   Senha: ${PASSWORD}`);
    } else {
      console.log("✅ Usuário já existe!");
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Provider atual: ${user.provider || "local"}`);
      console.log(`   Tem senha: ${user.password ? "Sim" : "Não"}`);
      
      // Atualiza o usuário para garantir que possa usar ambos os métodos
      const updates: any = {};
      
      // Se não tem senha, define a senha
      if (!user.password) {
        console.log("🔐 Definindo senha...");
        const hashedPassword = await bcrypt.hash(PASSWORD, 10);
        updates.password = hashedPassword;
      } else {
        // Atualiza a senha mesmo se já existir
        console.log("🔐 Atualizando senha...");
        const hashedPassword = await bcrypt.hash(PASSWORD, 10);
        updates.password = hashedPassword;
      }
      
      // Garante que o usuário tenha uma company
      if (!user.companyId) {
        let company = await prisma.company.findFirst({
          where: { name: COMPANY_NAME },
        });
        
        if (!company) {
          console.log(`🏢 Criando company: ${COMPANY_NAME}`);
          company = await prisma.company.create({
            data: { name: COMPANY_NAME },
          });
        }
        updates.companyId = company.id;
      }
      
      // Atualiza o nome se necessário
      if (user.name !== USER_NAME) {
        updates.name = USER_NAME;
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
    
    // Busca a company para exibir o nome
    const userCompany = user.companyId 
      ? await prisma.company.findUnique({ where: { id: user.companyId } })
      : null;
    
    console.log("\n📋 Resumo da configuração:");
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Nome: ${user.name}`);
    console.log(`   Provider: ${user.provider || "local"}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Company ID: ${user.companyId}`);
    console.log(`   Company: ${userCompany?.name || "N/A"}`);
    console.log(`   Tem senha: ${user.password ? "Sim" : "Não"}`);
    console.log(`   Senha: ${PASSWORD}`);
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

