import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

interface UiEmployerTaxRow {
    id: string;
    scope: string;
    maxEarningsSubjectToTax: string;
    employerRate: string;
    maxTaxPerEmployee: string;
    notes: string;
    sourceName: string;
    sourceUrl: string;
    lastReviewed: string;
}

@Component({
    selector: 'app-ui-employer-tax',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './ui-employer-tax.component.html',
    styleUrl: './ui-employer-tax.component.scss'
})
export class UiEmployerTaxComponent implements OnInit {
    private readonly changeDetectorRef = inject(ChangeDetectorRef);
    private readonly storageKey = 'ui-employer-tax-data-v2';
    private readonly sourceUrl = 'https://www.patriotsoftware.com/blog/payroll/what-is-my-state-unemployment-tax-rate/';

    rows: UiEmployerTaxRow[] = [];
    isLoading = false;
    statusMessage = '';
    currentProcessingState = '';
    processedStates = 0;
    totalStates = 0;

    async ngOnInit(): Promise<void> {
        const storedRows = this.loadStoredRows();
        if (storedRows.length > 0) {
            this.rows = storedRows;
            this.statusMessage = 'Loaded saved data. Use Refresh to fetch the latest data from the internet.';
            return;
        }

        await this.refreshFromInternet(true);
    }

    async refreshFromInternet(isFirstLoad = false): Promise<void> {
        this.isLoading = true;
        this.currentProcessingState = '';
        this.processedStates = 0;
        this.totalStates = 0;
        this.statusMessage = 'Fetching latest all-state UI employer tax details from the internet...';

        try {
            const pageText = await this.fetchText(this.sourceUrl);
            const stateRows = await this.extractStateRows(pageText);
            if (!stateRows.length) {
                throw new Error('Could not parse state wage-base and rate details from source.');
            }

            this.rows = stateRows;
            this.saveRows(stateRows);

            this.statusMessage = isFirstLoad
                ? 'Data fetched and saved for future visits.'
                : 'Data refreshed from the internet and saved.';
        } catch (error) {
            if (this.rows.length === 0) {
                this.rows = [];
            }

            this.statusMessage = `Refresh failed: ${this.getErrorMessage(error)} Showing saved data if available.`;
        } finally {
            this.currentProcessingState = '';
            this.isLoading = false;
        }
    }

