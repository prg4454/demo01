import { Component, inject, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalHistoryService } from '../modal-history.service';

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

