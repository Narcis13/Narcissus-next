"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, validatePassword } from "@/lib/auth/password";
import { revalidatePath } from "next/cache";

export async function updateProfile(name: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return {
      success: false,
      error: "Not authenticated",
    };
  }

  try {
    await db
      .update(users)
      .set({ 
        name,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    revalidatePath("/profile");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      error: "Failed to update profile",
    };
  }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return {
      success: false,
      error: "Not authenticated",
    };
  }

  // Validate new password
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    return {
      success: false,
      error: passwordValidation.errors.join(", "),
    };
  }

  try {
    // Get current user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user || !user.passwordHash) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return {
        success: false,
        error: "Current password is incorrect",
      };
    }

    // Hash new password and update
    const newPasswordHash = await hashPassword(newPassword);
    await db
      .update(users)
      .set({ 
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error changing password:", error);
    return {
      success: false,
      error: "Failed to change password",
    };
  }
}

export async function getUserProfile() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }

  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    return user;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}