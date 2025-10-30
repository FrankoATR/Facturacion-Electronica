import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

/**
 * Servicio de criptografía para DTE
 * Simula el proceso de firma electrónica con AES-256-GCM
 */

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Clave secreta para firma (en producción debe venir de variables de entorno seguras)
const SECRET_KEY = process.env.DTE_SECRET_KEY || 'electroz-dte-secret-key-2024-change-in-production';

/**
 * Genera una clave derivada de la clave secreta
 */
function getDerivedKey(): Buffer {
  return createHash('sha256')
    .update(SECRET_KEY)
    .digest();
}

/**
 * Firma un DTE usando AES-256-GCM
 * Retorna el JSON firmado con metadatos de firma
 */
export function signDTEWithAES(dtePayload: any): {
  dteJson: any;
  signature: string;
  signatureMethod: string;
  signedAt: string;
  hash: string;
} {
  try {
    // 1. Canonicalizar el JSON (ordenar claves alfabéticamente)
    const canonicalJson = JSON.stringify(dtePayload, Object.keys(dtePayload).sort());
    
    // 2. Generar hash SHA-256 del contenido
    const hash = createHash('sha256')
      .update(canonicalJson)
      .digest('hex');
    
    // 3. Preparar datos para cifrar
    const dataToEncrypt = JSON.stringify({
      payload: dtePayload,
      hash,
      timestamp: new Date().toISOString()
    });
    
    // 4. Cifrar con AES-256-GCM
    const iv = randomBytes(IV_LENGTH);
    const key = getDerivedKey();
    const cipher = createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(dataToEncrypt, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // 5. Construir firma completa (IV + AuthTag + Encrypted)
    const signature = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'hex')
    ]).toString('base64');
    
    // 6. Retornar DTE firmado
    return {
      dteJson: dtePayload,
      signature,
      signatureMethod: 'AES-256-GCM',
      signedAt: new Date().toISOString(),
      hash
    };
  } catch (error) {
    console.error('Error al firmar DTE:', error);
    throw new Error('Error al generar firma electrónica del DTE');
  }
}

/**
 * Verifica la firma de un DTE
 */
export function verifyDTESignature(signature: string, dteJson: any, expectedHash: string): boolean {
  try {
    // Decodificar firma
    const signatureBuffer = Buffer.from(signature, 'base64');
    
    // Extraer componentes
    const iv = signatureBuffer.subarray(0, IV_LENGTH);
    const authTag = signatureBuffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = signatureBuffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    
    // Descifrar
    const key = getDerivedKey();
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    const decryptedData = JSON.parse(decrypted);
    
    // Verificar hash
    const canonicalJson = JSON.stringify(dteJson, Object.keys(dteJson).sort());
    const computedHash = createHash('sha256')
      .update(canonicalJson)
      .digest('hex');
    
    return computedHash === expectedHash && decryptedData.hash === expectedHash;
  } catch (error) {
    console.error('Error al verificar firma DTE:', error);
    return false;
  }
}

/**
 * Genera un código de control único para el DTE
 */
export function generateControlCode(invoiceNumber: string, total: number, date: Date): string {
  const data = `${invoiceNumber}-${total}-${date.toISOString()}`;
  return createHash('sha256')
    .update(data)
    .digest('hex')
    .substring(0, 16)
    .toUpperCase();
}

/**
 * Genera un sello electrónico (timestamp firmado)
 */
export function generateElectronicSeal(): string {
  const timestamp = new Date().toISOString();
  const seal = createHash('sha256')
    .update(`${timestamp}-${SECRET_KEY}`)
    .digest('hex');
  
  return `SEAL-${seal.substring(0, 32).toUpperCase()}`;
}

