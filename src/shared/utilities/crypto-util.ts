import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);
const ALGORITHM = 'aes-256-ctr';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

export async function encrypt(plainText: string, password: string): Promise<{
    cipherText: string;
    iv: string;
}> {
    const iv = randomBytes(IV_LENGTH);
    const key = (await scryptAsync(password, 'salt', KEY_LENGTH)) as Buffer;

    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);

    return {
        cipherText: encrypted.toString('base64'),
        iv: iv.toString('base64'),
    };
}

export async function decrypt(cipherText: string, password: string, ivBase64: string): Promise<string> {
    const iv = Buffer.from(ivBase64, 'base64');
    const key = (await scryptAsync(password, 'salt', KEY_LENGTH)) as Buffer;

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(cipherText, 'base64')),
        decipher.final(),
    ]);

    return decrypted.toString('utf8');
}