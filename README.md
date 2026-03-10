# web-scraper

> Lab project — web scraping utility for learning and experimentation. Use responsibly and respect robots.txt and terms of service.

[![TypeScript](https://img.shields.io/badge/TypeScript-4.5-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)

A web scraping toolkit for Node.js with both CLI and library interfaces. Fetch pages, extract content, and crawl websites with rate limiting.

## Features

- **Page scraping** -- fetch and parse HTML, extract links/images/text/tables
- **CSS-like selectors** -- extract elements by tag, class, id
- **Website crawling** -- BFS or DFS traversal with depth and page limits
- **Rate limiting** -- configurable requests per second and concurrency
- **Multiple output formats** -- JSON, CSV, Markdown tables
- **CLI + library** -- use from the command line or import in your code
- **Zero heavy dependencies** -- uses Node.js built-in `http`/`https` modules

## Installation

```bash
npm install web-scraper
```

## CLI Usage

### Scrape a page

```bash
# Extract all links
web-scraper scrape https://example.com --links

# Extract images
web-scraper scrape https://example.com --images

# Extract text content
web-scraper scrape https://example.com --text

# Use a selector
web-scraper scrape https://example.com -s "h2.title"

# Save to file
web-scraper scrape https://example.com --links -o output/links.json

# CSV format
web-scraper scrape https://example.com --links -f csv -o links.csv
```

### Crawl a website

```bash
# Crawl with defaults (depth 2, max 50 pages, same domain)
web-scraper crawl https://example.com

# Custom depth and limit
web-scraper crawl https://example.com -d 3 -m 100

# Rate-limited crawl
web-scraper crawl https://example.com --rate 1 -o crawl-results.json
```

## Library Usage

### Scrape a page

```typescript
import { Scraper } from 'web-scraper';

const scraper = new Scraper({
  timeout: 10000,
  userAgent: 'MyBot/1.0',
});

const result = await scraper.fetch('https://example.com');

console.log(result.title);       // Page title
console.log(result.links);       // All links on the page
console.log(result.images);      // All image sources
console.log(result.textContent); // Visible text

// Use selectors
const headings = result.select('h2');
const articles = result.select('.article');
```

### Parse HTML

```typescript
import { Parser } from 'web-scraper';

const parser = new Parser();
const html = '<div class="item">Hello</div><div class="item">World</div>';

parser.extractByClass(html, 'item');     // ['Hello', 'World']
parser.extractByTag(html, 'div');        // ['Hello', 'World']
parser.extractById(html, 'main');        // 'content...'
parser.extractLinks(html);              // ['https://...', ...]
parser.extractTables(html);             // [{ headers: [...], rows: [...] }]
```

### Crawl a website

```typescript
import { Crawler } from 'web-scraper';

const crawler = new Crawler({
  maxDepth: 2,
  maxPages: 50,
  sameDomainOnly: true,
  strategy: 'bfs',
  rateLimit: { requestsPerSecond: 2 },
  urlFilter: (url) => !url.includes('/admin'),
});

const pages = await crawler.crawl('https://example.com');

for (const page of pages) {
  console.log(`${page.title} (${page.url}) - ${page.links.length} links`);
}
```

### Output formatting

```typescript
import { Output } from 'web-scraper';

const data = [{ url: 'https://a.com', title: 'A' }, { url: 'https://b.com', title: 'B' }];

Output.toFile('results.json', data, 'json');
Output.toFile('results.csv', data, 'csv');
Output.toFile('results.md', data, 'markdown');

console.log(Output.toCSV(data));
console.log(Output.toMarkdownTable(data));
```

## API Reference

### `Scraper`
| Method | Description |
|--------|-------------|
| `fetch(url)` | Fetch and parse a page |
| `fetchMultiple(urls)` | Fetch multiple pages |
| `extractLinks(url)` | Get all links from a page |
| `extractImages(url)` | Get all image sources |
| `extractText(url)` | Get visible text content |

### `Parser`
| Method | Description |
|--------|-------------|
| `extractByTag(html, tag)` | Extract content by HTML tag |
| `extractByClass(html, class)` | Extract content by class name |
| `extractById(html, id)` | Extract content by element id |
| `extractLinks(html)` | Extract all href values |
| `extractImages(html)` | Extract all img src values |
| `extractTables(html)` | Parse tables to structured data |
| `selectElements(html, selector)` | CSS-like selector query |

### `Crawler`
| Method | Description |
|--------|-------------|
| `crawl(startUrl)` | Start crawling from URL |
| `getVisitedUrls()` | Get all visited URLs |
| `getResults()` | Get all page data |

## Ethical Scraping

- Always respect `robots.txt`
- Use reasonable rate limits (default: 2 req/s)
- Set a descriptive User-Agent string
- Do not overload servers with concurrent requests
- Cache results when possible to avoid repeated requests
- Check a website's Terms of Service before scraping

## License

MIT
