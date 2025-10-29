import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { DTEPayload, DTESignature } from "./dte.types";

const KEYS_DIR = path.join(__dirname, "../../config/keys");
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, "dev-private.pem");
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, "dev-public.pem");

/**
 * Ensure RSA keys exist, generate if not
 */
function ensureKeys(): void {
  if (!fs.existsSync(KEYS_DIR)) {
    fs.mkdirSync(KEYS_DIR, { recursive: true });
  }

  if (!fs.existsSync(PRIVATE_KEY_PATH) || !fs.existsSync(PUBLIC_KEY_PATH)) {
    console.log("🔑 Generating RSA key pair for DTE signing...");
    
    const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: "spki",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
      },
    });

    fs.writeFileSync(PRIVATE_KEY_PATH, privateKey);
    fs.writeFileSync(PUBLIC_KEY_PATH, publicKey);
    
    console.log("✅ RSA keys generated successfully");
    console.log(`   Private key: ${PRIVATE_KEY_PATH}`);
    console.log(`   Public key: ${PUBLIC_KEY_PATH}`);
  }
}

/**
 * Canonicalize JSON for deterministic signing
 * Sorts keys alphabetically and removes whitespace
 */
export function canonicalizeJSON(payload: DTEPayload): string {
  // Sort keys recursively
  const sortKeys = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(sortKeys);
    } else if (obj !== null && typeof obj === "object") {
      return Object.keys(obj)
        .sort()
        .reduce((result: any, key) => {
          result[key] = sortKeys(obj[key]);
          return result;
        }, {});
    }
    return obj;
  };

  const sorted = sortKeys(payload);
  return JSON.stringify(sorted);
}

/**
 * Sign DTE payload with RSA private key
 */
export function signDTE(payload: DTEPayload): DTESignature {
  ensureKeys();

  // Canonicalize the payload
  const canonical = canonicalizeJSON(payload);
  
  // Calculate SHA-256 hash
  const hash = crypto.createHash("sha256").update(canonical).digest("hex");

  // Sign with RSA private key
  const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, "utf8");
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(canonical);
  sign.end();
  
  const signature = sign.sign(privateKey, "base64");

  return {
    payload,
    signature,
    hash,
    signedAt: new Date(),
    algorithm: "RS256",
  };
}

/**
 * Verify DTE signature (for testing/validation)
 */
export function verifyDTESignature(dteSignature: DTESignature): boolean {
  try {
    ensureKeys();
    
    const canonical = canonicalizeJSON(dteSignature.payload);
    const publicKey = fs.readFileSync(PUBLIC_KEY_PATH, "utf8");
    
    const verify = crypto.createVerify("RSA-SHA256");
    verify.update(canonical);
    verify.end();
    
    return verify.verify(publicKey, dteSignature.signature, "base64");
  } catch (error) {
    console.error("Error verifying DTE signature:", error);
    return false;
  }
}

/**
 * Initialize keys on module load
 */
ensureKeys();

