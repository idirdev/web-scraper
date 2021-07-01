import { URL } from 'url';

/**
 * Resolve a relative URL against a base URL.
 */
export function resolveUrl(base: string, relative: string): string | null {
  try {
    // Handle protocol-relative URLs
    if (relative.startsWith('//')) {
      const baseProtocol = new URL(base).protocol;
      return `${baseProtocol}${relative}`;
    }
    return new URL(relative, base).href;
  } catch {
    return null;
  }
}

/**
 * Normalize a URL by removing trailing slashes, fragments, and lowercasing.
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    let normalized = parsed.href;
    // Remove trailing slash unless it's the root path
    if (normalized.endsWith('/') && parsed.pathname !== '/') {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    return url;
  }
}

/**
 * Extract the domain from a URL.
 */
export function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/**
 * Check if a URL belongs to the same domain.
 */
export function isSameDomain(url: string, domain: string): boolean {
  const urlDomain = extractDomain(url);
  if (!urlDomain) return false;
  return urlDomain === domain || urlDomain.endsWith('.' + domain);
}

/**
 * Parse query parameters from a URL.
 */
export function parseQueryParams(url: string): Record<string, string> {
  try {
    const parsed = new URL(url);
    const params: Record<string, string> = {};
    parsed.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  } catch {
    return {};
  }
}

/**
 * Check if a URL is valid HTTP(S).
 */
export function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Strip URL to just the path (no query, no fragment).
 */
export function getPath(url: string): string | null {
  try {
    return new URL(url).pathname;
  } catch {
    return null;
  }
}
