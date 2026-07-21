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

export interface FriendRecord {
    id: number;
    name: string;
    city: string;
    hobby: string;
    status: 'Best Friend' | 'Close Friend' | 'Friend' | 'New Friend';
    birthday: string;
    yearsKnown: number;
}

export interface FriendsModalResult {
    action: 'save' | 'delete';
    friend: FriendRecord;
}

type TrackedFieldKey = 'name' | 'city' | 'hobby' | 'status' | 'birthday' | 'yearsKnown';

@Component({
    selector: 'app-friends-entry-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './friends-entry-modal.component.html',
    styleUrl: './friends-entry-modal.component.scss'
})
export class FriendsEntryModalComponent implements OnInit {
    activeModal = inject(NgbActiveModal);
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);

    @ViewChild('deleteConfirmModal') private deleteConfirmModal?: TemplateRef<unknown>;
    @ViewChild('unsavedChangesModal') private unsavedChangesModal?: TemplateRef<unknown>;

    @Input({ required: true }) friend!: FriendRecord;
    @Input() allowDelete = false;

    editDraft: FriendRecord | null = null;
    originalDraft: FriendRecord | null = null;
    saveAttempted = false;
    readonly statuses: FriendRecord['status'][] = ['Best Friend', 'Close Friend', 'Friend', 'New Friend'];

    ngOnInit(): void {
        this.editDraft = structuredClone(this.friend);
        this.originalDraft = structuredClone(this.friend);
    }

    canSave(): boolean {
        if (!this.editDraft) {
            return false;
        }

        return this.editDraft.name.trim().length > 0
            && this.editDraft.city.trim().length > 0
            && this.editDraft.hobby.trim().length > 0
            && this.editDraft.birthday.trim().length > 0
            && Number.isFinite(this.editDraft.yearsKnown)
            && this.editDraft.yearsKnown >= 0;
    }

    save(): void {
        this.saveAttempted = true;
        if (!this.editDraft || !this.canSave()) {
            return;
        }

        const updated: FriendRecord = {
            ...this.editDraft,
            name: this.editDraft.name.trim(),
            city: this.editDraft.city.trim(),
            hobby: this.editDraft.hobby.trim(),
            birthday: this.editDraft.birthday.trim(),
            yearsKnown: Number(this.editDraft.yearsKnown)
        };

        this.activeModal.close({ action: 'save', friend: updated } satisfies FriendsModalResult);
    }

    async requestDelete(): Promise<void> {
        if (!this.allowDelete || !this.editDraft) {
            return;
        }

        const shouldDelete = await this.confirmDeleteWithModal();
        if (!shouldDelete) {
            return;
        }

        this.activeModal.close({ action: 'delete', friend: this.editDraft } satisfies FriendsModalResult);
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
            { key: 'city', label: 'City' },
            { key: 'hobby', label: 'Hobby' },
            { key: 'status', label: 'Status' },
            { key: 'birthday', label: 'Birthday' },
            { key: 'yearsKnown', label: 'Years Known' }
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

    private formatChangedValue(value: string | number): string {
        const text = String(value).trim();
        return text.length ? text : '(blank)';
    }
}
