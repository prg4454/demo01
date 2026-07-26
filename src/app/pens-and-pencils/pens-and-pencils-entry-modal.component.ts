import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalHistoryService } from '../modal-history.service';

export interface PensAndPencilsRecord {
    id: number;
    brand: string;
    type: 'Pen' | 'Pencil';
    color: string;
    pointOrLead: string;
    count: number;
    location: string;
    comments: string;
}

interface ChangedField {
    label: string;
    before: string;
    after: string;
}

export interface PensAndPencilsModalResult {
    action: 'save' | 'delete';
    record: PensAndPencilsRecord;
}

@Component({
    selector: 'app-pens-and-pencils-entry-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './pens-and-pencils-entry-modal.component.html',
    styleUrl: './pens-and-pencils-entry-modal.component.scss'
})
export class PensAndPencilsEntryModalComponent implements OnInit {
    activeModal = inject(NgbActiveModal);
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);

    @ViewChild('deleteConfirmModal') private deleteConfirmModal?: TemplateRef<unknown>;
    @ViewChild('unsavedChangesModal') private unsavedChangesModal?: TemplateRef<unknown>;

    @Input({ required: true }) record!: PensAndPencilsRecord;
    @Input() allowDelete = false;

    editDraft: PensAndPencilsRecord | null = null;
    originalDraft: PensAndPencilsRecord | null = null;
    saveAttempted = false;
    deleteConfirmationText = '';

    ngOnInit(): void {
        this.resetDrafts();
    }

    async handleBeforeDismiss(): Promise<boolean> {
        if (this.hasUnsavedChanges()) {
            const shouldDiscard = await this.openUnsavedConfirm();
            return shouldDiscard;
        }

        return true;
    }

    closeEditor(): void {
        if (this.hasUnsavedChanges()) {
            void this.openUnsavedConfirm();
            return;
        }

        this.activeModal.close('cancel');
    }

    save(): void {
        this.saveAttempted = true;
        if (!this.editDraft || !this.canSave()) {
            return;
        }

        const updated: PensAndPencilsRecord = {
            ...this.editDraft,
            brand: this.editDraft.brand.trim(),
            color: this.editDraft.color.trim(),
            pointOrLead: this.editDraft.pointOrLead.trim(),
            location: this.editDraft.location.trim(),
            comments: this.editDraft.comments.trim()
        };

        this.activeModal.close({ action: 'save', record: updated } satisfies PensAndPencilsModalResult);
    }

    deleteRecord(): void {
        if (!this.allowDelete || !this.editDraft) {
            return;
        }

        this.deleteConfirmationText = '';
        void this.openDeleteConfirm();
    }

    canConfirmDelete(): boolean {
        return this.deleteConfirmationText.trim().toLowerCase() === 'delete';
    }

    canSave(): boolean {
        if (!this.editDraft) {
            return false;
        }

        return this.editDraft.brand.trim().length > 0
            && this.editDraft.type.trim().length > 0
            && this.editDraft.color.trim().length > 0
            && this.editDraft.pointOrLead.trim().length > 0
            && this.editDraft.count > 0
            && this.editDraft.location.trim().length > 0;
    }

    hasUnsavedChanges(): boolean {
        return !!this.editDraft && !!this.originalDraft && JSON.stringify(this.editDraft) !== JSON.stringify(this.originalDraft);
    }

    getUnsavedChanges(): ChangedField[] {
        if (!this.editDraft || !this.originalDraft) {
            return [];
        }

        const fields: Array<{ key: keyof PensAndPencilsRecord; label: string }> = [
            { key: 'brand', label: 'Brand' },
            { key: 'type', label: 'Type' },
            { key: 'color', label: 'Color' },
            { key: 'pointOrLead', label: 'Tip / Lead' },
            { key: 'count', label: 'Count' },
            { key: 'location', label: 'Location' },
            { key: 'comments', label: 'Comments' }
        ];

        const changes: ChangedField[] = [];
        for (const field of fields) {
            const beforeVal = this.originalDraft[field.key];
            const afterVal = this.editDraft[field.key];
            if (beforeVal !== afterVal) {
                changes.push({
                    label: field.label,
                    before: this.formatValue(beforeVal),
                    after: this.formatValue(afterVal)
                });
            }
        }

        return changes;
    }

    private resetDrafts(): void {
        this.editDraft = structuredClone(this.record);
        this.originalDraft = structuredClone(this.record);
        this.saveAttempted = false;
        this.deleteConfirmationText = '';
    }

    private async openUnsavedConfirm(): Promise<boolean> {
        if (!this.unsavedChangesModal) {
            return false;
        }

        const dialogRef = this.modalService.open(this.unsavedChangesModal, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            windowClass: 'app-confirm-modal-window'
        });

        this.modalHistory.registerModal(dialogRef);

        try {
            const result = await dialogRef.result;
            if (result === 'discard') {
                this.activeModal.dismiss('cancel');
                return true;
            }
        } catch {
            return false;
        }

        return false;
    }

    private async openDeleteConfirm(): Promise<void> {
        if (!this.deleteConfirmModal || !this.editDraft) {
            return;
        }

        const dialogRef = this.modalService.open(this.deleteConfirmModal, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            windowClass: 'app-confirm-modal-window'
        });

        this.modalHistory.registerModal(dialogRef);

        try {
            const result = await dialogRef.result;
            if (result === 'delete') {
                this.activeModal.close({ action: 'delete', record: this.editDraft } satisfies PensAndPencilsModalResult);
            }
        } catch {
            this.deleteConfirmationText = '';
        }
    }

    private formatValue(value: string | number): string {
        const text = String(value).trim();
        return text.length ? text : '(blank)';
    }
}
