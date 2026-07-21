import { Injectable } from '@angular/core';

export type JsonRow = Record<string, unknown>;

@Injectable({
    providedIn: 'root'
})
export class DataExportService {
    toCsv(rows: JsonRow[]): string {
        return this.toDelimited(rows, ',');
    }

    toTsv(rows: JsonRow[]): string {
        return this.toDelimited(rows, '\t');
    }

    toJson(rows: JsonRow[], pretty = true): string {
        return JSON.stringify(rows, null, pretty ? 2 : 0);
    }

    downloadCsv(rows: JsonRow[], fileName = 'export.csv'): void {
        const content = this.toCsv(rows);
        this.downloadTextFile(content, fileName, 'text/csv;charset=utf-8');
    }

    downloadTsv(rows: JsonRow[], fileName = 'export.tsv'): void {
        const content = this.toTsv(rows);
        this.downloadTextFile(content, fileName, 'text/tab-separated-values;charset=utf-8');
    }

    downloadJson(rows: JsonRow[], fileName = 'export.json', pretty = true): void {
        const content = this.toJson(rows, pretty);
        this.downloadTextFile(content, fileName, 'application/json;charset=utf-8');
    }

    async copyCsvToClipboard(rows: JsonRow[]): Promise<void> {
        await this.copyTextToClipboard(this.toCsv(rows));
    }

    async copyTsvToClipboard(rows: JsonRow[]): Promise<void> {
        await this.copyTextToClipboard(this.toTsv(rows));
    }

    async copyJsonToClipboard(rows: JsonRow[], pretty = true): Promise<void> {
        await this.copyTextToClipboard(this.toJson(rows, pretty));
    }

    async copyDelimitedToClipboard(rows: JsonRow[], delimiter: ',' | '\t'): Promise<void> {
        await this.copyTextToClipboard(this.toDelimited(rows, delimiter));
    }

    private toDelimited(rows: JsonRow[], delimiter: ',' | '\t'): string {
        if (!rows.length) {
            return '';
        }

        const headers = this.collectHeaders(rows);
        const headerLine = headers.map(header => this.escapeCell(header, delimiter)).join(delimiter);

        const bodyLines = rows.map((row) => {
            return headers
                .map((header) => this.escapeCell(this.stringifyValue(row[header]), delimiter))
                .join(delimiter);
        });

        return [headerLine, ...bodyLines].join('\n');
    }

    private collectHeaders(rows: JsonRow[]): string[] {
        const seen = new Set<string>();
        const headers: string[] = [];

        for (const row of rows) {
            for (const key of Object.keys(row)) {
                if (!seen.has(key)) {
                    seen.add(key);
                    headers.push(key);
                }
            }
        }

        return headers;
    }

    private stringifyValue(value: unknown): string {
        if (value === null || value === undefined) {
            return '';
        }

        if (value instanceof Date) {
            return value.toISOString();
        }

        if (typeof value === 'object') {
            try {
                return JSON.stringify(value);
            } catch {
                return String(value);
            }
        }

        return String(value);
    }

    private escapeCell(value: string, delimiter: ',' | '\t'): string {
        const normalized = value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const sanitized = delimiter === '\t'
            ? normalized.replace(/\t/g, '\\t')
            : normalized;

        const requiresQuotes =
            sanitized.includes('"') ||
            sanitized.includes('\n') ||
            sanitized.includes(delimiter) ||
            sanitized.includes('\t');

        if (!requiresQuotes) {
            return sanitized;
        }

        return `"${sanitized.replace(/"/g, '""')}"`;
    }

    private downloadTextFile(content: string, fileName: string, mimeType: string): void {
        if (typeof document === 'undefined') {
            throw new Error('Download is only available in a browser context.');
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');

        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);

        URL.revokeObjectURL(url);
    }

    private async copyTextToClipboard(content: string): Promise<void> {
        if (typeof navigator === 'undefined' || !navigator.clipboard) {
            throw new Error('Clipboard API is not available in this environment.');
        }

        await navigator.clipboard.writeText(content);
    }
}