/* Password hashing utilities using Cloudflare Web Crypto API */

/* Configuration constants */
const PBKDF2_ITERATIONS = 100000; // OWASP recommended minimum
const SALT_LENGTH = 16; // 16 bytes = 128 bits
const HASH_LENGTH = 32; // 32 bytes = 256 bits

/* Hash password using PBKDF2 with Web Crypto API */
export const hashPassword = async (password: string): Promise<string> => {
  /* Encode password string to Uint8Array */
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);

  /* Generate cryptographically secure random salt */
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  /* Import password as CryptoKey for PBKDF2 */
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    passwordData,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  /* Derive hash using PBKDF2 with SHA-256 */
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    passwordKey,
    HASH_LENGTH * 8 // Convert bytes to bits
  );

  /* Convert hash buffer to Uint8Array */
  const hashArray = new Uint8Array(hashBuffer);

  /* Combine salt and hash for storage */
  const combined = new Uint8Array(SALT_LENGTH + HASH_LENGTH);
  combined.set(salt, 0);
  combined.set(hashArray, SALT_LENGTH);

  /* Encode as base64 string for storage */
  return btoa(String.fromCharCode(...combined));
};

/* Verify password against stored hash */
export const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
  try {
    /* Decode base64 stored hash to Uint8Array */
    const combined = Uint8Array.from(atob(storedHash), c => c.charCodeAt(0));

    /* Extract salt and hash from combined array */
    const salt = combined.slice(0, SALT_LENGTH);
    const originalHash = combined.slice(SALT_LENGTH, SALT_LENGTH + HASH_LENGTH);

    /* Encode input password to Uint8Array */
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);

    /* Import password as CryptoKey for PBKDF2 */
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      passwordData,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    /* Derive hash using same salt and iterations */
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      passwordKey,
      HASH_LENGTH * 8 // Convert bytes to bits
    );

    /* Convert hash buffer to Uint8Array */
    const newHash = new Uint8Array(hashBuffer);

    /* Constant-time comparison to prevent timing attacks */
    if (originalHash.length !== newHash.length) {
      return false;
    }

    let mismatch = 0;
    for (let i = 0; i < originalHash.length; i++) {
      mismatch |= originalHash[i] ^ newHash[i];
    }

    return mismatch === 0;

  } catch (error) {
    /* Return false on any error during verification */
    return false;
  }
};
