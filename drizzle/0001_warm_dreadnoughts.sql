CREATE INDEX `idx_events_date` ON `events` (`event_date`);--> statement-breakpoint
CREATE INDEX `idx_submissions_created_at` ON `submissions` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_submissions_status` ON `submissions` (`status`);