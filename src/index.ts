#!/usr/bin/env node

import { Command } from 'commander';
import { Scraper } from './Scraper';
import { Crawler } from './Crawler';
import { Output } from './Output';

export { Scraper } from './Scraper';
export { Parser } from './Parser';
export { Crawler } from './Crawler';
export { RateLimiter } from './RateLimiter';
export { Output } from './Output';
export * from './types';
export * from './utils/url';

const program = new Command();

program
  .name('web-scraper')
  .description('Web scraping toolkit for Node.js')
  .version('1.0.0');

program
  .command('scrape <url>')
  .description('Scrape a single page')
  .option('-s, --selector <selector>', 'CSS-like selector to extract')
  .option('-o, --output <file>', 'Output file path')
  .option('-f, --format <format>', 'Output format: json, csv, markdown', 'json')
  .option('--links', 'Extract all links')
  .option('--images', 'Extract all images')
  .option('--text', 'Extract text content only')
  .action(async (url: string, opts) => {
    const scraper = new Scraper();
    const result = await scraper.fetch(url);

    let data: unknown;
    if (opts.links) data = result.links;
    else if (opts.images) data = result.images;
    else if (opts.text) data = result.textContent;
    else if (opts.selector) data = result.select(opts.selector);
    else data = { title: result.title, links: result.links, text: result.textContent?.substring(0, 500) };

    if (opts.output) {
      Output.toFile(opts.output, data, opts.format);
      console.log(`Output written to ${opts.output}`);
    } else {
      console.log(Output.format(data, opts.format));
    }
  });

program
  .command('crawl <url>')
  .description('Crawl a website starting from URL')
  .option('-d, --depth <number>', 'Maximum crawl depth', '2')
  .option('-m, --max <number>', 'Maximum pages to crawl', '50')
  .option('--same-domain', 'Only follow same-domain links', true)
  .option('-o, --output <file>', 'Output file path')
  .option('--rate <number>', 'Requests per second', '2')
  .action(async (url: string, opts) => {
    const crawler = new Crawler({
      maxDepth: parseInt(opts.depth),
      maxPages: parseInt(opts.max),
      sameDomainOnly: opts.sameDomain,
      rateLimit: { requestsPerSecond: parseFloat(opts.rate) },
    });

    const results = await crawler.crawl(url);
    const summary = results.map(r => ({ url: r.url, title: r.title, links: r.links.length }));

    if (opts.output) {
      Output.toFile(opts.output, summary, 'json');
      console.log(`Crawled ${results.length} pages. Output: ${opts.output}`);
    } else {
      console.log(Output.format(summary, 'json'));
    }
  });

// Only run CLI if executed directly
if (require.main === module) {
  program.parse();
}
