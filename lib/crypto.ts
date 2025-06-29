import nacl, { sign, SignKeyPair } from 'tweetnacl';
import { decodeBase64, encodeBase64 } from 'tweetnacl-util';
import base58 from 'bs58';
import { createHash } from 'crypto';

/**
 * Validates a private key.
 * A valid private key, after Base64 decoding, must be 32 or 64 bytes long.
 * @param {string} privateKeyB64 - The Base64 encoded private key string.
 * @returns {boolean} Returns true if valid, otherwise throws an error.
 */
export function validatePrivateKey(privateKeyB64: string): boolean {
  try {
    const decodedKey = decodeBase64(privateKeyB64);
    if (decodedKey.length !== 32 && decodedKey.length !== 64) {
      throw new Error(`Invalid key length. Decoded key must be 32 or 64 bytes long, but got ${decodedKey.length}.`);
    }
    return true;
  } catch (e: any) {
    throw new Error(`Invalid private key: ${e.message}`);
  }
}

/**
 * [STRICT PYTHON COMPATIBILITY]
 * Internal helper to get a key pair from a 32-byte seed or a 64-byte key,
 * exactly replicating python's pynacl behavior.
 * @param {string} privateKeyB64 - The Base64 encoded private key string.
 * @returns {SignKeyPair} A tweetnacl key pair object.
 */
function getKeyPair(privateKeyB64: string): SignKeyPair {
  const decodedKey = decodeBase64(privateKeyB64);
  return sign.keyPair.fromSeed(decodedKey);
}

/**
 * Derives a public key from a private key.
 * @param {string} privateKeyB64 - The Base64 encoded private key string.
 * @returns {string} The Base64 encoded public key.
 */
export function derivePublicKey(privateKeyB64: string): string {
  const keyPair = getKeyPair(privateKeyB64);
  return encodeBase64(keyPair.publicKey);
}

/**
 * Derives an Octra address from a private key.
 * Address Format: oct + Base58(SHA256(pubkey))
 * @param {string} privateKeyB64 - The Base64 encoded private key string.
 * @returns {string} The Octra address.
 */
export function deriveAddress(privateKeyB64: string): string {
  const keyPair = getKeyPair(privateKeyB64);
  const hash: Buffer = createHash("sha256").update(keyPair.publicKey).digest();
  const base58Hash: string = base58.encode((hash))
  return 'oct' + base58Hash;
}