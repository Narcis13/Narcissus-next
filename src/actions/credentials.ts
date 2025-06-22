"use server";

import { db } from "@/lib/db";
import { credentials } from "@/db/schema/credentials";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { encrypt, decrypt } from "@/lib/security/crypto";

// Hardcoded user ID as requested
const HARDCODED_USER_ID = "79017909-9811-4af0-976a-88ef0a9a47df";

// --- CREATE ---
export async function createCredential(formData: FormData) {
  const serviceName = formData.get("serviceName") as string;
  const secret = formData.get("secret") as string;

  // Basic validation
  if (!serviceName || !secret) {
    console.error("Service name and secret are required.");
    return;
  }

  try {
    // Encrypt the secret
    const encryptedPayload = encrypt(secret);

    await db.insert(credentials).values({
      userId: HARDCODED_USER_ID,
      serviceName,
      encryptedSecret: encryptedPayload.encryptedData,
      iv: encryptedPayload.iv,
      authTag: encryptedPayload.authTag,
    });

    // Invalidate the cache for the credentials page
    revalidatePath("/credentials");
  } catch (error) {
    console.error("Failed to create credential:", error);
  }
}

// --- READ ---
export async function getCredentials() {
  try {
    const userCredentials = await db.query.credentials.findMany({
      where: eq(credentials.userId, HARDCODED_USER_ID),
      orderBy: (credentials, { desc }) => [desc(credentials.createdAt)],
    });

    // Return credentials with decrypted secrets for display
    const decryptedCredentials = userCredentials.map((cred) => {
      try {
        const decryptedSecret = decrypt({
          iv: cred.iv!,
          encryptedData: cred.encryptedSecret!,
          authTag: cred.authTag!,
        });
        
        return {
          ...cred,
          decryptedSecret,
        };
      } catch (error) {
        console.error("Failed to decrypt credential:", error);
        return {
          ...cred,
          decryptedSecret: "[Decryption Error]",
        };
      }
    });

    return decryptedCredentials;
  } catch (error) {
    console.error("Failed to fetch credentials:", error);
    return [];
  }
}

// --- DELETE ---
export async function deleteCredential(formData: FormData) {
  const id = formData.get("id") as string;

  if (!id) {
    console.error("Invalid credential ID.");
    return;
  }

  try {
    await db
      .delete(credentials)
      .where(eq(credentials.id, id));

    revalidatePath("/credentials");
  } catch (error) {
    console.error("Failed to delete credential:", error);
  }
}

// --- UPDATE ---
export async function updateCredential(formData: FormData) {
  const id = formData.get("id") as string;
  const serviceName = formData.get("serviceName") as string;
  const secret = formData.get("secret") as string;

  if (!id || !serviceName || !secret) {
    console.error("All fields are required.");
    return;
  }

  try {
    // Encrypt the new secret
    const encryptedPayload = encrypt(secret);

    await db
      .update(credentials)
      .set({
        serviceName,
        encryptedSecret: encryptedPayload.encryptedData,
        iv: encryptedPayload.iv,
        authTag: encryptedPayload.authTag,
        updatedAt: new Date(),
      })
      .where(eq(credentials.id, id));

    revalidatePath("/credentials");
  } catch (error) {
    console.error("Failed to update credential:", error);
  }
}
