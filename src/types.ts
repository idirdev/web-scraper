export interface ScraperConfig {
  headers?: Record<string, string>;
  timeout?: number;
  followRedirects?: boolean;
  maxRedirects?: number;
  proxy?: ProxyConfig;
  userAgent?: string;
}

export interface ScrapeResult {
  url: string;
  statusCode: number;
  html: string;
  title: string | null;
  links: string[];
  images: string[];
  textContent: string | null;
  headers: Record<string, string>;
  select(selector: string): string[];
}

export interface Selector {
  tag?: string;
  id?: string;
  className?: string;
  attribute?: { name: string; value?: string };
}

export interface PageData {
  url: string;
  title: string | null;
  links: string[];
  images: string[];
  text: string | null;
  depth: number;
  timestamp: number;
}

export interface CrawlOptions {
  maxDepth?: number;
  maxPages?: number;
  sameDomainOnly?: boolean;
  urlFilter?: (url: string) => boolean;
  strategy?: 'bfs' | 'dfs';
  rateLimit?: RateLimitConfig;
}

export interface RateLimitConfig {
  requestsPerSecond?: number;
  delayMs?: number;
  concurrent?: number;
}

export interface ProxyConfig {
  host: string;
  port: number;
  auth?: { username: string; password: string };
  protocol?: 'http' | 'https' | 'socks5';
}

export interface ExtractedTable {
  headers: string[];
  rows: string[][];
}
