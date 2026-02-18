import { prisma } from "../src/services/db";
import { storage } from "../src/services/storage";
import bcrypt from "bcryptjs";
import { USER_ROLES } from "../src/types/schema";

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "123456";
const ADMIN_NAME = "Administrador";
const ADMIN_ROLE = USER_ROLES.ADMIN;

const CLIENT_EMAIL = "cliente@gmail.com";
const CLIENT_PASSWORD = "123456";
const CLIENT_NAME = "Cliente";
const CLIENT_ROLE = USER_ROLES.CLIENT;

async function setupDefaultUsers() {
  try {
    console.log("🔍 Verificando e criando usuários padrão...\n");

    // Cria ou atualiza usuário Admin
    console.log(`🔍 Verificando usuário Admin: ${ADMIN_EMAIL}`);
    let adminUser = await storage.getUserByEmail(ADMIN_EMAIL);

    if (!adminUser) {
      console.log("➕ Criando usuário Admin...");
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

      adminUser = await prisma.user.create({
        data: {
          email: ADMIN_EMAIL,
          name: ADMIN_NAME,
          password: hashedPassword,
          provider: "local",
          role: ADMIN_ROLE,
        },
      });

      console.log("✅ Usuário Admin criado com sucesso!");
    } else {
      console.log("✅ Usuário Admin já existe!");
      // Atualiza role e senha caso necessário
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      adminUser = await storage.updateUser(adminUser.id, {
        role: ADMIN_ROLE,
        password: hashedPassword,
      });
      console.log("✅ Usuário Admin atualizado!");
    }

    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Nome: ${adminUser.name}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Senha: ${ADMIN_PASSWORD}\n`);

    // Cria ou atualiza usuário Cliente
    console.log(`🔍 Verificando usuário Cliente: ${CLIENT_EMAIL}`);
    let clientUser = await storage.getUserByEmail(CLIENT_EMAIL);

    if (!clientUser) {
      console.log("➕ Criando usuário Cliente...");
      const hashedPassword = await bcrypt.hash(CLIENT_PASSWORD, 10);

      clientUser = await prisma.user.create({
        data: {
          email: CLIENT_EMAIL,
          name: CLIENT_NAME,
          password: hashedPassword,
          provider: "local",
          role: CLIENT_ROLE,
        },
      });

      console.log("✅ Usuário Cliente criado com sucesso!");
    } else {
      console.log("✅ Usuário Cliente já existe!");
      // Atualiza role e senha caso necessário
      const hashedPassword = await bcrypt.hash(CLIENT_PASSWORD, 10);
      clientUser = await storage.updateUser(clientUser.id, {
        role: CLIENT_ROLE,
        password: hashedPassword,
      });
      console.log("✅ Usuário Cliente atualizado!");
    }

    console.log(`   ID: ${clientUser.id}`);
    console.log(`   Email: ${clientUser.email}`);
    console.log(`   Nome: ${clientUser.name}`);
    console.log(`   Role: ${clientUser.role}`);
    console.log(`   Senha: ${CLIENT_PASSWORD}\n`);

    console.log("✅ Setup de usuários padrão concluído!\n");
  } catch (error) {
    console.error("❌ Erro ao criar usuários padrão:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupDefaultUsers();

