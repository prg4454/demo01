import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

interface ChangedField {
    label: string;
    before: string;
    after: string;
}

export interface CatRecord {
    id: number;
    name: string;
    breed: string;
    owner: string;
    reason: string;
    checkIn: string;
    status: 'Waiting' | 'Exam' | 'Treatment' | 'Ready';
    vet: string;
}

export interface CatsModalResult {
    action: 'save' | 'delete';
    cat: CatRecord;
}

type TrackedFieldKey = 'name' | 'breed' | 'owner' | 'reason' | 'checkIn' | 'status' | 'vet';

@Component({
    selector: 'app-cats-entry-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './cats-entry-modal.component.html',
    styleUrl: './cats-entry-modal.component.scss'
})
export class CatsEntryModalComponent implements OnInit {
    activeModal = inject(NgbActiveModal);
    private modalService = inject(NgbModal);

    @ViewChild('deleteConfirmModal') private deleteConfirmModal?: TemplateRef<unknown>;
    @ViewChild('unsavedChangesModal') private unsavedChangesModal?: TemplateRef<unknown>;

    @Input({ required: true }) cat!: CatRecord;
    @Input() allowDelete = false;

    editDraft: CatRecord | null = null;
    originalDraft: CatRecord | null = null;
    saveAttempted = false;
    readonly statuses: CatRecord['status'][] = ['Waiting', 'Exam', 'Treatment', 'Ready'];

    ngOnInit(): void {
        this.editDraft = structuredClone(this.cat);
        this.originalDraft = structuredClone(this.cat);
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

        const updated: CatRecord = {
            ...this.editDraft,
            name: this.editDraft.name.trim(),
            breed: this.editDraft.breed.trim(),
            owner: this.editDraft.owner.trim(),
            reason: this.editDraft.reason.trim(),
            checkIn: this.editDraft.checkIn.trim(),
            vet: this.editDraft.vet.trim()
        };

        this.activeModal.close({ action: 'save', cat: updated } satisfies CatsModalResult);
    }

    async requestDelete(): Promise<void> {
        if (!this.allowDelete || !this.editDraft) {
            return;
        }

        const shouldDelete = await this.confirmDeleteWithModal();
        if (!shouldDelete) {
            return;
        }

        this.activeModal.close({ action: 'delete', cat: this.editDraft } satisfies CatsModalResult);
    }

    hasUnsavedChanges(): boolean {
        if (!this.editDraft || !this.originalDraft) {
            return false;
        }

        return JSON.stringify(this.editDraft) !== JSON.stringify(this.originalDraft);
    }

    async requestCancel(): Promise<void> {
        if (this.hasUnsavedChanges()) {
            const shouldDiscard = await this.confirmDiscardChangesWithModal();
            if (shouldDiscard) {
                this.activeModal.dismiss('cancel');
            }
            return;
        }

        this.activeModal.dismiss('cancel');
    }

    getUnsavedChanges(): ChangedField[] {
        if (!this.editDraft || !this.originalDraft) {
            return [];
        }

        const fields: Array<{ key: TrackedFieldKey; label: string }> = [
            { key: 'name', label: 'Name' },
            { key: 'breed', label: 'Breed' },
            { key: 'owner', label: 'Owner' },
            { key: 'reason', label: 'Reason' },
            { key: 'checkIn', label: 'Check-In' },
            { key: 'status', label: 'Status' },
            { key: 'vet', label: 'Vet' }
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

        return dialogRef.result
            .then(result => result === 'discard')
            .catch(() => false);
    }

    private formatChangedValue(value: string): string {
        const text = String(value).trim();
        return text.length ? text : '(blank)';
    }
}
