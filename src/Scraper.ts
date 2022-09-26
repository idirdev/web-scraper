import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';
import { ScraperConfig, ScrapeResult } from './types';
import { Parser } from './Parser';
import { resolveUrl } from './utils/url';

const DEFAULT_USER_AGENT = 'NodeScraper/1.0 (https://github.com/example/web-scraper)';

export class Scraper {
  private config: ScraperConfig;
  private parser: Parser;

  constructor(config: ScraperConfig = {}) {
    this.config = {
      timeout: 10000,
      followRedirects: true,
      maxRedirects: 5,
      userAgent: DEFAULT_USER_AGENT,
      ...config,
    };
    this.parser = new Parser();
  }

  async fetch(url: string, redirectCount: number = 0): Promise<ScrapeResult> {
    const html = await this.httpGet(url, redirectCount);
    const baseUrl = url;

    const links = this.parser.extractLinks(html)
      .map(link => resolveUrl(baseUrl, link))
      .filter((link): link is string => link !== null);

    const images = this.parser.extractImages(html)
      .map(src => resolveUrl(baseUrl, src))
      .filter((src): src is string => src !== null);

    const title = this.parser.extractTitle(html);
    const textContent = this.parser.extractTextContent(html);

    return {
      url,
      statusCode: 200,
      html,
      title,
      links: [...new Set(links)],
      images: [...new Set(images)],
      textContent,
      headers: {},
      select: (selector: string) => this.parser.selectElements(html, selector),
    };
  }

  async fetchMultiple(urls: string[]): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];
    for (const url of urls) {
      try {
        const result = await this.fetch(url);
        results.push(result);
      } catch (error) {
        console.error(`Failed to fetch ${url}: ${(error as Error).message}`);
      }
    }
    return results;
  }

  async extractLinks(url: string): Promise<string[]> {
    const result = await this.fetch(url);
    return result.links;
  }

  async extractImages(url: string): Promise<string[]> {
    const result = await this.fetch(url);
    return result.images;
  }

  async extractText(url: string): Promise<string | null> {
    const result = await this.fetch(url);
    return result.textContent;
  }

  private httpGet(url: string, redirectCount: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      const options: http.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        timeout: this.config.timeout,
        headers: {
          'User-Agent': this.config.userAgent || DEFAULT_USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          ...this.config.headers,
        },
      };

      const req = client.request(options, (res) => {
        // Handle redirects
        if (
          this.config.followRedirects &&
          res.statusCode &&
          [301, 302, 303, 307, 308].includes(res.statusCode) &&
          res.headers.location
        ) {
          if (redirectCount >= (this.config.maxRedirects || 5)) {
            reject(new Error(`Too many redirects (max: ${this.config.maxRedirects})`));
            return;
          }
          const redirectUrl = resolveUrl(url, res.headers.location);
          if (!redirectUrl) {
            reject(new Error(`Invalid redirect URL: ${res.headers.location}`));
            return;
          }
          this.httpGet(redirectUrl, redirectCount + 1).then(resolve).catch(reject);
          return;
        }

        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve(data));
        res.on('error', reject);
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${this.config.timeout}ms`));
      });

      req.end();
    });
  }
}
