import { sign, SignKeyPair } from 'tweetnacl';
import { decodeBase64, encodeBase64 } from 'tweetnacl-util';
import base58 from 'bs58';
import { createHash, randomBytes, createHmac } from 'crypto';
import { entropyToMnemonic, mnemonicToSeedSync } from "bip39";

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
 * Internal helper to get a key pair from a base64 encoded private key,
 * exactly replicating python's pynacl behavior.
 * @param {string} privateKeyB64 - The Base64 encoded private key string.
 * @returns {SignKeyPair} A tweetnacl key pair object.
 */
export function getKeyPair(privateKeyB64: string): SignKeyPair {
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


// Below was taken from the official wallet gen with minor modifications
// Source: https://github.com/octra-labs/wallet-gen/blob/11de6a6bbfcced5e2433e4b1b938adc39dd20caa/wallet_generator.ts

/**
 * Generates cryptographic entropy.
 * This function generates a random buffer of the specified strength.
 * @param strength
 */
function generateEntropy(strength: number = 128): Buffer {
  if (![128, 160, 192, 224, 256].includes(strength)) {
    throw new Error("Strength must be 128, 160, 192, 224 or 256 bits");
  }
  return randomBytes(strength / 8);
}

interface MasterKey {
  masterPrivateKey: Buffer;
  masterChainCode: Buffer;
}

export interface WalletData {
  mnemonic: string[];
  seed_hex: string;
  master_chain_hex: string;
  private_key_hex: string;
  public_key_hex: string;
  private_key_b64: string;
  public_key_b64: string;
  address: string;
  entropy_hex: string;
  test_message: string;
  test_signature: string;
  signature_valid: boolean;
}

// Derive master key using HMAC-SHA512 with "Octra seed"
function deriveMasterKey(seed: Buffer): MasterKey {
  const key: Buffer = Buffer.from("Octra seed", "utf8");
  const mac: Buffer = createHmac("sha512", key).update(seed).digest();

  const masterPrivateKey: Buffer = mac.slice(0, 32);
  const masterChainCode: Buffer = mac.slice(32, 64);

  return { masterPrivateKey, masterChainCode };
}

// Create Octra address
function createOctraAddress(publicKey: Buffer): string {
  const hash: Buffer = createHash("sha256").update(publicKey).digest();
  const base58Hash: string = base58.encode(hash);
  return "oct" + base58Hash;
}

function bufferToHex(buffer: Buffer | Uint8Array): string {
  return Buffer.from(buffer).toString("hex");
}

/**
 * Create a new wallet
 * @returns {Object} An object containing the private key and address.
 */
export function createWallet(): WalletData {
  const entropy: Buffer = generateEntropy(128);
  const mnemonic: string = entropyToMnemonic(
    entropy.toString("hex")
  );
  const mnemonicWords: string[] = mnemonic.split(" ");
  const seed: Buffer = mnemonicToSeedSync(mnemonic);
  const { masterPrivateKey, masterChainCode }: MasterKey =
    deriveMasterKey(seed);
  const keyPair = sign.keyPair.fromSeed(masterPrivateKey);
  const privateKeyRaw: Buffer = Buffer.from(
    keyPair.secretKey.slice(0, 32)
  );
  const publicKeyRaw: Buffer = Buffer.from(keyPair.publicKey);
  const address: string = createOctraAddress(publicKeyRaw);

  const testMessage: string =
    '{"from":"test","to":"test","amount":"1000000","nonce":1}';
  const messageBytes: Buffer = Buffer.from(testMessage, "utf8");
  const signature: Uint8Array = sign.detached(
    messageBytes,
    keyPair.secretKey
  );
  const signatureB64: string = encodeBase64(signature);

  let signatureValid: boolean = false;
  signatureValid = sign.detached.verify(
      messageBytes,
      signature,
      keyPair.publicKey
  );

  return {
    mnemonic: mnemonicWords,
    seed_hex: bufferToHex(seed),
    master_chain_hex: bufferToHex(masterChainCode),
    private_key_hex: bufferToHex(privateKeyRaw),
    public_key_hex: bufferToHex(publicKeyRaw),
    private_key_b64: encodeBase64(privateKeyRaw),
    public_key_b64: encodeBase64(publicKeyRaw),
    address: address,
    entropy_hex: bufferToHex(entropy),
    test_message: testMessage,
    test_signature: signatureB64,
    signature_valid: signatureValid,
  };

}