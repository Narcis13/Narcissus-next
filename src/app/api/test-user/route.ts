import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    // Check if test user exists
    const [testUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, "test@example.com"))
      .limit(1);

    if (testUser) {
      return NextResponse.json({ userId: testUser.id });
    }

    // Create test user if it doesn't exist
    const [newUser] = await db
      .insert(users)
      .values({
        email: "test@example.com",
        name: "Test User",
        emailVerified: true,
        status: "active",
      })
      .returning();

    return NextResponse.json({ userId: newUser.id });
  } catch (error) {
    console.error("Failed to get/create test user:", error);
    return NextResponse.json(
      { error: "Failed to get/create test user" },
      { status: 500 }
    );
  }
}