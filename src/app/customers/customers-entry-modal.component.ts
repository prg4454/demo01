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

export interface CustomerRecord {
    id: number;
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    email: string;
    status: 'Active' | 'Inactive' | 'Prospect' | 'Closed';
}

export interface CustomerModalResult {
    action: 'save' | 'delete';
    record: CustomerRecord;
}

type TrackedFieldKey = keyof Omit<CustomerRecord, 'id'>;

@Component({
    selector: 'app-customers-entry-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './customers-entry-modal.component.html',
    styleUrl: './customers-entry-modal.component.scss'
})
export class CustomerEntryModalComponent implements OnInit {
    activeModal = inject(NgbActiveModal);
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);

    @ViewChild('deleteConfirmModal') private deleteConfirmModal?: TemplateRef<unknown>;
    @ViewChild('unsavedChangesModal') private unsavedChangesModal?: TemplateRef<unknown>;

    @Input({ required: true }) record!: CustomerRecord;
    @Input() allowDelete = false;

    editDraft: CustomerRecord | null = null;
    originalDraft: CustomerRecord | null = null;
    saveAttempted = false;

    readonly statuses: CustomerRecord['status'][] = ['Active', 'Inactive', 'Prospect', 'Closed'];
    readonly states = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','IA','ID','IL','IN','KS','KY','LA','MA','MD','ME','MI','MN','MO','MS','MT','NC','ND','NE','NH','NJ','NM','NV','NY','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VA','VT','WA','WI','WV','WY'];

    ngOnInit(): void {
        this.editDraft = structuredClone(this.record);
        this.originalDraft = structuredClone(this.record);
    }

    canSave(): boolean {
        if (!this.editDraft) {
            return false;
        }

        return this.editDraft.name.trim().length > 0
            && this.editDraft.address.trim().length > 0
            && this.editDraft.city.trim().length > 0
            && this.editDraft.state.trim().length > 0
            && this.editDraft.zip.trim().length > 0
            && this.editDraft.phone.trim().length > 0
            && this.editDraft.email.trim().length > 0
            && this.editDraft.status.trim().length > 0;
    }

    save(): void {
        this.saveAttempted = true;
        if (!this.editDraft || !this.canSave()) {
            return;
        }

        const updated: CustomerRecord = {
            ...this.editDraft,
            name: this.editDraft.name.trim(),
            address: this.editDraft.address.trim(),
            city: this.editDraft.city.trim(),
            state: this.editDraft.state.trim().toUpperCase(),
            zip: this.editDraft.zip.trim(),
            phone: this.editDraft.phone.trim(),
            email: this.editDraft.email.trim(),
            status: this.editDraft.status
        };

        this.activeModal.close({ action: 'save', record: updated } satisfies CustomerModalResult);
    }

    async requestDelete(): Promise<void> {
        if (!this.allowDelete || !this.editDraft) {
            return;
        }

        const shouldDelete = await this.confirmDeleteWithModal();
        if (!shouldDelete) {
            return;
        }

        this.activeModal.close({ action: 'delete', record: this.editDraft } satisfies CustomerModalResult);
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
            { key: 'address', label: 'Address' },
            { key: 'city', label: 'City' },
            { key: 'state', label: 'State' },
            { key: 'zip', label: 'Zip' },
            { key: 'phone', label: 'Phone' },
            { key: 'email', label: 'Email' },
            { key: 'status', label: 'Status' }
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
            scrollable: true
        });
        this.modalHistory.registerModal(dialogRef);

        return dialogRef.result.then(result => result === 'discard').catch(() => false);
    }

    private formatChangedValue(value: string | number | null): string {
        if (value === null || value === undefined) {
            return '(blank)';
        }

        const text = String(value).trim();
        return text.length ? text : '(blank)';
    }
}
