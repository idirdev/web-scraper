import { describe, it, expect } from 'vitest';
import { Parser } from '../src/Parser';
import { RateLimiter } from '../src/RateLimiter';

describe('Parser', () => {
  const parser = new Parser();

  describe('extractByTag', () => {
    it('extracts text content from matching tags', () => {
      const html = '<p>Hello</p><p>World</p>';
      const result = parser.extractByTag(html, 'p');
      expect(result).toEqual(['Hello', 'World']);
    });

    it('strips nested tags from results', () => {
      const html = '<p><strong>Bold</strong> text</p>';
      const result = parser.extractByTag(html, 'p');
      expect(result).toEqual(['Bold text']);
    });

    it('returns empty array for no matches', () => {
      const html = '<p>Hello</p>';
      const result = parser.extractByTag(html, 'div');
      expect(result).toEqual([]);
    });
  });

  describe('extractByClass', () => {
    it('extracts content from elements with given class', () => {
      const html = '<div class="highlight">Important</div><div class="normal">Normal</div>';
      const result = parser.extractByClass(html, 'highlight');
      expect(result).toEqual(['Important']);
    });
  });

  describe('extractById', () => {
    it('extracts content from element with given id', () => {
      const html = '<div id="main">Content</div><div id="sidebar">Side</div>';
      const result = parser.extractById(html, 'main');
      expect(result).toBe('Content');
    });

    it('returns null when id not found', () => {
      const html = '<div id="main">Content</div>';
      expect(parser.extractById(html, 'missing')).toBeNull();
    });
  });

  describe('extractAttributes', () => {
    it('extracts href attributes from anchor tags', () => {
      const html = '<a href="https://example.com">Link</a><a href="https://test.com">Test</a>';
      const result = parser.extractAttributes(html, 'a', 'href');
      expect(result).toEqual(['https://example.com', 'https://test.com']);
    });

    it('extracts src attributes from img tags', () => {
      const html = '<img src="image.png" alt="test"><img src="logo.svg" alt="logo">';
      const result = parser.extractAttributes(html, 'img', 'src');
      expect(result).toEqual(['image.png', 'logo.svg']);
    });
  });

  describe('extractTitle', () => {
    it('extracts the page title', () => {
      const html = '<html><head><title>My Page</title></head><body></body></html>';
      expect(parser.extractTitle(html)).toBe('My Page');
    });

    it('returns null when no title exists', () => {
      const html = '<html><head></head><body></body></html>';
      expect(parser.extractTitle(html)).toBeNull();
    });
  });

  describe('extractLinks', () => {
    it('extracts all link hrefs', () => {
      const html = '<a href="/about">About</a><a href="/contact">Contact</a>';
      const result = parser.extractLinks(html);
      expect(result).toEqual(['/about', '/contact']);
    });
  });

  describe('extractImages', () => {
    it('extracts all image sources', () => {
      const html = '<img src="a.png"><img src="b.jpg">';
      expect(parser.extractImages(html)).toEqual(['a.png', 'b.jpg']);
    });
  });

  describe('extractMeta', () => {
    it('extracts meta tag content by name', () => {
      const html = '<meta name="description" content="A test page">';
      expect(parser.extractMeta(html, 'description')).toBe('A test page');
    });

    it('returns null when meta not found', () => {
      const html = '<meta name="author" content="John">';
      expect(parser.extractMeta(html, 'description')).toBeNull();
    });
  });

  describe('extractTextContent', () => {
    it('extracts visible text from HTML', () => {
      const html = '<html><body><h1>Title</h1><p>Some text</p></body></html>';
      const result = parser.extractTextContent(html);
      expect(result).toContain('Title');
      expect(result).toContain('Some text');
    });

    it('removes script tags from text content', () => {
      const html = '<body><p>Visible</p><script>var x = 1;</script></body>';
      const result = parser.extractTextContent(html);
      expect(result).toContain('Visible');
      expect(result).not.toContain('var x');
    });

    it('removes style tags from text content', () => {
      const html = '<body><p>Visible</p><style>body { color: red; }</style></body>';
      const result = parser.extractTextContent(html);
      expect(result).not.toContain('color');
    });
  });

  describe('extractTables', () => {
    it('extracts table data with headers and rows', () => {
      const html = `
        <table>
          <tr><th>Name</th><th>Age</th></tr>
          <tr><td>Alice</td><td>30</td></tr>
          <tr><td>Bob</td><td>25</td></tr>
        </table>`;
      const tables = parser.extractTables(html);
      expect(tables.length).toBe(1);
      expect(tables[0].headers).toEqual(['Name', 'Age']);
      expect(tables[0].rows).toEqual([['Alice', '30'], ['Bob', '25']]);
    });
  });

  describe('selectElements', () => {
    it('selects by tag name', () => {
      const html = '<p>Hello</p><p>World</p>';
      const result = parser.selectElements(html, 'p');
      expect(result).toEqual(['Hello', 'World']);
    });

    it('selects by id', () => {
      const html = '<div id="main">Content</div>';
      const result = parser.selectElements(html, '#main');
      expect(result).toEqual(['Content']);
    });

    it('selects by class', () => {
      const html = '<span class="highlight">Text</span>';
      const result = parser.selectElements(html, '.highlight');
      expect(result).toEqual(['Text']);
    });

    it('returns empty for no matches', () => {
      const html = '<p>Text</p>';
      const result = parser.selectElements(html, '#nonexistent');
      expect(result).toEqual([]);
    });
  });
});

describe('RateLimiter', () => {
  it('initializes with default configuration', () => {
    const limiter = new RateLimiter();
    const stats = limiter.getStats();
    expect(stats.activeRequests).toBe(0);
    expect(stats.queueLength).toBe(0);
    expect(stats.delayMs).toBeGreaterThan(0);
  });

  it('initializes with custom configuration', () => {
    const limiter = new RateLimiter({ requestsPerSecond: 10, concurrent: 5 });
    const stats = limiter.getStats();
    expect(stats.delayMs).toBe(100);
  });

  it('tracks active requests after wait and release', async () => {
    const limiter = new RateLimiter({ requestsPerSecond: 100, concurrent: 5, delayMs: 0 });
    await limiter.wait();
    expect(limiter.getStats().activeRequests).toBe(1);
    limiter.release();
    expect(limiter.getStats().activeRequests).toBe(0);
  });
});
