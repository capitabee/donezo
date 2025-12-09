// backend/src/config/index.ts
// Environment variables and configuration

/**
 * Get the base URL for the application
 * Priority:
 * 1. BASE_URL (production)
 * 2. FRONTEND_URL (fallback for production)
 * 3. REPLIT_DOMAINS (legacy support)
 * 4. localhost:5000 (development)
 */
export function getBaseUrl(): string {
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }
  
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL;
  }
  
  if (process.env.REPLIT_DOMAINS) {
    return `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`;
  }
  
  // Development fallback
  return 'http://localhost:5000';
}

/**
 * Get CORS allowed origins
 */
export function getCorsOrigins(): string[] {
  const origins: string[] = [];
  
  // Production frontend URL
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }
  
  // Vercel domain (if provided)
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }
  
  // Custom Vercel domain
  if (process.env.VERCEL_CUSTOM_DOMAIN) {
    origins.push(`https://${process.env.VERCEL_CUSTOM_DOMAIN}`);
  }
  
  // Development
  origins.push('http://localhost:5173');
  origins.push('http://localhost:5000');
  
  return origins;
}

export const config = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.SESSION_SECRET || 'donezo-secret-key',
  baseUrl: getBaseUrl(),
  corsOrigins: getCorsOrigins(),
};
