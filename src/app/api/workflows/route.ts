import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workflows, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, jsonData } = body;

    if (!name || !jsonData) {
      return NextResponse.json(
        { error: "Name and jsonData are required" },
        { status: 400 }
      );
    }

    // Get or create test user
    let [testUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, "test@example.com"))
      .limit(1);

    if (!testUser) {
      // Create test user if it doesn't exist
      [testUser] = await db
        .insert(users)
        .values({
          email: "test@example.com",
          name: "Test User",
          emailVerified: true,
          status: "active",
        })
        .returning();
    }

    // Create workflow with test user ID
    const [workflow] = await db
      .insert(workflows)
      .values({
        userId: testUser.id,
        name,
        description,
        jsonData,
      })
      .returning();

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("Failed to create workflow:", error);
    return NextResponse.json(
      { error: "Failed to create workflow" },
      { status: 500 }
    );
  }
}