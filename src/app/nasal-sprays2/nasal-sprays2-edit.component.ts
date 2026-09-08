import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalHistoryService } from '../modal-history.service';

export interface NasalSpray2Record {
    id: number;
    brandName: string;
    genericName: string;
    strength: string;
    category: 'Steroid' | 'Saline' | 'Antihistamine' | 'Decongestant';
    dose: string;
    usage: string;
    comments: string;
    manufacturer: string;
    lastOpened: string;
}

export interface NasalSprays2EditResult {
    action: 'save' | 'delete';
    spray: NasalSpray2Record;
}

export interface ChangedField {
    label: string;
    before: string;
    after: string;
}

type TrackedFieldKey = keyof Omit<NasalSpray2Record, 'id'>;

@Component({
    selector: 'app-nasal-sprays2-edit',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './nasal-sprays2-edit.component.html',
    styleUrl: './nasal-sprays2-edit.component.scss'
})
export class NasalSprays2EditComponent implements OnInit {
    activeModal = inject(NgbActiveModal);
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);

    @ViewChild('deleteConfirmModal') private deleteConfirmModal?: TemplateRef<unknown>;
    @ViewChild('unsavedChangesModal') private unsavedChangesModal?: TemplateRef<unknown>;

    @Input({ required: true }) spray!: NasalSpray2Record;
    @Input() allowDelete = false;

    editDraft: NasalSpray2Record | null = null;
    originalDraft: NasalSpray2Record | null = null;
    saveAttempted = false;

    readonly categories: NasalSpray2Record['category'][] = ['Steroid', 'Saline', 'Antihistamine', 'Decongestant'];

    ngOnInit(): void {
        this.editDraft = structuredClone(this.spray);
        this.originalDraft = structuredClone(this.spray);
    }

    canSave(): boolean {
        if (!this.editDraft) {
            return false;
        }

        return (this.editDraft.brandName ?? '').trim().length > 0
            && (this.editDraft.genericName ?? '').trim().length > 0
            && (this.editDraft.strength ?? '').trim().length > 0
            && (this.editDraft.dose ?? '').trim().length > 0
            && (this.editDraft.usage ?? '').trim().length > 0;
    }

    save(): void {
        this.saveAttempted = true;
        if (!this.editDraft || !this.canSave()) {
            return;
        }

        const updated: NasalSpray2Record = {
            ...this.editDraft,
            brandName: this.editDraft.brandName.trim(),
            genericName: this.editDraft.genericName.trim(),
            strength: this.editDraft.strength.trim(),
            dose: this.editDraft.dose.trim(),
            usage: this.editDraft.usage.trim(),
            comments: (this.editDraft.comments ?? '').trim(),
            manufacturer: (this.editDraft.manufacturer ?? '').trim(),
            lastOpened: (this.editDraft.lastOpened ?? '').trim()
        };

        this.activeModal.close({ action: 'save', spray: updated } satisfies NasalSprays2EditResult);
    }

    async requestDelete(): Promise<void> {
        if (!this.allowDelete || !this.editDraft) {
            return;
        }

        const shouldDelete = await this.confirmDeleteWithModal();
        if (!shouldDelete) {
            return;
        }

        this.activeModal.close({ action: 'delete', spray: this.editDraft } satisfies NasalSprays2EditResult);
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
            { key: 'brandName', label: 'Brand Name' },
            { key: 'genericName', label: 'Generic Name' },
            { key: 'strength', label: 'Strength' },
            { key: 'category', label: 'Category' },
            { key: 'dose', label: 'Dose' },
            { key: 'usage', label: 'Usage' },
            { key: 'comments', label: 'Comments' },
            { key: 'manufacturer', label: 'Manufacturer' },
            { key: 'lastOpened', label: 'Last Opened' }
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

    private formatChangedValue(value: string | undefined): string {
        const text = String(value ?? '').trim();
        return text.length ? text : '(blank)';
    }
}
