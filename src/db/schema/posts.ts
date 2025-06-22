import { pgTable, serial, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

// Define an enum for the post status
export const postStatusEnum = pgEnum('post_status', ['draft', 'published']);

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  
  // NEW FIELD: Add the status column using our enum
  status: postStatusEnum('status').default('draft').notNull(),
  description:text("description").default('descriere').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;