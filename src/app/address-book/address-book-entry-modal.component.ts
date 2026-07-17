import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

interface ChangedField {
    label: string;
    before: string;
    after: string;
}

export interface AddressBookRecord {
    id: number;
    personName: string;
    relationship: 'Friend' | 'Relative' | 'Coworker' | 'Other';
    phone: string;
    email: string;
    birthdayDate: string;
    anniversaryDate: string;
    notes: string;
}

export interface AddressBookModalResult {
    action: 'save' | 'delete';
    record: AddressBookRecord;
}

type TrackedFieldKey = 'personName' | 'relationship' | 'phone' | 'email' | 'birthdayDate' | 'anniversaryDate' | 'notes';

@Component({
    selector: 'app-address-book-entry-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './address-book-entry-modal.component.html',
    styleUrl: './address-book-entry-modal.component.scss'
})
export class AddressBookEntryModalComponent implements OnInit {
    activeModal = inject(NgbActiveModal);
    private modalService = inject(NgbModal);

    @ViewChild('deleteConfirmModal') private deleteConfirmModal?: TemplateRef<unknown>;
    @ViewChild('unsavedChangesModal') private unsavedChangesModal?: TemplateRef<unknown>;

    @Input({ required: true }) record!: AddressBookRecord;
    @Input() allowDelete = false;

    editDraft: AddressBookRecord | null = null;
    originalDraft: AddressBookRecord | null = null;
    saveAttempted = false;

    readonly relationships: AddressBookRecord['relationship'][] = ['Friend', 'Relative', 'Coworker', 'Other'];

    ngOnInit(): void {
        this.editDraft = structuredClone(this.record);
        this.originalDraft = structuredClone(this.record);
    }

    canSave(): boolean {
        if (!this.editDraft) {
            return false;
        }

        return this.editDraft.personName.trim().length > 0
            && (this.editDraft.phone.trim().length > 0 || this.editDraft.email.trim().length > 0);
    }

    save(): void {
        this.saveAttempted = true;
        if (!this.editDraft || !this.canSave()) {
            return;
        }

        const updated: AddressBookRecord = {
            ...this.editDraft,
            personName: this.editDraft.personName.trim(),
            phone: this.editDraft.phone.trim(),
            email: this.editDraft.email.trim(),
            notes: this.editDraft.notes.trim()
        };

        this.activeModal.close({ action: 'save', record: updated } satisfies AddressBookModalResult);
    }

    async requestDelete(): Promise<void> {
        if (!this.allowDelete || !this.editDraft) {
            return;
        }

        const shouldDelete = await this.confirmDeleteWithModal();
        if (!shouldDelete) {
            return;
        }

        this.activeModal.close({ action: 'delete', record: this.editDraft } satisfies AddressBookModalResult);
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
            { key: 'personName', label: 'Person' },
            { key: 'relationship', label: 'Relationship' },
            { key: 'phone', label: 'Phone' },
            { key: 'email', label: 'Email' },
            { key: 'birthdayDate', label: 'Birthday' },
            { key: 'anniversaryDate', label: 'Anniversary' },
            { key: 'notes', label: 'Notes' }
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

    private formatChangedValue(value: string | number | null): string {
        if (value === null || value === undefined) {
            return '(blank)';
        }

        const text = String(value).trim();
        return text.length ? text : '(blank)';
    }
}
