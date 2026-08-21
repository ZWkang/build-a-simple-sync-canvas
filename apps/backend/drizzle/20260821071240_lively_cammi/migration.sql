CREATE TABLE `canvas_documents` (
	`canvas_id` text PRIMARY KEY,
	`state` blob NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_canvas_documents_canvas_id_canvases_id_fk` FOREIGN KEY (`canvas_id`) REFERENCES `canvases`(`id`) ON DELETE CASCADE
);
