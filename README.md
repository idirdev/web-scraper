# web-scraper

A web scraping toolkit for Node.js with both a CLI interface and a library API. Supports HTML parsing, link extraction, image extraction, text extraction, multi-page crawling with BFS/DFS strategies, rate limiting, and multiple output formats (JSON, CSV, Markdown).

## Features

- **Scraper** — fetch and parse a single page, extract links/images/text/elements
- **Crawler** — multi-page BFS or DFS crawl with configurable depth and page limits
- **Parser** — regex-based HTML parser (no external DOM dependency)
- **RateLimiter** — token-bucket rate limiting for polite crawling
- **Output** — export results as JSON, CSV, or Markdown, to console or file
- **CLI** — `web-scraper scrape <url>` and `web-scraper crawl <url>` commands

## Installation

```bash
npm install web-scraper
# or globally for CLI use
npm install -g web-scraper
```

## Quick Start

### As a library

```typescript
import { Scraper, Crawler, Parser, Output } from 'web-scraper';

// Scrape a single page
const scraper = new Scraper({ timeout: 5000 });
const result = await scraper.fetch('https://example.com');
console.log(result.title);
console.log(result.links);
console.log(result.textContent);

// Crawl a website
const crawler = new Crawler({ maxDepth: 2, maxPages: 20, sameDomainOnly: true });
const pages = await crawler.crawl('https://example.com');
pages.forEach(p => console.log(p.url, p.title));
```

### As a CLI

```bash
# Scrape a page and print JSON
web-scraper scrape https://example.com

# Extract only links
web-scraper scrape https://example.com --links

# Save as CSV
web-scraper scrape https://example.com --format csv --output results.csv

# Crawl up to depth 3, max 100 pages
web-scraper crawl https://example.com --depth 3 --max 100 --output pages.json
```

## API Reference

### `Scraper`

| Method | Description |
|--------|-------------|
| `fetch(url)` | Fetch and parse a page, returns `ScrapeResult` |
| `fetchMultiple(urls)` | Fetch multiple pages in sequence |
| `extractLinks(url)` | Return all links from a page |
| `extractImages(url)` | Return all image URLs from a page |
| `extractText(url)` | Return plain text content |

### `ScrapeResult`

```typescript
{
  url: string;
  statusCode: number;
  html: string;
  title: string | null;
  links: string[];
  images: string[];
  textContent: string | null;
  select(selector: string): string[];  // simple CSS-like extraction
}
```

### `Crawler`

```typescript
new Crawler({
  maxDepth: 3,           // max crawl depth
  maxPages: 100,         // stop after N pages
  sameDomainOnly: true,  // stay on the same domain
  strategy: 'bfs',       // 'bfs' or 'dfs'
  rateLimit: { requestsPerSecond: 2 },
});
```

### `Parser`

```typescript
parser.extractLinks(html)       // string[]
parser.extractImages(html)      // string[]
parser.extractTitle(html)       // string | null
parser.extractTextContent(html) // string | null
parser.extractByTag(html, tag)  // string[]
parser.extractByClass(html, className) // string[]
parser.selectElements(html, selector)  // string[]
```

### `Output`

```typescript
Output.format(data, 'json' | 'csv' | 'markdown') // string
Output.toFile(filePath, data, format)              // void
```

## License

MIT

---

## 🇫🇷 Documentation en français

### Présentation

`web-scraper` est une boîte à outils de scraping web pour Node.js. Elle fournit une API bibliothèque et une interface CLI pour extraire des données (liens, images, texte, éléments HTML) depuis des pages web, avec crawl multi-pages, limitation du débit et export dans plusieurs formats.

### Installation

```bash
npm install web-scraper
# ou en global pour la CLI
npm install -g web-scraper
```

### Utilisation rapide

```typescript
import { Scraper, Crawler } from 'web-scraper';

// Scraper une page
const scraper = new Scraper();
const page = await scraper.fetch('https://exemple.com');
console.log(page.title, page.links);

// Crawler un site
const crawler = new Crawler({ maxDepth: 2, maxPages: 30 });
const pages = await crawler.crawl('https://exemple.com');
```

### CLI

```bash
# Scraper avec sortie JSON
web-scraper scrape https://exemple.com

# Extraire les liens
web-scraper scrape https://exemple.com --links

# Crawler et sauvegarder
web-scraper crawl https://exemple.com --depth 2 --max 50 --output pages.json
```

### Fonctionnalités

- Scraping de page unique avec extraction de liens, images et texte
- Crawl multi-pages BFS ou DFS
- Limitation du débit (token bucket) pour un crawling respectueux
- Export JSON, CSV ou Markdown
- Aucune dépendance DOM externe — parseur regex pur Node.js
