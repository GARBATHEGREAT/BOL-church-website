CREATE TABLE `content_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`section` text NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`subtitle` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`image_url` text DEFAULT '' NOT NULL,
	`button_text` text DEFAULT '' NOT NULL,
	`button_url` text DEFAULT '' NOT NULL,
	`contact_links` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`visible` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_content_items_section_order` ON `content_items` (`section`,`sort_order`);--> statement-breakpoint
CREATE INDEX `idx_content_items_section_visible` ON `content_items` (`section`,`visible`);