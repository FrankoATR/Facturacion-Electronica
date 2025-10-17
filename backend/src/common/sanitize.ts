/**
 * Expresiones regulares para validación y sanitización
 * Basadas en OWASP guidelines
 */
export const SecurityRegex = {
  // Valida email según RFC 5322 simplificado
  email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  
  // Detecta patrones de SQL Injection
  sqlInjection: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE|CAST|CONVERT)\b|--|;|\/\*|\*\/|xp_|sp_)/gi,
  
  // Detecta patrones de XSS
  xssPatterns: /<script[\s\S]*?>[\s\S]*?<\/script>|<iframe[\s\S]*?>[\s\S]*?<\/iframe>|javascript:|onerror=|onload=|onclick=|<img[\s\S]*?onerror[\s\S]*?>|eval\(|expression\(|vbscript:|data:text\/html/gi,
  
  // Detecta path traversal
  pathTraversal: /\.\.[\/\\]/g,
  
  // Valida nombres de usuario (alfanumérico, guiones y puntos)
  username: /^[a-zA-Z0-9._-]{3,30}$/,
  
  // Valida nombres (letras, espacios, acentos)
  name: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]{2,100}$/,
  
  // Valida teléfono internacional
  phone: /^\+?[1-9]\d{1,14}$/,
  
  // Valida números decimales
  decimal: /^\d+(\.\d{1,2})?$/,
  
  // Detecta comandos del sistema
  commandInjection: /[;&|`$(){}[\]<>]/g,
};

/**
 * Sanitiza una cadena eliminando caracteres peligrosos y normalizando espacios
 * Prevención contra XSS, SQL Injection y otras inyecciones
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }

  return input
    // Eliminar caracteres de control
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    // Eliminar caracteres invisibles de Unicode
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    // Normalizar espacios en blanco
    .replace(/[\t\n\r]+/g, " ")
    .replace(/\s{2,}/g, " ")
    // Eliminar tags HTML peligrosos
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .trim();
}

/**
 * Sanitiza una cadena opcional
 */
export function sanitizeOptionalString(input: string | undefined | null): string | undefined {
  if (input == null) return undefined;
  const s = sanitizeString(String(input));
  return s.length ? s : undefined;
}

/**
 * Escapa caracteres HTML para prevenir XSS
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return text.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/**
 * Valida y sanitiza email
 */
export function sanitizeEmail(email: string): string {
  const sanitized = sanitizeString(email).toLowerCase();
  
  if (!SecurityRegex.email.test(sanitized)) {
    throw new Error('Invalid email format');
  }
  
  // Prevenir SQL injection en email
  if (SecurityRegex.sqlInjection.test(sanitized)) {
    throw new Error('Invalid characters in email');
  }
  
  return sanitized;
}

/**
 * Detecta y previene SQL Injection
 */
export function detectSqlInjection(input: string): boolean {
  return SecurityRegex.sqlInjection.test(input);
}

/**
 * Detecta y previene XSS
 */
export function detectXss(input: string): boolean {
  return SecurityRegex.xssPatterns.test(input);
}

/**
 * Detecta path traversal
 */
export function detectPathTraversal(input: string): boolean {
  return SecurityRegex.pathTraversal.test(input);
}

/**
 * Sanitiza input numérico
 */
export function sanitizeNumber(input: any): number {
  const num = Number(input);
  if (!Number.isFinite(num)) {
    throw new Error('Invalid number');
  }
  return num;
}

/**
 * Sanitiza y valida input según un patrón regex
 */
export function sanitizeWithPattern(input: string, pattern: RegExp, errorMessage: string): string {
  const sanitized = sanitizeString(input);
  
  if (!pattern.test(sanitized)) {
    throw new Error(errorMessage);
  }
  
  return sanitized;
}

/**
 * Valida entrada contra múltiples vectores de ataque
 */
export function validateSecureInput(input: string): { isValid: boolean; threats: string[] } {
  const threats: string[] = [];
  
  if (detectSqlInjection(input)) {
    threats.push('SQL Injection detected');
  }
  
  if (detectXss(input)) {
    threats.push('XSS pattern detected');
  }
  
  if (detectPathTraversal(input)) {
    threats.push('Path traversal detected');
  }
  
  if (SecurityRegex.commandInjection.test(input)) {
    threats.push('Command injection detected');
  }
  
  return {
    isValid: threats.length === 0,
    threats
  };
}


