// src/lib/security/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bit for GCM
const KEY_LENGTH = 32; // 256 bit

// Get the master key from environment variables.
const masterKeyHex = process.env.THE_SECRET;;
if (!masterKeyHex || masterKeyHex.length !== 64) {
  throw new Error('Invalid MASTER_ENCRYPTION_KEY. Must be a 64-character hex string (32 bytes).');
}
const masterKey = Buffer.from(masterKeyHex, 'hex');

interface EncryptedPayload {
  iv: string;
  encryptedData: string;
  authTag: string;
}

export function encrypt(text: string): EncryptedPayload {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, masterKey, iv);
  
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

export function decrypt(payload: EncryptedPayload): string {
  const decipher = createDecipheriv(
    ALGORITHM,
    masterKey,
    Buffer.from(payload.iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(payload.authTag, 'hex'));
  
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.encryptedData, 'hex')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}