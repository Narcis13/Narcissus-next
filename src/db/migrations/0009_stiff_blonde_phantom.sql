ALTER TABLE "workflow_executions" ADD COLUMN "execution_mode" varchar(20) DEFAULT 'immediate';--> statement-breakpoint
ALTER TABLE "workflow_executions" ADD COLUMN "metadata" jsonb;