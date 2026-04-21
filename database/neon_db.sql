CREATE SCHEMA "public";
CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL CONSTRAINT "blog_posts_slug_key" UNIQUE,
	"excerpt" text NOT NULL,
	"content" text,
	"category_id" integer,
	"tags" text[],
	"featured" boolean DEFAULT false,
	"author_name" varchar(100) DEFAULT 'EinCode',
	"author_role" varchar(100) DEFAULT 'Software Engineer',
	"read_time" varchar(20),
	"published" boolean DEFAULT true,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL CONSTRAINT "categories_slug_key" UNIQUE,
	"description" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "chat_analytics" (
	"id" serial PRIMARY KEY,
	"date" date DEFAULT CURRENT_DATE CONSTRAINT "chat_analytics_date_key" UNIQUE,
	"total_sessions" integer DEFAULT 0,
	"total_messages" integer DEFAULT 0,
	"avg_response_time_ms" integer,
	"top_queries" text[],
	"sources_used" jsonb
);
CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY,
	"session_id" uuid,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "chat_messages_role_check" CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'assistant'::character varying, 'system'::character varying])::text[])))
);
CREATE TABLE "chat_sessions" (
	"id" serial PRIMARY KEY,
	"session_id" uuid DEFAULT gen_random_uuid() NOT NULL CONSTRAINT "chat_sessions_session_id_key" UNIQUE,
	"visitor_id" varchar(255),
	"user_agent" text,
	"ip_address" inet,
	"started_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"ended_at" timestamp,
	"message_count" integer DEFAULT 0
);
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY,
	"filename" varchar(255) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"file_size" integer,
	"mime_type" varchar(100),
	"category" varchar(50) DEFAULT 'general',
	"description" text,
	"is_indexed" boolean DEFAULT false,
	"index_status" varchar(20) DEFAULT 'pending',
	"chunk_count" integer DEFAULT 0,
	"vector_namespace" varchar(100),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"cloudinary_public_id" varchar(255)
);
CREATE TABLE "lab_notes" (
	"id" serial PRIMARY KEY,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"content" text,
	"link" varchar(500),
	"icon" varchar(50) DEFAULT 'code',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL CONSTRAINT "projects_slug_key" UNIQUE,
	"description" text NOT NULL,
	"long_description" text,
	"status" varchar(20) DEFAULT 'in-progress',
	"year" integer,
	"featured" boolean DEFAULT false,
	"highlight" boolean DEFAULT false,
	"github_url" varchar(500),
	"live_url" varchar(500),
	"stars" integer DEFAULT 0,
	"forks" integer DEFAULT 0,
	"tags" text[],
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "projects_status_check" CHECK (((status)::text = ANY ((ARRAY['shipped'::character varying, 'in-progress'::character varying, 'archived'::character varying])::text[])))
);
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY,
	"key" varchar(100) NOT NULL CONSTRAINT "settings_key_key" UNIQUE,
	"value" text,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY,
	"name" varchar(50) NOT NULL,
	"slug" varchar(50) NOT NULL CONSTRAINT "tags_slug_key" UNIQUE,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "workbench_items" (
	"id" serial PRIMARY KEY,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"progress" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'active',
	"priority" varchar(20) DEFAULT 'medium',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "workbench_items_priority_check" CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying])::text[]))),
	CONSTRAINT "workbench_items_progress_check" CHECK (((progress >= 0) AND (progress <= 100))),
	CONSTRAINT "workbench_items_status_check" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'paused'::character varying, 'completed'::character varying])::text[])))
);
CREATE UNIQUE INDEX "blog_posts_pkey" ON "blog_posts" ("id");
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts" ("slug");
CREATE INDEX "idx_blog_posts_category" ON "blog_posts" ("category_id");
CREATE INDEX "idx_blog_posts_featured" ON "blog_posts" ("featured");
CREATE INDEX "idx_blog_posts_published" ON "blog_posts" ("published");
CREATE UNIQUE INDEX "categories_pkey" ON "categories" ("id");
CREATE UNIQUE INDEX "categories_slug_key" ON "categories" ("slug");
CREATE UNIQUE INDEX "chat_analytics_date_key" ON "chat_analytics" ("date");
CREATE UNIQUE INDEX "chat_analytics_pkey" ON "chat_analytics" ("id");
CREATE UNIQUE INDEX "chat_messages_pkey" ON "chat_messages" ("id");
CREATE INDEX "idx_chat_messages_created" ON "chat_messages" ("created_at");
CREATE INDEX "idx_chat_messages_session" ON "chat_messages" ("session_id");
CREATE UNIQUE INDEX "chat_sessions_pkey" ON "chat_sessions" ("id");
CREATE UNIQUE INDEX "chat_sessions_session_id_key" ON "chat_sessions" ("session_id");
CREATE INDEX "idx_chat_sessions_visitor" ON "chat_sessions" ("visitor_id");
CREATE UNIQUE INDEX "documents_pkey" ON "documents" ("id");
CREATE INDEX "idx_documents_category" ON "documents" ("category");
CREATE INDEX "idx_documents_status" ON "documents" ("index_status");
CREATE UNIQUE INDEX "lab_notes_pkey" ON "lab_notes" ("id");
CREATE INDEX "idx_projects_featured" ON "projects" ("featured");
CREATE INDEX "idx_projects_status" ON "projects" ("status");
CREATE UNIQUE INDEX "projects_pkey" ON "projects" ("id");
CREATE UNIQUE INDEX "projects_slug_key" ON "projects" ("slug");
CREATE UNIQUE INDEX "settings_key_key" ON "settings" ("key");
CREATE UNIQUE INDEX "settings_pkey" ON "settings" ("id");
CREATE UNIQUE INDEX "tags_pkey" ON "tags" ("id");
CREATE UNIQUE INDEX "tags_slug_key" ON "tags" ("slug");
CREATE UNIQUE INDEX "workbench_items_pkey" ON "workbench_items" ("id");
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("session_id") ON DELETE CASCADE;