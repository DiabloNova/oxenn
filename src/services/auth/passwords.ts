import crypto from "node:crypto";

const N = 32768; // 2^15
const r = 8;
const p = 1;
const KEY_LEN = 64; // scrypt key length
const SALT_LEN = 16;
const ALGORITHM = "scrypt";

export interface PasswordParams {
  n: number;
  r: number;
  p: number;
  keyLength: number;
}

export interface HashResult {
  hash: string;
  algorithm: string;
  params: PasswordParams;
}

const MAX_MEM_BYTES = 128 * 1024 * 1024; // 128MB to prevent scrypt memory limit error

export async function hashPassword(password: string): Promise<HashResult> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(SALT_LEN).toString("base64");

    crypto.scrypt(password, salt, KEY_LEN, { N, r, p, maxmem: MAX_MEM_BYTES }, (err, derivedKey) => {
      if (err) {
        return reject(err);
      }

      const hashStr = `${salt}:${derivedKey.toString("base64")}`;

      resolve({
        hash: hashStr,
        algorithm: ALGORITHM,
        params: {
          n: N,
          r,
          p,
          keyLength: KEY_LEN,
        }
      });
    });
  });
}

export async function verifyPassword(password: string, storedHash: string, storedParams: PasswordParams): Promise<boolean> {
  if (!storedParams || typeof storedParams !== 'object') {
    return false;
  }

  const { n, r: pr, p: pp, keyLength } = storedParams;

  if (typeof n !== 'number' || typeof pr !== 'number' || typeof pp !== 'number' || typeof keyLength !== 'number') {
    return false;
  }

  if (n > 131072 || pr > 16 || pp > 4 || keyLength > 128) {
     return false;
  }

  const parts = storedHash.split(":");
  if (parts.length !== 2) {
    return false;
  }

  const [salt, keyBase64] = parts;
  const keyBuffer = Buffer.from(keyBase64, "base64");

  if (keyBuffer.length !== keyLength) {
    return false;
  }

  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keyLength, { N: n, r: pr, p: pp, maxmem: MAX_MEM_BYTES }, (err, derivedKey) => {
      if (err) {
        return resolve(false);
      }

      try {
         const matches = crypto.timingSafeEqual(keyBuffer, derivedKey);
         resolve(matches);
      } catch (e) {
         resolve(false);
      }
    });
  });
}

export function validatePasswordRequirements(password: string): boolean {
  if (!password) return false;
  if (password.length < 10) return false;
  if (password.length > 255) return false;
  return true;
}

export const PASSWORD_MAX_LENGTH = 255;
