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

export interface MedicineRecord {
    id: number;
    name: string;
    form: 'Tablet' | 'Capsule' | 'Liquid' | 'Inhaler' | 'Cream';
    strength: string;
    quantity: number;
    instructions: string;
    doctor: string;
    lastDispensed: Date;
}

export interface MedicinesModalResult {
    action: 'save' | 'delete';
    medicine: MedicineRecord;
}

type TrackedFieldKey = 'name' | 'form' | 'strength' | 'quantity' | 'instructions' | 'doctor' | 'lastDispensed';

@Component({
    selector: 'app-medicines-entry-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './medicines-entry-modal.component.html',
    styleUrl: './medicines-entry-modal.component.scss'
})
export class MedicinesEntryModalComponent implements OnInit {
    activeModal = inject(NgbActiveModal);
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);

    @ViewChild('deleteConfirmModal') private deleteConfirmModal?: TemplateRef<unknown>;
    @ViewChild('unsavedChangesModal') private unsavedChangesModal?: TemplateRef<unknown>;

    @Input({ required: true }) medicine!: MedicineRecord;
    @Input() allowDelete = false;

    editDraft: MedicineRecord | null = null;
    originalDraft: MedicineRecord | null = null;
    saveAttempted = false;
    readonly forms: MedicineRecord['form'][] = ['Tablet', 'Capsule', 'Liquid', 'Inhaler', 'Cream'];

    ngOnInit(): void {
        this.editDraft = structuredClone(this.medicine);
        this.originalDraft = structuredClone(this.medicine);
    }

    canSave(): boolean {
        if (!this.editDraft) {
            return false;
        }

        return this.editDraft.name.trim().length > 0
            && this.editDraft.strength.trim().length > 0
            && this.editDraft.quantity > 0
            && this.editDraft.instructions.trim().length > 0
            && this.editDraft.doctor.trim().length > 0
            && this.editDraft.lastDispensed != null;
    }

    save(): void {
        this.saveAttempted = true;
        if (!this.editDraft || !this.canSave()) {
            return;
        }

        const updated: MedicineRecord = {
            ...this.editDraft,
            name: this.editDraft.name.trim(),
            strength: this.editDraft.strength.trim(),
            instructions: this.editDraft.instructions.trim(),
            doctor: this.editDraft.doctor.trim(),
        };

        this.activeModal.close({ action: 'save', medicine: updated } satisfies MedicinesModalResult);
    }

    async requestDelete(): Promise<void> {
        if (!this.allowDelete || !this.editDraft) {
            return;
        }

        const shouldDelete = await this.confirmDeleteWithModal();
        if (!shouldDelete) {
            return;
        }

        this.activeModal.close({ action: 'delete', medicine: this.editDraft } satisfies MedicinesModalResult);
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
            { key: 'name', label: 'Name' },
            { key: 'form', label: 'Form' },
            { key: 'strength', label: 'Strength' },
            { key: 'quantity', label: 'Quantity' },
            { key: 'instructions', label: 'Instructions' },
            { key: 'doctor', label: 'Doctor' },
            { key: 'lastDispensed', label: 'Last Dispensed' }
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

    private formatChangedValue(value: string | number | Date): string {
        if (value instanceof Date) {
            return value.toISOString().split('T')[0];
        }
        const text = String(value).trim();
        return text.length ? text : '(blank)';
    }

    parseDate(dateString: string): Date | null {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
    }
}
