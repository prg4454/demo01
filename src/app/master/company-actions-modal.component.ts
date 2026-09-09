import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { MockCompany } from './master.component';

export interface CompanyActionItem {
    id: string;
    title: string;
    description: string;
    icon: string;
    badgeClass: string;
}

@Component({
    selector: 'app-company-actions-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="modal-header bg-light border-bottom">
            <div>
                <div class="d-flex align-items-center gap-2">
                    <h5 class="modal-title fw-bold text-dark mb-0">{{ company.name }}</h5>
                    <span class="badge bg-primary">{{ company.id }}</span>
                </div>
                <div class="text-muted small mt-1">
                    <span class="me-2">🏢 {{ company.industry }}</span>
                    <span class="me-2">•</span>
                    <span class="me-2">📍 {{ company.hq }}</span>
                    <span class="me-2">•</span>
                    <span>👥 {{ company.employees }} Employees</span>
                </div>
            </div>
            <button type="button" class="btn-close" aria-label="Close" (click)="activeModal.dismiss('cancel')"></button>
        </div>

        <div class="modal-body p-3 p-md-4 scrollable-modal-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="text-uppercase text-secondary fw-bold small tracking-wide">Available Company Actions</span>
                <span class="badge bg-secondary-subtle text-secondary border">{{ actions.length }} Tools</span>
            </div>

            <!-- Responsive CSS Grid for Company Actions -->
            <div class="company-actions-grid">
                @for (action of actions; track action.id) {
                    <button type="button" class="action-card" (click)="chooseAction(action.id)">
                        <div class="action-icon" [ngClass]="action.badgeClass">
                            {{ action.icon }}
                        </div>
                        <div class="action-text">
                            <span class="action-title">{{ action.title }}</span>
                            <span class="action-desc">{{ action.description }}</span>
                        </div>
                        <span class="action-arrow">→</span>
                    </button>
                }
            </div>
        </div>

        <div class="modal-footer bg-light d-flex justify-content-between">
            <span class="text-muted small">Select an action to navigate or view details for {{ company.name }}.</span>
            <button type="button" class="btn btn-outline-secondary" (click)="activeModal.dismiss('cancel')">Close</button>
        </div>
    `,
    styles: [`
        .scrollable-modal-body {
            max-height: calc(80vh - 140px);
            overflow-y: auto !important;
            overscroll-behavior: contain;
            scrollbar-width: thin;
            scrollbar-color: #adb5bd transparent;

            &::-webkit-scrollbar {
                width: 6px;
            }
            &::-webkit-scrollbar-track {
                background: transparent;
            }
            &::-webkit-scrollbar-thumb {
                background-color: #adb5bd;
                border-radius: 4px;

                &:hover {
                    background-color: #6c757d;
                }
            }
        }

        .company-actions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
            gap: 1rem;
            align-items: stretch;
        }

        @media (max-width: 576px) {
            .company-actions-grid {
                grid-template-columns: 1fr;
                gap: 0.75rem;
            }
        }

        @media (min-width: 577px) and (max-width: 768px) {
            .company-actions-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 0.85rem;
            }
        }

        .action-card {
            display: flex;
            align-items: center;
            gap: 0.85rem;
            padding: 0.9rem 1rem;
            border-radius: 10px;
            border: 1px solid #dee2e6;
            background-color: #ffffff;
            color: #212529;
            text-align: left;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            cursor: pointer;
            width: 100%;
            position: relative;
            user-select: none;

            &:hover {
                border-color: #0d6efd;
                background-color: #f8faff;
                transform: translateY(-2px);
                box-shadow: 0 4px 14px rgba(13, 110, 253, 0.12);

                .action-arrow {
                    transform: translateX(4px);
                    color: #0d6efd;
                }
            }

            &:active {
                transform: translateY(0);
                box-shadow: 0 2px 6px rgba(13, 110, 253, 0.1);
            }

            &:focus-visible {
                outline: 2px solid #0d6efd;
                outline-offset: 2px;
            }
        }

        .action-icon {
            width: 44px;
            height: 44px;
            min-width: 44px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.35rem;
            flex-shrink: 0;
        }

        .action-text {
            flex-grow: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
        }

        .action-title {
            font-weight: 600;
            font-size: 0.925rem;
            color: #212529;
        }

        .action-desc {
            font-size: 0.775rem;
            color: #6c757d;
            line-height: 1.25;
            margin-top: 3px;
        }

        .action-arrow {
            font-size: 1.15rem;
            color: #adb5bd;
            transition: transform 0.2s ease, color 0.2s ease;
            flex-shrink: 0;
        }
    `]
})
export class CompanyActionsModalComponent {
    activeModal = inject(NgbActiveModal);

    @Input({ required: true }) company!: MockCompany;

    actions: CompanyActionItem[] = [
        {
            id: 'view-employees',
            title: 'View Employees',
            description: 'Browse staff directory, job roles, and contact info',
            icon: '👥',
            badgeClass: 'bg-primary text-white'
        },
        {
            id: 'view-checks',
            title: 'Payroll Checks',
            description: 'Audit cleared payroll checks & disbursement totals',
            icon: '💳',
            badgeClass: 'bg-success text-white'
        },
        {
            id: 'view-hours',
            title: 'Hours & Timecards',
            description: 'Review regular & overtime hours recorded across staff',
            icon: '⏱️',
            badgeClass: 'bg-info text-white'
        },
        {
            id: 'company-profile',
            title: 'Company Profile',
            description: 'View headquarters, corporate registry & tax info',
            icon: '🏢',
            badgeClass: 'bg-secondary text-white'
        },
        {
            id: 'payroll-summary',
            title: 'Payroll Summary',
            description: 'Metrics on payroll disbursements and averages',
            icon: '📊',
            badgeClass: 'bg-warning text-dark'
        },
        {
            id: 'export-data',
            title: 'Export Records',
            description: 'Download staff and payroll check ledger as CSV',
            icon: '📥',
            badgeClass: 'bg-dark text-white'
        },
        {
            id: 'add-employee',
            title: 'Add Employee',
            description: 'Quickly onboard a new team member to this company',
            icon: '➕',
            badgeClass: 'bg-primary-subtle text-primary border border-primary'
        },
        {
            id: 'company-settings',
            title: 'Company Settings',
            description: 'Configure pay frequencies, direct deposit & taxes',
            icon: '⚙️',
            badgeClass: 'bg-light text-dark border'
        }
    ];

    chooseAction(actionId: string): void {
        this.activeModal.close(actionId);
    }
}
