import * as fs from 'fs';
import * as path from 'path';

export class Output {
  /**
   * Format data as a string in the specified format.
   */
  static format(data: unknown, format: string = 'json'): string {
    switch (format.toLowerCase()) {
      case 'json':
        return Output.toJSON(data);
      case 'csv':
        return Output.toCSV(data);
      case 'markdown':
      case 'md':
        return Output.toMarkdownTable(data);
      default:
        return Output.toJSON(data);
    }
  }

  /**
   * Write data to file in the specified format.
   */
  static toFile(filePath: string, data: unknown, format: string = 'json'): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const content = Output.format(data, format);
    fs.writeFileSync(filePath, content, 'utf8');
  }

  /**
   * Format as pretty-printed JSON.
   */
  static toJSON(data: unknown): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Format array of objects as CSV.
   */
  static toCSV(data: unknown): string {
    if (!Array.isArray(data) || data.length === 0) {
      return typeof data === 'string' ? data : JSON.stringify(data);
    }

    const items = data as Record<string, unknown>[];
    const headers = Object.keys(items[0]);
    const lines: string[] = [headers.join(',')];

    for (const item of items) {
      const values = headers.map(h => {
        const val = item[h];
        const str = val === null || val === undefined ? '' : String(val);
        // Escape CSV values containing commas, quotes, or newlines
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      lines.push(values.join(','));
    }

    return lines.join('\n');
  }

  /**
   * Format array of objects as a markdown table.
   */
  static toMarkdownTable(data: unknown): string {
    if (!Array.isArray(data) || data.length === 0) {
      return typeof data === 'string' ? data : '```json\n' + JSON.stringify(data, null, 2) + '\n```';
    }

    const items = data as Record<string, unknown>[];
    const headers = Object.keys(items[0]);

    const headerRow = '| ' + headers.join(' | ') + ' |';
    const separator = '| ' + headers.map(() => '---').join(' | ') + ' |';

    const rows = items.map(item => {
      const values = headers.map(h => {
        const val = item[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.length > 80 ? str.substring(0, 77) + '...' : str;
      });
      return '| ' + values.join(' | ') + ' |';
    });

    return [headerRow, separator, ...rows].join('\n');
  }

  /**
   * Pretty print to console with formatting.
   */
  static prettyPrint(data: unknown): void {
    if (Array.isArray(data)) {
      console.log(`\n--- ${data.length} results ---\n`);
      for (const item of data) {
        if (typeof item === 'object' && item !== null) {
          for (const [key, value] of Object.entries(item)) {
            const displayValue = typeof value === 'string' && value.length > 100
              ? value.substring(0, 100) + '...'
              : value;
            console.log(`  ${key}: ${displayValue}`);
          }
          console.log('');
        } else {
          console.log(`  ${item}`);
        }
      }
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}
