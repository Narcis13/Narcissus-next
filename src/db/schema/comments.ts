// db/schema/comments.ts
import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { posts } from "./posts"; // <-- Import the 'posts' table to create a relation

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  commentText: text("comment_text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),

  // Foreign key to link a comment to a post
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }), // if a post is deleted, its comments are also deleted
});

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;