// app/actions.ts
"use server"; // This directive marks all functions in this file as Server Actions

import { db } from "@/lib/db";
import { posts } from "@/db/schema/posts";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { redirect } from 'next/navigation';

// --- CREATE ---
export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  // Basic validation
  if (!title || !content) {
    return { error: "Title and content are required." };
  }

  try {
    await db.insert(posts).values({ title, content });

    // Invalidate the cache for the home page to show the new post
    revalidatePath("/");
  } catch (error) {
    console.error("Failed to create post:", error);
    return { error: "Failed to create post." };
  }
}

// --- READ ---
export async function getPosts() {
  try {
  
    const allPosts = await db.query.posts.findMany({
      orderBy: (posts, { desc }) => [desc(posts.createdAt)], // Order by newest first
    });
    return allPosts;
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    // In a real app, you'd want to handle this more gracefully
    return [];
  }
}

// --- UPDATE ---
// Note: This is a simplified update. A real-world scenario might involve a dedicated edit page.
export async function updatePost(formData: FormData) {
  const id = Number(formData.get("id"));
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  if (isNaN(id) || !title || !content) {
    return { error: "Invalid data." };
  }

  try {
    await db
      .update(posts)
      .set({ title, content })
      .where(eq(posts.id, id));

    revalidatePath("/");
  } catch (error) {
    console.error("Failed to update post:", error);
    return { error: "Failed to update post." };
  }
}

// --- DELETE ---
export async function deletePost(formData: FormData) {
  const id = Number(formData.get("id"));

  if (isNaN(id)) {
    return { error: "Invalid post ID." };
  }

  try {
    await db.delete(posts).where(eq(posts.id, id));

    revalidatePath("/");
  } catch (error) {
    console.error("Failed to delete post:", error);
    return { error: "Failed to delete post." };
  }
}