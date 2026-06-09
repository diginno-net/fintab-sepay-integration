import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { env } from '../../config/env.js';

const ALGORITHM = 'aes-256-gcm';

function masterKey(): Buffer {
  return createHash('sha256').update(env.ENCRYPTION_MASTER_KEY).digest();
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, masterKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join(':');
}

export function decryptSecret(ciphertext: string): string {
  const [version, iv, tag, encrypted] = ciphertext.split(':');
  if (version !== 'v1' || !iv || !tag || !encrypted) {
    throw new Error('Invalid encrypted secret format');
  }
  const decipher = createDecipheriv(ALGORITHM, masterKey(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64url')), decipher.final()]);
  return decrypted.toString('utf8');
}

export function encryptSecretObject<T extends Record<string, unknown>>(input: T, keys: Array<keyof T>): T {
  const output = { ...input };
  for (const key of keys) {
    const value = output[key];
    if (typeof value === 'string' && value.length > 0) {
      output[key] = encryptSecret(value) as T[keyof T];
    }
  }
  return output;
}

export function maskSecret(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0) return null;
  return '••••••••';
}

export function hasSecret(value: unknown): boolean {
  return typeof value === 'string' && value.length > 0;
}
