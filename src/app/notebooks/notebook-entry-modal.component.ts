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

export interface NotebookRecord {
    id: number;
    brand: string;
    type: string;
    pages: number;
    size: string;
    color: string;
    notes: string;
    status: 'In Stock' | 'Ordered' | 'Discontinued';
}

export interface NotebookModalResult {
    action: 'save' | 'delete';
    record: NotebookRecord;
}

type TrackedFieldKey = 'brand' | 'type' | 'pages' | 'size' | 'color' | 'notes' | 'status';

@Component({
    selector: 'app-notebook-entry-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './notebook-entry-modal.component.html',
    styleUrl: './notebook-entry-modal.component.scss'
})
export class NotebookEntryModalComponent implements OnInit {
    activeModal = inject(NgbActiveModal);
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);

    @ViewChild('deleteConfirmModal') private deleteConfirmModal?: TemplateRef<unknown>;
    @ViewChild('unsavedChangesModal') private unsavedChangesModal?: TemplateRef<unknown>;

    @Input({ required: true }) record!: NotebookRecord;
    @Input() allowDelete = false;

    editDraft: NotebookRecord | null = null;
    originalDraft: NotebookRecord | null = null;
    saveAttempted = false;
    readonly statuses: NotebookRecord['status'][] = ['In Stock', 'Ordered', 'Discontinued'];
    readonly types = ['Spiral', 'Hardcover', 'Journal', 'Memo'];
    readonly sizes = ['A4', 'A5', 'B5', 'Legal'];

    ngOnInit(): void {
        this.editDraft = structuredClone(this.record);
        this.originalDraft = structuredClone(this.record);
    }

    canSave(): boolean {
        if (!this.editDraft) {
            return false;
        }

        return this.editDraft.brand.trim().length > 0
            && this.editDraft.type.trim().length > 0
            && this.editDraft.pages > 0
            && this.editDraft.size.trim().length > 0
            && this.editDraft.color.trim().length > 0;
    }

    save(): void {
        this.saveAttempted = true;
        if (!this.editDraft || !this.canSave()) {
            return;
        }

        const updated: NotebookRecord = {
            ...this.editDraft,
            brand: this.editDraft.brand.trim(),
            notes: this.editDraft.notes.trim()
        };

        this.activeModal.close({ action: 'save', record: updated } satisfies NotebookModalResult);
    }

    async requestDelete(): Promise<void> {
        if (!this.allowDelete || !this.editDraft) {
            return;
        }

        const shouldDelete = await this.confirmDeleteWithModal();
        if (!shouldDelete) {
            return;
        }

        this.activeModal.close({ action: 'delete', record: this.editDraft } satisfies NotebookModalResult);
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

    hasUnsavedChanges(): boolean {
        if (!this.editDraft || !this.originalDraft) {
            return false;
        }

        return JSON.stringify(this.editDraft) !== JSON.stringify(this.originalDraft);
    }

    getUnsavedChanges(): ChangedField[] {
        if (!this.editDraft || !this.originalDraft) {
            return [];
        }

        const fields: Array<{ key: TrackedFieldKey; label: string }> = [
            { key: 'brand', label: 'Brand' },
            { key: 'type', label: 'Type' },
            { key: 'pages', label: 'Pages' },
            { key: 'size', label: 'Size' },
            { key: 'color', label: 'Color' },
            { key: 'notes', label: 'Notes' },
            { key: 'status', label: 'Status' }
        ];

        const changes: ChangedField[] = [];
        for (const field of fields) {
            const beforeVal = (this.originalDraft as any)[field.key];
            const afterVal = (this.editDraft as any)[field.key];
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

    private formatChangedValue(value: any): string {
        const text = String(value ?? '').trim();
        return text.length ? text : '(blank)';
    }

    private confirmDeleteWithModal(): Promise<boolean> {
        if (!this.deleteConfirmModal) {
            return Promise.resolve(false);
        }

        const modalRef = this.modalService.open(this.deleteConfirmModal, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            scrollable: true
        });
        this.modalHistory.registerModal(modalRef);

        return modalRef.result
            .then(result => result === 'delete')
            .catch(() => false);
    }

    private confirmDiscardChangesWithModal(): Promise<boolean> {
        if (!this.unsavedChangesModal) {
            return Promise.resolve(false);
        }

        const modalRef = this.modalService.open(this.unsavedChangesModal, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            scrollable: true
        });
        this.modalHistory.registerModal(modalRef);

        return modalRef.result
            .then(result => result === 'discard')
            .catch(() => false);
    }
}