-- AlterTable
ALTER TABLE "users" ADD COLUMN     "instagram_username" TEXT,
ALTER COLUMN "role" SET DEFAULT 'cliente';

-- Update existing roles: convert old roles to new simplified roles
-- ADMIN_SAAS and ADMIN_COMPANY -> admin
-- ANALYST and VIEWER -> cliente
UPDATE "users" 
SET "role" = CASE 
  WHEN "role" IN ('admin_saas', 'admin_company') THEN 'admin'
  WHEN "role" IN ('analyst', 'viewer') THEN 'cliente'
  ELSE 'cliente'
END;
