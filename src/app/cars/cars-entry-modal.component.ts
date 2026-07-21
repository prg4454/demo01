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

export interface CarRecord {
    id: number;
    make: string;
    model: string;
    owner: string;
    service: string;
    checkIn: string;
    status: 'Waiting' | 'In Service' | 'Parts Hold' | 'Ready';
    advisor: string;
}

export interface CarsModalResult {
    action: 'save' | 'delete';
    car: CarRecord;
}

type TrackedFieldKey = 'make' | 'model' | 'owner' | 'service' | 'checkIn' | 'status' | 'advisor';

@Component({
    selector: 'app-cars-entry-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './cars-entry-modal.component.html',
    styleUrl: './cars-entry-modal.component.scss'
})
export class CarsEntryModalComponent implements OnInit {
    activeModal = inject(NgbActiveModal);
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);

    @ViewChild('deleteConfirmModal') private deleteConfirmModal?: TemplateRef<unknown>;
    @ViewChild('unsavedChangesModal') private unsavedChangesModal?: TemplateRef<unknown>;

    @Input({ required: true }) car!: CarRecord;
    @Input() allowDelete = false;

    editDraft: CarRecord | null = null;
    originalDraft: CarRecord | null = null;
    saveAttempted = false;
    readonly statuses: CarRecord['status'][] = ['Waiting', 'In Service', 'Parts Hold', 'Ready'];

    ngOnInit(): void {
        this.editDraft = structuredClone(this.car);
        this.originalDraft = structuredClone(this.car);
    }

    canSave(): boolean {
        if (!this.editDraft) {
            return false;
        }

        return this.editDraft.make.trim().length > 0
            && this.editDraft.model.trim().length > 0
            && this.editDraft.owner.trim().length > 0
            && this.editDraft.service.trim().length > 0
            && this.editDraft.checkIn.trim().length > 0
            && this.editDraft.advisor.trim().length > 0;
    }

    save(): void {
        this.saveAttempted = true;
        if (!this.editDraft || !this.canSave()) {
            return;
        }

        const updated: CarRecord = {
            ...this.editDraft,
            make: this.editDraft.make.trim(),
            model: this.editDraft.model.trim(),
            owner: this.editDraft.owner.trim(),
            service: this.editDraft.service.trim(),
            checkIn: this.editDraft.checkIn.trim(),
            advisor: this.editDraft.advisor.trim()
        };

        this.activeModal.close({ action: 'save', car: updated } satisfies CarsModalResult);
    }

    async requestDelete(): Promise<void> {
        if (!this.allowDelete || !this.editDraft) {
            return;
        }

        const shouldDelete = await this.confirmDeleteWithModal();
        if (!shouldDelete) {
            return;
        }

        this.activeModal.close({ action: 'delete', car: this.editDraft } satisfies CarsModalResult);
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
            { key: 'make', label: 'Make' },
            { key: 'model', label: 'Model' },
            { key: 'owner', label: 'Owner' },
            { key: 'service', label: 'Service' },
            { key: 'checkIn', label: 'Check-In' },
            { key: 'status', label: 'Status' },
            { key: 'advisor', label: 'Advisor' }
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