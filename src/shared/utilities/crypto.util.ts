import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

const scryptAsync = promisify(scrypt);
const ALGORITHM = 'aes-256-ctr';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SEPARATOR = ':';
const SALT_ROUNDS = 12; 

/**
 * Encrypts a token and stores IV with it in format: iv:encryptedToken
 */
export async function encryptText(
  plainText: string,
  encryptionKey: string,
): Promise<string> {
  const iv = randomBytes(IV_LENGTH);
  const key = (await scryptAsync(encryptionKey, 'salt', KEY_LENGTH)) as Buffer;

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ]);

  const encryptedBase64 = encrypted.toString('base64');
  const ivBase64 = iv.toString('base64');

  // Combine IV and encrypted token with separator
  return `${ivBase64}${SEPARATOR}${encryptedBase64}`;
}

/**
 * Decrypts a token from format: iv:encryptedToken
 */
export async function decryptText(
  encryptedData: string,
  encryptionKey: string,
): Promise<string> {
  const [ivBase64, encryptedBase64] = encryptedData.split(SEPARATOR);

  if (!ivBase64 || !encryptedBase64) {
    throw new Error('Invalid encrypted token format');
  }

  const iv = Buffer.from(ivBase64, 'base64');
  const key = (await scryptAsync(encryptionKey, 'salt', KEY_LENGTH)) as Buffer;

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedBase64, 'base64')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Hashes an text using bcrypt with a configurable salt round.
 * @param text - The raw test to hash
 * @returns A bcrypt hash of the text
 */
export async function hashText(text: string): Promise<string> {
  return await bcrypt.hash(text, SALT_ROUNDS);
}

/**
 * Validates an incoming Text against a stored bcrypt hash.
 * @param incomingText - The text provided by the client
 * @param storedHash - The bcrypt hash stored in your database
 * @returns True if the text matches, false otherwise
 */
export async function validateApiKey(incomingText: string, storedHash: string): Promise<boolean> {
  return await bcrypt.compare(incomingText, storedHash);
}

/**
 * Gets encryption key from config or uses APP_SECRET as fallback
 */
export function getEncryptionKey(configService: ConfigService): string {
  return (
    configService.get<string>('OAUTH_TOKEN_ENCRYPTION_KEY') ||
    configService.get<string>('APP_SECRET')!
  );
}



