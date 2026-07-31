ALTER TABLE "user" DROP CONSTRAINT "user_tenant_id_tenant_id_fk";
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "tenant_id" DROP NOT NULL;