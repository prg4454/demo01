import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalHistoryService } from '../modal-history.service';

interface ChangedField {
    label: string;
    before: string;
    after: string;
}

export interface JokeRecord {
    id: number;
    setup: string;
    punchline: string;
    category: string;
    comedian: string;
    audience: string;
    slotTime: string;
    status: 'Draft' | 'Testing' | 'Polished' | 'Retired';
    rating: number | null;
}

export interface JokesModalResult {
    action: 'save' | 'delete';
    joke: JokeRecord;
}

type TrackedFieldKey = 'setup' | 'punchline' | 'category' | 'comedian' | 'audience' | 'slotTime' | 'status' | 'rating';

@Component({
    selector: 'app-jokes-entry-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './jokes-entry-modal.component.html',
    styleUrl: './jokes-entry-modal.component.scss'
})
export class JokesEntryModalComponent implements OnInit {
    activeModal = inject(NgbActiveModal);
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);

    @ViewChild('deleteConfirmModal') private deleteConfirmModal?: TemplateRef<unknown>;
    @ViewChild('unsavedChangesModal') private unsavedChangesModal?: TemplateRef<unknown>;

    @Input({ required: true }) joke!: JokeRecord;
    @Input() allowDelete = false;

    editDraft: JokeRecord | null = null;
    originalDraft: JokeRecord | null = null;
    saveAttempted = false;
    readonly statuses: JokeRecord['status'][] = ['Draft', 'Testing', 'Polished', 'Retired'];

    ngOnInit(): void {
        this.editDraft = structuredClone(this.joke);
        this.originalDraft = structuredClone(this.joke);
    }

    canSave(): boolean {
        if (!this.editDraft) {
            return false;
        }

        return this.editDraft.setup.trim().length > 0
            && this.editDraft.punchline.trim().length > 0
            && this.editDraft.category.trim().length > 0
            && this.editDraft.comedian.trim().length > 0
            && this.editDraft.audience.trim().length > 0
            && this.editDraft.slotTime.trim().length > 0
            && this.editDraft.rating !== null
            && this.editDraft.rating >= 1
            && this.editDraft.rating <= 10;
    }

    save(): void {
        this.saveAttempted = true;
        if (!this.editDraft || !this.canSave()) {
            return;
        }

        const updated: JokeRecord = {
            ...this.editDraft,
            setup: this.editDraft.setup.trim(),
            punchline: this.editDraft.punchline.trim(),
            category: this.editDraft.category.trim(),
            comedian: this.editDraft.comedian.trim(),
            audience: this.editDraft.audience.trim(),
            slotTime: this.editDraft.slotTime.trim()
        };

        this.activeModal.close({ action: 'save', joke: updated } satisfies JokesModalResult);
    }

    async requestDelete(): Promise<void> {
        if (!this.allowDelete || !this.editDraft) {
            return;
        }

        const shouldDelete = await this.confirmDeleteWithModal();
        if (!shouldDelete) {
            return;
        }

        this.activeModal.close({ action: 'delete', joke: this.editDraft } satisfies JokesModalResult);
    }

    hasUnsavedChanges(): boolean {
        if (!this.editDraft || !this.originalDraft) {
            return false;
        }

        return JSON.stringify(this.editDraft) !== JSON.stringify(this.originalDraft);
    }

    handleBeforeDismiss(): Promise<boolean> | boolean {
        if (this.hasUnsavedChanges()) {
            return this.confirmDiscardChangesWithModal();
        }
        return true;
    }

    async requestCancel(): Promise<void> {
        this.activeModal.dismiss('cancel');
    }

    getUnsavedChanges(): ChangedField[] {
        if (!this.editDraft || !this.originalDraft) {
            return [];
        }

        const fields: Array<{ key: TrackedFieldKey; label: string }> = [
            { key: 'setup', label: 'Setup' },
            { key: 'punchline', label: 'Punchline' },
            { key: 'category', label: 'Category' },
            { key: 'comedian', label: 'Comedian' },
            { key: 'audience', label: 'Audience' },
            { key: 'slotTime', label: 'Slot' },
            { key: 'status', label: 'Status' },
            { key: 'rating', label: 'Rating' }
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

    private formatChangedValue(value: string | number | null): string {
        if (value === null || value === undefined) {
            return '(blank)';
        }

        const text = String(value).trim();
        return text.length ? text : '(blank)';
    }
}
