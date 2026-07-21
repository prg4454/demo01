import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { DataExportService, JsonRow } from '../data-export.service';

@Component({
    selector: 'app-export-dropdown',
    standalone: true,
    imports: [CommonModule, NgbDropdownModule],
    templateUrl: './export-dropdown.component.html',
    styleUrl: './export-dropdown.component.scss'
})
export class ExportDropdownComponent {
    private dataExport = inject(DataExportService);

    @Input() rows: unknown[] = [];
    @Input() fileBaseName = 'export';
    @Input() menuLabel = 'Export';
    @Input() rowMapper: ((row: unknown) => JsonRow) | null = null;

    @Output() statusMessage = new EventEmitter<string>();

    get hasRows(): boolean {
        return this.rows.length > 0;
    }

    exportCsvFile(): void {
        this.dataExport.downloadCsv(this.getExportRows(), `${this.getBaseName()}.csv`);
        this.statusMessage.emit('Downloaded CSV export.');
    }

    exportTsvFile(): void {
        this.dataExport.downloadTsv(this.getExportRows(), `${this.getBaseName()}.tsv`);
        this.statusMessage.emit('Downloaded TSV export.');
    }

    exportJsonFile(): void {
        this.dataExport.downloadJson(this.getExportRows(), `${this.getBaseName()}.json`);
        this.statusMessage.emit('Downloaded JSON export.');
    }

    async exportCsvClipboard(): Promise<void> {
        await this.runClipboardExport(
            () => this.dataExport.copyCsvToClipboard(this.getExportRows()),
            'Copied CSV data to clipboard.'
        );
    }

    async exportTsvClipboard(): Promise<void> {
        await this.runClipboardExport(
            () => this.dataExport.copyTsvToClipboard(this.getExportRows()),
            'Copied TSV data to clipboard.'
        );
    }

    async exportJsonClipboard(): Promise<void> {
        await this.runClipboardExport(
            () => this.dataExport.copyJsonToClipboard(this.getExportRows()),
            'Copied JSON data to clipboard.'
        );
    }

    private getExportRows(): JsonRow[] {
        if (!this.rows.length) {
            return [];
        }

        return this.rows.map((row) => {
            if (this.rowMapper) {
                return this.rowMapper(row);
            }

            if (row && typeof row === 'object' && !Array.isArray(row)) {
                return { ...(row as Record<string, unknown>) };
            }

            return { value: row };
        });
    }

    private getBaseName(): string {
        const trimmed = this.fileBaseName.trim();
        return trimmed.length ? trimmed : 'export';
    }

    private async runClipboardExport(action: () => Promise<void>, successMessage: string): Promise<void> {
        try {
            await action();
            this.statusMessage.emit(successMessage);
        } catch {
            this.statusMessage.emit('Clipboard export is not available in this environment.');
        }
    }
}