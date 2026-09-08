import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ExportDropdownComponent } from '../export-dropdown/export-dropdown.component';
import { ModalHistoryService } from '../modal-history.service';
import { TurtlesEntryModalComponent, type TurtleRecord, type TurtlesModalResult } from './turtles-entry-modal.component';

export type { TurtleRecord, TurtlesModalResult };

@Component({
    selector: 'app-turtles',
    standalone: true,
    imports: [CommonModule, NgbModalModule, ExportDropdownComponent],
    template: `
        <div class="container-fluid mt-3 app-grid-container">
            <div class="sticky-header">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h2 class="mb-0">Turtles Management</h2>
                    <div class="d-flex align-items-center gap-2">
                        <app-export-dropdown [rows]="turtles" fileBaseName="export-turtles"
                            (statusMessage)="exportMessage = $event"></app-export-dropdown>
                        <button type="button" class="btn btn-primary" (click)="openAddModal()">+ Add Turtle</button>
                    </div>
                </div>
                @if (exportMessage) {
                <div class="small text-muted mb-2">{{ exportMessage }}</div>
                }
                <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
                    <button type="button" class="btn btn-outline-primary btn-sm" (click)="previousPage()"
                        [disabled]="currentPage <= 1">&lt;&lt;</button>
                    <button type="button" class="btn btn-outline-primary btn-sm" (click)="nextPage()"
                        [disabled]="currentPage >= totalPages">&gt;&gt;</button>
                    <div class="small text-muted">Page {{ currentPage }} of {{ totalPages }}</div>
                </div>
            </div>

            <div class="text-break">
                @for (turtle of pagedTurtles; track turtle.id) {
                <div class="turtles-grid-row">
                    <div>
                        <b>Name</b>
                        <button type="button" class="turtle-name-link" (click)="openEditModal(turtle)">
                            {{ turtle.name }}
                        </button>
                    </div>
                    <div>
                        <b>Breed / Species</b>
                        {{ turtle.breed }}
                    </div>
                    <div>
                        <b>Owner</b>
                        {{ turtle.owner }}
                    </div>
                    <div>
                        <b>Vet</b>
                        {{ turtle.vet }}
                    </div>
                    <div>
                        <b>Check-In</b>
                        {{ turtle.checkIn }}
                    </div>
                    <div>
                        <b>Reason</b>
                        {{ turtle.reason }}
                    </div>
                    <div>
                        <b>Status</b>
                        <span class="status-pill" [class]="'status-pill status-' + turtle.status.toLowerCase()">{{ turtle.status }}</span>
                    </div>
                    <div class="comments-cell">
                        <b>Comments</b>
                        {{ turtle.comments || '—' }}
                    </div>
                </div>
                }
            </div>
        </div>
    `,
    styles: [`
        .sticky-header {
            position: sticky;
            top: clamp(48px, var(--app-navbar-offset, 56px), 84px);
            z-index: 20;
            background: #fff;
            padding: 0.5rem 0;
            border-bottom: 1px solid #dee2e6;
        }

        .turtles-grid-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
            gap: 0.5rem;
            align-items: start;
            padding: 0.75rem 0;
            border-bottom: 1px solid #dee2e6;
        }

        .turtles-grid-row b {
            display: block;
            color: #212529;
            font-size: 0.85rem;
            margin-bottom: 0.1rem;
        }

        .comments-cell {
            grid-column: span 2;
        }

        .turtle-name-link {
            padding: 0;
            border: 0;
            background: transparent;
            color: #0d6efd;
            font: inherit;
            font-weight: 700;
            text-align: left;
            text-decoration: none;
            cursor: pointer;
        }

        .turtle-name-link:hover,
        .turtle-name-link:focus-visible {
            color: #0a58ca;
            text-decoration: underline;
        }

        .status-pill {
            display: inline-block;
            border-radius: 999px;
            padding: 0.05rem 0.55rem;
            font-size: 0.84rem;
            font-weight: 700;
        }

        .status-waiting {
            background-color: #fff3cd;
            color: #664d03;
        }

        .status-exam {
            background-color: #cfe2ff;
            color: #084298;
        }

        .status-treatment {
            background-color: #f8d7da;
            color: #842029;
        }

        .status-ready {
            background-color: #d1e7dd;
            color: #0f5132;
        }
    `]
})
export class TurtlesComponent {
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);

    readonly pageSize = 8;
    currentPage = 1;
    exportMessage = '';

    turtles: TurtleRecord[] = [
        {
            id: 201,
            name: 'Shelly',
            breed: 'Red-Eared Slider',
            owner: 'Davis',
            reason: 'Shell checkup',
            checkIn: '8:15 AM',
            status: 'Waiting',
            vet: 'Dr. Hernandez',
            comments: 'Basking lamp replaced last week.'
        },
        {
            id: 202,
            name: 'Franklin',
            breed: 'Box Turtle',
            owner: 'Clark',
            reason: 'Beak trim',
            checkIn: '8:40 AM',
            status: 'Exam',
            vet: 'Dr. Patel',
            comments: 'Slightly shy, handle gently.'
        },
        {
            id: 203,
            name: 'Donatello',
            breed: 'Russian Tortoise',
            owner: 'Wilson',
            reason: 'Dietary consultation',
            checkIn: '9:15 AM',
            status: 'Treatment',
            vet: 'Dr. Kim',
            comments: 'Bring calcium supplement info.'
        },
        {
            id: 204,
            name: 'Crush',
            breed: 'Painted Turtle',
            owner: 'Martinez',
            reason: 'Annual exam',
            checkIn: '9:30 AM',
            status: 'Ready',
            vet: 'Dr. Adams',
            comments: 'Healthy shell and good appetite.'
        },
        {
            id: 205,
            name: 'Squirt',
            breed: 'Mud Turtle',
            owner: 'Anderson',
            reason: 'Weight check',
            checkIn: '10:00 AM',
            status: 'Waiting',
            vet: 'Dr. Hernandez',
            comments: 'Water temperature monitored.'
        },
        {
            id: 206,
            name: 'Leonardo',
            breed: 'Greek Tortoise',
            owner: 'Thomas',
            reason: 'Nail trim',
            checkIn: '10:30 AM',
            status: 'Exam',
            vet: 'Dr. Patel',
            comments: 'Very active in terrarium.'
        }
    ];

    get totalTurtles(): number {
        return this.turtles.length;
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.turtles.length / this.pageSize));
    }

    get pagedTurtles(): TurtleRecord[] {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.turtles.slice(start, start + this.pageSize);
    }

    previousPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
        }
    }

    openAddModal(): void {
        const modalRef = this.modalService.open(TurtlesEntryModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: true,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => this.modalHistory.handleBeforeDismiss(modalRef)
        });
        this.modalHistory.registerModal(modalRef);

        modalRef.componentInstance.turtle = {
            id: this.getNextId(),
            name: '',
            breed: '',
            owner: '',
            reason: '',
            checkIn: '',
            status: 'Waiting',
            vet: '',
            comments: ''
        };
        modalRef.componentInstance.allowDelete = false;

        void modalRef.result
            .then((result: TurtlesModalResult) => {
                if (!result || result.action !== 'save') {
                    return;
                }

                this.turtles = [result.turtle, ...this.turtles];
                this.currentPage = 1;
            })
            .catch(() => undefined);
    }

    openEditModal(turtle: TurtleRecord): void {
        const modalRef = this.modalService.open(TurtlesEntryModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: true,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => this.modalHistory.handleBeforeDismiss(modalRef)
        });
        this.modalHistory.registerModal(modalRef);

        modalRef.componentInstance.turtle = structuredClone(turtle);
        modalRef.componentInstance.allowDelete = true;

        void modalRef.result
            .then((result: TurtlesModalResult) => {
                if (!result) {
                    return;
                }

                const idx = this.turtles.findIndex(t => t.id === result.turtle.id);
                if (idx < 0) {
                    return;
                }

                if (result.action === 'delete') {
                    this.turtles = this.turtles.filter(t => t.id !== result.turtle.id);
                    if (this.currentPage > this.totalPages) {
                        this.currentPage = this.totalPages;
                    }
                    return;
                }

                this.turtles = this.turtles.map(t => t.id === result.turtle.id ? result.turtle : t);
            })
            .catch(() => undefined);
    }

    private getNextId(): number {
        if (!this.turtles.length) {
            return 1;
        }
        return Math.max(...this.turtles.map(t => t.id)) + 1;
    }
}
