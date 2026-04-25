/** Application configuration loaded from environment variables with safe defaults. */
export interface AppConfig {
  port: number;
  logLevel: string;
  nodeEnv: string;
  memberServiceUrl: string;
  partnerConfigUrl: string;
  version: string;
  /** Default timeout for upstream service calls in milliseconds. */
  serviceTimeoutMs: number;
}

/**
 * Loads application configuration from environment variables.
 * Falls back to safe defaults for every value — the app must always start.
 */
export function loadConfig(): AppConfig {
  return {
    port: parseInt(process.env.PORT ?? '3000', 10),
    logLevel: process.env.LOG_LEVEL ?? 'info',
    nodeEnv: process.env.NODE_ENV ?? 'development',
    memberServiceUrl: process.env.MEMBER_SERVICE_URL ?? 'http://localhost:3001',
    partnerConfigUrl: process.env.PARTNER_CONFIG_URL ?? 'http://localhost:3002',
    version: '1.0.0',
    serviceTimeoutMs: parseInt(process.env.SERVICE_TIMEOUT_MS ?? '5000', 10),
  };
}

export const config = loadConfig();
