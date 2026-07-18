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

export interface AutomobileRecord {
    id: number;
    make: string;
    model: string;
    year: number;
    color: string;
    vin: string;
    owner: string;
    status: 'Maintenance' | 'Ready' | 'In Use' | 'Sold';
}

export interface AutomobileModalResult {
    action: 'save' | 'delete';
    record: AutomobileRecord;
}

type TrackedFieldKey = 'make' | 'model' | 'year' | 'color' | 'vin' | 'owner' | 'status';

@Component({
    selector: 'app-automobile-entry-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './automobile-entry-modal.component.html',
    styleUrl: './automobile-entry-modal.component.scss'
})
export class AutomobileEntryModalComponent implements OnInit {
    activeModal = inject(NgbActiveModal);
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);

    @ViewChild('deleteConfirmModal') private deleteConfirmModal?: TemplateRef<unknown>;
    @ViewChild('unsavedChangesModal') private unsavedChangesModal?: TemplateRef<unknown>;

    @Input({ required: true }) record!: AutomobileRecord;
    @Input() allowDelete = false;

    editDraft: AutomobileRecord | null = null;
    originalDraft: AutomobileRecord | null = null;
    saveAttempted = false;
    readonly statuses: AutomobileRecord['status'][] = ['Maintenance', 'Ready', 'In Use', 'Sold'];

    ngOnInit(): void {
        this.editDraft = structuredClone(this.record);
        this.originalDraft = structuredClone(this.record);
    }

    canSave(): boolean {
        if (!this.editDraft) {
            return false;
        }

        return this.editDraft.make.trim().length > 0
            && this.editDraft.model.trim().length > 0
            && this.editDraft.year >= 1900
            && this.editDraft.color.trim().length > 0
            && this.editDraft.vin.trim().length > 0
            && this.editDraft.owner.trim().length > 0;
    }

    save(): void {
        this.saveAttempted = true;
        if (!this.editDraft || !this.canSave()) {
            return;
        }

        const updated: AutomobileRecord = {
            ...this.editDraft,
            make: this.editDraft.make.trim(),
            model: this.editDraft.model.trim(),
            color: this.editDraft.color.trim(),
            vin: this.editDraft.vin.trim(),
            owner: this.editDraft.owner.trim()
        };

        this.activeModal.close({ action: 'save', record: updated } satisfies AutomobileModalResult);
    }

    async requestDelete(): Promise<void> {
        if (!this.allowDelete || !this.editDraft) {
            return;
        }

        const shouldDelete = await this.confirmDeleteWithModal();
        if (!shouldDelete) {
            return;
        }

        this.activeModal.close({ action: 'delete', record: this.editDraft } satisfies AutomobileModalResult);
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
        this.activeModal.dismiss('cancel');
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
            { key: 'make', label: 'Make' },
            { key: 'model', label: 'Model' },
            { key: 'year', label: 'Year' },
            { key: 'color', label: 'Color' },
            { key: 'vin', label: 'VIN' },
            { key: 'owner', label: 'Owner' },
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
