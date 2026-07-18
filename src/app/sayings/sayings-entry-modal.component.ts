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

export interface SillySaying {
    id: number;
    text: string;
    category: string;
    vibe: string;
    wordCount: number | null;
    laughLevel: number | null;
    origin: string;
    lastHeard: string;
}

export interface SayingsModalResult {
    action: 'save' | 'delete';
    saying: SillySaying;
}

type TrackedFieldKey = 'text' | 'category' | 'vibe' | 'wordCount' | 'laughLevel' | 'origin' | 'lastHeard';

@Component({
    selector: 'app-sayings-entry-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './sayings-entry-modal.component.html',
    styleUrl: './sayings-entry-modal.component.scss'
})
export class SayingsEntryModalComponent implements OnInit {
    activeModal = inject(NgbActiveModal);
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);

    @ViewChild('deleteConfirmModal') private deleteConfirmModal?: TemplateRef<unknown>;
    @ViewChild('unsavedChangesModal') private unsavedChangesModal?: TemplateRef<unknown>;

    @Input({ required: true }) saying!: SillySaying;
    @Input() allowDelete = false;

    editDraft: SillySaying | null = null;
    originalDraft: SillySaying | null = null;
    saveAttempted = false;

    ngOnInit(): void {
        this.editDraft = structuredClone(this.saying);
        this.originalDraft = structuredClone(this.saying);
    }

    canSave(): boolean {
        if (!this.editDraft) {
            return false;
        }

        return this.editDraft.text.trim().length > 0
            && this.editDraft.category.trim().length > 0
            && this.editDraft.vibe.trim().length > 0
            && this.editDraft.origin.trim().length > 0;
    }

    save(): void {
        this.saveAttempted = true;
        if (!this.editDraft || !this.canSave()) {
            return;
        }

        const updated: SillySaying = {
            ...this.editDraft,
            text: this.editDraft.text.trim(),
            category: this.editDraft.category.trim(),
            vibe: this.editDraft.vibe.trim(),
            origin: this.editDraft.origin.trim()
        };

        this.activeModal.close({ action: 'save', saying: updated } satisfies SayingsModalResult);
    }

    async requestDelete(): Promise<void> {
        if (!this.allowDelete || !this.editDraft) {
            return;
        }

        const shouldDelete = await this.confirmDeleteWithModal();
        if (!shouldDelete) {
            return;
        }

        this.activeModal.close({ action: 'delete', saying: this.editDraft } satisfies SayingsModalResult);
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
            { key: 'text', label: 'Saying' },
            { key: 'category', label: 'Category' },
            { key: 'vibe', label: 'Vibe' },
            { key: 'wordCount', label: 'Word Count' },
            { key: 'laughLevel', label: 'Laugh Level' },
            { key: 'origin', label: 'Origin' },
            { key: 'lastHeard', label: 'Last Heard' }
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

    private formatChangedValue(value: string | number | null): string {
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
            scrollable: true,
            windowClass: 'app-confirm-modal-window'
        });

        this.modalHistory.registerModal(dialogRef);

        return dialogRef.result
            .then(result => result === 'discard')
            .catch(() => false);
    }
}
