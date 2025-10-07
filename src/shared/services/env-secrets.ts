/* Libraries imports */
import { env } from "cloudflare:workers";

/* Shared module imports */
import { CONFIG_CACHE_TTL } from "@shared/constants";
import { getCurrentISOString } from "@shared/utils";

/* Cache entry structure with TTL expiration */
interface CachedSecret {
  value: string;
  expires: number;
}

/* Configuration service with caching for secure environment variable management */
export class ConfigService {
  private secretCache = new Map<string, CachedSecret>();

  /* Core method: fetch secret with automatic caching and expiration */
  private async getSecretValue(key: string, fetcher: () => Promise<string>): Promise<string> {
    const cached = this.secretCache.get(key);
    const now = Date.now();

    /* Return cached value if still valid */
    if (cached && cached.expires > now) {
      return cached.value;
    }

    /* Fetch fresh value with error handling */
    try {
      const value = await fetcher();
      this.secretCache.set(key, { value, expires: now + CONFIG_CACHE_TTL });
      return value;
    } catch (error) {
      /* Log error details for debugging */
      const errorMessage = error instanceof Error ? error.message : 'Secret fetch failed';
      console.error('[CONFIG-SERVICE] 500: Failed to fetch secret from environment', {
        error: errorMessage,
        secretKey: key,
        timestamp: getCurrentISOString()
      });
      throw error;
    }
  }

  /* Get SendGrid API key with caching */
  async getSendgridApiKey(): Promise<string> {
    return this.getSecretValue('sendgrid_api_key', () => env.SENDGRID_API_KEY.get());
  }

  /* Get Twilio credentials (parallel fetch + JSON serialization) */
  async getTwilioCredentials(): Promise<{ accountSid: string; authToken: string }> {
    const credentialsJson = await this.getSecretValue('twilio_credentials', async () => {
      /* Fetch both Twilio secrets in parallel */
      const [accountSid, authToken] = await Promise.all([
        env.TWILIO_ACCOUNT_SID.get(),
        env.TWILIO_AUTH_TOKEN.get()
      ]);
      return JSON.stringify({ accountSid, authToken });
    });

    /* Parse JSON with error recovery */
    try {
      return JSON.parse(credentialsJson);
    } catch (error) {
      /* Log error details for debugging */
      const errorMessage = error instanceof Error ? error.message : 'JSON parse error';
      console.error('[CONFIG-SERVICE] 500: Failed to parse Twilio credentials from cache', {
        error: errorMessage,
        timestamp: getCurrentISOString()
      });
      this.secretCache.delete('twilio_credentials'); /* Clear corrupted cache */
      throw new Error('Invalid Twilio credentials in cache');
    }
  }

  /* Get JWT secret key with caching */
  async getJwtAuthSecret(): Promise<string> {
    return this.getSecretValue('auth_jwt_secret', () => env.JWT_AUTH_SECRET.get());
  }

  /* Get JWT secret key with caching */
  async getJwtGatewaySecret(): Promise<string> {
    return this.getSecretValue('gateway_jwt_secret', () => env.JWT_GATEWAY_SECRET.get());
  }

  /* Manual cache invalidation */
  clearCache(): void {
    this.secretCache.clear();
  }

  /* Cache monitoring and debugging */
  getCacheStats(): { secretsCached: number; cacheKeys: string[] } {
    return {
      secretsCached: this.secretCache.size,
      cacheKeys: Array.from(this.secretCache.keys())
    };
  }
}

/* Singleton instance for application-wide use */
export const configService = new ConfigService();
