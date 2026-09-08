import { Component, inject, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ExportDropdownComponent } from '../export-dropdown/export-dropdown.component';
import { ModalHistoryService } from '../modal-history.service';
import { TurtlesEntryModalComponent, type TurtleRecord, type TurtlesModalResult } from './turtles-entry-modal.component';

export interface TurtleRecord {
    id: number;
    name: string;
    breed: string;
    owner: string;
    reason: string;
    checkIn: string;
    status: 'Waiting' | 'Exam' | 'Treatment' | 'Ready';
    vet: string;
    comments: string;
}
export type { TurtleRecord, TurtlesModalResult };

export interface TurtlesModalResult {
    action: 'save' | 'delete';
    turtle: TurtleRecord;
}

interface ChangedField {
    label: string;
    before: string;
    after: string;
}

type TrackedFieldKey = 'name' | 'breed' | 'owner' | 'reason' | 'checkIn' | 'status' | 'vet' | 'comments';

@Component({
    selector: 'app-turtles-entry-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="app-edit-modal">
            <div class="modal-header">
                <h5 class="modal-title">{{ allowDelete ? 'Edit Turtle' : 'Add Turtle' }}</h5>
                <button type="button" class="btn-close" aria-label="Close" (click)="requestCancel()"></button>
            </div>

            <div class="modal-body">
                @if (editDraft) {
                <div class="row g-3 entry-grid">
                    <div class="col-12 col-md-6 field-block">
                        <label class="form-label">Name</label>
                        <input type="text" class="form-control" [(ngModel)]="editDraft.name" (keydown.enter)="save()">
                    </div>
                    <div class="col-12 col-md-6 field-block">
                        <label class="form-label">Breed / Species</label>
                        <input type="text" class="form-control" [(ngModel)]="editDraft.breed" (keydown.enter)="save()">
                    </div>
                    <div class="col-12 field-block">
                        <label class="form-label">Reason</label>
                        <textarea class="form-control" rows="2" [(ngModel)]="editDraft.reason"></textarea>
                    </div>
                    <div class="col-12 col-md-6 field-block">
                        <label class="form-label">Vet</label>
                        <input type="text" class="form-control" [(ngModel)]="editDraft.vet" (keydown.enter)="save()">
                    </div>
                    <div class="col-12 col-md-6 field-block">
                        <label class="form-label">Status</label>
                        <select class="form-select" [(ngModel)]="editDraft.status">
                            <option value="Waiting">Waiting</option>
                            <option value="Exam">Exam</option>
                            <option value="Treatment">Treatment</option>
                            <option value="Ready">Ready</option>
                        </select>
                    </div>
                    <div class="col-12 field-block">
                        <label class="form-label">Owner</label>
                        <input type="text" class="form-control" [(ngModel)]="editDraft.owner" (keydown.enter)="save()">
                    </div>
                    <div class="col-12 field-block">
                        <label class="form-label">Comments</label>
                        <textarea class="form-control" rows="2" [(ngModel)]="editDraft.comments"></textarea>
                    </div>
                </div>
                }
            </div>

            <div class="modal-footer d-flex justify-content-between">
                <div>
                    @if (allowDelete) {
                    <button type="button" class="btn btn-danger" (click)="requestDelete()">Delete</button>
                    }
                </div>
                <div class="d-flex gap-2">
                    <button type="button" class="btn btn-secondary" (click)="requestCancel()">Cancel</button>
                    <button type="button" class="btn btn-primary" (click)="save()">Save</button>
                </div>
            </div>
        </div>

        <ng-template #deleteConfirmModal let-modal>
            <div class="app-confirm-modal">
                <div class="modal-header">
                    <h5 class="modal-title">Confirm Delete</h5>
                </div>
                <div class="modal-body">
                    @if (editDraft) {
                    <p class="mb-1">Delete this turtle record?</p>
                    <p class="mb-0"><strong>{{ editDraft.name }}</strong> ({{ editDraft.id }})</p>
                    }
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary" (click)="modal.close('keep')">Cancel</button>
                    <button type="button" class="btn btn-danger" (click)="modal.close('delete')">Delete</button>
                </div>
            </div>
        </ng-template>

        <ng-template #unsavedChangesModal let-modal>
            <div class="app-confirm-modal">
                <div class="modal-header">
                    <h5 class="modal-title">Unsaved Changes</h5>
                </div>
                <div class="modal-body">
                    <p class="mb-2">You have unsaved changes. Leave without saving?</p>

                    @if (getUnsavedChanges().length) {
                    <div class="table-responsive">
                        <table class="table table-changes table-bordered align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Field</th>
                                    <th>Before</th>
                                    <th>After</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (change of getUnsavedChanges(); track change.label) {
                                <tr>
                                    <td>{{ change.label }}</td>
                                    <td>{{ change.before }}</td>
                                    <td>{{ change.after }}</td>
                                </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                    }
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary" (click)="modal.close('keep')">Keep Editing</button>
                    <button type="button" class="btn btn-danger" (click)="modal.close('discard')">Discard Changes</button>
                </div>
            </div>
        </ng-template>
    `,
    styles: [``]
})
export class TurtlesEntryModalComponent implements OnInit {
    activeModal = inject(NgbActiveModal);
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);

    @ViewChild('deleteConfirmModal') private deleteConfirmModal?: TemplateRef<unknown>;
    @ViewChild('unsavedChangesModal') private unsavedChangesModal?: TemplateRef<unknown>;

    @Input({ required: true }) turtle!: TurtleRecord;
    @Input() allowDelete = false;

    editDraft: TurtleRecord | null = null;
    originalDraft: TurtleRecord | null = null;
    saveAttempted = false;
    readonly statuses: TurtleRecord['status'][] = ['Waiting', 'Exam', 'Treatment', 'Ready'];

    ngOnInit(): void {
        this.editDraft = structuredClone(this.turtle);
        this.originalDraft = structuredClone(this.turtle);
    }

    canSave(): boolean {
        if (!this.editDraft) {
            return false;
        }

        return this.editDraft.name.trim().length > 0
            && this.editDraft.breed.trim().length > 0
            && this.editDraft.owner.trim().length > 0
            && this.editDraft.reason.trim().length > 0
            && this.editDraft.checkIn.trim().length > 0
            && this.editDraft.vet.trim().length > 0;
    }

    save(): void {
        this.saveAttempted = true;
        if (!this.editDraft || !this.canSave()) {
            return;
        }

        const updated: TurtleRecord = {
            ...this.editDraft,
            name: this.editDraft.name.trim(),
            breed: this.editDraft.breed.trim(),
            owner: this.editDraft.owner.trim(),
            reason: this.editDraft.reason.trim(),
            checkIn: this.editDraft.checkIn.trim(),
            vet: this.editDraft.vet.trim(),
            comments: this.editDraft.comments.trim()
        };

        this.activeModal.close({ action: 'save', turtle: updated } satisfies TurtlesModalResult);
    }

    async requestDelete(): Promise<void> {
        if (!this.allowDelete || !this.editDraft) {
            return;
        }

        const shouldDelete = await this.confirmDeleteWithModal();
        if (!shouldDelete) {
            return;
        }

        this.activeModal.close({ action: 'delete', turtle: this.editDraft } satisfies TurtlesModalResult);
    }

    hasUnsavedChanges(): boolean {
        if (!this.editDraft || !this.originalDraft) {
            return false;
        }

        return JSON.stringify(this.editDraft) !== JSON.stringify(this.originalDraft);
    }

    async handleBeforeDismiss(): Promise<boolean> {
        if (this.hasUnsavedChanges()) {
            const shouldDiscard = await this.confirmDiscardChangesWithModal();
            if (!shouldDiscard) {
                this.modalHistory.restoreHistoryIfPending();
                return false;
            }
        }
        return true;
    }

    async requestCancel(): Promise<void> {
        if (this.hasUnsavedChanges()) {
            const shouldDiscard = await this.confirmDiscardChangesWithModal();
            if (!shouldDiscard) {
                return;
            }
        }

        this.activeModal.close('cancel');
    }

    getUnsavedChanges(): ChangedField[] {
        if (!this.editDraft || !this.originalDraft) {
            return [];
        }

        const fields: Array<{ key: TrackedFieldKey; label: string }> = [
            { key: 'name', label: 'Name' },
            { key: 'breed', label: 'Breed / Species' },
            { key: 'owner', label: 'Owner' },
            { key: 'reason', label: 'Reason' },
            { key: 'checkIn', label: 'Check-In' },
            { key: 'status', label: 'Status' },
            { key: 'vet', label: 'Vet' },
            { key: 'comments', label: 'Comments' }
        ];

        const changes: ChangedField[] = [];
        for (const field of fields) {
            const beforeVal = this.originalDraft[field.key];
            const afterVal = this.editDraft[field.key];
            if (beforeVal !== afterVal) {
                changes.push({
                    label: field.label,
                    before: this.formatChangedValue(beforeVal),
                    after: this.formatChangedValue(afterVal)
                });
            }
        }

        return changes;
    }

    private confirmDeleteWithModal(): Promise<boolean> {
        if (!this.deleteConfirmModal) {
            return Promise.resolve(false);
        }

        const dialogRef = this.modalService.open(this.deleteConfirmModal, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            scrollable: true
        });
        this.modalHistory.registerModal(dialogRef);

        return dialogRef.result
            .then(result => result === 'delete')
            .catch(() => false);
    }

    private confirmDiscardChangesWithModal(): Promise<boolean> {
        if (!this.unsavedChangesModal) {
            return Promise.resolve(false);
        }

        const dialogRef = this.modalService.open(this.unsavedChangesModal, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            scrollable: true
        });
        this.modalHistory.registerModal(dialogRef);

        return dialogRef.result
            .then(result => result === 'discard')
            .catch(() => false);
    }

    private formatChangedValue(value: string): string {
        const text = String(value).trim();
        return text.length ? text : '(blank)';
    }
}

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
