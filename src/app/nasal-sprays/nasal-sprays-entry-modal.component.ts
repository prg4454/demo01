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

export interface NasalSprayRecord {
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

export interface NasalSpraysModalResult {
    action: 'save' | 'delete';
    spray: NasalSprayRecord;
}

type TrackedFieldKey = keyof Omit<NasalSprayRecord, 'id'>;

@Component({
    selector: 'app-nasal-sprays-entry-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './nasal-sprays-entry-modal.component.html',
    styleUrl: './nasal-sprays-entry-modal.component.scss'
})
export class NasalSpraysEntryModalComponent implements OnInit {
    activeModal = inject(NgbActiveModal);
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);

    @ViewChild('deleteConfirmModal') private deleteConfirmModal?: TemplateRef<unknown>;
    @ViewChild('unsavedChangesModal') private unsavedChangesModal?: TemplateRef<unknown>;

    @Input({ required: true }) spray!: NasalSprayRecord;
    @Input() allowDelete = false;

    editDraft: NasalSprayRecord | null = null;
    originalDraft: NasalSprayRecord | null = null;
    saveAttempted = false;

    readonly categories: NasalSprayRecord['category'][] = ['Steroid', 'Saline', 'Antihistamine', 'Decongestant'];

    ngOnInit(): void {
        this.editDraft = structuredClone(this.spray);
        this.originalDraft = structuredClone(this.spray);
    }

    canSave(): boolean {
        if (!this.editDraft) {
            return false;
        }

        return this.editDraft.brandName.trim().length > 0
            && this.editDraft.genericName.trim().length > 0
            && this.editDraft.strength.trim().length > 0
            && this.editDraft.dose.trim().length > 0
            && this.editDraft.usage.trim().length > 0
            && this.editDraft.comments.trim().length > 0
            && this.editDraft.manufacturer.trim().length > 0
            && this.editDraft.lastOpened.trim().length > 0;
    }

    save(): void {
        this.saveAttempted = true;
        if (!this.editDraft || !this.canSave()) {
            return;
        }

        const updated: NasalSprayRecord = {
            ...this.editDraft,
            brandName: this.editDraft.brandName.trim(),
            genericName: this.editDraft.genericName.trim(),
            strength: this.editDraft.strength.trim(),
            dose: this.editDraft.dose.trim(),
            usage: this.editDraft.usage.trim(),
            comments: this.editDraft.comments.trim(),
            manufacturer: this.editDraft.manufacturer.trim(),
            lastOpened: this.editDraft.lastOpened.trim()
        };

        this.activeModal.close({ action: 'save', spray: updated } satisfies NasalSpraysModalResult);
    }

    async requestDelete(): Promise<void> {
        if (!this.allowDelete || !this.editDraft) {
            return;
        }

        const shouldDelete = await this.confirmDeleteWithModal();
        if (!shouldDelete) {
            return;
        }

        this.activeModal.close({ action: 'delete', spray: this.editDraft } satisfies NasalSpraysModalResult);
    }

    async cancel(): Promise<void> {
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

    private formatChangedValue(value: string): string {
        const text = String(value ?? '').trim();
        return text.length ? text : '(blank)';
    }

    private confirmDeleteWithModal(): Promise<boolean> {
        if (!this.deleteConfirmModal) {
            return Promise.resolve(false);
        }

        const dialogRef = this.modalService.open(this.deleteConfirmModal, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            windowClass: 'app-confirm-modal-window'
        });

        this.modalHistory.registerModal(dialogRef);
        return dialogRef.result.then(result => result === 'delete').catch(() => false);
    }

    private confirmDiscardChangesWithModal(): Promise<boolean> {
        if (!this.unsavedChangesModal) {
            return Promise.resolve(false);
        }

        const dialogRef = this.modalService.open(this.unsavedChangesModal, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            scrollable: true,
            windowClass: 'app-confirm-modal-window'
        });

        this.modalHistory.registerModal(dialogRef);
        return dialogRef.result.then(result => result === 'discard').catch(() => false);
    }
}
