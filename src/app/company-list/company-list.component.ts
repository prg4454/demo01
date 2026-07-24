import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild, inject } from '@angular/core';
import { SelectedCompanyService } from '../selected-company.service';

interface Company {
    companyId: number | string;
    companyName: string;
}

@Component({
    selector: 'app-company-list',
    standalone: true,
    imports: [CommonModule],
    template: `
        <section class="company-list-wrap">
            <h2>Company List</h2>

            <div #companiesScroll class="companies-scroll" *ngIf="companies.length > 0; else noData">
                <button
                    class="company-item"
                    type="button"
                    *ngFor="let company of companies"
                    (click)="selectCompany(company)">
                    <span class="name">{{ company.companyName }}</span>
                    <span class="id">ID: {{ company.companyId }}</span>
                </button>
            </div>

            <ng-template #noData>
                <p class="empty">No companies found.</p>
            </ng-template>

            <div class="confirm-backdrop" *ngIf="pendingCompany" (click)="cancelSelection()"></div>
            <div class="confirm-modal" *ngIf="pendingCompany" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
                <h3 id="confirm-title" class="confirm-title">Confirm Company Selection</h3>
                <p class="confirm-text">
                    Do you want to select this company:
                    <strong>{{ pendingCompany.companyName }}</strong>
                    (ID: {{ pendingCompany.companyId }})?
                </p>
                <div class="confirm-actions">
                    <button type="button" class="btn btn-outline-secondary btn-sm" (click)="cancelSelection()">Cancel</button>
                    <button type="button" class="btn btn-primary btn-sm" (click)="confirmSelection()">Select</button>
                </div>
            </div>

            <div class="confirm-backdrop" *ngIf="showSelectionLockedMessage" (click)="closeSelectionLockedMessage()"></div>
            <div
                class="confirm-modal"
                *ngIf="showSelectionLockedMessage"
                role="dialog"
                aria-modal="true"
                aria-labelledby="locked-title">
                <h3 id="locked-title" class="confirm-title">Selection Locked</h3>
                <p class="confirm-text">
                    You already selected a company. You cannot select another company until you close the app and start it again.
                </p>
                <div class="confirm-actions">
                    <button type="button" class="btn btn-primary btn-sm" (click)="closeSelectionLockedMessage()">OK</button>
                </div>
            </div>
        </section>
    `,
    styles: [
        `
            .company-list-wrap {
                max-width: 560px;
                margin: 1rem auto;
                padding: 1rem;
            }

            h2 {
                margin: 0 0 0.75rem;
            }

            .companies-scroll {
                max-height: 65vh;
                overflow-y: auto;
                border: 1px solid #d7d7d7;
                border-radius: 8px;
                padding: 0.5rem;
                display: grid;
                gap: 0.5rem;
                background: #fafafa;
            }

            .company-item {
                border: 1px solid #e1e1e1;
                border-radius: 6px;
                padding: 0.75rem;
                text-align: left;
                background: #ffffff;
                cursor: pointer;
            }

            .company-item:hover {
                background: #f2f8ff;
                border-color: #9ec5fe;
            }

            .name {
                font-weight: 600;
                display: block;
            }

            .id {
                color: #555;
                font-size: 0.9rem;
            }

            .empty {
                padding: 1rem;
                border: 1px dashed #bbb;
                border-radius: 8px;
                color: #555;
            }

            .confirm-backdrop {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.45);
                z-index: 1040;
            }

            .confirm-modal {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: min(92vw, 460px);
                background: #fff;
                border-radius: 10px;
                padding: 1rem;
                box-shadow: 0 12px 28px rgba(0, 0, 0, 0.24);
                z-index: 1050;
            }

            .confirm-title {
                margin: 0 0 0.5rem;
                font-size: 1.15rem;
            }

            .confirm-text {
                margin: 0 0 0.85rem;
            }

            .confirm-actions {
                display: flex;
                justify-content: flex-end;
                gap: 0.5rem;
            }
        `
    ]
})
export class CompanyListComponent implements OnInit, AfterViewInit {
    private readonly selectedCompanyService = inject(SelectedCompanyService);

    @ViewChild('companiesScroll') private companiesScroll?: ElementRef<HTMLDivElement>;

    companies: Company[] = [];
    pendingCompany: Company | null = null;
    showSelectionLockedMessage = false;

    ngOnInit(): void {
        // Backend fetch temporarily disabled while using local sample data.
        // this.loadCompaniesFromBackend();

        this.companies = this.buildSampleCompanies(50);
        queueMicrotask(() => this.adjustScrollHeight());
    }

    ngAfterViewInit(): void {
        this.adjustScrollHeight();
    }

    @HostListener('window:resize')
    onWindowResize(): void {
        this.adjustScrollHeight();
    }

    selectCompany(company: Company): void {
        if (this.selectedCompanyService.getSelectedCompany()) {
            this.pendingCompany = null;
            this.showSelectionLockedMessage = true;
            return;
        }

        this.pendingCompany = company;
    }

    cancelSelection(): void {
        this.pendingCompany = null;
    }

    confirmSelection(): void {
        if (!this.pendingCompany) {
            return;
        }

        if (this.selectedCompanyService.getSelectedCompany()) {
            this.pendingCompany = null;
            this.showSelectionLockedMessage = true;
            return;
        }

        const selected = this.pendingCompany;

        this.selectedCompanyService.setSelectedCompany({
            companyId: selected.companyId,
            companyName: selected.companyName
        });

        this.pendingCompany = null;
    }

    closeSelectionLockedMessage(): void {
        this.showSelectionLockedMessage = false;
    }

    private buildSampleCompanies(count: number): Company[] {
        return Array.from({ length: count }, (_, index) => {
            const id = index + 1;
            return {
                companyId: id,
                companyName: `Sample Company ${id.toString().padStart(2, '0')}`
            };
        });
    }

    private adjustScrollHeight(): void {
        const scrollEl = this.companiesScroll?.nativeElement;
        if (!scrollEl) {
            return;
        }

        const topOffset = scrollEl.getBoundingClientRect().top;
        const availableHeight = Math.floor(window.innerHeight - topOffset - 20);
        const minHeight = 220;
        scrollEl.style.maxHeight = `${Math.max(minHeight, availableHeight)}px`;
    }
}
