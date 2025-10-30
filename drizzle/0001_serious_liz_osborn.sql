DROP INDEX "brokers_email_unique";--> statement-breakpoint
DROP INDEX "leads_email_unique";--> statement-breakpoint
DROP INDEX "users_email_unique";--> statement-breakpoint
ALTER TABLE `leads` ALTER COLUMN "status" TO "status" text NOT NULL DEFAULT 'new lead';--> statement-breakpoint
CREATE UNIQUE INDEX `brokers_email_unique` ON `brokers` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `leads_email_unique` ON `leads` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `leads` ADD `sub_source` text;--> statement-breakpoint
ALTER TABLE `leads` ADD `project_id` integer REFERENCES projects(id);--> statement-breakpoint
ALTER TABLE `leads` ADD `next_call_date` text;