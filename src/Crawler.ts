import { CrawlOptions, PageData } from './types';
import { Scraper } from './Scraper';
import { RateLimiter } from './RateLimiter';
import { extractDomain, isSameDomain, normalizeUrl } from './utils/url';

export class Crawler {
  private options: Required<CrawlOptions>;
  private scraper: Scraper;
  private rateLimiter: RateLimiter;
  private visited: Set<string> = new Set();
  private results: PageData[] = [];

  constructor(options: CrawlOptions = {}) {
    this.options = {
      maxDepth: options.maxDepth ?? 3,
      maxPages: options.maxPages ?? 100,
      sameDomainOnly: options.sameDomainOnly ?? true,
      urlFilter: options.urlFilter ?? (() => true),
      strategy: options.strategy ?? 'bfs',
      rateLimit: options.rateLimit ?? { requestsPerSecond: 2 },
    };

    this.scraper = new Scraper();
    this.rateLimiter = new RateLimiter(this.options.rateLimit);
  }

  async crawl(startUrl: string): Promise<PageData[]> {
    this.visited.clear();
    this.results = [];

    const startDomain = extractDomain(startUrl);
    if (!startDomain) throw new Error(`Invalid URL: ${startUrl}`);

    if (this.options.strategy === 'bfs') {
      await this.bfs(startUrl, startDomain);
    } else {
      await this.dfs(startUrl, startDomain, 0);
    }

    return this.results;
  }

  private async bfs(startUrl: string, startDomain: string): Promise<void> {
    const queue: Array<{ url: string; depth: number }> = [{ url: normalizeUrl(startUrl), depth: 0 }];

    while (queue.length > 0 && this.results.length < this.options.maxPages) {
      const entry = queue.shift();
      if (!entry) break;

      const { url, depth } = entry;
      const normalized = normalizeUrl(url);

      if (this.visited.has(normalized)) continue;
      if (depth > this.options.maxDepth) continue;
      if (!this.options.urlFilter(normalized)) continue;
      if (this.options.sameDomainOnly && !isSameDomain(normalized, startDomain)) continue;

      this.visited.add(normalized);
      await this.rateLimiter.wait();

      try {
        console.log(`[Crawl] Depth ${depth}: ${normalized}`);
        const result = await this.scraper.fetch(normalized);

        const pageData: PageData = {
          url: normalized,
          title: result.title,
          links: result.links,
          images: result.images,
          text: result.textContent,
          depth,
          timestamp: Date.now(),
        };

        this.results.push(pageData);

        if (depth < this.options.maxDepth) {
          for (const link of result.links) {
            const normLink = normalizeUrl(link);
            if (!this.visited.has(normLink)) {
              queue.push({ url: normLink, depth: depth + 1 });
            }
          }
        }
      } catch (error) {
        console.error(`[Crawl] Failed: ${normalized} - ${(error as Error).message}`);
      }
    }
  }

  private async dfs(url: string, startDomain: string, depth: number): Promise<void> {
    if (this.results.length >= this.options.maxPages) return;
    if (depth > this.options.maxDepth) return;

    const normalized = normalizeUrl(url);

    if (this.visited.has(normalized)) return;
    if (!this.options.urlFilter(normalized)) return;
    if (this.options.sameDomainOnly && !isSameDomain(normalized, startDomain)) return;

    this.visited.add(normalized);
    await this.rateLimiter.wait();

    try {
      console.log(`[Crawl] Depth ${depth}: ${normalized}`);
      const result = await this.scraper.fetch(normalized);

      const pageData: PageData = {
        url: normalized,
        title: result.title,
        links: result.links,
        images: result.images,
        text: result.textContent,
        depth,
        timestamp: Date.now(),
      };

      this.results.push(pageData);

      for (const link of result.links) {
        if (this.results.length >= this.options.maxPages) break;
        await this.dfs(link, startDomain, depth + 1);
      }
    } catch (error) {
      console.error(`[Crawl] Failed: ${normalized} - ${(error as Error).message}`);
    }
  }

  getVisitedUrls(): string[] {
    return [...this.visited];
  }

  getResults(): PageData[] {
    return [...this.results];
  }
}