    private async fetchText(url: string): Promise<string> {
        const response = await fetch(url, {
            method: 'GET',
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} while loading ${url}`);
        }

        return response.text();
    }

    private async extractStateRows(pageText: string): Promise<UiEmployerTaxRow[]> {
        const document = new DOMParser().parseFromString(pageText, 'text/html');
        const tables = Array.from(document.querySelectorAll('table'));
        const stateTable = tables.find((table) => {
            const headerText = Array.from(table.querySelectorAll('th'))
                .map((header) => header.textContent?.trim().toLowerCase() ?? '')
                .join(' | ');

            return headerText.includes('new employer tax rate')
                && headerText.includes('employer tax rate range')
                && headerText.includes('taxable wage base');
        });

        if (!stateTable) {
            return [];
        }

        const bodyRows = Array.from(stateTable.querySelectorAll('tbody tr'));
        const parsedRows = bodyRows
            .map((row) => Array.from(row.querySelectorAll('td')).map((cell) => this.normalizeText(cell.textContent)))
            .filter((cells) => cells.length >= 4 && !!cells[0]);

        this.totalStates = parsedRows.length;
        this.rows = [];

        const builtRows: UiEmployerTaxRow[] = [];
        for (const [index, cells] of parsedRows.entries()) {
            const row = this.buildStateRow(cells[0], cells[1], cells[2], cells[3]);
            this.currentProcessingState = row.scope;
            this.processedStates = index;
            builtRows.push(row);
            this.rows = [...builtRows];
            this.changeDetectorRef.detectChanges();
            await this.waitForUiPaint();
        }

        this.processedStates = builtRows.length;
        return builtRows;
    }

    private buildStateRow(
        stateName: string,
        newEmployerRate: string,
        employerRateRange: string,
        taxableWageBase: string
    ): UiEmployerTaxRow {
        const reviewedDate = new Date().toLocaleDateString();
        const normalizedWageBase = taxableWageBase || 'Not listed';
        const rateSummary = this.buildRateSummary(newEmployerRate, employerRateRange);
        const maxTaxSummary = this.buildMaxTaxSummary(newEmployerRate, employerRateRange, taxableWageBase);
        const notes = this.buildNotes(newEmployerRate, employerRateRange, taxableWageBase);

        return {
            id: this.slugify(stateName),
            scope: stateName,
            maxEarningsSubjectToTax: normalizedWageBase,
            employerRate: rateSummary,
            maxTaxPerEmployee: maxTaxSummary,
            notes,
            sourceName: 'Patriot 2026 state-by-state SUTA chart',
            sourceUrl: this.sourceUrl,
            lastReviewed: reviewedDate
        };
    }

    private buildRateSummary(newEmployerRate: string, employerRateRange: string): string {
        const parts: string[] = [];

        if (newEmployerRate) {
            parts.push(`New employer: ${newEmployerRate}`);
        }

        if (employerRateRange) {
            parts.push(`Range: ${employerRateRange}`);
        }

        return parts.join(' | ') || 'Varies';
    }

    private buildMaxTaxSummary(newEmployerRate: string, employerRateRange: string, taxableWageBase: string): string {
        const wageBase = this.extractCurrencyValue(taxableWageBase);
        const maxRate = this.extractHighestPercent(employerRateRange);
        const newEmployerPercent = this.extractFirstPercent(newEmployerRate);

        if (wageBase !== null && maxRate !== null) {
            return `Up to $${((wageBase * maxRate) / 100).toFixed(2)} at top published rate`;
        }

        if (wageBase !== null && newEmployerPercent !== null) {
            return `Approx. $${((wageBase * newEmployerPercent) / 100).toFixed(2)} at new employer rate`;
        }

        return 'Varies';
    }

    private buildNotes(newEmployerRate: string, employerRateRange: string, taxableWageBase: string): string {
        const notes: string[] = [];

        if (/employee/i.test(newEmployerRate) || /employee/i.test(employerRateRange)) {
            notes.push('Includes employee contribution details.');
        }

        if (/varies|tbd|industry/i.test(newEmployerRate) || /varies|industry/i.test(taxableWageBase)) {
            notes.push('State assigns special rates or industry-specific treatment.');
        }

        if (!notes.length) {
            notes.push('Use state notice for the employer-specific assigned rate.');
        }

        return notes.join(' ');
    }

    private extractCurrencyValue(value: string): number | null {
        const match = value.match(/\$([0-9,]+)/);
        if (!match) {
            return null;
        }

        return Number(match[1].replace(/,/g, ''));
    }

    private extractFirstPercent(value: string): number | null {
        const match = value.match(/([0-9]+(?:\.[0-9]+)?)%/);
        if (!match) {
            return null;
        }

        return Number(match[1]);
    }

    private extractHighestPercent(value: string): number | null {
        const matches = Array.from(value.matchAll(/([0-9]+(?:\.[0-9]+)?)%/g)).map((match) => Number(match[1]));
        if (!matches.length) {
            return null;
        }

        return Math.max(...matches);
    }

    private normalizeText(value: string | null | undefined): string {
        return (value ?? '').replace(/\s+/g, ' ').trim();
    }

    private slugify(value: string): string {
        return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    private async waitForUiPaint(): Promise<void> {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }

    private loadStoredRows(): UiEmployerTaxRow[] {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) {
                return [];
            }

            const parsed = JSON.parse(raw) as UiEmployerTaxRow[];
            if (!Array.isArray(parsed)) {
                return [];
            }

            return parsed;
        } catch {
            return [];
        }
    }

    private saveRows(rows: UiEmployerTaxRow[]): void {
        localStorage.setItem(this.storageKey, JSON.stringify(rows));
    }

    private getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }

        return 'Unknown error.';
    }
}
