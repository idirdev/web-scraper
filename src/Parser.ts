import { ExtractedTable, Selector } from './types';

export class Parser {
  /**
   * Extract all text within a specific HTML tag.
   */
  extractByTag(html: string, tag: string): string[] {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
    const matches: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
      matches.push(this.stripTags(match[1]).trim());
    }
    return matches.filter(m => m.length > 0);
  }

  /**
   * Extract content of elements with a specific class.
   */
  extractByClass(html: string, className: string): string[] {
    const regex = new RegExp(`<[^>]+class="[^"]*\\b${this.escapeRegex(className)}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/[^>]+>`, 'gi');
    const matches: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
      matches.push(this.stripTags(match[1]).trim());
    }
    return matches;
  }

  /**
   * Extract content of the element with a specific id.
   */
  extractById(html: string, id: string): string | null {
    const regex = new RegExp(`<[^>]+id="${this.escapeRegex(id)}"[^>]*>([\\s\\S]*?)<\\/[^>]+>`, 'i');
    const match = regex.exec(html);
    return match ? this.stripTags(match[1]).trim() : null;
  }

  /**
   * Extract attribute values from matching elements.
   */
  extractAttributes(html: string, tag: string, attribute: string): string[] {
    const regex = new RegExp(`<${tag}[^>]+${attribute}="([^"]*)"[^>]*>`, 'gi');
    const values: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
      values.push(match[1]);
    }
    return values;
  }

  /**
   * Extract all visible text from HTML.
   */
  extractTextContent(html: string): string | null {
    // Remove script and style content
    let cleaned = html.replace(/<script[\s\S]*?<\/script>/gi, '');
    cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, '');
    cleaned = cleaned.replace(/<noscript[\s\S]*?<\/noscript>/gi, '');

    // Remove all HTML tags
    const text = this.stripTags(cleaned);

    // Normalize whitespace
    const normalized = text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    return normalized.length > 0 ? normalized : null;
  }

  /**
   * Extract the page title.
   */
  extractTitle(html: string): string | null {
    const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
    return match ? match[1].trim() : null;
  }

  /**
   * Extract all links (href values from <a> tags).
   */
  extractLinks(html: string): string[] {
    return this.extractAttributes(html, 'a', 'href');
  }

  /**
   * Extract all image sources.
   */
  extractImages(html: string): string[] {
    return this.extractAttributes(html, 'img', 'src');
  }

  /**
   * Extract meta tag content.
   */
  extractMeta(html: string, name: string): string | null {
    const regex = new RegExp(`<meta[^>]+name="${this.escapeRegex(name)}"[^>]+content="([^"]*)"`, 'i');
    const match = regex.exec(html);
    if (match) return match[1];

    // Try reverse order (content before name)
    const regex2 = new RegExp(`<meta[^>]+content="([^"]*)"[^>]+name="${this.escapeRegex(name)}"`, 'i');
    const match2 = regex2.exec(html);
    return match2 ? match2[1] : null;
  }

  /**
   * Extract tables into structured arrays.
   */
  extractTables(html: string): ExtractedTable[] {
    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
    const tables: ExtractedTable[] = [];
    let tableMatch: RegExpExecArray | null;

    while ((tableMatch = tableRegex.exec(html)) !== null) {
      const tableHtml = tableMatch[1];
      const headers: string[] = [];
      const rows: string[][] = [];

      // Extract headers
      const thRegex = /<th[^>]*>([\s\S]*?)<\/th>/gi;
      let thMatch: RegExpExecArray | null;
      while ((thMatch = thRegex.exec(tableHtml)) !== null) {
        headers.push(this.stripTags(thMatch[1]).trim());
      }

      // Extract rows
      const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let trMatch: RegExpExecArray | null;
      while ((trMatch = trRegex.exec(tableHtml)) !== null) {
        const row: string[] = [];
        const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
        let tdMatch: RegExpExecArray | null;
        while ((tdMatch = tdRegex.exec(trMatch[1])) !== null) {
          row.push(this.stripTags(tdMatch[1]).trim());
        }
        if (row.length > 0) rows.push(row);
      }

      tables.push({ headers, rows });
    }

    return tables;
  }

  /**
   * Select elements matching a simple CSS-like selector.
   * Supports: tag, .class, #id, tag.class, tag#id
   */
  selectElements(html: string, selector: string): string[] {
    const parsed = this.parseSelector(selector);

    if (parsed.id) {
      const result = this.extractById(html, parsed.id);
      return result ? [result] : [];
    }

    if (parsed.className && parsed.tag) {
      const byTag = this.extractByTagRaw(html, parsed.tag);
      return byTag
        .filter(el => new RegExp(`class="[^"]*\\b${this.escapeRegex(parsed.className!)}\\b`).test(el))
        .map(el => this.stripTags(el.replace(/^<[^>]+>/, '').replace(/<\/[^>]+>$/, '')).trim());
    }

    if (parsed.className) {
      return this.extractByClass(html, parsed.className);
    }

    if (parsed.tag) {
      return this.extractByTag(html, parsed.tag);
    }

    return [];
  }

  private parseSelector(selector: string): Selector {
    const result: Selector = {};

    if (selector.startsWith('#')) {
      result.id = selector.slice(1);
    } else if (selector.startsWith('.')) {
      result.className = selector.slice(1);
    } else if (selector.includes('#')) {
      const [tag, id] = selector.split('#');
      result.tag = tag;
      result.id = id;
    } else if (selector.includes('.')) {
      const [tag, className] = selector.split('.');
      result.tag = tag;
      result.className = className;
    } else {
      result.tag = selector;
    }

    return result;
  }

  private extractByTagRaw(html: string, tag: string): string[] {
    const regex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
    const matches: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
      matches.push(match[0]);
    }
    return matches;
  }

  private stripTags(html: string): string {
    return html.replace(/<[^>]+>/g, '');
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
